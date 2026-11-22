import { ReceiptEvent, ReceiptEventType, InferenceMode, InferenceSource } from '../contracts/types';
import { canonicalJsonStringify, sha256Hex } from '../contracts/canonical';

export const GENESIS_HASH = '0000000000000000000000000000000000000000000000000000000000000000';

const storageScope = import.meta.env.BASE_URL;
const STORAGE_KEY = storageScope === '/' ? 'airlock_receipt_ledger' : `airlock_receipt_ledger:${storageScope}`;
const CHANGE_EVENT = 'escrowhealth:receipts-changed';

interface ReceiptInput {
  eventType: ReceiptEventType;
  caseId: string;
  requestId: string;
  requestedMode?: InferenceMode;
  actualSource?: InferenceSource;
  canonicalRequestHash?: string;
  sanitizedPayloadLength?: number;
  modelIdentifier?: string;
  status: ReceiptEvent['status'];
  errorMessage?: string;
}

class ReceiptLedger {
  private events: ReceiptEvent[] = [];
  private pending = Promise.resolve();

  public getEvents(): ReceiptEvent[] {
    if (typeof window === 'undefined') return [...this.events];

    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    const events: unknown = JSON.parse(stored);
    if (!Array.isArray(events)) throw new Error('Invalid receipt history.');
    return events as ReceiptEvent[];
  }

  public subscribe(listener: () => void) {
    const handleStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY || event.key === null) listener();
    };
    window.addEventListener('storage', handleStorage);
    window.addEventListener(CHANGE_EVENT, listener);
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener(CHANGE_EVENT, listener);
    };
  }

  public async appendEvent(input: ReceiptInput): Promise<ReceiptEvent> {
    if (typeof window !== 'undefined') {
      if (!navigator.locks) return Promise.reject(new Error('Secure shared receipt storage is unavailable.'));
      // Read the latest chain under the cross-tab lock, including other tabs' writes.
      return await navigator.locks.request(STORAGE_KEY, () => this.commit(input));
    }

    const result = this.pending.then(() => this.commit(input));
    this.pending = result.then(() => undefined, () => undefined);
    return result;
  }

  private async commit(input: ReceiptInput): Promise<ReceiptEvent> {
    const events = this.getEvents();
    const baseEvent = {
      ...input,
      ledgerVersion: '1.0' as const,
      eventId: `rec_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      timestampIso: new Date().toISOString(),
      previousHash: events.at(-1)?.eventHash ?? GENESIS_HASH,
    };
    const eventHash = await sha256Hex(canonicalJsonStringify(baseEvent));
    const event = { ...baseEvent, eventHash };
    const updated = [...events, event];

    if (typeof window === 'undefined') {
      this.events = updated;
    } else {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      window.dispatchEvent(new Event(CHANGE_EVENT));
    }
    return event;
  }

  public getLastHash(): string {
    return this.getEvents().at(-1)?.eventHash ?? GENESIS_HASH;
  }

  public clear() {
    this.events = [];
    if (typeof window !== 'undefined') window.localStorage.removeItem(STORAGE_KEY);
  }
}

export const receiptLedger = new ReceiptLedger();
