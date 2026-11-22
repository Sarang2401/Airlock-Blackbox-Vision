import { useEffect, useState } from 'react';
import { AlertTriangle, Download, Fingerprint, RefreshCw, ShieldCheck } from 'lucide-react';
import { receiptLedger } from '../receipts/ledger';
import { verifyReceiptChain, VerificationResult } from '../receipts/verifier';
import { ReceiptEvent } from '../contracts/types';
import { PageHeading } from './PageHeading';
import { PendingPanel, Spinner } from './PendingPanel';
import { downloadText } from './downloadText';
import { useToast } from './ToastProvider';

export function ReceiptsView() {
  const [events, setEvents] = useState<ReceiptEvent[]>([]);
  const [verification, setVerification] = useState<VerificationResult | null>(null);
  const [isVerifying, setIsVerifying] = useState(true);
  const notify = useToast();
  const [verificationRequest, setVerificationRequest] = useState(0);

  useEffect(() => {
    let current = true;
    let request = 0;

    async function verify() {
      const revision = ++request;
      try {
        const snapshot = receiptLedger.getEvents();
        const result = await verifyReceiptChain(snapshot);
        if (!current || revision !== request) return;
        setEvents(snapshot);
        setVerification(result);
      } catch {
        if (!current || revision !== request) return;
        setEvents([]);
        setVerification({ isValid: false, totalEvents: 0, errorDescription: 'Receipt history is unavailable in this browser.' });
      } finally {
        if (current && revision === request) setIsVerifying(false);
      }
    }

    void verify();
    const unsubscribe = receiptLedger.subscribe(() => {
      setIsVerifying(true);
      setVerification(null);
      void verify();
    });
    return () => { current = false; unsubscribe(); };
  }, [verificationRequest]);

  function exportReceipts() {
    try {
      const snapshot = receiptLedger.getEvents();
      downloadText('escrowhealth-privacy-receipts.json', JSON.stringify(snapshot, null, 2), 'application/json');
      notify('Privacy receipt download started.');
    } catch {
      notify('Could not export the receipt history.', 'error');
    }
  }

  return (
    <div className="secondary-page">
      <PageHeading title="Privacy Receipts" description="Inspect the local SHA-256 chain of demo approvals, outcomes, and clipboard exports." actions={
        <>
          <button type="button" className="button button-secondary" disabled={isVerifying} onClick={() => {
            setIsVerifying(true);
            setVerification(null);
            setVerificationRequest((count) => count + 1);
          }}>{isVerifying ? <Spinner /> : <RefreshCw size={16} aria-hidden="true" />} {isVerifying ? 'Verifying…' : 'Verify chain'}</button>
          <button type="button" className="button button-primary" disabled={isVerifying || events.length === 0} onClick={exportReceipts}><Download size={16} aria-hidden="true" /> Export receipts</button>
        </>
      } />
      {verification && (!verification.isValid || events.length > 0 || verificationRequest > 0) && (
        <p className="status-banner animate-receipt-stamp" data-error={!verification.isValid} role="status">
          {verification.isValid ? <ShieldCheck size={18} aria-hidden="true" /> : <AlertTriangle size={18} aria-hidden="true" />}
          {verification.isValid ? `Chain verified · ${verification.totalEvents} ${verification.totalEvents === 1 ? 'event' : 'events'}` : verification.errorDescription}
        </p>
      )}
      <details className="surface section-inset review-details">
        <summary>What verification covers</summary>
        <p className="muted">Verification checks the links and hashes of events in this browser. A prior trusted export is needed to check for missing history. Receipt timestamps come from this device, and sample outcomes record a simulation.</p>
      </details>
      {isVerifying && events.length === 0 && <PendingPanel label="Checking local receipt history…" />}
      {(!isVerifying || events.length > 0) && <section className="surface" aria-label="Receipt history" aria-busy={isVerifying}>
        {events.length === 0 && verification?.isValid ? (
          <div className="empty-state">
            <Fingerprint size={28} aria-hidden="true" />
            <h2>No receipts yet</h2>
            <p className="muted">Approve a sample analysis or copy protected text in Safe Paste to add a receipt.</p>
          </div>
        ) : (
          <ol className="event-list">
            {events.map((event) => (
              <li key={event.eventId}>
                <div className="event-header">
                  <span className="event-kind">{event.eventType.replaceAll('_', ' ')}</span>
                  <code className="event-status">{event.status}</code>
                  <time dateTime={event.timestampIso}>{new Date(event.timestampIso).toLocaleString()}</time>
                </div>
                <p className="muted">Request <code>{event.requestId}</code></p>
                <details className="event-detail">
                  <summary>Inspect hashes</summary>
                  <dl>
                    {event.canonicalRequestHash && <div><dt>Request SHA-256</dt><dd><code>{event.canonicalRequestHash}</code></dd></div>}
                    <div><dt>Event SHA-256</dt><dd><code>{event.eventHash}</code></dd></div>
                    <div><dt>Previous SHA-256</dt><dd><code>{event.previousHash}</code></dd></div>
                  </dl>
                </details>
              </li>
            ))}
          </ol>
        )}
      </section>}
    </div>
  );
}
