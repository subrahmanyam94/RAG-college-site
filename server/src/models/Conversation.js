const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      default: 'New Campus Query',
      trim: true,
    },
    categoryFilter: {
      type: String,
      default: 'All',
    },
    departmentFilter: {
      type: String,
      default: 'All',
    },
    lastMessagePreview: {
      type: String,
      default: '',
    },
    lastActivityAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

conversationSchema.index({ userId: 1, lastActivityAt: -1 });

module.exports = mongoose.model('Conversation', conversationSchema);
