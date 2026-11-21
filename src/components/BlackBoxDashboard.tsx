import React, { useState } from 'react';
import { blackBoxStore, generateRecommendedPolicy } from '../../packages/black-box';
import { Activity, Cpu, Cloud, Zap, Download, RefreshCw, BarChart2, ShieldCheck } from 'lucide-react';

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

  const onDevicePercent = summary.totalCalls > 0 ? Math.round((summary.onDeviceCalls / summary.totalCalls) * 100) : 0;
  const inCloudPercent = summary.totalCalls > 0 ? Math.round((summary.inCloudCalls / summary.totalCalls) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-void-card border border-slate-200/90 dark:border-void-border rounded-2xl p-5 sm:p-6 flex flex-wrap items-center justify-between gap-4 shadow-sm">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="h-8 w-8 rounded-xl bg-cyan-500/10 dark:bg-cyan-400/20 flex items-center justify-center">
              <Activity className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Black Box Hybrid-Inference Observability
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Independent SDK telemetry package. Zero document content collection.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={refreshMetrics}
            className="btn-tactile px-3.5 py-2 bg-slate-100 dark:bg-void-elevated hover:bg-slate-200 dark:hover:bg-void-card text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-xl border border-slate-200 dark:border-void-border flex items-center space-x-1.5 transition"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Refresh</span>
          </button>
          <button
            onClick={handleExportPolicy}
            className="btn-tactile px-4 py-2 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl flex items-center space-x-1.5 transition shadow shadow-cyan-500/20"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export Remote Config Policy</span>
          </button>
        </div>
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-void-card border border-slate-200/90 dark:border-void-border rounded-2xl p-5 shadow-sm">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium block">Total Hybrid Inferences</span>
          <span className="text-2xl font-black text-slate-900 dark:text-white mt-1.5 block tracking-tight">{summary.totalCalls}</span>
          <span className="text-[11px] text-slate-400 mt-1 block font-mono">SDK Flight Requests</span>
        </div>

        <div className="bg-white dark:bg-void-card border border-slate-200/90 dark:border-void-border rounded-2xl p-5 shadow-sm">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium block flex items-center gap-1.5">
            <Cpu className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            On-Device Flights
          </span>
          <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1.5 block tracking-tight">{summary.onDeviceCalls}</span>
          <span className="text-[11px] text-emerald-600/90 dark:text-emerald-400/90 mt-1 block font-mono">
            {onDevicePercent}% of total volume
          </span>
        </div>

        <div className="bg-white dark:bg-void-card border border-slate-200/90 dark:border-void-border rounded-2xl p-5 shadow-sm">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium block flex items-center gap-1.5">
            <Cloud className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
            In-Cloud Flights
          </span>
          <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-1.5 block tracking-tight">{summary.inCloudCalls}</span>
          <span className="text-[11px] text-indigo-600/90 dark:text-indigo-400/90 mt-1 block font-mono">
            {inCloudPercent}% of total volume
          </span>
        </div>

        <div className="bg-white dark:bg-void-card border border-slate-200/90 dark:border-void-border rounded-2xl p-5 shadow-sm">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium block flex items-center gap-1.5">
            <Zap className="h-3.5 w-3.5 text-amber-500" />
            Cloud Calls Avoided
          </span>
          <span className="text-2xl font-black text-amber-500 mt-1.5 block tracking-tight">{summary.cloudCallsAvoided}</span>
          <span className="text-[11px] text-amber-600 dark:text-amber-400/90 mt-1 block">Zero egress completed</span>
        </div>
      </div>

      {/* Visual Route Mix Distribution Bar */}
      <div className="bg-white dark:bg-void-card border border-slate-200/90 dark:border-void-border rounded-2xl p-5 sm:p-6 shadow-sm space-y-3">
        <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          <span className="flex items-center gap-1.5">
            <BarChart2 className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
            Hybrid Route Mix Distribution
          </span>
          <span className="font-mono text-slate-400">Total: {summary.totalCalls} calls</span>
        </div>

        <div className="h-4 w-full bg-slate-100 dark:bg-void-950 rounded-full overflow-hidden flex border border-slate-200 dark:border-void-border">
          <div
            style={{ width: `${onDevicePercent}%` }}
            className="bg-emerald-500 h-full transition-all duration-500"
            title={`On-Device: ${onDevicePercent}%`}
          />
          <div
            style={{ width: `${inCloudPercent}%` }}
            className="bg-indigo-500 h-full transition-all duration-500"
            title={`In-Cloud: ${inCloudPercent}%`}
          />
        </div>

        <div className="flex items-center justify-between text-xs font-mono text-slate-600 dark:text-slate-400 pt-1">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
            On-Device Gemini Nano: {summary.onDeviceCalls} ({onDevicePercent}%)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-indigo-500" />
            Cloud Gemini: {summary.inCloudCalls} ({inCloudPercent}%)
          </span>
        </div>
      </div>

      {/* Latency by Route & Fallback Taxonomy */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-white dark:bg-void-card border border-slate-200/90 dark:border-void-border rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
          <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            Latency Distribution (Nearest-Rank Percentiles)
          </h3>
          <div className="space-y-2.5 text-xs font-medium">
            <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-void-950 rounded-xl border border-slate-200/80 dark:border-void-border">
              <span className="text-slate-600 dark:text-slate-400">Overall p50 Latency</span>
              <span className="font-mono text-cyan-700 dark:text-cyan-300 font-bold">{summary.p50LatencyMs} ms</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-void-950 rounded-xl border border-slate-200/80 dark:border-void-border">
              <span className="text-slate-600 dark:text-slate-400">Overall p95 Latency</span>
              <span className="font-mono text-cyan-700 dark:text-cyan-300 font-bold">{summary.p95LatencyMs} ms</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-void-950 rounded-xl border border-slate-200/80 dark:border-void-border">
              <span className="text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                <Cpu className="h-3.5 w-3.5" />
                On-Device p50 Latency (Nano)
              </span>
              <span className="font-mono text-emerald-700 dark:text-emerald-300 font-bold">{summary.onDeviceP50LatencyMs} ms</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-void-950 rounded-xl border border-slate-200/80 dark:border-void-border">
              <span className="text-indigo-700 dark:text-indigo-400 flex items-center gap-1.5">
                <Cloud className="h-3.5 w-3.5" />
                Cloud p50 Latency
              </span>
              <span className="font-mono text-indigo-700 dark:text-indigo-300 font-bold">{summary.inCloudP50LatencyMs} ms</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-void-card border border-slate-200/90 dark:border-void-border rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
          <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            Fallback Reason Taxonomy
          </h3>
          <div className="space-y-2 text-xs">
            {Object.keys(summary.fallbackBreakdown).length === 0 ? (
              <div className="p-6 bg-slate-50 dark:bg-void-950 rounded-xl text-slate-400 dark:text-slate-500 text-center font-mono">
                No route fallbacks observed yet.
              </div>
            ) : (
              Object.entries(summary.fallbackBreakdown).map(([reason, count]) => (
                <div key={reason} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-void-950 rounded-xl border border-slate-200/80 dark:border-void-border">
                  <span className="text-slate-800 dark:text-slate-300 font-mono font-medium">{reason}</span>
                  <span className="font-mono text-amber-600 dark:text-amber-400 font-bold">{count} flights</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Exported Policy Modal / Box */}
      {policyExportJson && (
        <div className="bg-white dark:bg-void-card border border-cyan-300 dark:border-cyan-800 rounded-2xl p-5 sm:p-6 shadow-lg space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-cyan-800 dark:text-cyan-300 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4" />
              Generated Remote Config Policy JSON (Validated)
            </span>
            <button
              onClick={() => setPolicyExportJson(null)}
              className="text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 font-bold"
            >
              Close
            </button>
          </div>
          <pre className="text-xs text-cyan-800 dark:text-cyan-300 font-mono bg-slate-50 dark:bg-void-950 p-4 rounded-xl border border-slate-200 dark:border-void-border overflow-x-auto max-h-60">
            {policyExportJson}
          </pre>
        </div>
      )}
    </div>
  );
};
