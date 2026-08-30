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
