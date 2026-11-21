/**
 * Synthetic Corpus Generator for Airlock-Bench.
 * 
 * Generates 105 fully labeled synthetic documents across 5 core healthcare billing categories:
 * 1. Hospital Bills (25 docs) - Indian and US itemized inpatient bills
 * 2. Denial Letters (25 docs) - Rejection notices with specific clause citations
 * 3. Insurance Policy Clauses (20 docs) - Waiting periods, room rent caps, exclusions
 * 4. Discharge Summaries (20 docs) - Clinical narratives, diagnoses, procedure dates
 * 5. Pharmacy Invoices (15 docs) - Itemized medications, batch numbers, tax numbers
 * 
 * 100% fictional data. Zero real personal or patient information.
 */

export interface BenchmarkDocument {
  id: string;
  category: 'BILL' | 'DENIAL' | 'POLICY' | 'DISCHARGE' | 'PHARMACY';
  format: 'IN' | 'US';
  difficulty: 'CLEAN' | 'NOISY_WRAP' | 'NARRATIVE';
  text: string;
  groundTruthEntities: Array<{
    type: string;
    value: string;
  }>;
  expectedDisputeIssues: string[];
}

export function generateBenchmarkCorpus(): BenchmarkDocument[] {
  const corpus: BenchmarkDocument[] = [];

  const indianNames = [
    'Rajesh Kumar Sharma', 'Priya S. Patel', 'Anil M. Joshi', 'Sunita Sundaram',
    'Vikram Malhotra', 'Meenakshi Iyer', 'Deepak R. Mehta', 'Asha K. Nair',
    'Suresh G. Patil', 'Pooja Agarwal', 'Karan J. Singh', 'Neha Mukherjee',
    'Manoj K. Gupta', 'Geeta N. Deshmukh', 'Arun V. Rao', 'Swati Bhattacharya',
    'Rohan K. Verma', 'Kavita Menon', 'Alok N. Pandey', 'Shalini Hegde',
    'Naveen Chawla', 'Bhavna Kulkarni', 'Siddharth Roy', 'Divya Sengupta', 'Vikas Reddy'
  ];

  const usNames = [
    'Arthur Pendelton', 'Sarah J. Connor', 'Michael B. Douglas', 'Emily R. Watson',
    'David H. Clark', 'Jessica L. Taylor', 'Robert M. Wilson', 'Laura K. Evans',
    'James P. Miller', 'Amanda G. White', 'Daniel C. Harris', 'Rachel S. Martin',
    'Thomas A. Anderson', 'Megan E. Jackson', 'Brian K. Lewis', 'Hannah F. Hall',
    'Kevin T. Allen', 'Lauren M. Young', 'Christopher D. King', 'Ashley E. Wright',
    'Joshua P. Scott', 'Stephanie L. Green', 'Matthew J. Baker', 'Nicole R. Adams', 'Andrew G. Nelson'
  ];

  // 1. Hospital Bills (25 documents: 15 Indian, 10 US)
  for (let i = 0; i < 25; i++) {
    const isIndia = i < 15;
    const name = isIndia ? indianNames[i % indianNames.length] : usNames[i % usNames.length];
    const docId = `DOC_BILL_${String(i + 1).padStart(3, '0')}`;

    if (isIndia) {
      const aadhaar = `48${(10 + i).toString().padStart(2, '0')} ${(2000 + i * 37).toString()} ${(4000 + i * 19).toString()}`;
      const pan = `ABC${String.fromCharCode(65 + (i % 26))}P${(1234 + i).toString()}K`;
      const policyNo = `POL-IN-${(550000 + i * 111).toString()}`;
      const uhid = `UHID-IN-${(100000 + i * 73).toString()}`;
      const text = `APEX MULTI-SPECIALITY HOSPITAL
Patient: ${name} | UHID: ${uhid}
Aadhaar: ${aadhaar} | PAN: ${pan} | Policy: ${policyNo}
Admission: 2026-08-${String(10 + (i % 10)).padStart(2, '0')} | Discharge: 2026-08-${String(15 + (i % 10)).padStart(2, '0')}
Charges:
1. Room Rent (Deluxe Suite 4 days @ Rs. 8,000): Rs. 32,000
2. ICU Bed Charges (2 days @ Rs. 14,000): Rs. 28,000
3. Surgical Package: Rs. 65,000
4. Pharmacy & Consumables: Rs. 18,500
5. Duplicate Lab Investigation Charge (Day 2 repeated): Rs. 3,500
Total Bill Amount: Rs. 1,47,000`;

      corpus.push({
        id: docId,
        category: 'BILL',
        format: 'IN',
        difficulty: i % 3 === 0 ? 'CLEAN' : i % 3 === 1 ? 'NOISY_WRAP' : 'NARRATIVE',
        text,
        groundTruthEntities: [
          { type: 'PERSON_NAME', value: name },
          { type: 'GOVT_ID', value: aadhaar },
          { type: 'PAN_NUMBER', value: pan },
          { type: 'POLICY_NUMBER', value: policyNo },
        ],
        expectedDisputeIssues: ['Room rent overage against standard tariff', 'Duplicate lab charge on day 2'],
      });
    } else {
      const ssn = `452-${String(10 + i).padStart(2, '0')}-${String(1000 + i * 29).padStart(4, '0')}`;
      const mrn = `MRN-US-${(880000 + i * 43).toString()}`;
      const policyNo = `AET-US-${(770000 + i * 59).toString()}`;
      const text = `ST. JUDE REGIONAL MEDICAL CENTER
Patient: ${name} | MRN: ${mrn} | SSN: ${ssn}
Policy ID: ${policyNo} | Date of Service: 2026-09-${String(10 + (i % 15)).padStart(2, '0')}
Billed Line Items:
- Emergency Room Level 4 (CPT 99284): $1,850.00
- Comprehensive Blood Panel (CPT 80053): $380.00
- Venipuncture Collection (CPT 36415, Unbundled): $95.00
- Out-of-Network Consulting Physician Fee: $1,200.00
Total Billed Charges: $3,525.00`;

      corpus.push({
        id: docId,
        category: 'BILL',
        format: 'US',
        difficulty: i % 2 === 0 ? 'CLEAN' : 'NOISY_WRAP',
        text,
        groundTruthEntities: [
          { type: 'PERSON_NAME', value: name },
          { type: 'GOVT_ID', value: ssn },
          { type: 'POLICY_NUMBER', value: policyNo },
        ],
        expectedDisputeIssues: ['Unbundled routine venipuncture fee', 'Out-of-network balance billing at in-network hospital'],
      });
    }
  }

  // 2. Denial Letters (25 documents: 15 Indian, 10 US)
  for (let i = 0; i < 25; i++) {
    const isIndia = i < 15;
    const name = isIndia ? indianNames[(i + 5) % indianNames.length] : usNames[(i + 5) % usNames.length];
    const docId = `DOC_DENIAL_${String(i + 1).padStart(3, '0')}`;
    const claimNo = `CLM-${(900000 + i * 231).toString()}`;
    const policyNo = `POL-${(400000 + i * 193).toString()}`;

    const text = isIndia
      ? `STAR GUARDIAN HEALTH INSURANCE
To: ${name} | Claim Ref: ${claimNo} | Policy: ${policyNo}
Dear Policyholder,
Your reimbursement claim for hospitalization between 2026-06-10 and 2026-06-14 stands REPUDIATED under Clause 4.2:
"Pre-existing ailments diagnosed prior to 36 months of inception are excluded."
Investigation shows treatment for hypertension and coronary heart disease. Claim sum: Rs. 1,80,000.`
      : `BLUE CROSS BLUE SHIELD CLAIMS
To: ${name} | Claim #: ${claimNo} | Policy ID: ${policyNo}
Notice of Adverse Benefit Determination:
Your claim for surgical procedure performed on 2026-07-12 has been DENIED under Plan Section 8.3:
"Prior authorization required for non-emergency inpatient admission."`;

    corpus.push({
      id: docId,
      category: 'DENIAL',
      format: isIndia ? 'IN' : 'US',
      difficulty: 'CLEAN',
      text,
      groundTruthEntities: [
        { type: 'PERSON_NAME', value: name },
        { type: 'CLAIM_NUMBER', value: claimNo },
        { type: 'POLICY_NUMBER', value: policyNo },
      ],
      expectedDisputeIssues: ['Contest repudiation using policy clause proof and inception records'],
    });
  }

  // 3. Insurance Policy Clauses (20 documents)
  for (let i = 0; i < 20; i++) {
    const docId = `DOC_POLICY_${String(i + 1).padStart(3, '0')}`;
    const clauseNo = `4.${(i % 5) + 1}`;
    const text = `MASTER HEALTH INSURANCE WORDING (SCHEDULE ${i + 1})
Section 4: Exclusions and Limitations
Clause ${clauseNo}: Pre-existing condition waiting period is 24 months of continuous coverage. Upon completion of 24 months, all declared cardiac, diabetic, and hypertensive ailments are covered at 100%.
Clause 5.1: Room rent limit is 1% of Sum Insured per day. Proportionate deductions apply only if higher category room is occupied.`;

    corpus.push({
      id: docId,
      category: 'POLICY',
      format: i % 2 === 0 ? 'IN' : 'US',
      difficulty: 'CLEAN',
      text,
      groundTruthEntities: [],
      expectedDisputeIssues: ['Proves 24-month waiting period completed, rendering 36-month denial void'],
    });
  }

  // 4. Discharge Summaries (20 documents)
  for (let i = 0; i < 20; i++) {
    const name = indianNames[(i + 10) % indianNames.length];
    const docId = `DOC_DISCHARGE_${String(i + 1).padStart(3, '0')}`;
    const diagnosis = i % 2 === 0 ? 'Acute Subendocardial Myocardial Infarction' : 'Dengue Fever with Thrombocytopenia';
    const text = `CITY CARE HOSPITAL DISCHARGE SUMMARY
Patient Name: ${name} | Age: 52 | Gender: Male
Admission: 2026-07-02 | Discharge: 2026-07-06
Clinical Diagnosis: ${diagnosis}
Course in Hospital: Patient presented with severe retrosternal chest pain and breathlessness. Evaluated and managed conservatively in CCU. Discharged in stable condition.`;

    corpus.push({
      id: docId,
      category: 'DISCHARGE',
      format: 'IN',
      difficulty: 'NARRATIVE',
      text,
      groundTruthEntities: [
        { type: 'PERSON_NAME', value: name },
        { type: 'DIAGNOSIS', value: diagnosis },
      ],
      expectedDisputeIssues: ['Documents first-onset acute episode, not pre-existing chronic neglect'],
    });
  }

  // 5. Pharmacy Invoices (15 documents)
  for (let i = 0; i < 15; i++) {
    const name = usNames[(i + 12) % usNames.length];
    const docId = `DOC_PHARMACY_${String(i + 1).padStart(3, '0')}`;
    const text = `WELLNESS PHARMACY & SURGICALS
Invoice #: PH-${(300000 + i * 88).toString()} | Tax ID: GSTIN27AAACG${(1000 + i).toString()}
Customer: ${name} | Doctor: Dr. K. Mehta
Items:
1. Tab Atorvastatin 20mg (Batch B${(100 + i).toString()}): Rs. 450.00
2. Tab Clopidogrel 75mg: Rs. 380.00
3. Disposable Syringes 5ml (Pack of 10): Rs. 220.00
Subtotal: Rs. 1,050.00`;

    corpus.push({
      id: docId,
      category: 'PHARMACY',
      format: 'IN',
      difficulty: 'CLEAN',
      text,
      groundTruthEntities: [
        { type: 'PERSON_NAME', value: name },
      ],
      expectedDisputeIssues: ['Valid prescription pharmacy bill supporting inpatient medicine claim'],
    });
  }

  return corpus;
}
