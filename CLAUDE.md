# CLAUDE.md — Architecture & Engineering Quick Reference

## Commands
- `npm run dev` — Start local development server on port 3000
- `npm run build` — Compile TypeScript (`tsc --noEmit`) and bundle production assets with Vite
- `npm test` — Run all unit, integration, and security canary tests with Vitest
- `npm run bench:validate` — Execute full 105-document synthetic benchmark suite
- `npm run bench:fast` — Run fast smoke benchmark test

## Architecture Overview
- **Airlock Core (`src/airlock/`):**
  - `verhoeff.ts`: Algorithmic Verhoeff Aadhaar checksum, PAN & SSN validators.
  - `deterministic.ts`: Layered regex detectors for phones, emails, accounts, dates, amounts.
  - `spanReconciliation.ts`: Merges overlapping findings; applies replacements right-to-left.
  - `dateTransform.ts`: Generates single random non-zero day offset (-180..-35 or 35..180 days); preserves day intervals.
  - `profiles.ts`: Mandatory never-leaves floor + clinical diagnosis generalization.
  - `transformation.ts`: Random 4-char case nonce (e.g., `Q7M2`); residual canary scan.
  - `eligibility.ts`: Fail-closed capability classifier (Tier A Nano, Tier B Judge Mode, Tier C Offline).
  - `firewall.ts`: Whole-response schema validation, cross-case token check, XSS block, local rehydration.
- **Guarded Dispatcher (`src/dispatch/dispatcher.ts`):** Single entry point to cloud inference. Commits `INTENT` receipt, checks kill switch, executes hybrid flight, validates through firewall, rehydrates, and appends `OUTCOME` receipt.
- **Observability Package (`packages/black-box/`):** Independent hybrid inference wrapper recording content-free metadata, p50/p95 latency, and Remote Config policy recommendations.
- **Benchmark (`benchmark/`):** 105 fully labeled synthetic documents across Bills, Denials, Policies, Discharge Summaries, and Pharmacy Invoices.

## Coding & Style Rules
- Strict TypeScript (`noImplicitAny`, `noUnusedLocals`, `strict: true`).
- Zod schemas for all wire and storage boundaries with `.strict()` to reject arbitrary injection.
- Tailwind CSS with `darkMode: 'class'`. Dual-theme support (Dark & Light) is mandatory across all views.
- Hand-crafted CSS animations in `src/index.css`. No external animation libraries.
