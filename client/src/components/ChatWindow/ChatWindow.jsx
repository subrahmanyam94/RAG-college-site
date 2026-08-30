import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Filter, RefreshCw, AlertCircle, ArrowDown } from 'lucide-react';
import { useChatStore } from '../../store/chatStore';
import MessageBubble from '../MessageBubble/MessageBubble';

const SAMPLE_PROMPTS = [
  'Show my semester 5 exam results & SGPA',
  'What are the hostel curfew hours and late entry rules?',
  'Explain the placement policy and dream company offer criteria.',
  'What is the exam result and CGPA for roll number 22CS104?',
  'What is the minimum attendance required for final exams?',
  'How do I qualify for merit-based scholarships or financial aid?',
];

const CATEGORIES = [
  'All',
  'Exam Results (DB)',
  'Admissions',
  'Hostel',
  'Exams',
  'Placements',
  'Scholarships',
  'Fees',
  'Courses',
  'Policies',
];

export default function ChatWindow() {
  const {
    messages,
    isSendingQuery,
    isLoadingHistory,
    error,
    categoryFilter,
    setCategoryFilter,
    sendQuery,
  } = useChatStore();

  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isSendingQuery]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputText.trim() || isSendingQuery) return;
    const query = inputText;
    setInputText('');
    sendQuery(query);
  };

  const handleChipClick = (prompt) => {
    if (isSendingQuery) return;
    sendQuery(prompt);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#FAF7F0] relative overflow-hidden">
      {/* Top Context & Category Bar */}
      <div className="px-6 py-3 border-b border-amber-200/70 bg-white/80 backdrop-blur-md flex flex-wrap items-center justify-between gap-3 shrink-0 shadow-2xs">
        <div className="flex items-center gap-2 text-xs text-amber-950 font-medium">
          <Sparkles className="w-3.5 h-3.5 text-orange-600" />
          <span className="font-bold">Hybrid RAG Scope:</span>
          <span className="text-amber-800/80">Institutional Archives & Live MongoDB Database</span>
        </div>

        {/* Category Filter Dropdown */}
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-amber-700" />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-white border border-amber-300 rounded-lg px-2.5 py-1 text-xs font-medium text-amber-950 focus:outline-none focus:border-orange-500 shadow-2xs transition-colors"
          >
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat === 'All' ? 'All Categories' : cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
        {isLoadingHistory ? (
          <div className="flex flex-col items-center justify-center h-full text-amber-800 text-sm gap-2">
            <RefreshCw className="w-5 h-5 animate-spin text-orange-600" />
            <span>Loading conversation thread...</span>
          </div>
        ) : messages.length === 0 ? (
          /* Empty Welcome State */
          <div className="flex flex-col items-center justify-center min-h-[70%] text-center px-4 max-w-2xl mx-auto animate-fade-in">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 via-orange-500 to-orange-600 flex items-center justify-center text-white shadow-xl shadow-orange-500/25 mb-5 border-2 border-white">
              <Sparkles className="w-8 h-8" />
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-2">
              How can I assist you today?
            </h2>
            <p className="text-sm text-slate-600 max-w-md mb-8 leading-relaxed">
              Ask anything about admissions, exams, hostel policies, placement rules, fees, or campus circulars. Every answer is backed strictly by verified official records.
            </p>

            {/* Starter Suggestion Chips */}
            <div className="w-full grid sm:grid-cols-2 gap-2.5 text-left">
              {SAMPLE_PROMPTS.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleChipClick(prompt)}
                  className="p-3.5 rounded-xl border border-amber-200/90 bg-white hover:bg-amber-50/80 hover:border-orange-400 text-slate-700 hover:text-orange-950 text-xs font-medium transition-all duration-200 group active:scale-98 text-left shadow-xs flex items-center justify-between"
                >
                  <span>{prompt}</span>
                  <span className="text-orange-500 group-hover:translate-x-1 transition-transform ml-2 font-bold shrink-0">→</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* Message Stream */
          <>
            {messages.map((msg, idx) => (
              <MessageBubble key={msg._id || idx} message={msg} />
            ))}

            {/* Typing / Retrieval Indicator */}
            {isSendingQuery && (
              <div className="flex items-start gap-3.5 max-w-3xl mr-auto animate-fade-in">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500 via-orange-500 to-orange-600 flex items-center justify-center text-white shadow-sm shrink-0 animate-pulse">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div className="px-4 py-3 rounded-2xl bg-white border border-amber-200 text-xs text-amber-900 flex items-center gap-2.5 shadow-sm">
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-bounce"></span>
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-bounce [animation-delay:0.2s]"></span>
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-600 animate-bounce [animation-delay:0.4s]"></span>
                  </div>
                  <span>Searching vector index and verifying institutional citations...</span>
                </div>
              </div>
            )}
          </>
        )}

        {error && (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2 max-w-3xl mx-auto shadow-xs">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Message Input Form */}
      <div className="p-4 border-t border-amber-200/70 bg-white/90 backdrop-blur-xl shrink-0">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto relative flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            placeholder="Ask a question (e.g. 'What are the hostel curfew hours?')..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={isSendingQuery}
            className="w-full bg-white border border-amber-300 rounded-xl pl-4 pr-12 py-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all disabled:opacity-60 shadow-xs"
          />

          <button
            type="submit"
            disabled={!inputText.trim() || isSendingQuery}
            className="absolute right-2 p-2 rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white disabled:opacity-30 disabled:hover:from-amber-500 disabled:hover:to-orange-600 transition-all shadow-sm active:scale-95"
            title="Send query"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
        <p className="text-center text-[11px] text-amber-800/80 mt-2 font-medium">
          CampusRAG responses are strictly grounded in uploaded institutional documents.
        </p>
      </div>
    </div>
  );
}
