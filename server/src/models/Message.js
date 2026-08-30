const mongoose = require('mongoose');

const sourceReferenceSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['document_chunk', 'database_record'],
      default: 'document_chunk',
    },
    documentId: {
      type: mongoose.Schema.Types.Mixed,
    },
    chunkId: {
      type: mongoose.Schema.Types.Mixed,
    },
    documentTitle: {
      type: String,
      default: 'College Document',
    },
    originalName: {
      type: String,
      default: '',
    },
    category: {
      type: String,
      default: 'General',
    },
    pageNumber: {
      type: Number,
      default: 1,
    },
    sectionTitle: {
      type: String,
      default: '',
    },
    excerpt: {
      type: String,
      required: true,
    },
    similarityScore: {
      type: Number,
      default: 0,
    },
  },
  { _id: false }
);

const messageSchema = new mongoose.Schema(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true,
      index: true,
    },
    sender: {
      type: String,
      enum: ['user', 'assistant', 'system'],
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    sources: [sourceReferenceSchema],
    similarityScores: [Number],
    foundAnswer: {
      type: Boolean,
      default: true,
    },
    latencyMs: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

messageSchema.index({ conversationId: 1, createdAt: 1 });

module.exports = mongoose.model('Message', messageSchema);
