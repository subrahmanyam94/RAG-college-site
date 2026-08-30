import React, { useState, useEffect } from 'react';
import { MessageSquare, Search, Calendar, Trash2, ArrowRight, Clock, PlusCircle } from 'lucide-react';
import AppShell from '../components/AppShell/AppShell';
import { useChatStore } from '../store/chatStore';
import { formatDate, formatRelativeTime } from '../lib/utils';

export default function ChatHistoryPage() {
  const {
    conversations,
    fetchConversations,
    selectConversation,
    startNewConversation,
    deleteConversation,
    isLoadingConversations,
  } = useChatStore();

  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  const filtered = conversations.filter((c) =>
    (c.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.lastMessagePreview || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleResume = (id) => {
    selectConversation(id);
    window.location.hash = '/chat';
  };

  const handleNewChat = () => {
    startNewConversation();
    window.location.hash = '/chat';
  };

  return (
    <AppShell currentPath="/chat/history">
      <div className="p-6 sm:p-8 max-w-6xl mx-auto w-full space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-amber-200/80">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2.5">
              <MessageSquare className="w-6 h-6 text-orange-600" />
              Conversation History
            </h1>
            <p className="text-xs text-amber-900/70 mt-1 font-medium">
              Browse, search, or resume past queries with verified citations preserved.
            </p>
          </div>

          <button
            onClick={handleNewChat}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white text-xs font-semibold shadow-md shadow-orange-500/20 transition-all self-start sm:self-auto active:scale-95"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Start New Query</span>
          </button>
        </div>

        {/* Search input */}
        <div className="relative max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-amber-700/60" />
          <input
            type="text"
            placeholder="Search conversation topics or keywords..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-amber-300 rounded-xl text-xs text-slate-900 placeholder-amber-800/40 focus:outline-none focus:border-orange-500 shadow-2xs transition-colors"
          />
        </div>

        {/* Conversations Grid */}
        {isLoadingConversations && conversations.length === 0 ? (
          <div className="text-center py-16 text-xs text-amber-900/60 font-medium">
            Loading conversation archive...
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 px-4 bg-white rounded-2xl border border-amber-200/90 text-slate-600 shadow-sm">
            <MessageSquare className="w-10 h-10 mx-auto text-amber-400 mb-3" />
            <h3 className="text-sm font-bold text-slate-900 mb-1">
              {searchTerm ? 'No matching conversations' : 'No previous conversations found'}
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4 font-medium">
              Start chatting with CampusRAG to view your conversation history and sources here.
            </p>
            <button
              onClick={handleNewChat}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white text-xs font-semibold shadow-xs"
            >
              Ask First Question
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map((convo) => (
              <div
                key={convo._id}
                onClick={() => handleResume(convo._id)}
                className="p-5 rounded-2xl bg-white border border-amber-200/90 hover:border-orange-400 transition-all cursor-pointer group hover:-translate-y-0.5 shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <h3 className="text-sm font-bold text-slate-900 group-hover:text-orange-600 transition-colors line-clamp-1">
                      {convo.title}
                    </h3>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {convo.categoryFilter && convo.categoryFilter !== 'All' && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-900 border border-amber-200 font-semibold">
                          {convo.categoryFilter}
                        </span>
                      )}
                    </div>
                  </div>

                  {convo.lastMessagePreview && (
                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed mb-4">
                      {convo.lastMessagePreview}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-amber-100 text-[11px] text-slate-500 font-medium">
                  <div className="flex items-center gap-1.5 font-mono">
                    <Clock className="w-3 h-3 text-amber-600" />
                    <span>{formatDate(convo.lastActivityAt || convo.createdAt)}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (window.confirm('Delete this conversation?')) {
                          deleteConversation(convo._id);
                        }
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                      title="Delete conversation"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <span className="flex items-center gap-1 text-orange-600 font-bold group-hover:translate-x-0.5 transition-transform">
                      Resume <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
