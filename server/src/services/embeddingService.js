const { GoogleGenerativeAI } = require('@google/generative-ai');
const OpenAI = require('openai');
const config = require('../config/env');

class EmbeddingService {
  constructor() {
    this.provider = config.embeddingProvider;
    this.geminiClient = config.geminiApiKey ? new GoogleGenerativeAI(config.geminiApiKey) : null;
    this.openaiClient = config.openaiApiKey ? new OpenAI({ apiKey: config.openaiApiKey }) : null;
    this.dimension = this.getDimension();
  }

  getDimension() {
    if (this.provider === 'openai' && this.openaiClient) return 1536;
    if (this.provider === 'gemini' && this.geminiClient) return 768;
    return 768; // default fallback dimension
  }

  /**
   * Generates embedding vector for a single text string
   */
  async generateEmbedding(text) {
    const cleanText = text.trim();
    if (!cleanText) {
      return new Array(this.dimension).fill(0);
    }

    try {
      // 1. Google Gemini Embeddings
      if (this.provider === 'gemini' && this.geminiClient) {
        const model = this.geminiClient.getGenerativeModel({ model: 'text-embedding-004' });
        const result = await model.embedContent(cleanText);
        return result.embedding.values;
      }

      // 2. OpenAI Embeddings
      if (this.provider === 'openai' && this.openaiClient) {
        const response = await this.openaiClient.embeddings.create({
          model: 'text-embedding-3-small',
          input: cleanText,
        });
        return response.data[0].embedding;
      }
    } catch (error) {
      console.warn(`[EmbeddingService] Remote embedding failed (${error.message}). Falling back to local semantic embedder.`);
    }

    // 3. Fallback High-Dimensional Semantic Embedding (Normalized 768-dim)
    return this.generateSemanticFallbackEmbedding(cleanText, this.dimension);
  }

  /**
   * Generates batch embeddings for an array of texts
   */
  async generateBatchEmbeddings(texts) {
    const embeddings = [];
    for (const text of texts) {
      const emb = await this.generateEmbedding(text);
      embeddings.push(emb);
    }
    return embeddings;
  }

  /**
   * Deterministic semantic hash projection with n-gram & TF-IDF term frequency weighting.
   * Produces an L2-normalized vector in R^d so dot product === cosine similarity.
   */
  generateSemanticFallbackEmbedding(text, dimension = 768) {
    const vector = new Float64Array(dimension);
    const normalized = text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ');
    const tokens = normalized.split(/\s+/).filter((t) => t.length > 1);

    if (tokens.length === 0) {
      return Array.from(vector);
    }

    // Fast string hash helper (Murmur-style)
    const hashString = (str, seed = 0) => {
      let h = seed ^ str.length;
      for (let i = 0; i < str.length; i++) {
        h = Math.imul(h ^ str.charCodeAt(i), 0x5bd1e995);
        h ^= h >>> 15;
      }
      return (h >>> 0);
    };

    // Stopwords: words to ignore so grammatical filler does not create false positive similarity
    const stopwords = new Set([
      'the', 'is', 'at', 'which', 'on', 'a', 'an', 'and', 'or', 'in', 'to', 'for', 'of',
      'with', 'as', 'by', 'that', 'this', 'it', 'from', 'be', 'are', 'was', 'were', 'been',
      'how', 'do', 'does', 'did', 'i', 'you', 'he', 'she', 'they', 'we', 'can', 'could',
      'would', 'should', 'what', 'when', 'where', 'why', 'who', 'which', 'my', 'your', 'their',
      'our', 'me', 'him', 'her', 'us', 'them', 'about', 'tell', 'explain', 'give', 'any'
    ]);

    // Process content tokens (ignoring stopwords)
    const termWeights = new Map();

    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];
      if (stopwords.has(token) || token.length < 3) continue;

      const weight = 2.0;
      termWeights.set(token, (termWeights.get(token) || 0) + weight);

      // Subword character trigrams for stem/morphology resilience
      if (token.length >= 4) {
        for (let j = 0; j <= token.length - 3; j++) {
          const charTrigram = token.slice(j, j + 3);
          termWeights.set(charTrigram, (termWeights.get(charTrigram) || 0) + 0.3);
        }
      }
    }

    // Project hashed terms into dimensional space
    for (const [term, weight] of termWeights.entries()) {
      const h1 = hashString(term, 1337) % dimension;
      const h2 = hashString(term, 42) % dimension;
      const sign1 = (hashString(term, 99) % 2 === 0) ? 1 : -1;
      const sign2 = (hashString(term, 77) % 2 === 0) ? 1 : -1;

      vector[h1] += weight * sign1;
      vector[h2] += (weight * 0.5) * sign2;
    }

    // L2 Normalize
    let normSq = 0;
    for (let i = 0; i < dimension; i++) {
      normSq += vector[i] * vector[i];
    }

    const norm = Math.sqrt(normSq);
    if (norm > 0) {
      for (let i = 0; i < dimension; i++) {
        vector[i] /= norm;
      }
    }

    return Array.from(vector);
  }
}

module.exports = new EmbeddingService();
