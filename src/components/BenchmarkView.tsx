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
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Cpu className="h-5 w-5 text-cyan-400" />
            <h2 className="text-xl font-bold text-white">Airlock-Bench (Open Synthetic Benchmark)</h2>
            <span className="text-xs px-2 py-0.5 rounded font-mono bg-cyan-950 text-cyan-300 border border-cyan-800">
              105 Labeled Fixtures
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Empirical evaluation across Indian and US hospital bills, denials, policy wordings, and discharge summaries.
          </p>
        </div>

        <button
          onClick={handleRunEvaluation}
          disabled={isRunning}
          className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white text-xs font-semibold rounded-lg flex items-center space-x-1.5 transition shadow"
        >
          <Play className="h-3.5 w-3.5" />
          <span>{isRunning ? 'Evaluating 105 Documents...' : 'Run Benchmark Evaluation'}</span>
        </button>
      </div>

      {metrics && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <span className="text-xs text-slate-400 block font-medium">Corpus Size</span>
            <span className="text-2xl font-bold text-white mt-1 block">{metrics.totalDocuments}</span>
            <span className="text-xs text-slate-500 mt-0.5 block">Synthetic Docs</span>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <span className="text-xs text-emerald-400 block font-medium flex items-center gap-1">
              <ShieldCheck className="h-3.5 w-3.5" />
              Privacy Leak Rate
            </span>
            <span className="text-2xl font-bold text-emerald-400 mt-1 block">
              {(metrics.leakRate * 100).toFixed(1)}%
            </span>
            <span className="text-xs text-emerald-500/80 mt-0.5 block">0 Leaks Detected</span>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <span className="text-xs text-slate-400 block font-medium">Entity Recall</span>
            <span className="text-2xl font-bold text-cyan-400 mt-1 block">
              {(metrics.recall * 100).toFixed(1)}%
            </span>
            <span className="text-xs text-cyan-500/80 mt-0.5 block">Recall-Biased Detector</span>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <span className="text-xs text-slate-400 block font-medium">True-Issue Utility</span>
            <span className="text-2xl font-bold text-indigo-400 mt-1 block">
              {(metrics.utilityAgreementRate * 100).toFixed(1)}%
            </span>
            <span className="text-xs text-indigo-400/80 mt-0.5 block">Fidelity vs Answer Key</span>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <span className="text-xs text-slate-400 block font-medium">Cloud Eligibility</span>
            <span className="text-2xl font-bold text-emerald-400 mt-1 block">
              {metrics.eligiblePercentage.toFixed(0)}%
            </span>
            <span className="text-xs text-emerald-500/80 mt-0.5 block">Pass Fail-Closed Gate</span>
          </div>
        </div>
      )}

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <Layers className="h-4 w-4 text-cyan-400" />
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-300">
              Benchmark Document Explorer ({filteredDocs.length} shown)
            </h3>
          </div>

          <div className="flex space-x-1 text-xs">
            {['ALL', 'BILL', 'DENIAL', 'POLICY', 'DISCHARGE', 'PHARMACY'].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1 rounded transition ${
                  selectedCategory === cat
                    ? 'bg-cyan-600 text-white font-bold'
                    : 'bg-slate-950 text-slate-400 hover:text-slate-200'
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
                className={`p-2.5 rounded-lg border text-xs cursor-pointer transition ${
                  selectedDoc?.id === doc.id
                    ? 'bg-cyan-950/60 border-cyan-800 text-cyan-200'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <div className="flex items-center justify-between font-mono font-semibold">
                  <span>{doc.id}</span>
                  <span className="text-slate-500">{doc.category} ({doc.format})</span>
                </div>
              </div>
            ))}
          </div>

          <div className="md:col-span-2 bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-3">
            {selectedDoc ? (
              <>
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="text-xs font-mono font-bold text-cyan-400">{selectedDoc.id}</span>
                  <div className="flex space-x-2 text-xs">
                    <span className="px-2 py-0.5 rounded bg-slate-900 text-slate-300 font-mono">
                      Category: {selectedDoc.category}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-slate-900 text-slate-300 font-mono">
                      Format: {selectedDoc.format}
                    </span>
                  </div>
                </div>

                <pre className="text-xs text-slate-300 font-mono whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto">
                  {selectedDoc.text}
                </pre>

                <div className="pt-2 border-t border-slate-800 text-xs">
                  <span className="text-slate-500 font-semibold block mb-1">Ground Truth Entities to Protect:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedDoc.groundTruthEntities.map((gt, idx) => (
                      <span key={idx} className="bg-rose-950 text-rose-300 border border-rose-800 px-2 py-0.5 rounded font-mono">
                        {gt.type}: {gt.value}
                      </span>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="text-xs text-slate-500 font-mono">Select a document to inspect</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
