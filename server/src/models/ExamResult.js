const mongoose = require('mongoose');

const subjectResultSchema = new mongoose.Schema(
  {
    courseCode: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    courseName: {
      type: String,
      required: true,
      trim: true,
    },
    credits: {
      type: Number,
      required: true,
      min: 1,
      max: 10,
    },
    marks: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    grade: {
      type: String,
      required: true,
      enum: ['O', 'A+', 'A', 'B+', 'B', 'C', 'F'],
      uppercase: true,
    },
    gradePoints: {
      type: Number,
      required: true,
      min: 0,
      max: 10,
    },
    status: {
      type: String,
      enum: ['Pass', 'Fail'],
      default: 'Pass',
    },
  },
  { _id: false }
);

const examResultSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    rollNumber: {
      type: String,
      required: [true, 'Student Roll Number is required'],
      trim: true,
      uppercase: true,
      index: true,
    },
    studentName: {
      type: String,
      required: true,
      trim: true,
    },
    semester: {
      type: Number,
      required: true,
      min: 1,
      max: 8,
    },
    academicYear: {
      type: String,
      required: true,
      trim: true,
      default: '2025-2026',
    },
    examinationType: {
      type: String,
      enum: ['Regular End-Semester', 'Supplementary', 'Re-evaluation'],
      default: 'Regular End-Semester',
    },
    department: {
      type: String,
      required: true,
      trim: true,
    },
    subjects: {
      type: [subjectResultSchema],
      required: true,
      validate: [
        (v) => Array.isArray(v) && v.length > 0,
        'At least one subject result must be recorded',
      ],
    },
    totalCredits: {
      type: Number,
      required: true,
    },
    earnedCredits: {
      type: Number,
      required: true,
    },
    sgpa: {
      type: Number,
      required: true,
      min: 0,
      max: 10,
    },
    cgpa: {
      type: Number,
      required: true,
      min: 0,
      max: 10,
    },
    resultStatus: {
      type: String,
      enum: ['Pass', 'Supplementary', 'Withheld'],
      default: 'Pass',
    },
    declarationDate: {
      type: Date,
      default: Date.now,
    },
    remarks: {
      type: String,
      default: 'Officially published by Controller of Examinations',
    },
  },
  {
    timestamps: true,
  }
);

examResultSchema.index({ rollNumber: 1, semester: 1 }, { unique: true });

module.exports = mongoose.model('ExamResult', examResultSchema);
