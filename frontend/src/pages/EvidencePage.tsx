import React, { useState } from 'react';
import { SearchCheck, Search, Filter, Layers, FileText, Copy, Check, Sparkles } from 'lucide-react';
import { Collection, DocumentItem } from '../types';
import { api } from '../services/api';

interface EvidencePageProps {
  collections: Collection[];
  documents: DocumentItem[];
}

export const EvidencePage: React.FC<EvidencePageProps> = ({ collections, documents }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCol, setSelectedCol] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const res = await api.queryChat({
        question: searchQuery.trim(),
        collection_id: selectedCol || undefined,
        top_k: 8,
        similarity_threshold: 0.50
      });

      if (res && res.trace && res.trace.retrieved_chunks) {
        setSearchResults(res.trace.retrieved_chunks);
      } else {
        setSearchResults([]);
      }
    } catch (e) {
      console.error(e);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const copyChunk = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
          <SearchCheck className="w-5 h-5 text-brand-400" />
          <span>Semantic Evidence Explorer</span>
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Direct inspection of 384-dimensional dense vector embeddings and cosine similarity scores.
        </p>
      </div>

      {/* Search Input Bar */}
      <form onSubmit={handleSearch} className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Type any financial concept, metric, or entity (e.g. gross margin, AWS operating income, basic EPS)..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-surface-900 border border-slate-800 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-brand-500/60"
          />
        </div>

        <select
          value={selectedCol}
          onChange={(e) => setSelectedCol(e.target.value)}
          className="w-full sm:w-60 px-3 py-2.5 rounded-xl bg-surface-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-brand-500/60"
        >
          <option value="">All Collections</option>
          {collections.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>

        <button
          type="submit"
          disabled={isSearching || !searchQuery.trim()}
          className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-brand-600/20 transition-all"
        >
          {isSearching ? 'Embedding & Searching...' : 'Search Evidence'}
        </button>
      </form>

      {/* Results Stream */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>
            {searchResults.length > 0 
              ? `Retrieved ${searchResults.length} ranked chunks via dense vector matching` 
              : 'Enter a search query to explore ranked evidence chunks'}
          </span>
          <span className="font-mono text-[11px] text-slate-500">Model: BAAI/bge-small-en-v1.5</span>
        </div>

        {searchResults.map((ch, idx) => {
          const simPct = (ch.similarity * 100).toFixed(1);

          return (
            <div
              key={ch.chunk_id || idx}
              className="p-5 rounded-2xl bg-surface-900 border border-slate-800 space-y-3 shadow-md hover:border-brand-500/30 transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono font-bold text-slate-400">#{idx + 1}</span>
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-brand-400" />
                    <span className="text-xs font-bold text-slate-200">{ch.document_title}</span>
                    <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                      Page {ch.page_number}
                    </span>
                    <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                      Chunk {ch.chunk_index}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-brand-500/10 text-brand-400 border border-brand-500/20">
                    Cosine Similarity: {simPct}%
                  </span>
                  <button
                    onClick={() => copyChunk(ch.content, ch.chunk_id || idx.toString())}
                    className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                    title="Copy chunk text"
                  >
                    {copiedId === (ch.chunk_id || idx.toString()) ? (
                      <Check className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-surface-950 text-xs text-slate-300 font-mono leading-relaxed whitespace-pre-wrap border border-slate-800/80">
                {ch.content}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
