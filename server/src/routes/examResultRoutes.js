const express = require('express');
const { param, query } = require('express-validator');
const examResultController = require('../controllers/examResultController');
const { requireAuth } = require('../middleware/authMiddleware');

const router = express.Router();

// Current student authenticated results
router.get('/my-results', requireAuth, examResultController.getMyResults);

// Public / Department lookup by roll number
router.get(
  '/lookup/:rollNumber',
  [param('rollNumber').trim().notEmpty().withMessage('Roll number is required')],
  examResultController.lookupByRoll
);

module.exports = router;
