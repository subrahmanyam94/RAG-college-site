const express = require('express');
const { body, param, query } = require('express-validator');
const documentController = require('../controllers/documentController');
const { requireAuth, requireAdmin } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

const router = express.Router();

// All document management routes require authenticated admin access
router.use(requireAuth, requireAdmin);

// Dashboard metrics
router.get('/metrics', documentController.getMetrics);

// List documents
router.get(
  '/',
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('category').optional().trim(),
    query('status').optional().trim(),
    query('search').optional().trim(),
  ],
  documentController.listDocuments
);

// Upload new document
router.post(
  '/upload',
  upload.single('file'),
  [
    body('title').optional().trim().isLength({ max: 120 }),
    body('category').optional().trim(),
    body('department').optional().trim(),
  ],
  documentController.uploadDocument
);

// Get single document details with chunk preview
router.get(
  '/:id',
  [param('id').isMongoId().withMessage('Invalid document ID format')],
  documentController.getDocument
);

// Re-index document
router.put(
  '/:id/reindex',
  [param('id').isMongoId().withMessage('Invalid document ID format')],
  documentController.reindexDocument
);

// Delete document and its vectors
router.delete(
  '/:id',
  [param('id').isMongoId().withMessage('Invalid document ID format')],
  documentController.deleteDocument
);

module.exports = router;
