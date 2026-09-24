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

runAdminAuthChecks();
runContactChecks();
runEmailChecks();
console.log("Launch readiness checks passed.");
