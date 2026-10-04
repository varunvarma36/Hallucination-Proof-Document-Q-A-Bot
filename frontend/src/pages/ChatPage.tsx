import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Sparkles, 
  ShieldCheck, 
  ShieldAlert, 
  HelpCircle, 
  FileText, 
  Layers, 
  Sliders, 
  ChevronRight, 
  Check, 
  Copy,
  Clock,
  Loader2,
  RefreshCw,
  Info
} from 'lucide-react';
import { Collection, ChatMessage, VerificationTrace } from '../types';
import { api } from '../services/api';
import { AnswerTraceModal } from '../components/AnswerTraceModal';

interface ChatPageProps {
  collections: Collection[];
  selectedCollectionId?: string;
  onSelectCollection: (colId: string) => void;
}

export const ChatPage: React.FC<ChatPageProps> = ({
  collections,
  selectedCollectionId,
  onSelectCollection,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: 'Welcome to VERIDOC AI. I am your strict document-grounded financial intelligence assistant. Ask me questions regarding your indexed SEC 10-K filings (e.g. Apple, Microsoft, Amazon). Every answer is verified with exact page citations and zero hallucinations permitted.',
      supported: true,
      confidence: 1.0,
      citations: []
    }
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [topK, setTopK] = useState(5);
  const [threshold, setThreshold] = useState(0.70);
  const [showConfig, setShowConfig] = useState(false);
  const [copiedQuote, setCopiedQuote] = useState<string | null>(null);

  // Trace Modal state
  const [activeTrace, setActiveTrace] = useState<{
    trace: VerificationTrace;
    question: string;
    answer: string;
    citations: any[];
  } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const samplePrompts = [
    { label: "Apple FY23 Net Sales", query: "What was Apple's total net sales for fiscal year 2023?" },
    { label: "Microsoft FY23 Operating Income", query: "What was Microsoft's operating income in fiscal year 2023?" },
    { label: "Apple R&D Expenses", query: "What was the total research and development expense for Apple in fiscal year 2023?" },
    { label: "Adversarial: Quantum Revenue", query: "What was Apple's total revenue from quantum teleportation services in fiscal year 2023?" },
  ];

  const handleSend = async (queryToSend?: string) => {
    const query = queryToSend || inputQuery;
    if (!query.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      role: 'user',
      content: query.trim()
    };
    setMessages(prev => [...prev, userMsg]);
    setInputQuery('');
    setIsLoading(true);

    try {
      const response = await api.queryChat({
        question: query.trim(),
        collection_id: selectedCollectionId || undefined,
        top_k: topK,
        similarity_threshold: threshold
      });

      const assistantMsg: ChatMessage = {
        role: 'assistant',
        content: response.answer,
        supported: response.supported,
        confidence: response.confidence,
        citations: response.citations,
        verification_status: response.verification_status,
        trace: response.trace
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch (err: any) {
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: `Error communicating with verification pipeline: ${err.message || 'Unknown error'}`,
          supported: false,
          confidence: 0.0,
          citations: []
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedQuote(id);
    setTimeout(() => setCopiedQuote(null), 2000);
  };

  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col rounded-2xl border border-slate-800/80 bg-surface-900 overflow-hidden shadow-xl animate-in fade-in duration-300">
      {/* Top Chat Bar: Collection Selector & Settings */}
      <div className="px-6 py-3 border-b border-slate-800 bg-surface-950/70 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <label className="text-xs font-semibold text-slate-300">Active Collection:</label>
          <select
            value={selectedCollectionId || ''}
            onChange={(e) => onSelectCollection(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-surface-900 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-brand-500/60 font-medium"
          >
            <option value="">All Collections (Global)</option>
            {collections.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.document_count} docs)
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowConfig(!showConfig)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
              showConfig 
                ? 'bg-brand-500/10 text-brand-300 border-brand-500/30' 
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Retrieval Params (K={topK}, Thresh={threshold})</span>
          </button>
        </div>
      </div>

      {/* Collapsible Retrieval Param Adjuster */}
      {showConfig && (
        <div className="px-6 py-3 border-b border-slate-800 bg-surface-950/90 flex flex-wrap items-center gap-8 text-xs text-slate-300 animate-in slide-in-from-top-2 duration-150">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-slate-200">Top-K Chunks: {topK}</span>
            <input
              type="range"
              min="1"
              max="10"
              value={topK}
              onChange={(e) => setTopK(parseInt(e.target.value))}
              className="accent-brand-500 w-28 cursor-pointer"
            />
          </div>

          <div className="flex items-center gap-3">
            <span className="font-semibold text-slate-200">Similarity Threshold: {threshold.toFixed(2)}</span>
            <input
              type="range"
              min="0.50"
              max="0.95"
              step="0.05"
              value={threshold}
              onChange={(e) => setThreshold(parseFloat(e.target.value))}
              className="accent-brand-500 w-28 cursor-pointer"
            />
          </div>
          <span className="text-[11px] text-slate-400">
            Chunks with cosine similarity &lt; {threshold.toFixed(2)} are excluded before LLM context generation.
          </span>
        </div>
      )}

      {/* Messages Stream */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.map((msg, idx) => {
          const isUser = msg.role === 'user';
          const isAbstained = !msg.supported;

          return (
            <div
              key={idx}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-2`}
            >
              {/* Message Header */}
              <div className="flex items-center gap-2 px-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {isUser ? 'You' : 'VERIDOC Engine'}
                </span>
                {!isUser && msg.verification_status && (
                  <span
                    className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      isAbstained
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    }`}
                  >
                    {isAbstained ? <ShieldAlert className="w-3 h-3" /> : <ShieldCheck className="w-3 h-3" />}
                    <span>{isAbstained ? 'Abstained • Out of Domain' : 'Verified Grounded'}</span>
                  </span>
                )}
                {!isUser && msg.confidence !== undefined && msg.confidence > 0 && (
                  <span className="text-[10px] font-mono text-slate-400">
                    Confidence: {(msg.confidence * 100).toFixed(0)}%
                  </span>
                )}
              </div>

              {/* Message Bubble */}
              <div
                className={`max-w-3xl rounded-2xl p-4 text-xs leading-relaxed shadow-md ${
                  isUser
                    ? 'bg-brand-600 text-white font-medium rounded-tr-none'
                    : isAbstained
                    ? 'bg-surface-950/90 border border-amber-500/30 text-amber-200/90 rounded-tl-none space-y-3'
                    : 'bg-surface-950/90 border border-slate-800 text-slate-200 rounded-tl-none space-y-4'
                }`}
              >
                <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.content}</p>

                {/* Sources & Citations Section */}
                {!isUser && msg.citations && msg.citations.length > 0 && (
                  <div className="pt-3 border-t border-slate-800/80 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-brand-400" />
                        <span>Ground-Truth Citations ({msg.citations.length})</span>
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {msg.citations.map((cit, cIdx) => (
                        <div
                          key={cIdx}
                          className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1.5"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-slate-200 text-xs truncate max-w-[180px]">
                              {cit.document}
                            </span>
                            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-brand-500/10 text-brand-400">
                              Page {cit.page}
                            </span>
                          </div>
                          {cit.exact_quote && (
                            <p className="text-[11px] text-slate-400 italic line-clamp-2">
                              "{cit.exact_quote}"
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 'How did we answer this?' Action */}
                {!isUser && msg.trace && (
                  <div className="pt-2 flex items-center justify-between">
                    <button
                      onClick={() => {
                        const userQuery = messages[idx - 1]?.content || 'Query';
                        setActiveTrace({
                          trace: msg.trace!,
                          question: userQuery,
                          answer: msg.content,
                          citations: msg.citations || []
                        });
                      }}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-400 hover:text-brand-300 py-1 px-2.5 rounded-lg bg-brand-500/10 hover:bg-brand-500/20 border border-brand-500/20 transition-all"
                    >
                      <HelpCircle className="w-3.5 h-3.5" />
                      <span>How did we answer this?</span>
                    </button>

                    <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{msg.trace.latency_ms} ms</span>
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex items-center gap-3 text-slate-400 text-xs p-4 rounded-xl bg-surface-950/60 border border-slate-800 max-w-sm">
            <Loader2 className="w-4 h-4 animate-spin text-brand-400" />
            <div className="space-y-0.5">
              <span className="font-semibold text-slate-200">Retrieving & Verifying...</span>
              <p className="text-[11px] text-slate-400">
                Vector matching &gt; Groq reasoning &gt; Layer-2 verification
              </p>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Queries */}
      <div className="px-6 py-2 border-t border-slate-800/80 bg-surface-950/40 flex items-center gap-2 overflow-x-auto scrollbar-none">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 shrink-0">
          Try FinanceBench:
        </span>
        {samplePrompts.map((sp, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(sp.query)}
            disabled={isLoading}
            className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 whitespace-nowrap shrink-0 transition-colors"
          >
            {sp.label}
          </button>
        ))}
      </div>

      {/* Query Input Box */}
      <div className="p-4 border-t border-slate-800 bg-surface-950/90">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            placeholder="Ask anything grounded in SEC filings (e.g., Apple 2023 net sales, gross margin, R&D expense)..."
            disabled={isLoading}
            className="flex-1 px-4 py-3 rounded-xl bg-surface-900 border border-slate-700 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-brand-500/60 shadow-inner"
          />
          <button
            type="submit"
            disabled={isLoading || !inputQuery.trim()}
            className="px-5 py-3 rounded-xl bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-brand-600/20 transition-all flex items-center gap-2"
          >
            <span>Ask</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>

      {/* Answer Trace Modal */}
      {activeTrace && (
        <AnswerTraceModal
          isOpen={!!activeTrace}
          onClose={() => setActiveTrace(null)}
          trace={activeTrace.trace}
          question={activeTrace.question}
          answer={activeTrace.answer}
          citations={activeTrace.citations}
        />
      )}
    </div>
  );
};
