/**
 * Black Box Observability Package Types.
 * Zero document content or sensitive parameters in telemetry.
 */
import { ExecutionKind, InferenceMode, InferenceSource } from '../../src/contracts/types';

export interface BlackBoxEvent {
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
  timestampIso: string;
  executionKind?: ExecutionKind;
}

export interface RouteMixSummary {
  totalCalls: number;
  onDeviceCalls: number;
  inCloudCalls: number;
  unknownCalls: number;
  cloudCallsAvoided: number;
  p50LatencyMs: number;
  p95LatencyMs: number;
  onDeviceP50LatencyMs: number;
  inCloudP50LatencyMs: number;
  fallbackBreakdown: Record<string, number>;
}

export interface BenchmarkReport {
  precision: number;
  recall: number;
  leakRate: number;
  utilityAgreement: number;
  eligiblePercentage: number;
}
