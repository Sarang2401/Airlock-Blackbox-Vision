/**
 * Receipt Verifier & Integrity Checker.
 * 
 * Verifies:
 * 1. Genesis hash continuity.
 * 2. Hash chaining: event[n].previousHash === event[n-1].eventHash.
 * 3. Content integrity: recomputes SHA-256 over canonical event fields.
 * 4. Truncation detection when trusted head is provided.
 */
import { ReceiptEvent } from '../contracts/types';
import { canonicalJsonStringify, sha256Hex } from '../contracts/canonical';
import { GENESIS_HASH } from './ledger';

export interface VerificationResult {
  isValid: boolean;
  totalEvents: number;
  corruptedEventIndex?: number;
  errorDescription?: string;
  isTruncationDetected?: boolean;
}

export async function verifyReceiptChain(
  events: ReceiptEvent[],
  expectedHeadHash?: string
): Promise<VerificationResult> {
  if (events.length === 0) {
    return {
      isValid: true,
      totalEvents: 0,
    };
  }

  let expectedPrevHash = GENESIS_HASH;

  for (let i = 0; i < events.length; i++) {
    const event = events[i];

    // Check previous hash pointer
    if (event.previousHash !== expectedPrevHash) {
      return {
        isValid: false,
        totalEvents: events.length,
        corruptedEventIndex: i,
        errorDescription: `Hash chain broken at event #${i + 1} (${event.eventId}). Expected previousHash ${expectedPrevHash}, found ${event.previousHash}`,
      };
    }

    // Recompute event hash
    const { eventHash, ...hashableFields } = event;
    const canonicalStr = canonicalJsonStringify(hashableFields);
    const recomputed = await sha256Hex(canonicalStr);

    if (recomputed !== eventHash) {
      return {
        isValid: false,
        totalEvents: events.length,
        corruptedEventIndex: i,
        errorDescription: `Tampered event detected at index #${i + 1} (${event.eventId}). Recomputed hash ${recomputed} does not match recorded ${eventHash}`,
      };
    }

    expectedPrevHash = eventHash;
  }

  // Check trusted head if supplied
  if (expectedHeadHash) {
    const lastEvent = events[events.length - 1];
    if (lastEvent.eventHash !== expectedHeadHash) {
      return {
        isValid: false,
        totalEvents: events.length,
        isTruncationDetected: true,
        errorDescription: `Trusted head mismatch: Expected head ${expectedHeadHash}, but ledger terminates at ${lastEvent.eventHash}. Tail truncation suspected.`,
      };
    }
  }

  return {
    isValid: true,
    totalEvents: events.length,
  };
}
