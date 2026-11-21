import React, { useState } from 'react';
import { DisputePack } from '../contracts/types';
import { AlertCircle, CheckCircle, FileText, Copy, Download, HelpCircle, Sparkles, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { firebaseAIAdapter } from '../firebase/aiAdapter';

interface DisputePackViewProps {
  disputePack: DisputePack;
  source?: 'ON_DEVICE' | 'IN_CLOUD' | 'UNKNOWN';
  latencyMs?: number;
}

export const DisputePackView: React.FC<DisputePackViewProps> = ({
  disputePack,
  source = 'IN_CLOUD',
  latencyMs = 1240,
}) => {
  const [copied, setCopied] = useState(false);
  const [helperTerm, setHelperTerm] = useState('');
  const [helperResult, setHelperResult] = useState<string | null>(null);
  const [expandedClauseIdx, setExpandedClauseIdx] = useState<number | null>(0);

  const copyAppealLetter = () => {
    navigator.clipboard.writeText(disputePack.draftAppealLetter);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadAppeal = () => {
    const blob = new Blob([disputePack.draftAppealLetter], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Grievance_Appeal_${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExplainTerm = async (termToExplain: string) => {
    setHelperTerm(termToExplain);
    try {
      const res = await firebaseAIAdapter.executeInference({
        featureName: 'explain_term_helper',
        mode: 'PREFER_ON_DEVICE',
        prompt: `Explain term: ${termToExplain}`,
        mockGenerator: (src) => ({
          term: termToExplain,
          plainLanguageExplanation: `In healthcare billing, "${termToExplain}" refers to line-item services that insurers expect as a single bundled procedure. Unbundling results in duplicate reimbursement claims that policyholders can legally contest.`,
          billingContext: `Processed via ${src === 'ON_DEVICE' ? 'On-Device Gemini Nano' : 'Cloud Fallback'}.`,
          recommendedAction: 'Attach the hospital itemized indoor case sheets showing consecutive billing timestamps.',
        }),
      });
      setHelperResult(res.data.plainLanguageExplanation);
    } catch (e: any) {
      setHelperResult(`Could not explain term: ${e?.message}`);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Banner with Route Source & Latency */}
      <div className="bg-white dark:bg-void-card border border-slate-200/90 dark:border-void-border rounded-2xl p-5 sm:p-6 flex flex-wrap items-center justify-between gap-4 shadow-sm">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs px-2.5 py-0.5 rounded-full font-mono font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 flex items-center gap-1">
              <Check className="h-3 w-3" />
              DISPUTE PACK DELIVERED
            </span>
            <span className="text-xs px-2.5 py-0.5 rounded-md font-mono bg-slate-100 dark:bg-void-elevated text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-void-border">
              Route: {source}
            </span>
            <span className="text-xs px-2.5 py-0.5 rounded-md font-mono bg-slate-100 dark:bg-void-elevated text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-void-border">
              Latency: {latencyMs}ms
            </span>
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white mt-2 tracking-tight">
            Executive Claim & Billing Audit Analysis
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Real identities and verified original dates were safely restored locally on your device after cloud reasoning.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={copyAppealLetter}
            className="btn-tactile px-4 py-2 bg-slate-100 dark:bg-void-elevated hover:bg-slate-200 dark:hover:bg-void-card text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-xl border border-slate-200 dark:border-void-border flex items-center space-x-1.5 transition"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
            <span>{copied ? 'Copied Appeal!' : 'Copy Appeal'}</span>
          </button>
          <button
            onClick={downloadAppeal}
            className="btn-tactile px-4 py-2 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl flex items-center space-x-1.5 transition shadow shadow-cyan-500/20"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Download Appeal</span>
          </button>
        </div>
      </div>

      {/* Executive Summary */}
      <div className="bg-white dark:bg-void-card border border-slate-200/90 dark:border-void-border rounded-2xl p-5 sm:p-6 shadow-sm">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
          Plain-Language Assessment
        </h3>
        <p className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed bg-slate-50 dark:bg-void-950/60 p-4 rounded-xl border border-slate-200/70 dark:border-void-border">
          {disputePack.summary}
        </p>
      </div>

      {/* Itemized Billing Audit Findings */}
      <div className="bg-white dark:bg-void-card border border-slate-200/90 dark:border-void-border rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-amber-500" />
          Detected Billing Discrepancies ({disputePack.findings.length})
        </h3>
        <div className="space-y-3">
          {disputePack.findings.map((finding) => (
            <div
              key={finding.findingId}
              className="p-4 rounded-xl bg-slate-50 dark:bg-void-950/70 border border-slate-200/90 dark:border-void-border flex flex-col md:flex-row md:items-start justify-between gap-4 transition hover:border-slate-300 dark:hover:border-cyan-800/60"
            >
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[11px] px-2.5 py-0.5 rounded-full font-mono font-bold bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
                    {finding.type.replace(/_/g, ' ')}
                  </span>
                  {finding.lineItemRef && (
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                      Ref: {finding.lineItemRef}
                    </span>
                  )}
                  {finding.claimedAmount && (
                    <span className="text-xs font-semibold text-rose-600 dark:text-rose-400 font-mono">
                      Amount: {finding.currency} {finding.claimedAmount}
                    </span>
                  )}
                </div>
                <p className="text-sm text-slate-800 dark:text-slate-200 font-medium">
                  {finding.description}
                </p>
                {finding.evidenceQuotes.length > 0 && (
                  <div className="text-xs text-slate-600 dark:text-slate-400 italic bg-white dark:bg-void-card p-2.5 rounded-lg border border-slate-200/80 dark:border-void-border">
                    &ldquo;{finding.evidenceQuotes.join(' ')}&rdquo;
                  </div>
                )}
              </div>

              <button
                onClick={() => handleExplainTerm(finding.type.replace(/_/g, ' '))}
                className="btn-tactile text-xs text-cyan-700 dark:text-cyan-300 hover:text-cyan-800 flex items-center space-x-1.5 shrink-0 bg-white dark:bg-void-card px-3 py-2 rounded-xl border border-slate-200 dark:border-void-border shadow-sm font-medium"
              >
                <HelpCircle className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-400" />
                <span>Explain Term (PREFER_ON_DEVICE)</span>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Helper Explanation Modal / Inline Box */}
      {helperResult && (
        <div className="bg-gradient-to-r from-cyan-50 to-indigo-50 dark:from-cyan-950/60 dark:to-void-card border border-cyan-300 dark:border-cyan-800/80 rounded-2xl p-5 animate-token-pop shadow-md">
          <div className="flex items-center justify-between pb-2 border-b border-cyan-200 dark:border-cyan-900/60">
            <span className="text-xs font-bold text-cyan-900 dark:text-cyan-300 uppercase flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
              On-Device Term Helper: {helperTerm}
            </span>
            <button
              onClick={() => setHelperResult(null)}
              className="text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 font-bold"
            >
              Close
            </button>
          </div>
          <p className="text-xs text-slate-800 dark:text-slate-200 mt-2.5 leading-relaxed">
            {helperResult}
          </p>
        </div>
      )}

      {/* Policy Clause Accordion Analysis */}
      {disputePack.policyClauseAnalysis.length > 0 && (
        <div className="bg-white dark:bg-void-card border border-slate-200/90 dark:border-void-border rounded-2xl p-5 sm:p-6 shadow-sm space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Policy Clause Mapping & Legal Grounds
          </h3>
          <div className="space-y-2">
            {disputePack.policyClauseAnalysis.map((clause, idx) => {
              const isOpen = expandedClauseIdx === idx;
              return (
                <div
                  key={clause.clauseId}
                  className="rounded-xl border border-slate-200 dark:border-void-border bg-slate-50 dark:bg-void-950/60 overflow-hidden"
                >
                  <button
                    onClick={() => setExpandedClauseIdx(isOpen ? null : idx)}
                    className="w-full p-4 flex items-center justify-between text-left"
                  >
                    <div>
                      <span className="text-xs font-bold text-cyan-700 dark:text-cyan-400 font-mono mr-2">
                        {clause.clauseId}:
                      </span>
                      <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                        {clause.clauseTitle}
                      </span>
                    </div>
                    {isOpen ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
                  </button>
                  {isOpen && (
                    <div className="px-4 pb-4 pt-1 text-xs text-slate-600 dark:text-slate-300 space-y-2 border-t border-slate-200/60 dark:border-void-border">
                      <p><strong>Insurer Denial Allegation:</strong> {clause.denialReasonMatched}</p>
                      <p><strong>Dispute Analysis:</strong> {clause.analysisReasoning}</p>
                      <span className="inline-block px-2 py-0.5 rounded font-mono font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                        Contest Strength: {clause.disputeStrength}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Restored Grievance Appeal Letter */}
      <div className="bg-white dark:bg-void-card border border-slate-200/90 dark:border-void-border rounded-2xl p-5 sm:p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
            <FileText className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
            Restored Formal Grievance & Appeal Letter
          </h3>
          <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-mono bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
            Real identities safely rehydrated on device
          </span>
        </div>
        <pre className="text-xs text-slate-800 dark:text-slate-200 font-mono whitespace-pre-wrap leading-relaxed bg-slate-50 dark:bg-void-950 p-4 rounded-xl border border-slate-200 dark:border-void-border max-h-96 overflow-y-auto">
          {disputePack.draftAppealLetter}
        </pre>
      </div>

      {/* Supporting Checklist & Disclaimer */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-void-card border border-slate-200/90 dark:border-void-border rounded-2xl p-5 shadow-sm">
          <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
            <CheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            Supporting Document Checklist
          </h4>
          <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-1.5 list-disc list-inside">
            {disputePack.supportingChecklist.map((item, idx) => (
              <li key={idx}>{item}</li>
            ))}
          </ul>
        </div>

        <div className="bg-white dark:bg-void-card border border-slate-200/90 dark:border-void-border rounded-2xl p-5 shadow-sm">
          <h4 className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
            <AlertCircle className="h-4 w-4 text-amber-500" />
            Important Disclaimer
          </h4>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            {disputePack.disclaimerNotice}
          </p>
        </div>
      </div>
    </div>
  );
};
