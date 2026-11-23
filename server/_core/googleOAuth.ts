import { randomBytes } from "node:crypto";
import type { Express, Request, Response } from "express";
import { parse as parseCookieHeader } from "cookie";
import { createRemoteJWKSet, jwtVerify } from "jose";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

const GOOGLE_STATE_COOKIE = "__Host-google_oauth_state";
const GOOGLE_ISSUERS = ["https://accounts.google.com", "accounts.google.com"];
const GOOGLE_JWKS = createRemoteJWKSet(new URL("https://www.googleapis.com/oauth2/v3/certs"));

function config() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;
  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error("Google OAuth is not configured. Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET and GOOGLE_REDIRECT_URI.");
  }
  return { clientId, clientSecret, redirectUri };
}

function clearStateCookie(res: Response) {
  res.clearCookie(GOOGLE_STATE_COOKIE, { path: "/", secure: true, sameSite: "none" });
}

function fail(res: Response, code: string) {
  res.redirect(302, `/?authError=${encodeURIComponent(code)}`);
}

export function registerGoogleOAuthRoutes(app: Express) {
  app.get("/api/oauth/google/start", (_req: Request, res: Response) => {
    try {
      const { clientId, redirectUri } = config();
      const state = randomBytes(32).toString("base64url");
      res.cookie(GOOGLE_STATE_COOKIE, state, {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        path: "/",
        maxAge: 10 * 60 * 1000,
      });
      const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
      url.searchParams.set("client_id", clientId);
      url.searchParams.set("redirect_uri", redirectUri);
      url.searchParams.set("response_type", "code");
      url.searchParams.set("scope", "openid email profile");
      url.searchParams.set("state", state);
      url.searchParams.set("prompt", "select_account");
      res.redirect(302, url.toString());
    } catch (error) {
      console.error("[Google OAuth] Start failed", error);
      fail(res, "google_not_configured");
    }
  });

  app.get("/api/oauth/google/callback", async (req: Request, res: Response) => {
    const { code, state, error } = req.query;
    const expectedState = parseCookieHeader(req.headers.cookie ?? "")[GOOGLE_STATE_COOKIE];
    clearStateCookie(res);

    if (error) return fail(res, error === "access_denied" ? "cancelled" : "google_failed");
    if (typeof code !== "string" || typeof state !== "string" || !expectedState || state !== expectedState) {
      return fail(res, "invalid_google_state");
    }

    try {
      const { clientId, clientSecret, redirectUri } = config();
      const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
          grant_type: "authorization_code",
        }),
      });
      if (!tokenResponse.ok) throw new Error(`Google token exchange failed: ${tokenResponse.status}`);
      const tokens = await tokenResponse.json() as { id_token?: string };
      if (!tokens.id_token) throw new Error("Google did not return an ID token");

      const { payload } = await jwtVerify(tokens.id_token, GOOGLE_JWKS, {
        issuer: GOOGLE_ISSUERS,
        audience: clientId,
      });
      if (typeof payload.sub !== "string" || payload.email_verified !== true) {
        throw new Error("Google identity is missing a verified email or subject");
      }

      const googleOpenId = `google:${payload.sub}`;
      const name = typeof payload.name === "string" ? payload.name : null;
      const email = typeof payload.email === "string" ? payload.email.trim().toLowerCase() : null;

      // Preserve an existing COME IN IT account (and its PERSON/KYC/business
      // relations) when Google proves the same email. Ambiguous matches fail
      // closed; no account is merged by an unverified email.
      const existingByEmail = email ? await db.getUsersByEmail(email) : [];
      if (existingByEmail.length > 1) {
        return fail(res, "account_link_required");
      }
      const existingUser = existingByEmail[0];
      const openId = existingUser?.openId ?? googleOpenId;

      await db.upsertUser({
        openId,
        ...(existingUser ? {} : { name }),
        email,
        loginMethod: "google",
        lastSignedIn: new Date(),
      });
      const user = await db.getUserByOpenId(openId);
      if (!user) throw new Error("Google user could not be persisted");

      const sessionToken = await sdk.createSessionToken(openId, {
        name: user.name ?? name ?? email ?? "Google user",
        appId: "come-in-it",
        expiresInMs: ONE_YEAR_MS,
      });
      res.cookie(COOKIE_NAME, sessionToken, {
        ...getSessionCookieOptions(req),
        maxAge: ONE_YEAR_MS,
      });
      return res.redirect(302, "/onboarding");
    } catch (err) {
      console.error("[Google OAuth] Callback failed", err);
      return fail(res, "google_failed");
    }
  });
}
