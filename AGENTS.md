# AGENTS.md — EscrowHealth development guide

EscrowHealth helps patients and caregivers understand medical bills and insurance decisions while keeping original paperwork in the browser. Airlock is the privacy gateway. Black Box is the observability layer. The project is licensed under Apache-2.0 and was built for #BuildHybridAI 2026.

## Privacy and inference invariants

1. **Keep raw data in the browser.** Raw documents, real names, Aadhaar and SSN numbers, PAN, phone numbers, bank accounts, and original dates must never leave the browser. All requests to a cloud model must pass through `src/dispatch/dispatcher.ts` and validate against `PreparedRequestSchema`. Keep analytics free of document content.
2. **Fail closed by capability.** Tier A requires verified on-device extraction and a passing residual scan. Tier B allows curated synthetic cases using verified labels in Judge Mode. Unverified narratives stay local. Tier C permits local deterministic review and guidance with zero cloud dispatch.
3. **Record consent before dispatch.** Show the protected copy and exact prepared request, hash the canonical request with SHA-256, and obtain approval for that hash and revision. Append an `INTENT` event before a cloud flight, and append an `OUTCOME` event for success, failure, or a firewall block.
4. **Validate responses in full.** Buffer responses in `src/airlock/firewall.ts`. Block unknown or cross-case tokens and hostile markup. Restore protected details on-device using the active in-memory transformation map.
5. **Describe runtime behavior accurately.** The current Bill Decoder accepts curated samples and performs deterministic local detection. The adapter simulates inference and route timing. Preserve this distinction in labels, metrics, and demos.

## Experience and brand

- Read [the patient, judge, builder, and auditor stories](docs/USER_STORIES_AND_UX.md) before changing the workflow. Make the primary action obvious and reveal hashes, payloads, and telemetry on demand.
- Use the EscrowHealth mark from `public/escrowhealth-mark.svg`. Deep Ink (`#101A2D`) and Signal Mint (`#6CE5BD`) define the dashboard. Use their tonal families for around 90% of the visual system. Reserve complementary Copper for roughly 10% or less, particularly evidence such as Privacy Receipts. Semantic warnings and errors carry explicit text.
- Use the shared tokens, surface, field, and button styles in `src/index.css`. Support light and dark via the root `dark` class. Use Plus Jakarta Sans for headings and controls and JetBrains Mono for hashes, placeholders, and telemetry. Both fonts are bundled locally.
- Use an 8px spacing rhythm with 4px subdivisions. Verify desktop and 360px layouts, keep controls at least 44×44px, support keyboard navigation and focus, and stack comparison panes on phones.
- Handcraft motion in CSS. Use `airlockScan` and `chamberPulse` for the active scan, `tokenReveal` for the protected copy, and `receiptStamp` for confirmation. Keep motion brief, use `cubic-bezier(0.16, 1, 0.3, 1)` for settling, and preserve the workflow under `prefers-reduced-motion`. Avoid animation libraries.

## Checks

- `npm run dev` starts Vite on port 3000.
- `npm run build` runs TypeScript and builds production assets.
- `npm test` runs the unit, integration, security canary, and benchmark suites.
- `npm run bench:validate` evaluates the 105-document corpus. `npm run bench:fast` runs the smoke benchmark.

Run the build and tests for code changes. Never commit secrets, real personal data, or API keys.
