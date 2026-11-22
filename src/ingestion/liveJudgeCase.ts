import { buildPreparedDisputeRequest } from '../approval/requestBuilder';
import { canonicalJsonStringify } from '../contracts/canonical';
import type { CaseSession, PreparedRequest, TransformationMap } from '../contracts/types';
import { SYNTHETIC_SAMPLE_CASES } from './syntheticSamples';

export const liveJudgeSample = SYNTHETIC_SAMPLE_CASES[0];
export const liveJudgeModel = 'gemini-3.5-flash-lite';
export const liveJudgeIssueKinds = ['DUPLICATE_CHARGE', 'WAITING_PERIOD_CONFLICT'] as const;
export type LiveJudgeIssue = typeof liveJudgeIssueKinds[number];

// These reviewed excerpts contain only the fictional evidence required for the two questions.
const evidence = [
  { id: 'denial-clause-4-2', kind: 'DENIAL_LETTER', sanitizedText: 'The denial cites Exclusion 4.2 and a 36-month waiting period from policy inception.' },
  { id: 'policy-clause-4-2', kind: 'POLICY', sanitizedText: 'The supplied Clause 4.2 starts coverage after 24 months of continuous coverage, provided the policy was renewed without a break.' },
  { id: 'bill-lines-5-6', kind: 'BILL', sanitizedText: 'Lines 5 and 6 each bill INR 4,500 for Arterial Blood Gas (ABG) Lab Monitoring on the same service day. Line 6 is marked Duplicate Entry.' },
] as const;

const instructions = 'Analyze only the fictional evidence. Return a JSON object with an issues array. Include DUPLICATE_CHARGE for a likely duplicate bill entry and WAITING_PERIOD_CONFLICT for a mismatch between the denial and policy waiting periods. Include each issue at most once. You are identifying questions for review, not deciding coverage.';
const canonicalEvidence = canonicalJsonStringify(evidence);

export function prepareLiveJudgeRequest(session: CaseSession, policyVersion: string) {
  return buildPreparedDisputeRequest({
    caseSession: session,
    sanitizedDocs: evidence,
    targetCloudModel: liveJudgeModel,
    promptInstructions: instructions,
    execution: { kind: 'FIREBASE_JUDGE_V1', policyVersion },
  });
}

export function isLiveJudgeEnvelope(request: PreparedRequest, map: TransformationMap) {
  return request.caseId === map.caseId && /^case_\d{13}$/.test(request.caseId)
    && request.caseNonce === map.caseNonce && /^[A-Z0-9]{4}$/.test(request.caseNonce)
    && request.task === 'DISPUTE_PACK' && request.requestedMode === 'ONLY_IN_CLOUD'
    && request.targetCloudModel === liveJudgeModel && request.jurisdiction === 'IN' && request.currency === 'INR'
    && request.promptInstructions === instructions && request.allowedPlaceholders.length === 0
    && canonicalJsonStringify(request.sanitizedDocuments) === canonicalEvidence;
}
