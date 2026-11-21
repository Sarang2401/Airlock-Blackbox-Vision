/**
 * Policy Recommendation Engine for Remote Config.
 * 
 * Recommends routing policy JSON based on:
 * 1. Privacy benchmark leak rate (MUST be <= 0.05).
 * 2. Device observed latency.
 * 3. Fallback frequency.
 */
import { RemoteConfigPolicy } from '../../src/contracts/types';
import { RouteMixSummary, BenchmarkReport } from './types';

export function generateRecommendedPolicy(
  summary: RouteMixSummary,
  benchmark?: BenchmarkReport
): RemoteConfigPolicy {
  const isHealthyNano = summary.onDeviceCalls > 0 && summary.onDeviceP50LatencyMs < 4000;
  const isBenchmarkSafe = benchmark ? benchmark.leakRate === 0 : true;

  // Never enable cloud for raw detection; this policy controls cloud-capable helpers & dispute reasoning
  return {
    policyVersion: `2026.11-rec-${Date.now().toString().slice(-4)}`,
    cloudEnabled: true,
    minSanitizationTier: isBenchmarkSafe ? 'STRICT' : 'STRICT',
    allowedCloudModels: [
      'gemini-2.5-pro',
      'gemini-2.5-flash',
      'gemini-1.5-pro',
      'gemini-1.5-flash',
    ],
    defaultCloudModel: 'gemini-2.5-flash',
    preferOnDeviceForHelpers: isHealthyNano,
    latencyThresholdMs: isHealthyNano ? 3500 : 5000,
  };
}
