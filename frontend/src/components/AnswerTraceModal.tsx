import React, { useState } from 'react';
import { 
  X, 
  ShieldCheck, 
  ShieldAlert, 
  Clock, 
  Sparkles, 
  Layers, 
  FileText, 
  Check, 
  Copy,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { VerificationTrace, Citation } from '../types';

interface AnswerTraceModalProps {
  isOpen: boolean;
  onClose: () => void;
  trace?: VerificationTrace;
  question: string;
  answer: string;
  citations: Citation[];
}

export const AnswerTraceModal: React.FC<AnswerTraceModalProps> = ({
  isOpen,
  onClose,
  trace,
  question,
  answer,
  citations
}) => {
  const [copiedChunkId, setCopiedChunkId] = useState<string | null>(null);
  const [expandedChunkId, setExpandedChunkId] = useState<string | null>(null);

  if (!isOpen || !trace) return null;

  const isVerified = trace.grounding_verdict === 'VERIFIED_GROUNDED';

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedChunkId(id);
    setTimeout(() => setCopiedChunkId(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-4xl max-h-[90vh] bg-surface-900 border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-surface-950/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${isVerified ? 'bg-brand-500/10 text-brand-400' : 'bg-amber-500/10 text-amber-400'}`}>
              {isVerified ? <ShieldCheck className="w-5 h-5" /> : <ShieldAlert className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <span>How Did We Answer This?</span>
                <span className="text-xs px-2 py-0.5 rounded-full font-mono font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                  Execution Trace
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Transparent verification trail from raw embedding retrieval to second-layer validation.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Question & Answer Summary */}
          <div className="p-4 rounded-xl bg-surface-950/80 border border-slate-800 space-y-2">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">User Query</span>
              <p className="text-sm font-medium text-slate-200 mt-0.5">{question}</p>
            </div>
            <div className="pt-2 border-t border-slate-800/80">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Generated Answer</span>
              <p className="text-sm text-slate-300 mt-0.5 leading-relaxed">{answer}</p>
            </div>
          </div>

          {/* Audit Metrics Banner */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-700/60">
              <span className="text-[11px] text-slate-400">Grounding Verdict</span>
              <div className="flex items-center gap-1.5 mt-1">
                <span className={`w-2 h-2 rounded-full ${isVerified ? 'bg-emerald-400' : 'bg-amber-400'}`}></span>
                <span className={`text-xs font-bold ${isVerified ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {trace.grounding_verdict}
                </span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-700/60">
              <span className="text-[11px] text-slate-400">Factual Overlap</span>
              <p className="text-sm font-bold text-slate-200 mt-1">
                {(trace.factual_overlap_score * 100).toFixed(1)}%
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-700/60">
              <span className="text-[11px] text-slate-400">Citations Validated</span>
              <p className="text-sm font-bold text-emerald-400 mt-1 flex items-center gap-1">
                {trace.citations_verified ? '100% Verified' : 'Failed'}
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-700/60">
              <span className="text-[11px] text-slate-400">Total Latency</span>
              <p className="text-sm font-bold text-slate-200 mt-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>{trace.latency_ms} ms</span>
              </p>
            </div>
          </div>

          {/* 6-Stage RAG Pipeline Visualizer */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Verification Pipeline Stages
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-surface-950/60 border border-slate-800 space-y-1">
                <div className="flex items-center gap-2 text-xs font-semibold text-brand-300">
                  <span className="w-5 h-5 rounded-full bg-brand-500/20 text-brand-400 flex items-center justify-center text-[10px]">1</span>
                  <span>Dense Vector Search</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-normal">
                  Query converted into 384-d normalized vector. Top-{trace.retrieved_chunks_count} chunks retrieved.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-surface-950/60 border border-slate-800 space-y-1">
                <div className="flex items-center gap-2 text-xs font-semibold text-brand-300">
                  <span className="w-5 h-5 rounded-full bg-brand-500/20 text-brand-400 flex items-center justify-center text-[10px]">2</span>
                  <span>Strict LLM Prompting</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-normal">
                  Sent ONLY retrieved context to Groq ({trace.groq_model_used}). Forced structured JSON.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-surface-950/60 border border-slate-800 space-y-1">
                <div className="flex items-center gap-2 text-xs font-semibold text-brand-300">
                  <span className="w-5 h-5 rounded-full bg-brand-500/20 text-brand-400 flex items-center justify-center text-[10px]">3</span>
                  <span>Layer-2 Verification</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-normal">
                  Validated claim support, citation existence, and exact matching quotes.
                </p>
              </div>
            </div>
          </div>

          {/* Retrieved Chunks Explorer */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <span>Retrieved Evidence Chunks ({trace.retrieved_chunks.length})</span>
                <span className="text-[10px] text-slate-400 font-normal">Filtered by Cosine Similarity</span>
              </h3>
            </div>

            <div className="space-y-2.5">
              {trace.retrieved_chunks.map((chunk, idx) => {
                const isExpanded = expandedChunkId === chunk.chunk_id || idx === 0;
                const similarityPct = (chunk.similarity * 100).toFixed(1);

                return (
                  <div
                    key={chunk.chunk_id || idx}
                    className="rounded-xl border border-slate-800 bg-surface-950/70 overflow-hidden transition-all"
                  >
                    <div 
                      className="px-4 py-2.5 flex items-center justify-between bg-slate-900/50 cursor-pointer hover:bg-slate-900"
                      onClick={() => setExpandedChunkId(isExpanded ? null : chunk.chunk_id)}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-mono font-bold text-slate-400">#{idx + 1}</span>
                        <div className="flex items-center gap-2">
                          <FileText className="w-3.5 h-3.5 text-brand-400" />
                          <span className="text-xs font-semibold text-slate-200">{chunk.document_title}</span>
                          <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                            Page {chunk.page_number}
                          </span>
                          <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                            Chunk {chunk.chunk_index}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-xs font-mono font-semibold px-2.5 py-0.5 rounded-full bg-brand-500/10 text-brand-400 border border-brand-500/20">
                          {similarityPct}% match
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            copyToClipboard(chunk.content, chunk.chunk_id);
                          }}
                          className="p-1 text-slate-400 hover:text-white"
                          title="Copy chunk text"
                        >
                          {copiedChunkId === chunk.chunk_id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                        {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="p-4 bg-surface-950/90 text-xs text-slate-300 leading-relaxed font-mono whitespace-pre-wrap border-t border-slate-800/80">
                        {chunk.content}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-surface-950/80 flex items-center justify-between text-xs text-slate-400">
          <span>VERIDOC AI Hallucination Guardrail Active</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold transition-colors"
          >
            Close Trace
          </button>
        </div>
      </div>
    </div>
  );
};
