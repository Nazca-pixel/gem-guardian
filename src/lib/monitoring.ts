// Lightweight Sentry frontend init.
// Set VITE_SENTRY_DSN in your build env (publishable, browser-safe DSN only).
// If absent, monitoring is a no-op and the app continues to start normally.
import * as Sentry from "@sentry/browser";

let initialized = false;

export function initMonitoring() {
  if (initialized) return;
  const dsn = import.meta.env.VITE_SENTRY_DSN as string | undefined;
  if (!dsn) return; // safe fallback — no DSN, no monitoring
  try {
    Sentry.init({
      dsn,
      environment: import.meta.env.MODE,
      tracesSampleRate: 0,
      replaysSessionSampleRate: 0,
      replaysOnErrorSampleRate: 0,
      // Filter obvious noise (browser extensions, harmless errors)
      ignoreErrors: [
        "ResizeObserver loop limit exceeded",
        "ResizeObserver loop completed with undelivered notifications.",
        "Non-Error promise rejection captured",
        /extension\//i,
        /^chrome-extension:\/\//i,
        /^moz-extension:\/\//i,
      ],
      denyUrls: [/extensions\//i, /^chrome-extension:\/\//i, /^moz-extension:\/\//i],
    });
    initialized = true;
  } catch {
    // never let monitoring break the app
  }
}

export function captureHandled(err: unknown, context?: Record<string, unknown>) {
  if (!initialized) return;
  try {
    Sentry.captureException(err, context ? { extra: context } : undefined);
  } catch {
    /* noop */
  }
}
