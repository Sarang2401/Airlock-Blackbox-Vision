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
import { PreparedRequest, DisputePack, TransformationMap, ExecutionKind, ReceiptEvent } from '../contracts/types';
import { PreparedRequestSchema } from '../contracts/schemas';
import { canonicalJsonStringify, sha256Hex } from '../contracts/canonical';
import { consentMachine } from '../approval/consentMachine';
import { remoteConfigManager } from '../firebase/remoteConfig';
import { receiptLedger } from '../receipts/ledger';
import { firebaseAIAdapter } from '../firebase/aiAdapter';
import { validateAndRehydrateDisputePack, validateLiveJudgeOutput } from '../airlock/firewall';
import { liveJudgeConfigured } from '../firebase/config';
import { isLiveJudgeEnvelope } from '../ingestion/liveJudgeCase';
import { buildLiveJudgeDisputePack } from '../ingestion/sampleDisputePack';
import { blackBoxStore } from '../../packages/black-box';

export interface DispatchResult<T> {
  success: boolean;
  rehydratedData?: T;
  sanitizedData?: T;
  source?: 'ON_DEVICE' | 'IN_CLOUD' | 'UNKNOWN';
  latencyMs?: number;
  executionKind?: ExecutionKind;
  error?: string;
  firewallViolations?: string[];
}

export async function dispatchDisputePack(params: {
  preparedRequest: PreparedRequest;
  requestHash: string;
  transformationMap: TransformationMap;
  mockGenerator: (source: any) => DisputePack;
  isLiveJudgeCurrent?: () => boolean;
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
  const live = preparedRequest.execution;
  const executionKind: ExecutionKind = live ? 'LIVE' : 'SIMULATED';
  const canUseLiveRoute = () => {
    const policy = remoteConfigManager.getPolicy();
    return liveJudgeConfigured && params.isLiveJudgeCurrent?.() === true
      && live?.policyVersion === policy.policyVersion
      && policy.allowedCloudModels.includes(preparedRequest.targetCloudModel);
  };
  const canDispatch = () => remoteConfigManager.isCloudEnabled()
    && (typeof navigator === 'undefined' || navigator.onLine !== false)
    && (!live || canUseLiveRoute());

  // 2. Kill Switch Check
  if (!remoteConfigManager.isCloudEnabled()) {
    return {
      success: false,
      error: 'Cloud dispatch blocked: Remote Config kill switch is active (cloudEnabled=false).',
    };
  }
  if (live && (!isLiveJudgeEnvelope(preparedRequest, transformationMap) || !canUseLiveRoute())) {
    return { success: false, error: 'Live Firebase is available only for the verified Judge Mode preview. Scan the fictional case again.' };
  }

  // 3. Bind approval to the exact immutable payload and reserve single-use consent.
  const canonicalRequest = canonicalJsonStringify(preparedRequest);
  if (await sha256Hex(canonicalRequest) !== requestHash) {
    return { success: false, error: 'The approved fingerprint no longer matches this request. Review the case again.' };
  }
  const consent = consentMachine.getConsent();
  if (!consent || (live && consent.policyRevision !== live.policyVersion)
    || !consentMachine.isConsentValid(requestHash, preparedRequest.caseRevision)) {
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
    executionKind,
  };

  // 4. Persist INTENT before starting an SDK call or simulation.
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

  let status: ReceiptEvent['status'] = 'CANCELLED';
  let result: DispatchResult<DisputePack> = { success: false, error: 'The route became unavailable. Check your settings or connection and approve again.' };
  let source: DispatchResult<DisputePack>['source'];
  let latencyMs: number | undefined;
  if (canDispatch()) {
    const start = performance.now();
    try {
      let data: unknown;
      if (live) {
        const { inferLiveJudge } = await import('../firebase/liveJudgeAdapter');
        if (!canDispatch()) throw new Error('LIVE_JUDGE_CANCELLED');
        const response = await inferLiveJudge(canonicalRequest, canDispatch);
        source = response.observedCloud ? 'IN_CLOUD' : 'UNKNOWN';
        latencyMs = Math.round(performance.now() - start);
        const issues = response.observedCloud ? validateLiveJudgeOutput(response.text) : null;
        if (issues) data = buildLiveJudgeDisputePack(issues, Object.keys(transformationMap.placeholders));
      } else {
        const response = await firebaseAIAdapter.executeInference<DisputePack>({
          featureName: 'dispute_pack_reasoning',
          mode: preparedRequest.requestedMode,
          prompt: canonicalRequest,
          modelName: preparedRequest.targetCloudModel,
          mockGenerator,
        });
        ({ data, source, latencyMs } = response);
      }

      if (!live || canDispatch()) {
        const firewall = validateAndRehydrateDisputePack(data, transformationMap);
        status = firewall.passed ? 'SUCCESS' : 'FIREWALL_BLOCKED';
        result = firewall.passed
          ? { success: true, rehydratedData: firewall.rehydratedDisputePack, sanitizedData: firewall.sanitizedDisputePack, source, latencyMs, executionKind }
          : { success: false, error: firewall.blockReason, firewallViolations: firewall.violations };
      }
    } catch (error) {
      if (!(error instanceof Error && error.message === 'LIVE_JUDGE_CANCELLED')) {
        status = 'ERROR';
        result = { success: false, error: live ? 'Live Firebase analysis did not complete. Check your connection and try approving again.' : 'The sample analysis did not complete. Try approving again.' };
      }
    }
  }

  try {
    await receiptLedger.appendEvent({ ...receipt, eventType: 'OUTCOME', actualSource: source, status, errorMessage: result.error });
  } catch {
    return { success: false, error: 'The browser could not record the outcome. Check Privacy Receipts before retrying.' };
  }
  if (live && latencyMs !== undefined) {
    blackBoxStore.recordEvent({
      executionKind,
      featureName: 'dispute_pack_reasoning',
      requestedMode: preparedRequest.requestedMode,
      observedSource: source ?? 'UNKNOWN',
      latencyMs,
      inputTokens: 0,
      outputTokens: 0,
      success: result.success,
      errorCategory: result.success ? undefined : status,
    });
  }
  return result;
}
