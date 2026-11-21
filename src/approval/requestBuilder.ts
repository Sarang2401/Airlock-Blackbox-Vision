/**
 * Canonical PreparedRequest Builder.
 * Prepares the immutable, exact payload that will leave the device.
 */
import { PreparedRequest, CaseSession, InferenceMode } from '../contracts/types';
import { canonicalJsonStringify, sha256Hex } from '../contracts/canonical';

export interface PreparedRequestWithHash {
  request: PreparedRequest;
  canonicalJson: string;
  requestHash: string;
}

export async function buildPreparedDisputeRequest(params: {
  caseSession: CaseSession;
  sanitizedDocs: Array<{ id: string; kind: any; sanitizedText: string }>;
  targetCloudModel: string;
  promptInstructions: string;
  jurisdiction?: 'IN' | 'US' | 'GENERIC';
  currency?: string;
}): Promise<PreparedRequestWithHash> {
  const {
    caseSession,
    sanitizedDocs,
    targetCloudModel,
    promptInstructions,
    jurisdiction = 'IN',
    currency = 'INR',
  } = params;

  const allowedPlaceholders = Object.keys(caseSession.transformationMap.placeholders);

  const request: PreparedRequest = {
    version: '1.0',
    caseId: caseSession.caseId,
    caseNonce: caseSession.caseNonce,
    caseRevision: caseSession.revision,
    task: 'DISPUTE_PACK',
    requestedMode: 'ONLY_IN_CLOUD',
    targetCloudModel,
    sanitizedDocuments: sanitizedDocs.map((d) => ({
      id: d.id,
      kind: d.kind,
      sanitizedText: d.sanitizedText,
    })),
    jurisdiction,
    currency,
    promptInstructions,
    allowedPlaceholders,
  };

  const canonicalJson = canonicalJsonStringify(request);
  const requestHash = await sha256Hex(canonicalJson);

  return {
    request,
    canonicalJson,
    requestHash,
  };
}

export async function buildPreparedHelperRequest(params: {
  caseSession: CaseSession;
  term: string;
  billingContext: string;
  requestedMode: InferenceMode;
  targetModel: string;
}): Promise<PreparedRequestWithHash> {
  const { caseSession, term, billingContext, requestedMode, targetModel } = params;

  const request: PreparedRequest = {
    version: '1.0',
    caseId: caseSession.caseId,
    caseNonce: caseSession.caseNonce,
    caseRevision: caseSession.revision,
    task: 'EXPLAIN_TERM',
    requestedMode,
    targetCloudModel: targetModel,
    sanitizedDocuments: [
      {
        id: 'term_snippet',
        kind: 'NOTES',
        sanitizedText: `Term: ${term}\nContext: ${billingContext}`,
      },
    ],
    jurisdiction: 'IN',
    currency: 'INR',
    promptInstructions: 'Explain this medical billing term or code in plain, understandable language without legal jargon.',
    allowedPlaceholders: [],
  };

  const canonicalJson = canonicalJsonStringify(request);
  const requestHash = await sha256Hex(canonicalJson);

  return {
    request,
    canonicalJson,
    requestHash,
  };
}
