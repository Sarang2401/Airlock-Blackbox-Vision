import { describe, it, expect } from 'vitest';
import { validateAndRehydrateDisputePack } from '../../src/airlock/firewall';
import { TransformationMap } from '../../src/contracts/types';

describe('Output Firewall & Local Rehydration', () => {
  const mockMap: TransformationMap = {
    caseId: 'case_test',
    caseNonce: 'T7M9',
    dayOffset: 45,
    placeholders: {
      '[PATIENT_T7M9_1]': 'Ramesh Verma',
      '[POLICY_NO_T7M9_1]': 'POL-99281',
    },
    reversePlaceholders: {
      'Ramesh Verma': '[PATIENT_T7M9_1]',
      'POL-99281': '[POLICY_NO_T7M9_1]',
    },
    dateRefs: {
      DREF_1: {
        id: 'DREF_1',
        originalIso: '2026-10-04',
        shiftedIso: '2026-11-18',
        dayOffset: 45,
      },
    },
    diagnosesGeneralized: {},
    disclosedHospital: false,
  };

  it('rehydrates valid dispute pack locally', () => {
    const rawResponse = {
      summary: 'Analysis for patient [PATIENT_T7M9_1] under policy [POLICY_NO_T7M9_1]',
      findings: [
        {
          findingId: 'f1',
          type: 'DUPLICATE_CHARGE',
          description: 'Duplicate charge on [DATE_DREF_1:2026-11-18]',
          currency: 'INR',
          evidenceQuotes: ['Duplicate item line 5'],
        },
      ],
      policyClauseAnalysis: [],
      draftAppealLetter: 'I, [PATIENT_T7M9_1], am appealing claim under [POLICY_NO_T7M9_1]',
      supportingChecklist: ['Discharge summary', 'Indoor case papers'],
      disclaimerNotice: 'Not legal advice',
    };

    const result = validateAndRehydrateDisputePack(rawResponse, mockMap);
    expect(result.passed).toBe(true);
    expect(result.rehydratedDisputePack?.summary).toContain('Ramesh Verma');
    expect(result.rehydratedDisputePack?.draftAppealLetter).toContain('I, Ramesh Verma, am appealing claim under POL-99281');
    expect(result.rehydratedDisputePack?.findings[0].description).toContain('2026-10-04');
  });

  it('blocks response containing cross-case or forged tokens', () => {
    const foreignResponse = {
      summary: 'Analysis for [PATIENT_FORGED_99]',
      findings: [],
      policyClauseAnalysis: [],
      draftAppealLetter: 'Appeal letter',
      supportingChecklist: [],
      disclaimerNotice: 'Disclaimer',
    };

    const result = validateAndRehydrateDisputePack(foreignResponse, mockMap);
    expect(result.passed).toBe(false);
    expect(result.violations[0]).toContain('Cross-case or unauthorized token detected');
  });

  it('blocks response with malicious XSS markup', () => {
    const xssResponse = {
      summary: 'Safe summary <script>alert("hacked")</script>',
      findings: [],
      policyClauseAnalysis: [],
      draftAppealLetter: 'Appeal',
      supportingChecklist: [],
      disclaimerNotice: 'Disclaimer',
    };

    const result = validateAndRehydrateDisputePack(xssResponse, mockMap);
    expect(result.passed).toBe(false);
    expect(result.violations[0]).toContain('Hostile markup or script injection detected');
  });
});
