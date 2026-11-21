/**
 * Append-Only Local Privacy Receipt Ledger.
 * 
 * Cryptographically links each inference request intent and outcome.
 * Every cloud-capable inference attempt MUST have an INTENT committed
 * prior to outbound SDK dispatch.
 */
import { ReceiptEvent, ReceiptEventType, InferenceMode, InferenceSource } from '../contracts/types';
import { canonicalJsonStringify, sha256Hex } from '../contracts/canonical';

export const GENESIS_HASH = '0000000000000000000000000000000000000000000000000000000000000000';

class ReceiptLedger {
  private events: ReceiptEvent[] = [];
  private lastHash: string = GENESIS_HASH;

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const stored = window.localStorage.getItem('airlock_receipt_ledger');
        if (stored) {
          const parsed = JSON.parse(stored) as ReceiptEvent[];
          if (Array.isArray(parsed) && parsed.length > 0) {
            this.events = parsed;
            this.lastHash = parsed[parsed.length - 1].eventHash;
          }
        }
      }
    } catch (e) {
      console.warn('Could not load ledger from localStorage, using memory storage', e);
    }
  }

  private saveToStorage() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem('airlock_receipt_ledger', JSON.stringify(this.events));
      }
    } catch (e) {
      console.warn('Could not persist ledger to localStorage', e);
    }
  }

  public getEvents(): ReceiptEvent[] {
    return [...this.events];
  }

  public getLastHash(): string {
    return this.lastHash;
  }

  public async appendEvent(params: {
    eventType: ReceiptEventType;
    caseId: string;
    requestId: string;
    requestedMode?: InferenceMode;
    actualSource?: InferenceSource;
    canonicalRequestHash?: string;
    sanitizedPayloadLength?: number;
    modelIdentifier?: string;
    status: 'PENDING' | 'SUCCESS' | 'FIREWALL_BLOCKED' | 'ERROR' | 'CANCELLED';
    errorMessage?: string;
  }): Promise<ReceiptEvent> {
    const eventId = `rec_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const timestampIso = new Date().toISOString();
    const previousHash = this.lastHash;

    const baseEvent = {
      ledgerVersion: '1.0' as const,
      eventId,
      eventType: params.eventType,
      caseId: params.caseId,
      requestId: params.requestId,
      timestampIso,
      previousHash,
      requestedMode: params.requestedMode,
      actualSource: params.actualSource,
      canonicalRequestHash: params.canonicalRequestHash,
      sanitizedPayloadLength: params.sanitizedPayloadLength,
      modelIdentifier: params.modelIdentifier,
      status: params.status,
      errorMessage: params.errorMessage,
    };

    // Calculate SHA-256 over canonical representation excluding eventHash
    const canonicalStr = canonicalJsonStringify(baseEvent);
    const eventHash = await sha256Hex(canonicalStr);

    const fullEvent: ReceiptEvent = {
      ...baseEvent,
      eventHash,
    };

    this.events.push(fullEvent);
    this.lastHash = eventHash;
    this.saveToStorage();

    return fullEvent;
  }

  public clear() {
    this.events = [];
    this.lastHash = GENESIS_HASH;
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem('airlock_receipt_ledger');
      }
    } catch {
      // ignore
    }
  }
}

export const receiptLedger = new ReceiptLedger();
