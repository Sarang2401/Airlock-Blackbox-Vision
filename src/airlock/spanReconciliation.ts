/**
 * Span Reconciliation & Non-Overlapping Replacement.
 *
 * Ensures:
 * 1. Zero-based UTF-16 non-overlapping ranges.
 * 2. Overlapping findings merged conservatively to maximize privacy.
 * 3. Exact right-to-left replacement so string offsets remain valid throughout.
 */
import { EntityFinding } from '../contracts/types';

export function reconcileSpans(findings: EntityFinding[]): EntityFinding[] {
  if (findings.length === 0) return [];

  // Sort by start position ascending, then length descending
  const sorted = [...findings].sort((a, b) => {
    if (a.start !== b.start) return a.start - b.start;
    return (b.end - b.start) - (a.end - a.start);
  });

  const reconciled: EntityFinding[] = [];
  let current = sorted[0];

  for (let i = 1; i < sorted.length; i++) {
    const next = sorted[i];

    if (next.start < current.end) {
      // Overlapping spans: merge into conservative larger boundary
      const mergedEnd = Math.max(current.end, next.end);
      const higherPriorityType = choosePriorityType(current.type, next.type);
      current = {
        ...current,
        type: higherPriorityType,
        end: mergedEnd,
        exactSubstring: current.exactSubstring + (next.end > current.end ? next.exactSubstring.slice(current.end - next.start) : ''),
        confidence: Math.max(current.confidence ?? 0.5, next.confidence ?? 0.5),
      };
    } else {
      reconciled.push(current);
      current = next;
    }
  }
  reconciled.push(current);

  return reconciled;
}

function choosePriorityType(t1: string, t2: string): any {
  // Direct government IDs & names have highest priority over generic dates/amounts
  const priorityOrder = [
    'GOVT_ID',
    'PAN_NUMBER',
    'PERSON_NAME',
    'POLICY_NUMBER',
    'CLAIM_NUMBER',
    'BANK_ACCOUNT',
    'IFSC_CODE',
    'PHONE_NUMBER',
    'EMAIL_ADDRESS',
    'STREET_ADDRESS',
    'HOSPITAL_NAME',
    'DIAGNOSIS',
    'DATE',
    'AMOUNT',
    'GENERIC_IDENTIFIER',
  ];

  const p1 = priorityOrder.indexOf(t1);
  const p2 = priorityOrder.indexOf(t2);
  if (p1 === -1) return t2;
  if (p2 === -1) return t1;
  return p1 <= p2 ? t1 : t2;
}

export interface ReplacementItem {
  start: number;
  end: number;
  replacementText: string;
}

/**
 * Apply replacements right-to-left to prevent index drift.
 */
export function applyRightToLeftReplacements(
  originalText: string,
  replacements: ReplacementItem[]
): string {
  // Sort descending by start
  const sorted = [...replacements].sort((a, b) => b.start - a.start);
  let result = originalText;

  for (const rep of sorted) {
    if (rep.start < 0 || rep.end > result.length || rep.start > rep.end) {
      throw new Error(`Invalid replacement span: [${rep.start}, ${rep.end}) in text of length ${result.length}`);
    }
    result = result.slice(0, rep.start) + rep.replacementText + result.slice(rep.end);
  }

  return result;
}
