const express = require('express');
const multer = require('multer');
const { param, body } = require('express-validator');
const examResultController = require('../controllers/examResultController');
const { requireAuth, requireAdmin } = require('../middleware/authMiddleware');

const router = express.Router();
const csvUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

// Current student authenticated results
router.get('/my-results', requireAuth, examResultController.getMyResults);

// Sample CSV Template download
router.get('/template/csv', examResultController.getSampleTemplate);

// Public / Department lookup by roll number
router.get(
  '/lookup/:rollNumber',
  [param('rollNumber').trim().notEmpty().withMessage('Roll number is required')],
  examResultController.lookupByRoll
);

// Admin: Get all student exam records (with search & semester filtering)
router.get('/', requireAuth, requireAdmin, examResultController.getAllResults);

// Admin: Upload and parse CSV marks sheet
router.post(
  '/upload-sheet',
  requireAuth,
  requireAdmin,
  csvUpload.single('sheet'),
  examResultController.uploadSheet
);

// Admin: Insert or update single exam result
router.post(
  '/',
  requireAuth,
  requireAdmin,
  [
    body('rollNumber').trim().notEmpty().withMessage('Roll number is required'),
    body('studentName').trim().notEmpty().withMessage('Student name is required'),
    body('semester').isInt({ min: 1, max: 8 }).withMessage('Semester must be between 1 and 8'),
    body('subjects').isArray({ min: 1 }).withMessage('Subjects array is required'),
  ],
  examResultController.createResult
);

// Admin: Batch upload exam results
router.post('/batch', requireAuth, requireAdmin, examResultController.batchUploadResults);

// Admin: Delete an exam result
router.delete('/:id', requireAuth, requireAdmin, examResultController.deleteResult);

module.exports = router;
