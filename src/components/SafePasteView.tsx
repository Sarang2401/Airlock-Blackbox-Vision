import React, { useState } from 'react';
import { Copy, Terminal } from 'lucide-react';
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
      restored = restored.replace(new RegExp(escaped, 'g'), original as string);
    }
    setRehydratedResponse(restored);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <div className="flex items-center space-x-2">
          <Terminal className="h-5 w-5 text-cyan-400" />
          <h2 className="text-xl font-bold text-white">Safe Paste for AI Chatbots</h2>
          <span className="text-xs px-2 py-0.5 rounded font-mono bg-cyan-950 text-cyan-300 border border-cyan-800">
            Problem 3.2 Solution
          </span>
        </div>
        <p className="text-xs text-slate-400 mt-1">
          Sanitize prompts before pasting them into external chatbots (ChatGPT, Claude, Gemini).
          Paste the chatbot response back below to restore the real details locally.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300 uppercase">
              1. Sensitive Prompt (Raw Local)
            </span>
            <button
              onClick={handleSanitize}
              className="text-xs px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded font-medium transition"
            >
              Sanitize Prompt
            </button>
          </div>
          <textarea
            aria-label="Sensitive Prompt"
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
            rows={5}
            className="w-full bg-slate-950 text-xs font-mono text-slate-200 p-3 rounded-lg border border-slate-800 focus:outline-none focus:border-cyan-500"
            placeholder="Paste your sensitive prompt here..."
          />
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-400 uppercase">
              2. Sanitized Prompt for Chatbot
            </span>
            <button
              onClick={handleCopySanitized}
              disabled={!sanitizedPrompt}
              className={`text-xs px-3 py-1 rounded font-medium flex items-center space-x-1.5 transition ${
                sanitizedPrompt
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              <Copy className="h-3 w-3" />
              <span>{copied ? 'Copied with Receipt!' : 'Copy with Receipt'}</span>
            </button>
          </div>
          <textarea
            aria-label="Sanitized Prompt"
            value={sanitizedPrompt}
            readOnly
            rows={5}
            className="w-full bg-slate-950 text-xs font-mono text-emerald-300 p-3 rounded-lg border border-slate-800 focus:outline-none"
            placeholder="Click 'Sanitize Prompt' to generate safe text..."
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300 uppercase">
              3. Paste Chatbot Response (Contains Placeholders)
            </span>
            <button
              onClick={handleRehydrate}
              disabled={!botResponse || !activeMap}
              className="text-xs px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded font-medium transition"
            >
              Restore Real Data
            </button>
          </div>
          <textarea
            aria-label="Chatbot Response with Placeholders"
            value={botResponse}
            onChange={(e) => setBotResponse(e.target.value)}
            rows={5}
            className="w-full bg-slate-950 text-xs font-mono text-slate-200 p-3 rounded-lg border border-slate-800 focus:outline-none focus:border-indigo-500"
            placeholder="Paste the external chatbot's reply containing placeholders here..."
          />
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
          <span className="text-xs font-semibold text-cyan-400 uppercase block">
            4. Rehydrated Final Output (Local Device Only)
          </span>
          <textarea
            aria-label="Rehydrated Final Output"
            value={rehydratedResponse}
            readOnly
            rows={5}
            className="w-full bg-slate-950 text-xs font-mono text-cyan-300 p-3 rounded-lg border border-slate-800 focus:outline-none"
            placeholder="Restored text with original identities will appear here..."
          />
        </div>
      </div>
    </div>
  );
};
