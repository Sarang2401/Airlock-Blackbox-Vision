import { DisputePack } from '../contracts/types';
import { SyntheticSampleCase } from './syntheticSamples';
import { liveJudgeSample, type LiveJudgeIssue } from './liveJudgeCase';

type Finding = DisputePack['findings'][number];

function draftAppeal(tokens: string[], request: string) {
  const patient = tokens.find((token) => token.startsWith('[PATIENT_')) ?? 'the sample patient';
  const claim = tokens.find((token) => token.startsWith('[CLAIM_NO_')) ?? 'the claim referenced in the attached paperwork';
  return `To the billing or claims review team,\n\nPlease review ${claim}.\n\n${request}\n\nPlease confirm receipt and let me know what documents you need to complete the review.\n\nSincerely,\n${patient}`;
}

export function buildSampleDisputePack(sample: SyntheticSampleCase, tokens: string[]): DisputePack {
  const patient = tokens.find((token) => token.startsWith('[PATIENT_')) ?? 'the sample patient';
  const isIndia = sample.jurisdiction === 'IN';
  const findings: Finding[] = isIndia ? [
    {
      findingId: 'duplicate-abg',
      type: 'DUPLICATE_CHARGE',
      description: 'The bill shows two charges for arterial blood gas monitoring on the same day. Ask the hospital to confirm whether both were performed.',
      lineItemRef: 'Lines 5 and 6',
      claimedAmount: 4500,
      currency: sample.currency,
      evidenceQuotes: ['Arterial Blood Gas (ABG) Lab Monitoring', 'Duplicate Entry'],
    },
    {
      findingId: 'room-rent',
      type: 'PACKAGE_OVERAGE',
      description: 'Confirm how the deluxe-room rate and the room-rent cap affected associated charges.',
      policyClauseRef: 'Clause 5.1',
      currency: sample.currency,
      evidenceQuotes: ['Room rent is capped at 1% of Sum Insured per day for Standard Private AC Room'],
    },
  ] : [
    {
      findingId: 'venipuncture',
      type: 'UNBUNDLED_ITEM',
      description: 'The bill lists venipuncture separately from the metabolic panel. Ask the hospital to reconcile the charge with the denial explanation.',
      lineItemRef: 'CPT 36415',
      claimedAmount: 125,
      currency: sample.currency,
      evidenceQuotes: ['Denied. Incidental to primary laboratory diagnostic service.'],
    },
    {
      findingId: 'surgeon-fee',
      type: 'POLICY_EXCLUSION_DISPUTE',
      description: 'The insurer assigned an out-of-network assistant surgeon charge to the patient. Ask how it determined patient responsibility.',
      lineItemRef: 'CPT 99024',
      claimedAmount: 1800,
      currency: sample.currency,
      evidenceQuotes: ['Balance of $1,800.00 transferred to patient liability.'],
    },
  ];
  const request = isIndia
    ? 'Please reconcile the 36-month exclusion in the denial letter with the 24-month waiting period in the supplied policy wording. Please also confirm the duplicate lab entry and explain the room-rent adjustment.'
    : 'Please explain why venipuncture was billed separately and how the out-of-network assistant surgeon charge became patient responsibility. Please provide a corrected itemized statement if any charge was misapplied.';

  return {
    summary: isIndia
      ? `The fictional case for ${patient} has a possible duplicate lab charge and conflicting waiting-period terms. Verify which policy version applies and gather proof of continuous coverage.`
      : `The fictional case for ${patient} has a disputed lab charge and an out-of-network fee. Request an itemized explanation of both amounts.`,
    findings,
    policyClauseAnalysis: isIndia ? [{
      clauseId: 'Clause 4.2',
      clauseTitle: 'Pre-existing disease waiting period',
      denialReasonMatched: 'The denial letter cites a 36-month waiting period.',
      disputeStrength: 'NEEDS_MORE_DOCUMENTATION',
      analysisReasoning: 'The supplied policy wording says 24 months with continuous coverage. The applicable policy version and renewal history still need verification.',
    }] : [],
    draftAppealLetter: draftAppeal(tokens, request),
    supportingChecklist: isIndia
      ? ['Itemized bill and denial letter', 'Policy schedule in force on the admission date', 'Evidence of uninterrupted policy renewals']
      : ['Itemized hospital bill', 'Explanation of benefits', 'Written explanation of provider network status'],
    disclaimerNotice: 'This example uses fictional paperwork and simulated analysis. Verify your documents and deadlines before sending an appeal.',
  };
}

export function buildLiveJudgeDisputePack(issues: LiveJudgeIssue[], tokens: string[]): DisputePack {
  const sample = buildSampleDisputePack(liveJudgeSample, tokens);
  const duplicate = issues.includes('DUPLICATE_CHARGE');
  const waitingPeriod = issues.includes('WAITING_PERIOD_CONFLICT');
  const questions = [
    duplicate && 'Please confirm whether the two arterial blood gas monitoring entries are separate services.',
    waitingPeriod && 'Please reconcile the 36-month period cited in the denial with the 24-month period in the supplied policy wording. Confirm which policy version applies.',
  ].filter(Boolean).join(' ');

  return {
    summary: issues.length
      ? `Gemini flagged ${issues.length === 1 ? 'one question' : 'two questions'} in the protected fictional excerpts. The appeal draft was assembled on this device from the flagged evidence.`
      : 'Gemini did not flag either of the two issues it was asked to check in these fictional excerpts.',
    findings: duplicate ? sample.findings.filter((finding) => finding.type === 'DUPLICATE_CHARGE') : [],
    policyClauseAnalysis: waitingPeriod ? sample.policyClauseAnalysis : [],
    draftAppealLetter: draftAppeal(tokens, questions || 'Please provide an itemized explanation of the reviewed charges.'),
    supportingChecklist: sample.supportingChecklist,
    disclaimerNotice: 'This example uses fictional paperwork. The limited review cannot determine coverage or establish that a charge is incorrect.',
  };
}
