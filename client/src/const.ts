const AUTH_RETURN_TO_KEY = "comein.auth.returnTo";
const ALLOWED_AUTH_RETURN_PATHS = new Set(["/onboarding"]);

type LoginOptions = { returnTo?: string };

/** Consume only an allow-listed same-origin path from the tab that began login. */
export const consumeLoginReturnTo = (): string | null => {
  if (typeof window === "undefined") return null;
  try {
    const path = window.sessionStorage.getItem(AUTH_RETURN_TO_KEY);
    window.sessionStorage.removeItem(AUTH_RETURN_TO_KEY);
    return path && ALLOWED_AUTH_RETURN_PATHS.has(path) ? path : null;
  } catch {
    return null;
  }
};

/**
 * The only interactive sign-in entry point for COME IN IT.
 * Google OAuth is started by the server so client secrets never reach the browser.
 */
export const startGoogleLogin = (options?: LoginOptions) => {
  try {
    if (options?.returnTo && ALLOWED_AUTH_RETURN_PATHS.has(options.returnTo)) {
      window.sessionStorage.setItem(AUTH_RETURN_TO_KEY, options.returnTo);
    } else {
      window.sessionStorage.removeItem(AUTH_RETURN_TO_KEY);
    }
  } catch {
    // Authentication can complete even when sessionStorage is unavailable.
  }

  window.location.assign("/api/oauth/google/start");
};

/** Backward-compatible name for existing buttons; it now always starts Google OAuth. */
export const startLogin = startGoogleLogin;
