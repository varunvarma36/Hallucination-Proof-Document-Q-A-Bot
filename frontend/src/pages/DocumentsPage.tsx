import React, { useState } from 'react';
import { 
  Files, 
  Search, 
  UploadCloud, 
  Eye, 
  Trash2, 
  Layers, 
  FileText, 
  CheckCircle2, 
  Lock,
  ExternalLink
} from 'lucide-react';
import { DocumentItem, Collection, DocumentDetail } from '../types';
import { api } from '../services/api';
import { DocumentDetailModal } from '../components/DocumentDetailModal';

interface DocumentsPageProps {
  documents: DocumentItem[];
  collections: Collection[];
  onRefresh: () => void;
  onOpenUpload: () => void;
}

export const DocumentsPage: React.FC<DocumentsPageProps> = ({
  documents,
  collections,
  onRefresh,
  onOpenUpload,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCollection, setSelectedCollection] = useState<string>('all');
  const [activeDetail, setActiveDetail] = useState<DocumentDetail | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  const filteredDocs = documents.filter((doc) => {
    const matchesSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          doc.filename.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCollection = selectedCollection === 'all' || doc.collection_id === selectedCollection;
    return matchesSearch && matchesCollection;
  });

  const handleViewDetail = async (docId: string) => {
    setIsLoadingDetail(true);
    try {
      const detail = await api.getDocument(docId);
      setActiveDetail(detail);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const handleDelete = async (docId: string) => {
    if (confirm('Are you sure you want to delete this document and its indexed vector chunks?')) {
      try {
        await api.deleteDocument(docId);
        onRefresh();
      } catch (e) {
        alert('Failed to delete document');
      }
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Files className="w-5 h-5 text-brand-400" />
            <span>Document Repository</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Indexed financial SEC filings stored persistently with page-level semantic vectors.
          </p>
        </div>

        <button
          onClick={onOpenUpload}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-md shadow-brand-600/20 transition-all self-start sm:self-auto"
        >
          <UploadCloud className="w-4 h-4" />
          <span>Upload Document</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by title or filename..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-surface-900 border border-slate-800 text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-brand-500/60"
          />
        </div>

        <select
          value={selectedCollection}
          onChange={(e) => setSelectedCollection(e.target.value)}
          className="w-full sm:w-64 px-3 py-2 rounded-xl bg-surface-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-brand-500/60"
        >
          <option value="all">All Collections ({documents.length})</option>
          {collections.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} ({c.document_count} docs)
            </option>
          ))}
        </select>
      </div>

      {/* Document Table */}
      <div className="rounded-2xl border border-slate-800/80 bg-surface-900 overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-surface-950/60 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <th className="py-3 px-4">Document Title</th>
                <th className="py-3 px-4">Collection</th>
                <th className="py-3 px-4 text-center">Pages</th>
                <th className="py-3 px-4 text-center">Chunks</th>
                <th className="py-3 px-4 text-center">Size</th>
                <th className="py-3 px-4 text-center">Storage</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-xs">
              {filteredDocs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No documents found. Click "Upload Document" to index your first filing.
                  </td>
                </tr>
              ) : (
                filteredDocs.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-slate-200">
                      <div className="flex items-center gap-2.5">
                        <div className="p-1.5 rounded-lg bg-brand-500/10 text-brand-400">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div>
                          <p>{doc.title}</p>
                          <span className="text-[10px] text-slate-400 font-normal">{doc.filename}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-300">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-[11px] text-slate-300">
                        {doc.collection_name || 'FinanceBench'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center text-slate-300 font-mono">
                      {doc.page_count}
                    </td>
                    <td className="py-3.5 px-4 text-center text-brand-400 font-mono font-semibold">
                      {doc.chunk_count}
                    </td>
                    <td className="py-3.5 px-4 text-center text-slate-400 font-mono">
                      {(doc.file_size / 1024).toFixed(1)} KB
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                        <Lock className="w-3 h-3 text-emerald-400" />
                        <span>Private</span>
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleViewDetail(doc.id)}
                          className="p-1.5 text-slate-400 hover:text-brand-400 rounded-lg hover:bg-slate-800 transition-colors"
                          title="Inspect Chunks and Pages"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <a
                          href={`/api/documents/stream/${doc.storage_path}`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 text-slate-400 hover:text-blue-400 rounded-lg hover:bg-slate-800 transition-colors"
                          title="View Original File Preview"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                        <button
                          onClick={() => handleDelete(doc.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors"
                          title="Delete Document"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inspector Modal */}
      <DocumentDetailModal
        isOpen={!!activeDetail}
        onClose={() => setActiveDetail(null)}
        detail={activeDetail}
      />
    </div>
  );
};
