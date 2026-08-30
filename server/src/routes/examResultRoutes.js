const express = require('express');
const { param, body } = require('express-validator');
const examResultController = require('../controllers/examResultController');
const { requireAuth, requireAdmin } = require('../middleware/authMiddleware');

const router = express.Router();

// Current student authenticated results
router.get('/my-results', requireAuth, examResultController.getMyResults);

// Public / Department lookup by roll number
router.get(
  '/lookup/:rollNumber',
  [param('rollNumber').trim().notEmpty().withMessage('Roll number is required')],
  examResultController.lookupByRoll
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
