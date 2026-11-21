import { describe, it, expect } from 'vitest';
import { runDeterministicDetectors } from '../../src/airlock/deterministic';
import { validateVerhoeff, validatePAN, validateSSN } from '../../src/airlock/verhoeff';

describe('Deterministic Layered Detectors', () => {
  it('validates Aadhaar Verhoeff checksum accurately', () => {
    // Valid Verhoeff Aadhaar test numbers
    expect(validateVerhoeff('4829 1049 2812')).toBe(true);
    // Invalid checksum
    expect(validateVerhoeff('4829 1049 2815')).toBe(false);
    expect(validateVerhoeff('1234 5678 9012')).toBe(false);
  });

  it('validates PAN structure accurately', () => {
    expect(validatePAN('ABCPV1234K')).toBe(true);
    expect(validatePAN('XYZPA9921M')).toBe(true);
    // Invalid PAN
    expect(validatePAN('12345ABCDE')).toBe(false);
    expect(validatePAN('ABC1234DEF')).toBe(false);
  });

  it('validates US SSN structure', () => {
    expect(validateSSN('452-88-9102')).toBe(true);
    // Invalid area 000 or 666
    expect(validateSSN('000-88-9102')).toBe(false);
    expect(validateSSN('666-88-9102')).toBe(false);
  });

  it('detects Indian and US sensitive identifiers in synthetic bills', () => {
    const text = `Patient: Ramesh Verma | Aadhaar: 4829 1049 2812 | PAN: ABCPV1234K
Phone: +91 98201 44512 | Policy: POL-IND-44829104 | Claim: CLM-992810
Admission: 2026-08-10 | Hospital: Apex Multi-Speciality Hospital`;

    const findings = runDeterministicDetectors('doc_1', text);
    const types = findings.map((f) => f.type);

    expect(types).toContain('GOVT_ID');
    expect(types).toContain('PAN_NUMBER');
    expect(types).toContain('PHONE_NUMBER');
    expect(types).toContain('POLICY_NUMBER');
    expect(types).toContain('CLAIM_NUMBER');
    expect(types).toContain('DATE');
    expect(types).toContain('HOSPITAL_NAME');
  });
});
