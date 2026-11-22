/**
 * Single Guarded AI Dispatcher.
 * 
 * Central enforcement boundary for all cloud-capable inference in Airlock.
 * 
 * Invariants:
 * 1. Outbound envelope MUST be validated against PreparedRequestSchema.
 * 2. Kill switch checked immediately before dispatch.
 * 3. INTENT receipt durably appended before a browser dispatch.
 * 4. Response buffered and checked through Output Firewall before UI/export.
 * 5. Rehydration strictly localized to active case mapping.
 * 6. OUTCOME receipt appended upon completion or failure.
 */
import { PreparedRequest, DisputePack, TransformationMap } from '../contracts/types';
import { PreparedRequestSchema } from '../contracts/schemas';
import { canonicalJsonStringify, sha256Hex } from '../contracts/canonical';
import { consentMachine } from '../approval/consentMachine';
import { remoteConfigManager } from '../firebase/remoteConfig';
import { receiptLedger } from '../receipts/ledger';
import { firebaseAIAdapter } from '../firebase/aiAdapter';
import { validateAndRehydrateDisputePack } from '../airlock/firewall';

export interface DispatchResult<T> {
  success: boolean;
  rehydratedData?: T;
  sanitizedData?: T;
  source?: 'ON_DEVICE' | 'IN_CLOUD' | 'UNKNOWN';
  latencyMs?: number;
  error?: string;
  firewallViolations?: string[];
}

export async function dispatchDisputePack(params: {
  preparedRequest: PreparedRequest;
  requestHash: string;
  transformationMap: TransformationMap;
  mockGenerator: (source: any) => DisputePack;
}): Promise<DispatchResult<DisputePack>> {
  const { requestHash, transformationMap, mockGenerator } = params;

  // 1. Runtime Schema Validation
  const schemaValidation = PreparedRequestSchema.safeParse(params.preparedRequest);
  if (!schemaValidation.success) {
    return {
      success: false,
      error: `Dispatcher rejected request schema: ${schemaValidation.error.errors.map((e) => e.message).join(', ')}`,
    };
  }

  const preparedRequest = schemaValidation.data;

  // 2. Kill Switch Check
  if (!remoteConfigManager.isCloudEnabled()) {
    return {
      success: false,
      error: 'Cloud dispatch blocked: Remote Config kill switch is active (cloudEnabled=false).',
    };
  }

  // 3. Bind approval to the exact immutable payload and reserve single-use consent.
  const canonicalRequest = canonicalJsonStringify(preparedRequest);
  if (await sha256Hex(canonicalRequest) !== requestHash) {
    return { success: false, error: 'The approved fingerprint no longer matches this request. Review the case again.' };
  }
  const consent = consentMachine.getConsent();
  if (!consent || !consentMachine.isConsentValid(requestHash, preparedRequest.caseRevision)) {
    return { success: false, error: 'Approval is missing or has already been used. Review the request and approve again.' };
  }
  consentMachine.consumeConsent(consent.consentId);

  const requestId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const receipt = {
    caseId: preparedRequest.caseId,
    requestId,
    requestedMode: preparedRequest.requestedMode,
    canonicalRequestHash: requestHash,
    modelIdentifier: preparedRequest.targetCloudModel,
  };

  // 4. Persist INTENT before starting the simulation.
  try {
    await receiptLedger.appendEvent({
      ...receipt,
      eventType: 'INTENT',
      sanitizedPayloadLength: canonicalRequest.length,
      status: 'PENDING',
    });
  } catch {
    return { success: false, error: 'Approval could not be recorded in this browser. Check storage access and try again.' };
  }

  // 5. Execute Hybrid Inference
  try {
    if (!remoteConfigManager.isCloudEnabled() || (typeof window !== 'undefined' && !navigator.onLine)) {
      await receiptLedger.appendEvent({ ...receipt, eventType: 'OUTCOME', status: 'CANCELLED' });
      return { success: false, error: 'The route became unavailable. Check your settings or connection and approve again.' };
    }

    const aiResponse = await firebaseAIAdapter.executeInference<DisputePack>({
      featureName: 'dispute_pack_reasoning',
      mode: preparedRequest.requestedMode,
      prompt: canonicalRequest,
      modelName: preparedRequest.targetCloudModel,
      mockGenerator,
    });

    // 6. Output Firewall Verification & Local Rehydration
    const firewallResult = validateAndRehydrateDisputePack(aiResponse.data, transformationMap);

    if (!firewallResult.passed) {
      // Append firewall blocked outcome receipt
      await receiptLedger.appendEvent({
        ...receipt,
        eventType: 'OUTCOME',
        actualSource: aiResponse.source,
        status: 'FIREWALL_BLOCKED',
        errorMessage: firewallResult.blockReason,
      });

      return {
        success: false,
        error: firewallResult.blockReason,
        firewallViolations: firewallResult.violations,
      };
    }

    // 7. Append SUCCESS Outcome Receipt
    await receiptLedger.appendEvent({
      ...receipt,
      eventType: 'OUTCOME',
      actualSource: aiResponse.source,
      status: 'SUCCESS',
    });

    return {
      success: true,
      rehydratedData: firewallResult.rehydratedDisputePack,
      sanitizedData: firewallResult.sanitizedDisputePack,
      source: aiResponse.source,
      latencyMs: aiResponse.latencyMs,
    };
  } catch {
    try {
      await receiptLedger.appendEvent({ ...receipt, eventType: 'OUTCOME', status: 'ERROR', errorMessage: 'Sample inference did not complete.' });
    } catch {
      return { success: false, error: 'The browser could not record the outcome. Check Privacy Receipts before retrying.' };
    }
    return { success: false, error: 'The sample analysis did not complete. Try approving again.' };
  }
}
