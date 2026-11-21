/**
 * Runtime Zod validation schemas.
 * Rejects unknown properties to prevent raw data leaks or injection.
 */
import { z } from 'zod';

export const InferenceModeSchema = z.enum([
  'ONLY_ON_DEVICE',
  'ONLY_IN_CLOUD',
  'PREFER_ON_DEVICE',
  'PREFER_IN_CLOUD',
]);

export const InferenceSourceSchema = z.enum([
  'ON_DEVICE',
  'IN_CLOUD',
  'UNKNOWN',
]);

export const CapabilityTierSchema = z.enum([
  'TIER_A_NANO',
  'TIER_B_NO_NANO',
  'TIER_C_OFFLINE',
]);

export const DocumentKindSchema = z.enum([
  'BILL',
  'DENIAL_LETTER',
  'POLICY',
  'DISCHARGE_SUMMARY',
  'NOTES',
]);

export const EntityTypeSchema = z.enum([
  'PERSON_NAME',
  'GOVT_ID',
  'PAN_NUMBER',
  'PHONE_NUMBER',
  'EMAIL_ADDRESS',
  'POLICY_NUMBER',
  'CLAIM_NUMBER',
  'BANK_ACCOUNT',
  'IFSC_CODE',
  'STREET_ADDRESS',
  'HOSPITAL_NAME',
  'DATE',
  'AMOUNT',
  'DIAGNOSIS',
  'GENERIC_IDENTIFIER',
]);

export const EntityFindingSchema = z.object({
  id: z.string(),
  documentId: z.string(),
  type: EntityTypeSchema,
  start: z.number().int().nonnegative(),
  end: z.number().int().nonnegative(),
  exactSubstring: z.string(),
  provenance: z.enum(['DETERMINISTIC', 'NANO_PASS_1', 'NANO_RECALL_PASS_2', 'FIXTURE_LABEL']),
  confidence: z.number().optional(),
  reviewed: z.boolean(),
}).strict();

export const PreparedRequestSchema = z.object({
  version: z.literal('1.0'),
  caseId: z.string(),
  caseNonce: z.string(),
  caseRevision: z.number().int().nonnegative(),
  task: z.enum(['DISPUTE_PACK', 'EXPLAIN_TERM', 'REVIEW_EXPLANATION']),
  requestedMode: InferenceModeSchema,
  targetCloudModel: z.string(),
  sanitizedDocuments: z.array(z.object({
    id: z.string(),
    kind: DocumentKindSchema,
    sanitizedText: z.string(),
  }).strict()),
  jurisdiction: z.enum(['IN', 'US', 'GENERIC']),
  currency: z.string(),
  promptInstructions: z.string(),
  allowedPlaceholders: z.array(z.string()),
}).strict();

export const BillingAuditFindingSchema = z.object({
  findingId: z.string(),
  type: z.enum([
    'DUPLICATE_CHARGE',
    'PACKAGE_OVERAGE',
    'UNBUNDLED_ITEM',
    'POLICY_EXCLUSION_DISPUTE',
    'ARITHMETIC_ERROR',
  ]),
  description: z.string(),
  lineItemRef: z.string().optional(),
  policyClauseRef: z.string().optional(),
  claimedAmount: z.number().optional(),
  allowedAmount: z.number().optional(),
  currency: z.string(),
  evidenceQuotes: z.array(z.string()),
  uncertaintyNotice: z.string().optional(),
}).strict();

export const DisputePackSchema = z.object({
  summary: z.string(),
  findings: z.array(BillingAuditFindingSchema),
  policyClauseAnalysis: z.array(z.object({
    clauseId: z.string(),
    clauseTitle: z.string(),
    denialReasonMatched: z.string(),
    disputeStrength: z.enum(['STRONG', 'MODERATE', 'NEEDS_MORE_DOCUMENTATION']),
    analysisReasoning: z.string(),
  }).strict()),
  draftAppealLetter: z.string(),
  supportingChecklist: z.array(z.string()),
  disclaimerNotice: z.string(),
}).strict();

export const HelperResultSchema = z.object({
  term: z.string(),
  plainLanguageExplanation: z.string(),
  billingContext: z.string(),
  recommendedAction: z.string(),
}).strict();

export const ReceiptEventSchema = z.object({
  ledgerVersion: z.literal('1.0'),
  eventId: z.string(),
  eventType: z.enum(['INTENT', 'OUTCOME', 'CANCEL', 'CLIPBOARD_EXPORT']),
  caseId: z.string(),
  requestId: z.string(),
  timestampIso: stringIsDate(),
  previousHash: z.string(),
  eventHash: z.string(),
  requestedMode: InferenceModeSchema.optional(),
  actualSource: InferenceSourceSchema.optional(),
  canonicalRequestHash: z.string().optional(),
  sanitizedPayloadLength: z.number().optional(),
  modelIdentifier: z.string().optional(),
  status: z.enum(['PENDING', 'SUCCESS', 'FIREWALL_BLOCKED', 'ERROR', 'CANCELLED']),
  errorMessage: z.string().optional(),
}).strict();

export const RemoteConfigPolicySchema = z.object({
  policyVersion: z.string(),
  cloudEnabled: z.boolean(),
  minSanitizationTier: z.enum(['STRICT', 'BALANCED']),
  allowedCloudModels: z.array(z.string()),
  defaultCloudModel: z.string(),
  preferOnDeviceForHelpers: z.boolean(),
  latencyThresholdMs: z.number().positive(),
}).strict();

function stringIsDate() {
  return z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Invalid ISO date string',
  });
}
