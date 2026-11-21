/**
 * Capability Tier & Cloud Dispatch Eligibility Classifier.
 * 
 * Rules:
 * - TIER_A_NANO: Nano on-device model initialized and functional. Eligible for cloud if residual warnings == 0.
 * - TIER_B_NO_NANO:
 *   - Curated synthetic sample: eligible via verified fixture labels.
 *   - Arbitrary free-text narrative: NOT eligible for cloud reasoning (cannot guarantee no free-text names remain). Stays LOCAL_ONLY.
 * - TIER_C_OFFLINE: Static local help only. No cloud calls.
 */
import { CapabilityTier } from '../contracts/types';

export interface EligibilityResult {
  tier: CapabilityTier;
  isEligibleForCloud: boolean;
  reason: string;
}

export function classifyCloudEligibility(params: {
  isOnline: boolean;
  isNanoAvailable: boolean;
  isCuratedSyntheticSample: boolean;
  hasUnresolvedResidualWarnings: boolean;
  hasRawNarrativeModifications: boolean;
}): EligibilityResult {
  const {
    isOnline,
    isNanoAvailable,
    isCuratedSyntheticSample,
    hasUnresolvedResidualWarnings,
    hasRawNarrativeModifications,
  } = params;

  // Tier C: Offline
  if (!isOnline) {
    return {
      tier: 'TIER_C_OFFLINE',
      isEligibleForCloud: false,
      reason: 'Device is offline. Local deterministic audit and static guidance remain active.',
    };
  }

  // Tier A: Nano Available
  if (isNanoAvailable) {
    if (hasUnresolvedResidualWarnings) {
      return {
        tier: 'TIER_A_NANO',
        isEligibleForCloud: false,
        reason: 'Residual privacy scan detected unresolved candidate identifiers. Review required before cloud dispatch.',
      };
    }
    return {
      tier: 'TIER_A_NANO',
      isEligibleForCloud: true,
      reason: 'On-device Gemini Nano extraction verified. Sanitized skeleton eligible for cloud reasoning upon user approval.',
    };
  }

  // Tier B: No Nano
  if (isCuratedSyntheticSample && !hasRawNarrativeModifications) {
    return {
      tier: 'TIER_B_NO_NANO',
      isEligibleForCloud: true,
      reason: 'Curated synthetic sample using verified audit labels. Eligible for cloud reasoning in Judge Mode upon user approval.',
    };
  }

  // Tier B with arbitrary or edited free-text
  return {
    tier: 'TIER_B_NO_NANO',
    isEligibleForCloud: false,
    reason: 'On-device Gemini Nano is unavailable for arbitrary free-text. Under fail-closed policy, unverified narratives remain local-only.',
  };
}
