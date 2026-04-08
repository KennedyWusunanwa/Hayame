# OPERATIONS_MODEL

## Current operating model inferred from code

Hayame currently operates as a hybrid marketplace model: digital self-service product flows with significant manual platform operations controls.

## Core operational functions

### 1) Customer support

- Channels present:
  - In-app renter-host messaging
  - Admin office messaging console for direct user outreach
  - Contact page UI (currently not backend-wired)
- Operational implication:
  - Requires support team for dispute triage, payment edge cases, and manual escalations.

### 2) Host onboarding and compliance

- Workflow:
  - User submits host application with identity docs.
  - Admin reviews and approves/rejects.
- Operational implication:
  - Human review queue is required for turnaround and quality control.

### 3) Car/listing verification

- Workflow:
  - New/updated listings enter moderation (`approval_status`).
  - Admin approves/rejects/deletes listings.
- Operational implication:
  - Ongoing moderation staffing needed to maintain listing quality and safety standards.

### 4) Booking and payment operations

- Workflow:
  - Hold-first booking model, Paystack verify/finalize, host decision, refund paths.
- Operational implication:
  - Payment ops required for failed verification, refund requests, and reconciliation.

### 5) Dispute operations

- Workflow:
  - Users open disputes linked to bookings.
  - Admin updates dispute status and resolution notes.
- Operational implication:
  - Requires dispute-resolution SOPs and response SLAs.

### 6) Settlement and payout operations

- Current state:
  - Host earnings indicators exist.
  - No complete automated payout settlement pipeline detected.
- Operational implication:
  - Finance/ops may require manual payout workflows until automation is built.

## Team capability requirements (near-term)

- Trust and safety reviewers (host and listing approvals).
- Customer support/dispute operations.
- Payment operations and refund management.
- Data/operations analyst for marketplace KPIs (views, conversion, booking funnel).

## Tooling maturity assessment

- Strong:
  - Admin controls for moderation, disputes, refunds, user messaging.
- Weak/needs build-out:
  - Fully wired support intake (contact workflow)
  - Automated KYC/fraud checks
  - Automated host payout settlement and reconciliation
