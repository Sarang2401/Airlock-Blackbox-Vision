import { describe, it, expect } from 'vitest';
import { dispatchDisputePack } from '../../src/dispatch/dispatcher';
import { consentMachine } from '../../src/approval/consentMachine';
import { remoteConfigManager } from '../../src/firebase/remoteConfig';
import { PreparedRequest, TransformationMap } from '../../src/contracts/types';

describe('Guarded AI Dispatcher Integration', () => {
  const mockPreparedRequest: PreparedRequest = {
    version: '1.0',
    caseId: 'case_dispatch_1',
    caseNonce: 'X9K2',
    caseRevision: 1,
    task: 'DISPUTE_PACK',
    requestedMode: 'ONLY_IN_CLOUD',
    targetCloudModel: 'gemini-2.5-flash',
    sanitizedDocuments: [
      {
        id: 'doc_1',
        kind: 'BILL',
        sanitizedText: 'Bill for patient [PATIENT_X9K2_1]',
      },
    ],
    jurisdiction: 'IN',
    currency: 'INR',
    promptInstructions: 'Find billing errors',
    allowedPlaceholders: ['[PATIENT_X9K2_1]'],
  };

  const mockMap: TransformationMap = {
    caseId: 'case_dispatch_1',
    caseNonce: 'X9K2',
    dayOffset: 40,
    placeholders: { '[PATIENT_X9K2_1]': 'Sunita Sundaram' },
    reversePlaceholders: { 'Sunita Sundaram': '[PATIENT_X9K2_1]' },
    dateRefs: {},
    diagnosesGeneralized: {},
    disclosedHospital: false,
  };

  const requestHash = 'synthetic_test_hash_12345';

  it('rejects dispatch if consent is missing or ungranted', async () => {
    consentMachine.invalidate();

    const result = await dispatchDisputePack({
      preparedRequest: mockPreparedRequest,
      requestHash,
      transformationMap: mockMap,
      mockGenerator: () => ({
        summary: 'test',
        findings: [],
        policyClauseAnalysis: [],
        draftAppealLetter: 'letter',
        supportingChecklist: [],
        disclaimerNotice: 'notice',
      }),
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('User consent is invalid');
  });

  it('rejects dispatch if Remote Config kill switch is active', async () => {
    consentMachine.grantConsent(requestHash, 1);
    remoteConfigManager.setKillSwitch(false); // Kill switch active!

    const result = await dispatchDisputePack({
      preparedRequest: mockPreparedRequest,
      requestHash,
      transformationMap: mockMap,
      mockGenerator: () => ({
        summary: 'test',
        findings: [],
        policyClauseAnalysis: [],
        draftAppealLetter: 'letter',
        supportingChecklist: [],
        disclaimerNotice: 'notice',
      }),
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('Remote Config kill switch is active');

    // Reset kill switch
    remoteConfigManager.setKillSwitch(true);
  });

  it('dispatches successfully, rehydrates data, and consumes consent', async () => {
    consentMachine.grantConsent(requestHash, 1);

    const result = await dispatchDisputePack({
      preparedRequest: mockPreparedRequest,
      requestHash,
      transformationMap: mockMap,
      mockGenerator: () => ({
        summary: 'Summary for [PATIENT_X9K2_1]',
        findings: [],
        policyClauseAnalysis: [],
        draftAppealLetter: 'Appeal for [PATIENT_X9K2_1]',
        supportingChecklist: ['Policy doc'],
        disclaimerNotice: 'Not legal advice',
      }),
    });

    expect(result.success).toBe(true);
    expect(result.rehydratedData?.summary).toBe('Summary for Sunita Sundaram');
    expect(result.rehydratedData?.draftAppealLetter).toBe('Appeal for Sunita Sundaram');

    // Consent must now be consumed
    expect(consentMachine.isConsentValid(requestHash, 1)).toBe(false);
  });
});
