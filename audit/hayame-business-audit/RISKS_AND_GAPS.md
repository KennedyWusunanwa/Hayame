# RISKS_AND_GAPS

## Critical risks

### 1) Secret exposure risk in tracked config templates

- Observation: `.env.example` contains what appears to be real-looking sensitive keys/tokens (service role/resend values), not only placeholders.
- Risk: key leakage, unauthorized data access, account compromise.
- Priority: immediate key rotation and template sanitization.

### 2) Schema source-of-truth drift

- Observation: core runtime tables used in code (`conversations`, `messages`, `car_makes`, `car_models`, `gh_regions`, `gh_districts`) are not present in checked-in SQL migrations.
- Risk: broken deployments, inconsistent environments, high migration debt.
- Priority: unify and version all production schema migrations in-repo.

## High-priority product/ops gaps

### 3) Insurance/protection not operational

- Observation: protection page explicitly states "coming soon" for coverage/claims terms.
- Risk: trust barrier, legal/commercial exposure for incidents.

### 4) KYC and driver license verification are manual-only

- Observation: host ID capture exists, but no external verification integration detected.
- Risk: onboarding fraud and compliance weaknesses.

### 5) Fraud detection tooling absent

- Observation: no dedicated anti-fraud/risk scoring engine found.
- Risk: payment abuse, synthetic accounts, chargeback and dispute burden.

### 6) Payout automation not complete

- Observation: earnings indicators exist; full host settlement pipeline not found.
- Risk: scaling bottleneck and finance operations complexity.

### 7) Admin auth model is basic

- Observation: admin access uses env username/password + cookie, no role-claim RBAC model.
- Risk: weaker security posture and limited audit granularity for privileged actions.

## Medium-priority product gaps

### 8) Support intake not fully wired

- Observation: contact form is present but currently visual-only.
- Risk: fragmented support handling and poor SLA tracking.

### 9) Feature completeness variance

- Observation:
  - Explore map panel feature-flagged off.
  - Prices/blog routes feature-flagged off.
  - Host earnings page uses static sample payout data.
- Risk: inconsistent user expectations and investor narrative friction.

### 10) Cancellation/deposit policy automation gap

- Observation: policies and fees exist, but no full policy-based automated refund/deposit release logic found.
- Risk: manual policy handling and customer disputes.

## Engineering and execution risks

### 11) Limited observability stack

- Observation: no clear centralized monitoring/error analytics instrumentation in scanned code.
- Risk: slower incident detection and root-cause analysis.

### 12) Test coverage signal is low

- Observation: no strong automated test suite footprint surfaced in repository scripts/docs.
- Risk: regression risk as booking/payments/messaging complexity grows.

### 13) Multi-repo completeness unknown

- Observation: only main Hayame repo + iOS repo were found in current workspace; expected additional repos were not present.
- Risk: audit blind spots for Android/admin/API split code if maintained elsewhere.
