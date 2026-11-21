import React, { useState } from 'react';
import { Copy, Terminal, Check, ShieldCheck } from 'lucide-react';
import { runDeterministicDetectors } from '../airlock/deterministic';
import { transformCaseDocuments } from '../airlock/transformation';
import { normalizeDocumentText } from '../ingestion/normalizer';
import { receiptLedger } from '../receipts/ledger';

export const SafePasteView: React.FC = () => {
  const [inputPrompt, setInputPrompt] = useState(
    'Please draft an email to client Dr. Rajesh Sharma (Aadhaar 4829 1049 2812, Phone +91 98201 44512) explaining that claim CLM-992810 under policy POL-44829104 at Apex Hospital is being reviewed.'
  );
  const [sanitizedPrompt, setSanitizedPrompt] = useState('');
  const [botResponse, setBotResponse] = useState('');
  const [rehydratedResponse, setRehydratedResponse] = useState('');
  const [copied, setCopied] = useState(false);
  const [activeMap, setActiveMap] = useState<any>(null);

  const handleSanitize = () => {
    const doc = normalizeDocumentText('safepaste_doc', 'NOTES', 'Prompt', inputPrompt);
    const findings = runDeterministicDetectors('safepaste_doc', doc.normalizedText);
    const result = transformCaseDocuments('safepaste_case', [doc], findings, {
      discloseHospital: false,
      expandDiagnosis: false,
    });

    setSanitizedPrompt(result.sanitizedDocuments[0].sanitizedText);
    setActiveMap(result.transformationMap);
  };

  const handleCopySanitized = async () => {
    if (!sanitizedPrompt) return;
    await navigator.clipboard.writeText(sanitizedPrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);

    await receiptLedger.appendEvent({
      eventType: 'CLIPBOARD_EXPORT',
      caseId: activeMap?.caseId || 'safepaste_case',
      requestId: `clip_${Date.now()}`,
      sanitizedPayloadLength: sanitizedPrompt.length,
      status: 'SUCCESS',
    });
  };

  const handleRehydrate = () => {
    if (!botResponse || !activeMap) return;

    let restored = botResponse;
    for (const [token, original] of Object.entries(activeMap.placeholders)) {
      const escaped = (token as string).replace(/[[\]]/g, '\\$&');
      restored = restored.replace(new RegExp(escaped, 'g'), () => original as string);
    }
    setRehydratedResponse(restored);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="bg-white dark:bg-void-card border border-slate-200/90 dark:border-void-border rounded-2xl p-5 sm:p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-2.5">
            <div className="h-8 w-8 rounded-xl bg-cyan-500/10 dark:bg-cyan-400/20 flex items-center justify-center">
              <Terminal className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Safe Paste for AI Chatbots
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Protect patient and client identities before pasting prompts into ChatGPT, Claude, or Gemini.
              </p>
            </div>
          </div>
          <span className="text-xs px-2.5 py-1 rounded-full font-mono font-bold bg-cyan-100 dark:bg-cyan-950 text-cyan-800 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-800">
            Problem 3.2 Solution
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-white dark:bg-void-card border border-slate-200/90 dark:border-void-border rounded-2xl p-5 space-y-3 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              1. Sensitive Prompt (Raw Local)
            </span>
            <button
              onClick={handleSanitize}
              className="btn-tactile text-xs px-3.5 py-1.5 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white rounded-xl font-bold transition shadow-sm"
            >
              Sanitize Prompt
            </button>
          </div>
          <textarea
            aria-label="Sensitive Prompt Input"
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
            rows={5}
            className="w-full bg-slate-50 dark:bg-void-950 text-xs font-mono text-slate-800 dark:text-slate-200 p-3.5 rounded-xl border border-slate-200 dark:border-void-border focus:outline-none focus:border-cyan-500"
            placeholder="Paste your sensitive prompt here..."
          />
          <span className="text-[11px] text-slate-400 block font-mono">
            Evaluates phone, Aadhaar, PAN, policy numbers locally.
          </span>
        </div>

        <div className="bg-white dark:bg-void-card border border-slate-200/90 dark:border-void-border rounded-2xl p-5 space-y-3 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4" />
              2. Sanitized Prompt for Chatbot
            </span>
            <button
              onClick={handleCopySanitized}
              disabled={!sanitizedPrompt}
              className={`btn-tactile text-xs px-3.5 py-1.5 rounded-xl font-bold flex items-center space-x-1.5 transition ${
                sanitizedPrompt
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-void-elevated text-slate-400 dark:text-slate-500 cursor-not-allowed border border-slate-200 dark:border-void-border'
              }`}
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copied ? 'Copied with Receipt!' : 'Copy with Receipt'}</span>
            </button>
          </div>
          <textarea
            aria-label="Sanitized Prompt for Chatbot"
            value={sanitizedPrompt}
            readOnly
            rows={5}
            className="w-full bg-slate-50 dark:bg-void-950 text-xs font-mono text-emerald-800 dark:text-emerald-300 p-3.5 rounded-xl border border-slate-200 dark:border-void-border focus:outline-none"
            placeholder="Click 'Sanitize Prompt' to generate safe text..."
          />
          <span className="text-[11px] text-slate-400 block font-mono">
            Copies to clipboard and commits a CLIPBOARD_EXPORT receipt.
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
        <div className="bg-white dark:bg-void-card border border-slate-200/90 dark:border-void-border rounded-2xl p-5 space-y-3 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              3. Paste Chatbot Response
            </span>
            <button
              onClick={handleRehydrate}
              disabled={!botResponse || !activeMap}
              className={`btn-tactile text-xs px-3.5 py-1.5 rounded-xl font-bold transition ${
                botResponse && activeMap
                  ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-void-elevated text-slate-400 dark:text-slate-500 cursor-not-allowed'
              }`}
            >
              Restore Real Data Locally
            </button>
          </div>
          <textarea
            aria-label="Chatbot Response with Placeholders"
            value={botResponse}
            onChange={(e) => setBotResponse(e.target.value)}
            rows={5}
            className="w-full bg-slate-50 dark:bg-void-950 text-xs font-mono text-slate-800 dark:text-slate-200 p-3.5 rounded-xl border border-slate-200 dark:border-void-border focus:outline-none focus:border-indigo-500"
            placeholder="Paste the external chatbot's reply containing placeholders here..."
          />
        </div>

        <div className="bg-white dark:bg-void-card border border-slate-200/90 dark:border-void-border rounded-2xl p-5 space-y-3 shadow-sm">
          <span className="text-xs font-bold text-cyan-700 dark:text-cyan-400 uppercase tracking-wider block">
            4. Rehydrated Final Result
          </span>
          <textarea
            aria-label="Rehydrated Final Result"
            value={rehydratedResponse}
            readOnly
            rows={5}
            className="w-full bg-slate-50 dark:bg-void-950 text-xs font-mono text-cyan-800 dark:text-cyan-300 p-3.5 rounded-xl border border-slate-200 dark:border-void-border focus:outline-none"
            placeholder="Original identities will be restored safely here on device..."
          />
        </div>
      </div>
    </div>
  );
};
