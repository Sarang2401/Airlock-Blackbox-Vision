# EscrowHealth

EscrowHealth helps patients and caregivers make sense of medical bills and insurance decisions while protecting the original paperwork in their browser. It was built for #BuildHybridAI 2026.

## What runs today

- **Bill Decoder** scans curated fictional cases locally. Review the protected copy alongside the original, inspect the canonical request and hash, and approve a sample analysis and draft appeal.
- **Safe Paste** detects and replaces recognized identifiers in text inside the browser. Review the result before copying it to another assistant, then restore recognized placeholders locally.
- **Privacy Receipts** verifies the local SHA-256 chain for approvals, outcomes, and clipboard exports.
- **Black Box** shows simulated route and latency telemetry and generates a suggested Remote Config policy.
- **Airlock Benchmark** evaluates 105 labeled fictional documents using a simulated recall pass.

The Firebase adapter returns simulated inference. No model request is sent by the sample analysis. The decoder uses the two curated cases. The production build caches its application shell after an online visit so local review can continue on an offline reload. Production model execution and real-document intake are outside the current demo.

## Run locally

```sh
npm ci
npm run dev
```

Open [the local dashboard](http://localhost:3000). Start with the Indian hospital bill or US emergency room bill. Run the local privacy scan, open **Request details** to see the exact payload, and approve the sample analysis. Visit **Privacy Receipts** to verify the intent and outcome. Use **Preview settings** to check how Offline and a paused cloud route affect approval.

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
