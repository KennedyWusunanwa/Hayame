const assert = require("node:assert/strict");
const { register } = require("ts-node");

register({
  transpileOnly: true,
  compilerOptions: {
    module: "commonjs",
    moduleResolution: "node",
  },
});

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

runAdminAuthChecks();
runContactChecks();
console.log("Launch readiness checks passed.");
