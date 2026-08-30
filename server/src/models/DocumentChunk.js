const mongoose = require('mongoose');

const documentChunkSchema = new mongoose.Schema(
  {
    documentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Document',
      required: true,
      index: true,
    },
    chunkIndex: {
      type: Number,
      required: true,
    },
    text: {
      type: String,
      required: true,
    },
    tokenCount: {
      type: Number,
      default: 0,
    },
    pageNumber: {
      type: Number,
      default: 1,
    },
    sectionTitle: {
      type: String,
      default: '',
    },
    vectorId: {
      type: String,
      index: true,
    },
    vector: {
      type: [Number],
      default: [],
      select: false, // Don't load high-dimensional array unless explicitly requested for search
    },
    metadata: {
      documentTitle: String,
      originalName: String,
      category: String,
      department: String,
      pageNumber: Number,
      chunkIndex: Number,
      uploadedAt: Date,
    },
  },
  {
    timestamps: true,
  }
);

documentChunkSchema.index({ documentId: 1, chunkIndex: 1 });

module.exports = mongoose.model('DocumentChunk', documentChunkSchema);
