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
    <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-900 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            Airlock Privacy Gate &amp; Split-Screen Diff
          </h3>
          <p className="text-xs text-zinc-500 mt-0.5">
            Compare raw local paperwork against the sanitized skeleton. No data leaves until explicitly approved.
          </p>
        </div>

        {/* Profile toggles */}
        <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-600 dark:text-zinc-400">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={discloseHospital}
              onChange={(e) => setDiscloseHospital(e.target.checked)}
              className="rounded border-zinc-300 dark:border-zinc-600 text-emerald-500 focus:ring-emerald-500/40"
            />
            <span>Disclose Hospital Name</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={expandDiagnosis}
              onChange={(e) => setExpandDiagnosis(e.target.checked)}
              className="rounded border-zinc-300 dark:border-zinc-600 text-emerald-500 focus:ring-emerald-500/40"
            />
            <span>Specific Diagnosis Opt-In</span>
          </label>
        </div>
      </div>

      {/* Mobile tab toggle */}
      <div className="md:hidden flex border-b border-zinc-200 dark:border-zinc-800">
        <button
          onClick={() => setActiveMobileView('original')}
          className={`flex-1 py-2.5 text-xs font-medium text-center transition-colors ${
            activeMobileView === 'original'
              ? 'text-zinc-900 dark:text-zinc-50 border-b-2 border-zinc-900 dark:border-zinc-50'
              : 'text-zinc-500 dark:text-zinc-400'
          }`}
        >
          Raw Local Document
        </button>
        <button
          onClick={() => setActiveMobileView('sanitized')}
          className={`flex-1 py-2.5 text-xs font-medium text-center transition-colors ${
            activeMobileView === 'sanitized'
              ? 'text-zinc-900 dark:text-zinc-50 border-b-2 border-zinc-900 dark:border-zinc-50'
              : 'text-zinc-500 dark:text-zinc-400'
          }`}
        >
          Sanitized Skeleton
        </button>
      </div>

      {/* Split panes */}
      <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-zinc-200 dark:divide-zinc-800">
        {/* Left: Raw */}
        <div className={`p-5 bg-zinc-50/50 dark:bg-zinc-950/40 ${activeMobileView === 'original' ? 'block' : 'hidden md:block'}`}>
          <div className="flex items-center justify-between pb-2 mb-3 border-b border-zinc-200 dark:border-zinc-800">
            <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide flex items-center gap-1.5">
              <Eye className="h-3.5 w-3.5" />
              Raw Local Source
            </span>
            <span className="text-xs text-zinc-400 font-mono bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded">
              Memory Only
            </span>
          </div>
          <pre className="font-mono text-xs text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap leading-relaxed bg-zinc-900 dark:bg-zinc-950 rounded-lg border border-zinc-200 dark:border-zinc-800 p-4 max-h-72 overflow-y-auto">
            {originalText}
          </pre>
        </div>

        {/* Right: Sanitized */}
        <div className={`p-5 bg-white dark:bg-zinc-900 ${activeMobileView === 'sanitized' ? 'block' : 'hidden md:block'}`}>
          <div className="flex items-center justify-between pb-2 mb-3 border-b border-zinc-200 dark:border-zinc-800">
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide flex items-center gap-1.5">
              <CheckCircle className="h-3.5 w-3.5" />
              Sanitized Skeleton
            </span>
            <span className="text-xs text-zinc-500 font-mono bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded">
              Nonce: {preparedRequest.caseNonce}
            </span>
          </div>
          <pre className="font-mono text-xs text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap leading-relaxed bg-zinc-900 dark:bg-zinc-950 rounded-lg border border-zinc-200 dark:border-zinc-800 p-4 max-h-72 overflow-y-auto">
            {sanitizedText}
          </pre>
        </div>
      </div>

      {/* Hash footer */}
      <div className="px-6 py-3 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-mono text-zinc-500">
          <span className="font-medium text-zinc-600 dark:text-zinc-400">SHA-256:</span>
          <span className="text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded select-all">
            {requestHash.substring(0, 24)}...
          </span>
          <button
            onClick={copyHash}
            className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
            title="Copy Hash"
          >
            {copiedHash ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
          </button>
        </div>

        <button
          onClick={() => setShowJsonInspector(!showJsonInspector)}
          className="text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 flex items-center gap-1.5 font-medium transition-colors"
        >
          <Code className="h-3.5 w-3.5" />
          <span>{showJsonInspector ? 'Hide Canonical Payload' : 'Inspect Canonical Payload'}</span>
        </button>
      </div>

      {/* JSON inspector */}
      {showJsonInspector && (
        <div className="p-5 bg-zinc-900 dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-800">
          <div className="flex justify-between items-center mb-3">
            <span className="text-xs font-mono font-semibold text-zinc-400">
              Deterministic Canonical JSON (Sorted Keys)
            </span>
            <button
              onClick={() => navigator.clipboard.writeText(JSON.stringify(preparedRequest, null, 2))}
              className="text-xs text-emerald-400 hover:text-emerald-300 font-medium transition-colors"
            >
              Copy JSON
            </button>
          </div>
          <pre className="text-xs font-mono text-zinc-300 overflow-x-auto max-h-48 p-3 bg-black/30 rounded-lg border border-zinc-800">
            {JSON.stringify(preparedRequest, null, 2)}
          </pre>
        </div>
      )}

      {/* Approval footer */}
      <div className="px-6 py-4 border-t border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          {isEligible ? (
            <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
              <CheckCircle className="h-4 w-4 flex-shrink-0" />
              <span>Airlock Verified: 0 unredacted direct identifiers detected. Ready for approved reasoning.</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400 font-medium">
              <ShieldAlert className="h-4 w-4 flex-shrink-0" />
              <span>Eligibility Restriction: {ineligibilityReason || 'Local review required.'}</span>
            </div>
          )}
        </div>

        <button
          onClick={onApproveAndDispatch}
          disabled={!isEligible || isDispatching}
          className={`btn-press h-10 px-5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${
            isEligible && !isDispatching
              ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
              : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500 cursor-not-allowed'
          }`}
        >
          <Lock className="h-4 w-4" />
          <span>{isDispatching ? 'Committing Intent & Reasoning...' : 'Approve Exact Request & Dispatch'}</span>
        </button>
      </div>
    </div>
  );
};
