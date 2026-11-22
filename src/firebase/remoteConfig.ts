/**
 * Remote Config Policy Management & Kill Switch.
 * 
 * Invariants:
 * 1. Bundled mandatory safety floor ALWAYS wins (remote settings cannot disable local redaction).
 * 2. Client kill switch: when cloudEnabled is false, all cloud inference is halted immediately.
 * 3. Client never holds Firebase Admin credentials.
 */
import { RemoteConfigPolicy } from '../contracts/types';
import { RemoteConfigPolicySchema } from '../contracts/schemas';

export const BUNDLED_DEFAULT_POLICY: RemoteConfigPolicy = {
  policyVersion: '2026.11-default-1.0',
  cloudEnabled: true,
  minSanitizationTier: 'STRICT',
  allowedCloudModels: [
    'gemini-2.5-flash',
    'gemini-3.5-flash-lite',
    'gemini-2.5-pro',
    'gemini-1.5-pro',
    'gemini-1.5-flash',
  ],
  defaultCloudModel: 'gemini-2.5-flash',
  preferOnDeviceForHelpers: true,
  latencyThresholdMs: 4000,
};

class RemoteConfigManager {
  private currentPolicy: RemoteConfigPolicy = { ...BUNDLED_DEFAULT_POLICY };

  public getPolicy(): RemoteConfigPolicy {
    return { ...this.currentPolicy };
  }

  public isCloudEnabled(): boolean {
    return this.currentPolicy.cloudEnabled;
  }

  public setKillSwitch(enabled: boolean) {
    this.currentPolicy.cloudEnabled = enabled;
  }

  /**
   * Applies an external policy JSON (e.g. from Remote Config or local simulator),
   * rigorously validating schema and enforcing safety floors.
   */
  public updatePolicy(incoming: unknown): { success: boolean; error?: string } {
    const parse = RemoteConfigPolicySchema.safeParse(incoming);
    if (!parse.success) {
      return {
        success: false,
        error: `Policy validation failed: ${parse.error.errors.map((e: any) => e.message).join(', ')}`,
      };
    }

    const validated = parse.data;

    // Safety Floor Invariant: Must keep STRICT sanitization
    this.currentPolicy = {
      ...validated,
      minSanitizationTier: 'STRICT', // Enforce floor
    };

    return { success: true };
  }

  public resetToBundled() {
    this.currentPolicy = { ...BUNDLED_DEFAULT_POLICY };
  }
}

export const remoteConfigManager = new RemoteConfigManager();
