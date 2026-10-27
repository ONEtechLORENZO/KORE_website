# Microsoft Clarity — DevOps handoff

Status: **blocked for production until the draft marketing privacy/cookie wording is approved**. DevOps must independently verify the target S3 bucket and CloudFront distribution. Do not use identifiers inferred from this repository.

## Release scope

- Clarity project: `z3sy7q9gz9`
- Branch prepared by development: `dev`
- Marketing domain: `kore-hub.otech.one`
- Dashboard settings reported: Cookies Off, Bot detection On, Strict masking
- The Trust Center is not part of this release and must not be changed.

Publish these objects to the marketing-site web root, preserving paths and MIME types:

| Local file | Object path | Content-Type |
|---|---|---|
| `index.html` | `/index.html` | `text/html; charset=utf-8` |
| `sito.html` | `/sito.html` | `text/html; charset=utf-8` |
| `clarity-consent.js` | `/clarity-consent.js` | `application/javascript; charset=utf-8` |
| `clarity-consent.css` | `/clarity-consent.css` | `text/css; charset=utf-8` |
| `privacy-marketing/index.html` | `/privacy-marketing/index.html` | `text/html; charset=utf-8` |

Repository-only files such as tests, `CLARITY.md`, and this handoff are not web objects. Do not deploy `trust/`, `trust-src/`, or `kore-react/` as part of this change.

## Pre-deployment approvals

1. Privacy/legal approves `privacy-marketing/index.html`, including the open items listed in section 8; remove the visible draft label only as part of that approved wording change.
2. Privacy confirms the described Microsoft role, international-transfer safeguards, hosting-log basis/retention, and consent renewal period.
3. The Clarity owner reconfirms Cookies Off, Bot detection On, and Strict masking.
4. DevOps identifies and independently verifies the marketing S3 bucket and CloudFront distribution.
5. Marketing/privacy confirms that campaigns and referring sites do not place personal or financial data in URLs and use `strict-origin` or a stricter referrer policy where controlled. Clarity URL masking does not cover inbound referrers or clicked destinations.

## Cache and deployment

The repository documentation states that CloudFront uses a one-year shared cache. After all five objects are uploaded with the MIME types above, invalidate `/*` on the verified marketing distribution. A broad invalidation is required because both HTML entry points and newly referenced root assets must become consistent at once.

Example commands for DevOps, to run only after replacing and verifying both placeholders:

```powershell
$MarketingBucket = '<verified-marketing-bucket>'
$DistributionId = '<verified-marketing-cloudfront-distribution-id>'

aws s3 cp .\index.html "s3://$MarketingBucket/index.html" --content-type "text/html; charset=utf-8"
aws s3 cp .\sito.html "s3://$MarketingBucket/sito.html" --content-type "text/html; charset=utf-8"
aws s3 cp .\clarity-consent.js "s3://$MarketingBucket/clarity-consent.js" --content-type "application/javascript; charset=utf-8"
aws s3 cp .\clarity-consent.css "s3://$MarketingBucket/clarity-consent.css" --content-type "text/css; charset=utf-8"
aws s3 cp .\privacy-marketing\index.html "s3://$MarketingBucket/privacy-marketing/index.html" --content-type "text/html; charset=utf-8"
aws cloudfront create-invalidation --distribution-id $DistributionId --paths "/*"
```

Do not use `aws s3 sync` for this limited release.

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

## Rollback

Before upload, DevOps should copy the current production versions of `index.html` and `sito.html` to a versioned, access-controlled rollback location. To roll back:

1. Restore those two prior HTML objects with `text/html; charset=utf-8`.
2. Remove the new `clarity-consent.js`, `clarity-consent.css`, and `privacy-marketing/index.html` objects only after verifying their exact keys and that no other release depends on them.
3. Invalidate `/*` on the verified marketing distribution.
4. Confirm the banner and all requests to `clarity.ms` are absent, while the marketing site, checkout, demo, and Trust Center still load normally.
