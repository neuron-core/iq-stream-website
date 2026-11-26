# Pricing migration: per-app plans

Written 2026-11-26, from the pricing brief ("Pricing Strategy Review"), against today's code in four
repos:

- **iq-stream-cloud**: the SaaS (Laravel, Postgres, Stripe).
- **iq-stream-infra**: the regions' pools on AWS (OpenTofu).
- **iq-stream**: the streaming server.
- **iq-stream-website**: this site.

## 0. The short version

Most of the brief is already built. The SaaS was migrated on 2026-11-25/26 from its own spec,
`iq-stream-cloud/.scratch/per-app-pricing/spec.md`, which is this brief worked out in detail. Its
build log is `build.md` next to it. That spec left the website out on purpose (ticket 12: "The user
rewrites the pricing page in a separate session"), so **the website is the main piece left**. After
it comes capacity.

| Area | State | Where |
| --- | --- | --- |
| Plans Hobby / Team / Business, with the brief's exact limits and quotas | Done | migration `2026_11_25_225944_reshape_plans_for_per_app_pricing` |
| €9 / €99 / €299 monthly prices | Done | `2026_11_25_225946_make_plan_prices_monthly_only` |
| €0.23 per extra stream, €0.13 per extra GB | Done | `2026_11_25_225948_create_usage_prices_table` |
| One plan and one Stripe subscription per app; buy, switch, cancel | Done | commits `70ae4cf`, `049d46c` |
| Usage billed at the period's peak, on the next invoice | Done | `8619467`, `usage_periods` table |
| One free app per personal team, the others wait for a plan | Done | `2026_11_25_232421_move_plans_from_teams_to_apps` |
| Private regions removed | Done | `cb5e917`, and in infra |
| 3-hour streams (token lifetime, HAProxy timeouts) | Done | infra `regions.tf`: `longest_stream_minutes = 180` |
| An app's stream cap split across a region's servers | Done | `4b17ad8`, the `iq_apps` view |
| Stripe catalog (products and prices) | Code done; live state not checked | `iq-stream:create-billing-catalog`, run by `railway/pre-deploy.sh` |
| Sandbox end-to-end test with a Stripe test clock | Not recorded as done | spec ticket 13 |
| **Website pricing page** | **Built 2026-11-26, not committed or deployed.** The free app and Custom are bars around the three cards, and `monthOf()` replaced `monthCents()` | §2 below |
| **Private links** | **Available**, as you told me on 2026-11-26. This repo's code only showed a `private_link` flag on plans | spec §8, §3 below |
| **Capacity for Business** | **Not enough**: 1 server, 700 streams; a Business app may use 3,000 | §4 below |
| Autoscaling | Not started: pools grow by hand | spec §9, §5 below |

I couldn't check live Stripe (the Stripe connector isn't authorized in this session) or Railway.
`iq-stream-cloud` `main` is level with `origin/main`, so release 2 is pushed. Whether it's deployed is
for you to confirm (§6, step 1).

## 1. Where the brief and the build differ

None of these block anything. The first two were settled on 2026-11-25. The last two change what the
website may say.

1. **Who gets the free app.** The brief says "max 1 free app in a team account". The spec's decision 5
   and the code say one free app on a **personal team only**: any other team pays for every app. That
   stops anyone from creating teams to collect free apps. The website follows the code.
2. **The worked example.** The brief's example (a peak of 6 bills €9.23, a peak of 5 bills €9) counts
   5 prepaid streams, but Hobby prepays 40. The app and the website use 40: **a peak of 41 bills €9 +
   €0.23 = €9.23; a peak of 40 or fewer bills €9.**
3. **"They stop paying for egress on their AWS account."** A private link removes the NAT gateway and
   internet egress from the customer's bill, but AWS still bills the customer for the endpoint itself
   (per hour, per zone, and about $0.01 per GB processed). The site should say "no NAT gateway, no
   internet egress", not "free".
4. **"Unlimited streams per region, scaled automatically."** Not true yet. A region holds 700 streams
   per server, and servers are added by hand (§4, §5). The site must not promise autoscaling or
   unlimited capacity until it exists. It doesn't need to: the page's point is that messages are
   never capped.

The free app's limits aren't in the brief. The code has them: 10 concurrent streams, 2 subscribers
per stream, 32 KiB events, 1-hour streams, 5 GB of egress a month (then paused until the 1st), no
private link, never billed.

Worth knowing for the copy: **the max caps drive upgrades, not the price.** Hobby at its 200 max
costs €9 + 160 × €0.23 = €45.80 plus egress, still less than Team's €99. So the page should say
"pick the plan whose maximum fits your peak; usage covers the rest." That is the brief's "a plan is a
commitment that unlocks higher limits".

## 2. The website (this repo)

### 2.1 The new page, top to bottom

1. **Hero.** Title: "Pay for concurrency. *Never per message.*" Lead: "We never cap the number of
   messages. A plan prepays concurrent streams and egress for one app. Above them you pay €0.23 for
   each extra concurrent stream at the month's peak, and €0.13 per GB." Metrics: `0` caps on messages,
   `€9` a month to start, `€0.23` per extra concurrent stream. Actions: Get started, and "See the
   plans" (`#plans`). The "Compare with Pusher and Mercure" link goes.
2. **We never cap messages** (new; replaces the comparison cards). The page's one big idea, in prose,
   with no cards:
   - Other services weren't built for agent streaming, only adapted to it. They count messages, or
     cap how fast you publish, and both punish streaming tokens.
   - One worked number, computed from constants so it stays true: 500 users each watching an agent
     answer at 70 tokens a second send **4.2 million messages in 2 minutes**. Pusher's Pro plan caps
     at 4 million messages **a day** (linked to its pricing page, with the date it was checked).
   - IQ-Stream counts how many streams run **at once**, not how many messages they carry: send every
     token, at any rate.
3. **Plans** (`#plans`, grey). Four cards in one row: Hobby, Team, Business, Custom. A slim line above
   them for the free app. Details in 2.3.
4. **How usage is billed.** Three short rows: the peak, egress, and the cap. Then a small table of
   worked months:

   | Plan | Peak streams | Egress | The month |
   | --- | --- | --- | --- |
   | Hobby | 40 | 20 GB | €9 |
   | Hobby | 41 | 20 GB | €9 + €0.23 = €9.23 |
   | Team | 650 | 300 GB | €99 + 150 × €0.23 + 50 × €0.13 = €140 |
   | Business | 3,000 | 1,200 GB | €299 + 1,500 × €0.23 + 200 × €0.13 = €670 |

   Every amount is computed by `monthCents()` (2.2), never typed by hand.
5. **FAQ.** Drop: VAT, annual terms, and the private-region egress row. New:
   - *Is a plan per app or per team?* Per app. Each app has its own plan, invoice and month, which
     starts on the day you bought the plan. A team can run one app on Hobby and another on Business.
   - *Who gets the free app?* Every account's personal team gets one. Other teams choose a plan for
     each app.
   - *What happens at my plan's maximum?* New streams are refused until one ends, and the peak never
     bills past the maximum. The Owner is emailed at 80% and 100% of each prepaid quota.
   - *What is a private link?* Your VPC reaches the region over AWS PrivateLink, at the same URL:
     your backend publishes without a NAT gateway or internet egress. AWS bills the endpoint itself.
6. **CTA band.** "Start with a free app." Actions: Get started, Talk to us.

### 2.2 `src/consts/pricing.ts`: rewrite

Everything about Pro, Scale, private sizes, annual prices and competitors goes. What stays is the
idea of the file: amounts keyed by the Stripe lookup keys the SaaS creates.

```ts
/** EUR cents before VAT, by the lookup keys of the cloud app's Stripe catalog. */
const CENTS = {
  hobby_monthly: 900,
  team_monthly: 9_900,
  business_monthly: 29_900,
  streams_usage: 23,
  egress_usage: 13,
} as const;
```

- `Plan`: `key`, `name`, `cents` (a month, per app), `prepaidStreams`, `prepaidEgressGb`,
  `maxStreams`, `subscribersPerStream`, `eventKiB`, `streamHours`.
- `PLANS`: Hobby, Team, Business, with the numbers in §0's first row.
- `FREE_APP`: the free app's limits (§1).
- `EXTRA_STREAM_CENTS`, `EXTRA_GB_CENTS`.
- `STREAM_LIMITS = { sizeMiB: 50 }`: the one limit every plan shares (the SaaS's
  `max_stream_bytes`, 52,428,800 bytes). Event size and duration move onto the plans.
- `monthCents(plan, peak, egressGb)`: the plan's cents, plus extra streams (the peak capped at
  `maxStreams`, minus prepaid) and extra GB (rounded up, minus prepaid). The usage table and the
  hero's example read it.
- `prepaidStreamCents(plan)`: what one prepaid stream costs, with the prepaid egress valued at the
  egress price, as the app's Plan page shows it: Hobby €0.144 (37% less than on demand), Team €0.133
  (42% less), Business €0.113 (51% less). Round the saving down, as the app does
  (`Math.floor` in `resources/js/pages/apps/Plan.vue`), so the two never disagree.
- `MESSAGE_CAP`: Pusher Pro's 4,000,000 messages a day, its URL and `checkedOn: '2026-11-23'`, for
  section 2. `AGENT_EXAMPLE = { streams: 500, tokensPerSecond: 70, seconds: 120 }`.
- Drop `Interval`, `Prices`, `Offer`, `SharedPlan`, `PrivateSize`, `MONTHS_FREE`, `centsAMonth`,
  `perThousand`, the competitors and their helpers.

### 2.3 Components

- **Delete** `src/components/pricing/Comparison.astro`.
- **`PriceCard.astro`: rewrite.** No monthly/annual prices and no "per 1,000 streams" rate, which
  only existed for the comparison. A card reads, top to bottom:
  - the name, and "€9 / month per app";
  - **Includes:** 40 concurrent streams and 25 GB of egress, with the prepaid-stream line
    ("€0.144 a stream, 37% less than on demand");
  - **Then:** €0.23 per extra concurrent stream, €0.13 per GB;
  - **Limits:** up to 200 concurrent streams, 2 subscribers per stream, 32 KiB per event, 1-hour
    streams, 50 MiB per stream, private link, no cap on messages;
  - the CTA, "Choose Hobby", to `GET_STARTED`. A plan is bought per app inside the console.
- **Custom card** (in `PricingCards`, not a `Plan`): "For teams shipping agents at scale." More
  streams, longer streams, custom terms. CTA: `CONTACT` ("Talk to us").
- **`PricingCards.astro`: rewrite.** No interval switch, no private-region block, no "Every size
  includes". The free line, then four cards (`Grid`, one row from `lg`), then one note: prices are
  per app, monthly, in EUR, before VAT.
- **New `NoMessageCap.astro`** (section 2) and **`UsageBilling.astro`** (section 4), or inline in
  the page if each stays short.
- **`src/pages/pricing.astro`:** the new order. Its meta description: "IQ-Stream pricing: plans per
  app from €9 a month, priced by concurrent streams, with no cap on messages."
- **`src/pages/llms.txt.ts`, line 14:** "Plans per app from €9 a month, priced by peak concurrent
  streams and egress, with no cap on messages." This file has uncommitted edits of yours: change
  only that line.
- **`src/utils/format.ts`:** once the competitors go, `formatSource`, `formatDate`, `formatRate`
  and the `Currency` type are used nowhere else; remove the ones the rewrite leaves unused.
  `formatCents(23)` already prints "€0.23".

### 2.4 Checks

- `npm run build` (it runs `astro check`), with no errors.
- Look at the page at phone, tablet and desktop widths: four cards on one row on desktop, one per row
  on phones.
- Every number on the page matches the SaaS: the plans' rows in `plans`, `plan_prices` and
  `usage_prices` (§0's migrations).
- Search the built site for "Pro", "Scale", "private region", "annual" and "months free": none left.

### 2.5 Commit

You have uncommitted work in 10 files (benchmark, performance, cloud providers, `llms.txt.ts`). Commit
or stash it first, so the pricing rewrite is one commit of its own.

## 3. Private links (release 3)

Spec §8 has the design. In short:

- **Infra:** an AWS PrivateLink endpoint service on each region's NLB, whose private DNS name is the
  region's own hostname (so customers keep the same URL and certificate). The NLB spans a second zone,
  since an endpoint can only use the service's zones. An IAM user for the SaaS that may only allow and
  reject accounts on those services.
- **SaaS:** a `private_links` table. The Owner or an Admin asks for a link in a region where the team
  has a paid app, giving an AWS account ID. The SaaS allows that account through AWS's API, shows the
  `aws ec2 create-vpc-endpoint …` command to run, marks the link active once an endpoint connects,
  and removes it on request or a week after the team's last paid app in that region ends. An admin
  list in Filament.
- **Order:** SaaS, then the infra apply, then the IAM key on Railway, then a trial with our own AWS
  account.

You told me on 2026-11-26 that private links are already available, so the site sells them on every paid plan.

## 4. Capacity before launch

A region holds 700 streams per server (`c8g.medium`), and `aws-eu-central-1` has one server
(`regions.tf`: `servers = 1`). A Business app may run 3,000.

The `iq_apps` view gives each server its share of an app's cap: `max_streams / N` plus twice its
square root. For Business's 3,000, that share fits in a server's 700 from **5 servers** (649 each). At
4 servers it's 805, so the servers' own 700 caps the app near 2,800.

- **Before selling Business:** set `servers = 5` for `aws-eu-central-1` in `regions.tf` and apply
  (infra README §11.1), at a quiet hour. That's 3,500 streams for the region.
- **Until autoscaling:** add a server by hand whenever the region's load alert fires, keeping room
  for the largest app's maximum.
- The proxy holds this: a `c8g.medium` tracks about 12,800 streams of 2 subscribers (infra README
  §11.4).
- **Infra README §11.3** still says "across N servers, an app could run up to N times its streams".
  Commit `4b17ad8` in the SaaS fixed that, so that bullet should go.

## 5. Autoscaling (after launch)

Spec §9. Two of its four parts are done: caps split across servers (A1, `4b17ad8`) and stats read
from every server (A2, `088cbe9`). Left:

- **A3:** an Auto Scaling group with a launch template, servers registering in the SSM list the proxy
  reads, and a scaling signal (streams per server against 700).
- **A4:** a second proxy in a second zone, which needs DNS-01 certificates or a shared one (infra
  README §11.3).
- **Scaling in is the hard part.** A server leaves only after draining, up to 3 h 15 min, and each
  change of servers moves about 1/N of stream ids. Subscribers of a moved stream that reconnect then
  get `iq:gone`. Scale out eagerly, and in slowly, at quiet hours.

Until then, §4's manual servers are enough.

## 6. Deployment order

Each step says how to tell it worked.

1. **Confirm release 2 is live.**
   - In Railway, the latest web deploy's pre-deploy log ends with `Created 3 plans and 2 usage prices
     in Stripe, and retired N old prices.` (first run) or `The catalog is in Stripe already.`.
   - In the live Stripe Dashboard, under Product catalog: Hobby, Team and Business each have one
     active monthly price (lookup keys `hobby_monthly`, `team_monthly`, `business_monthly`). "Extra
     concurrent streams" and "Egress (GB)" each have one active one-time price (`streams_usage`
     €0.23, `egress_usage` €0.13). Pro, Scale and the Small, Medium and Large AWS products are
     archived.
   - If it isn't live, do the spec's §12.3.1 first: widen the live restricted key, enable
     `invoice.created` on the live webhook endpoint, cancel any live test subscription, and check
     what Stripe does after the last retry. Then push or redeploy.
2. **Sandbox end-to-end test** (spec ticket 13), with a Stripe test clock: buy Hobby, add stats rows
   above the quota, advance a month, and check the renewal invoice's two usage lines and the
   e-invoice. Then upgrade mid-month and check the split, cancel and check the final invoice, and
   apply a coupon to check it doesn't discount the usage lines (spec §10).
3. **Capacity:** `servers = 5` in `aws-eu-central-1` (§4). Check: the region's page in the admin
   panel lists 5 serving servers and a capacity of 3,500.
4. **Website:** build and deploy the new pricing page (§2). Check:
   `/pricing/` and `/llms.txt` on iq-stream.dev show the new plans.
5. **Production smoke test:** with a real card, buy Hobby on a test app. Check the invoice and the
   e-invoice, then cancel, and check the final usage invoice is skipped at €0.
6. **Private links** (§3): already available.
7. **Public launch.**
8. **Autoscaling** (§5), before a region needs servers faster than you can add them by hand.
