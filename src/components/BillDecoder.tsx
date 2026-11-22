import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Check, ChevronDown, FileCheck2, FileText, Fingerprint, Layers, LockKeyhole, ScanLine, ShieldCheck } from 'lucide-react';
import { SYNTHETIC_SAMPLE_CASES } from '../ingestion/syntheticSamples';
import { buildSampleDisputePack } from '../ingestion/sampleDisputePack';
import { normalizeDocumentText } from '../ingestion/normalizer';
import { findSampleEntities } from '../ingestion/sampleFindings';
import { transformCaseDocuments } from '../airlock/transformation';
import { classifyCloudEligibility } from '../airlock/eligibility';
import { buildPreparedDisputeRequest, PreparedRequestWithHash } from '../approval/requestBuilder';
import { consentMachine } from '../approval/consentMachine';
import { dispatchDisputePack, DispatchResult } from '../dispatch/dispatcher';
import { ConfirmDialog } from './ConfirmDialog';
import { nextPaint, PendingPanel, Spinner } from './PendingPanel';
import { useToast } from './ToastProvider';
import { SplitScreenReview } from './SplitScreenReview';
import { DisputePackView } from './DisputePackView';
import { CaseSession, DisputePack, CapabilityTier } from '../contracts/types';

interface BillDecoderProps {
  tier: CapabilityTier;
  online: boolean;
  cloudEnabled: boolean;
  previewRevision: number;
  onOpenReceipts: () => void;
}

const documentNames = {
  BILL: 'Itemized bill',
  DENIAL_LETTER: 'Insurer decision',
  POLICY: 'Policy wording',
  DISCHARGE_SUMMARY: 'Discharge summary',
};

const steps = ['Choose a case', 'Review privacy', 'Read the draft'];
const privacySteps = [
  { icon: LockKeyhole, title: 'Original stays here', text: 'The first scan runs in your browser.' },
  { icon: ScanLine, title: 'Review every change', text: 'Compare the protected copy with the original before approving it.' },
  { icon: Fingerprint, title: 'Check the record', text: 'Receipts link your approval to the outcome.' },
];

function PrivacyIllustration({ scanning }: { scanning: boolean }) {
  return (
    <div className="privacy-art" data-scanning={scanning} aria-hidden="true">
      <div className="privacy-art-grid" />
      <div className="privacy-orbit orbit-outer" />
      <div className="privacy-orbit orbit-inner" />
      <div className="privacy-axis axis-horizontal" />
      <div className="privacy-axis axis-vertical" />
      <div className="privacy-chamber">
        <span className="chamber-corner corner-nw" />
        <span className="chamber-corner corner-ne" />
        <span className="chamber-corner corner-sw" />
        <span className="chamber-corner corner-se" />
        <div className="privacy-document">
          <FileText size={23} strokeWidth={1.5} />
          <i /><i /><i /><i />
        </div>
        <span className="privacy-seal"><LockKeyhole size={20} strokeWidth={1.8} /></span>
      </div>
      <span className="art-node node-left" />
      <span className="art-node node-right" />
      <span className="art-node node-bottom" />
    </div>
  );
}

export function BillDecoder({ tier, online, cloudEnabled, previewRevision, onOpenReceipts }: BillDecoderProps) {
  const notify = useToast();
  const [selectedSample, setSelectedSample] = useState(SYNTHETIC_SAMPLE_CASES[0]);
  const [review, setReview] = useState<{ session: CaseSession; prepared: PreparedRequestWithHash; hasResidualWarnings: boolean; previewRevision: number } | null>(null);
  const [result, setResult] = useState<DispatchResult<DisputePack> | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isDispatching, setIsDispatching] = useState(false);
  const [approvalHash, setApprovalHash] = useState<string | null>(null);
  const [discardAction, setDiscardAction] = useState<{ sample: typeof selectedSample } | 'rescan' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const reviewSection = useRef<HTMLDivElement>(null);
  const resultSection = useRef<HTMLDivElement>(null);
  const focusReview = useRef(false);
  const busy = isScanning || isRefreshing || isDispatching;
  const stage = result ? 2 : review ? 1 : 0;

  useEffect(() => {
    const section = result ? resultSection.current : focusReview.current ? reviewSection.current : null;
    focusReview.current = false;
    if (!section?.getClientRects().length) return;
    section.querySelector<HTMLElement>('h2')?.focus({ preventScroll: true });
    section.scrollIntoView({ block: 'start', behavior: 'instant' });
  }, [review, result]);

  async function runDetection(discloseHospital = false, expandDiagnosis = false, moveFocus = true) {
    setIsScanning(true);
    setError(null);
    setResult(null);
    try {
      await nextPaint();
      const scanMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches || document.hidden
        ? Promise.resolve()
        : new Promise<void>((resolve) => window.setTimeout(resolve, 360));
      const documents = selectedSample.documents.map((doc, index) =>
        normalizeDocumentText(`doc_${index + 1}`, doc.kind, doc.displayName, doc.text)
      );
      const findings = documents.flatMap((doc) => findSampleEntities(doc, selectedSample.privacyLabels));
      const caseId = `case_${Date.now()}`;
      const transform = transformCaseDocuments(caseId, documents, findings, { discloseHospital, expandDiagnosis });
      const eligibility = classifyCloudEligibility({
        isOnline: online && tier !== 'TIER_C_OFFLINE',
        isNanoAvailable: tier === 'TIER_A_NANO',
        isCuratedSyntheticSample: true,
        hasUnresolvedResidualWarnings: transform.residualWarnings.length > 0,
        hasRawNarrativeModifications: false,
      });
      const session: CaseSession = {
        caseId,
        caseNonce: transform.transformationMap.caseNonce,
        revision: 1,
        documents,
        findings,
        transformationMap: transform.transformationMap,
        discloseHospital,
        expandDiagnosis,
        capabilityTier: tier,
        isEligibleForCloud: eligibility.isEligibleForCloud && transform.residualWarnings.length === 0,
        ineligibilityReason: transform.residualWarnings.length
          ? 'The local scan found details that still need review.'
          : eligibility.reason,
      };
      const prepared = await buildPreparedDisputeRequest({
        caseSession: session,
        sanitizedDocs: transform.sanitizedDocuments.map((doc, index) => ({
          id: doc.documentId,
          kind: documents[index].kind,
          sanitizedText: doc.sanitizedText,
        })),
        targetCloudModel: 'gemini-2.5-flash',
        promptInstructions: 'Review billing line items and policy wording. Draft an appeal and identify uncertainty.',
        jurisdiction: selectedSample.jurisdiction,
        currency: selectedSample.currency,
      });
      await scanMotion;
      focusReview.current = moveFocus;
      setReview({ session, prepared, hasResidualWarnings: transform.residualWarnings.length > 0, previewRevision });
    } catch {
      setReview(null);
      setError('The local scan could not finish. Try reviewing the case again.');
    } finally {
      setIsScanning(false);
    }
  }

  const canRefresh = Boolean(review && !result && online && tier !== 'TIER_C_OFFLINE' && cloudEnabled
    && !review.hasResidualWarnings && review.previewRevision !== previewRevision);
  const approvalBlock = !online || tier === 'TIER_C_OFFLINE'
    ? 'Offline mode is active. You can still review the protected copy.'
    : !cloudEnabled
      ? 'The simulated cloud route is paused in preview settings.'
      : review?.hasResidualWarnings
        ? 'The local scan found details that still need review.'
        : canRefresh
          ? 'Refresh the protected preview before approving this case.'
          : undefined;

  async function refreshPreview() {
    if (!review || !canRefresh || busy) return;
    setIsRefreshing(true);
    setApprovalHash(null);
    setError(null);
    try {
      const session = { ...review.session, revision: review.session.revision + 1, capabilityTier: tier, isEligibleForCloud: true, ineligibilityReason: undefined };
      const request = review.prepared.request;
      const prepared = await buildPreparedDisputeRequest({
        caseSession: session,
        sanitizedDocs: request.sanitizedDocuments,
        targetCloudModel: request.targetCloudModel,
        promptInstructions: request.promptInstructions,
        jurisdiction: request.jurisdiction,
        currency: request.currency,
      });
      focusReview.current = true;
      setReview({ ...review, session, prepared, previewRevision });
    } catch {
      notify('The preview could not be refreshed. Try again.', 'error');
    } finally {
      setIsRefreshing(false);
    }
  }

  function selectCase(sample: typeof selectedSample) {
    setSelectedSample(sample);
    setReview(null);
    setResult(null);
    setError(null);
  }

  function repeatScan() {
    void runDetection(review?.session.discloseHospital, review?.session.expandDiagnosis);
  }

  async function approve() {
    if (!review || approvalHash !== review.prepared.requestHash || approvalBlock || busy || result || !navigator.onLine) return;
    setApprovalHash(null);
    setIsDispatching(true);
    setError(null);
    const { prepared, session } = review;
    try {
      await nextPaint();
      consentMachine.grantConsent(prepared.requestHash, session.revision);
      const response = await dispatchDisputePack({
        preparedRequest: prepared.request,
        requestHash: prepared.requestHash,
        transformationMap: session.transformationMap,
        mockGenerator: () => buildSampleDisputePack(selectedSample, prepared.request.allowedPlaceholders),
      });
      if (!response.success || !response.rehydratedData) {
        const message = response.error ?? 'The sample analysis did not complete. Try approving again.';
        setError(message);
        notify(message, 'error');
        return;
      }
      setResult(response);
    } catch {
      const message = 'The sample analysis could not finish. Try approving again.';
      setError(message);
      notify(message, 'error');
    } finally {
      setIsDispatching(false);
    }
  }

  return (
    <div className="decoder">
      <section className="decoder-hero" aria-labelledby="decoder-title">
        <div className="hero-copy">
          <p className="eyebrow hero-kicker"><ShieldCheck size={16} aria-hidden="true" /> Private bill review</p>
          <h1 id="decoder-title" tabIndex={-1}>Understand your bill.<br /><em>Keep it private.</em></h1>
          <p>Try a fictional bill or claim decision. See what a protected request contains before running a local simulation.</p>
        </div>
        <PrivacyIllustration scanning={isScanning} />
      </section>

      <ol className="case-progress" aria-label="Bill review progress">
        {steps.map((label, index) => (
          <li key={label} aria-current={index === stage ? 'step' : undefined} data-complete={index < stage}>
            <span className="step-number" aria-hidden="true">{index < stage ? <Check size={15} /> : index + 1}</span>
            <span>{label}</span>
          </li>
        ))}
      </ol>

      <div className="decoder-grid">
        <section className="surface case-card" data-scanning={isScanning} aria-labelledby="case-title">
          <div className="case-heading">
            <span className="feature-icon"><Layers size={21} aria-hidden="true" /></span>
            <div>
              <h2 id="case-title">Choose a sample case</h2>
              <p className="muted">Choose an unchanged sample for a fixture-assisted scan.</p>
            </div>
          </div>
          <label className="field-label" htmlFor="sample-case">Healthcare case</label>
          <div className="select-wrap">
            <select id="sample-case" className="field" value={selectedSample.id} disabled={busy} onChange={(event) => {
              const next = SYNTHETIC_SAMPLE_CASES.find((sample) => sample.id === event.target.value);
              if (!next) return;
              if (result) setDiscardAction({ sample: next });
              else selectCase(next);
            }}>
              {SYNTHETIC_SAMPLE_CASES.map((sample) => (
                <option value={sample.id} key={sample.id}>
                  {sample.jurisdiction === 'IN' ? 'India · Bill and denied claim' : 'US · Emergency room bill'}
                </option>
              ))}
            </select>
            <ChevronDown size={17} aria-hidden="true" />
          </div>
          <div className="case-files">
            <p className="eyebrow">{selectedSample.documents.length} documents <span aria-hidden="true">·</span> {selectedSample.currency}</p>
            <ul>
              {selectedSample.documents.map((doc) => (
                <li key={doc.displayName}><FileText size={15} aria-hidden="true" /> {documentNames[doc.kind]}</li>
              ))}
            </ul>
          </div>
          <div className="case-actions">
            <button type="button" className="button button-primary" disabled={busy} onClick={() => result ? setDiscardAction('rescan') : repeatScan()}>
              {isScanning ? <Spinner /> : <ScanLine size={18} aria-hidden="true" />} {isScanning ? 'Scanning on this device…' : review ? 'Run local scan again' : 'Run local privacy scan'}
              {!isScanning && <ArrowRight size={17} aria-hidden="true" />}
            </button>
          </div>
        </section>

        <aside className="surface privacy-guide" aria-labelledby="privacy-guide-title">
          <h2 id="privacy-guide-title">Privacy at every step</h2>
          <ol>
            {privacySteps.map(({ icon: Icon, title, text }) => (
              <li key={title}>
                <Icon size={18} aria-hidden="true" />
                <div><h3>{title}</h3><p className="muted">{text}</p></div>
              </li>
            ))}
          </ol>
          <button type="button" className="evidence-link" onClick={onOpenReceipts}>
            <FileCheck2 size={17} aria-hidden="true" /> Explore privacy receipts <ArrowRight size={16} aria-hidden="true" />
          </button>
        </aside>
      </div>

      {isScanning && <PendingPanel label="Checking documents on this device…" scan />}
      {review && (
        <div ref={reviewSection} className="focus-region" tabIndex={-1} aria-label="Privacy review">
          <SplitScreenReview
            session={review.session}
            prepared={review.prepared}
            approvalBlock={approvalBlock}
            onRefresh={canRefresh ? () => void refreshPreview() : undefined}
            onApprove={() => setApprovalHash(review.prepared.requestHash)}
            onProfileChange={(discloseHospital, expandDiagnosis) => void runDetection(discloseHospital, expandDiagnosis, false)}
            busy={busy}
            isDispatching={isDispatching}
            completed={Boolean(result)}
          />
        </div>
      )}
      {isDispatching && <PendingPanel label="Recording approval and preparing your sample draft…" />}
      {error && <p className="error-notice" role={review ? undefined : 'alert'}>{error}</p>}
      {approvalHash && review && (
        <ConfirmDialog title="Approve this sample analysis?" description="Approval is for the exact protected request you reviewed. EscrowHealth records a privacy receipt, then runs a local simulation." confirmLabel="Confirm approval" disabled={Boolean(approvalBlock) || busy || approvalHash !== review.prepared.requestHash} onCancel={() => setApprovalHash(null)} onConfirm={() => void approve()}>
          <dl className="confirm-facts">
            <div><dt>Documents in request</dt><dd>{review.prepared.request.sanitizedDocuments.length}</dd></div>
            <div><dt>Request fingerprint</dt><dd><code>{approvalHash}</code></dd></div>
            {(review.session.discloseHospital || review.session.expandDiagnosis) && <div><dt>Optional details included</dt><dd>{[review.session.discloseHospital && 'Hospital name', review.session.expandDiagnosis && 'Specific diagnosis'].filter(Boolean).join(', ')}</dd></div>}
          </dl>
          {approvalBlock && <p className="error-notice" role="status">{approvalBlock}</p>}
        </ConfirmDialog>
      )}
      {discardAction && (
        <ConfirmDialog title="Replace this sample draft?" description="The current draft will be removed from this workspace. Its privacy receipts will stay available." confirmLabel={discardAction === 'rescan' ? 'Scan again' : 'Switch case'} onCancel={() => setDiscardAction(null)} onConfirm={() => {
          if (discardAction === 'rescan') repeatScan();
          else selectCase(discardAction.sample);
          setDiscardAction(null);
        }} />
      )}
      {result?.rehydratedData && (
        <div ref={resultSection} className="focus-region" tabIndex={-1} aria-label="Sample dispute pack">
          <DisputePackView disputePack={result.rehydratedData} source={result.source} latencyMs={result.latencyMs} />
        </div>
      )}
    </div>
  );
}
