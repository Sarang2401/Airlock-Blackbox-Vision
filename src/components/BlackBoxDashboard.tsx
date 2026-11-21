import React, { useState } from 'react';
import { blackBoxStore, generateRecommendedPolicy } from '../../packages/black-box';
import { Activity, Cpu, Cloud, Zap, Download, RefreshCw } from 'lucide-react';

export const BlackBoxDashboard: React.FC = () => {
  const [summary, setSummary] = useState(blackBoxStore.computeSummary());
  const [policyExportJson, setPolicyExportJson] = useState<string | null>(null);

  const refreshMetrics = () => {
    setSummary(blackBoxStore.computeSummary());
  };

  const handleExportPolicy = () => {
    const policy = generateRecommendedPolicy(summary);
    setPolicyExportJson(JSON.stringify(policy, null, 2));
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Activity className="h-5 w-5 text-cyan-400" />
            <h2 className="text-xl font-bold text-white">Black Box Hybrid-Inference Observability</h2>
            <span className="text-xs px-2 py-0.5 rounded font-mono bg-cyan-950 text-cyan-300 border border-cyan-800">
              packages/black-box
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Zero content collection. Measures actual route mix, p50/p95 latency, fallback causes, and exports Remote Config routing policy.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={refreshMetrics}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 flex items-center space-x-1.5 transition"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Refresh</span>
          </button>
          <button
            onClick={handleExportPolicy}
            className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold rounded-lg flex items-center space-x-1.5 transition shadow"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export Remote Config Policy</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <span className="text-xs text-slate-400 font-medium block">Total Hybrid Inferences</span>
          <span className="text-2xl font-bold text-white mt-1 block">{summary.totalCalls}</span>
          <span className="text-xs text-slate-500 mt-1 block">SDK Flights</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <span className="text-xs text-slate-400 font-medium block flex items-center gap-1">
            <Cpu className="h-3.5 w-3.5 text-emerald-400" />
            On-Device Calls
          </span>
          <span className="text-2xl font-bold text-emerald-400 mt-1 block">{summary.onDeviceCalls}</span>
          <span className="text-xs text-emerald-500/80 mt-1 block font-mono">
            {summary.totalCalls > 0 ? `${Math.round((summary.onDeviceCalls / summary.totalCalls) * 100)}% of total` : '0%'}
          </span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <span className="text-xs text-slate-400 font-medium block flex items-center gap-1">
            <Cloud className="h-3.5 w-3.5 text-indigo-400" />
            In-Cloud Calls
          </span>
          <span className="text-2xl font-bold text-indigo-400 mt-1 block">{summary.inCloudCalls}</span>
          <span className="text-xs text-indigo-400/80 mt-1 block font-mono">
            {summary.totalCalls > 0 ? `${Math.round((summary.inCloudCalls / summary.totalCalls) * 100)}% of total` : '0%'}
          </span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <span className="text-xs text-slate-400 font-medium block flex items-center gap-1">
            <Zap className="h-3.5 w-3.5 text-amber-400" />
            Cloud Calls Avoided
          </span>
          <span className="text-2xl font-bold text-amber-400 mt-1 block">{summary.cloudCallsAvoided}</span>
          <span className="text-xs text-amber-500/80 mt-1 block">Zero egress / private</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">
            Latency Distribution (Nearest-Rank Percentiles)
          </h3>
          <div className="space-y-3 text-xs">
            <div className="flex justify-between items-center p-3 bg-slate-950 rounded-lg border border-slate-800">
              <span className="text-slate-400">Overall p50 Latency</span>
              <span className="font-mono text-cyan-300 font-bold">{summary.p50LatencyMs} ms</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-slate-950 rounded-lg border border-slate-800">
              <span className="text-slate-400">Overall p95 Latency</span>
              <span className="font-mono text-cyan-300 font-bold">{summary.p95LatencyMs} ms</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-slate-950 rounded-lg border border-slate-800">
              <span className="text-emerald-400 flex items-center gap-1">
                <Cpu className="h-3.5 w-3.5" />
                On-Device p50 Latency (Gemini Nano)
              </span>
              <span className="font-mono text-emerald-300 font-bold">{summary.onDeviceP50LatencyMs} ms</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-slate-950 rounded-lg border border-slate-800">
              <span className="text-indigo-400 flex items-center gap-1">
                <Cloud className="h-3.5 w-3.5" />
                Cloud p50 Latency (Gemini Cloud)
              </span>
              <span className="font-mono text-indigo-300 font-bold">{summary.inCloudP50LatencyMs} ms</span>
            </div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">
            Fallback Reason Taxonomy
          </h3>
          <div className="space-y-2 text-xs">
            {Object.keys(summary.fallbackBreakdown).length === 0 ? (
              <div className="p-4 bg-slate-950 rounded-lg text-slate-500 text-center font-mono">
                No route fallbacks observed yet.
              </div>
            ) : (
              Object.entries(summary.fallbackBreakdown).map(([reason, count]) => (
                <div key={reason} className="flex justify-between items-center p-3 bg-slate-950 rounded-lg border border-slate-800">
                  <span className="text-slate-300 font-mono">{reason}</span>
                  <span className="font-mono text-amber-400 font-bold">{count} calls</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {policyExportJson && (
        <div className="bg-slate-900 border border-cyan-800 rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-cyan-300">
              Generated Remote Config Policy JSON
            </span>
            <button
              onClick={() => setPolicyExportJson(null)}
              className="text-xs text-slate-400 hover:text-slate-200"
            >
              Close
            </button>
          </div>
          <pre className="text-xs text-cyan-300 font-mono bg-slate-950 p-4 rounded-lg border border-slate-800 overflow-x-auto max-h-60">
            {policyExportJson}
          </pre>
        </div>
      )}
    </div>
  );
};
