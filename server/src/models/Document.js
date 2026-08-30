const mongoose = require('mongoose');

const validCategories = [
  'Admissions',
  'Departments',
  'Courses',
  'Fees',
  'Exams',
  'Academic Calendar',
  'Hostel',
  'Library',
  'Clubs',
  'Placements',
  'Scholarships',
  'Policies',
  'Events',
  'General',
];

const documentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    originalName: {
      type: String,
      required: true,
      trim: true,
    },
    fileName: {
      type: String,
      required: true,
    },
    fileSize: {
      type: Number,
      default: 0,
    },
    mimeType: {
      type: String,
      required: true,
    },
    filePath: {
      type: String,
      required: true,
    },
    uploader: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    category: {
      type: String,
      enum: validCategories,
      default: 'General',
      required: true,
    },
    department: {
      type: String,
      default: 'All',
      trim: true,
    },
    status: {
      type: String,
      enum: ['uploaded', 'processing', 'indexed', 'failed'],
      default: 'uploaded',
    },
    errorMessage: {
      type: String,
      default: null,
    },
    chunkCount: {
      type: Number,
      default: 0,
    },
    lastIndexedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

documentSchema.index({ category: 1, status: 1 });
documentSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Document', documentSchema);
