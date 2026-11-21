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
import { DisputePack, TransformationMap, DateRef } from '../contracts/types';
import { DisputePackSchema } from '../contracts/schemas';

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
  const placeholderRegex = /\[(PATIENT|GOVT_ID|POLICY_NO|CLAIM_NO|HOSPITAL|ID|DIAGNOSIS)_[A-Z0-9]+_\d+[^\]]*\]/g;
  let match: RegExpExecArray | null;
  while ((match = placeholderRegex.exec(responseJson)) !== null) {
    const token = match[0];
    if (!token.includes(`_${map.caseNonce}_`)) {
      violations.push(`Cross-case or unauthorized token detected in cloud output: ${token}`);
    }
  }

  // 3. XSS / Malicious HTML / Script / External image injection scan
  const hostileRegex = /<script\b[^>]*>|<\/script>|<img\b[^>]*src=["']http|<iframe\b|javascript:/i;
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
  const rehydrated = rehydrateDisputePack(disputePack, map);

  return {
    passed: true,
    sanitizedDisputePack: disputePack,
    rehydratedDisputePack: rehydrated,
    violations: [],
  };
}

function rehydrateDisputePack(
  pack: DisputePack,
  map: TransformationMap
): DisputePack {
  let jsonStr = JSON.stringify(pack);

  // 1. Replace DateRefs: [DATE_DREF_1:2026-08-15] -> originalIso
  for (const [refId, dateRefObj] of Object.entries(map.dateRefs)) {
    const dateRef = dateRefObj as DateRef;
    const pattern = new RegExp(`\\[DATE_${refId}:[0-9-]+\\]`, 'g');
    jsonStr = jsonStr.replace(pattern, dateRef.originalIso);
  }

  // 2. Replace typed placeholders with original values
  for (const [token, originalVal] of Object.entries(map.placeholders)) {
    const original = String(originalVal);
    const escaped = token.replace(/[[\]]/g, '\\$&');
    const pattern = new RegExp(escaped, 'g');
    jsonStr = jsonStr.replace(pattern, () => original);
  }

  // 3. Replace generalized diagnosis tokens
  for (const [original, generalizedVal] of Object.entries(map.diagnosesGeneralized)) {
    const generalized = String(generalizedVal);
    const escapedGen = generalized.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const diagPattern = new RegExp(`\\[DIAGNOSIS_${map.caseNonce}_\\d+:\\s*${escapedGen}\\]`, 'g');
    jsonStr = jsonStr.replace(diagPattern, () => original);
  }

  return JSON.parse(jsonStr) as DisputePack;
}
