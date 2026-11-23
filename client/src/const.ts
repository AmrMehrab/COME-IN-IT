import { OAUTH_STATE_COOKIE, encodeOAuthState } from "@shared/const";

export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

const AUTH_RETURN_TO_KEY = "comein.auth.returnTo";
const ALLOWED_AUTH_RETURN_PATHS = new Set(["/onboarding"]);
type LoginOptions = { returnTo?: string };
// Kept structural so existing React onClick={startLogin} call sites remain valid.
type ClickEventArgument = { preventDefault: () => void };

/** Consume only an allow-listed same-origin path from the OAuth-starting tab. */
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

// Start Manus OAuth only from an event handler or effect. The function accepts
// the React click event for legacy direct onClick references, but ignores it.
export const startLogin = (argument?: LoginOptions | ClickEventArgument) => {
  const options = argument && "returnTo" in argument ? argument : undefined;
  const oauthPortalUrl = import.meta.env.VITE_OAUTH_PORTAL_URL;
  const appId = import.meta.env.VITE_APP_ID;
  const redirectUri = `${window.location.origin}/api/oauth/callback`;

  if (!oauthPortalUrl || !appId) {
    throw new Error("OAuth is not configured for this environment.");
  }

  try {
    if (options?.returnTo && ALLOWED_AUTH_RETURN_PATHS.has(options.returnTo)) {
      window.sessionStorage.setItem(AUTH_RETURN_TO_KEY, options.returnTo);
    } else {
      window.sessionStorage.removeItem(AUTH_RETURN_TO_KEY);
    }
  } catch {
    // OAuth can still complete; the app will land on the public welcome page.
  }

  const nonce = crypto.randomUUID();
  document.cookie = `${OAUTH_STATE_COOKIE}=${nonce}; Path=/; Max-Age=600; SameSite=None; Secure`;
  const state = encodeOAuthState({ redirectUri, nonce });

  const url = new URL(`${oauthPortalUrl}/app-auth`);
  url.searchParams.set("appId", appId);
  url.searchParams.set("redirectUri", redirectUri);
  url.searchParams.set("state", state);
  url.searchParams.set("type", "signIn");

  window.location.href = url.toString();
};
