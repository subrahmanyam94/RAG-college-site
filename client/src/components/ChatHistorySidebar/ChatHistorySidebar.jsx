import React, { useState, useEffect } from 'react';
import { PlusCircle, MessageSquare, Trash2, Search, Calendar, ChevronRight } from 'lucide-react';
import { useChatStore } from '../../store/chatStore';
import { formatRelativeTime } from '../../lib/utils';

export default function ChatHistorySidebar({ isOpen, onClose }) {
  const {
    conversations,
    currentConversationId,
    fetchConversations,
    selectConversation,
    startNewConversation,
    deleteConversation,
    isLoadingConversations,
  } = useChatStore();

  const [searchFilter, setSearchFilter] = useState('');

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  const filteredConversations = conversations.filter((c) =>
    (c.title || '').toLowerCase().includes(searchFilter.toLowerCase())
  );

  const handleSelect = (id) => {
    selectConversation(id);
    if (onClose) onClose();
  };

  const handleNewChat = () => {
    startNewConversation();
    if (onClose) onClose();
  };

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 w-72 bg-white border-r border-amber-200/70 flex flex-col transition-transform duration-300 md:static md:translate-x-0 shadow-sm ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      {/* Header with New Chat Button */}
      <div className="p-4 border-b border-amber-100 space-y-3 bg-amber-50/30">
        <button
          onClick={handleNewChat}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-semibold text-xs transition-all shadow-md shadow-orange-500/20 active:scale-95"
        >
          <PlusCircle className="w-4 h-4" />
          <span>New Campus Query</span>
        </button>

        {/* Search filter input */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-amber-700/60" />
          <input
            type="text"
            placeholder="Search past conversations..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-white border border-amber-200 rounded-lg text-xs text-slate-800 placeholder-amber-800/40 focus:outline-none focus:border-orange-500 shadow-2xs transition-colors"
          />
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1">
        {isLoadingConversations && conversations.length === 0 ? (
          <div className="text-center py-8 text-xs text-amber-800/60">
            Loading conversations...
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="text-center py-8 px-4 text-xs text-amber-900/60">
            {searchFilter ? 'No matching conversations' : 'No previous conversations yet. Ask your first question!'}
          </div>
        ) : (
          filteredConversations.map((convo) => {
            const isActive = convo._id === currentConversationId;
            return (
              <div
                key={convo._id}
                onClick={() => handleSelect(convo._id)}
                className={`group flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all text-xs ${
                  isActive
                    ? 'bg-amber-100/70 text-orange-950 border border-amber-300 font-semibold shadow-2xs'
                    : 'text-slate-700 hover:bg-amber-50/70 hover:text-orange-950 border border-transparent'
                }`}
              >
                <div className="flex items-start gap-2.5 min-w-0 flex-1 pr-2">
                  <MessageSquare
                    className={`w-4 h-4 mt-0.5 shrink-0 ${
                      isActive ? 'text-orange-600' : 'text-amber-600 group-hover:text-orange-600'
                    }`}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium truncate text-slate-900">{convo.title}</p>
                    <div className="flex items-center gap-2 mt-0.5 text-[10px] text-amber-900/60">
                      <span>{formatRelativeTime(convo.lastActivityAt || convo.createdAt)}</span>
                      {convo.categoryFilter && convo.categoryFilter !== 'All' && (
                        <span className="px-1.5 py-0.2 rounded bg-amber-50 text-amber-900 border border-amber-200">
                          {convo.categoryFilter}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (window.confirm('Delete this conversation history?')) {
                      deleteConversation(convo._id);
                    }
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1.5 rounded hover:bg-red-50 hover:text-red-600 text-slate-400 transition-all shrink-0"
                  title="Delete conversation"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* Footer info */}
      <div className="p-3 border-t border-amber-100 text-[11px] text-amber-900/60 text-center font-medium bg-amber-50/20">
        CampusRAG Persistent Memory
      </div>
    </aside>
  );
}
