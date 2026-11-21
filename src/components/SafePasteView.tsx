import React, { useState } from 'react';
import { Copy, Check, ShieldCheck } from 'lucide-react';
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
      {/* Header card */}
      <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-900 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
              Safe Paste for AI Chatbots
            </h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
              Protect patient and client identities before pasting prompts into ChatGPT, Claude, or Gemini.
            </p>
          </div>
          <span className="text-xs font-mono px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded text-zinc-500">
            Problem 3.2 Solution
          </span>
        </div>
      </div>

      {/* Step cards row 1 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Step 1 */}
        <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-900 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wide text-zinc-400 font-medium">
              Step 1 — Sensitive Prompt
            </span>
            <button
              onClick={handleSanitize}
              className="btn-press bg-emerald-500 hover:bg-emerald-600 text-white px-4 h-8 rounded-md text-xs font-semibold transition-colors"
            >
              Sanitize Prompt
            </button>
          </div>
          <textarea
            aria-label="Sensitive Prompt Input"
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
            rows={5}
            className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg p-3 text-sm font-mono text-zinc-800 dark:text-zinc-200 resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
            placeholder="Paste your sensitive prompt here..."
          />
          <span className="text-xs text-zinc-400 font-mono block">
            Evaluates phone, Aadhaar, PAN, policy numbers locally.
          </span>
        </div>

        {/* Step 2 */}
        <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-900 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wide text-zinc-400 font-medium flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
              Step 2 — Sanitized Prompt
            </span>
            <button
              onClick={handleCopySanitized}
              disabled={!sanitizedPrompt}
              className={`btn-press flex items-center gap-1.5 px-4 h-8 rounded-md text-xs font-semibold transition-colors ${
                sanitizedPrompt
                  ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                  : 'border border-zinc-200 dark:border-zinc-700 text-zinc-400 dark:text-zinc-500 cursor-not-allowed'
              }`}
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copied ? 'Copied!' : 'Copy with Receipt'}</span>
            </button>
          </div>
          <textarea
            aria-label="Sanitized Prompt for Chatbot"
            value={sanitizedPrompt}
            readOnly
            rows={5}
            className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg p-3 text-sm font-mono text-zinc-800 dark:text-zinc-200 resize-none focus:outline-none"
            placeholder="Click 'Sanitize Prompt' to generate safe text..."
          />
          <span className="text-xs text-zinc-400 font-mono block">
            Copies to clipboard and commits a CLIPBOARD_EXPORT receipt.
          </span>
        </div>
      </div>

      {/* Step cards row 2 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Step 3 */}
        <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-900 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wide text-zinc-400 font-medium">
              Step 3 — Paste Chatbot Response
            </span>
            <button
              onClick={handleRehydrate}
              disabled={!botResponse || !activeMap}
              className={`btn-press border px-4 h-8 rounded-md text-xs font-medium transition-colors ${
                botResponse && activeMap
                  ? 'border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                  : 'border-zinc-200 dark:border-zinc-700 text-zinc-400 dark:text-zinc-500 cursor-not-allowed'
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
            className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg p-3 text-sm font-mono text-zinc-800 dark:text-zinc-200 resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
            placeholder="Paste the external chatbot's reply containing placeholders here..."
          />
        </div>

        {/* Step 4 */}
        <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-900 p-5 space-y-3">
          <span className="text-xs uppercase tracking-wide text-zinc-400 font-medium block">
            Step 4 — Rehydrated Final Result
          </span>
          <textarea
            aria-label="Rehydrated Final Result"
            value={rehydratedResponse}
            readOnly
            rows={5}
            className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg p-3 text-sm font-mono text-zinc-800 dark:text-zinc-200 resize-none focus:outline-none"
            placeholder="Original identities will be restored safely here on device..."
          />
        </div>
      </div>
    </div>
  );
};
