# Hayame — Operating Costs

**Last updated:** 7 July 2026
**Exchange rate used:** **US$1 = GH₵11.38** (Bank of Ghana interbank, 7 Jul 2026).
Bank retail/card rates (e.g. GCB) are usually a little higher than interbank when
you actually pay USD bills by card, so treat the cedi figures as a floor and
add a small FX margin.

---

## 1. Monthly running costs (recommended production tiers)

| System | What it does in Hayame | Plan | USD / mo | GH₵ / mo |
|---|---|---|---:|---:|
| **Vercel** | Hosts the website **and** the mobile backend (`/api/mobile/*`) | Pro | $20 | ₵227.60 |
| **Supabase** | Postgres database, Auth (logins), Storage (car photos, avatars, host IDs) | Pro | $25 | ₵284.50 |
| **Resend** | Transactional email (invoices, refund receipts, confirmations) | Free (3,000/mo) | $0 | ₵0 |
| **Apple Developer** | iOS App Store access (amortized from $99/yr) | — | $8.25 | ₵93.89 |
| **Domain** (hayamegh.com) | Web address (amortized from ~$12/yr) | — | $1.00 | ₵11.38 |
| **APNs + Firebase FCM** | iOS + Android push notifications | Free | $0 | ₵0 |
| **Total (launch / low traffic)** | | | **≈ $54** | **≈ ₵617** |

> **Plus** Paystack transaction fees (see §4) — a cut of sales, not fixed overhead.

---

## 2. When you grow (more email, traffic, storage)

| Added cost | USD / mo | GH₵ / mo |
|---|---:|---:|
| Resend Pro (50,000 emails) | $20 | ₵227.60 |
| Vercel / Supabase usage overages | variable | variable |
| **Estimated total at moderate scale** | **≈ $75–95** | **≈ ₵850–1,080** |

---

## 3. Annual / one-time costs

| Item | USD | GH₵ | Frequency |
|---|---:|---:|---|
| Apple Developer Program | $99 | ₵1,126.62 | per year |
| Google Play Developer | $25 | ₵284.50 | one-time |
| Domain renewal | ~$12–15 | ₵137–171 | per year |

---

## 4. Payments — Paystack (per transaction, not fixed)

Paystack has **no monthly fee**. It takes a percentage of each sale, deducted
automatically, so it scales with revenue rather than being maintenance overhead:

- **Mobile money:** ~1.5%
- **Local cards:** ~1.95% (capped)
- **International cards:** ~3.9%

Example: on GH₵1,000 of bookings paid by mobile money, Paystack keeps ~GH₵15.

---

## 5. Notes & caveats

- **Free-tier warning:** you *could* run on Vercel Hobby + Supabase Free for
  ~$9/mo, but it's **not recommended** for a live business — Supabase's free
  database pauses after inactivity and is size-capped, and Vercel Hobby's terms
  exclude commercial use. The ~₵617/mo figure buys you a stable production setup.
- **Not in the stack (so ₵0):** no SMS/Twilio, no paid maps (iOS uses Apple's
  free geocoding), no analytics/Sentry, no Redis. The stack is lean.
- **Prices are approximate list prices as of Jul 2026** and depend on usage
  (bandwidth, database size, email volume). Confirm on each provider's pricing
  page, and re-check the USD→GH₵ rate, which moves daily.

---

### Quick summary

- **To keep the lights on today:** ~**$54 / month (≈ ₵617)** + Paystack fees.
- **As you scale:** ~**$75–95 / month (≈ ₵850–1,080)**.
- **Yearly extras:** Apple $99 (₵1,127) + domain ~$12 (₵137).
