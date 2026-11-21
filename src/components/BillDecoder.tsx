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
import { Sparkles, FileText } from 'lucide-react';

interface BillDecoderProps {
  tier: CapabilityTier;
}

export const BillDecoder: React.FC<BillDecoderProps> = ({ tier }) => {
  const [selectedSample, setSelectedSample] = useState<SyntheticSampleCase>(SYNTHETIC_SAMPLE_CASES[0]);
  const [caseSession, setCaseSession] = useState<CaseSession | null>(null);
  const [sanitizedDocuments, setSanitizedDocuments] = useState<Array<{ documentId: string; sanitizedText: string }>>([]);
  const [preparedPayload, setPreparedPayload] = useState<any>(null);
  const [disputePackResult, setDisputePackResult] = useState<DisputePack | null>(null);
  const [isDispatching, setIsDispatching] = useState(false);
  const [dispatchSource, setDispatchSource] = useState<'ON_DEVICE' | 'IN_CLOUD' | 'UNKNOWN'>('IN_CLOUD');
  const [latencyMs, setLatencyMs] = useState(1180);
  const [discloseHospital, setDiscloseHospital] = useState(false);
  const [expandDiagnosis, setExpandDiagnosis] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleRunDetection = async () => {
    setErrorMsg(null);
    setDisputePackResult(null);

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
          draftAppealLetter: `To:
The Claims Grievance Redressal Officer,
Suraksha Health Insurance Co. Ltd.

Subject: Formal Grievance & Appeal against Repudiation of Claim No. [CLAIM_NO_${caseSession.caseNonce}_1] (Policy No. [POLICY_NO_${caseSession.caseNonce}_1])
Patient: [PATIENT_${caseSession.caseNonce}_1] | Hospital: [HOSPITAL_${caseSession.caseNonce}_1]
Hospitalization Dates: [DATE_DREF_1:2026-10-04] to [DATE_DREF_2:2026-10-08]

Respected Sir/Madam,

I am writing to formally contest the repudiation of the above-referenced hospitalization claim under Policy Clause 4.2.

1. Validity of Coverage: The repudiation letter claims a 36-month pre-existing exclusion. However, Section 4, Clause 4.2 of the applicable policy schedule explicitly confirms that pre-existing coverage commences after 24 continuous months. The policy has been maintained continuously without break since inception.

2. Inpatient Treatment: The patient was admitted to [HOSPITAL_${caseSession.caseNonce}_1] for an acute medical emergency, requiring urgent CCU care.

3. Billing Rectification: We also draw attention to Line 6 of the hospital bill containing an unverified duplicate lab monitoring fee of Rs. 4,500, which has been flagged for audit.

In light of the documentary evidence attached, I request immediate reconsideration and settlement of the admissible claim amount within 15 days, failing which this matter will be escalated to the Insurance Ombudsman.

Yours sincerely,
[PATIENT_${caseSession.caseNonce}_1]`,
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

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <FileText className="h-5 w-5 text-cyan-400" />
              Bill & Claim Decoder Workspace
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Select a curated synthetic healthcare case or upload itemized paperwork for local privacy gate review.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              aria-label="Curated Synthetic Healthcare Case"
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
              className="bg-slate-950 border border-slate-700 text-xs text-slate-200 rounded-lg px-3 py-2 font-medium cursor-pointer"
            >
              {SYNTHETIC_SAMPLE_CASES.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title}
                </option>
              ))}
            </select>

            <button
              onClick={handleRunDetection}
              className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold rounded-lg flex items-center space-x-1.5 transition shadow-lg shadow-cyan-500/20"
            >
              <Sparkles className="h-4 w-4" />
              <span>Run Local Detection (ONLY_ON_DEVICE)</span>
            </button>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800/80">
            <span className="text-slate-500 block mb-0.5">Documents in Case:</span>
            <span className="text-slate-200 font-medium">
              {selectedSample.documents.map((d) => d.displayName).join(', ')}
            </span>
          </div>
          <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800/80">
            <span className="text-slate-500 block mb-0.5">Jurisdiction & Currency:</span>
            <span className="text-slate-200 font-medium">
              {selectedSample.jurisdiction === 'IN' ? 'India (INR ₹)' : 'United States (USD $)'}
            </span>
          </div>
          <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800/80">
            <span className="text-slate-500 block mb-0.5">Target Dispute Grounds:</span>
            <span className="text-cyan-400 font-medium truncate block">
              {selectedSample.expectedIssues[0]}
            </span>
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 bg-rose-950/80 border border-rose-800 rounded-xl text-rose-200 text-xs font-medium">
          {errorMsg}
        </div>
      )}

      {caseSession && preparedPayload && (
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
