import { useState, useRef, useEffect } from 'react';
import { api } from '../services/api';
import type { SourceReference, Conversation } from '../types';
import {
  Send,
  Loader2,
  BookOpen,
  Clock,
  MessageSquare,
  Plus,
  ExternalLink,
  Sparkles,
  PanelLeftClose,
  PanelLeft,
} from 'lucide-react';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  sources?: SourceReference[];
  processing_time_ms?: number;
}

const EXAMPLE_QUESTIONS = [
  'How does the new CFPB regulation affect our lending operations?',
  'What are the latest compliance requirements for data privacy?',
  'Summarize our internal policy on vendor risk management',
];

export default function QAInterface() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<number | undefined>();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api.getConversations().then(setConversations).catch(console.error);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const question = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: question }]);
    setLoading(true);

    try {
      const response = await api.askQuestion(question, conversationId);
      setConversationId(response.conversation_id);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: response.answer,
          sources: response.sources,
          processing_time_ms: response.processing_time_ms,
        },
      ]);
      api.getConversations().then(setConversations).catch(console.error);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: `Error: ${err.message}` },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const loadConversation = async (conv: Conversation) => {
    try {
      const history = await api.getConversationHistory(conv.id);
      setConversationId(conv.id);
      const chatMessages: ChatMessage[] = [];
      for (const item of history) {
        chatMessages.push({ role: 'user', content: item.question });
        if (item.answer) {
          chatMessages.push({ role: 'assistant', content: item.answer, sources: item.sources });
        }
      }
      setMessages(chatMessages);
    } catch (err) {
      console.error(err);
    }
  };

  const startNewConversation = () => {
    setConversationId(undefined);
    setMessages([]);
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] -m-6 lg:-m-8">
      {/* Sidebar */}
      {sidebarOpen && (
        <div className="w-72 bg-white border-r border-stripe-slate-200 flex flex-col">
          <div className="p-4 border-b border-stripe-slate-200">
            <button
              onClick={startNewConversation}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              <Plus className="h-4 w-4" />
              New conversation
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
            {conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => loadConversation(conv)}
                className={`w-full text-left px-3 py-2.5 rounded-md text-sm transition-all duration-150 ${
                  conversationId === conv.id
                    ? 'bg-stripe-purple/5 text-stripe-purple border border-stripe-purple/20'
                    : 'text-stripe-slate-800 hover:bg-stripe-slate-50'
                }`}
              >
                <p className="font-medium truncate">
                  {conv.title || 'Untitled conversation'}
                </p>
                <p className="text-[13px] text-stripe-slate-500 mt-0.5">
                  {new Date(conv.updated_at).toLocaleDateString()}
                </p>
              </button>
            ))}
            {conversations.length === 0 && (
              <p className="text-center text-sm text-stripe-slate-500 py-8">
                No conversations yet
              </p>
            )}
          </div>
        </div>
      )}

      {/* Chat area */}
      <div className="flex-1 flex flex-col bg-stripe-slate-100">
        {/* Header */}
        <div className="bg-white border-b border-stripe-slate-200 px-6 py-3 flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 rounded-md hover:bg-stripe-slate-50 text-stripe-slate-500 transition-colors"
          >
            {sidebarOpen ? (
              <PanelLeftClose className="h-5 w-5" />
            ) : (
              <PanelLeft className="h-5 w-5" />
            )}
          </button>
          <h2 className="font-semibold text-stripe-slate-900">
            Enterprise Intelligence Q&A
          </h2>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.length === 0 && (
            <div className="text-center py-20">
              <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-stripe-purple/10 mb-5">
                <Sparkles className="h-6 w-6 text-stripe-purple" />
              </div>
              <h3 className="text-lg font-semibold text-stripe-slate-900 mb-2">
                Ask anything about your enterprise
              </h3>
              <p className="text-sm text-stripe-slate-500 max-w-md mx-auto">
                Ask about regulations, policies, internal documents, or request
                impact analysis across your business units.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-2 max-w-2xl mx-auto">
                {EXAMPLE_QUESTIONS.map((q) => (
                  <button
                    key={q}
                    onClick={() => setInput(q)}
                    className="text-[13px] px-3.5 py-2 rounded-md border border-stripe-slate-200
                      text-stripe-slate-600 hover:bg-white hover:border-stripe-purple/30
                      hover:text-stripe-purple shadow-stripe-sm transition-all duration-150"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-3xl rounded-lg px-5 py-3.5 ${
                  msg.role === 'user'
                    ? 'bg-stripe-purple text-white shadow-stripe-sm'
                    : 'card p-5'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap leading-relaxed">
                  {msg.content}
                </p>

                {msg.sources && msg.sources.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-stripe-slate-200">
                    <p className="text-[13px] font-medium text-stripe-slate-500 mb-2 flex items-center gap-1.5">
                      <BookOpen className="h-3.5 w-3.5" />
                      Sources ({msg.sources.length})
                    </p>
                    <div className="space-y-2">
                      {msg.sources.map((src, j) => (
                        <div
                          key={j}
                          className="text-[13px] bg-stripe-slate-50 rounded-md p-3 border border-stripe-slate-100"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium text-stripe-slate-800">
                              {src.document_title}
                            </span>
                            <span className="badge bg-stripe-purple/10 text-stripe-purple">
                              {(src.relevance_score * 100).toFixed(0)}% match
                            </span>
                          </div>
                          <p className="text-stripe-slate-500 line-clamp-2">
                            {src.chunk_text}
                          </p>
                          {src.source_url && (
                            <a
                              href={src.source_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 mt-1.5 text-stripe-purple hover:text-stripe-purple-light font-medium"
                            >
                              View source <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {msg.processing_time_ms && (
                  <p className="text-[13px] text-stripe-slate-400 mt-2 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {(msg.processing_time_ms / 1000).toFixed(1)}s
                  </p>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="card px-5 py-4 flex items-center gap-3">
                <Loader2 className="h-5 w-5 animate-spin text-stripe-purple" />
                <span className="text-sm text-stripe-slate-500">
                  Analyzing your question…
                </span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input bar */}
        <div className="bg-white border-t border-stripe-slate-200 p-4">
          <form onSubmit={handleSubmit} className="flex gap-3 max-w-4xl mx-auto">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about regulations, policies, news, or internal data…"
              className="input-field flex-1"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="btn-primary px-5"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
