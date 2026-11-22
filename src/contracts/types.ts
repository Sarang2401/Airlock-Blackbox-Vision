/**
 * Core type definitions for Airlock + Black Box
 * Strict runtime separation between local raw data and sanitized transit data.
 */

export type InferenceMode = 
  | 'ONLY_ON_DEVICE'
  | 'ONLY_IN_CLOUD'
  | 'PREFER_ON_DEVICE'
  | 'PREFER_IN_CLOUD';

export type InferenceSource = 'ON_DEVICE' | 'IN_CLOUD' | 'UNKNOWN';
export type ExecutionKind = 'LIVE' | 'SIMULATED';

export type CapabilityTier = 'TIER_A_NANO' | 'TIER_B_NO_NANO' | 'TIER_C_OFFLINE';

export type DocumentKind = 'BILL' | 'DENIAL_LETTER' | 'POLICY' | 'DISCHARGE_SUMMARY' | 'NOTES';

export type EntityType = 
  | 'PERSON_NAME'
  | 'GOVT_ID' // Aadhaar / SSN
  | 'PAN_NUMBER'
  | 'PHONE_NUMBER'
  | 'EMAIL_ADDRESS'
  | 'POLICY_NUMBER'
  | 'CLAIM_NUMBER'
  | 'BANK_ACCOUNT'
  | 'IFSC_CODE'
  | 'STREET_ADDRESS'
  | 'HOSPITAL_NAME'
  | 'DATE'
  | 'AMOUNT'
  | 'DIAGNOSIS'
  | 'GENERIC_IDENTIFIER';

export interface EntityFinding {
  id: string;
  documentId: string;
  type: EntityType;
  start: number; // zero-based UTF-16 code unit index
  end: number;
  exactSubstring: string;
  provenance: 'DETERMINISTIC' | 'NANO_PASS_1' | 'NANO_RECALL_PASS_2' | 'FIXTURE_LABEL';
  confidence?: number;
  reviewed: boolean;
}

export interface DateRef {
  id: string; // e.g. DREF_1
  originalIso: string;
  shiftedIso: string;
  dayOffset: number;
}

export interface TransformationMap {
  caseId: string;
  caseNonce: string; // e.g. "Q7M2"
  dayOffset: number; // nonzero day offset shared across session
  placeholders: Record<string, string>; // placeholder -> original
  reversePlaceholders: Record<string, string>; // original -> placeholder
  dateRefs: Record<string, DateRef>; // refId -> DateRef
  diagnosesGeneralized: Record<string, string>; // original diagnosis -> category
  disclosedHospital: boolean;
}

export interface NormalizedDocument {
  id: string;
  kind: DocumentKind;
  displayName: string;
  originalText: string;
  normalizedText: string;
  charCount: number;
}

export interface CaseSession {
  caseId: string;
  caseNonce: string;
  revision: number;
  documents: NormalizedDocument[];
  findings: EntityFinding[];
  transformationMap: TransformationMap;
  discloseHospital: boolean;
  expandDiagnosis: boolean;
  capabilityTier: CapabilityTier;
  isEligibleForCloud: boolean;
  ineligibilityReason?: string;
}

export interface PreparedRequest {
  version: '1.0';
  caseId: string;
  caseNonce: string;
  caseRevision: number;
  task: 'DISPUTE_PACK' | 'EXPLAIN_TERM' | 'REVIEW_EXPLANATION';
  requestedMode: InferenceMode;
  targetCloudModel: string;
  sanitizedDocuments: Array<{
    id: string;
    kind: DocumentKind;
    sanitizedText: string;
  }>;
  jurisdiction: 'IN' | 'US' | 'GENERIC';
  currency: string;
  promptInstructions: string;
  allowedPlaceholders: string[];
  execution?: { kind: 'FIREBASE_JUDGE_V1'; policyVersion: string };
}

export interface ConsentRecord {
  consentId: string;
  requestHash: string;
  caseRevision: number;
  policyRevision: string;
  timestampIso: string;
  consumed: boolean;
}

export interface BillingAuditFinding {
  findingId: string;
  type: 'DUPLICATE_CHARGE' | 'PACKAGE_OVERAGE' | 'UNBUNDLED_ITEM' | 'POLICY_EXCLUSION_DISPUTE' | 'ARITHMETIC_ERROR';
  description: string;
  lineItemRef?: string;
  policyClauseRef?: string;
  claimedAmount?: number;
  allowedAmount?: number;
  currency: string;
  evidenceQuotes: string[];
  uncertaintyNotice?: string;
}

export interface DisputePack {
  summary: string;
  findings: BillingAuditFinding[];
  policyClauseAnalysis: Array<{
    clauseId: string;
    clauseTitle: string;
    denialReasonMatched: string;
    disputeStrength: 'STRONG' | 'MODERATE' | 'NEEDS_MORE_DOCUMENTATION';
    analysisReasoning: string;
  }>;
  draftAppealLetter: string; // Contains placeholders; restored strictly on device
  supportingChecklist: string[];
  disclaimerNotice: string;
}

export interface HelperResult {
  term: string;
  plainLanguageExplanation: string;
  billingContext: string;
  recommendedAction: string;
}

export type ReceiptEventType = 'INTENT' | 'OUTCOME' | 'CANCEL' | 'CLIPBOARD_EXPORT';

export interface ReceiptEvent {
  ledgerVersion: '1.0';
  eventId: string;
  eventType: ReceiptEventType;
  caseId: string;
  requestId: string;
  timestampIso: string;
  previousHash: string;
  eventHash: string;
  // Payload details
  requestedMode?: InferenceMode;
  actualSource?: InferenceSource;
  canonicalRequestHash?: string;
  sanitizedPayloadLength?: number;
  modelIdentifier?: string;
  executionKind?: ExecutionKind;
  status: 'PENDING' | 'SUCCESS' | 'FIREWALL_BLOCKED' | 'ERROR' | 'CANCELLED';
  errorMessage?: string;
}

export interface InferenceEventMetadata {
  eventId: string;
  featureName: string;
  requestedMode: InferenceMode;
  observedSource: InferenceSource;
  latencyMs: number;
  inputTokenEstimate: number;
  outputTokenEstimate: number;
  success: boolean;
  errorCategory?: string;
  deviceClass: 'DESKTOP_SUPPORTED' | 'MOBILE_WEB' | 'NO_NANO_BROWSER';
  fallbackReason?: 'NONE' | 'DEVICE_UNSUPPORTED' | 'MODEL_NOT_READY' | 'POLICY_OVERRIDE' | 'OFFLINE';
}

export interface RemoteConfigPolicy {
  policyVersion: string;
  cloudEnabled: boolean;
  minSanitizationTier: 'STRICT' | 'BALANCED';
  allowedCloudModels: string[];
  defaultCloudModel: string;
  preferOnDeviceForHelpers: boolean;
  latencyThresholdMs: number;
}
