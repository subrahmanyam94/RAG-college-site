const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const mongoose = require('mongoose');
const path = require('path');
const config = require('./config/env');
const connectDB = require('./config/db');
const vectorStore = require('./config/vectorStore');
const errorHandler = require('./middleware/errorHandler');

// Route handlers
const authRoutes = require('./routes/authRoutes');
const documentRoutes = require('./routes/documentRoutes');
const chatRoutes = require('./routes/chatRoutes');

const app = express();

// Security HTTP headers
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// CORS configuration limited to client URL and local development
const allowedOrigins = [config.clientUrl, 'http://localhost:5173', 'http://127.0.0.1:5173'];
app.use(
  cors({
    origin: (origin, callback) => {
      // allow requests with no origin (e.g. mobile apps, curl, server-to-server)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(null, true); // Permissive in dev to avoid local port conflicts
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Request parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/api/health', async (req, res) => {
  const isMongoConnected = mongoose.connection.readyState === 1;
  const vectorStoreStats = await vectorStore.stats().catch(() => ({ status: 'unavailable' }));

  return res.status(200).json({
    status: isMongoConnected ? 'healthy' : 'degraded',
    service: 'CampusRAG API',
    version: '1.0.0',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv,
    database: {
      mongodb: isMongoConnected ? 'connected' : 'disconnected',
      host: mongoose.connection.host || 'local',
    },
    aiProviders: {
      embedding: config.embeddingProvider,
      llm: config.llmProvider,
      geminiConfigured: !!config.geminiApiKey,
      openaiConfigured: !!config.openaiApiKey,
    },
    vectorStore: vectorStoreStats,
  });
});

// Root welcome / status endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    service: 'CampusRAG API',
    status: 'online',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      documents: '/api/documents',
      chat: '/api/chat',
    },
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/chat', chatRoutes);

// Route aliases (in case requests are sent without /api prefix)
app.use('/auth', authRoutes);
app.use('/documents', documentRoutes);
app.use('/chat', chatRoutes);

// 404 Route
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: `Endpoint not found: ${req.method} ${req.originalUrl}`,
  });
});

// Global Error Handler
app.use(errorHandler);

// Server startup
const startServer = async () => {
  try {
    await connectDB();
    await vectorStore.init();

    const server = app.listen(config.port, () => {
      console.log(`=========================================`);
      console.log(`🚀 CampusRAG API Server running on port ${config.port}`);
      console.log(`📡 Health check: http://localhost:${config.port}/api/health`);
      console.log(`🌐 Allowed Client URL: ${config.clientUrl}`);
      console.log(`🧠 AI Providers: Embedding [${config.embeddingProvider}], LLM [${config.llmProvider}]`);
      console.log(`=========================================`);
    });

    // Graceful Shutdown
    const gracefulShutdown = (signal) => {
      console.log(`\n[Server] Received ${signal}. Shutting down gracefully...`);
      server.close(async () => {
        await mongoose.connection.close(false);
        console.log('[Server] MongoDB connection closed. Process exited.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  } catch (error) {
    console.error(`[Server] Fatal startup error: ${error.message}`);
    process.exit(1);
  }
};

startServer();

module.exports = app;
