const fs = require('fs');
const Document = require('../models/Document');
const DocumentChunk = require('../models/DocumentChunk');
const ingestionService = require('./ingestionService');
const embeddingService = require('./embeddingService');
const vectorStore = require('../config/vectorStore');

class DocumentService {
  /**
   * Process an uploaded file: extracts text, creates chunks, computes embeddings, and stores vectors
   */
  async processDocumentUpload({ file, title, category, department, userId }) {
    // 1. Create initial Document entry with 'uploaded' status
    const docTitle = title || file.originalname.replace(/\.[^/.]+$/, '');
    const document = new Document({
      title: docTitle,
      originalName: file.originalname,
      fileName: file.filename,
      fileSize: file.size,
      mimeType: file.mimetype,
      filePath: file.path,
      uploader: userId,
      category: category || 'General',
      department: department || 'All',
      status: 'processing',
    });

    await document.save();

    // Run processing asynchronously to not block the immediate response
    this.indexDocument(document._id).catch((err) => {
      console.error(`[DocumentService] Async indexing error for ${document._id}:`, err);
    });

    return document;
  }

  /**
   * Ingest, chunk, embed, and store vectors for a document
   */
  async indexDocument(documentId) {
    const document = await Document.findById(documentId);
    if (!document) throw new Error('Document not found');

    try {
      document.status = 'processing';
      document.errorMessage = null;
      await document.save();

      // 1. Extract text and page breakdown
      const extracted = await ingestionService.extractText(document.filePath, document.mimeType);

      if (!extracted.fullText || extracted.fullText.length < 20) {
        throw new Error('Extracted text is empty or too short to index.');
      }

      // 2. Chunk document
      const rawChunks = ingestionService.chunkDocument(extracted);
      if (rawChunks.length === 0) {
        throw new Error('Could not generate text chunks from the document.');
      }

      // 3. Clear existing vectors/chunks for this document if re-indexing
      await vectorStore.deleteVectors(document._id);

      // 4. Generate embeddings for all chunks
      const chunkTexts = rawChunks.map((c) => c.text);
      const embeddings = await embeddingService.generateBatchEmbeddings(chunkTexts);

      // 5. Prepare vector items
      const vectorPayloads = rawChunks.map((chunk, idx) => ({
        documentId: document._id,
        chunkIndex: chunk.chunkIndex,
        text: chunk.text,
        pageNumber: chunk.pageNumber,
        tokenCount: chunk.tokenCount,
        vector: embeddings[idx],
        metadata: {
          documentTitle: document.title,
          originalName: document.originalName,
          category: document.category,
          department: document.department,
          pageNumber: chunk.pageNumber,
          chunkIndex: chunk.chunkIndex,
          uploadedAt: document.createdAt,
        },
      }));

      // 6. Upsert vectors into vector store
      await vectorStore.upsertVectors(vectorPayloads);

      // 7. Update document status to indexed
      document.status = 'indexed';
      document.chunkCount = rawChunks.length;
      document.lastIndexedAt = new Date();
      await document.save();

      console.log(
        `[DocumentService] Successfully indexed document "${document.title}" (${rawChunks.length} chunks)`
      );
      return document;
    } catch (error) {
      console.error(`[DocumentService] Indexing failed for document ${documentId}:`, error);
      document.status = 'failed';
      document.errorMessage = error.message;
      await document.save();
      throw error;
    }
  }

  /**
   * List documents with optional category filter, status, search, and pagination
   */
  async listDocuments({ page = 1, limit = 20, category, status, search }) {
    const filter = {};
    if (category && category !== 'All') filter.category = category;
    if (status && status !== 'All') filter.status = status;
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { originalName: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;
    const [documents, total] = await Promise.all([
      Document.find(filter)
        .populate('uploader', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Document.countDocuments(filter),
    ]);

    return {
      documents,
      pagination: {
        total,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        pages: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * Get single document details including chunk previews
   */
  async getDocumentById(documentId) {
    const document = await Document.findById(documentId).populate('uploader', 'name email');
    if (!document) {
      const err = new Error('Document not found');
      err.statusCode = 404;
      throw err;
    }

    const chunks = await DocumentChunk.find({ documentId })
      .select('-vector') // omit heavy vector array
      .sort({ chunkIndex: 1 })
      .lean();

    return {
      document,
      chunks,
    };
  }

  /**
   * Re-index an existing document
   */
  async reindexDocument(documentId) {
    const document = await Document.findById(documentId);
    if (!document) {
      const err = new Error('Document not found');
      err.statusCode = 404;
      throw err;
    }

    if (!fs.existsSync(document.filePath)) {
      const err = new Error('Physical source file no longer exists on server.');
      err.statusCode = 404;
      throw err;
    }

    return this.indexDocument(documentId);
  }

  /**
   * Delete a document, its physical file, its chunks, and vector store entries
   */
  async deleteDocument(documentId) {
    const document = await Document.findById(documentId);
    if (!document) {
      const err = new Error('Document not found');
      err.statusCode = 404;
      throw err;
    }

    // 1. Delete physical file if exists
    if (fs.existsSync(document.filePath)) {
      try {
        fs.unlinkSync(document.filePath);
      } catch (err) {
        console.warn(`[DocumentService] Could not remove file ${document.filePath}:`, err.message);
      }
    }

    // 2. Delete vectors & chunks via vector store
    await vectorStore.deleteVectors(documentId);

    // 3. Delete Document record
    await Document.findByIdAndDelete(documentId);

    return { message: 'Document and its vector embeddings deleted successfully' };
  }

  /**
   * Get metrics for admin dashboard
   */
  async getDashboardMetrics() {
    const [totalDocs, indexedDocs, processingDocs, failedDocs, totalChunks, categoriesBreakdown] =
      await Promise.all([
        Document.countDocuments(),
        Document.countDocuments({ status: 'indexed' }),
        Document.countDocuments({ status: 'processing' }),
        Document.countDocuments({ status: 'failed' }),
        DocumentChunk.countDocuments(),
        Document.aggregate([
          { $group: { _id: '$category', count: { $sum: 1 }, chunks: { $sum: '$chunkCount' } } },
          { $sort: { count: -1 } },
        ]),
      ]);

    const recentDocs = await Document.find()
      .populate('uploader', 'name email')
      .sort({ createdAt: -1 })
      .limit(6)
      .lean();

    return {
      totalDocs,
      indexedDocs,
      processingDocs,
      failedDocs,
      totalChunks,
      categoriesBreakdown,
      recentDocs,
    };
  }
}

module.exports = new DocumentService();
