const express = require('express');
const { body, param } = require('express-validator');
const chatController = require('../controllers/chatController');
const { requireAuth } = require('../middleware/authMiddleware');
const { chatLimiter } = require('../middleware/rateLimitMiddleware');

const router = express.Router();

// All chat routes require authentication
router.use(requireAuth);

// Query RAG pipeline
router.post(
  '/query',
  chatLimiter,
  [
    body('question')
      .trim()
      .notEmpty()
      .withMessage('Question cannot be empty')
      .isLength({ max: 1000 })
      .withMessage('Question is too long (max 1000 characters)'),
    body('conversationId').optional().isMongoId().withMessage('Invalid conversation ID'),
    body('categoryFilter').optional().trim(),
    body('departmentFilter').optional().trim(),
  ],
  chatController.query
);

// Get conversations list
router.get('/conversations', chatController.getConversations);

// Get single conversation full history
router.get(
  '/conversations/:id',
  [param('id').isMongoId().withMessage('Invalid conversation ID format')],
  chatController.getConversationById
);

// Delete conversation
router.delete(
  '/conversations/:id',
  [param('id').isMongoId().withMessage('Invalid conversation ID format')],
  chatController.deleteConversation
);

module.exports = router;
