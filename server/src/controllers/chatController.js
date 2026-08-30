const { validationResult } = require('express-validator');
const chatService = require('../services/chatService');

const query = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array().map((e) => e.msg),
      });
    }

    const { question, conversationId, categoryFilter, departmentFilter } = req.body;
    const result = await chatService.processQuery({
      userId: req.user._id,
      question,
      conversationId,
      categoryFilter,
      departmentFilter,
    });

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const getConversations = async (req, res, next) => {
  try {
    const conversations = await chatService.getUserConversations(req.user._id);
    return res.status(200).json({
      success: true,
      data: conversations,
    });
  } catch (error) {
    next(error);
  }
};

const getConversationById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await chatService.getConversationHistory(req.user._id, id);

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const deleteConversation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await chatService.deleteConversation(req.user._id, id);

    return res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  query,
  getConversations,
  getConversationById,
  deleteConversation,
};
