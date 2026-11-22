import { useRef, useState } from 'react';
import { Clipboard, Eraser, ScanLine, ShieldCheck, Trash2, Undo2 } from 'lucide-react';
import { transformCaseDocuments } from '../airlock/transformation';
import { normalizeDocumentText } from '../ingestion/normalizer';
import { validateInputBounds } from '../ingestion/bounds';
import { findSafePasteEntities } from '../ingestion/safePasteFindings';
import { receiptLedger } from '../receipts/ledger';
import { TransformationMap } from '../contracts/types';
import { ConfirmDialog } from './ConfirmDialog';
import { PageHeading } from './PageHeading';
import { nextPaint, Spinner } from './PendingPanel';
import { useToast } from './ToastProvider';

const fictionalPrompt = 'Please draft a message about claim CLM-992810 under policy POL-44829104. The contact phone is +91 98201 44512.';

export function SafePasteView() {
  const [inputPrompt, setInputPrompt] = useState(fictionalPrompt);
  const [protectedPrompt, setProtectedPrompt] = useState<{ text: string; map: TransformationMap } | null>(null);
  const [manualSelections, setManualSelections] = useState<string[]>([]);
  const [assistantReply, setAssistantReply] = useState('');
  const [restoredReply, setRestoredReply] = useState('');
  const [scanStatus, setScanStatus] = useState<{ text: string; error?: boolean } | null>(null);
  const [dialog, setDialog] = useState<'copy' | 'clear' | null>(null);
  const [reviewConfirmed, setReviewConfirmed] = useState(false);
  const [busy, setBusy] = useState<'scan' | 'copy' | null>(null);
  const promptInput = useRef<HTMLTextAreaElement>(null);
  const notify = useToast();
  const bounds = validateInputBounds(inputPrompt);
  const protectedCount = protectedPrompt ? Object.keys(protectedPrompt.map.placeholders).length : 0;

  async function sanitize(selections = manualSelections) {
    if (busy || !bounds.valid) return;
    setBusy('scan');
    setProtectedPrompt(null);
    setScanStatus(null);
    setRestoredReply('');
    try {
      await nextPaint();
      const document = normalizeDocumentText('safepaste_doc', 'NOTES', 'Prompt', inputPrompt);
      const findings = findSafePasteEntities(document, selections);
      const transform = transformCaseDocuments('safepaste_case', [document], findings, {
        discloseHospital: false,
        expandDiagnosis: false,
      });
      if (transform.residualWarnings.length) {
        setScanStatus({ text: 'Some sensitive details may remain. Select them in the original prompt and use Mask selection, or edit the original and scan again.', error: true });
        return;
      }
      setProtectedPrompt({ text: transform.sanitizedDocuments[0].sanitizedText, map: transform.transformationMap });
    } catch {
      setScanStatus({ text: 'The local scan could not finish. Try scanning again.', error: true });
    } finally {
      setBusy(null);
    }
  }

  function maskSelection() {
    const field = promptInput.current;
    const selected = field?.value.slice(field.selectionStart, field.selectionEnd).trim().normalize('NFC');
    if (!selected) {
      setScanStatus({ text: 'Select the text you want to mask in the original prompt first.', error: true });
      field?.focus();
      return;
    }
    const selections = [...new Set([...manualSelections, selected])];
    setManualSelections(selections);
    void sanitize(selections);
  }

  async function copyReviewedText() {
    if (!protectedPrompt || !reviewConfirmed || busy) return;
    setDialog(null);
    setBusy('copy');
    try {
      await navigator.clipboard.writeText(protectedPrompt.text);
    } catch {
      notify('Clipboard access is unavailable. Check your browser permissions and try again.', 'error');
      setBusy(null);
      return;
    }
    try {
      await receiptLedger.appendEvent({
        eventType: 'CLIPBOARD_EXPORT',
        caseId: protectedPrompt.map.caseId,
        requestId: `clip_${Date.now()}`,
        sanitizedPayloadLength: protectedPrompt.text.length,
        status: 'SUCCESS',
      });
      notify('Copied. Clipboard receipt recorded.');
    } catch {
      notify('Text copied. The browser could not save a clipboard receipt.', 'error');
    } finally {
      setBusy(null);
    }
  }

  function restore() {
    if (!protectedPrompt || !assistantReply.trim()) return;
    const pattern = /\[[^\]\r\n]+\]/g;
    const restored = assistantReply.replace(pattern, (token) => protectedPrompt.map.placeholders[token] ?? token);
    setRestoredReply(restored);
    if (restored !== assistantReply) notify('Recognized placeholders restored on this device.');
    else notify('No placeholders matched this prompt. Check that the reply came from this session.', 'error');
  }

  function clearSession() {
    setDialog(null);
    setInputPrompt('');
    setProtectedPrompt(null);
    setManualSelections([]);
    setAssistantReply('');
    setRestoredReply('');
    setScanStatus(null);
    notify('Safe Paste session cleared.');
  }

  return (
    <div className="secondary-page">
      <PageHeading title="Safe Paste" description="Mask sensitive details in your browser. Review the result before copying it to another assistant." actions={
        <button type="button" className="button button-secondary" disabled={Boolean(busy) || (!inputPrompt && !assistantReply)} onClick={() => setDialog('clear')}><Trash2 size={16} aria-hidden="true" /> Clear session</button>
      } />
      <div className="tool-grid">
        <section className="surface tool-card">
          <label htmlFor="local-prompt">Original prompt</label>
          <textarea ref={promptInput} className="field" id="local-prompt" rows={6} value={inputPrompt} disabled={Boolean(busy)} onChange={(event) => {
            setInputPrompt(event.target.value);
            setProtectedPrompt(null);
            setManualSelections([]);
            setRestoredReply('');
            setScanStatus(null);
          }} />
          {inputPrompt.trim() && !bounds.valid && <p className="error-notice" role="alert">{bounds.error}</p>}
          <div className="page-actions">
            <button type="button" className="button button-primary" disabled={!bounds.valid || Boolean(busy) || Boolean(protectedPrompt)} onClick={() => void sanitize()}>{busy === 'scan' ? <Spinner /> : <ScanLine size={17} aria-hidden="true" />}{busy === 'scan' ? 'Scanning locally…' : 'Scan for sensitive details'}</button>
            <button type="button" className="button button-secondary" disabled={!bounds.valid || Boolean(busy)} onClick={maskSelection}><Eraser size={16} aria-hidden="true" /> Mask selection</button>
          </div>
          {scanStatus && <p className={scanStatus.error ? 'error-notice' : 'muted'} role={scanStatus.error ? 'alert' : 'status'}>{scanStatus.text}</p>}
        </section>
        <section className="surface tool-card">
          <label htmlFor="protected-prompt"><ShieldCheck size={17} aria-hidden="true" /> Text to review</label>
          <textarea className="field" id="protected-prompt" rows={6} value={protectedPrompt?.text ?? ''} readOnly placeholder="Your scanned text will appear here." />
          {protectedPrompt && <p className="muted" role="status">{protectedCount ? `${protectedCount} distinct details masked.` : 'The scan found no details to mask.'} Check for any names or identifiers that remain. Select them in the original to mask them.</p>}
          <button type="button" className="button button-secondary" disabled={!protectedPrompt || Boolean(busy)} onClick={() => {
            setReviewConfirmed(false);
            setDialog('copy');
          }}>{busy === 'copy' ? <Spinner /> : <Clipboard size={16} aria-hidden="true" />}{busy === 'copy' ? 'Copying…' : 'Review and copy'}</button>
        </section>
        <section className="surface tool-card">
          <label htmlFor="assistant-reply">Assistant reply</label>
          <textarea className="field" id="assistant-reply" rows={6} value={assistantReply} onChange={(event) => {
            setAssistantReply(event.target.value);
            setRestoredReply('');
          }} placeholder="Paste a reply that contains the placeholders." />
          <button type="button" className="button button-secondary" disabled={!assistantReply.trim() || !protectedPrompt || Boolean(busy)} onClick={restore}><Undo2 size={16} aria-hidden="true" /> Restore details locally</button>
        </section>
        <section className="surface tool-card">
          <label htmlFor="restored-reply">Restored reply</label>
          <textarea className="field" id="restored-reply" rows={6} value={restoredReply} readOnly placeholder="The restored reply will appear here." />
          <p className="muted">Keep this tab open and the scanned prompt unchanged until you restore the reply.</p>
        </section>
      </div>
      {dialog === 'copy' && protectedPrompt && (
        <ConfirmDialog title="Copy text to your clipboard?" description="Review the exact text below. An external assistant can receive anything you paste there. The local scan can miss sensitive details." confirmLabel="Copy with receipt" disabled={!reviewConfirmed} onCancel={() => setDialog(null)} onConfirm={() => void copyReviewedText()}>
          <pre className="document-text" tabIndex={0} aria-label="Text to copy">{protectedPrompt.text}</pre>
          <label className="confirm-check"><input type="checkbox" checked={reviewConfirmed} onChange={(event) => setReviewConfirmed(event.target.checked)} /> I checked this text for sensitive details.</label>
        </ConfirmDialog>
      )}
      {dialog === 'clear' && (
        <ConfirmDialog title="Clear this Safe Paste session?" description="This removes the prompt, reply, and placeholder map from this tab. You will need to start a new scan to restore details again." confirmLabel="Clear session" onCancel={() => setDialog(null)} onConfirm={clearSession} />
      )}
    </div>
  );
}
