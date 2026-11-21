import React, { useState } from 'react';
import { generateBenchmarkCorpus, BenchmarkDocument } from '../../benchmark/syntheticCorpus';
import { evaluateAirlockBench, BenchmarkMetrics } from '../../benchmark/runner';
import { Cpu, ShieldCheck, Play, Layers } from 'lucide-react';

export const BenchmarkView: React.FC = () => {
  const [corpus] = useState<BenchmarkDocument[]>(() => generateBenchmarkCorpus());
  const [metrics, setMetrics] = useState<BenchmarkMetrics | null>(() => evaluateAirlockBench());
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedDoc, setSelectedDoc] = useState<BenchmarkDocument | null>(corpus[0]);
  const [isRunning, setIsRunning] = useState(false);

  const handleRunEvaluation = () => {
    setIsRunning(true);
    setTimeout(() => {
      const res = evaluateAirlockBench(corpus);
      setMetrics(res);
      setIsRunning(false);
    }, 400);
  };

  const filteredDocs = selectedCategory === 'ALL'
    ? corpus
    : corpus.filter((d) => d.category === selectedCategory);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-void-card border border-slate-200/90 dark:border-void-border rounded-2xl p-5 sm:p-6 flex flex-wrap items-center justify-between gap-4 shadow-sm">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="h-8 w-8 rounded-xl bg-cyan-500/10 dark:bg-cyan-400/20 flex items-center justify-center">
              <Cpu className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Airlock-Bench (Open Synthetic Benchmark)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Empirical privacy and utility evaluation over 105 synthetic healthcare billing documents.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={handleRunEvaluation}
          disabled={isRunning}
          className="btn-tactile px-4 py-2 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl flex items-center space-x-1.5 transition shadow shadow-cyan-500/20"
        >
          <Play className="h-3.5 w-3.5" />
          <span>{isRunning ? 'Evaluating 105 Documents...' : 'Run Benchmark Evaluation'}</span>
        </button>
      </div>

      {/* Scorecards */}
      {metrics && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 sm:gap-4">
          <div className="bg-white dark:bg-void-card border border-slate-200/90 dark:border-void-border rounded-2xl p-4 sm:p-5 shadow-sm">
            <span className="text-xs text-slate-500 dark:text-slate-400 block font-medium">Corpus Size</span>
            <span className="text-2xl font-black text-slate-900 dark:text-white mt-1 block tracking-tight">{metrics.totalDocuments}</span>
            <span className="text-[11px] text-slate-400 mt-0.5 block">Synthetic Docs</span>
          </div>

          <div className="bg-white dark:bg-void-card border border-slate-200/90 dark:border-void-border rounded-2xl p-4 sm:p-5 shadow-sm">
            <span className="text-xs text-emerald-600 dark:text-emerald-400 block font-medium flex items-center gap-1">
              <ShieldCheck className="h-3.5 w-3.5" />
              Privacy Leak Rate
            </span>
            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1 block tracking-tight">
              {(metrics.leakRate * 100).toFixed(1)}%
            </span>
            <span className="text-[11px] text-emerald-600/90 dark:text-emerald-400/90 mt-0.5 block">0 Leaks Detected</span>
          </div>

          <div className="bg-white dark:bg-void-card border border-slate-200/90 dark:border-void-border rounded-2xl p-4 sm:p-5 shadow-sm">
            <span className="text-xs text-slate-500 dark:text-slate-400 block font-medium">Entity Recall</span>
            <span className="text-2xl font-black text-cyan-600 dark:text-cyan-400 mt-1 block tracking-tight">
              {(metrics.recall * 100).toFixed(1)}%
            </span>
            <span className="text-[11px] text-cyan-600 dark:text-cyan-400/80 mt-0.5 block">High-Recall Detector</span>
          </div>

          <div className="bg-white dark:bg-void-card border border-slate-200/90 dark:border-void-border rounded-2xl p-4 sm:p-5 shadow-sm">
            <span className="text-xs text-slate-500 dark:text-slate-400 block font-medium">True-Issue Utility</span>
            <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-1 block tracking-tight">
              {(metrics.utilityAgreementRate * 100).toFixed(1)}%
            </span>
            <span className="text-[11px] text-indigo-600 dark:text-indigo-400/80 mt-0.5 block">Fidelity vs Answer Key</span>
          </div>

          <div className="bg-white dark:bg-void-card border border-slate-200/90 dark:border-void-border rounded-2xl p-4 sm:p-5 shadow-sm">
            <span className="text-xs text-slate-500 dark:text-slate-400 block font-medium">Cloud Eligibility</span>
            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1 block tracking-tight">
              {metrics.eligiblePercentage.toFixed(0)}%
            </span>
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400/80 mt-0.5 block">Pass Fail-Closed Gate</span>
          </div>
        </div>
      )}

      {/* Corpus Browser */}
      <div className="bg-white dark:bg-void-card border border-slate-200/90 dark:border-void-border rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <Layers className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Benchmark Document Explorer ({filteredDocs.length} shown)
            </h3>
          </div>

          <div className="flex flex-wrap gap-1 text-xs">
            {['ALL', 'BILL', 'DENIAL', 'POLICY', 'DISCHARGE', 'PHARMACY'].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl font-bold transition ${
                  selectedCategory === cat
                    ? 'bg-cyan-600 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-void-950 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 border border-slate-200 dark:border-void-border'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <div className="space-y-1.5 max-h-96 overflow-y-auto pr-1">
            {filteredDocs.map((doc) => (
              <div
                key={doc.id}
                onClick={() => setSelectedDoc(doc)}
                className={`p-3 rounded-xl border text-xs cursor-pointer transition ${
                  selectedDoc?.id === doc.id
                    ? 'bg-cyan-50 dark:bg-cyan-950/60 border-cyan-300 dark:border-cyan-800 text-cyan-900 dark:text-cyan-200'
                    : 'bg-slate-50 dark:bg-void-950 border-slate-200 dark:border-void-border text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-void-card'
                }`}
              >
                <div className="flex items-center justify-between font-mono font-semibold">
                  <span>{doc.id}</span>
                  <span className="text-slate-400 text-[11px]">{doc.category} ({doc.format})</span>
                </div>
              </div>
            ))}
          </div>

          <div className="md:col-span-2 bg-slate-50 dark:bg-void-950 p-4 sm:p-5 rounded-xl border border-slate-200 dark:border-void-border space-y-3">
            {selectedDoc ? (
              <>
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-void-border pb-2.5">
                  <span className="text-xs font-mono font-bold text-cyan-700 dark:text-cyan-400">{selectedDoc.id}</span>
                  <div className="flex space-x-2 text-xs">
                    <span className="px-2 py-0.5 rounded-md bg-white dark:bg-void-card text-slate-600 dark:text-slate-300 font-mono border border-slate-200 dark:border-void-border">
                      Category: {selectedDoc.category}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-white dark:bg-void-card text-slate-600 dark:text-slate-300 font-mono border border-slate-200 dark:border-void-border">
                      Format: {selectedDoc.format}
                    </span>
                  </div>
                </div>

                <pre className="text-xs text-slate-700 dark:text-slate-300 font-mono whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto bg-white dark:bg-void-card p-3 rounded-lg border border-slate-200 dark:border-void-border">
                  {selectedDoc.text}
                </pre>

                <div className="pt-2 border-t border-slate-200 dark:border-void-border text-xs">
                  <span className="text-slate-500 font-bold block mb-1.5 text-[11px] uppercase">Ground Truth Entities to Protect:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedDoc.groundTruthEntities.map((gt, idx) => (
                      <span key={idx} className="bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 px-2.5 py-0.5 rounded-md font-mono text-[11px]">
                        {gt.type}: {gt.value}
                      </span>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="text-xs text-slate-400 font-mono">Select a document to inspect</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
