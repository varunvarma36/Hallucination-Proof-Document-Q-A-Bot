import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Play, 
  CheckCircle2, 
  XCircle, 
  ShieldAlert, 
  Clock, 
  Sparkles, 
  HelpCircle, 
  Loader2, 
  Layers,
  ArrowRight,
  ExternalLink
} from 'lucide-react';
import { FinanceBenchQuestion, EvaluationSummary } from '../types';
import { api } from '../services/api';

export const EvaluationPage: React.FC = () => {
  const [questions, setQuestions] = useState<FinanceBenchQuestion[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [summary, setSummary] = useState<EvaluationSummary | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'in_domain' | 'out_of_domain'>('all');

  useEffect(() => {
    loadQuestions();
  }, []);

  const loadQuestions = async () => {
    try {
      const q = await api.getBenchmarkQuestions();
      setQuestions(q);
    } catch (e) {
      console.error(e);
    }
  };

  const handleRunEvaluation = async (sampleIds?: string[]) => {
    setIsRunning(true);
    try {
      const res = await api.runEvaluation({ sample_ids: sampleIds });
      setSummary(res);
    } catch (err: any) {
      alert(`Evaluation error: ${err.message || 'Unknown error'}`);
    } finally {
      setIsRunning(false);
    }
  };

  const handleRunOutOfDomainOnly = () => {
    const oodIds = questions.filter(q => q.is_out_of_domain).map(q => q.id);
    handleRunEvaluation(oodIds);
  };

  const filteredResults = summary?.results.filter(r => {
    if (filterType === 'in_domain') return !r.is_out_of_domain;
    if (filterType === 'out_of_domain') return r.is_out_of_domain;
    return true;
  }) || [];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-300 text-[11px] font-semibold mb-1">
            <span>PatronusAI / FinanceBench Benchmark Suite</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-brand-400" />
            <span>Hallucination & Grounding Evaluation</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Real dynamic execution against SEC 10-K filings. Evaluates numerical accuracy, page citation matching, and adversarial abstention.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={handleRunOutOfDomainOnly}
            disabled={isRunning}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 text-xs font-semibold border border-slate-700 transition-all"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
            <span>"I Don't Know" Tests Only</span>
          </button>

          <button
            onClick={() => handleRunEvaluation()}
            disabled={isRunning}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-brand-600/20 transition-all"
          >
            {isRunning ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Running Pipeline...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Run Full Evaluation</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Benchmark Metric Cards */}
      {summary ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Metric 1 */}
          <div className="p-4 rounded-xl bg-surface-900 border border-slate-800 space-y-1">
            <span className="text-[11px] text-slate-400">Answer Accuracy</span>
            <p className="text-xl font-black text-emerald-400">
              {(summary.answer_accuracy * 100).toFixed(1)}%
            </p>
            <span className="text-[10px] text-slate-500">Numerical & Factual</span>
          </div>

          {/* Metric 2 */}
          <div className="p-4 rounded-xl bg-surface-900 border border-slate-800 space-y-1">
            <span className="text-[11px] text-slate-400">Citation Accuracy</span>
            <p className="text-xl font-black text-brand-400">
              {(summary.citation_accuracy * 100).toFixed(1)}%
            </p>
            <span className="text-[10px] text-slate-500">Exact Page Match</span>
          </div>

          {/* Metric 3 */}
          <div className="p-4 rounded-xl bg-surface-900 border border-slate-800 space-y-1">
            <span className="text-[11px] text-slate-400">Retrieval Accuracy</span>
            <p className="text-xl font-black text-blue-400">
              {(summary.retrieval_accuracy * 100).toFixed(1)}%
            </p>
            <span className="text-[10px] text-slate-500">Evidence in Top-K</span>
          </div>

          {/* Metric 4 */}
          <div className="p-4 rounded-xl bg-surface-900 border border-slate-800 space-y-1">
            <span className="text-[11px] text-slate-400">Faithfulness</span>
            <p className="text-xl font-black text-emerald-400">
              {(summary.faithfulness * 100).toFixed(1)}%
            </p>
            <span className="text-[10px] text-slate-500">Zero Hallucination</span>
          </div>

          {/* Metric 5 */}
          <div className="p-4 rounded-xl bg-surface-900 border border-slate-800 space-y-1">
            <span className="text-[11px] text-slate-400">Abstention Accuracy</span>
            <p className="text-xl font-black text-amber-400">
              {(summary.abstention_accuracy * 100).toFixed(1)}%
            </p>
            <span className="text-[10px] text-slate-500">Out-of-Domain Guard</span>
          </div>

          {/* Metric 6 */}
          <div className="p-4 rounded-xl bg-surface-900 border border-slate-800 space-y-1">
            <span className="text-[11px] text-slate-400">Avg Latency</span>
            <p className="text-xl font-black text-slate-200">
              {summary.avg_latency_ms} ms
            </p>
            <span className="text-[10px] text-slate-500">End-to-End</span>
          </div>
        </div>
      ) : (
        <div className="p-6 rounded-2xl bg-surface-900/60 border border-slate-800/80 text-center space-y-3">
          <div className="w-10 h-10 rounded-full bg-brand-500/10 text-brand-400 flex items-center justify-center mx-auto">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-200">Ready for Live Benchmarking</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-lg mx-auto">
              Click <strong>"Run Full Evaluation"</strong> to dynamically execute the RAG pipeline across {questions.length} FinanceBench benchmark questions and calculate real ground-truth accuracy.
            </p>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      {summary && (
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
              filterType === 'all'
                ? 'bg-brand-500/10 text-brand-300 border border-brand-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All Questions ({summary.results.length})
          </button>
          <button
            onClick={() => setFilterType('in_domain')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
              filterType === 'in_domain'
                ? 'bg-brand-500/10 text-brand-300 border border-brand-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            In-Domain Financial ({summary.results.filter(r => !r.is_out_of_domain).length})
          </button>
          <button
            onClick={() => setFilterType('out_of_domain')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
              filterType === 'out_of_domain'
                ? 'bg-amber-500/10 text-amber-300 border border-amber-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            "I Don't Know" Abstention ({summary.results.filter(r => r.is_out_of_domain).length})
          </button>
        </div>
      )}

      {/* Results / Questions Table */}
      <div className="rounded-2xl border border-slate-800 bg-surface-900 overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-surface-950/60 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <th className="py-3 px-4">Test Case & Company</th>
                <th className="py-3 px-4">Question</th>
                <th className="py-3 px-4">Ground Truth</th>
                <th className="py-3 px-4">Model Output</th>
                <th className="py-3 px-4 text-center">Citation</th>
                <th className="py-3 px-4 text-center">Verdict</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-xs">
              {summary ? (
                filteredResults.map((r) => (
                  <tr key={r.question_id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-mono">
                      <span className="font-bold text-slate-200">{r.question_id}</span>
                      <p className="text-[10px] text-slate-400 font-sans">{r.company}</p>
                    </td>
                    <td className="py-3 px-4 text-slate-300 max-w-xs leading-relaxed">
                      {r.question}
                    </td>
                    <td className="py-3 px-4 text-slate-400 max-w-xs leading-relaxed">
                      <p className="line-clamp-2">{r.ground_truth_answer}</p>
                      {r.ground_truth_page && (
                        <span className="text-[10px] text-brand-400 font-mono font-semibold">
                          Expected Page: {r.ground_truth_page}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-200 max-w-xs leading-relaxed">
                      <p className="line-clamp-2">{r.predicted_answer}</p>
                      {r.predicted_pages.length > 0 && (
                        <span className="text-[10px] text-brand-400 font-mono font-semibold">
                          Cited Page: {r.predicted_pages.join(', ')}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {r.is_out_of_domain ? (
                        <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                          N/A (OOD)
                        </span>
                      ) : r.citation_correct ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Exact Match</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20">
                          <XCircle className="w-3 h-3" />
                          <span>Mismatch</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {r.answer_correct ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>PASS</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-400 bg-rose-500/10 px-2.5 py-1 rounded-full border border-rose-500/20">
                          <XCircle className="w-3 h-3" />
                          <span>FAIL</span>
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                questions.map((q) => (
                  <tr key={q.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-300">
                      {q.id}
                      <p className="text-[10px] text-slate-400 font-sans font-normal">{q.company} ({q.year})</p>
                    </td>
                    <td className="py-3 px-4 text-slate-300 max-w-sm">
                      {q.question}
                    </td>
                    <td colSpan={2} className="py-3 px-4 text-slate-400 max-w-md line-clamp-2">
                      {q.ground_truth_answer}
                    </td>
                    <td className="py-3 px-4 text-center text-slate-400 font-mono text-xs">
                      {q.ground_truth_page ? `Page ${q.ground_truth_page}` : 'OOD'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleRunEvaluation([q.id])}
                        disabled={isRunning}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
                      >
                        Run Single
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
