import React, { useState } from 'react';
import { blackBoxStore, generateRecommendedPolicy } from '../../packages/black-box';
import { Cpu, Cloud, Zap, Download, RefreshCw, BarChart2, ShieldCheck } from 'lucide-react';

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
      {/* Page header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
            Black Box Observability
          </h2>
          <p className="text-sm text-zinc-500 mt-1">
            Hybrid-inference telemetry. Zero document content collection.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={refreshMetrics}
            className="btn-press flex items-center gap-1.5 h-9 px-4 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 text-sm font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Refresh</span>
          </button>
          <button
            onClick={handleExportPolicy}
            className="btn-press flex items-center gap-1.5 h-9 px-4 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold transition-colors"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export Policy</span>
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-900 p-5">
          <span className="text-xs text-zinc-500 font-medium block">Total Hybrid Inferences</span>
          <span className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 mt-2 block">{summary.totalCalls}</span>
          <span className="text-xs text-zinc-400 font-mono mt-1 block">SDK Flight Requests</span>
        </div>

        <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-900 p-5">
          <span className="text-xs text-zinc-500 font-medium flex items-center gap-1.5">
            <Cpu className="h-3.5 w-3.5" />
            On-Device Flights
          </span>
          <span className="text-3xl font-bold tracking-tight text-emerald-500 mt-2 block">{summary.onDeviceCalls}</span>
          <span className="text-xs text-zinc-400 font-mono mt-1 block">{onDevicePercent}% of total volume</span>
        </div>

        <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-900 p-5">
          <span className="text-xs text-zinc-500 font-medium flex items-center gap-1.5">
            <Cloud className="h-3.5 w-3.5" />
            In-Cloud Flights
          </span>
          <span className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 mt-2 block">{summary.inCloudCalls}</span>
          <span className="text-xs text-zinc-400 font-mono mt-1 block">{inCloudPercent}% of total volume</span>
        </div>

        <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-900 p-5">
          <span className="text-xs text-zinc-500 font-medium flex items-center gap-1.5">
            <Zap className="h-3.5 w-3.5" />
            Cloud Calls Avoided
          </span>
          <span className="text-3xl font-bold tracking-tight text-amber-500 mt-2 block">{summary.cloudCallsAvoided}</span>
          <span className="text-xs text-zinc-400 font-mono mt-1 block">Zero egress completed</span>
        </div>
      </div>

      {/* Route mix distribution bar */}
      <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-900 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500 flex items-center gap-1.5">
            <BarChart2 className="h-4 w-4" />
            Hybrid Route Mix Distribution
          </span>
          <span className="text-xs font-mono text-zinc-400">Total: {summary.totalCalls} calls</span>
        </div>

        <div className="h-2 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden flex">
          <div
            style={{ width: `${onDevicePercent}%` }}
            className="bg-emerald-500 h-full transition-all duration-500"
            title={`On-Device: ${onDevicePercent}%`}
          />
          <div
            style={{ width: `${inCloudPercent}%` }}
            className="bg-zinc-400 dark:bg-zinc-500 h-full transition-all duration-500"
            title={`In-Cloud: ${inCloudPercent}%`}
          />
        </div>

        <div className="flex items-center justify-between text-xs font-mono text-zinc-500">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500 flex-shrink-0" />
            On-Device Nano: {summary.onDeviceCalls} ({onDevicePercent}%)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-zinc-400 dark:bg-zinc-500 flex-shrink-0" />
            Cloud: {summary.inCloudCalls} ({inCloudPercent}%)
          </span>
        </div>
      </div>

      {/* Latency + Fallback */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-900 p-6">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500 mb-4">
            Latency Distribution (Nearest-Rank Percentiles)
          </h3>
          <div className="space-y-0">
            <div className="flex justify-between items-center py-3 border-b border-zinc-100 dark:border-zinc-800">
              <span className="text-sm text-zinc-600 dark:text-zinc-400">Overall p50 Latency</span>
              <span className="font-mono text-sm font-semibold text-zinc-900 dark:text-zinc-50">{summary.p50LatencyMs} ms</span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-zinc-100 dark:border-zinc-800">
              <span className="text-sm text-zinc-600 dark:text-zinc-400">Overall p95 Latency</span>
              <span className="font-mono text-sm font-semibold text-zinc-900 dark:text-zinc-50">{summary.p95LatencyMs} ms</span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-zinc-100 dark:border-zinc-800">
              <span className="text-sm text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                <Cpu className="h-3.5 w-3.5" />
                On-Device p50 (Nano)
              </span>
              <span className="font-mono text-sm font-semibold text-emerald-600 dark:text-emerald-400">{summary.onDeviceP50LatencyMs} ms</span>
            </div>
            <div className="flex justify-between items-center py-3 last:border-0">
              <span className="text-sm text-zinc-600 dark:text-zinc-400 flex items-center gap-1.5">
                <Cloud className="h-3.5 w-3.5" />
                Cloud p50 Latency
              </span>
              <span className="font-mono text-sm font-semibold text-zinc-900 dark:text-zinc-50">{summary.inCloudP50LatencyMs} ms</span>
            </div>
          </div>
        </div>

        <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-900 p-6">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500 mb-4">
            Fallback Reason Taxonomy
          </h3>
          {Object.keys(summary.fallbackBreakdown).length === 0 ? (
            <div className="py-8 text-center text-sm text-zinc-400 font-mono">
              No route fallbacks observed yet.
            </div>
          ) : (
            <div className="space-y-0">
              {Object.entries(summary.fallbackBreakdown).map(([reason, count]) => (
                <div key={reason} className="flex justify-between items-center py-3 border-b border-zinc-100 dark:border-zinc-800 last:border-0">
                  <span className="text-sm text-zinc-700 dark:text-zinc-300 font-mono">{reason}</span>
                  <span className="font-mono text-sm font-semibold text-amber-500">{count} flights</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Policy export */}
      {policyExportJson && (
        <div className="bg-zinc-900 dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-500" />
              Generated Remote Config Policy JSON
            </span>
            <button
              onClick={() => setPolicyExportJson(null)}
              className="text-xs text-zinc-400 hover:text-zinc-200 font-medium transition-colors"
            >
              Close
            </button>
          </div>
          <pre className="text-xs text-zinc-300 font-mono p-4 bg-black/30 rounded-lg border border-zinc-800 overflow-x-auto max-h-60">
            {policyExportJson}
          </pre>
        </div>
      )}
    </div>
  );
};
