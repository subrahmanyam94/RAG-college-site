const ExamResult = require('../models/ExamResult');
const examResultService = require('../services/examResultService');
const User = require('../models/User');

exports.getMyResults = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    const results = await examResultService.getStudentResults({
      studentId: user?._id,
      rollNumber: user?.rollNumber || (user?.email === 'student@campus.edu' ? '23CS101' : null),
      semester: req.query.semester,
    });

    return res.status(200).json({
      success: true,
      count: results.length,
      data: results,
    });
  } catch (error) {
    next(error);
  }
};

exports.lookupByRoll = async (req, res, next) => {
  try {
    const { rollNumber } = req.params;
    const { semester } = req.query;

    const results = await examResultService.getStudentResults({
      rollNumber,
      semester,
    });

    return res.status(200).json({
      success: true,
      count: results.length,
      data: results,
    });
  } catch (error) {
    next(error);
  }
};

// Admin: Add or Update a single exam result
exports.createResult = async (req, res, next) => {
  try {
    const data = req.body;
    if (!data.rollNumber || !data.semester || !data.subjects) {
      return res.status(400).json({
        success: false,
        error: 'rollNumber, semester, and subjects array are required',
      });
    }

    const result = await ExamResult.findOneAndUpdate(
      { rollNumber: data.rollNumber.toUpperCase(), semester: data.semester },
      { $set: data },
      { upsert: true, new: true, runValidators: true }
    );

    return res.status(201).json({
      success: true,
      message: 'Exam result saved successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// Admin: Batch upload multiple student results (JSON array)
exports.batchUploadResults = async (req, res, next) => {
  try {
    const { results } = req.body;
    if (!Array.isArray(results) || results.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Please provide a non-empty array of results in the request body',
      });
    }

    const ops = results.map((item) => ({
      updateOne: {
        filter: { rollNumber: item.rollNumber.toUpperCase(), semester: item.semester },
        update: { $set: item },
        upsert: true,
      },
    }));

    const bulkRes = await ExamResult.bulkWrite(ops);

    return res.status(200).json({
      success: true,
      message: `Processed ${results.length} exam records successfully`,
      data: bulkRes,
    });
  } catch (error) {
    next(error);
  }
};

// Admin: Delete a result
exports.deleteResult = async (req, res, next) => {
  try {
    const { id } = req.params;
    await ExamResult.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: 'Exam result deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
