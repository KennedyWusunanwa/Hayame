/**
 * Consent state for first-party analytics storage.
 *
 * Scope note: this gate covers ANALYTICS storage only. Login/session cookies
 * are "strictly necessary" — you cannot run a marketplace with accounts and
 * payments without them, and the user asked for them by signing in — so they
 * are never gated and never presented as a choice. Pretending they are optional
 * would be its own dark pattern.
 *
 * There is no "marketing" or "advertising" category here on purpose: Hayame
 * does not run ad tracking. If that ever changes, add the category here rather
 * than quietly widening what `analytics` means — the consent a user gave has to
 * still mean what it meant when they gave it.
 */

export const CONSENT_STORAGE_KEY = "hayame_consent";
export const SESSION_STORAGE_KEY = "hayame_session_key";

/**
 * Bump when the privacy policy changes materially enough that prior consent no
 * longer covers what we do. Bumping re-prompts everyone — so bump deliberately.
 */
export const CONSENT_POLICY_VERSION = "2026-07-17";

export type ConsentDecision = "granted" | "denied";

export type ConsentState = {
  analytics: ConsentDecision;
  policyVersion: string;
  decidedAt: string;
};

export function readConsent(): ConsentState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(CONSENT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<ConsentState>;
    if (parsed.analytics !== "granted" && parsed.analytics !== "denied") {
      return null;
    }
    // A stale decision predates the current policy, so it cannot be informed
    // consent for what we do now. Treat it as undecided and ask again.
    if (parsed.policyVersion !== CONSENT_POLICY_VERSION) return null;
    return {
      analytics: parsed.analytics,
      policyVersion: parsed.policyVersion,
      decidedAt: parsed.decidedAt ?? new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

export function writeConsent(analytics: ConsentDecision): ConsentState {
  const state: ConsentState = {
    analytics,
    policyVersion: CONSENT_POLICY_VERSION,
    decidedAt: new Date().toISOString(),
  };
  try {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Private browsing or storage disabled. The in-memory state still applies
    // for this page, and we simply ask again next visit.
  }
  if (analytics === "denied") clearAnalyticsStorage();
  return state;
}

/**
 * Withdrawing consent has to actually remove what we stored, otherwise the
 * withdrawal is cosmetic. Consent must be as easy to withdraw as to give.
 */
export function clearAnalyticsStorage() {
  try {
    window.localStorage.removeItem(SESSION_STORAGE_KEY);
    for (let i = window.sessionStorage.length - 1; i >= 0; i -= 1) {
      const key = window.sessionStorage.key(i);
      if (key && key.startsWith("car-viewed:")) {
        window.sessionStorage.removeItem(key);
      }
    }
  } catch {
    // Nothing to clear if storage is unavailable.
  }
}

export function hasAnalyticsConsent(): boolean {
  return readConsent()?.analytics === "granted";
}
