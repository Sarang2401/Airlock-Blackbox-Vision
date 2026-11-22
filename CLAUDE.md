# CLAUDE.md — EscrowHealth engineering reference

Read [AGENTS.md](AGENTS.md) for the repository rules and [the UX stories](docs/USER_STORIES_AND_UX.md) for the design and journey decisions.

## Entry points

| Area | Files |
| --- | --- |
| Workspace navigation and theme | `src/App.tsx`, `src/components/Header.tsx`, `src/context/ThemeContext.tsx` |
| Brand and shared UI | `public/escrowhealth-mark.svg`, `src/components/brand/EscrowHealthLogo.tsx`, `src/index.css` |
| Case choice, local scan, exact review, draft | `src/components/BillDecoder.tsx`, `src/components/SplitScreenReview.tsx`, `src/components/DisputePackView.tsx` |
| Local detection and protection | `src/airlock/` and `src/ingestion/` |
| Prepared request, consent, dispatch, and receipts | `src/approval/`, `src/dispatch/dispatcher.ts`, `src/receipts/` |
| Content-free observability and benchmark | `packages/black-box/`, `src/components/BlackBoxDashboard.tsx`, `benchmark/` |

## Current demo

Bill Decoder starts in Judge Mode with curated Indian and US cases. It scans locally, shows the protected copy and canonical request, and runs the sample response through the guarded dispatcher and output firewall after approval. `src/firebase/aiAdapter.ts` uses mock inference. The draft term explanations are local reference copy. Use the profile switch to inspect Offline and simulated Nano eligibility, and the route toggle to pause approval.

Safe Paste scans user-entered text locally and keeps the replacement map in memory while its workspace is open. It copies only on explicit action and logs clipboard metadata. Benchmarks use a labeled fictional corpus and a simulated recall pass.

## Working on the repo

Use strict TypeScript and strict Zod wire schemas. Read and preserve the privacy invariants before touching request preparation, telemetry, or results. Reuse the shared panel, field, typography, and motion styles in `src/index.css`. Desktop and 360px layouts, keyboard focus, both themes, and reduced motion are review criteria.

Run `npm run build` and `npm test` for code changes. Run `npm run bench:validate` for the complete corpus.
