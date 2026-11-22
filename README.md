# EscrowHealth

EscrowHealth helps patients and caregivers make sense of medical bills and insurance decisions while protecting the original paperwork in their browser. It was built for #BuildHybridAI 2026.

## What runs today

- **Bill Decoder** scans curated fictional cases locally. Review the protected copy alongside the original, inspect the canonical request and hash, and approve a sample analysis and draft appeal.
- **Safe Paste** detects and replaces recognized identifiers in text inside the browser. Review the result before copying it to another assistant, then restore recognized placeholders locally.
- **Privacy Receipts** verifies the local SHA-256 chain for approvals, outcomes, and clipboard exports.
- **Black Box** shows live and simulated route and latency telemetry in separate views and generates a suggested Remote Config policy.
- **EscrowHealth Benchmark** evaluates 105 labeled fictional documents using a simulated recall pass.

The default build uses simulated inference for the two curated cases. An opt-in hosted Judge Mode build can send three fixed excerpts from the India sample to Gemini 3.5 Flash-Lite after explicit approval and a recorded intent. Gemini returns issue identifiers. Airlock checks the response, then builds and restores the fictional appeal in the browser. Real-document intake is outside the current demo.

## Run locally

```sh
npm ci
npm run dev
```

Open [the local dashboard](http://localhost:3000). Start with the Indian hospital bill or US emergency room bill. Run the local privacy scan, open **Request details** to see the exact payload, and approve the sample analysis. Visit **Privacy Receipts** to verify the intent and outcome. Use **Preview settings** to check how Offline and a paused cloud route affect approval.

For a hosted live Judge Mode build, follow the [deployment handoff](docs/DEPLOYMENT.md). The production build caches its application shell after an online visit so local review can continue on an offline reload.

```sh
npm run build
npm test
npm run bench:validate
npm run bench:fast
```

## Architecture

| Layer | Responsibility |
| --- | --- |
| Airlock | Deterministic detection, placeholder replacement, date shifting, capability gating, and response firewall |
| Approval and dispatcher | Canonical request hashing, consent validation, intent commitment, response validation and rehydration, and outcome recording |
| Black Box | Content-free inference metadata, route summaries, and policy suggestions |
| React workspace | Bill review, Safe Paste, receipt inspection, route analytics, and the benchmark explorer |

Read [the user stories and design system](docs/USER_STORIES_AND_UX.md) and [the repo rules](AGENTS.md) for design and privacy requirements.

## License

Apache License, Version 2.0.
