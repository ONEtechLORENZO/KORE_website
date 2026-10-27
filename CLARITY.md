# Microsoft Clarity integration

Project ID: `z3sy7q9gz9`

## Architecture and scope

The production KORE marketing site is static HTML. `index.html` is the current coming-soon page and `sito.html` is the complete marketing site. `kore-react/` builds the separate purchase workflow published in `acquista/`. The Trust Center is a second, cookie-free static website published from `trust/` on its own subdomain.

Clarity is included only by `index.html` and `sito.html`, through `clarity-consent.js`. The Microsoft tag is created only after an explicit analytics choice of `granted`.

Eligible paths:

- `/`
- `/index.html`
- `/sito.html`
- the public marketing hashes on those pages
- optional `?lang=it` or `?lang=en`

Excluded by default:

- `/acquista/` and every checkout step
- `/richiedi-demo/`
- `/trust/`, PDFs, and all legal/document routes
- `/privacy-marketing/` (the separate marketing-site privacy/cookie notice)
- `#contatti`, `#privacy`, `#pricing`, `#prezzi`, and checkout/workflow hashes
- any URL containing query parameters other than `lang=it` or `lang=en`

The last rule prevents accidental transmission of personal data placed in a URL.

## Consent behavior

The choice is stored in first-party local storage under `kore-clarity-consent-v1`. This stores only `granted` or `denied` and is used as a strictly necessary consent preference.

- No choice: the first-party banner is shown; no request to `clarity.ms` is made.
- Rejected: Clarity is not loaded.
- Accepted: the official asynchronous manual tag is added once, then Consent API V2 is called with `analytics_Storage: "granted"` and `ad_Storage: "denied"`.
- Withdrawn: Consent API V2 is updated to deny both storage types, then the page reloads so the Clarity runtime is removed entirely.
- Sensitive client-side route: the same deny-and-reload behavior removes Clarity before that route continues.

No Clarity custom IDs, tags, events, or URL values are sent.

## URL and referrer privacy review

Clarity may observe the current page URL, the inbound referrer, and the destination of clicked links; content masking does not make those URL fields safe. The integration therefore refuses to load on any marketing URL whose query string contains anything except `lang=it` or `lang=en`. The tracked pages also set `Referrer-Policy` through `<meta name="referrer" content="strict-origin">`, so navigation away from KORE exposes at most the KORE origin.

The eligible public views contain only public business email links, public social/product links, and a generic WhatsApp link. URLs assembled from visitor-entered contact, company, email, phone, note, pricing, calendar, or WhatsApp data exist only in excluded `#contatti`, `#pricing`, and related workflows. Clarity is denied and the page reloads when those routes open.

Residual operational risk remains for inbound referrers: KORE cannot control a referring site's policy, and a third-party source could place personal data in its own URL. Campaigns and referring properties must never put personal or financial data in URLs and should use `strict-origin` or a stricter referrer policy. Verify the production recordings' URL/referrer fields before approval.

## Privacy settings in Clarity

The project administrator reported these settings for project `z3sy7q9gz9`:

- Cookies: **Off**
- Bot detection: **On**
- Masking: **Strict**

The website additionally applies `data-clarity-mask="true"` to the root element before the tag loads. Reconfirm these dashboard settings during the production smoke test. Office/test IPv4 addresses may optionally be added under **Settings > IP blocking**.

The banner links to `/privacy-marketing/`, a separate marketing-site privacy/cookie notice. That notice is intentionally marked as a draft and must receive privacy approval before it is published. The existing Trust Center privacy notice is unchanged.

## Local verification

Serve the repository root, for example:

```powershell
python -m http.server 4520 --bind 127.0.0.1
```

Run the automated checks:

```powershell
node test/clarity-consent.test.mjs
node test/clarity-browser.test.mjs
cd kore-react
node test/crm.test.mjs
node test/listino.test.mjs
npm run build
```

In Chrome DevTools:

1. Open Application > Storage and remove `kore-clarity-consent-v1`, `_clck`, and `_clsk` before each scenario.
2. Open Network, enable Preserve log, and filter for `clarity.ms`.
3. Reload `/`: before a choice there must be no request to `/tag/z3sy7q9gz9` or `/collect`.
4. Select Reject: the tag and collection requests must remain absent.
5. Select Accept analytics: exactly one `/tag/z3sy7q9gz9` request should appear, followed by POST requests to `https://www.clarity.ms/collect` as you interact.
6. In Console, run:

```js
clarity('metadata', (data, upgrade, consent) => console.log(consent), false, true, true)
```

The result should show analytics granted and ads denied.

7. Open Cookie preferences and reject. The page reloads; `_clck` and `_clsk` must be absent and no new Clarity request may occur.
8. Repeat with `/acquista/`, `/richiedi-demo/`, `/trust/`, `/sito.html#contatti`, and `/sito.html#privacy`; none may request the Clarity tag.

## Production deployment

Deploy the marketing site exactly as described in `README.md`, with these additional web-root files:

- `clarity-consent.js`
- `clarity-consent.css`
- updated `index.html`
- updated `sito.html`
- `privacy-marketing/index.html` (only after privacy approval)

Do not copy the integration into `trust/`, `acquista/`, or `richiedi-demo/`. After upload, invalidate the marketing site's CloudFront cache for `/*`, then repeat the DevTools tests against the production domain. Do not treat local tag loading as proof that production recordings are arriving.

In the Clarity dashboard, select project `z3sy7q9gz9`, use the **Today** date range, and check **Dashboard > Live users/Recordings**. Heatmaps can take around 30 minutes to populate; select the exact production URL in **Heatmaps** and confirm only eligible marketing URLs appear.
