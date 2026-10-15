const assert = require("node:assert/strict");
const path = require("node:path");
const Module = require("node:module");
const { register } = require("ts-node");

register({
  transpileOnly: true,
  compilerOptions: {
    module: "commonjs",
    moduleResolution: "node",
  },
});

// Resolve Next.js-only imports so server modules can be exercised in plain Node:
// "@/..." maps to src/ and "server-only" becomes a no-op stub.
const srcRoot = path.join(__dirname, "..", "src");
const originalResolveFilename = Module._resolveFilename;
Module._resolveFilename = function resolveWithAliases(request, ...rest) {
  if (request === "server-only") {
    return path.join(__dirname, "stubs", "server-only.cjs");
  }
  if (request.startsWith("@/")) {
    return originalResolveFilename.call(
      this,
      path.join(srcRoot, request.slice(2)),
      ...rest,
    );
  }
  return originalResolveFilename.call(this, request, ...rest);
};

const {
  createAdminPasswordHash,
  createAdminSessionToken,
  verifyAdminCredentials,
  verifyAdminPassword,
  verifyAdminSessionToken,
} = require("../src/lib/admin-auth/session.ts");
const {
  DEFAULT_MAINTENANCE,
  addDuration,
  isMaintenanceActive,
  parseMaintenanceForm,
  splitHeadline,
} = require("../src/lib/maintenance-core.ts");
const {
  contactRequestSchema,
  isContactSpamTrapTriggered,
} = require("../src/lib/contact-support.ts");

function runAdminAuthChecks() {
  const hash = createAdminPasswordHash("launch-ready-password");
  assert.equal(verifyAdminPassword("launch-ready-password", hash), true);
  assert.equal(verifyAdminPassword("wrong-password", hash), false);

  const token = createAdminSessionToken({
    username: "admin",
    sessionSecret: "super-secret",
    now: 1_700_000_000_000,
    ttlSeconds: 60,
  });
  assert.equal(
    verifyAdminSessionToken({
      token,
      sessionSecret: "super-secret",
      expectedUsername: "admin",
      now: 1_700_000_030_000,
    }),
    true,
  );
  assert.equal(
    verifyAdminSessionToken({
      token,
      sessionSecret: "super-secret",
      expectedUsername: "admin",
      now: 1_700_000_120_000,
    }),
    false,
  );

  const passwordHash = createAdminPasswordHash("correct-password");
  assert.equal(
    verifyAdminCredentials({
      inputUsername: "hayame-admin",
      inputPassword: "correct-password",
      configuredUsername: "hayame-admin",
      configuredPasswordHash: passwordHash,
    }),
    true,
  );
  assert.equal(
    verifyAdminCredentials({
      inputUsername: "hayame-admin",
      inputPassword: "incorrect-password",
      configuredUsername: "hayame-admin",
      configuredPasswordHash: passwordHash,
    }),
    false,
  );
}

function runContactChecks() {
  const parsed = contactRequestSchema.parse({
    name: "Ama Owusu",
    email: "ama@example.com",
    phone: "+233555123456",
    message: "I need help with a booking date change.",
    company: "",
  });

  assert.equal(parsed.name, "Ama Owusu");
  assert.equal(parsed.email, "ama@example.com");
  assert.throws(() =>
    contactRequestSchema.parse({
      name: "Ama",
      email: "ama@example.com",
      message: "Too short",
      company: "",
    }),
  );
  assert.equal(isContactSpamTrapTriggered({ company: "Spam Co" }), true);
  assert.equal(isContactSpamTrapTriggered({ company: "" }), false);
}

function runEmailChecks() {
  process.env.NEXT_PUBLIC_SITE_URL = "https://hayame.test";
  process.env.ADMIN_NOTIFICATIONS_EMAIL =
    "office@hayame.test, ops@hayame.test,office@hayame.test";
  const email = require("../src/lib/email.ts");

  assert.deepEqual(email.getAdminNotificationRecipients(), [
    "office@hayame.test",
    "ops@hayame.test",
  ]);

  const approved = email.buildHostApplicationDecisionEmail({
    approved: true,
    hostName: "Ama <script>alert(1)</script>",
  });
  assert.ok(approved.subject.length > 0);
  assert.ok(!approved.html.includes("<script>"), "html must escape input");
  assert.ok(approved.html.includes("https://hayame.test/logo-white.png"));
  assert.ok(
    approved.html.includes("Get the Hayame app"),
    "footer must offer app download links",
  );
  assert.ok(approved.html.includes("apps.apple.com"));
  assert.ok(approved.html.includes("/downloads/hayame-android.apk"));
  assert.ok(approved.text.includes("official notification from Hayame"));

  const adminNotice = email.buildAdminHostApplicationEmail({
    applicationId: "app-1",
    applicantName: "Kwame",
    applicantEmail: "kwame@example.com",
    idNumber: "GHA-123456789-0",
    note: "Two SUVs <b>available</b>",
    hasIdDocuments: true,
  });
  assert.match(adminNotice.subject, /host verification request: Kwame/);
  assert.ok(adminNotice.html.includes("Internal notification"));
  assert.ok(
    adminNotice.html.includes("https://hayame.test/admin?status=pending"),
  );
  assert.ok(
    !adminNotice.html.includes("GHA-123456789-0"),
    "admin notice must mask the full ID number",
  );
  assert.ok(adminNotice.html.includes("89-0"));
  assert.ok(!adminNotice.html.includes("<b>"), "user note must be escaped");
  assert.ok(adminNotice.text.includes("[INTERNAL NOTIFICATION]"));

  const listingNotice = email.buildAdminListingSubmittedEmail({
    carId: "car-1",
    carTitle: "Toyota RAV4 2021",
    hostName: "Ama",
    dailyPrice: 450,
    resubmitted: true,
  });
  assert.match(listingNotice.subject, /Listing updated pending review/);
  assert.ok(
    listingNotice.html.includes("https://hayame.test/admin/cars/car-1/preview"),
  );

  const feeNotice = email.buildAdminPlatformSettingsChangedEmail({
    changedBy: "admin",
    previousFeePercent: 10,
    nextFeePercent: 12.5,
  });
  assert.match(feeNotice.subject, /Platform fee changed to 12.5%/);
  assert.ok(feeNotice.text.includes("Previous fee: 10%"));
}

function runMaintenanceChecks() {
  const now = new Date("2026-10-15T12:00:00Z");
  const form = (fields) => ({ get: (name) => fields[name] ?? null });
  const base = { headline: "Back soon.", message: "Hi", theme: "navy", background: "accra" };

  // Active only while enabled, and for timed mode only until the end time.
  assert.equal(isMaintenanceActive(null, now.getTime()), false);
  assert.equal(isMaintenanceActive({ ...DEFAULT_MAINTENANCE, enabled: true }, now.getTime()), true);
  const timed = { ...DEFAULT_MAINTENANCE, enabled: true, mode: "timed", endsAt: "2026-10-16T00:00:00Z" };
  assert.equal(isMaintenanceActive(timed, now.getTime()), true);
  assert.equal(isMaintenanceActive(timed, Date.parse("2026-10-16T00:00:01Z")), false);
  assert.equal(isMaintenanceActive({ ...timed, endsAt: null }, now.getTime()), false);

  // Durations, including calendar months.
  assert.equal(addDuration(now, 3, "days").toISOString(), "2026-10-18T12:00:00.000Z");
  assert.equal(addDuration(now, 2, "weeks").toISOString(), "2026-10-29T12:00:00.000Z");
  assert.equal(addDuration(now, 1, "months").toISOString(), "2026-11-15T12:00:00.000Z");

  // Form parsing.
  const dur = parseMaintenanceForm(
    form({ ...base, intent: "publish", duration_kind: "duration", duration_value: "2", duration_unit: "days", show_countdown: "on" }),
    DEFAULT_MAINTENANCE,
    now,
  );
  assert.equal(dur.ok, true);
  assert.equal(dur.settings.enabled, true);
  assert.equal(dur.settings.endsAt, "2026-10-17T12:00:00.000Z");
  assert.equal(dur.settings.showCountdown, true);

  const indefinite = parseMaintenanceForm(form({ ...base, intent: "publish", duration_kind: "indefinite", show_countdown: "on" }), DEFAULT_MAINTENANCE, now);
  assert.equal(indefinite.settings.mode, "indefinite");
  assert.equal(indefinite.settings.endsAt, null);
  assert.equal(indefinite.settings.showCountdown, false);

  const past = parseMaintenanceForm(form({ ...base, duration_kind: "date", end_date: "2026-10-14T09:00" }), DEFAULT_MAINTENANCE, now);
  assert.equal(past.ok, false);
  const dated = parseMaintenanceForm(form({ ...base, duration_kind: "date", end_date: "2026-12-01T09:30" }), DEFAULT_MAINTENANCE, now);
  assert.equal(dated.settings.endsAt, "2026-12-01T09:30:00.000Z");
  assert.equal(dated.settings.enabled, false);

  assert.equal(parseMaintenanceForm(form({ ...base, headline: "" }), DEFAULT_MAINTENANCE, now).ok, false);
  assert.equal(parseMaintenanceForm(form({ ...base, background: "custom", background_url: "http://x.com/a.jpg" }), DEFAULT_MAINTENANCE, now).ok, false);
  assert.equal(parseMaintenanceForm(form({ ...base, contact_email: "nope" }), DEFAULT_MAINTENANCE, now).ok, false);

  // Turning off never fails, even with an empty form.
  const off = parseMaintenanceForm(form({ intent: "disable" }), { ...DEFAULT_MAINTENANCE, enabled: true }, now);
  assert.equal(off.ok, true);
  assert.equal(off.settings.enabled, false);

  assert.deepEqual(splitHeadline("We're *back* soon."), [
    { text: "We're ", accent: false },
    { text: "back", accent: true },
    { text: " soon.", accent: false },
  ]);
}

runAdminAuthChecks();
runContactChecks();
runEmailChecks();
runMaintenanceChecks();
console.log("Launch readiness checks passed.");
