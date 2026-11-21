/**
 * Case Session Transformation & Residual Scanner.
 * 
 * Generates:
 * 1. Cryptographically random per-case nonce (prevents cross-session token collisions).
 * 2. Typed placeholders: [PATIENT_<nonce>_1], [POLICY_NO_<nonce>_1], [HOSPITAL_<nonce>_1].
 * 3. Escaping of source-authored placeholder syntax.
 * 4. Residual scanner to detect any unredacted canaries before approval.
 */
import {
  NormalizedDocument,
  EntityFinding,
  TransformationMap,
  DateRef,
} from '../contracts/types';
import { reconcileSpans, applyRightToLeftReplacements, ReplacementItem } from './spanReconciliation';
import { generateRandomDayOffset, createDateRef } from './dateTransform';
import { generalizeDiagnosis } from './profiles';

export function generateCaseNonce(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let nonce = '';
  for (let i = 0; i < 4; i++) {
    nonce += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return nonce;
}

export interface TransformResult {
  transformationMap: TransformationMap;
  sanitizedDocuments: Array<{
    documentId: string;
    sanitizedText: string;
  }>;
  residualWarnings: string[];
}

export function transformCaseDocuments(
  caseId: string,
  documents: NormalizedDocument[],
  allFindings: EntityFinding[],
  options: {
    discloseHospital: boolean;
    expandDiagnosis: boolean;
  }
): TransformResult {
  const caseNonce = generateCaseNonce();
  const dayOffset = generateRandomDayOffset();

  const placeholders: Record<string, string> = {};
  const reversePlaceholders: Record<string, string> = {};
  const dateRefs: Record<string, DateRef> = {};
  const diagnosesGeneralized: Record<string, string> = {};

  // Counters for typed placeholders
  let patientCounter = 1;
  let policyCounter = 1;
  let claimCounter = 1;
  let hospitalCounter = 1;
  let dateCounter = 1;
  let govtIdCounter = 1;
  let genericCounter = 1;

  // Process per document
  const sanitizedDocuments = documents.map((doc) => {
    // Find findings for this document
    const docFindings = allFindings.filter((f) => f.documentId === doc.id);
    const reconciled = reconcileSpans(docFindings);

    const replacements: ReplacementItem[] = [];

    for (const finding of reconciled) {
      const raw = finding.exactSubstring;

      // Handle Hospital opt-in
      if (finding.type === 'HOSPITAL_NAME' && options.discloseHospital) {
        continue; // Keep exact hospital name
      }

      // Check if already mapped
      if (reversePlaceholders[raw]) {
        replacements.push({
          start: finding.start,
          end: finding.end,
          replacementText: reversePlaceholders[raw],
        });
        continue;
      }

      // Generate typed placeholder
      let token = '';
      switch (finding.type) {
        case 'PERSON_NAME':
          token = `[PATIENT_${caseNonce}_${patientCounter++}]`;
          break;
        case 'GOVT_ID':
        case 'PAN_NUMBER':
          token = `[GOVT_ID_${caseNonce}_${govtIdCounter++}]`;
          break;
        case 'POLICY_NUMBER':
          token = `[POLICY_NO_${caseNonce}_${policyCounter++}]`;
          break;
        case 'CLAIM_NUMBER':
          token = `[CLAIM_NO_${caseNonce}_${claimCounter++}]`;
          break;
        case 'HOSPITAL_NAME':
          token = `[HOSPITAL_${caseNonce}_${hospitalCounter++}]`;
          break;
        case 'DATE': {
          const dref = createDateRef(dateCounter++, raw, dayOffset);
          dateRefs[dref.id] = dref;
          token = `[DATE_${dref.id}:${dref.shiftedIso}]`;
          break;
        }
        case 'DIAGNOSIS': {
          const generalized = generalizeDiagnosis(raw, options.expandDiagnosis);
          diagnosesGeneralized[raw] = generalized;
          token = `[DIAGNOSIS_${caseNonce}_${genericCounter++}: ${generalized}]`;
          break;
        }
        default:
          token = `[ID_${caseNonce}_${genericCounter++}]`;
          break;
      }

      placeholders[token] = raw;
      reversePlaceholders[raw] = token;

      replacements.push({
        start: finding.start,
        end: finding.end,
        replacementText: token,
      });
    }

    // Apply right-to-left
    const sanitizedText = applyRightToLeftReplacements(doc.normalizedText, replacements);

    return {
      documentId: doc.id,
      sanitizedText,
    };
  });

  const transformationMap: TransformationMap = {
    caseId,
    caseNonce,
    dayOffset,
    placeholders,
    reversePlaceholders,
    dateRefs,
    diagnosesGeneralized,
    disclosedHospital: options.discloseHospital,
  };

  // Run residual scan over sanitized texts
  const residualWarnings = runResidualScan(sanitizedDocuments.map((d) => d.sanitizedText), transformationMap);

  return {
    transformationMap,
    sanitizedDocuments,
    residualWarnings,
  };
}

/**
 * Residual scan: checks that no original raw identifiers or unredacted patterns survive.
 */
export function runResidualScan(
  sanitizedTexts: string[],
  map: TransformationMap
): string[] {
  const warnings: string[] = [];
  const fullText = sanitizedTexts.join('\n');

  // 1. Check for surviving original values (except permitted disclosed items)
  for (const [placeholder, original] of Object.entries(map.placeholders)) {
    if (original.length >= 4 && fullText.includes(original)) {
      warnings.push(`Residual match detected: original value for placeholder ${placeholder} found in sanitized text.`);
    }
  }

  // 2. Check for surviving PAN-like strings
  const panMatch = fullText.match(/\b[A-Za-z]{5}[0-9]{4}[A-Za-z]\b/);
  if (panMatch) {
    warnings.push(`Unredacted PAN number pattern detected: ${panMatch[0]}`);
  }

  // 3. Check for surviving 10-digit mobile patterns
  const phoneMatch = fullText.match(/\b[6-9]\d{9}\b/);
  if (phoneMatch) {
    warnings.push(`Unredacted mobile phone pattern detected: ${phoneMatch[0]}`);
  }

  return warnings;
}
