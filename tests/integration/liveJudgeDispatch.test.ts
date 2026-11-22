import { beforeEach, expect, it, vi } from 'vitest';
import { blackBoxStore } from '../../packages/black-box';
import { consentMachine } from '../../src/approval/consentMachine';
import { canonicalJsonStringify, sha256Hex } from '../../src/contracts/canonical';
import type { CaseSession } from '../../src/contracts/types';
import { dispatchDisputePack } from '../../src/dispatch/dispatcher';
import { inferLiveJudge } from '../../src/firebase/liveJudgeAdapter';
import { BUNDLED_DEFAULT_POLICY, remoteConfigManager } from '../../src/firebase/remoteConfig';
import { prepareLiveJudgeRequest } from '../../src/ingestion/liveJudgeCase';
import { receiptLedger } from '../../src/receipts/ledger';

vi.mock('../../src/firebase/config', () => ({ liveJudgeConfigured: true }));
vi.mock('../../src/firebase/liveJudgeAdapter', () => ({ inferLiveJudge: vi.fn() }));

const patientToken = '[PATIENT_X9K2_1]';
const session: CaseSession = {
  caseId: 'case_1763773200000', caseNonce: 'X9K2', revision: 1, documents: [], findings: [],
  transformationMap: {
    caseId: 'case_1763773200000', caseNonce: 'X9K2', dayOffset: 1,
    placeholders: { [patientToken]: 'Test Patient' }, reversePlaceholders: { 'Test Patient': patientToken },
    dateRefs: {}, diagnosesGeneralized: {}, disclosedHospital: false,
  },
  discloseHospital: false, expandDiagnosis: false, capabilityTier: 'TIER_B_NO_NANO', isEligibleForCloud: true,
};

beforeEach(() => {
  vi.resetAllMocks();
  remoteConfigManager.resetToBundled();
  consentMachine.invalidate();
  receiptLedger.clear();
  blackBoxStore.clear();
});

async function approvePreview() {
  const policyVersion = BUNDLED_DEFAULT_POLICY.policyVersion;
  const preview = await prepareLiveJudgeRequest(session, policyVersion);
  consentMachine.grantConsent(preview.requestHash, session.revision, policyVersion);
  return {
    preparedRequest: preview.request,
    requestHash: preview.requestHash,
    transformationMap: session.transformationMap,
    isLiveJudgeCurrent: () => true,
    mockGenerator: () => { throw new Error('Unexpected simulation'); },
  };
}

it('sends the approved excerpts after intent and restores the draft locally', async () => {
  const approval = await approvePreview();
  vi.mocked(inferLiveJudge).mockImplementation(async (bytes) => {
    expect(receiptLedger.getEvents().map((event) => event.eventType)).toEqual(['INTENT']);
    expect(await sha256Hex(bytes)).toBe(approval.requestHash);
    for (const protectedValue of ['Test Patient', patientToken, '05/10/2026', 'CLM-2026-993812', '981203491823']) {
      expect(bytes).not.toContain(protectedValue);
    }
    return { text: '{"issues":["DUPLICATE_CHARGE"]}', observedCloud: true };
  });
  const result = await dispatchDisputePack(approval);
  expect(result).toMatchObject({ success: true, source: 'IN_CLOUD', executionKind: 'LIVE' });
  expect(result.rehydratedData?.draftAppealLetter).toContain('Test Patient');
  expect(result.rehydratedData?.policyClauseAnalysis).toEqual([]);
  expect(receiptLedger.getEvents().map((event) => [event.eventType, event.status])).toEqual([['INTENT', 'PENDING'], ['OUTCOME', 'SUCCESS']]);
  expect(blackBoxStore.computeSummary('LIVE').inCloudCalls).toBe(1);
  expect(blackBoxStore.computeSummary('SIMULATED').totalCalls).toBe(0);
});

it('rejects an edited excerpt even with newly hashed approval', async () => {
  const approval = await approvePreview();
  approval.preparedRequest.sanitizedDocuments[0].sanitizedText += ' Unexpected data';
  approval.requestHash = await sha256Hex(canonicalJsonStringify(approval.preparedRequest));
  consentMachine.grantConsent(approval.requestHash, session.revision, BUNDLED_DEFAULT_POLICY.policyVersion);
  expect((await dispatchDisputePack(approval)).success).toBe(false);
  expect(inferLiveJudge).not.toHaveBeenCalled();
  expect(receiptLedger.getEvents()).toEqual([]);
});

it('makes no SDK attempt when intent storage fails', async () => {
  const approval = await approvePreview();
  const receipt = vi.spyOn(receiptLedger, 'appendEvent').mockRejectedValueOnce(new Error('Storage denied'));
  try {
    expect((await dispatchDisputePack(approval)).success).toBe(false);
    expect(inferLiveJudge).not.toHaveBeenCalled();
  } finally {
    receipt.mockRestore();
  }
});

it('blocks unexpected model fields before building a draft', async () => {
  const approval = await approvePreview();
  vi.mocked(inferLiveJudge).mockResolvedValue({ text: '{"issues":[],"unexpected":"extra"}', observedCloud: true });
  const result = await dispatchDisputePack(approval);
  expect(result.success).toBe(false);
  expect(result.rehydratedData).toBeUndefined();
  expect(receiptLedger.getEvents().at(-1)?.status).toBe('FIREWALL_BLOCKED');
});
