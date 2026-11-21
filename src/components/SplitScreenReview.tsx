import React, { useState } from 'react';
import { Eye, ShieldAlert, CheckCircle, Code, Lock } from 'lucide-react';
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

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
      {/* Header bar */}
      <div className="px-5 py-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-950/70">
        <div>
          <div className="flex items-center space-x-2">
            <Lock className="h-5 w-5 text-emerald-400" />
            <h3 className="font-bold text-white text-base">Human Review Gate & Split-Screen Diff</h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Compare raw local document against the exact sanitized skeleton. No data leaves until explicitly approved.
          </p>
        </div>

        {/* Profile Toggles */}
        <div className="flex items-center gap-4 text-xs">
          <label className="flex items-center space-x-2 cursor-pointer text-slate-300">
            <input
              type="checkbox"
              checked={discloseHospital}
              onChange={(e) => setDiscloseHospital(e.target.checked)}
              className="rounded bg-slate-950 border-slate-700 text-cyan-500 focus:ring-0"
            />
            <span>Disclose Hospital Name (for package rate audit)</span>
          </label>

          <label className="flex items-center space-x-2 cursor-pointer text-slate-300">
            <input
              type="checkbox"
              checked={expandDiagnosis}
              onChange={(e) => setExpandDiagnosis(e.target.checked)}
              className="rounded bg-slate-950 border-slate-700 text-cyan-500 focus:ring-0"
            />
            <span>Specific Diagnosis Opt-In</span>
          </label>
        </div>
      </div>

      {/* Split Panes */}
      <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-800">
        {/* Left Pane: Raw Local Text */}
        <div className="p-4 bg-slate-950/40">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800/80">
            <span className="text-xs font-semibold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
              <Eye className="h-3.5 w-3.5" />
              1. What You Uploaded (Remains Strictly Local)
            </span>
            <span className="text-xs text-slate-500 font-mono">Local Memory Only</span>
          </div>
          <pre className="text-xs text-slate-300 font-mono whitespace-pre-wrap leading-relaxed max-h-80 overflow-y-auto bg-slate-900/60 p-3 rounded-lg border border-slate-800">
            {originalText}
          </pre>
        </div>

        {/* Right Pane: Sanitized Skeleton */}
        <div className="p-4 bg-slate-950/80">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800/80">
            <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle className="h-3.5 w-3.5" />
              2. Sanitized Skeleton (Reviewed For Cloud)
            </span>
            <span className="text-xs text-emerald-500 font-mono bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">
              Random Nonce: {preparedRequest.caseNonce}
            </span>
          </div>
          <pre className="text-xs text-emerald-300/90 font-mono whitespace-pre-wrap leading-relaxed max-h-80 overflow-y-auto bg-slate-900/90 p-3 rounded-lg border border-emerald-900/40">
            {sanitizedText}
          </pre>
        </div>
      </div>

      {/* Canonical JSON Inspector Expander */}
      <div className="px-5 py-3 border-t border-slate-800 bg-slate-950/50 flex items-center justify-between">
        <div className="flex items-center space-x-2 text-xs font-mono text-slate-400">
          <span>SHA-256 Envelope Hash:</span>
          <span className="text-cyan-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800 select-all">
            {requestHash.substring(0, 24)}...
          </span>
        </div>

        <button
          onClick={() => setShowJsonInspector(!showJsonInspector)}
          className="text-xs text-slate-400 hover:text-cyan-300 flex items-center space-x-1"
        >
          <Code className="h-3.5 w-3.5" />
          <span>{showJsonInspector ? 'Hide Canonical Payload' : 'Inspect Canonical Payload'}</span>
        </button>
      </div>

      {showJsonInspector && (
        <div className="p-4 bg-slate-950 border-t border-slate-800">
          <pre className="text-xs text-cyan-300 font-mono overflow-x-auto max-h-48 p-3 bg-slate-900 rounded-lg border border-slate-800">
            {JSON.stringify(preparedRequest, null, 2)}
          </pre>
        </div>
      )}

      {/* Footer / Approval Action */}
      <div className="p-4 border-t border-slate-800 bg-slate-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          {isEligible ? (
            <div className="flex items-center space-x-2 text-xs text-emerald-400 font-medium">
              <CheckCircle className="h-4 w-4" />
              <span>Request Verified: 0 unredacted direct identifiers found. Ready for approved reasoning.</span>
            </div>
          ) : (
            <div className="flex items-center space-x-2 text-xs text-amber-400 font-medium">
              <ShieldAlert className="h-4 w-4" />
              <span>Eligibility Restriction: {ineligibilityReason || 'Local review required.'}</span>
            </div>
          )}
        </div>

        <button
          onClick={onApproveAndDispatch}
          disabled={!isEligible || isDispatching}
          className={`px-5 py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center space-x-2 shadow-lg transition ${
            isEligible && !isDispatching
              ? 'bg-gradient-to-r from-cyan-500 to-indigo-600 text-white hover:from-cyan-400 hover:to-indigo-500 shadow-cyan-500/20'
              : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
          }`}
        >
          <Lock className="h-4 w-4" />
          <span>{isDispatching ? 'Persisting Intent & Dispatching...' : 'Approve Exact Request & Dispatch'}</span>
        </button>
      </div>
    </div>
  );
};
