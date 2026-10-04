import React, { useState } from 'react';
import { X, FileText, Layers, Copy, Check } from 'lucide-react';
import { DocumentDetail } from '../types';

interface DocumentDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  detail: DocumentDetail | null;
}

export const DocumentDetailModal: React.FC<DocumentDetailModalProps> = ({
  isOpen,
  onClose,
  detail,
}) => {
  const [activeTab, setActiveTab] = useState<'pages' | 'chunks'>('chunks');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!isOpen || !detail) return null;

  const copyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-4xl max-h-[88vh] bg-surface-900 border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-surface-950/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-brand-500/10 text-brand-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">{detail.document.title}</h2>
              <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-400">
                <span>{detail.document.filename}</span>
                <span>•</span>
                <span>{detail.document.page_count} Pages</span>
                <span>•</span>
                <span className="text-brand-400 font-semibold">{detail.document.chunk_count} Vector Chunks</span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* View Tabs */}
        <div className="px-6 pt-3 border-b border-slate-800 bg-surface-950/40 flex items-center gap-4">
          <button
            onClick={() => setActiveTab('chunks')}
            className={`pb-2.5 text-xs font-semibold border-b-2 transition-all ${
              activeTab === 'chunks'
                ? 'border-brand-500 text-brand-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Vector Chunks ({detail.chunks.length})
          </button>
          <button
            onClick={() => setActiveTab('pages')}
            className={`pb-2.5 text-xs font-semibold border-b-2 transition-all ${
              activeTab === 'pages'
                ? 'border-brand-500 text-brand-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Extracted Pages ({detail.pages.length})
          </button>
        </div>

        {/* Content Explorer */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {activeTab === 'chunks' ? (
            detail.chunks.map((ch) => (
              <div
                key={ch.id}
                className="p-4 rounded-xl bg-surface-950/80 border border-slate-800 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-brand-400">
                      Chunk #{ch.chunk_index}
                    </span>
                    <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                      Page {ch.page_number}
                    </span>
                    {ch.token_count && (
                      <span className="text-[11px] text-slate-400">
                        {ch.token_count} words
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => copyText(ch.content, ch.id)}
                    className="p-1 text-slate-400 hover:text-white"
                    title="Copy chunk text"
                  >
                    {copiedId === ch.id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
                <p className="text-xs text-slate-300 font-mono leading-relaxed whitespace-pre-wrap">
                  {ch.content}
                </p>
              </div>
            ))
          ) : (
            detail.pages.map((p) => (
              <div
                key={p.id}
                className="p-4 rounded-xl bg-surface-950/80 border border-slate-800 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200">
                    Page {p.page_number}
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {p.char_count} characters
                  </span>
                </div>
                <p className="text-xs text-slate-300 font-mono leading-relaxed whitespace-pre-wrap">
                  {p.preview_text}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
