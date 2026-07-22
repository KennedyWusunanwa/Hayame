/**
 * Password policy, shared by the signup UI (live strength meter) and the API
 * (authoritative check). Keep them driven by this one module so the meter can
 * never say "Strong" for something the server will reject.
 *
 * No "server-only" import: this runs in the browser too.
 */

export type PasswordRule = {
  id: string;
  label: string;
  test: (value: string) => boolean;
};

/** Every rule here is mandatory. */
export const PASSWORD_RULES: PasswordRule[] = [
  {
    id: "length",
    label: "At least 8 characters",
    test: (value) => value.length >= 8,
  },
  {
    id: "letter",
    label: "One letter",
    test: (value) => /[A-Za-z]/.test(value),
  },
  {
    id: "number",
    label: "One number",
    test: (value) => /\d/.test(value),
  },
  {
    id: "symbol",
    label: "One symbol (!?@#$…)",
    test: (value) => /[^A-Za-z0-9]/.test(value),
  },
];

export type PasswordStrength = {
  /** 0–4. Rules met, plus a bonus for length, capped at 4. */
  score: number;
  label: "Too weak" | "Weak" | "Fair" | "Good" | "Strong";
  /** Rule ids the password currently satisfies. */
  passed: string[];
  /** True only when every mandatory rule passes. */
  meetsPolicy: boolean;
};

export function gradePassword(value: string): PasswordStrength {
  const passed = PASSWORD_RULES.filter((rule) => rule.test(value)).map(
    (rule) => rule.id,
  );
  const meetsPolicy = passed.length === PASSWORD_RULES.length;

  let score = passed.length;
  // Length beats character-class gymnastics; reward it, but only once the
  // basics are in place so the meter can't read "Strong" for "aaaaaaaaaaaa".
  if (meetsPolicy && value.length >= 12) score += 1;
  if (!meetsPolicy) score = Math.min(score, 3);
  score = Math.max(0, Math.min(4, value ? score : 0));

  const labels: PasswordStrength["label"][] = [
    "Too weak",
    "Weak",
    "Fair",
    "Good",
    "Strong",
  ];

  return { score, label: labels[score], passed, meetsPolicy };
}

/**
 * Authoritative validation. Returns a user-facing message, or null when the
 * password is acceptable.
 */
export function validatePassword(value: string): string | null {
  const failed = PASSWORD_RULES.filter((rule) => !rule.test(value));
  if (!failed.length) return null;
  if (failed.length === 1) {
    return `Your password needs ${failed[0].label.toLowerCase()}.`;
  }
  const labels = failed.map((rule) => rule.label.toLowerCase());
  const last = labels.pop();
  return `Your password needs ${labels.join(", ")} and ${last}.`;
}
