/**
 * Single Guarded AI Dispatcher.
 * 
 * Central enforcement boundary for all cloud-capable inference in Airlock.
 * 
 * Invariants:
 * 1. Outbound envelope MUST be validated against PreparedRequestSchema.
 * 2. Kill switch checked immediately before dispatch.
 * 3. Immutable INTENT receipt committed to IndexedDB/memory ledger prior to SDK flight.
 * 4. Response buffered and checked through Output Firewall before UI/export.
 * 5. Rehydration strictly localized to active case mapping.
 * 6. OUTCOME receipt appended upon completion or failure.
 */
import { PreparedRequest, DisputePack, TransformationMap } from '../contracts/types';
import { PreparedRequestSchema } from '../contracts/schemas';
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
  const { preparedRequest, requestHash, transformationMap, mockGenerator } = params;

  // 1. Runtime Schema Validation
  const schemaValidation = PreparedRequestSchema.safeParse(preparedRequest);
  if (!schemaValidation.success) {
    return {
      success: false,
      error: `Dispatcher rejected request schema: ${schemaValidation.error.errors.map((e) => e.message).join(', ')}`,
    };
  }

  // 2. Kill Switch Check
  if (!remoteConfigManager.isCloudEnabled()) {
    return {
      success: false,
      error: 'Cloud dispatch blocked: Remote Config kill switch is active (cloudEnabled=false).',
    };
  }

  // 3. Consent Check
  if (!consentMachine.isConsentValid(requestHash, preparedRequest.caseRevision)) {
    return {
      success: false,
      error: 'Dispatcher rejected call: User consent is invalid, expired, or was already consumed.',
    };
  }

  const requestId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

  // 4. Commit INTENT Receipt to Ledger
  await receiptLedger.appendEvent({
    eventType: 'INTENT',
    caseId: preparedRequest.caseId,
    requestId,
    requestedMode: preparedRequest.requestedMode,
    canonicalRequestHash: requestHash,
    sanitizedPayloadLength: JSON.stringify(preparedRequest).length,
    modelIdentifier: preparedRequest.targetCloudModel,
    status: 'PENDING',
  });

  // 5. Execute Hybrid Inference
  try {
    const aiResponse = await firebaseAIAdapter.executeInference<DisputePack>({
      featureName: 'dispute_pack_reasoning',
      mode: preparedRequest.requestedMode,
      prompt: JSON.stringify(preparedRequest),
      modelName: preparedRequest.targetCloudModel,
      mockGenerator,
    });

    // 6. Output Firewall Verification & Local Rehydration
    const firewallResult = validateAndRehydrateDisputePack(aiResponse.data, transformationMap);

    if (!firewallResult.passed) {
      // Append firewall blocked outcome receipt
      await receiptLedger.appendEvent({
        eventType: 'OUTCOME',
        caseId: preparedRequest.caseId,
        requestId,
        requestedMode: preparedRequest.requestedMode,
        actualSource: aiResponse.source,
        modelIdentifier: preparedRequest.targetCloudModel,
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
      eventType: 'OUTCOME',
      caseId: preparedRequest.caseId,
      requestId,
      requestedMode: preparedRequest.requestedMode,
      actualSource: aiResponse.source,
      canonicalRequestHash: requestHash,
      modelIdentifier: preparedRequest.targetCloudModel,
      status: 'SUCCESS',
    });

    // 8. Consume Consent for this Flight
    const currentConsent = consentMachine.getConsent();
    if (currentConsent) {
      consentMachine.consumeConsent(currentConsent.consentId);
    }

    return {
      success: true,
      rehydratedData: firewallResult.rehydratedDisputePack,
      sanitizedData: firewallResult.sanitizedDisputePack,
      source: aiResponse.source,
      latencyMs: aiResponse.latencyMs,
    };
  } catch (err: any) {
    // Append ERROR Outcome Receipt
    await receiptLedger.appendEvent({
      eventType: 'OUTCOME',
      caseId: preparedRequest.caseId,
      requestId,
      requestedMode: preparedRequest.requestedMode,
      modelIdentifier: preparedRequest.targetCloudModel,
      status: 'ERROR',
      errorMessage: err?.message || 'Inference execution failed',
    });

    return {
      success: false,
      error: `Inference failed: ${err?.message || 'Unknown network error'}`,
    };
  }
}
