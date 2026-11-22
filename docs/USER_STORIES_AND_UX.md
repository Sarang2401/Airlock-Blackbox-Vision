# EscrowHealth user stories and experience

EscrowHealth helps people make sense of medical bills and insurance decisions while keeping the original paperwork in their browser. Airlock prepares the sanitized request. Black Box shows how the inference route behaved.

## User stories before screens

| User | Story | Acceptance criteria |
| --- | --- | --- |
| Patient or caregiver | As someone trying to understand a bill or denial, I want to see which details the app protects before I approve an analysis. | Start with fictional paperwork. Compare the original and protected copies. See whether a request can be approved and confirm the exact fingerprint before analysis. Review findings and a draft appeal without losing track of which details were restored locally. |
| Patient using an external assistant | As someone drafting a message elsewhere, I want to redact detected details and restore placeholders here. | Safe Paste runs in the browser, lets me review the result before copying, offers manual masking, asks for confirmation before copying, records the clipboard action, and restores recognized placeholders from the active in-memory map. |
| Hackathon judge | As a reviewer, I want to see the consent gate, route behavior, and verification I can reproduce. | The dashboard identifies simulation. Run a fictional case, inspect its prepared JSON and hash, approve it, verify the two receipt events, and rerun the 105-document benchmark. Switch to Offline or pause the route and confirm approval is unavailable. Refresh the protected preview and confirm again after recovering. |
| Hybrid AI builder | As an engineer, I want to understand route choice, latency, and fallback signals so I can evaluate a routing policy. | Black Box identifies simulated metrics, presents counts and percentiles, and exposes the recommended policy JSON. Empty metrics clearly describe how to produce events. |
| Privacy auditor | As a reviewer, I want to check that the approval and outcome refer to the same request. | View receipt status and hashes, verify the chain locally, and export it. Receipt evidence establishes what the app logged. |

## Journey and screen order

1. **Bill Decoder.** See the privacy boundary, choose a fictional case, and run a local scan. The case description and document types explain what the sample covers.
2. **Review privacy.** Compare highlighted changes in the protected and original copies. On desktop they sit side by side. On phones they stack with the protected copy first. Technical payload details are available on demand.
3. **Review the draft.** Approve the exact prepared request when the selected mode permits it. The sample analysis passes through the receipt and firewall path before the draft appears.
4. **Verify.** Use Privacy Receipts for the chain, Black Box for route events, and Benchmark for the labeled corpus. Fixture-assisted recall is reported separately from model accuracy. Safe Paste is a separate workflow for text copied to external assistants.

The current decoder uses curated samples and deterministic local detection. Its analysis, Nano selection, and route metrics are simulations. Production inference and real-document intake are future scope.

## Brand and layout

- The two nested shapes in the mark represent the privacy boundary and the document it holds. The three redaction bars identify the product at small sizes.
- Deep Ink and Signal Mint are the primary logo colors. Use their tonal families for roughly 90% of the visual system. Complementary Copper is an emphasis color of up to 10%, reserved for evidence the judge should inspect. Semantic colors remain available when an explicit warning or error needs them.
- Use Plus Jakarta Sans for headings and controls, and JetBrains Mono for tokens, hashes, and telemetry. Use the local font files under the existing CSP.
- Keep a single primary action per stage. Use an 8px spacing rhythm with 4px subdivisions, clear text labels, and 44px touch targets. Use logical focus order and status text to communicate state.
- Use the same surface, action, field, and status tokens across desktop and mobile, and across dark and light themes.

## Confirmations and feedback

- Confirm the approved request by fingerprint, clipboard copies of reviewed Safe Paste text, and clearing or replacing a workspace draft. Keep the safest action focused in confirmation dialogs.
- Keep offline, paused, and incomplete privacy states beside the relevant action. Use dismissible notifications for clipboard and download outcomes.
- Use the CSS spinner and skeleton lines while a scan, analysis, or empty receipt history is pending. Keep keyboard focus on the stage heading after an explicit advance and keep mobile approval within reach.

## Handcrafted motion

| Moment | Motion | Purpose |
| --- | --- | --- |
| Workspace selection | Small crossfade and rise | Stages the new heading and preserves orientation. |
| Local scan | One sweep and a soft chamber pulse while checking | Shows that the document is being reviewed in the browser. |
| Protected copy appears | A short settle on the boundary marker | Calls attention to the copy relevant to approval. |
| Receipt or completion appears | A small stamp with quick follow-through | Confirms an actual result. |
| Press or drawer movement | Small compression or eased slide | Gives immediate input feedback. |

All motion is CSS in `src/index.css`, uses transform and opacity where possible, and respects reduced motion. State changes always have text feedback.

## Design references

- [Figma UI design principles](https://www.figma.com/resource-library/ui-design-principles/)
- [CSS Animation](https://cssanimation.rocks/)
- [OpenClassrooms animation principles](https://openclassrooms.com/en/courses/5625816-create-modern-css-animations/5794716-apply-the-12-principles-of-animation-to-the-web)
- [User Interface Wiki animation principles](https://www.userinterface.wiki/12-principles-of-animation)
- [SVGator motion inspiration](https://www.svgator.com/blog/tag/inspirational/)
- [Tubik animation collection](https://tubikstudio.com/blog/category/animation/)
