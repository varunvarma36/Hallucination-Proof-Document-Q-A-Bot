import React from 'react';
import { 
  LayoutDashboard, 
  Files, 
  FolderGit2, 
  MessageSquareText, 
  SearchCheck, 
  BarChart3, 
  SlidersHorizontal, 
  ActivitySquare,
  Cpu,
  Layers
} from 'lucide-react';

export type NavTab = 
  | 'dashboard'
  | 'documents'
  | 'collections'
  | 'chat'
  | 'evidence'
  | 'evaluation'
  | 'settings'
  | 'health';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  documentCount?: number;
  collectionCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  currentTab, 
  onSelectTab,
  documentCount = 0,
  collectionCount = 0 
}) => {
  const navItems: { id: NavTab; label: string; icon: React.ReactNode; badge?: string | number }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'documents', label: 'Documents', icon: <Files className="w-4 h-4" />, badge: documentCount },
    { id: 'collections', label: 'Collections', icon: <FolderGit2 className="w-4 h-4" />, badge: collectionCount },
    { id: 'chat', label: 'Chat Q&A', icon: <MessageSquareText className="w-4 h-4" /> },
    { id: 'evidence', label: 'Evidence Explorer', icon: <SearchCheck className="w-4 h-4" /> },
    { id: 'evaluation', label: 'Evaluation Suite', icon: <BarChart3 className="w-4 h-4" />, badge: 'FinanceBench' },
    { id: 'settings', label: 'RAG Settings', icon: <SlidersHorizontal className="w-4 h-4" /> },
    { id: 'health', label: 'System Health', icon: <ActivitySquare className="w-4 h-4" /> },
  ];

  return (
    <aside className="w-64 border-r border-slate-800/80 bg-surface-950 flex flex-col justify-between p-4 shrink-0 select-none">
      <div className="space-y-6">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-3">
            Navigation
          </span>
          <nav className="mt-2 space-y-1">
            {navItems.map((item) => {
              const active = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    active
                      ? 'bg-brand-500/10 text-brand-300 border border-brand-500/25 shadow-sm shadow-brand-500/10'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`${active ? 'text-brand-400' : 'text-slate-400'}`}>
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && (
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        active
                          ? 'bg-brand-500/20 text-brand-300'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Technical Architecture Badge */}
        <div className="p-3.5 rounded-xl bg-slate-900/50 border border-slate-800/60 space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
            <Cpu className="w-3.5 h-3.5 text-brand-400" />
            <span>Embedding Backbone</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed font-mono">
            BAAI/bge-small-en-v1.5
          </p>
          <div className="flex items-center gap-1.5 text-[10px] text-brand-400/90 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-400"></span>
            <span>384 Dimensions • FastEmbed</span>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="p-3 rounded-xl bg-surface-900/70 border border-slate-800/60">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-semibold text-slate-200">Supabase + Groq</span>
        </div>
        <p className="text-[10px] text-slate-400 mt-1">
          Zero-hallucination compliance bot verified against SEC 10-K filings.
        </p>
      </div>
    </aside>
  );
};
