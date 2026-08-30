const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const retrievalService = require('./retrievalService');
const examResultService = require('./examResultService');
const llmService = require('./llmService');

class ChatService {
  /**
   * Process a student query, execute RAG retrieval (both DB records & Vector documents), generate answer, and persist turns
   */
  async processQuery({ userId, question, conversationId, categoryFilter, departmentFilter }) {
    const startTime = Date.now();

    // 1. Get or create conversation session
    let conversation;
    if (conversationId) {
      conversation = await Conversation.findOne({ _id: conversationId, userId });
    }

    if (!conversation) {
      // Auto-generate a title from the first 5-8 words of the question
      const autoTitle = question.split(' ').slice(0, 7).join(' ') || 'Campus Query';
      conversation = await Conversation.create({
        userId,
        title: autoTitle.length > 50 ? autoTitle.slice(0, 47) + '...' : autoTitle,
        categoryFilter: categoryFilter || 'All',
        departmentFilter: departmentFilter || 'All',
      });
    }

    // 2. Fetch recent conversation history for multi-turn awareness
    const history = await Message.find({ conversationId: conversation._id })
      .sort({ createdAt: -1 })
      .limit(6)
      .lean();
    history.reverse();

    // 3. Check for Live Database Records (e.g. Student Exam Results, CGPA, Grades) with history context
    const examDbResult = await examResultService.retrieveExamContext(question, { _id: userId }, history);

    // 4. Contextual query expansion for multi-turn follow-up questions
    let searchQuestion = question;
    if (history.length > 0) {
      const lastUserMsg = [...history].reverse().find((m) => m.sender === 'user');
      const isFollowUp =
        question.length < 55 ||
        /\b(it|this|that|these|those|he|she|they|her|his|him|them|penalty|fine|fees|rules|criteria|exam|results|gpa|cgpa|sgpa|more|why|how|what about|and|also|status)\b/i.test(question);

      if (lastUserMsg && isFollowUp) {
        searchQuestion = `${lastUserMsg.message} ${question}`;
      }
    }

    // 5. Retrieve relevant policy/document context chunks via vector search
    const retrieval = await retrievalService.retrieveContext(searchQuestion, {
      category: categoryFilter || conversation.categoryFilter,
      department: departmentFilter || conversation.departmentFilter,
    });

    // 6. Generate grounded answer combining DB records, document excerpts, and full conversation history
    const answerResult = await llmService.generateAnswer({
      question,
      contextChunks: retrieval.chunks,
      databaseContext: examDbResult.contextText,
      databaseSources: examDbResult.sources,
      conversationHistory: history,
    });

    const latencyMs = Date.now() - startTime;

    // 6. Persist user question turn
    const userMessage = await Message.create({
      conversationId: conversation._id,
      sender: 'user',
      message: question,
      foundAnswer: true,
    });

    // 7. Persist assistant response turn with sources & scores
    const assistantMessage = await Message.create({
      conversationId: conversation._id,
      sender: 'assistant',
      message: answerResult.answer,
      sources: answerResult.sources,
      similarityScores: answerResult.sources.map((s) => s.similarityScore || 1.0),
      foundAnswer: answerResult.foundAnswer,
      latencyMs,
    });

    // 8. Update conversation last activity and preview
    conversation.lastActivityAt = new Date();
    conversation.lastMessagePreview = answerResult.answer.slice(0, 100);
    await conversation.save();

    return {
      conversationId: conversation._id,
      title: conversation.title,
      question,
      answer: answerResult.answer,
      sources: answerResult.sources,
      foundAnswer: answerResult.foundAnswer,
      latencyMs,
      userMessageId: userMessage._id,
      assistantMessageId: assistantMessage._id,
    };
  }

  /**
   * Get all conversations for a user
   */
  async getUserConversations(userId) {
    const conversations = await Conversation.find({ userId })
      .sort({ lastActivityAt: -1 })
      .lean();
    return conversations;
  }

  /**
   * Get full message history for a specific conversation
   */
  async getConversationHistory(userId, conversationId) {
    const conversation = await Conversation.findOne({ _id: conversationId, userId }).lean();
    if (!conversation) {
      const err = new Error('Conversation not found');
      err.statusCode = 404;
      throw err;
    }

    const messages = await Message.find({ conversationId }).sort({ createdAt: 1 }).lean();

    return {
      conversation,
      messages,
    };
  }

  /**
   * Delete a conversation and all its messages
   */
  async deleteConversation(userId, conversationId) {
    const conversation = await Conversation.findOne({ _id: conversationId, userId });
    if (!conversation) {
      const err = new Error('Conversation not found');
      err.statusCode = 404;
      throw err;
    }

    await Message.deleteMany({ conversationId });
    await Conversation.findByIdAndDelete(conversationId);

    return { message: 'Conversation deleted successfully' };
  }
}

module.exports = new ChatService();
