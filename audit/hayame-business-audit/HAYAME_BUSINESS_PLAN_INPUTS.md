# HAYAME_BUSINESS_PLAN_INPUTS

## Scope note

This business-plan input pack is derived from repositories present in this workspace:

- `/Users/profdouglas/Desktop/Hayame 2.0 `
- `/Users/profdouglas/Desktop/Hayame 2.0 /HayameIOS`

## Product summary

- Category: Ghana-focused peer-to-peer car rental marketplace.
- Core flows implemented:
  - renter discovery -> booking hold -> Paystack payment -> messaging -> review/dispute
  - host onboarding -> listing management -> booking approvals -> performance tracking
  - admin moderation -> refund/review/dispute controls -> user messaging
- Product strengths:
  - localized Ghana UX and pricing logic
  - clear booking lifecycle and conflict controls
  - robust manual moderation controls
- Current maturity constraints:
  - trust stack not fully automated (insurance/KYC/fraud)
  - payout and support automation incomplete

## Market summary

- Positioning: local alternative to global Turo-style models with Ghana-specific operations.
- Target demand:
  - urban renters seeking flexible access
  - individual and SME hosts monetizing idle/fleet vehicles
- Competitive edge today:
  - localization + manual trust controls + local payment integration (Paystack)

## Revenue model summary

- Primary model: transaction marketplace fees.
- In-code monetization components:
  - platform booking commission (`platform_fee_percent`)
  - fee layers (`insurance_fee`, `delivery_fee`, `deposit_amount`, `outside_accra_surcharge`)
- Financial operations maturity:
  - payment verification and refunds implemented
  - full host payout settlement workflow still a gap

## Growth model summary

- Acquisition/product loops currently available:
  - SEO landing pages + exploration/search UX
  - favorites and listing views as intent signals
  - host conversion funnel (apply -> approve -> list)
- Scaling levers in code:
  - filter/catalog expansion (`car_makes`, `car_models`)
  - host performance dashboards (conversion/earnings signals)
  - mobile app channel (native iOS)
- Growth blockers to address:
  - trust depth (insurance, automated verification)
  - analytics stack for cohort/LTV attribution

## Risk summary

- Critical:
  - secret hygiene issue in env template
  - schema drift between code usage and checked-in migrations
- High:
  - no automated KYC/fraud tooling
  - payout automation incomplete
  - basic admin auth model
- Medium:
  - contact/support workflow partially wired
  - feature completeness variance across modules

## Infrastructure summary

- Web stack: Next.js + TypeScript + Tailwind + Radix-style UI.
- Backend/API: Next.js route handlers with Supabase clients.
- Data/auth/storage: Supabase Postgres/Auth/Storage + RLS.
- Payments/email: Paystack + Resend.
- Deployment target: Vercel + Supabase.
- Mobile: native SwiftUI iOS app with API and Supabase fallback integration.

## Readiness interpretation for investor-grade plan

- Strong foundation: core marketplace engine is functional (discovery, booking, payment, messaging, moderation).
- Scaling requirement: move from manual trust/ops-heavy model to automated, auditable, compliance-ready systems (KYC, insurance, payouts, fraud detection, analytics).
