import React, { useState } from 'react';
import { SYNTHETIC_SAMPLE_CASES, SyntheticSampleCase } from '../ingestion/syntheticSamples';
import { normalizeDocumentText } from '../ingestion/normalizer';
import { runDeterministicDetectors } from '../airlock/deterministic';
import { transformCaseDocuments } from '../airlock/transformation';
import { classifyCloudEligibility } from '../airlock/eligibility';
import { buildPreparedDisputeRequest } from '../approval/requestBuilder';
import { consentMachine } from '../approval/consentMachine';
import { dispatchDisputePack } from '../dispatch/dispatcher';
import { SplitScreenReview } from './SplitScreenReview';
import { DisputePackView } from './DisputePackView';
import { CaseSession, DisputePack, CapabilityTier } from '../contracts/types';
import { Sparkles, FileText, Shield } from 'lucide-react';

interface BillDecoderProps {
  tier: CapabilityTier;
}

export const BillDecoder: React.FC<BillDecoderProps> = ({ tier }) => {
  const [selectedSample, setSelectedSample] = useState<SyntheticSampleCase>(SYNTHETIC_SAMPLE_CASES[0]);
  const [caseSession, setCaseSession] = useState<CaseSession | null>(null);
  const [sanitizedDocuments, setSanitizedDocuments] = useState<Array<{ documentId: string; sanitizedText: string }>>([]);
  const [preparedPayload, setPreparedPayload] = useState<any>(null);
  const [disputePackResult, setDisputePackResult] = useState<DisputePack | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isDispatching, setIsDispatching] = useState(false);
  const [dispatchSource, setDispatchSource] = useState<'ON_DEVICE' | 'IN_CLOUD' | 'UNKNOWN'>('IN_CLOUD');
  const [latencyMs, setLatencyMs] = useState(1180);
  const [discloseHospital, setDiscloseHospital] = useState(false);
  const [expandDiagnosis, setExpandDiagnosis] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleRunDetection = async () => {
    setErrorMsg(null);
    setDisputePackResult(null);
    setIsScanning(true);

    setTimeout(async () => {
      try {
        const normalizedDocs = selectedSample.documents.map((d, idx) =>
          normalizeDocumentText(`doc_${idx + 1}`, d.kind, d.displayName, d.text)
        );

        const allFindings = normalizedDocs.flatMap((doc) =>
          runDeterministicDetectors(doc.id, doc.normalizedText)
        );

        const caseId = `case_${Date.now()}`;
        const transform = transformCaseDocuments(caseId, normalizedDocs, allFindings, {
          discloseHospital,
          expandDiagnosis,
        });

        const eligibility = classifyCloudEligibility({
          isOnline: tier !== 'TIER_C_OFFLINE',
          isNanoAvailable: tier === 'TIER_A_NANO',
          isCuratedSyntheticSample: true,
          hasUnresolvedResidualWarnings: transform.residualWarnings.length > 0,
          hasRawNarrativeModifications: false,
        });

        const session: CaseSession = {
          caseId,
          caseNonce: transform.transformationMap.caseNonce,
          revision: 1,
          documents: normalizedDocs,
          findings: allFindings,
          transformationMap: transform.transformationMap,
          discloseHospital,
          expandDiagnosis,
          capabilityTier: tier,
          isEligibleForCloud: eligibility.isEligibleForCloud,
          ineligibilityReason: eligibility.reason,
        };

        setCaseSession(session);
        setSanitizedDocuments(transform.sanitizedDocuments);

        const prep = await buildPreparedDisputeRequest({
          caseSession: session,
          sanitizedDocs: transform.sanitizedDocuments.map((s, i) => ({
            id: s.documentId,
            kind: normalizedDocs[i].kind,
            sanitizedText: s.sanitizedText,
          })),
          targetCloudModel: 'gemini-2.5-flash',
          promptInstructions: 'Analyze billing line items for duplicate charges, unbundled codes, and policy denial validity. Draft formal appeal letter.',
          jurisdiction: selectedSample.jurisdiction,
          currency: selectedSample.currency,
        });

        setPreparedPayload(prep);
      } catch (err: any) {
        setErrorMsg(err?.message || 'Error executing on-device detection');
      } finally {
        setIsScanning(false);
      }
    }, 600);
  };

  const handleApproveAndDispatch = async () => {
    if (!caseSession || !preparedPayload) return;
    setIsDispatching(true);
    setErrorMsg(null);

    try {
      consentMachine.grantConsent(preparedPayload.requestHash, caseSession.revision);

      const res = await dispatchDisputePack({
        preparedRequest: preparedPayload.request,
        requestHash: preparedPayload.requestHash,
        transformationMap: caseSession.transformationMap,
        mockGenerator: () => ({
          summary: `Comprehensive billing and claim dispute assessment for patient [PATIENT_${caseSession.caseNonce}_1]. Our audit identified duplicate lab monitoring charges and determined that the repudiation under Exclusion Clause 4.2 is contestable because the condition was first diagnosed well after the continuous waiting period elapsed.`,
          findings: [
            {
              findingId: 'f_dup_1',
              type: 'DUPLICATE_CHARGE',
              description: 'Duplicate line-item charge for Arterial Blood Gas (ABG) Lab Monitoring on Day 2.',
              lineItemRef: 'Line 6',
              claimedAmount: 4500,
              allowedAmount: 0,
              currency: selectedSample.currency,
              evidenceQuotes: ['Arterial Blood Gas (ABG) Lab Monitoring (Duplicate Entry): Rs. 4,500'],
              uncertaintyNotice: 'Verified against consecutive timestamps on hospital billing ledger.',
            },
            {
              findingId: 'f_overage_1',
              type: 'PACKAGE_OVERAGE',
              description: 'Room category allocated as Deluxe Suite exceeding the 1% Sum Insured capping in Policy Clause 5.1.',
              policyClauseRef: 'Clause 5.1',
              currency: selectedSample.currency,
              evidenceQuotes: ['Deluxe Suite Room Rent (4 Days @ Rs. 9,000/day): Rs. 36,000'],
            },
          ],
          policyClauseAnalysis: [
            {
              clauseId: 'Clause 4.2',
              clauseTitle: 'Pre-Existing Disease Waiting Period',
              denialReasonMatched: 'Repudiation on grounds of pre-existing condition waiting period not satisfied.',
              disputeStrength: 'STRONG',
              analysisReasoning: 'Policy wording establishes a 24-month waiting period for pre-existing conditions, which the insured has fully satisfied under continuous renewal records.',
            },
          ],
          draftAppealLetter: `To:\nThe Claims Grievance Redressal Officer,\nSuraksha Health Insurance Co. Ltd.\n\nSubject: Formal Grievance & Appeal against Repudiation of Claim No. [CLAIM_NO_${caseSession.caseNonce}_1] (Policy No. [POLICY_NO_${caseSession.caseNonce}_1])\nPatient: [PATIENT_${caseSession.caseNonce}_1] | Hospital: [HOSPITAL_${caseSession.caseNonce}_1]\nHospitalization Dates: [DATE_DREF_1:2026-10-04] to [DATE_DREF_2:2026-10-08]\n\nRespected Sir/Madam,\n\nI am writing to formally contest the repudiation of the above-referenced hospitalization claim under Policy Clause 4.2.\n\n1. Validity of Coverage: The repudiation letter claims a 36-month pre-existing exclusion. However, Section 4, Clause 4.2 of the applicable policy schedule explicitly confirms that pre-existing coverage commences after 24 continuous months. The policy has been maintained continuously without break since inception.\n\n2. Inpatient Treatment: The patient was admitted to [HOSPITAL_${caseSession.caseNonce}_1] for an acute medical emergency, requiring urgent CCU care.\n\n3. Billing Rectification: We also draw attention to Line 6 of the hospital bill containing an unverified duplicate lab monitoring fee of Rs. 4,500, which has been flagged for audit.\n\nIn light of the documentary evidence attached, I request immediate reconsideration and settlement of the admissible claim amount within 15 days, failing which this matter will be escalated to the Insurance Ombudsman.\n\nYours sincerely,\n[PATIENT_${caseSession.caseNonce}_1]`,
          supportingChecklist: [
            'Attested Copy of Initial Policy Inception Certificate proving >24 months continuity',
            'Indoor Case Papers and CCU Admission Chart from [HOSPITAL_1]',
            'Treating Cardiologist Certificate confirming first onset of acute symptoms',
            'Itemized hospital pharmacy and lab investigation slips',
          ],
          disclaimerNotice: 'Airlock is an AI-powered document organizer and audit decoder. This assessment does not constitute legal or medical advice. Verify all terms and deadlines with your insurer.',
        }),
      });

      if (!res.success) {
        setErrorMsg(res.error || 'Dispatch was blocked or failed.');
        return;
      }

      setDisputePackResult(res.rehydratedData || null);
      setDispatchSource(res.source || 'IN_CLOUD');
      setLatencyMs(res.latencyMs || 1200);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Error executing dispute reasoning');
    } finally {
      setIsDispatching(false);
    }
  };

  const steps = [
    { num: 1, label: 'Case Paperwork', active: true, done: !!caseSession },
    { num: 2, label: 'Airlock Privacy Gate', active: !!caseSession, done: !!disputePackResult },
    { num: 3, label: 'Sanitized Cloud Reasoning', active: !!disputePackResult, done: !!disputePackResult },
    { num: 4, label: 'Dispute Pack & Local Appeal', active: !!disputePackResult, done: !!disputePackResult },
  ];

  return (
    <div className="space-y-6">
      {/* Step tracker */}
      <div className="flex items-center select-none">
        {steps.map((st, idx) => (
          <React.Fragment key={st.num}>
            <div className="flex items-center gap-2 min-w-0">
              <span
                className={`flex-shrink-0 h-6 w-6 rounded-full flex items-center justify-center text-[11px] font-semibold ${
                  st.done
                    ? 'bg-emerald-500 text-white'
                    : st.active
                    ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 ring-2 ring-zinc-900/20 dark:ring-zinc-100/20'
                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500'
                }`}
              >
                {st.done ? '✓' : st.num}
              </span>
              <span
                className={`text-xs font-medium truncate hidden sm:block ${
                  st.done
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : st.active
                    ? 'text-zinc-900 dark:text-zinc-50'
                    : 'text-zinc-400 dark:text-zinc-500'
                }`}
              >
                {st.label}
              </span>
            </div>
            {idx < steps.length - 1 && (
              <div className={`flex-1 h-px mx-3 ${st.done ? 'bg-emerald-300 dark:bg-emerald-700' : 'bg-zinc-200 dark:bg-zinc-800'}`} />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Workspace card */}
      <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-900 p-6">
        <div>
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
            <FileText className="h-4 w-4 text-emerald-500" />
            Bill &amp; Claim Decoder Workspace
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Select a curated synthetic healthcare case or upload itemized paperwork for local privacy gate review.
          </p>
        </div>

        <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800 flex flex-wrap items-center gap-3">
          <select
            aria-label="Curated Synthetic Healthcare Case Selection"
            value={selectedSample.id}
            onChange={(e) => {
              const found = SYNTHETIC_SAMPLE_CASES.find((s) => s.id === e.target.value);
              if (found) {
                setSelectedSample(found);
                setCaseSession(null);
                setPreparedPayload(null);
                setDisputePackResult(null);
              }
            }}
            className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-700 text-sm font-medium text-zinc-800 dark:text-zinc-200 rounded-lg px-3 h-9 cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
          >
            {SYNTHETIC_SAMPLE_CASES.map((s) => (
              <option key={s.id} value={s.id}>
                {s.jurisdiction === 'IN' ? '🇮🇳' : '🇺🇸'} {s.title}
              </option>
            ))}
          </select>

          <button
            onClick={handleRunDetection}
            disabled={isScanning}
            className="btn-press flex items-center gap-1.5 h-9 px-4 bg-emerald-500 hover:bg-emerald-600 disabled:bg-zinc-200 dark:disabled:bg-zinc-800 disabled:text-zinc-400 text-white text-sm font-semibold rounded-lg transition-colors"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>{isScanning ? 'Scanning on Device...' : 'Run Local Detection'}</span>
          </button>
        </div>

        {/* Case meta */}
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <span className="text-xs text-zinc-500 font-medium block mb-1">Documents in Bundle</span>
            <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200 truncate block">
              {selectedSample.documents.map((d) => d.displayName).join(', ')}
            </span>
          </div>
          <div>
            <span className="text-xs text-zinc-500 font-medium block mb-1">Jurisdiction &amp; Currency</span>
            <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
              {selectedSample.jurisdiction === 'IN' ? '🇮🇳 India (INR ₹)' : '🇺🇸 United States (USD $)'}
            </span>
          </div>
          <div>
            <span className="text-xs text-zinc-500 font-medium block mb-1">Target Dispute Grounds</span>
            <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200 truncate block">
              {selectedSample.expectedIssues[0]}
            </span>
          </div>
        </div>
      </div>

      {/* Scanning state */}
      {isScanning && (
        <div className="scanline-container bg-zinc-900 border border-zinc-700 rounded-xl p-6 text-center space-y-3">
          <div className="scanline-beam" />
          <div className="flex items-center justify-center gap-2 text-emerald-400 font-mono text-sm font-semibold">
            <Shield className="h-4 w-4" />
            <span>GEMINI NANO ON-DEVICE PRIVACY PASS IN PROGRESS</span>
          </div>
          <p className="text-xs text-zinc-400 font-mono">
            Evaluating 12-digit Aadhaar Verhoeff checksums, PAN patterns, policy keys, and clinical entities locally...
          </p>
        </div>
      )}

      {errorMsg && (
        <p className="text-sm text-red-500">{errorMsg}</p>
      )}

      {caseSession && preparedPayload && !isScanning && (
        <SplitScreenReview
          originalText={caseSession.documents.map((d) => `=== ${d.displayName} ===\n${d.originalText}`).join('\n\n')}
          sanitizedText={sanitizedDocuments.map((d) => `=== Document: ${d.documentId} ===\n${d.sanitizedText}`).join('\n\n')}
          preparedRequest={preparedPayload.request}
          requestHash={preparedPayload.requestHash}
          isEligible={caseSession.isEligibleForCloud}
          ineligibilityReason={caseSession.ineligibilityReason}
          onApproveAndDispatch={handleApproveAndDispatch}
          isDispatching={isDispatching}
          discloseHospital={discloseHospital}
          setDiscloseHospital={setDiscloseHospital}
          expandDiagnosis={expandDiagnosis}
          setExpandDiagnosis={setExpandDiagnosis}
        />
      )}

      {disputePackResult && (
        <DisputePackView
          disputePack={disputePackResult}
          source={dispatchSource}
          latencyMs={latencyMs}
        />
      )}
    </div>
  );
};
