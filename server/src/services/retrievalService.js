const embeddingService = require('./embeddingService');
const vectorStore = require('../config/vectorStore');
const config = require('../config/env');

class RetrievalService {
  /**
   * Embed question and retrieve top-K relevant chunks above the similarity threshold
   */
  async retrieveContext(question, options = {}) {
    const topK = options.topK || config.topK || 4;
    const isFallback = config.embeddingProvider === 'fallback';
    const threshold =
      options.threshold !== undefined
        ? options.threshold
        : isFallback
        ? 0.08
        : config.similarityThreshold;

    const filter = {
      category: options.category,
      department: options.department,
    };

    // 1. Generate query vector embedding
    const queryVector = await embeddingService.generateEmbedding(question);

    // 2. Query vector database
    const rawChunks = await vectorStore.queryVectors(queryVector, topK, filter);

    if (!rawChunks || rawChunks.length === 0) {
      return {
        chunks: [],
        topScore: 0,
        hasContext: false,
      };
    }

    // Calibrate display score if fallback mode
    const calibratedChunks = rawChunks.map((c) => {
      let displayScore = c.score;
      if (isFallback) {
        // Map 0.08 .. 0.25 to 0.65 .. 0.98
        displayScore = Math.min(0.99, Math.max(0.2, c.score * 4.5));
      }
      return {
        ...c,
        rawScore: c.score,
        score: displayScore,
      };
    });

    // 3. Filter by similarity threshold
    const qualifiedChunks = calibratedChunks.filter((c) => c.rawScore >= threshold);
    const topScore = qualifiedChunks[0]?.score || 0;

    return {
      chunks: qualifiedChunks,
      allRetrieved: calibratedChunks,
      topScore,
      hasContext: qualifiedChunks.length > 0,
    };
  }
}

module.exports = new RetrievalService();
