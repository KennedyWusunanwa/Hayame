# MONETIZATION

## Revenue mechanics already present in code

### 1) Platform booking fee (commission)
- Implemented via `platform_fee_percent` in `platform_settings` (fallback env default 10%).
- Applied at booking finalization as:
  - `platform_fee = subtotal * (platform_fee_percent / 100)`

### 2) Base rental revenue pass-through
- `subtotal = nights * daily_price`.
- Represents host-facing base value on which platform fee and add-ons are layered.

### 3) Add-on fee monetization fields
Implemented as billable line items in booking totals:
- `insurance_fee`
- `delivery_fee`
- `deposit_amount`
- `outside_accra_surcharge` (based on trip/listing region mismatch logic)

### 4) Total booking amount model
- `total = subtotal + platform_fee + insurance_fee + delivery_fee + outside_accra_surcharge + deposit_amount`
- Amount is verified against Paystack transaction amount before booking finalization.

### 5) Refund controls
- Host rejection and admin operations can trigger Paystack refunds.
- Supports trust retention and compliance operations; impacts net realized revenue.

## Monetization surfaces not yet operationally complete
- Host payout settlement ledger/automation (no complete payout pipeline in code).
- Subscription tiers or premium plans for hosts.
- Paid placement/promoted listings.
- Ancillary partner monetization (insurance commissions via external carrier API, financing, roadside add-ons).

## Business model interpretation
Current model is transaction-led marketplace monetization with configurable platform commission and fee pass-through layers. The revenue foundation is in place, while payout and expanded ancillary monetization capabilities remain scale-phase priorities.
