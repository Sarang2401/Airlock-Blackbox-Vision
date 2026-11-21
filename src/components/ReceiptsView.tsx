import React, { useState, useEffect } from 'react';
import { receiptLedger } from '../receipts/ledger';
import { verifyReceiptChain } from '../receipts/verifier';
import { ReceiptEvent } from '../contracts/types';
import { ShieldCheck, Download, CheckCircle, AlertTriangle, RefreshCw, Lock } from 'lucide-react';

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
      <div className="bg-white dark:bg-void-card border border-slate-200/90 dark:border-void-border rounded-2xl p-5 sm:p-6 flex flex-wrap items-center justify-between gap-4 shadow-sm">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="h-8 w-8 rounded-xl bg-emerald-500/10 dark:bg-emerald-400/20 flex items-center justify-center">
              <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Local Append-Only Privacy Receipts
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Every inference attempt commits an immutable INTENT before dispatch, cryptographically chained with SHA-256.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={loadAndVerify}
            className="btn-tactile px-3.5 py-2 bg-slate-100 dark:bg-void-elevated hover:bg-slate-200 dark:hover:bg-void-card text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-xl border border-slate-200 dark:border-void-border flex items-center space-x-1.5 transition"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Verify Chain</span>
          </button>
          <button
            onClick={handleExportJson}
            disabled={events.length === 0}
            className={`btn-tactile px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition ${
              events.length > 0
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-void-elevated text-slate-400 dark:text-slate-500 cursor-not-allowed'
            }`}
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export Receipts JSON</span>
          </button>
        </div>
      </div>

      {verification && (
        <div
          className={`p-4 rounded-2xl border flex flex-wrap items-center justify-between gap-2 text-xs font-medium animate-receipt-stamp ${
            verification.isValid
              ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
              : 'bg-rose-50 dark:bg-rose-950/60 border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-300'
          }`}
        >
          <div className="flex items-center space-x-2.5">
            {verification.isValid ? (
              <CheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-rose-600 dark:text-rose-400 shrink-0" />
            )}
            <span>
              {verification.isValid
                ? `Cryptographic Chain Verified: ${verification.totalEvents} events consecutively hashed with SHA-256 from Genesis.`
                : `Integrity Failure: ${verification.errorDescription}`}
            </span>
          </div>
          <span className="font-mono text-slate-500 dark:text-slate-400">Ledger v1.0</span>
        </div>
      )}

      <div className="bg-white dark:bg-void-card border border-slate-200/90 dark:border-void-border rounded-2xl overflow-hidden shadow-sm">
        {events.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400 dark:text-slate-500 font-mono space-y-2">
            <Lock className="h-6 w-6 mx-auto text-slate-300 dark:text-slate-600" />
            <p>No receipts recorded in this session yet.</p>
            <p className="text-[11px] text-slate-400">Execute a Bill Decoder flight or Safe Paste copy to append events.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-200 dark:divide-void-border">
            {events.map((ev, idx) => (
              <div key={ev.eventId} className="p-4 sm:p-5 hover:bg-slate-50/70 dark:hover:bg-void-elevated/40 transition space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-slate-400 font-bold">#{idx + 1}</span>
                    <span
                      className={`font-mono font-bold px-2.5 py-0.5 rounded-full text-xs ${
                        ev.eventType === 'INTENT'
                          ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                          : ev.eventType === 'OUTCOME'
                          ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                          : 'bg-cyan-100 dark:bg-cyan-950 text-cyan-800 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-800'
                      }`}
                    >
                      {ev.eventType}
                    </span>
                    <span className="text-slate-700 dark:text-slate-300 font-mono font-semibold">{ev.eventId}</span>
                  </div>

                  <span className="text-slate-400 text-xs font-mono">{ev.timestampIso}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono bg-slate-50 dark:bg-void-950 p-3.5 rounded-xl border border-slate-200/80 dark:border-void-border">
                  <div>
                    <span className="text-slate-400 block text-[11px] mb-0.5">Event SHA-256 Hash:</span>
                    <span className="text-cyan-700 dark:text-cyan-400 select-all truncate block font-semibold">{ev.eventHash}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px] mb-0.5">Previous Block Hash:</span>
                    <span className="text-slate-600 dark:text-slate-400 select-all truncate block">{ev.previousHash}</span>
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
