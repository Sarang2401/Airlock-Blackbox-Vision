import { Fragment } from 'react';
import { ArrowRight, Check, ChevronDown, Clipboard, FileText, LockKeyhole, ShieldCheck } from 'lucide-react';
import { PreparedRequestWithHash } from '../approval/requestBuilder';
import { CaseSession } from '../contracts/types';
import { reconcileSpans } from '../airlock/spanReconciliation';
import { Spinner } from './PendingPanel';
import { useToast } from './ToastProvider';

interface SplitScreenReviewProps {
  session: CaseSession;
  prepared: PreparedRequestWithHash;
  approvalBlock?: string;
  onApprove: () => void;
  onRefresh?: () => void;
  onProfileChange: (discloseHospital: boolean, expandDiagnosis: boolean) => void;
  busy: boolean;
  isDispatching: boolean;
  completed: boolean;
}

export function SplitScreenReview({ session, prepared, approvalBlock, onApprove, onRefresh, onProfileChange, busy, isDispatching, completed }: SplitScreenReviewProps) {
  const notify = useToast();
  const { placeholders, reversePlaceholders } = session.transformationMap;
  const protectedCount = Object.keys(placeholders).length;

  async function copy(value: string, label: string) {
    try {
      await navigator.clipboard.writeText(value);
      notify(`${label} copied.`);
    } catch {
      notify(`Could not copy ${label.toLowerCase()}. You can select the text to copy it.`, 'error');
    }
  }

  return (
    <section className="surface review-panel" aria-labelledby="privacy-review-title" aria-busy={busy}>
      <div className="section-inset case-heading">
        <span className="feature-icon animate-token-reveal"><ShieldCheck size={21} aria-hidden="true" /></span>
        <div>
          <h2 id="privacy-review-title" tabIndex={-1}>Review what would be shared</h2>
          <p className="muted">Highlighted details have been replaced or shifted. Compare both copies before approving.</p>
        </div>
      </div>
      <div className="document-diff">
        <section className="diff-pane diff-pane-protected" key={prepared.requestHash}>
          <h3><ShieldCheck size={17} aria-hidden="true" /> Protected copy</h3>
          <div className="protected-text">
            <pre className="document-text" tabIndex={0} aria-label="Protected document text">{prepared.request.sanitizedDocuments.map((doc, index) => (
              <Fragment key={doc.id}>
                {index > 0 && '\n\n'}
                {`Document ${index + 1}\n\n`}
                {doc.sanitizedText.split(/(\[[^\]\r\n]+\])/g).map((part, partIndex) =>
                  Object.hasOwn(placeholders, part) ? <mark key={partIndex}>{part}</mark> : part
                )}
              </Fragment>
            ))}</pre>
          </div>
        </section>
        <section className="diff-pane">
          <h3><FileText size={17} aria-hidden="true" /> Original on this device</h3>
          <pre className="document-text" tabIndex={0} aria-label="Original document text">{session.documents.map((doc, index) => {
            const marks = reconcileSpans(session.findings.filter((finding) => finding.documentId === doc.id))
              .filter((finding) => Object.hasOwn(reversePlaceholders, finding.exactSubstring));
            let cursor = 0;
            const parts = marks.map(({ start, end }) => {
              const prefix = doc.normalizedText.slice(cursor, start);
              cursor = end;
              return <Fragment key={start}>{prefix}<mark>{doc.normalizedText.slice(start, end)}</mark></Fragment>;
            });
            return <Fragment key={doc.id}>{index > 0 && '\n\n'}{`Document ${index + 1}\n\n`}{parts}{doc.normalizedText.slice(cursor)}</Fragment>;
          })}</pre>
        </section>
      </div>
      <p className="redaction-summary muted">{protectedCount} distinct details protected in this sample.</p>
      <details className="review-details section-inset">
        <summary><ChevronDown size={16} aria-hidden="true" /> Request details</summary>
        <fieldset disabled={busy || completed} className="review-preferences">
          <legend className="field-label">Fictional case details</legend>
          <label><input type="checkbox" checked={session.discloseHospital} onChange={(event) => onProfileChange(event.target.checked, session.expandDiagnosis)} /> Include hospital name</label>
          <label><input type="checkbox" checked={session.expandDiagnosis} onChange={(event) => onProfileChange(session.discloseHospital, event.target.checked)} /> Keep specific diagnosis</label>
        </fieldset>
        {completed && <p className="muted">Run another local scan to change which optional details are included.</p>}
        <div className="hash-row">
          <div><p className="field-label">Request fingerprint (SHA-256)</p><code>{prepared.requestHash}</code></div>
          <button type="button" className="button button-secondary" onClick={() => void copy(prepared.requestHash, 'Fingerprint')}>
            <Clipboard size={16} aria-hidden="true" /> Copy hash
          </button>
        </div>
        <pre className="document-text payload-text" tabIndex={0} aria-label="Prepared request JSON">{JSON.stringify(JSON.parse(prepared.canonicalJson), null, 2)}</pre>
        <div className="page-actions">
          <button type="button" className="button button-secondary" onClick={() => void copy(prepared.canonicalJson, 'Canonical JSON')}>Copy canonical JSON</button>
        </div>
      </details>
      <div className="review-footer section-inset" data-action={!completed && (!approvalBlock || Boolean(onRefresh))}>
        <p className="review-status" role="status">
          {completed ? <Check size={18} aria-hidden="true" /> : <LockKeyhole size={18} aria-hidden="true" />}
          <span>{completed ? 'Sample analysis complete. A receipt is available.' : approvalBlock ?? 'Ready for your approval. This demo runs locally.'}</span>
        </p>
        {!completed && onRefresh && (
          <button type="button" className="button button-primary" disabled={busy} onClick={onRefresh}>
            {busy ? <Spinner /> : <ArrowRight size={17} aria-hidden="true" />} {busy ? 'Refreshing…' : 'Refresh protected preview'}
          </button>
        )}
        {!completed && !onRefresh && (
          <button type="button" className="button button-primary" disabled={Boolean(approvalBlock) || busy} onClick={onApprove}>
            {isDispatching ? 'Recording approval…' : 'Approve sample analysis'}
            {isDispatching ? <Spinner /> : <ArrowRight size={17} aria-hidden="true" />}
          </button>
        )}
      </div>
    </section>
  );
}
