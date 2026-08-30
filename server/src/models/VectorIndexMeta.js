const mongoose = require('mongoose');

const vectorIndexMetaSchema = new mongoose.Schema(
  {
    indexName: {
      type: String,
      required: true,
      unique: true,
    },
    provider: {
      type: String,
      required: true,
      default: 'mongodb_cosine',
    },
    embeddingModel: {
      type: String,
      default: 'text-embedding-004',
    },
    dimension: {
      type: Number,
      default: 768,
    },
    totalVectors: {
      type: Number,
      default: 0,
    },
    lastSyncTimestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('VectorIndexMeta', vectorIndexMetaSchema);
