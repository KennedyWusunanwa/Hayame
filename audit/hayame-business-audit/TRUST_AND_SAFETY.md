# TRUST_AND_SAFETY

## Identity verification
- Implemented:
  - Host application captures ID type/number and front/back ID image paths.
  - ID files stored in private `host-ids` bucket; access via signed URL endpoint.
  - Profile-level trust flags exist: `id_verified`, `phone_verified`, `email_verified`, `host_level`.
- Maturity: `partial`
  - Trust flags are present and displayed, but no external automated identity verification provider is integrated.

## Host vetting
- Implemented:
  - Admin review of host applications (approve/reject with reason).
  - Approval updates host profile role/status and writes admin audit logs.
- Maturity: `complete` for manual workflow.

## Insurance / protection
- Implemented:
  - Fee fields (`insurance_fee`) can be charged per booking.
  - Protection page exists.
- Gap:
  - Protection page explicitly marks coverage terms as "coming soon".
  - No insurer API or policy issuance workflow found.
- Maturity: `planned/partial`.

## Damage claims and dispute handling
- Implemented:
  - `disputes` table + participant-restricted open/list API.
  - Admin dispute status controls (`open`, `under_review`, `resolved`, `closed`) and resolution notes.
- Maturity: `complete` for internal workflow.

## Rating and review system
- Implemented:
  - Only renters with completed bookings can submit reviews.
  - One review per booking/user guard.
  - Admin hide/unhide moderation with reason metadata.
- Maturity: `complete`.

## Deposit handling
- Implemented:
  - `deposit_amount` captured at listing and included in booking total calculation.
- Gap:
  - No explicit escrow/hold-release automation found.
- Maturity: `partial`.

## Cancellation policy
- Implemented:
  - Listing-level `cancellation_policy` field (`flexible|moderate|strict`) and cancellation info page.
- Gap:
  - No fully automated refund decision matrix by policy detected in API logic.
- Maturity: `partial`.

## Messaging safety controls
- Implemented:
  - Renter host-contact reveal only after qualifying booking states (`awaiting_host|confirmed|completed|refunded`).
  - Reduces direct-contact exposure before transactional trust is established.
- Maturity: `complete`.

## Trust/Safety summary
Hayame has a strong manual trust-and-safety foundation (host vetting, review controls, disputes, gated contact reveal), but investor-grade scale readiness requires deeper automation in KYC, insurance, fraud detection, and policy-linked cancellation/deposit operations.
