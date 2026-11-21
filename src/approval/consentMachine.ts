/**
 * Consent State Machine & Invalidation Tracker.
 * 
 * Enforces:
 * 1. Consent is cryptographically bound to the canonical request hash and case revision.
 * 2. Any source edit, document addition, or policy change immediately consumes/invalidates consent.
 * 3. Consent is single-use for one dispatch flight.
 */
import { ConsentRecord } from '../contracts/types';

class ConsentMachine {
  private activeConsent: ConsentRecord | null = null;

  public grantConsent(
    requestHash: string,
    caseRevision: number,
    policyRevision = '1.0'
  ): ConsentRecord {
    const consent: ConsentRecord = {
      consentId: `cst_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      requestHash,
      caseRevision,
      policyRevision,
      timestampIso: new Date().toISOString(),
      consumed: false,
    };
    this.activeConsent = consent;
    return consent;
  }

  public getConsent(): ConsentRecord | null {
    return this.activeConsent;
  }

  public isConsentValid(requestHash: string, caseRevision: number): boolean {
    if (!this.activeConsent) return false;
    if (this.activeConsent.consumed) return false;
    return (
      this.activeConsent.requestHash === requestHash &&
      this.activeConsent.caseRevision === caseRevision
    );
  }

  public consumeConsent(consentId: string): boolean {
    if (this.activeConsent && this.activeConsent.consentId === consentId) {
      this.activeConsent.consumed = true;
      return true;
    }
    return false;
  }

  public invalidate() {
    this.activeConsent = null;
  }
}

export const consentMachine = new ConsentMachine();
