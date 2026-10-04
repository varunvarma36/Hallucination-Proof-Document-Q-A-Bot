import React, { useState } from 'react';
import { FolderGit2, Plus, Files, Layers, X, Check } from 'lucide-react';
import { Collection } from '../types';
import { api } from '../services/api';

interface CollectionsPageProps {
  collections: Collection[];
  onRefresh: () => void;
  onSelectCollectionForChat: (collectionId: string) => void;
}

export const CollectionsPage: React.FC<CollectionsPageProps> = ({
  collections,
  onRefresh,
  onSelectCollectionForChat,
}) => {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      await api.createCollection(name.trim(), description.trim() || undefined);
      setName('');
      setDescription('');
      setIsCreateOpen(false);
      onRefresh();
    } catch (e) {
      alert('Failed to create collection');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <FolderGit2 className="w-5 h-5 text-brand-400" />
            <span>Document Collections</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Strict isolation boundaries. The retrieval engine never searches across other collections.
          </p>
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-md shadow-brand-600/20 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>New Collection</span>
        </button>
      </div>

      {/* Collections Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {collections.map((col) => (
          <div
            key={col.id}
            className="p-5 rounded-2xl bg-surface-900 border border-slate-800 hover:border-brand-500/40 transition-all shadow-md space-y-4 flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="p-2 rounded-xl bg-brand-500/10 text-brand-400">
                  <FolderGit2 className="w-5 h-5" />
                </div>
                <span className="text-[10px] uppercase font-mono font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
                  Isolated
                </span>
              </div>
              <h3 className="text-sm font-bold text-slate-100">{col.name}</h3>
              <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                {col.description || 'Collection of financial and SEC disclosures.'}
              </p>
            </div>

            <div className="pt-3 border-t border-slate-800/80 space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                <span className="flex items-center gap-1.5">
                  <Files className="w-3.5 h-3.5 text-blue-400" />
                  <span>{col.document_count} Documents</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-brand-400" />
                  <span>{col.chunk_count} Chunks</span>
                </span>
              </div>

              <button
                onClick={() => onSelectCollectionForChat(col.id)}
                className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 font-semibold transition-colors"
              >
                Query This Collection
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Create Collection Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div 
            className="w-full max-w-md bg-surface-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-100">Create New Collection</h3>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Collection Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Apple Inc. (AAPL) 10-K"
                  className="w-full px-3 py-2 rounded-xl bg-surface-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-brand-500/60"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief summary of document types and fiscal periods..."
                  rows={3}
                  className="w-full px-3 py-2 rounded-xl bg-surface-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-brand-500/60"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-xs font-semibold text-slate-300 hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !name.trim()}
                  className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white text-xs font-semibold shadow-md shadow-brand-600/20"
                >
                  Create Collection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
