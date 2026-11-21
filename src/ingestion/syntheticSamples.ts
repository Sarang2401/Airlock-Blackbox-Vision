/**
 * Curated Synthetic Case Samples for Judges and Demonstration.
 * 
 * 100% fictional names, hospitals, policy numbers, and dates.
 */

export interface SyntheticSampleCase {
  id: string;
  title: string;
  description: string;
  jurisdiction: 'IN' | 'US';
  currency: string;
  documents: Array<{
    kind: 'BILL' | 'DENIAL_LETTER' | 'POLICY' | 'DISCHARGE_SUMMARY';
    displayName: string;
    text: string;
  }>;
  expectedIssues: string[];
}

export const SYNTHETIC_SAMPLE_CASES: SyntheticSampleCase[] = [
  {
    id: 'sample_india_denial_dispute',
    title: 'Indian Health Claim: Room Rent Capping & Disputed Pre-Existing Denial',
    description: 'Patient admitted for acute cardiac care. Insurer rejected claim under Clause 4.2 (waiting period), and hospital bill contains duplicate ICU monitoring fees and package overages.',
    jurisdiction: 'IN',
    currency: 'INR',
    expectedIssues: [
      'Room rent capped at 1% of Sum Insured, creating proportionate deduction',
      'Denial under Clause 4.2 invalid: condition first diagnosed 3 years post-inception',
      'Duplicate charge for Arterial Blood Gas (ABG) monitoring on day 2',
    ],
    documents: [
      {
        kind: 'DENIAL_LETTER',
        displayName: 'Insurer_Repudiation_Letter.txt',
        text: `SURAKSHA HEALTH INSURANCE CO. LTD.
Claims Processing Center, Mumbai 400051
Date: 14/10/2026

To:
Mr. Ramesh Chandra Verma
UHID / Insured ID: SHI-88492019
Claim No: CLM-2026-993812
Policy No: POL-IND-44829104
Contact: +91 98201 44512 | ramesh.verma72@example.com
Aadhaar: 4829 1049 2814 | PAN: ABCPV1234K

Dear Mr. Ramesh Chandra Verma,

RE: REPUDIATION OF CLAIM NO. CLM-2026-993812
Patient: Ramesh Chandra Verma | Age: 54 Y | Hospital: Apex Multi-Speciality Hospital, Bengaluru

We refer to your cashless/reimbursement hospitalization claim submitted on 10/10/2026 for hospitalization between 04/10/2026 and 08/10/2026.

Upon review of the discharge summary, the competent medical board has repudiated the claim under Policy Clause 4.2:
"Exclusion 4.2 - Pre-Existing Diseases: Any condition or related ailment diagnosed within 36 months of policy inception is excluded from coverage."

Hospital reported treatment for Acute Subendocardial Myocardial Infarction. Claimed sum: Rs. 2,45,000/-.
Hence, your claim stands repudiated.

Yours sincerely,
Authorized Signatory, Suraksha Health Insurance`,
      },
      {
        kind: 'POLICY',
        displayName: 'Suraksha_Policy_Wording_Excerpt.txt',
        text: `SURAKSHA HEALTH INSURANCE POLICY DOCUMENT (REVISION 2024)

SECTION 4: EXCLUSIONS & WAITING PERIODS
Clause 4.1: First 30 Days Waiting Period - Except for accidental injury.
Clause 4.2: Pre-Existing Disease (PED) Waiting Period - Coverage for PED begins after continuous coverage of 24 months (2 policy years) from first inception, provided policy has been renewed without break.
Clause 4.3: Specific Ailment Waiting Period - 24 months for specified surgeries (cataract, hernia, joint replacement).

SECTION 5: ROOM RENT LIMITATION
Clause 5.1: Room rent is capped at 1% of Sum Insured per day for Standard Private AC Room, and 2% for ICU. If insured chooses a higher category room, all associated hospital charges shall be proportionately deducted.`,
      },
      {
        kind: 'BILL',
        displayName: 'Apex_Hospital_Itemized_Bill.txt',
        text: `APEX MULTI-SPECIALITY HOSPITAL
Bengaluru - 560034
Final Itemized Inpatient Bill
Patient: Ramesh Chandra Verma | UHID: SHI-88492019 | A/C: 981203491823 | IFSC: HDFC0001234
Admission Date: 04/10/2026 | Discharge Date: 08/10/2026

Line Item Breakdown:
1. Deluxe Suite Room Rent (4 Days @ Rs. 9,000/day): Rs. 36,000
2. ICU Bed Charges (2 Days @ Rs. 15,000/day): Rs. 30,000
3. Coronary Angiography Procedure Fee: Rs. 65,000
4. Consumables & Surgical Catheter Pack: Rs. 28,000
5. Arterial Blood Gas (ABG) Lab Monitoring (05/10/2026): Rs. 4,500
6. Arterial Blood Gas (ABG) Lab Monitoring (05/10/2026 Duplicate Entry): Rs. 4,500
7. Cardiologist Consultation (Dr. S. K. Kulkarni): Rs. 22,000
8. Pharmacy & Injections: Rs. 55,000

Total Hospital Bill: Rs. 2,45,000`,
      },
    ],
  },
  {
    id: 'sample_us_unbundled_er',
    title: 'US Hospital ER Bill: Unbundled Lab Codes & Balance Billing',
    description: 'Emergency department visit in Austin, TX. Routine venipuncture billed separately from blood panel, and out-of-network assistant surgeon fee disputed under No Surprises Act.',
    jurisdiction: 'US',
    currency: 'USD',
    expectedIssues: [
      'Unbundled routine venipuncture (CPT 36415) from Comprehensive Metabolic Panel',
      'Balance billing for assistant surgeon at in-network facility violates No Surprises Act',
    ],
    documents: [
      {
        kind: 'BILL',
        displayName: 'Austin_Regional_Hospital_Bill.txt',
        text: `AUSTIN REGIONAL MEDICAL CENTER
1400 Health Parkway, Austin, TX 78701
Date of Service: 2026-09-12 | Account #: 882910492 | MRN: MRN-991820
Patient: Jonathan Edward Miller | DOB: 1982-05-14 | SSN: 452-88-9102
Policy #: AET-9948120 | Phone: (512) 555-0199 | Email: jmiller82@example.com

Itemized Hospital Charges:
- CPT 99285 Emergency Department Visit Level 5: $2,450.00
- CPT 80053 Comprehensive Metabolic Panel: $480.00
- CPT 36415 Routine Venipuncture Collection (Unbundled): $125.00
- CPT 71046 Chest X-Ray 2-Views: $620.00
- CPT 99024 Assistant Surgeon Hospital Fee (Out-of-Network): $1,800.00

Total Amount Billed: $5,475.00
Patient Responsibility: $2,850.00`,
      },
      {
        kind: 'DENIAL_LETTER',
        displayName: 'Explanation_Of_Benefits.txt',
        text: `AETNA HEALTHCARE EOB
Claim ID: CLM-US-7749102 | Member ID: AET-9948120
Patient: Jonathan Edward Miller

Claim Determination Summary:
- CPT 36415: Denied. Incidental to primary laboratory diagnostic service.
- CPT 99024: Non-participating provider rate applied. Billed amount exceeds Maximum Allowable Charge. Balance of $1,800.00 transferred to patient liability.`,
      },
    ],
  },
];
