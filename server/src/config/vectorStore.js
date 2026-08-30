const Document = require('../models/Document');
const DocumentChunk = require('../models/DocumentChunk');
const VectorIndexMeta = require('../models/VectorIndexMeta');

/**
 * Common VectorStore interface.
 * Implements Cosine Similarity vector operations directly on MongoDB DocumentChunks,
 * while allowing other providers (Pinecone, Chroma, Qdrant) to be plugged in seamlessly.
 */
class MongoVectorStore {
  constructor() {
    this.name = 'CampusRAG-MongoDB-CosineStore';
    this.initialized = false;
  }

  async init() {
    if (this.initialized) return;

    try {
      const meta = await VectorIndexMeta.findOneAndUpdate(
        { indexName: this.name },
        {
          $setOnInsert: {
            indexName: this.name,
            provider: 'mongodb_cosine',
            embeddingModel: 'text-embedding-004',
            dimension: 768,
            totalVectors: 0,
            lastSyncTimestamp: new Date(),
          },
        },
        { upsert: true, new: true }
      );
      this.initialized = true;
      return meta;
    } catch (err) {
      this.initialized = true;
      return await VectorIndexMeta.findOne({ indexName: this.name });
    }
  }

  /**
   * Compute cosine similarity between two unit vectors (dot product)
   * If not normalized, computes full dotProduct / (normA * normB)
   */
  cosineSimilarity(vecA, vecB) {
    if (!vecA || !vecB || vecA.length !== vecB.length) return 0;

    let dot = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vecA.length; i++) {
      dot += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }

    if (normA === 0 || normB === 0) return 0;
    return dot / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  /**
   * Upsert vectors into DocumentChunk storage
   * @param {Array<{ id, documentId, chunkIndex, text, pageNumber, vector, metadata }>} vectors
   */
  async upsertVectors(vectors) {
    await this.init();

    const ops = vectors.map((item) => ({
      updateOne: {
        filter: { documentId: item.documentId, chunkIndex: item.chunkIndex },
        update: {
          $set: {
            documentId: item.documentId,
            chunkIndex: item.chunkIndex,
            text: item.text,
            pageNumber: item.pageNumber || 1,
            tokenCount: item.tokenCount || Math.ceil(item.text.length / 4),
            vectorId: `${item.documentId}_${item.chunkIndex}`,
            vector: item.vector,
            metadata: item.metadata || {},
          },
        },
        upsert: true,
      },
    }));

    if (ops.length > 0) {
      await DocumentChunk.bulkWrite(ops);
    }

    const total = await DocumentChunk.countDocuments();
    await VectorIndexMeta.findOneAndUpdate(
      { indexName: this.name },
      { totalVectors: total, lastSyncTimestamp: new Date() }
    );

    return { upsertedCount: vectors.length, totalVectors: total };
  }

  /**
   * Query top-K vectors matching queryVector
   * @param {Array<Number>} queryVector
   * @param {Number} topK
   * @param {Object} filter (e.g. { category, department })
   */
  async queryVectors(queryVector, topK = 4, filter = {}) {
    await this.init();

    const queryFilter = {};
    if (filter.category && filter.category !== 'All') {
      queryFilter['metadata.category'] = filter.category;
    }
    if (filter.department && filter.department !== 'All') {
      queryFilter['metadata.department'] = filter.department;
    }
    if (filter.documentId) {
      queryFilter.documentId = filter.documentId;
    }

    // Select chunks including the vector field
    const candidates = await DocumentChunk.find(queryFilter)
      .select('+vector documentId chunkIndex text pageNumber sectionTitle metadata')
      .populate('documentId', 'title originalName category status')
      .lean();

    const scored = [];
    for (const chunk of candidates) {
      if (!chunk.vector || chunk.vector.length === 0) continue;

      const score = this.cosineSimilarity(queryVector, chunk.vector);
      scored.push({
        chunkId: chunk._id,
        documentId: chunk.documentId?._id || chunk.documentId,
        documentTitle: chunk.documentId?.title || chunk.metadata?.documentTitle || 'College Document',
        originalName: chunk.documentId?.originalName || chunk.metadata?.originalName || '',
        category: chunk.documentId?.category || chunk.metadata?.category || 'General',
        pageNumber: chunk.pageNumber || 1,
        sectionTitle: chunk.sectionTitle || '',
        text: chunk.text,
        score: Math.max(0, Math.min(1, score)), // normalize to 0..1 range
        metadata: chunk.metadata,
      });
    }

    // Sort descending by similarity score
    scored.sort((a, b) => b.score - a.score);

    return scored.slice(0, topK);
  }

  /**
   * Remove all vectors associated with a document
   */
  async deleteVectors(documentId) {
    await this.init();
    const res = await DocumentChunk.deleteMany({ documentId });

    const total = await DocumentChunk.countDocuments();
    await VectorIndexMeta.findOneAndUpdate(
      { indexName: this.name },
      { totalVectors: total, lastSyncTimestamp: new Date() }
    );

    return { deletedCount: res.deletedCount, totalVectors: total };
  }

  async stats() {
    await this.init();
    const meta = await VectorIndexMeta.findOne({ indexName: this.name });
    const total = await DocumentChunk.countDocuments();
    return {
      name: this.name,
      totalVectors: total,
      dimension: meta?.dimension || 768,
      lastSyncTimestamp: meta?.lastSyncTimestamp,
    };
  }
}

module.exports = new MongoVectorStore();
