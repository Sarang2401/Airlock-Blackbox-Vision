# AGENTS.md — Development Guidelines for AI Agents

Welcome, AI Agent! This file establishes the architecture, invariants, design rules, and behavioral conventions for the **Airlock + Black Box** project. Follow these guidelines strictly.

---

## 1. Project Identity & Purpose
- **Event:** #BuildHybridAI 2026 Hackathon (Google + Devpost).
- **Core Problem:** Patients must choose between understanding complex medical/insurance paperwork and keeping sensitive data private.
- **Our Solution:** A privacy gateway (`Airlock`) using Firebase AI Logic hybrid inference to redact sensitive data locally on-device, reason in the cloud over sanitized text, and restore real details locally. Powered by `Black Box` (hybrid observability).
- **License:** Apache License, Version 2.0.

---

## 2. Hard Security & Privacy Invariants

1. **Local-Only Raw Data:**
   - Raw documents, real names, Aadhaar/SSN numbers, PAN, phone numbers, bank accounts, and original dates MUST NEVER leave the user's browser.
   - Any API request to a cloud model MUST pass through `src/dispatch/dispatcher.ts` and be verified against `PreparedRequestSchema`.

2. **Fail-Closed Capability Tiers:**
   - **Tier A (Nano Available):** Full on-device detection + cloud reasoning over sanitized skeleton.
   - **Tier B (No-Nano):** Curated synthetic fixtures are eligible in Judge Mode using verified labels; arbitrary unverified narrative text MUST remain `LOCAL_ONLY`.
   - **Tier C (Offline):** Static help and local deterministic audit only. Zero cloud dispatch.

3. **Receipt-Before-Send Commitment:**
   - Every cloud-capable inference attempt MUST commit an `INTENT` event with canonical SHA-256 hash to the append-only ledger (`receiptLedger`) BEFORE the outbound network flight occurs.
   - An `OUTCOME` event is appended upon success, failure, or firewall block.

4. **Output Firewall Integrity:**
   - Cloud model responses MUST be buffered and passed through `src/airlock/firewall.ts`.
   - Output with unknown tokens, cross-case tokens, or malicious HTML/scripts MUST be blocked immediately.
   - Rehydration happens exclusively on the client using the active in-memory `TransformationMap`.

---

## 3. UI/UX & Design System Invariants

1. **Theme Support:**
   - Every component MUST support both Dark Mode (`dark` class on root) and Light Mode.
   - Dark theme palette: Deep obsidian/cyber-slate (`#070B14`, `#0D1527`, `#13203C`) with glowing phosphor mint (`#00F5A0`, `#10B981`) and quantum indigo/amber accents.
   - Light theme palette: Crisp alabaster/porcelain (`#F8FAFC`, `#FFFFFF`, `#F1F5F9`) with ink slate typography (`#0F172A`, `#334155`) and emerald mint accents.
   - Avoid generic, bland monochromatic styling.

2. **Typography Hierarchy:**
   - Headings: `Plus Jakarta Sans`, font-bold / font-extrabold.
   - Data / Hashes / Placeholders / Telemetry: `JetBrains Mono` or `font-mono`.
   - Body: `Plus Jakarta Sans` or modern sans-serif with readable line-height (`leading-relaxed`).

3. **Handcrafted Animation Principles:**
   - DO NOT install heavy third-party animation libraries (Framer Motion, GSAP).
   - Use custom, hand-crafted CSS keyframes in `src/index.css` applying the 12 principles of animation:
     - `@keyframes airlockScan` for scanning sweeps.
     - `@keyframes chamberPulse` for ambient containment glow.
     - `@keyframes tokenReveal` for springy token chips.
     - `@keyframes receiptStamp` for ledger commitment feedback.
     - Smooth cubic-bezier easings (`cubic-bezier(0.16, 1, 0.3, 1)`).

4. **Mobile Responsiveness:**
   - Every view MUST be fully responsive and tested down to 360px viewport width.
   - Touch targets must be >= 44x44px.
   - Provide a responsive mobile navigation drawer and stacked diff views.

---

## 4. Commands & Verification

```bash
# Development server
npm run dev

# Full TypeScript check & Vite production build
npm run build

# Run all 8 Vitest suites (unit, integration, security canary)
npm test

# Run full 105-document Airlock-Bench evaluation
npm run bench:validate

# Run fast smoke benchmark test
npm run bench:fast
```

When modifying code:
- Run `npm run build; npm test` to ensure zero compilation or test regressions.
- Never commit secrets, real personal data, or API keys to the repository.
