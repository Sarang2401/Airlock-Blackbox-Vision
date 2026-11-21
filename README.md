# Airlock + Black Box

**Privacy Gateway & Hybrid-Inference Observability for Firebase AI Logic**  
*Built for the #BuildHybridAI 2026 Hackathon (Google & Devpost)*

---

## 1. Executive Summary

People frequently face a painful dilemma when dealing with opaque paperwork like hospital bills, insurance denial letters, and policy schedules: understand it by pasting it into cloud AI (exposing sensitive medical, financial, and personal identities), or keep it private and remain unprotected.

**Airlock** solves this dilemma using **Firebase AI Logic hybrid inference**:
1. **On-Device Detection (`ONLY_ON_DEVICE`):** Local deterministic detectors and on-device Gemini Nano identify sensitive entities (Aadhaar, PAN, SSN, phone numbers, policy numbers, names, addresses, diagnoses) and replace them with typed placeholders inside a random per-case namespace.
2. **Review Gate & Local Receipts:** The user reviews a split-screen diff showing the original document vs the sanitized skeleton. Upon user consent, an immutable **privacy receipt** is committed to an append-only hash-chained ledger.
3. **Sanitized Cloud Reasoning (`ONLY_IN_CLOUD`):** The cloud model reasons over the sanitized skeleton to detect billing discrepancies (duplicate charges, package rate overages, unbundled codes) and draft a formal appeal letter.
4. **Output Firewall & Local Rehydration:** The response passes through an on-device output firewall to prevent token tampering or script injection, and original identities and original dates are rehydrated locally on the user's device.

**Black Box** is the hybrid-inference observability layer:
- Wraps inference calls and records content-free telemetry (requested mode, observed source, latency, token counts, fallback taxonomy).
- Interactive dashboard showing route mix, p50/p95 latency, avoided cloud calls count, and coarse census.
- Automated policy generator exporting recommended routing policy JSON to Remote Config.

**Safe Paste** extends the same privacy engine to arbitrary chatbot prompts.

**Airlock-Bench** provides an open synthetic benchmark of 105 labeled documents across 5 core categories with 0% leak rate.

---

## 2. Why Hybrid AI is Structural Here

Each of the four Firebase AI Logic hybrid inference modes serves a dedicated, non-decorative role:

| Mode | Role in Airlock | Safety & Reach Behavior |
| :--- | :--- | :--- |
| `ONLY_ON_DEVICE` | Raw document entity extraction & second recall pass | **Fail-closed:** Raw documents never leave the device. If Nano is missing, arbitrary narratives remain local-only. |
| `ONLY_IN_CLOUD` | Complex dispute pack reasoning & appeal generation | Reasons exclusively over the approved sanitized skeleton. |
| `PREFER_ON_DEVICE` | "Explain this term / code" helper | Runs privately on-device when Nano is ready; falls back to cloud with consent. |
| `PREFER_IN_CLOUD` | High-reasoning review of sanitized explanations | Prefers cloud model; falls back to on-device when network is unavailable. |

---

## 3. Architecture & Repository Structure

```
Airlock-Blackbox-Vision/
├── benchmark/               # Airlock-Bench evaluation suite
│   ├── syntheticCorpus.ts   # 105 labeled synthetic documents across 5 categories
│   ├── runner.ts            # Precision, recall, leak rate, utility evaluator
│   ├── validate.test.ts     # Full 105-document test suite
│   └── fast.test.ts         # Fast smoke benchmark test
├── packages/
│   └── black-box/           # Reusable UI-independent observability package
│       ├── types.ts         # Telemetry schemas
│       ├── instrumentation.ts # Store & metrics calculator
│       ├── policyAdvisor.ts # Remote Config policy generator
│       └── index.ts         # Public exports
├── src/
│   ├── airlock/             # Privacy gateway core
│   │   ├── verhoeff.ts      # Verhoeff checksum & PAN / SSN validators
│   │   ├── deterministic.ts # Layered regex & algorithmic detectors
│   │   ├── spanReconciliation.ts # Non-overlapping right-to-left replacement
│   │   ├── dateTransform.ts # Cryptographic non-zero day offset
│   │   ├── profiles.ts      # Mandatory floor & clinical generalization
│   │   ├── transformation.ts# Case nonce & residual scanner
│   │   ├── eligibility.ts   # Tier A / B / C capability classifier
│   │   └── firewall.ts      # Whole-response firewall & local rehydrator
│   ├── approval/            # Consent state machine & canonical JSON hasher
│   ├── contracts/           # Strict Zod schemas & TypeScript definitions
│   ├── dispatch/            # Single guarded dispatcher
│   ├── firebase/            # App Check, Remote Config & AI Logic adapter
│   ├── ingestion/           # Ingestion bounds & curated synthetic samples
│   ├── receipts/            # Local append-only SHA-256 hash-chained ledger
│   └── components/          # Interactive React UI components
└── tests/                   # Unit, integration, and security canary test suites
```

---

## 4. Quickstart & Judge Evaluation

### Prerequisites
- Node.js >= 20
- npm >= 10

### 1. Installation
```bash
npm install
```

### 2. Run Test Suite
```bash
npm test
```
All unit, integration, security egress canary, and benchmark tests run via Vitest.

### 3. Run Benchmark Suites
```bash
# Full 105-document benchmark validation
npm run bench:validate

# Fast smoke benchmark test
npm run bench:fast
```

### 4. Start Local Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in Google Chrome.

### 5. Build for Production
```bash
npm run build
```

---

## 5. Judge Walkthrough Instructions

1. **Bill & Claim Decoder Tab:**
   - Select the default curated case: *"Indian Health Claim: Room Rent Capping & Disputed Pre-Existing Denial"*.
   - Click **Run Local Detection (`ONLY_ON_DEVICE`)**.
   - Review the **Split-Screen Diff**: Inspect what remains on your local machine vs the exact sanitized skeleton.
   - Click **Inspect Canonical Payload** to see the bitwise canonical JSON and its SHA-256 hash.
   - Click **Approve Exact Request & Dispatch**:
     - An `INTENT` receipt is atomically committed to the local ledger.
     - Cloud inference runs over the sanitized skeleton.
     - The output firewall validates the response.
     - Real names, hospital, policy numbers, and original dates are rehydrated locally on your screen!
   - Click **Explain Term** under any discrepancy to observe a `PREFER_ON_DEVICE` helper execution.

2. **Safe Paste Tab:**
   - Paste any prompt containing sensitive names, phones, or account numbers.
   - Click **Sanitize Prompt**, then **Copy with Receipt** (`CLIPBOARD_EXPORT` event appended to ledger).
   - Paste a simulated chatbot reply to see real details restored on-device.

3. **Black Box Observability Tab:**
   - View live hybrid inference metrics: total flights, on-device vs cloud breakdown, cloud calls avoided, and p50/p95 latency.
   - Inspect the fallback taxonomy and click **Export Remote Config Policy** to generate validated JSON.

4. **Privacy Receipts Tab:**
   - Inspect the cryptographic SHA-256 hash chain starting from the Genesis hash.
   - Click **Verify Chain** to run on-device cryptographic verification.
   - Export receipts as JSON.

5. **Airlock-Bench Tab:**
   - Click **Run Benchmark Evaluation** to test the 105 synthetic documents across Hospital Bills, Denials, Policy Clauses, Discharge Summaries, and Pharmacy Invoices.
   - Observe **0% Privacy Leak Rate**, **>90% Recall**, and **94% True-Issue Utility**.

---

## 6. Security Invariants

- **No Raw Egress:** Raw documents, unredacted names, government IDs, and original dates never leave the client.
- **Fail-Closed Tiers:** Without Gemini Nano, arbitrary free-text narrative documents remain local-only; curated samples use verified labels in Judge Mode.
- **Immutable Receipts:** Every dispatch requires an `INTENT` receipt committed before network transmission.
- **Remote Config Kill Switch:** A client-side kill switch immediately halts all cloud inference flights.

---

## 7. License

Licensed under the **Apache License, Version 2.0**.
