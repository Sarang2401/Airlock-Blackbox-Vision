import { describe, it, expect } from 'vitest';
import { receiptLedger, GENESIS_HASH } from '../../src/receipts/ledger';
import { verifyReceiptChain } from '../../src/receipts/verifier';

describe('Local Append-Only Receipt Ledger & Verifier', () => {
  it('chains events sequentially starting from genesis hash', async () => {
    receiptLedger.clear();

    const ev1 = await receiptLedger.appendEvent({
      eventType: 'INTENT',
      caseId: 'case_1',
      requestId: 'req_1',
      status: 'PENDING',
    });

    expect(ev1.previousHash).toBe(GENESIS_HASH);

    const ev2 = await receiptLedger.appendEvent({
      eventType: 'OUTCOME',
      caseId: 'case_1',
      requestId: 'req_1',
      status: 'SUCCESS',
    });

    expect(ev2.previousHash).toBe(ev1.eventHash);

    const verification = await verifyReceiptChain(receiptLedger.getEvents());
    expect(verification.isValid).toBe(true);
    expect(verification.totalEvents).toBe(2);
  });

  it('detects tampered events in the ledger', async () => {
    receiptLedger.clear();

    await receiptLedger.appendEvent({
      eventType: 'INTENT',
      caseId: 'case_2',
      requestId: 'req_2',
      status: 'PENDING',
    });

    const events = receiptLedger.getEvents();
    // Tamper with status
    (events[0] as any).status = 'SUCCESS';

    const verification = await verifyReceiptChain(events);
    expect(verification.isValid).toBe(false);
    expect(verification.corruptedEventIndex).toBe(0);
  });
});
