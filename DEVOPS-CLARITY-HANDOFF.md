# Microsoft Clarity — DevOps handoff

Status: **blocked for production until the draft marketing privacy/cookie wording is approved**. Production delivery uses the existing AWS Amplify workflow owned by DevOps. This document does not define or change that workflow.

## Release scope

- Clarity project: `z3sy7q9gz9`
- Development branch: `Pranav`
- Marketing domain: `kore-hub.otech.one`
- Dashboard settings reported: Cookies Off, Bot detection On, Strict masking
- The Trust Center is not part of this release and must not be changed.

The existing marketing entry points `index.html` and `sito.html` contain the Clarity asset references and must be published from the same revision. In addition, DevOps must ensure these three new assets are present in Amplify's published output at the paths and MIME types shown:

| Repository file | Published path | Expected Content-Type |
|---|---|---|
| `clarity-consent.js` | `/clarity-consent.js` | `application/javascript; charset=utf-8` |
| `clarity-consent.css` | `/clarity-consent.css` | `text/css; charset=utf-8` |
| `privacy-marketing/index.html` | `/privacy-marketing/index.html` | `text/html; charset=utf-8` |

Repository-only files such as tests, `CLARITY.md`, and this handoff do not need to be included in Amplify's published artifact. Do not add `trust/`, `trust-src/`, or `kore-react/` to the marketing site's published output as part of this change.

## Pre-deployment approvals

1. Privacy/legal approves `privacy-marketing/index.html`, including the open items listed in section 8; remove the visible draft label only as part of that approved wording change.
2. Privacy confirms the described Microsoft role, international-transfer safeguards, hosting-log basis/retention, and consent renewal period.
3. The Clarity owner reconfirms Cookies Off, Bot detection On, and Strict masking.
4. DevOps verifies the existing Amplify app, connected production branch, build specification, and artifact base/output directory. Do not change these settings solely from assumptions in this document.
5. Marketing/privacy confirms that campaigns and referring sites do not place personal or financial data in URLs and use `strict-origin` or a stricter referrer policy where controlled. Clarity URL masking does not cover inbound referrers or clicked destinations.

## Amplify deployment checks

Use the established AWS Amplify deployment workflow. No new Amplify build command or configuration is prescribed here because the repository does not define the production Amplify settings.

Before production deployment, DevOps must verify in the existing Amplify configuration that:

- the intended production branch and revision are selected;
- the existing build specification publishes the marketing site rather than source-only or repository-only files;
- the configured artifact base/output directory includes the updated `index.html` and `sito.html`;
- that same published output includes the three new assets listed above, preserving their root-relative and nested paths;
- `/privacy-marketing/` resolves to `privacy-marketing/index.html` under the existing Amplify rewrite/redirect behavior, rather than falling back to another page;
- Amplify serves JavaScript, CSS, and HTML with the expected MIME types;
- the deployment makes the updated HTML and all three new assets available as one consistent revision, including after Amplify-managed cache propagation;
- no preview or production branch is configured to publish the unapproved draft automatically.

Do not start a production deployment until the privacy block at the top of this document is cleared. Any Amplify configuration change remains a DevOps decision and requires its normal review and approval.

## Production smoke tests

Use a fresh browser profile and DevTools Network with **Preserve log**, filtered by `clarity.ms`.

1. Confirm `/`, `/sito.html`, `/clarity-consent.js`, `/clarity-consent.css`, and `/privacy-marketing/` return 200 and the expected `Content-Type`.
2. With site data cleared, load `/`: banner visible; no `clarity.ms/tag/z3sy7q9gz9` or `/collect` request.
3. Reject: preference becomes `denied`; no Clarity tag or collection request.
4. Clear site data, accept: exactly one tag request appears, then a collection request after interaction; `<html>` has `data-clarity-mask="true"`.
5. Reopen Cookie preferences and reject: Consent V2 sends analytics denied, the page reloads, and no tag remains.
6. With stored grant, verify no tag on `/acquista/`, `/richiedi-demo/`, `/privacy-marketing/`, the Trust Center domain, `/sito.html#contatti`, `/sito.html#privacy`, `/sito.html#pricing`, `/sito.html#prezzi`, or a marketing URL with a non-language query parameter.
7. Navigate between eligible hashes and confirm the tag is never inserted more than once.
8. Confirm outbound requests expose at most the origin as referrer. Inspect Clarity recordings to ensure content remains strictly masked and clicked destinations contain no personal or financial data.
9. In Clarity, confirm the test session appears under project `z3sy7q9gz9`; then confirm recordings and heatmaps contain only eligible marketing URLs. Dashboard population may take several hours.

## Amplify rollback

Before deployment, DevOps must identify the previous known-good Amplify deployment/revision and confirm that the established Amplify rollback or redeploy procedure is available. Do not infer a rollback command from this repository.

If rollback is required:

1. Restore or redeploy the previous known-good Amplify revision through the existing approved workflow.
2. Confirm that the previous `index.html` and `sito.html` no longer reference the Clarity assets.
3. Confirm that the Clarity banner and all requests to `clarity.ms` are absent.
4. Confirm that the marketing site, checkout, demo, and Trust Center still load normally.
5. Verify the public site after Amplify-managed cache propagation.
