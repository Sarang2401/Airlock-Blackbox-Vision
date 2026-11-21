/**
 * Black Box Observability Store & Instrumentation.
 * UI-independent, zero raw content, records inference metadata only.
 */
import { BlackBoxEvent, RouteMixSummary } from './types';
import { InferenceMode, InferenceSource } from '../../src/contracts/types';

class BlackBoxStore {
  private events: BlackBoxEvent[] = [];

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const stored = window.localStorage.getItem('black_box_events');
        if (stored) {
          this.events = JSON.parse(stored);
        }
      }
    } catch {
      // ignore
    }
  }

  private saveToStorage() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem('black_box_events', JSON.stringify(this.events.slice(-500)));
      }
    } catch {
      // ignore
    }
  }

  public recordEvent(params: {
    featureName: string;
    requestedMode: InferenceMode;
    observedSource: InferenceSource;
    latencyMs: number;
    inputTokens: number;
    outputTokens: number;
    success: boolean;
    errorCategory?: string;
    deviceClass?: 'DESKTOP_SUPPORTED' | 'MOBILE_WEB' | 'NO_NANO_BROWSER';
    fallbackReason?: 'NONE' | 'DEVICE_UNSUPPORTED' | 'MODEL_NOT_READY' | 'POLICY_OVERRIDE' | 'OFFLINE';
  }): BlackBoxEvent {
    const event: BlackBoxEvent = {
      eventId: `bb_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      featureName: params.featureName,
      requestedMode: params.requestedMode,
      observedSource: params.observedSource,
      latencyMs: params.latencyMs,
      inputTokenEstimate: params.inputTokens,
      outputTokenEstimate: params.outputTokens,
      success: params.success,
      errorCategory: params.errorCategory,
      deviceClass: params.deviceClass || 'DESKTOP_SUPPORTED',
      fallbackReason: params.fallbackReason || 'NONE',
      timestampIso: new Date().toISOString(),
    };

    this.events.push(event);
    this.saveToStorage();
    return event;
  }

  public getEvents(): BlackBoxEvent[] {
    return [...this.events];
  }

  public computeSummary(): RouteMixSummary {
    const total = this.events.length;
    if (total === 0) {
      return {
        totalCalls: 0,
        onDeviceCalls: 0,
        inCloudCalls: 0,
        unknownCalls: 0,
        cloudCallsAvoided: 0,
        p50LatencyMs: 0,
        p95LatencyMs: 0,
        onDeviceP50LatencyMs: 0,
        inCloudP50LatencyMs: 0,
        fallbackBreakdown: {},
      };
    }

    const onDevice = this.events.filter((e) => e.observedSource === 'ON_DEVICE').length;
    const inCloud = this.events.filter((e) => e.observedSource === 'IN_CLOUD').length;
    const unknown = total - onDevice - inCloud;

    // Cloud calls avoided: count completed on-device operations for tasks that could have used cloud
    const cloudCallsAvoided = onDevice;

    // Latencies
    const allLatencies = this.events.map((e) => e.latencyMs).sort((a, b) => a - b);
    const onDeviceLatencies = this.events
      .filter((e) => e.observedSource === 'ON_DEVICE')
      .map((e) => e.latencyMs)
      .sort((a, b) => a - b);
    const inCloudLatencies = this.events
      .filter((e) => e.observedSource === 'IN_CLOUD')
      .map((e) => e.latencyMs)
      .sort((a, b) => a - b);

    const getPercentile = (arr: number[], pct: number) => {
      if (arr.length === 0) return 0;
      const idx = Math.min(Math.floor((pct / 100) * arr.length), arr.length - 1);
      return arr[idx];
    };

    const fallbackBreakdown: Record<string, number> = {};
    for (const e of this.events) {
      if (e.fallbackReason && e.fallbackReason !== 'NONE') {
        fallbackBreakdown[e.fallbackReason] = (fallbackBreakdown[e.fallbackReason] || 0) + 1;
      }
    }

    return {
      totalCalls: total,
      onDeviceCalls: onDevice,
      inCloudCalls: inCloud,
      unknownCalls: unknown,
      cloudCallsAvoided,
      p50LatencyMs: getPercentile(allLatencies, 50),
      p95LatencyMs: getPercentile(allLatencies, 95),
      onDeviceP50LatencyMs: getPercentile(onDeviceLatencies, 50),
      inCloudP50LatencyMs: getPercentile(inCloudLatencies, 50),
      fallbackBreakdown,
    };
  }

  public clear() {
    this.events = [];
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem('black_box_events');
      }
    } catch {
      // ignore
    }
  }
}

export const blackBoxStore = new BlackBoxStore();
