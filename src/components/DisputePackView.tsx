import React, { useState } from 'react';
import { DisputePack } from '../contracts/types';
import { AlertCircle, CheckCircle, FileText, Copy, Download, HelpCircle, Sparkles } from 'lucide-react';
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
          plainLanguageExplanation: `In healthcare billing, "${termToExplain}" refers to services that insurers often bundle together. When billed separately, it creates an unbundled charge dispute.`,
          billingContext: `Processed via ${src === 'ON_DEVICE' ? 'On-Device Gemini Nano' : 'Cloud Fallback'}.`,
          recommendedAction: 'Request an itemized clinical breakdown from the billing department.',
        }),
      });
      setHelperResult(res.data.plainLanguageExplanation);
    } catch (e: any) {
      setHelperResult(`Could not explain term: ${e?.message}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs px-2.5 py-0.5 rounded-full font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-800">
              DISPUTE PACK READY
            </span>
            <span className="text-xs px-2 py-0.5 rounded font-mono bg-slate-800 text-slate-300">
              Route: {source}
            </span>
            <span className="text-xs px-2 py-0.5 rounded font-mono bg-slate-800 text-slate-300">
              Latency: {latencyMs}ms
            </span>
          </div>
          <h2 className="text-xl font-bold text-white mt-2">Executive Claim & Billing Audit Analysis</h2>
          <p className="text-xs text-slate-400 mt-1">
            Real identities and verified original dates were safely restored locally on your device after cloud reasoning.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={copyAppealLetter}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 flex items-center space-x-1.5 transition"
          >
            <Copy className="h-3.5 w-3.5" />
            <span>{copied ? 'Copied Appeal!' : 'Copy Appeal'}</span>
          </button>
          <button
            onClick={downloadAppeal}
            className="px-3.5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold rounded-lg flex items-center space-x-1.5 transition shadow"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Download Appeal</span>
          </button>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-2">
          Plain-Language Assessment
        </h3>
        <p className="text-sm text-slate-200 leading-relaxed bg-slate-950/60 p-4 rounded-lg border border-slate-800">
          {disputePack.summary}
        </p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-amber-400" />
          Detected Billing Discrepancies ({disputePack.findings.length})
        </h3>
        <div className="space-y-3">
          {disputePack.findings.map((finding) => (
            <div
              key={finding.findingId}
              className="p-4 rounded-lg bg-slate-950 border border-slate-800 flex flex-col md:flex-row md:items-start justify-between gap-3"
            >
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="text-xs px-2 py-0.5 rounded font-mono font-bold bg-rose-950 text-rose-300 border border-rose-800">
                    {finding.type.replace(/_/g, ' ')}
                  </span>
                  {finding.lineItemRef && (
                    <span className="text-xs text-slate-400 font-mono">
                      Ref: {finding.lineItemRef}
                    </span>
                  )}
                </div>
                <p className="text-sm text-slate-200 font-medium">{finding.description}</p>
                {finding.evidenceQuotes.length > 0 && (
                  <div className="text-xs text-slate-400 italic bg-slate-900 p-2 rounded border border-slate-800/80">
                    &ldquo;{finding.evidenceQuotes.join(' ')}&rdquo;
                  </div>
                )}
              </div>

              <button
                onClick={() => handleExplainTerm(finding.type.replace(/_/g, ' '))}
                className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center space-x-1 shrink-0 bg-slate-900 px-2.5 py-1.5 rounded border border-slate-800"
              >
                <HelpCircle className="h-3 w-3" />
                <span>Explain Term (PREFER_ON_DEVICE)</span>
              </button>
            </div>
          ))}
        </div>
      </div>

      {helperResult && (
        <div className="bg-gradient-to-r from-cyan-950/60 to-slate-900 border border-cyan-800/60 rounded-xl p-4 animate-fadeIn">
          <div className="flex items-center justify-between pb-1 border-b border-cyan-900/40">
            <span className="text-xs font-bold text-cyan-300 uppercase flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5" />
              On-Device Term Helper: {helperTerm}
            </span>
            <button
              onClick={() => setHelperResult(null)}
              className="text-xs text-slate-400 hover:text-slate-200"
            >
              Close
            </button>
          </div>
          <p className="text-xs text-slate-200 mt-2 leading-relaxed">{helperResult}</p>
        </div>
      )}

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <FileText className="h-4 w-4 text-cyan-400" />
            Restored Formal Grievance & Appeal Letter
          </h3>
          <span className="text-xs text-emerald-400 font-mono">
            All names, IDs & dates locally restored
          </span>
        </div>
        <pre className="text-xs text-slate-200 font-mono whitespace-pre-wrap leading-relaxed bg-slate-950 p-4 rounded-lg border border-slate-800 max-h-96 overflow-y-auto">
          {disputePack.draftAppealLetter}
        </pre>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />
            Supporting Document Checklist
          </h4>
          <ul className="text-xs text-slate-300 space-y-1.5 list-disc list-inside">
            {disputePack.supportingChecklist.map((item, idx) => (
              <li key={idx}>{item}</li>
            ))}
          </ul>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <AlertCircle className="h-3.5 w-3.5" />
            Important Disclaimer
          </h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            {disputePack.disclaimerNotice}
          </p>
        </div>
      </div>
    </div>
  );
};
