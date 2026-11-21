/**
 * Deterministic layered entity detectors.
 * High-recall regular expressions & algorithmic validators.
 */
import { EntityFinding, EntityType } from '../contracts/types';
import { validateVerhoeff, validatePAN, validateSSN } from './verhoeff';

export function runDeterministicDetectors(
  documentId: string,
  text: string
): EntityFinding[] {
  const findings: EntityFinding[] = [];
  let idCounter = 1;

  function addFinding(
    type: EntityType,
    start: number,
    end: number,
    exactSubstring: string,
    confidence = 1.0
  ) {
    findings.push({
      id: `det_${documentId}_${idCounter++}`,
      documentId,
      type,
      start,
      end,
      exactSubstring,
      provenance: 'DETERMINISTIC',
      confidence,
      reviewed: false,
    });
  }

  // 1. Aadhaar (12 digits, with or without spaces/hyphens)
  const aadhaarRegex = /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g;
  let match: RegExpExecArray | null;
  while ((match = aadhaarRegex.exec(text)) !== null) {
    const raw = match[0];
    const isChecksumValid = validateVerhoeff(raw);
    addFinding('GOVT_ID', match.index, match.index + raw.length, raw, isChecksumValid ? 1.0 : 0.85);
  }

  // 2. PAN Number (India: 5 letters, 4 digits, 1 letter)
  const panRegex = /\b[A-Za-z]{5}[0-9]{4}[A-Za-z]\b/g;
  while ((match = panRegex.exec(text)) !== null) {
    const raw = match[0];
    if (validatePAN(raw)) {
      addFinding('PAN_NUMBER', match.index, match.index + raw.length, raw, 1.0);
    }
  }

  // 3. US Social Security Number (SSN: 9 digits formatted or raw)
  const ssnRegex = /\b\d{3}-\d{2}-\d{4}\b/g;
  while ((match = ssnRegex.exec(text)) !== null) {
    const raw = match[0];
    if (validateSSN(raw)) {
      addFinding('GOVT_ID', match.index, match.index + raw.length, raw, 1.0);
    }
  }

  // 4. Phone Numbers (Indian 10-digit mobile with +91/0, spaced 5+5, or US 10-digit)
  const phoneRegex = /(?:(?:\+?91[\s-]?)?[6-9]\d{2,4}[\s.-]?\d{3,5}|\b(?:\+?1[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4})\b/g;
  while ((match = phoneRegex.exec(text)) !== null) {
    const raw = match[0];
    const digitsOnly = raw.replace(/\D/g, '');
    if (digitsOnly.length >= 10 && digitsOnly.length <= 13) {
      addFinding('PHONE_NUMBER', match.index, match.index + raw.length, raw, 0.95);
    }
  }

  // 5. Email Addresses
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g;
  while ((match = emailRegex.exec(text)) !== null) {
    addFinding('EMAIL_ADDRESS', match.index, match.index + match[0].length, match[0], 1.0);
  }

  // 6. Policy & Claim Numbers
  const policyClaimRegex = /(?:Policy(?:\s*(?:No|Number|#))?|Claim(?:\s*(?:No|Number|#|Id))?|UHID|POL#|CLM#)[:\s-]*([A-Z0-9/-]{6,25})\b/gi;
  while ((match = policyClaimRegex.exec(text)) !== null) {
    const full = match[0];
    const valueOnly = match[1];
    const type: EntityType = full.toLowerCase().includes('claim') ? 'CLAIM_NUMBER' : 'POLICY_NUMBER';
    const startIdx = match.index + full.indexOf(valueOnly);
    addFinding(type, startIdx, startIdx + valueOnly.length, valueOnly, 0.95);
  }

  // 7. IFSC & Bank Account Numbers
  const ifscRegex = /\b[A-Z]{4}0[A-Z0-9]{6}\b/g;
  while ((match = ifscRegex.exec(text)) !== null) {
    addFinding('IFSC_CODE', match.index, match.index + match[0].length, match[0], 1.0);
  }

  const bankAccRegex = /(?:A\/C|Account(?:\s*(?:No|Number|#))?)[:\s-]*([0-9]{9,18})\b/gi;
  while ((match = bankAccRegex.exec(text)) !== null) {
    const full = match[0];
    const value = match[1];
    const start = match.index + full.indexOf(value);
    addFinding('BANK_ACCOUNT', start, start + value.length, value, 0.9);
  }

  // 8. Dates (ISO, DD/MM/YYYY, MM/DD/YYYY, or Word formats)
  const dateRegex = /\b(?:\d{4}-\d{2}-\d{2}|\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},?\s+\d{4})\b/gi;
  while ((match = dateRegex.exec(text)) !== null) {
    addFinding('DATE', match.index, match.index + match[0].length, match[0], 0.9);
  }

  // 9. Personal Name indicators (Mr./Mrs./Ms./Dr./Patient/Name:)
  const nameIndicatorRegex = /(?:(?:Patient(?:\s*Name)?|Insured(?:\s*Name)?|Dr\.|Doctor|Mr\.|Mrs\.|Ms\.)[:\s]+)([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3})\b/g;
  while ((match = nameIndicatorRegex.exec(text)) !== null) {
    const full = match[0];
    const nameOnly = match[1];
    const start = match.index + full.indexOf(nameOnly);
    addFinding('PERSON_NAME', start, start + nameOnly.length, nameOnly, 0.9);
  }

  // 10. Hospital / Clinic Name indicators
  const hospitalRegex = /\b([A-Z][A-Za-z0-9&.\s]{2,40}(?:Hospital|Clinic|Healthcare|Nursing Home|Medical Center|Health City|Infirmary))\b/g;
  while ((match = hospitalRegex.exec(text)) !== null) {
    addFinding('HOSPITAL_NAME', match.index, match.index + match[0].length, match[0], 0.85);
  }

  return findings;
}
