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
  readAdminSessionToken,
  verifyAdminSessionToken,
} = require("../src/lib/admin-auth/session.ts");
const { renderMaintenanceHtml } = require("../src/lib/maintenance-html.ts");
const {
  DEFAULT_MAINTENANCE,
  addDuration,
  isMaintenanceActive,
  parseMaintenanceForm,
  splitHeadline,
} = require("../src/lib/maintenance-core.ts");
const {
  ADMIN_ROLES,
  PERMISSIONS,
  can,
  permissionsFor,
} = require("../src/lib/admin-permissions.ts");
const { describeAction } = require("../src/lib/admin-actions-catalog.ts");
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

function runAdminEmailChecks() {
  const email = require("../src/lib/email.ts");
  const activity = email.buildAdminActivityEmail({
    severity: "critical",
    actionLabel: "Refunded a booking",
    summary: "Ama <script>x</script> refunded GH₵120 on booking 3F2A9C1B",
    actorName: "Ama",
    actorEmail: "ama@hayamegh.com",
    actorRole: "Finance",
    ip: "41.66.0.1",
    targetType: "booking",
    targetId: "3f2a9c1b-0000-0000-0000-000000000000",
    details: { reason: "Duplicate charge", amount: 120, nested: { skipped: true } },
  });
  assert.ok(activity.subject.includes("CRITICAL"));
  assert.ok(!activity.html.includes("<script>"), "admin activity html must escape input");
  assert.ok(activity.html.includes("ama@hayamegh.com") && activity.html.includes("41.66.0.1"));
  assert.ok(activity.html.includes("Duplicate charge") && !activity.html.includes("skipped"));
  assert.ok(activity.text.includes("/admin/audit"));

  const welcome = email.buildAdminWelcomeEmail({
    name: "Kofi",
    email: "kofi@hayamegh.com",
    roleLabel: "Super admin",
    roleDescription: "Everything.",
    createdBy: "Root",
  });
  assert.ok(welcome.html.includes("kofi@hayamegh.com"));
  assert.ok(!/password:\s*\S+/i.test(welcome.text), "welcome email must never contain a password");
}

function runMaintenanceHtmlChecks() {
  const base = { ...DEFAULT_MAINTENANCE, enabled: true };
  const plain = renderMaintenanceHtml(base);
  assert.ok(plain.startsWith("<!doctype html>"));
  assert.ok(plain.includes("Under construction") && plain.includes("better."));
  assert.ok(!plain.includes('id="timer"'), "no countdown for an open-ended maintenance");
  assert.ok(!plain.includes("Join Hayame hosts") && !plain.includes("data-site-chrome"), "page is standalone");

  // Admin-typed text is escaped everywhere.
  const evil = renderMaintenanceHtml({
    ...base,
    badge: '<img src=x onerror=alert(1)>',
    headline: 'Hi <script>alert(1)</script> *there*',
    message: '"><svg onload=alert(1)>',
    contactEmail: 'a@b.co"><script>x</script>',
    background: 'https://x.com/a.jpg"onerror="alert(1)',
  });
  assert.ok(!/<script>alert|<img src=x|<svg onload|onerror="alert/i.test(evil.replace(/<script>[\s\S]*?<\/script>$/m, "")), "html must escape input");
  assert.ok(!evil.includes("a@b.co"), "an invalid contact email is dropped");

  // Timer only when timed + shown, with a machine-readable end.
  const timed = renderMaintenanceHtml({ ...base, mode: "timed", endsAt: "2026-12-01T09:30:00.000Z", showCountdown: true });
  assert.ok(timed.includes('id="timer"') && timed.includes("2026-12-01T09:30:00.000Z"));
  const hidden = renderMaintenanceHtml({ ...base, mode: "timed", endsAt: "2026-12-01T09:30:00.000Z", showCountdown: false });
  assert.ok(!hidden.includes('id="timer"'));
  assert.ok(renderMaintenanceHtml({ ...base, background: "none" }).indexOf('class="photo"') === -1);
  assert.ok(renderMaintenanceHtml(base).includes("/maintenance/accra-skyline.jpg"));
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

function runAdminRoleChecks() {
  // Super admin can do everything; nobody else can manage the team or the site switches.
  assert.equal(permissionsFor("super_admin").length, PERMISSIONS.length);
  for (const role of ADMIN_ROLES.filter((r) => r !== "super_admin")) {
    assert.equal(can(role, "team.manage"), false, `${role} must not manage the team`);
    assert.equal(can(role, "maintenance.manage"), false, `${role} must not toggle maintenance`);
    assert.equal(can(role, "platform.fee"), false, `${role} must not change the fee`);
  }
  assert.equal(can("finance", "bookings.refund"), true);
  assert.equal(can("admin", "bookings.refund"), false);
  assert.equal(can("support", "vehicles.delete"), false);
  assert.equal(can("support", "messages.reply"), true);
  assert.equal(can(null, "overview.view"), false);

  // Team sessions carry the admin id; tampering or expiry is rejected.
  const token = createAdminSessionToken({
    username: "ama@hayamegh.com",
    adminId: "11111111-1111-1111-1111-111111111111",
    sessionSecret: "s3cret",
    now: 1_700_000_000_000,
    ttlSeconds: 60,
  });
  assert.deepEqual(readAdminSessionToken({ token, sessionSecret: "s3cret", now: 1_700_000_010_000 }), {
    username: "ama@hayamegh.com",
    adminId: "11111111-1111-1111-1111-111111111111",
  });
  assert.equal(readAdminSessionToken({ token, sessionSecret: "wrong", now: 1_700_000_010_000 }), null);
  assert.equal(readAdminSessionToken({ token, sessionSecret: "s3cret", now: 1_700_000_100_000 }), null);
  const rootToken = createAdminSessionToken({ username: "admin", sessionSecret: "s3cret", now: 1_700_000_000_000 });
  assert.equal(readAdminSessionToken({ token: rootToken, sessionSecret: "s3cret", now: 1_700_000_010_000 }).adminId, null);

  // Dangerous actions must always email the team.
  for (const action of ["booking_refunded", "listing_deleted", "platform_settings_updated", "admin.created", "admin.role_changed", "maintenance.enabled"]) {
    assert.equal(describeAction(action).severity, "critical", `${action} should be critical`);
  }
  assert.equal(describeAction("admin.login").severity, "info");
  assert.equal(describeAction("something_new").severity, "info");
}

runAdminAuthChecks();
runAdminRoleChecks();
runContactChecks();
runEmailChecks();
runAdminEmailChecks();
runMaintenanceHtmlChecks();
runMaintenanceChecks();
console.log("Launch readiness checks passed.");
