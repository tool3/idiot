# Monetization

An honest assessment, including the options that do not work.

## The core problem

The thing that makes **idiot** good is the thing that makes it hard to monetize: it runs entirely on
the user's machine. There is no server, no per-request cost, no account, and no telemetry. Marginal
cost per user after the CDN hit is **zero** — which is wonderful for margins and terrible for the
usual SaaS playbook, because there is no metered resource to gate.

There is also no moat in the output. A search engine answers "what does X mean" for free. Nobody
will pay for idiom definitions.

**What is actually valuable here is not the answers. It is the engine and the proof it works.**

## What will not work

Ruling these out explicitly, because they are the obvious first suggestions.

**Display ads.** The audience is small and intent-poor. Realistic RPM for a utility page is $1–4;
you would need roughly a million sessions a month to clear $2k. It also destroys the single
strongest claim the product makes — that nothing leaves your machine — because every ad network is a
tracking network. The privacy story is worth more than the ad revenue.

**Per-query pricing.** Queries cost nothing to serve. Charging for them invites a competitor to
offer the identical thing free, because it *is* free.

**A subscription for the core app.** There is nothing to withhold. The model is open weights, the
code is client-side, and anyone can read both. A paywall would be theatre.

**Selling data.** There is no data. That is the point.

## What could work

Ranked by how well the effort matches the return.

### 1. The engine as a product — a licensable component

This is the strongest option. What was actually built is not an idiom dictionary; it is a **reliable
small-model pipeline**: staged prompting, typo repair with an edit-distance guard, echo detection,
loop truncation, a garbled-output canary, and dtype negotiation across WebGPU and WASM. Those are
the hard parts of shipping on-device inference, and every team attempting it hits the same walls.

Package it as `@your-org/on-device-llm` — a headless React/TS layer that handles model selection,
caching, backend detection, staged generation and output validation. Free and open for
non-commercial use; a commercial licence for products.

Who pays: teams building privacy-sensitive or offline-capable features — healthcare intake, legal
document tools, education software, defence and government, anything in the EU that would rather not
send text to a US API. Their alternative is three engineer-months rediscovering that
`Qwen2.5-1.5B-q4f16` silently returns `NaN` on Apple GPUs.

Pricing: $2–8k per product per year, or a one-off perpetual licence around $15k. Ten customers is a
real business with near-zero support cost.

### 2. Consulting pulled through by the demo

**idiot** is a working, inspectable artefact that says "this person can ship on-device AI" more
convincingly than any deck. On-device and edge inference is a live, under-served specialism, and the
people who need it mostly cannot evaluate who is competent.

Publish the engineering write-up, let the app be the portfolio piece, and sell implementation at
consulting rates. The app costs nothing to run, so it is a lead generator with no burn. This is
likely the fastest path to actual revenue.

### 3. A paid companion, not a paid core

Keep the web app free forever. Sell the things that genuinely cost something to build and cannot be
copy-pasted:

- **Native menu-bar / raycast app** — global hotkey, works on selected text anywhere, model stays
  warm between invocations. One-off $8–15. People pay for utilities that live in the OS.
- **Browser extension** — right-click any phrase on any page. Free tier with the small model, $10
  one-off to unlock the 3B and custom repos.
- **Offline language-learning pack** — curated idiom sets, spaced repetition, progress that syncs
  nowhere. $15–25. ESL learners are a large, motivated, underserved market and *value* offline.

The web app is the funnel; the native surface is the product.

### 4. Education and institutional licensing

ESL classrooms, university language departments and school districts have two constraints that fit
this app exactly: **no student data may leave the device**, and **the network is unreliable**. An
app that runs offline with zero data collection is not a compromise for them, it is the requirement.

Sell a site licence: hosted-or-self-hosted build, custom idiom sets, teacher dashboards fed by local
storage only, an institution's branding. $500–3000 per institution per year. Slow sales cycle, very
high retention, and the privacy posture closes the deal on its own.

### 5. Sponsorship aligned with the values

GitHub Sponsors and a discreet "runs on your machine, sponsored by X" line. Realistically $50–500 a
month — not a business, but it covers hosting and signals seriousness. Only viable once the
engineering write-up has circulated.

## The recommendation

Do these three, in this order:

1. **Ship the write-up.** The technical story — NaN logits on Apple GPUs, the repair guard, the
   staged pipeline — is genuinely novel and the most valuable asset. It costs nothing and it feeds
   everything below.
2. **Extract the engine** into a licensable package. Highest revenue per unit of effort, and the
   work is already done.
3. **Build the native companion** once there is evidence people use the web app twice.

Keep the web app free, private and ad-free permanently. It is the proof, and its credibility is the
thing being sold.

## What to measure first

Before committing to any of it, find out whether anyone returns. With no telemetry, the honest
options are a single self-hosted counter on the initial page load, or simply publishing it and
watching where it gets discussed. **Return usage is the only number that matters** — a tool people
use once is a curiosity, and none of the above works on a curiosity.
