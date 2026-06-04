// Minimal product analytics. Stable event names, no sensitive financial content.
// Currently logs to console + dispatches a window event so any future provider
// (PostHog, Plausible, GA) can pick it up without changing call sites.
//
// Events:
//   app_open, signup_completed, login_completed,
//   first_transaction_created, first_challenge_completed,
//   paywall_viewed, upgrade_cta_clicked

export type AnalyticsEvent =
  | "app_open"
  | "signup_completed"
  | "login_completed"
  | "first_transaction_created"
  | "first_challenge_completed"
  | "paywall_viewed"
  | "upgrade_cta_clicked";

const FIRED_ONCE_KEY = "wm_analytics_once";

function getFiredOnce(): Record<string, boolean> {
  try {
    return JSON.parse(localStorage.getItem(FIRED_ONCE_KEY) || "{}");
  } catch {
    return {};
  }
}

function markFiredOnce(event: string) {
  try {
    const m = getFiredOnce();
    m[event] = true;
    localStorage.setItem(FIRED_ONCE_KEY, JSON.stringify(m));
  } catch {
    /* noop */
  }
}

export function track(event: AnalyticsEvent, props?: Record<string, string | number | boolean>) {
  try {
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.debug("[analytics]", event, props || {});
    }
    window.dispatchEvent(
      new CustomEvent("wm:analytics", { detail: { event, props: props || {}, ts: Date.now() } }),
    );
  } catch {
    /* noop */
  }
}

/** Fires only the first time per browser (for first_* activation events). */
export function trackOnce(event: AnalyticsEvent, props?: Record<string, string | number | boolean>) {
  const fired = getFiredOnce();
  if (fired[event]) return;
  markFiredOnce(event);
  track(event, props);
}
