const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  mongodbUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/campusrag',
  jwtSecret: process.env.JWT_SECRET || 'campusrag_dev_jwt_secret_change_in_production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  nodeEnv: process.env.NODE_ENV || 'development',
  embeddingProvider: process.env.EMBEDDING_PROVIDER || 'fallback',
  llmProvider: process.env.LLM_PROVIDER || 'fallback',
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  openaiApiKey: process.env.OPENAI_API_KEY || '',
  similarityThreshold: parseFloat(process.env.SIMILARITY_THRESHOLD || '0.55'),
  topK: parseInt(process.env.TOP_K || '4', 10),
};

module.exports = config;
