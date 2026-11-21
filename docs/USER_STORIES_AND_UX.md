# Airlock + Black Box — User Stories & UX Journey Map

## 1. Product Vision & Emotional Arc

Healthcare billing and insurance disputes are emotionally taxing. When an insurer repudiates a cashless claim or a hospital issues an inflated multi-lakh bill, patients and caregivers experience acute distress, vulnerability, and confusion.

Traditional GenAI solutions demand that users upload unredacted medical discharge summaries, Aadhaar/SSN IDs, policy contracts, and diagnostic records to cloud servers. **Airlock** transforms this experience from **fear of exposure** into **confident control and empowerment**:
- **Step 1 (Ingest):** Users feel reassurance that raw files remain in their browser's private memory.
- **Step 2 (Airlock Gate):** Transparent, side-by-side inspection shows exact placeholders leaving the device.
- **Step 3 (Reasoning):** Cloud intelligence provides deep legal and billing analysis over the sanitized skeleton.
- **Step 4 (Rehydrate):** Real identities are restored locally into a ready-to-send formal appeal letter.

Meanwhile, **Black Box** gives hybrid AI builders and judges total observability into which model ran, why fallback happened, and how to tune policies in Remote Config.

---

## 2. Core User Personas

### Persona 1: Maya — Anxious Caregiver (Primary Consumer)
- **Background:** 34-year-old software marketer whose father was hospitalized for acute cardiac care in Bengaluru. The insurer repudiated the Rs. 2,45,000 claim citing "Pre-existing Disease Waiting Period (Clause 4.2)", and the hospital added duplicate lab fees.
- **Goal:** Understand whether the denial can be disputed legally without leaking her father's sensitive cardiac diagnosis, Aadhaar number, or hospital details to third-party chatbots.
- **Key Pain Point:** Fear of data breaches and overwhelming legal jargon in insurance policy schedules.
- **Success Outcome:** Obtains a grounded, ready-to-send grievance letter quoting policy continuity within 60 seconds, with cryptographic proof that no direct identifiers left her device.

### Persona 2: Dev — Hybrid AI Engineer & Builder (Developer Persona)
- **Background:** Full-stack engineer integrating Firebase AI Logic into an enterprise healthtech web app.
- **Goal:** Benchmark Gemini Nano on-device performance against cloud Gemini models, observe fallback reasons (e.g. offline, model not downloaded, unsupported hardware), and export optimal routing rules for Firebase Remote Config.
- **Key Pain Point:** Standard Firebase console monitoring is blind to on-device inference; lacks fallback taxonomy and leak rate benchmarks.
- **Success Outcome:** Uses Black Box dashboard to inspect p50/p95 latencies, verify 0% leak rate on 105 synthetic test documents, and export a Remote Config policy JSON with one click.

### Persona 3: Marcus — Privacy & Compliance Auditor
- **Background:** Data protection officer reviewing apps under India's DPDP Act, GDPR, and HIPAA privacy rules.
- **Goal:** Verify that no raw personal data traverses the wire and audit the cryptographic receipt ledger.
- **Key Pain Point:** Vague "we don't store your data" marketing claims with zero inspectable proof.
- **Success Outcome:** Validates the SHA-256 hash chain of every application flight from Genesis, audits canonical JSON payloads, and exports tamper-evident receipts.

### Persona 4: Alex — Hackathon Judge / Technical Reviewer
- **Background:** Senior Google/Firebase engineer judging #BuildHybridAI 2026.
- **Goal:** Verify genuine runtime usage of Firebase AI Logic hybrid inference, test all 4 modes, evaluate on both laptop with Nano and simulated/mobile devices, and inspect UI polish.
- **Success Outcome:** Seamlessly switches between Tier A (Gemini Nano) and Tier B (Curated Judge Mode), experiences smooth handcrafted animations, and observes structural necessity of hybrid AI.

---

## 3. End-to-End User Journeys

### Journey A: Maya's Bill & Claim Dispute Resolution
1. **Arrival:** Maya opens Airlock on mobile or desktop. The UI greets her with a clean, calming aesthetic with dark/light mode options and clear privacy badges.
2. **Case Selection:** She selects the *"Indian Health Claim: Room Rent Capping & Disputed Pre-Existing Denial"* curated sample or uploads her own bill and denial letters.
3. **Local Detection:** She clicks **"Run Local Detection (ONLY_ON_DEVICE)"**. A custom radar scanline sweeps over the document. In milliseconds, local validators detect her father's Aadhaar, PAN, phone number, hospital name, and diagnosis.
4. **Split-Screen Gate:** Maya views the interactive diff:
   - Left: Original document with highlighted identifiers.
   - Right: Sanitized skeleton with typed tokens like `[PATIENT_Q7M2_1]`, `[GOVT_ID_Q7M2_1]`, and shifted dates.
   - She toggles *"Disclose Hospital Name"* on to audit package rates while leaving all personal IDs locked.
5. **Cryptographic Consent:** She clicks **"Approve Exact Request & Dispatch"**. The app persists an immutable `INTENT` receipt with canonical SHA-256 hashing.
6. **Dispute Pack Delivered:** Cloud reasoning completes in 1.2s. Maya receives:
   - An executive summary showing repudiation under Clause 4.2 is void because coverage continuity exceeded 24 months.
   - Flags highlighting duplicate arterial blood gas fees (Rs. 4,500).
   - A formal grievance letter with her father's real name and policy details safely restored.
7. **Empowerment:** Maya downloads the appeal letter and exports her privacy receipt.

### Journey B: Dev's Observability & Remote Config Export
1. Dev clicks the **"Black Box Observability"** tab.
2. He inspects live telemetry cards: total flights, on-device vs cloud route distribution, and avoided cloud calls count.
3. He reviews the p50 and p95 latency breakdown and inspects fallback taxonomy (e.g. `DEVICE_UNSUPPORTED`, `OFFLINE`).
4. He triggers **"Export Remote Config Policy"**, downloading an allowlisted, schema-validated JSON policy ready to paste into Firebase Console.

---

## 4. UX & Design Principles Applied

Following modern Figma design principles:
- **Visual Hierarchy:** Distinct primary actions with glowing accent gradients; secondary actions in subtle glassmorphism containers.
- **Affordance & Feedback:** Every interactive element has tactile hover lifts, active scale depressions, and focus rings.
- **Spatial Rhythm:** Consistent 4px/8px spacing grid; clean cards with 16px/20px internal padding.
- **Progressive Disclosure:** Advanced canonical JSON inspectors and raw telemetry are accessible in single clicks without cluttering novice workflows.
- **Zero Jargon Defaults:** Plain-language labels ("What Leaves Device", "What Remains Local") paired with developer-grade technical transparency.
