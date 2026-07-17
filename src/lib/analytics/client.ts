"use client";

import {
  CONSENT_POLICY_VERSION,
  SESSION_STORAGE_KEY,
  hasAnalyticsConsent,
  readConsent,
} from "./consent";
import type { AnalyticsEventName, AnalyticsProps } from "./events";

/**
 * Browser analytics client.
 *
 * Behaviour that matters:
 *   * Nothing is written to the device and nothing is sent until the visitor
 *     has granted analytics consent. Events fired before that are held in
 *     memory only, and flushed if consent is granted or dropped if it is not.
 *     This is what makes the banner a real gate rather than a decoration.
 *   * Events are batched and flushed on a timer, on page hide, and on
 *     navigation, so a booking never waits on an analytics request.
 *   * Every failure is swallowed. Analytics must never break the product.
 */

const FLUSH_INTERVAL_MS = 5_000;
const MAX_QUEUE = 20;
/** Events fired before a consent decision. Bounded so an undecided visitor
 *  cannot grow this without limit. */
const MAX_PENDING = 30;

type QueuedEvent = {
  name: AnalyticsEventName;
  props: AnalyticsProps;
  path: string | null;
  referrer: string | null;
};

let queue: QueuedEvent[] = [];
let pending: QueuedEvent[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;
let listenersBound = false;

function getSessionKey(): string | null {
  if (typeof window === "undefined") return null;
  if (!hasAnalyticsConsent()) return null;
  try {
    const existing = window.localStorage.getItem(SESSION_STORAGE_KEY);
    if (existing) return existing;
    const generated = `sess_${Math.random().toString(36).slice(2)}_${Date.now()}`;
    window.localStorage.setItem(SESSION_STORAGE_KEY, generated);
    return generated;
  } catch {
    return null;
  }
}

function buildPayload(events: QueuedEvent[]) {
  return JSON.stringify({
    events,
    sessionKey: getSessionKey(),
    platform: "web",
    appVersion: CONSENT_POLICY_VERSION,
  });
}

function send(events: QueuedEvent[], useBeacon: boolean) {
  if (events.length === 0) return;
  const payload = buildPayload(events);
  try {
    // sendBeacon survives page unload, which is exactly when we most need the
    // last events (an abandoned booking is a page the user left).
    if (useBeacon && typeof navigator !== "undefined" && navigator.sendBeacon) {
      const blob = new Blob([payload], { type: "application/json" });
      if (navigator.sendBeacon("/api/analytics", blob)) return;
    }
    void fetch("/api/analytics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: payload,
      keepalive: true,
    }).catch(() => {});
  } catch {
    // Ignore: a dropped event is never worth an error.
  }
}

function flush(useBeacon = false) {
  if (flushTimer) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }
  if (queue.length === 0) return;
  const batch = queue;
  queue = [];
  send(batch, useBeacon);
}

function scheduleFlush() {
  if (flushTimer) return;
  flushTimer = setTimeout(() => flush(false), FLUSH_INTERVAL_MS);
}

function bindLifecycleListeners() {
  if (listenersBound || typeof window === "undefined") return;
  listenersBound = true;
  // `visibilitychange` is the reliable signal on mobile Safari; `pagehide`
  // covers bfcache navigation. `beforeunload` is not fired reliably on iOS.
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") flush(true);
  });
  window.addEventListener("pagehide", () => flush(true));
}

/**
 * Record an event. Safe to call anywhere, including during render paths and on
 * the server (where it is a no-op).
 */
export function track(name: AnalyticsEventName, props: AnalyticsProps = {}) {
  if (typeof window === "undefined") return;

  const event: QueuedEvent = {
    name,
    props,
    path: window.location?.pathname ?? null,
    referrer: document.referrer || null,
  };

  const consent = readConsent();
  if (!consent) {
    // Undecided: hold in memory only. Nothing touches the device or the wire.
    if (pending.length < MAX_PENDING) pending.push(event);
    return;
  }
  if (consent.analytics !== "granted") return;

  bindLifecycleListeners();
  queue.push(event);
  if (queue.length >= MAX_QUEUE) flush(false);
  else scheduleFlush();
}

/**
 * Called by the consent banner once the visitor decides. On grant, everything
 * they did while the banner was up is flushed; on deny, it is discarded.
 */
export function resolvePendingEvents(granted: boolean) {
  const held = pending;
  pending = [];
  if (!granted || held.length === 0) return;
  bindLifecycleListeners();
  queue.push(...held.slice(-MAX_QUEUE));
  flush(false);
}

/** Exposed for tests and for the "flush now" case in the banner. */
export function flushNow() {
  flush(true);
}
