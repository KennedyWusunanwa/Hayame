# Hayame privacy & data compliance

Written 17 July 2026. Sources are primary (the statute text, Apple's developer
documentation) and were adversarially verified. Where the research could not
establish something, this document says so rather than guessing.

**This is engineering research, not legal advice.** The items in "Do this first"
have criminal exposure attached and want a Ghanaian data-protection lawyer.

---

## 1. Do this first: register with the Data Protection Commission

**This is the single biggest legal gap, and it is not a code problem.**

Ghana's Data Protection Act 2012 (Act 843):

- **s.27(1)** — "A data controller who intends to process personal data shall
  register with the Commission."
- **s.53** — "A data controller who has not been registered under this Act shall
  not process personal data."
- **s.56** — failing to register but processing anyway "commits an offence and
  is liable on summary conviction to a fine of not more than two hundred and
  fifty penalty units or a term of imprisonment of not more than two years or to
  both."

There is **no small-business or de minimis exemption**. The verifier read the
entire exemptions Part (ss.60–74) and confirmed every exemption is *purpose*-based,
not size-based. The only individual carve-out (s.67) covers "personal, family or
household affairs" — a commercial marketplace cannot claim it.

Scale: 250 penalty units is roughly GHS 3,000. The fine is not the point; the
criminal record and imprisonment exposure are. The DPC declared 2026 an active
enforcement year from January 2026.

Registration certificates last 2 years (s.50).

**When you register, s.47(1)(g) requires you to name "the country to which the
applicant may transfer the data."** For Hayame that means naming where Supabase,
Vercel, Resend, and Paystack hold data.

> Verified 3-0 against the statute text. A related claim — that data *processors*
> must also register — was refuted 0-3; the duty is on controllers.

## 2. Good news: offshore hosting is fine

A common assumption is that Act 843 restricts exporting data from Ghana. **It
does not.** The verifier extracted the full 43-page Act and searched exhaustively
for an export regime (`transfer|foreign|outside the Republic|adequate|cross-border|export`):
7 hits, none of which create one. There are no adequacy decisions, no SCCs, and
no export authorisation requirement.

The Act's only cross-border duty runs **inbound** (s.18(2)), covering foreign
data sent *into* Ghana for processing.

So Supabase/Vercel hosting outside Ghana is lawful. The live obligations are:

- **s.28** — security safeguards
- **s.30** — processor must comply with those safeguards
- **s.47(1)(g)** — name the hosting country at registration

**Watch item:** a Data Protection Bill 2025 would repeal Act 843 wholesale, add a
data-localisation preference that could make offshore hosting problematic, and
raise non-registration penalties roughly 400×. Every conclusion here is contingent
on it not passing. Worth tracking.

## 3. Apple: no ATT prompt needed, and don't add one

Apple defines tracking narrowly (verbatim, developer.apple.com):

> "Tracking refers to the act of linking user or device data collected from your
> app with user or device data collected from other companies' apps, websites, or
> offline properties for targeted advertising or advertising measurement purposes.
> Tracking also refers to sharing user or device data with data brokers."

Hayame does none of that. Decisively for our app+web setup:

> "The ID for Vendors (IDFV) may be used for analytics across apps from the same
> content provider. In this case, the use of the AppTrackingTransparency framework
> is not required."

So: `NSPrivacyTracking` stays `false`, no tracking domains, no ATT prompt.

**What would void this exemption:**

1. Touching IDFA **at all** — ATT is required regardless of why.
2. Embedding a third-party SDK that repurposes our users' data for cross-app
   advertising, *even if we don't use it for ads*. Apple: "Developers are
   responsible for all code included in their apps."

The iOS app currently has **zero third-party SPM dependencies**, which is why
this exemption is safe today. It stops being safe the moment an ad SDK, an
attribution SDK, or an analytics vendor is added.

### Device fingerprinting is banned outright

> "Can I fingerprint or use signals from the device to try to identify the device
> or a user? **No.** Per the Apple Developer Program License Agreement, you may
> not derive data from a device for the purpose of uniquely identifying it."

This is **not** ATT-gated. No user consent can authorise it — tapping "Allow" on
ATT does not help. Apps found doing it are removed. This applies to the iOS app;
it is a separate question on the website, where GDPR/ePrivacy govern instead.

### Consent is required even for anonymous usage data

App Review Guideline 5.1.1(ii):

> "Apps that collect user or usage data must secure user consent for the
> collection, **even if such data is considered to be anonymous** at the time of
> or immediately following collection. Paid functionality must not be dependent
> on or require a user to grant access to this data. Apps must also provide the
> customer with an easily accessible and understandable way to withdraw consent."

This is why the app asks, and why Profile → Privacy → "Share usage analytics"
exists. The withdrawal control is a requirement, not a nicety.

Guideline 5.1.2(i) additionally forbids gating functionality on tracking,
location, or push. Declining analytics must not limit anything — it doesn't.

### Four separate Apple obligations

These are non-substitutable; satisfying one does not satisfy the others:

1. **Privacy Nutrition Label** in App Store Connect — covers third-party
   partners' collection too, not just ours.
2. **PrivacyInfo.xcprivacy** manifest — data types + required-reason APIs.
3. **Privacy policy** linked in **both** App Store Connect and in-app.
4. **Accurate purpose strings** (the `NS*UsageDescription` values).

> ⚠️ **Action needed:** `PrivacyInfo.xcprivacy` has been corrected in this change
> (it previously declared *zero* collected data types while the app collects
> names, emails, phones, photos, and government IDs). **The App Store Connect
> nutrition label is separate and must be updated by hand to match.** Editing the
> manifest does not update the label.

## 4. GDPR: probably not by targeting, possibly by monitoring

GDPR does **not** attach merely because the site loads in Europe. EDPB Guidelines
3/2018: mere accessibility, an email address, or use of a language generally used
in the controller's own country are each insufficient to show targeting.

GHS pricing and Ghana-market English cut **against** Art. 3(2)(a) targeting.

**But** the live exposure is the other limb — Art. 3(2)(b) *monitoring*. Running
behavioural analytics on EU visitors may be caught, and Recital 24 requires no
targeting intent. Deploying tracking technology is more than "mere accessibility",
so the carve-out above does not reach it.

What would flip the targeting analysis: EUR pricing, EU-language localisation, EU
marketing, or testimonials naming EU users.

**Do not conflate Apple and GDPR.** They are independent regimes. Being
ATT-prompt-free under Apple's rules says nothing about whether ePrivacy/GDPR
consent is needed on the website. Apple concedes this: "You remain fully
responsible to ensure that your collection and use of the IDFV complies with
applicable law."

The consent banner exists to address this limb.

## 5. What the research could NOT establish

Recording these honestly so nobody builds on sand:

- **Act 843's lawful bases are unresolved.** The claim that s.20 offers five
  alternative bases (contract-necessity, legitimate interest, etc.) was **refuted
  0-3**. Do **not** assume booking/payment data can be processed on
  contract-necessity without consent. `/privacy` section 3 currently asserts
  contract + legal obligation + legitimate interests under Act 843 — **that text
  predates this work and should be reviewed by a lawyer.** It was deliberately
  left unchanged rather than narrowed on a guess.
- **ePrivacy cookie classification is unverified.** No primary source on Art. 5(3)
  or the strictly-necessary exemption survived verification. The banner's design
  (prior blocking, reject-as-easy-as-accept, no pre-ticked boxes) follows
  well-established practice, but is not backed by a verified citation here.
- **Session recording and heatmaps** — no verified sourcing on where the legal
  lines sit. We don't do them; if that changes, research it first.
- **Do Supabase/Paystack iOS SDKs repurpose data for ads?** Unresolved in general
  — but moot for us: the iOS app has no third-party SDKs at all.

---

## What the code now does

| Area | State |
|---|---|
| Third-party analytics SDKs | **None.** No GA, Vercel Analytics, PostHog, Sentry, Mixpanel, anything. |
| iOS third-party SDKs | **None.** Zero SPM dependencies. |
| IDFA / ATT / AdSupport | **Not used.** `NSPrivacyTracking = false`, no prompt. |
| Device fingerprinting | **Not used.** Banned by Apple regardless of consent. |
| Session recording / heatmaps | **Not used.** |
| Analytics data | First-party only, pseudonymous, consent-gated, 400-day retention. |
| User location | Read at 3km accuracy, used **on device only** for "near you" sorting. Never transmitted — which is why it is not declared as collected. |
| Consent storage | Nothing written to the device before a choice is made. Verified in a browser. |
| Withdrawal | `/privacy` §11 on web; Profile → Privacy on iOS. Deletes the stored identifier. |
| Proof of consent | `consent_records` table (grants *and* denials). No IP stored. |

### Before this ships

1. **Run `db/analytics.sql`** in the Supabase SQL editor. Nothing works until then
   (the dashboard says so plainly rather than showing misleading zeroes).
2. `db/error-reports.sql` is **still pending** from previous work.
3. **Review `/privacy`** — the text changed. It must go live *with or before* the
   analytics code, never after.
4. **Update the App Store Connect nutrition label** to match the corrected
   manifest.
5. **Register with the DPC** (§1) — the only item here with prison attached.

### Known inaccuracy, not fixed

`/privacy` refers to Android apps and "Android device-location access" in several
places. **There is no Android app.** Pre-existing; left alone because rewriting
policy copy unprompted is worse than flagging it.
