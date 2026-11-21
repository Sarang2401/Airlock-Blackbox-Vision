import React, { useState } from 'react';
import { Eye, ShieldAlert, CheckCircle, Code, Lock, Copy, Check } from 'lucide-react';
import { PreparedRequest } from '../contracts/types';

interface SplitScreenReviewProps {
  originalText: string;
  sanitizedText: string;
  preparedRequest: PreparedRequest;
  requestHash: string;
  isEligible: boolean;
  ineligibilityReason?: string;
  onApproveAndDispatch: () => void;
  isDispatching: boolean;
  discloseHospital: boolean;
  setDiscloseHospital: (val: boolean) => void;
  expandDiagnosis: boolean;
  setExpandDiagnosis: (val: boolean) => void;
}

export const SplitScreenReview: React.FC<SplitScreenReviewProps> = ({
  originalText,
  sanitizedText,
  preparedRequest,
  requestHash,
  isEligible,
  ineligibilityReason,
  onApproveAndDispatch,
  isDispatching,
  discloseHospital,
  setDiscloseHospital,
  expandDiagnosis,
  setExpandDiagnosis,
}) => {
  const [showJsonInspector, setShowJsonInspector] = useState(false);
  const [copiedHash, setCopiedHash] = useState(false);
  const [activeMobileView, setActiveMobileView] = useState<'original' | 'sanitized'>('sanitized');

  const copyHash = () => {
    navigator.clipboard.writeText(requestHash);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  return (
    <div className="bg-white dark:bg-void-card border border-slate-200/90 dark:border-void-border rounded-2xl overflow-hidden shadow-xl shadow-slate-900/5 dark:shadow-void-950/40 transition-colors duration-200">
      {/* Header bar */}
      <div className="px-5 py-4 border-b border-slate-200 dark:border-void-border flex flex-wrap items-center justify-between gap-4 bg-slate-50/80 dark:bg-void-950/70">
        <div>
          <div className="flex items-center space-x-2">
            <div className="h-6 w-6 rounded-lg bg-emerald-500/10 dark:bg-emerald-400/20 flex items-center justify-center">
              <Lock className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base tracking-tight">
              Airlock Privacy Gate & Split-Screen Diff
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Compare raw local paperwork against the sanitized skeleton. No data leaves until explicitly approved.
          </p>
        </div>

        {/* Profile Toggles */}
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <label className="flex items-center space-x-2 cursor-pointer text-slate-700 dark:text-slate-300 select-none bg-white dark:bg-void-elevated px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-void-border">
            <input
              type="checkbox"
              checked={discloseHospital}
              onChange={(e) => setDiscloseHospital(e.target.checked)}
              className="rounded bg-slate-100 dark:bg-void-950 border-slate-300 dark:border-slate-700 text-cyan-600 focus:ring-0"
            />
            <span>Disclose Hospital Name (for tariff audit)</span>
          </label>

          <label className="flex items-center space-x-2 cursor-pointer text-slate-700 dark:text-slate-300 select-none bg-white dark:bg-void-elevated px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-void-border">
            <input
              type="checkbox"
              checked={expandDiagnosis}
              onChange={(e) => setExpandDiagnosis(e.target.checked)}
              className="rounded bg-slate-100 dark:bg-void-950 border-slate-300 dark:border-slate-700 text-cyan-600 focus:ring-0"
            />
            <span>Specific Diagnosis Opt-In</span>
          </label>
        </div>
      </div>

      {/* Mobile Tab Toggle for Diff Panes */}
      <div className="md:hidden flex border-b border-slate-200 dark:border-void-border text-xs font-semibold">
        <button
          onClick={() => setActiveMobileView('original')}
          className={`flex-1 py-2.5 text-center ${
            activeMobileView === 'original'
              ? 'text-rose-600 dark:text-rose-400 border-b-2 border-rose-500 bg-rose-50/50 dark:bg-rose-950/20'
              : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          1. Raw Local Document
        </button>
        <button
          onClick={() => setActiveMobileView('sanitized')}
          className={`flex-1 py-2.5 text-center ${
            activeMobileView === 'sanitized'
              ? 'text-emerald-600 dark:text-emerald-400 border-b-2 border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20'
              : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          2. Sanitized Skeleton
        </button>
      </div>

      {/* Split Panes */}
      <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-200 dark:divide-void-border">
        {/* Left Pane: Raw Local Text */}
        <div className={`p-4 bg-slate-50/50 dark:bg-void-950/40 ${activeMobileView === 'original' ? 'block' : 'hidden md:block'}`}>
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200 dark:border-void-border">
            <span className="text-xs font-bold text-rose-700 dark:text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
              <Eye className="h-3.5 w-3.5" />
              Raw Local Source (Never Leaves Device)
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono bg-slate-200/60 dark:bg-void-elevated px-2 py-0.5 rounded">
              Memory Only
            </span>
          </div>
          <pre className="text-xs text-slate-700 dark:text-slate-300 font-mono whitespace-pre-wrap leading-relaxed max-h-80 overflow-y-auto bg-white dark:bg-void-card/70 p-3.5 rounded-xl border border-slate-200 dark:border-void-border">
            {originalText}
          </pre>
        </div>

        {/* Right Pane: Sanitized Skeleton */}
        <div className={`p-4 bg-white dark:bg-void-950/70 ${activeMobileView === 'sanitized' ? 'block' : 'hidden md:block'}`}>
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200 dark:border-void-border">
            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle className="h-3.5 w-3.5" />
              Sanitized Skeleton (Reviewed For Cloud)
            </span>
            <span className="text-[11px] text-emerald-700 dark:text-emerald-300 font-mono bg-emerald-100/70 dark:bg-emerald-950/70 px-2.5 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-800">
              Session Nonce: {preparedRequest.caseNonce}
            </span>
          </div>
          <pre className="text-xs text-emerald-800 dark:text-emerald-300 font-mono whitespace-pre-wrap leading-relaxed max-h-80 overflow-y-auto bg-emerald-50/40 dark:bg-void-card/90 p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-900/40">
            {sanitizedText}
          </pre>
        </div>
      </div>

      {/* Canonical JSON Inspector Expander */}
      <div className="px-5 py-3 border-t border-slate-200 dark:border-void-border bg-slate-50 dark:bg-void-950/60 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center space-x-2 text-xs font-mono text-slate-600 dark:text-slate-400">
          <span className="font-medium">SHA-256 Envelope Hash:</span>
          <span className="text-cyan-700 dark:text-cyan-400 bg-slate-200/60 dark:bg-void-card px-2 py-0.5 rounded border border-slate-300 dark:border-void-border select-all font-semibold">
            {requestHash.substring(0, 24)}...
          </span>
          <button
            onClick={copyHash}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
            title="Copy Hash"
          >
            {copiedHash ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
          </button>
        </div>

        <button
          onClick={() => setShowJsonInspector(!showJsonInspector)}
          className="text-xs text-slate-600 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-300 flex items-center space-x-1 font-medium transition"
        >
          <Code className="h-3.5 w-3.5" />
          <span>{showJsonInspector ? 'Hide Canonical Payload' : 'Inspect Canonical Payload'}</span>
        </button>
      </div>

      {showJsonInspector && (
        <div className="p-4 bg-slate-900 text-cyan-300 border-t border-slate-200 dark:border-void-border">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-mono font-bold text-slate-400">
              Deterministic Canonical JSON (Sorted Keys)
            </span>
            <button
              onClick={() => navigator.clipboard.writeText(JSON.stringify(preparedRequest, null, 2))}
              className="text-xs text-cyan-400 hover:text-cyan-300"
            >
              Copy JSON
            </button>
          </div>
          <pre className="text-xs font-mono overflow-x-auto max-h-48 p-3 bg-slate-950 rounded-lg border border-slate-800">
            {JSON.stringify(preparedRequest, null, 2)}
          </pre>
        </div>
      )}

      {/* Footer / Approval Action */}
      <div className="p-4 sm:p-5 border-t border-slate-200 dark:border-void-border bg-slate-100/60 dark:bg-void-950 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          {isEligible ? (
            <div className="flex items-center space-x-2 text-xs text-emerald-700 dark:text-emerald-400 font-semibold">
              <CheckCircle className="h-4 w-4 shrink-0 text-emerald-500" />
              <span>Airlock Verified: 0 unredacted direct identifiers detected. Ready for approved reasoning.</span>
            </div>
          ) : (
            <div className="flex items-center space-x-2 text-xs text-amber-700 dark:text-amber-400 font-semibold">
              <ShieldAlert className="h-4 w-4 shrink-0 text-amber-500" />
              <span>Eligibility Restriction: {ineligibilityReason || 'Local review required.'}</span>
            </div>
          )}
        </div>

        <button
          onClick={onApproveAndDispatch}
          disabled={!isEligible || isDispatching}
          className={`btn-tactile px-6 py-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center space-x-2 shadow-lg transition ${
            isEligible && !isDispatching
              ? 'bg-gradient-to-r from-cyan-600 via-indigo-600 to-teal-500 text-white hover:from-cyan-500 hover:to-teal-400 shadow-cyan-500/25'
              : 'bg-slate-200 dark:bg-void-elevated text-slate-400 dark:text-slate-500 cursor-not-allowed border border-slate-300 dark:border-void-border'
          }`}
        >
          <Lock className="h-4 w-4" />
          <span>{isDispatching ? 'Committing Intent & Reasoning...' : 'Approve Exact Request & Dispatch'}</span>
        </button>
      </div>
    </div>
  );
};
