/**
 * Local simulation of Firebase AI Logic routes for the curated walkthrough.
 * 
 * Supports the 4 documented modes:
 * - ONLY_ON_DEVICE: Gemini Nano extraction (fails closed if model missing).
 * - ONLY_IN_CLOUD: Cloud Gemini reasoning on sanitized skeleton.
 * - PREFER_ON_DEVICE: Term helper (local if ready, cloud fallback).
 * - PREFER_IN_CLOUD: Sanitized explanation review (cloud preferred, local fallback).
 */
import { InferenceMode, InferenceSource } from '../contracts/types';
import { blackBoxStore } from '../../packages/black-box';

export interface AIInferenceParams {
  mode: InferenceMode;
  prompt: string;
  systemInstruction?: string;
  modelName?: string;
  schema?: any;
}

export interface AIInferenceResponse<T> {
  data: T;
  source: InferenceSource;
  latencyMs: number;
  inputTokens: number;
  outputTokens: number;
}

class FirebaseAIAdapter {
  // The packaged walkthrough cannot establish live model readiness.
  private readonly isNanoAvailable = false;

  public async executeInference<T>(params: {
    featureName: string;
    mode: InferenceMode;
    prompt: string;
    systemInstruction?: string;
    modelName?: string;
    mockGenerator: (source: InferenceSource) => T;
  }): Promise<AIInferenceResponse<T>> {
    const startTime = performance.now();
    let source: InferenceSource = 'UNKNOWN';
    let fallbackReason: any = 'NONE';

    // Simulate route selection without calling an SDK or initializing an app.
    switch (params.mode) {
      case 'ONLY_ON_DEVICE':
        if (!this.isNanoAvailable) {
          throw new Error('ONLY_ON_DEVICE inference requested, but on-device Gemini Nano is not available on this device.');
        }
        source = 'ON_DEVICE';
        break;

      case 'ONLY_IN_CLOUD':
        source = 'IN_CLOUD';
        break;

      case 'PREFER_ON_DEVICE':
        if (this.isNanoAvailable) {
          source = 'ON_DEVICE';
        } else {
          source = 'IN_CLOUD';
          fallbackReason = 'DEVICE_UNSUPPORTED';
        }
        break;

      case 'PREFER_IN_CLOUD':
        // If online, cloud is preferred
        if (typeof navigator !== 'undefined' && !navigator.onLine) {
          source = 'ON_DEVICE';
          fallbackReason = 'OFFLINE';
        } else {
          source = 'IN_CLOUD';
        }
        break;
    }

    let data: T;
    try {
      data = params.mockGenerator(source);
    } catch (e: any) {
      const latencyMs = Math.round(performance.now() - startTime);
      blackBoxStore.recordEvent({
        featureName: params.featureName,
        requestedMode: params.mode,
        observedSource: source,
        latencyMs,
        inputTokens: Math.round(params.prompt.length / 4),
        outputTokens: 0,
        success: false,
        errorCategory: e?.message || 'UNKNOWN_ERROR',
        fallbackReason,
      });
      throw e;
    }

    const latencyMs = Math.round(performance.now() - startTime);
    const inputTokens = Math.round(params.prompt.length / 4);
    const outputTokens = Math.round(JSON.stringify(data).length / 4);

    blackBoxStore.recordEvent({
      featureName: params.featureName,
      requestedMode: params.mode,
      observedSource: source,
      latencyMs,
      inputTokens,
      outputTokens,
      success: true,
      fallbackReason,
    });

    return {
      data,
      source,
      latencyMs,
      inputTokens,
      outputTokens,
    };
  }
}

export const firebaseAIAdapter = new FirebaseAIAdapter();
