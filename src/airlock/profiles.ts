/**
 * Privacy Profiles & Clinical Generalization Mapping.
 * 
 * Enforces:
 * - Mandatory never-leaves floor (person names, government IDs, phone, email, policy/claim, bank account).
 * - High-risk clinical diagnoses mapped to clinical categories unless user explicitly opts in.
 * - Hospital names redacted by default, with explicit disclosure opt-in for package rate comparisons.
 */

export const MANDATORY_NEVER_LEAVES_TYPES = [
  'PERSON_NAME',
  'GOVT_ID',
  'PAN_NUMBER',
  'PHONE_NUMBER',
  'EMAIL_ADDRESS',
  'POLICY_NUMBER',
  'CLAIM_NUMBER',
  'BANK_ACCOUNT',
  'IFSC_CODE',
  'STREET_ADDRESS',
] as const;

export const CLINICAL_DIAGNOSIS_CATEGORY_MAP: Record<string, string> = {
  // Cardiology
  'acute subendocardial myocardial infarction': 'Cardiac condition',
  'myocardial infarction': 'Cardiac condition',
  'coronary artery disease': 'Cardiac condition',
  'angina pectoris': 'Cardiac condition',
  'hypertensive heart disease': 'Cardiovascular condition',
  // Oncology
  'infiltrating duct carcinoma of breast': 'Oncological condition',
  'adenocarcinoma of colon': 'Oncological condition',
  'squamous cell carcinoma': 'Oncological condition',
  // Orthopedics
  'fracture of femoral neck': 'Orthopedic injury',
  'lumbar disc herniation': 'Spinal/Orthopedic condition',
  'osteoarthritis of knee': 'Joint degenerative condition',
  // Ophthalmology
  'senile cataract': 'Ophthalmic procedure',
  'diabetic retinopathy': 'Ophthalmic condition',
  // General / Infection
  'dengue fever with thrombocytopenia': 'Acute infectious condition',
  'acute appendicitis': 'Abdominal surgical condition',
  'cholelithiasis with cholecystitis': 'Abdominal surgical condition',
};

export function generalizeDiagnosis(
  originalDiagnosis: string,
  expandDiagnosis: boolean
): string {
  if (expandDiagnosis) {
    return originalDiagnosis;
  }
  const lower = originalDiagnosis.trim().toLowerCase();
  for (const [key, category] of Object.entries(CLINICAL_DIAGNOSIS_CATEGORY_MAP)) {
    if (lower.includes(key)) {
      return category;
    }
  }
  return 'Medical condition';
}
