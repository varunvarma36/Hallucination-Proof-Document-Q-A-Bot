import React, { useState } from 'react';
import { X, UploadCloud, FileText, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { Collection } from '../types';
import { api } from '../services/api';

interface DocumentUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  collections: Collection[];
  onUploadSuccess: () => void;
}

export const DocumentUploadModal: React.FC<DocumentUploadModalProps> = ({
  isOpen,
  onClose,
  collections,
  onUploadSuccess,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [collectionId, setCollectionId] = useState(collections[0]?.id || '');
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successResult, setSuccessResult] = useState<any | null>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      if (!title) {
        setTitle(selectedFile.name.replace(/\.[^/.]+$/, ''));
      }
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a PDF, DOCX, or TXT document.');
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const res = await api.uploadDocument(file, title, collectionId || undefined);
      setSuccessResult(res);
      onUploadSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to process and index document.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setTitle('');
    setError(null);
    setSuccessResult(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-lg bg-surface-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-slate-800 bg-surface-950/60 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-brand-500/10 text-brand-400">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">Ingest Document</h2>
              <p className="text-xs text-slate-400">PDF, DOCX, TXT with page-level semantic indexing</p>
            </div>
          </div>
          <button
            onClick={handleReset}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {successResult ? (
          <div className="p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-brand-500/10 text-brand-400 flex items-center justify-center mx-auto border border-brand-500/20">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">Document Successfully Indexed!</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                {successResult.message || `Indexed ${successResult.page_count} pages and ${successResult.chunk_count} vector chunks.`}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-surface-950 border border-slate-800 text-xs text-slate-300 font-mono text-left space-y-1">
              <div>Title: <strong className="text-slate-100">{successResult.title}</strong></div>
              <div>Pages: <strong className="text-brand-400">{successResult.page_count}</strong></div>
              <div>Vector Chunks: <strong className="text-brand-400">{successResult.chunk_count}</strong></div>
            </div>
            <button
              onClick={handleReset}
              className="w-full py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-md transition-all"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {error && (
              <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{error}</span>
              </div>
            )}

            {/* Dropzone */}
            <div className="relative border-2 border-dashed border-slate-700 hover:border-brand-500/50 rounded-xl p-6 text-center bg-surface-950/40 hover:bg-surface-950/70 transition-all cursor-pointer">
              <input
                type="file"
                accept=".pdf,.docx,.doc,.txt"
                onChange={handleFileChange}
                disabled={isUploading}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="space-y-2 pointer-events-none">
                <div className="w-10 h-10 rounded-full bg-slate-800 text-brand-400 flex items-center justify-center mx-auto">
                  <FileText className="w-5 h-5" />
                </div>
                {file ? (
                  <div>
                    <p className="text-xs font-semibold text-slate-200">{file.name}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {(file.size / 1024).toFixed(1)} KB • Click to change
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="text-xs font-semibold text-slate-300">
                      Drag & drop your SEC filing or click to browse
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Supports PDF, DOCX, TXT (SEC 10-K, 10-Q, 8-K)
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Document Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Apple Inc. FY2023 Form 10-K"
                className="w-full px-3 py-2 rounded-xl bg-surface-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-brand-500/60"
                disabled={isUploading}
              />
            </div>

            {/* Collection Select */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Assign to Collection
              </label>
              <select
                value={collectionId}
                onChange={(e) => setCollectionId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-surface-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-brand-500/60"
                disabled={isUploading}
              >
                {collections.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.document_count} docs)
                  </option>
                ))}
              </select>
            </div>

            {/* Buttons */}
            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={handleReset}
                disabled={isUploading}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isUploading || !file}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white text-xs font-semibold shadow-md shadow-brand-600/20 transition-all"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Parsing & Indexing...</span>
                  </>
                ) : (
                  <span>Upload & Index</span>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
