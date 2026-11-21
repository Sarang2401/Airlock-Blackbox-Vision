import { describe, it, expect } from 'vitest';
import { runDeterministicDetectors } from '../../src/airlock/deterministic';
import { transformCaseDocuments } from '../../src/airlock/transformation';
import { normalizeDocumentText } from '../../src/ingestion/normalizer';

describe('Security & Privacy Egress Canaries', () => {
  it('strictly ensures no raw personal identifiers exist in sanitized output', () => {
    const rawBill = `
APEX HOSPITAL BILL
Patient: Sunita Sundaram
Aadhaar: 4829 1049 2812 | PAN: ABCPV1234K
Phone: +91 98201 44512 | Email: sunita.s@example.com
Policy No: POL-IND-9948201 | Claim No: CLM-882910
Total: Rs. 1,45,000
    `;

    const normalized = normalizeDocumentText('bill_canary', 'BILL', 'Bill', rawBill);
    const findings = runDeterministicDetectors('bill_canary', normalized.normalizedText);

    const transform = transformCaseDocuments('case_canary', [normalized], findings, {
      discloseHospital: false,
      expandDiagnosis: false,
    });

    const sanitized = transform.sanitizedDocuments[0].sanitizedText;

    // CANARY CHECKS: None of these raw values can appear in the sanitized output
    expect(sanitized).not.toContain('Sunita Sundaram');
    expect(sanitized).not.toContain('4829 1049 2812');
    expect(sanitized).not.toContain('ABCPV1234K');
    expect(sanitized).not.toContain('98201 44512');
    expect(sanitized).not.toContain('sunita.s@example.com');
    expect(sanitized).not.toContain('POL-IND-9948201');
    expect(sanitized).not.toContain('CLM-882910');

    // Placeholders must be present
    expect(sanitized).toContain(`[PATIENT_${transform.transformationMap.caseNonce}_1]`);
    expect(sanitized).toContain(`[GOVT_ID_${transform.transformationMap.caseNonce}_1]`);

    // Residual scanner must report 0 warnings
    expect(transform.residualWarnings.length).toBe(0);
  });
});
