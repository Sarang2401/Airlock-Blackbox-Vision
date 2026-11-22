/**
 * Output Firewall & Local Rehydration Boundary.
 * 
 * Responsibilities:
 * 1. Whole-response buffering (no token streaming directly into DOM).
 * 2. Strict schema validation against DisputePackSchema or HelperResultSchema.
 * 3. Token allowlist validation: rejects unknown placeholders not in the current session.
 * 4. XSS & HTML injection prevention.
 * 5. Local rehydration: replaces approved session tokens and restores DateRefs.
 */
import { DisputePack, TransformationMap } from '../contracts/types';
import { DisputePackSchema } from '../contracts/schemas';
import { z } from 'zod';
import { liveJudgeIssueKinds, type LiveJudgeIssue } from '../ingestion/liveJudgeCase';

const liveJudgeOutputSchema = z.object({
  issues: z.array(z.enum(liveJudgeIssueKinds)).max(liveJudgeIssueKinds.length)
    .refine((issues) => new Set(issues).size === issues.length),
}).strict();

export function validateLiveJudgeOutput(text: string): LiveJudgeIssue[] | null {
  if (text.length > 1024) return null;
  try {
    const result = liveJudgeOutputSchema.safeParse(JSON.parse(text));
    return result.success ? result.data.issues : null;
  } catch {
    return null;
  }
}

export interface FirewallResult {
  passed: boolean;
  sanitizedDisputePack?: DisputePack;
  rehydratedDisputePack?: DisputePack;
  blockReason?: string;
  violations: string[];
}

export function validateAndRehydrateDisputePack(
  rawResponse: unknown,
  map: TransformationMap
): FirewallResult {
  const violations: string[] = [];

  // 1. Strict Schema Validation
  const parseResult = DisputePackSchema.safeParse(rawResponse);
  if (!parseResult.success) {
    return {
      passed: false,
      blockReason: 'Output firewall rejected malformed response schema.',
      violations: parseResult.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`),
    };
  }

  const disputePack = parseResult.data as DisputePack;

  // 2. Token Allowlist & Unknown Token Detection
  const responseJson = JSON.stringify(disputePack);
  const dates = new Map<string, string>(Object.values(map.dateRefs).map((date) =>
    [`[DATE_${date.id}:${date.shiftedIso}]`, date.originalIso] as const
  ));
  const placeholderRegex = /\[(?:PATIENT|GOVT_ID|POLICY_NO|CLAIM_NO|HOSPITAL|ID|DIAGNOSIS|DATE)_[^\]\r\n]+\]/g;
  for (const [token] of responseJson.matchAll(placeholderRegex)) {
    if (!Object.hasOwn(map.placeholders, token) && !dates.has(token)) {
      violations.push('Cross-case or unauthorized token detected in cloud output.');
    }
  }

  // 3. XSS / Malicious HTML / Script / External image injection scan
  const hostileRegex = /<\/?[a-z][^>]*>|javascript:/i;
  if (hostileRegex.test(responseJson)) {
    violations.push('Hostile markup or script injection detected in cloud model output.');
  }

  if (violations.length > 0) {
    return {
      passed: false,
      blockReason: 'Output firewall blocked response due to integrity/security violations.',
      violations,
    };
  }

  // 4. Local Rehydration
  const rehydrated = JSON.parse(JSON.stringify(disputePack, (_key, value: unknown) => {
    if (typeof value !== 'string') return value;
    return value.replace(placeholderRegex, (token) => dates.get(token) ?? map.placeholders[token] ?? token);
  })) as DisputePack;

  return {
    passed: true,
    sanitizedDisputePack: disputePack,
    rehydratedDisputePack: rehydrated,
    violations: [],
  };
}
