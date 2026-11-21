import React, { useState, useEffect } from 'react';
import { receiptLedger } from '../receipts/ledger';
import { verifyReceiptChain } from '../receipts/verifier';
import { ReceiptEvent } from '../contracts/types';
import { ShieldCheck, Download, CheckCircle, AlertTriangle, RefreshCw } from 'lucide-react';

export const ReceiptsView: React.FC = () => {
  const [events, setEvents] = useState<ReceiptEvent[]>([]);
  const [verification, setVerification] = useState<{
    isValid: boolean;
    totalEvents: number;
    errorDescription?: string;
  } | null>(null);

  const loadAndVerify = async () => {
    const list = receiptLedger.getEvents();
    setEvents(list);
    const ver = await verifyReceiptChain(list);
    setVerification(ver);
  };

  useEffect(() => {
    loadAndVerify();
  }, []);

  const handleExportJson = () => {
    const blob = new Blob([JSON.stringify(events, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Airlock_Privacy_Receipts_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <ShieldCheck className="h-5 w-5 text-emerald-400" />
            <h2 className="text-xl font-bold text-white">Local Append-Only Privacy Receipts</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Every application inference attempt commits an immutable INTENT before dispatch, cryptographically chained with SHA-256.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={loadAndVerify}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 flex items-center space-x-1.5 transition"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Verify Chain</span>
          </button>
          <button
            onClick={handleExportJson}
            disabled={events.length === 0}
            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg flex items-center space-x-1.5 transition shadow"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export Receipts JSON</span>
          </button>
        </div>
      </div>

      {/* Chain Integrity Badge */}
      {verification && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between text-xs font-medium ${
            verification.isValid
              ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300'
              : 'bg-rose-950/60 border-rose-800 text-rose-300'
          }`}
        >
          <div className="flex items-center space-x-2">
            {verification.isValid ? (
              <CheckCircle className="h-4 w-4 text-emerald-400" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-rose-400" />
            )}
            <span>
              {verification.isValid
                ? `Cryptographic Chain Verified: ${verification.totalEvents} events consecutively hashed with SHA-256 from Genesis.`
                : `Integrity Failure: ${verification.errorDescription}`}
            </span>
          </div>
          <span className="font-mono text-slate-400">Ledger v1.0</span>
        </div>
      )}

      {/* Receipts Table / List */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        {events.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500 font-mono">
            No receipts recorded yet. Execute a Bill Decoder dispatch or Safe Paste copy to record events.
          </div>
        ) : (
          <div className="divide-y divide-slate-800/80">
            {events.map((ev, idx) => (
              <div key={ev.eventId} className="p-4 bg-slate-950/50 hover:bg-slate-900/60 transition space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-slate-500">#{idx + 1}</span>
                    <span
                      className={`font-mono font-bold px-2 py-0.5 rounded text-xs ${
                        ev.eventType === 'INTENT'
                          ? 'bg-amber-950 text-amber-300 border border-amber-800'
                          : ev.eventType === 'OUTCOME'
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          : 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                      }`}
                    >
                      {ev.eventType}
                    </span>
                    <span className="text-slate-300 font-mono">{ev.eventId}</span>
                  </div>

                  <span className="text-slate-500 text-xs font-mono">{ev.timestampIso}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono bg-slate-900/80 p-3 rounded-lg border border-slate-800">
                  <div>
                    <span className="text-slate-500 block">Event Hash:</span>
                    <span className="text-cyan-400 select-all truncate block">{ev.eventHash}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Previous Hash:</span>
                    <span className="text-slate-400 select-all truncate block">{ev.previousHash}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
