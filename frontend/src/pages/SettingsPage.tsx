import React, { useState, useEffect } from 'react';
import { SlidersHorizontal, Check, Save, RotateCcw, ShieldCheck, Key, Database, Sparkles } from 'lucide-react';
import { api } from '../services/api';

export const SettingsPage: React.FC = () => {
  const [groqModel, setGroqModel] = useState('llama-3.3-70b-versatile');
  const [topK, setTopK] = useState(5);
  const [threshold, setThreshold] = useState(0.70);
  const [chunkSize, setChunkSize] = useState(800);
  const [chunkOverlap, setChunkOverlap] = useState(120);
  const [vectorBackend, setVectorBackend] = useState('supabase');
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [envStatus, setEnvStatus] = useState<any>({});

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const data = await api.getSettings();
      setGroqModel(data.GROQ_MODEL || 'llama-3.3-70b-versatile');
      setTopK(data.TOP_K || 5);
      setThreshold(data.SIMILARITY_THRESHOLD || 0.70);
      setChunkSize(data.CHUNK_SIZE || 800);
      setChunkOverlap(data.CHUNK_OVERLAP || 120);
      setVectorBackend(data.VECTOR_BACKEND || 'supabase');
      setEnvStatus(data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await api.updateSettings({
        GROQ_MODEL: groqModel,
        TOP_K: topK,
        SIMILARITY_THRESHOLD: threshold,
        CHUNK_SIZE: chunkSize,
        CHUNK_OVERLAP: chunkOverlap,
        VECTOR_BACKEND: vectorBackend
      });
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2500);
    } catch (e) {
      alert('Failed to update settings');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl animate-in fade-in duration-300">
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
          <SlidersHorizontal className="w-5 h-5 text-brand-400" />
          <span>RAG Pipeline Configuration</span>
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Tune retrieval hyperparameters, LLM reasoning parameters, and vector store backend.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* LLM & Model Selection */}
        <div className="p-6 rounded-2xl bg-surface-900 border border-slate-800 space-y-4 shadow-md">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold text-slate-100">LLM Reasoning Engine</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Groq Model
              </label>
              <select
                value={groqModel}
                onChange={(e) => setGroqModel(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-surface-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-brand-500/60 font-medium"
              >
                <option value="llama-3.3-70b-versatile">llama-3.3-70b-versatile (Recommended)</option>
                <option value="llama-3.1-8b-instant">llama-3.1-8b-instant (Sub-200ms)</option>
                <option value="mixtral-8x7b-32768">mixtral-8x7b-32768</option>
              </select>
              <p className="text-[11px] text-slate-400 mt-1">
                Structured JSON output enforced for 100% adherence to grounding schema.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Vector Backend
              </label>
              <select
                value={vectorBackend}
                onChange={(e) => setVectorBackend(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-surface-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-brand-500/60 font-medium"
              >
                <option value="supabase">Supabase PostgreSQL + pgvector</option>
                <option value="local">Local FAISS (Offline High-Performance Fallback)</option>
              </select>
              <p className="text-[11px] text-slate-400 mt-1">
                pgvector enables cloud PostgreSQL vector indexing with HNSW index.
              </p>
            </div>
          </div>
        </div>

        {/* Retrieval Hyperparameters */}
        <div className="p-6 rounded-2xl bg-surface-900 border border-slate-800 space-y-4 shadow-md">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <Database className="w-4 h-4 text-brand-400" />
            <h3 className="text-sm font-bold text-slate-100">Retrieval & Similarity Thresholds</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <label className="font-semibold text-slate-300">Top-K Retrieved Chunks</label>
                <span className="font-mono font-bold text-brand-400">{topK}</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={topK}
                onChange={(e) => setTopK(parseInt(e.target.value))}
                className="w-full accent-brand-500 cursor-pointer"
              />
              <p className="text-[11px] text-slate-400">
                Number of most similar chunks provided as factual evidence.
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <label className="font-semibold text-slate-300">Similarity Threshold</label>
                <span className="font-mono font-bold text-brand-400">{threshold.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.50"
                max="0.95"
                step="0.05"
                value={threshold}
                onChange={(e) => setThreshold(parseFloat(e.target.value))}
                className="w-full accent-brand-500 cursor-pointer"
              />
              <p className="text-[11px] text-slate-400">
                Minimum cosine similarity to admit chunk as valid evidence.
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <label className="font-semibold text-slate-300">Chunk Size (chars)</label>
                <span className="font-mono font-bold text-brand-400">{chunkSize}</span>
              </div>
              <input
                type="range"
                min="400"
                max="1500"
                step="50"
                value={chunkSize}
                onChange={(e) => setChunkSize(parseInt(e.target.value))}
                className="w-full accent-brand-500 cursor-pointer"
              />
              <p className="text-[11px] text-slate-400">
                Target characters per page chunk.
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <label className="font-semibold text-slate-300">Chunk Overlap (chars)</label>
                <span className="font-mono font-bold text-brand-400">{chunkOverlap}</span>
              </div>
              <input
                type="range"
                min="40"
                max="300"
                step="20"
                value={chunkOverlap}
                onChange={(e) => setChunkOverlap(parseInt(e.target.value))}
                className="w-full accent-brand-500 cursor-pointer"
              />
              <p className="text-[11px] text-slate-400">
                Character boundary overlap between consecutive chunks.
              </p>
            </div>
          </div>
        </div>

        {/* Credentials Checklist */}
        <div className="p-6 rounded-2xl bg-surface-900 border border-slate-800 space-y-3 shadow-md">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <Key className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-slate-100">Environment & Security Status</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="flex items-center justify-between p-3 rounded-xl bg-surface-950 border border-slate-800">
              <span className="text-slate-300">Groq API Key</span>
              <span className={`px-2 py-0.5 rounded-full font-semibold text-[10px] ${
                envStatus.GROQ_API_KEY_CONFIGURED 
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                  : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
              }`}>
                {envStatus.GROQ_API_KEY_CONFIGURED ? 'Configured' : 'Using Local Engine'}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-surface-950 border border-slate-800">
              <span className="text-slate-300">Supabase Connection</span>
              <span className={`px-2 py-0.5 rounded-full font-semibold text-[10px] ${
                envStatus.SUPABASE_CONFIGURED 
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                  : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
              }`}>
                {envStatus.SUPABASE_CONFIGURED ? 'Connected' : 'Local FAISS Mode'}
              </span>
            </div>
          </div>
        </div>

        {/* Save Bar */}
        <div className="flex items-center justify-end gap-3 pt-2">
          {isSaved && (
            <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
              <Check className="w-4 h-4" />
              <span>Settings updated successfully!</span>
            </span>
          )}
          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-md shadow-brand-600/20 transition-all"
          >
            <Save className="w-4 h-4" />
            <span>Save Settings</span>
          </button>
        </div>
      </form>
    </div>
  );
};
