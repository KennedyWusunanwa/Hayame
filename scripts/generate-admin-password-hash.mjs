import { randomBytes, scryptSync } from "node:crypto";

const password = process.argv[2]?.trim();

if (!password) {
  console.error("Usage: npm run admin:hash -- <password>");
  process.exit(1);
}

const salt = randomBytes(16);
const hash = scryptSync(password, salt, 64);
process.stdout.write(
  `scrypt:${salt.toString("hex")}:${Buffer.from(hash).toString("hex")}\n`,
);
