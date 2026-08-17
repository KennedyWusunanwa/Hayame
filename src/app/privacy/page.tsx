import type { Metadata } from "next";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PrivacyChoices } from "@/components/privacy-choices";
import { SUPPORT_ADDRESS, SUPPORT_EMAIL } from "@/lib/support";

export const metadata: Metadata = {
  title: "Privacy Policy | Hayame",
  description:
    "How Hayame collects, uses, shares, and protects your personal information across our website and iOS and Android apps, including your rights under GDPR, CCPA/CPRA, and Ghana's Data Protection Act.",
};

// Keep in step with CONSENT_POLICY_VERSION in src/lib/analytics/consent.ts.
// If that constant changes, everyone is re-asked for consent — so these two
// dates moving together is what makes the re-prompt honest.
const LAST_UPDATED = "July 17, 2026";

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-6 px-6 py-10">
      <div>
        <p className="text-sm font-semibold text-brand">Legal</p>
        <h1 className="text-3xl font-semibold text-foreground">
          Privacy Policy
        </h1>
        <p className="mt-2 text-sm text-gray-700">
          Last updated: {LAST_UPDATED}
        </p>
        <p className="mt-3 text-sm text-gray-700">
          Hayame (&ldquo;Hayame,&rdquo; &ldquo;we,&rdquo; &ldquo;us,&rdquo; or
          &ldquo;our&rdquo;) operates a peer-to-peer car rental marketplace in
          Ghana through our website at hayamegh.com and our iOS and Android
          apps (together, the &ldquo;Service&rdquo;). Hayame is the data
          controller responsible for your personal information.
        </p>
        <p className="mt-3 text-sm text-gray-700">
          This Privacy Policy explains what personal information we collect, why
          we collect it, how we use and share it, how long we keep it, and the
          rights and choices you have &mdash; including under the EU/UK General
          Data Protection Regulation (GDPR), the California Consumer Privacy Act
          as amended by the CPRA (CCPA), and Ghana&rsquo;s Data Protection Act,
          2012 (Act 843). If you do not agree with this Policy, please do not
          use the Service.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>1. Information we collect</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-gray-700">
          <p>We collect the following categories of personal information:</p>
          <p>
            <span className="font-semibold text-foreground">
              Identity &amp; contact information:
            </span>{" "}
            your first and last name, email address, phone number, and account
            password when you register, edit your profile, or contact support.
            We offer email-and-password sign-in only; our authentication
            provider (Supabase) processes your email address and a unique user
            identifier to create and secure your session. We do not use
            third-party or social sign-in.
          </p>
          <p>
            <span className="font-semibold text-foreground">
              Identity &amp; host verification:
            </span>{" "}
            if you apply to become a host, a government-issued ID and related
            verification details so we can confirm your identity, comply with
            our legal obligations, and keep the marketplace safe.
          </p>
          <p>
            <span className="font-semibold text-foreground">
              Photos &amp; media:
            </span>{" "}
            profile pictures and vehicle listing photos you upload. On mobile,
            and only with your permission, we access your camera and photo
            library solely to capture or select these images.
          </p>
          <p>
            <span className="font-semibold text-foreground">
              Booking, transaction &amp; address information:
            </span>{" "}
            listings you view, save, and book; trip dates; the pickup, delivery,
            or trip-use address and city you provide; your booking and trip
            history; reviews; and favorites.
          </p>
          <p>
            <span className="font-semibold text-foreground">
              Location information:
            </span>{" "}
            we use the city or area you enter to show relevant vehicles. On
            Android, where you grant permission, we may use your device&rsquo;s
            location to show nearby vehicles and improve search results; you can
            turn this off at any time in your device settings. Our iOS app does
            not request device location.
          </p>
          <p>
            <span className="font-semibold text-foreground">
              Payment information:
            </span>{" "}
            payments are processed by our payment provider, Paystack. Your card
            or bank details are entered directly with Paystack and we do not
            store them on our servers; we retain transaction records (such as
            amount, status, and a reference) needed to manage bookings, payouts,
            disputes, and refunds.
          </p>
          <p>
            <span className="font-semibold text-foreground">
              Communications:
            </span>{" "}
            messages exchanged between guests and hosts through the Service, and
            the contents of support or contact requests.
          </p>
          <p>
            <span className="font-semibold text-foreground">
              Device, identifiers &amp; usage data:
            </span>{" "}
            an account/user ID, device identifiers and push-notification tokens,
            device type and app version, and product-interaction data such as
            pages and listings viewed, taps, and favorites, along with log data
            we use to operate, secure, and improve the Service.
          </p>
          <p>
            <span className="font-semibold text-foreground">
              Categories of sources.
            </span>{" "}
            We collect personal information directly from you (when you register,
            build a profile, list a vehicle, book a trip, message another user,
            or contact support); automatically from your devices and your use of
            the Service (device identifiers, push tokens, log and
            product-interaction data, and, on Android with permission, device
            location); from other users (for example, a host or guest you
            transact with, and reviews); and from our service providers,
            including Paystack (transaction reference, amount, and status) and
            Supabase.
          </p>
          <p>
            <span className="font-semibold text-foreground">
              Required vs. optional information.
            </span>{" "}
            Some information is required to provide the Service. You must provide
            your name, email, phone number, and password to create an account
            and to book or list a vehicle; if you apply to become a host, you
            must provide a government-issued ID for identity verification and our
            legal and fraud-prevention obligations. If you do not provide this
            required information, we cannot create your account or let you book
            or list vehicles. Other items &mdash; such as camera, photo library,
            or Android device-location access &mdash; are optional and used only
            with your permission.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>2. How we use your information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-gray-700">
          <p>We use the information we collect to:</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>Create and manage your account and authenticate logins.</li>
            <li>
              Enable bookings, messaging, reviews, payments, payouts, and
              refunds between guests and hosts.
            </li>
            <li>
              Verify host identity and help prevent fraud, abuse, and unsafe
              activity on the marketplace.
            </li>
            <li>
              Send service messages, transactional emails, and push
              notifications about bookings, messages, and account activity.
            </li>
            <li>Provide customer support and respond to your requests.</li>
            <li>
              Understand how the Service is used so we can maintain, secure, and
              improve it.
            </li>
            <li>Comply with our legal, tax, and accounting obligations.</li>
          </ul>
          <p>
            We do not use your personal information for third-party advertising,
            and we do not engage in tracking across other companies&rsquo; apps
            or websites.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>3. Legal bases for processing</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-gray-700">
          <p>
            If you are in the European Economic Area or the United Kingdom, we
            rely on the following legal bases under the GDPR:
          </p>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              <span className="font-semibold text-foreground">Contract:</span>{" "}
              to create your account and provide bookings, payments, and
              messaging you request.
            </li>
            <li>
              <span className="font-semibold text-foreground">Consent:</span>{" "}
              for usage analytics (see section 5), camera, photo library,
              location, and notification permissions, and any optional
              communications &mdash; which you can withdraw at any time.
            </li>
            <li>
              <span className="font-semibold text-foreground">
                Legal obligation:
              </span>{" "}
              for identity verification, fraud prevention, tax, and accounting
              requirements.
            </li>
            <li>
              <span className="font-semibold text-foreground">
                Legitimate interests:
              </span>{" "}
              to secure the Service, prevent abuse, and improve our features, in
              a way that is balanced against your rights.
            </li>
          </ul>
          <p>
            <span className="font-semibold text-foreground">
              Data subjects in Ghana.
            </span>{" "}
            For data subjects in Ghana, we process personal data in accordance
            with the Data Protection Act, 2012 (Act 843), relying on your
            consent (for example, for camera, photo library, location, and
            notification access) and on other lawful grounds, including the
            performance of our contract with you, compliance with our legal
            obligations, and our legitimate interests in operating and securing
            the marketplace.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>4. How we share your information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-gray-700">
          <p>
            We do not sell your personal information, and we do not share it for
            cross-context behavioral advertising. We disclose information only as
            needed to run the Service:
          </p>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              <span className="font-semibold text-foreground">
                Between guests and hosts:
              </span>{" "}
              when you book or list, limited profile and trip details are shared
              with the other party to complete the booking.
            </li>
            <li>
              <span className="font-semibold text-foreground">
                Service providers (processors):
              </span>{" "}
              Supabase (authentication, database, and file storage), Paystack
              (payment processing), Resend (transactional email), and Apple Push
              Notification service and Google Firebase Cloud Messaging (push
              notifications). We share personal information with these providers
              only to the extent needed to perform their services, and each is
              bound by a written agreement that requires it to process data only
              on our documented instructions, keep it confidential, apply
              appropriate security measures, provide the same or equal
              protection of your information as set out in this Policy, and not
              use your data for its own purposes.
            </li>
            <li>
              <span className="font-semibold text-foreground">
                On-device services:
              </span>{" "}
              on Android, Google Play services provides device-location
              functionality that, with your permission, runs on your device so
              we can show you nearby vehicles. Location captured this way is used
              by Hayame for that purpose; it is not collected by Google on our
              instructions.
            </li>
            <li>
              <span className="font-semibold text-foreground">
                Legal &amp; safety:
              </span>{" "}
              when required by law or legal process, to enforce our terms, or to
              protect the rights, property, or safety of our users and the
              public.
            </li>
            <li>
              <span className="font-semibold text-foreground">
                Business transfers:
              </span>{" "}
              in connection with a merger, acquisition, financing, or sale of
              assets, subject to this Policy.
            </li>
          </ul>
          <p>
            In the preceding 12 months we disclosed the following categories of
            personal information for business purposes: identifiers,
            commercial/booking information, communications, photos, geolocation,
            and (for hosts) government identifiers &mdash; to the categories of
            recipients above (service providers, the other party to a booking,
            and, where required, legal or regulatory authorities and parties to
            a business transfer). We did not sell or share any category of
            personal information for cross-context behavioral advertising.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>5. Cookies, analytics &amp; similar technologies</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-gray-700">
          <p>
            <strong>Strictly necessary (always on).</strong> We use cookies and
            similar technologies to keep you signed in, maintain your session,
            and secure the Service. These are required for the Service to work
            and cannot be turned off. Disabling them in your browser may break
            sign-in and booking.
          </p>
          <p>
            <strong>Analytics (only with your permission).</strong> If you
            accept, we record how the Service is used: pages viewed, searches
            made, which cars are viewed, and where a booking is abandoned. To do
            this we store a random identifier on your device (in your browser&apos;s
            local storage on the web, or in app storage on iOS). It is not a
            name, an email, or an advertising ID, and it is not shared with
            anyone. Nothing is stored and nothing is sent until you accept.
          </p>
          <p>
            <strong>What we do not do.</strong> We do not use advertising or
            cross-site tracking cookies. We do not track you across other
            companies&apos; apps or websites. We do not use device
            fingerprinting, session recording, or heatmaps. We do not sell your
            data or share it with data brokers or advertising networks. Our iOS
            app does not use the advertising identifier (IDFA), which is why it
            does not show Apple&apos;s tracking permission prompt.
          </p>
          <p>
            <strong>Changing your mind.</strong> You can turn analytics on or
            off at any time, and turning it off deletes the identifier described
            above. On the web, use the controls in section 11 below. On iOS, go
            to Profile → Privacy → Share usage analytics. Declining does not
            limit any feature of the Service.
          </p>
          <p>
            We keep individual analytics events for up to 400 days, after which
            they are deleted. Aggregate counts that cannot identify you may be
            kept longer.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>6. Data retention</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-gray-700">
          <p>
            We retain each category of personal information for as long as your
            account is active and for the period needed for the purpose it was
            collected:
          </p>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              Account, identity, and contact information &mdash; for the life of
              your account, and deleted within 30 days of account closure.
            </li>
            <li>
              Booking, transaction, and payment records &mdash; for the period
              required by applicable Ghanaian tax and accounting law (generally
              up to six years after the transaction).
            </li>
            <li>
              Host verification documents (government ID) &mdash; only as long as
              needed to verify and maintain host status and to meet our legal
              and fraud-prevention obligations, then securely deleted.
            </li>
            <li>
              Messages, reviews, and support requests &mdash; while needed to
              operate the Service and resolve disputes.
            </li>
            <li>
              Device, log, and product-interaction data &mdash; for a limited
              operational period.
            </li>
          </ul>
          <p>
            When information is no longer needed for these purposes, we delete or
            anonymize it.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>7. How we protect your information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-gray-700">
          <p>
            We use industry-standard safeguards, including encryption in transit,
            access controls, and row-level security on our database, to protect
            your information. No method of transmission or storage is completely
            secure, so we cannot guarantee absolute security.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>8. International data transfers</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-gray-700">
          <p>
            Hayame operates from Ghana, and our service providers may process and
            store data in other countries, including outside your own. Where
            required by law, we put appropriate safeguards in place &mdash; such
            as standard contractual clauses or transfers to jurisdictions
            recognized as providing an adequate level of protection &mdash; so
            that your information remains protected. You can request a copy of
            the safeguards we rely on, or more information about where your data
            is processed, by emailing us at{" "}
            <a
              className="font-semibold text-brand"
              href={`mailto:${SUPPORT_EMAIL}`}
            >
              {SUPPORT_EMAIL}
            </a>
            .
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>9. Automated decision-making</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-gray-700">
          <p>
            We do not make decisions about you based solely on automated
            processing (including profiling) that produce legal effects
            concerning you or similarly significantly affect you. Our
            fraud-prevention and identity-verification checks may use automated
            tools, but any decision that significantly affects you (such as
            suspending or removing your account) involves human review. If this
            changes, we will update this Policy and explain the logic involved
            and the consequences for you.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>10. Your privacy rights</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-gray-700">
          <p>
            Depending on where you live, you may have some or all of the
            following rights regarding your personal information:
          </p>
          <ul className="list-disc space-y-1 pl-5">
            <li>Access a copy of the information we hold about you.</li>
            <li>Correct inaccurate or incomplete information.</li>
            <li>Delete your information (subject to legal exceptions).</li>
            <li>Receive your information in a portable format.</li>
            <li>Restrict or object to certain processing.</li>
            <li>Withdraw consent you previously gave, at any time.</li>
            <li>
              Be free from discrimination for exercising your privacy rights.
            </li>
          </ul>
          <p>
            Where we process your information based on our legitimate interests,
            you have the right to object at any time on grounds relating to your
            particular situation by contacting{" "}
            <a
              className="font-semibold text-brand"
              href={`mailto:${SUPPORT_EMAIL}`}
            >
              {SUPPORT_EMAIL}
            </a>
            ; we will stop unless we have compelling legitimate grounds to
            continue or need the data to establish, exercise, or defend legal
            claims.
          </p>

          <p className="pt-1">
            <span className="font-semibold text-foreground">
              EEA &amp; UK (GDPR):
            </span>{" "}
            you also have the right to lodge a complaint with a data protection
            supervisory authority, in particular in the country of your
            residence or workplace, or &mdash; if you are in the UK &mdash; with
            the Information Commissioner&rsquo;s Office (ICO) at ico.org.uk. We
            would appreciate the chance to address your concerns first, so please
            contact us before doing so.
          </p>
          <p>
            <span className="font-semibold text-foreground">
              California (CCPA/CPRA):
            </span>{" "}
            you have the right to know what personal information we collect and
            how we use and disclose it, to request deletion or correction, and to
            opt out of the sale or sharing of personal information and to limit
            use of sensitive personal information. We do not sell or share
            personal information for cross-context behavioral advertising, and we
            have not done so in the preceding 12 months. You may use an
            authorized agent to submit requests, and we will not discriminate
            against you for exercising your rights. We do not sell or share the
            personal information of consumers we know are under 16, and the
            Service is intended only for adults 18 and older.
          </p>
          <p>
            In the past 12 months we have collected the following categories of
            personal information as defined by the CCPA: identifiers (name,
            email, phone, account/user ID, device identifiers, push tokens);
            commercial information (bookings, trip history, favorites); internet
            or other network activity (pages and listings viewed, taps, log
            data); geolocation data (city/area you enter and, on Android with
            permission, device location); audio, electronic, visual, or similar
            information (profile and vehicle photos); the contents of
            communications (guest-host messages, support requests); and sensitive
            personal information.
          </p>
          <p>
            <span className="font-semibold text-foreground">
              Sensitive personal information.
            </span>{" "}
            For California residents, certain information we collect is treated
            as sensitive: government-issued ID and verification details (hosts
            only), your account log-in credentials, the contents of messages
            between guests and hosts and of support requests, and, on Android
            where you grant permission, precise device location. We use this
            information only to provide and secure the Service, verify host
            identity, prevent fraud, and meet our legal obligations &mdash; not
            to infer characteristics about you &mdash; so the right to limit its
            use does not change how we handle it.
          </p>
          <p>
            <span className="font-semibold text-foreground">
              Ghana (Act 843):
            </span>{" "}
            you have the rights provided under the Data Protection Act, 2012,
            including to access and correct your data and to object to
            processing. You may also lodge a complaint with the Data Protection
            Commission of Ghana (dataprotection.org.gh) about how your data is
            handled.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            11. Exercising your rights &amp; deleting your account
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-gray-700">
          <p>
            You can view and update most of your information directly from your{" "}
            <Link
              className="font-semibold text-brand"
              href="/dashboard/profile"
            >
              profile settings
            </Link>
            , and you can manage camera, photo, location, and notification
            permissions at any time in your device settings. Turning off a
            permission stops the related collection going forward &mdash; for
            example, disabling location on Android stops us from using your
            device location, and disabling notifications stops delivery of push
            notifications. This does not delete data already collected.
          </p>
          <div className="rounded-xl border border-border/80 bg-gray-50/60 p-4">
            <p className="mb-3 font-semibold text-foreground">
              Your analytics choice
            </p>
            <PrivacyChoices />
          </div>
          <p>
            To request access, correction, portability, or deletion of your
            personal information &mdash; or to delete your account entirely
            &mdash; email us at{" "}
            <a
              className="font-semibold text-brand"
              href={`mailto:${SUPPORT_EMAIL}`}
            >
              {SUPPORT_EMAIL}
            </a>{" "}
            with the subject &ldquo;Delete my account.&rdquo; We will verify your
            request and respond within the time required by applicable law, and
            in any case delete your profile and personal information within 30
            days &mdash; except records we must retain for legal, tax, or
            fraud-prevention purposes, which we will tell you about.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>12. Children&rsquo;s privacy</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-gray-700">
          <p>
            The Service is intended for adults who are old enough to enter into a
            car rental agreement, and is not directed to children under 18. We do
            not knowingly collect personal information from children. If you are a
            parent or guardian and believe a child under 18 has provided us with
            personal information, please email us at{" "}
            <a
              className="font-semibold text-brand"
              href={`mailto:${SUPPORT_EMAIL}`}
            >
              {SUPPORT_EMAIL}
            </a>{" "}
            and we will delete it. If we learn that we have collected information
            from a child under 18 without verifiable parental consent, we will
            promptly delete that information and close any associated account.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>13. Changes to this Policy</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-gray-700">
          <p>
            We may update this Privacy Policy from time to time. When we make
            material changes, we will update the &ldquo;Last updated&rdquo; date
            above and, where appropriate, notify you through the Service. Your
            continued use of the Service after an update means you accept the
            revised Policy.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>14. Contact us</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-gray-700">
          <p>
            If you have questions about this Privacy Policy, want to exercise
            your rights, or wish to make a privacy complaint, reach us at:
          </p>
          <p>
            <span className="font-semibold text-foreground">Email:</span>{" "}
            <a
              className="font-semibold text-brand"
              href={`mailto:${SUPPORT_EMAIL}`}
            >
              {SUPPORT_EMAIL}
            </a>
          </p>
          <p>
            <span className="font-semibold text-foreground">Address:</span>{" "}
            {SUPPORT_ADDRESS}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
