import React from 'react';
import { Shield, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';
import { SystemHealth } from '../types';

interface NavbarProps {
  health: SystemHealth | null;
  onOpenUpload: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ health, onOpenUpload }) => {
  const isHealthy = health?.status === 'healthy';
  const groqConnected = health?.groq.status === 'connected';
  const vectorBackend = health?.active_settings?.VECTOR_BACKEND?.toUpperCase() || 'PGVECTOR';

  return (
    <header className="h-16 border-b border-slate-800 bg-surface-900/80 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-30">
      {/* Brand & Identity */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 via-brand-500 to-emerald-400 p-[1px] shadow-lg shadow-brand-500/20">
          <div className="w-full h-full bg-surface-950 rounded-[11px] flex items-center justify-center">
            <Shield className="w-5 h-5 text-brand-400 animate-pulse" />
          </div>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
              VERIDOC AI
            </h1>
            <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-400 border border-brand-500/20 tracking-wider">
              Enterprise
            </span>
          </div>
          <p className="text-xs text-slate-400 font-medium">Hallucination-Proof Document Intelligence</p>
        </div>
      </div>

      {/* System Status Badges */}
      <div className="flex items-center gap-3">
        {/* Verification Guardrail Badge */}
        <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-950/80 border border-brand-500/30 text-brand-300 text-xs font-medium shadow-sm shadow-brand-950/50">
          <CheckCircle2 className="w-3.5 h-3.5 text-brand-400" />
          <span>Layer-2 Grounding Verifier: Active</span>
        </div>

        {/* Vector Store Badge */}
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700/60 text-slate-300 text-xs">
          <span className="w-2 h-2 rounded-full bg-brand-400"></span>
          <span>Vector: <strong className="text-slate-100">{vectorBackend}</strong></span>
        </div>

        {/* LLM Engine Badge */}
        <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700/60 text-slate-300 text-xs">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>LLM: <strong className="text-slate-100">{groqConnected ? 'Groq Llama-3.3' : 'Local Grounded'}</strong></span>
        </div>

        {/* Upload Button */}
        <button
          onClick={onOpenUpload}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-brand-600 to-emerald-600 hover:from-brand-500 hover:to-emerald-500 text-white text-xs font-semibold shadow-md shadow-brand-600/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <span>+ Ingest Document</span>
        </button>
      </div>
    </header>
  );
};
