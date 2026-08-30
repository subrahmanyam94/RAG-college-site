import { create } from 'zustand';
import api from '../lib/api';

export const useChatStore = create((set, get) => ({
  conversations: [],
  currentConversationId: null,
  messages: [],
  isLoadingConversations: false,
  isLoadingHistory: false,
  isSendingQuery: false,
  categoryFilter: 'All',
  departmentFilter: 'All',
  error: null,

  setCategoryFilter: (category) => set({ categoryFilter: category }),
  setDepartmentFilter: (dept) => set({ departmentFilter: dept }),

  fetchConversations: async () => {
    set({ isLoadingConversations: true });
    try {
      const res = await api.get('/chat/conversations');
      set({ conversations: res.data.data, isLoadingConversations: false });
    } catch (err) {
      console.error('Failed to fetch conversations:', err);
      set({ isLoadingConversations: false });
    }
  },

  selectConversation: async (conversationId) => {
    if (!conversationId) {
      set({ currentConversationId: null, messages: [] });
      return;
    }

    set({ currentConversationId: conversationId, isLoadingHistory: true, error: null });
    try {
      const res = await api.get(`/chat/conversations/${conversationId}`);
      set({
        messages: res.data.data.messages || [],
        categoryFilter: res.data.data.conversation.categoryFilter || 'All',
        isLoadingHistory: false,
      });
    } catch (err) {
      console.error('Failed to load conversation history:', err);
      set({ isLoadingHistory: false, error: 'Could not load conversation history.' });
    }
  },

  startNewConversation: () => {
    set({
      currentConversationId: null,
      messages: [],
      error: null,
    });
  },

  deleteConversation: async (conversationId) => {
    try {
      await api.delete(`/chat/conversations/${conversationId}`);
      const updated = get().conversations.filter((c) => c._id !== conversationId);
      set({ conversations: updated });

      if (get().currentConversationId === conversationId) {
        set({ currentConversationId: null, messages: [] });
      }
      return { success: true };
    } catch (err) {
      console.error('Failed to delete conversation:', err);
      return { success: false, error: err.response?.data?.error || 'Failed to delete' };
    }
  },

  sendQuery: async (questionText) => {
    const question = questionText.trim();
    if (!question || get().isSendingQuery) return;

    const currentConvoId = get().currentConversationId;
    const catFilter = get().categoryFilter;
    const deptFilter = get().departmentFilter;

    // Optimistically add user turn to messages
    const optimisticUserMsg = {
      _id: `temp-user-${Date.now()}`,
      sender: 'user',
      message: question,
      createdAt: new Date().toISOString(),
    };

    set({
      messages: [...get().messages, optimisticUserMsg],
      isSendingQuery: true,
      error: null,
    });

    try {
      const res = await api.post('/chat/query', {
        question,
        conversationId: currentConvoId || undefined,
        categoryFilter: catFilter !== 'All' ? catFilter : undefined,
        departmentFilter: deptFilter !== 'All' ? deptFilter : undefined,
      });

      const data = res.data.data;

      const assistantMsg = {
        _id: data.assistantMessageId || `assistant-${Date.now()}`,
        sender: 'assistant',
        message: data.answer,
        sources: data.sources || [],
        foundAnswer: data.foundAnswer,
        similarityScores: data.sources?.map((s) => s.similarityScore) || [],
        latencyMs: data.latencyMs,
        createdAt: new Date().toISOString(),
      };

      // If this was a new conversation, set the currentConversationId and refresh conversations list
      if (!currentConvoId && data.conversationId) {
        set({ currentConversationId: data.conversationId });
      }

      set({
        messages: [...get().messages, assistantMsg],
        isSendingQuery: false,
      });

      // Refresh conversations list in background
      get().fetchConversations();
    } catch (err) {
      console.error('Failed to send query:', err);
      const errorMsg =
        err.response?.data?.error || 'Unable to connect to the assistant. Please try again.';

      set({
        isSendingQuery: false,
        error: errorMsg,
      });
    }
  },
}));
