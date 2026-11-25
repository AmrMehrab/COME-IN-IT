import { COOKIE_NAME, ONE_YEAR_MS, OAUTH_STATE_COOKIE, decodeOAuthState } from "@shared/const";
import { parse as parseCookieHeader } from "cookie";
import type { Express, Request, Response } from "express";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";

function getQueryParam(req: Request, key: string): string | undefined {
  const value = req.query[key];
  return typeof value === "string" ? value : undefined;
}

export function registerOAuthRoutes(app: Express) {
  // --- Direct Google OAuth (no Manus) ---
  app.get("/api/oauth/google", async (req: Request, res: Response) => {
    const { ENV } = await import("./env");
    const origin = `${req.protocol}://${req.get("host")}`;
    const redirectUri = `${origin}/api/oauth/google/callback`;
    const state = getQueryParam(req, "state") ?? "";
    const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    url.searchParams.set("client_id", ENV.googleClientId);
    url.searchParams.set("redirect_uri", redirectUri);
    url.searchParams.set("response_type", "code");
    url.searchParams.set("scope", "openid email profile");
    url.searchParams.set("state", state);
    url.searchParams.set("access_type", "offline");
    url.searchParams.set("prompt", "select_account");
    res.redirect(302, url.toString());
  });
  app.get("/api/oauth/google/callback", async (req: Request, res: Response) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");
    if (!code || !state) { res.status(400).json({ error: "code and state are required" }); return; }
    const { ENV } = await import("./env");
    const origin = `${req.protocol}://${req.get("host")}`;
    const redirectUri = `${origin}/api/oauth/google/callback`;
    try {
      const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ code, client_id: ENV.googleClientId, client_secret: ENV.googleClientSecret, redirect_uri: redirectUri, grant_type: "authorization_code" }),
      });
      const tokens: any = await tokenRes.json();
      if (!tokens.access_token) { res.status(400).json({ error: "google token exchange failed", details: tokens }); return; }
      const meRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", { headers: { Authorization: `Bearer ${tokens.access_token}` } });
      const g: any = await meRes.json();
      const openId = `google:${g.sub}`;
      await db.upsertUser({ openId, name: g.name ?? null, email: g.email ?? null, loginMethod: "google", lastSignedIn: new Date() });
      const sessionToken = await sdk.createSessionToken(openId, { name: g.name || "", expiresInMs: ONE_YEAR_MS });
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
      let kycStatus = "unverified";
      try {
        const dbUser = await db.getUserByOpenId(openId);
        if (dbUser) { const kyc = await db.getKycVerificationForUser(dbUser.id); if (kyc?.lifecycleStatus) kycStatus = kyc.lifecycleStatus; }
      } catch {}
      res.redirect(302, kycStatus === "verified" ? "/" : "/?onboarding=1");
    } catch (error) { console.error("[Google OAuth] Callback failed", error); res.status(500).json({ error: "google oauth failed" }); }
  });

  app.get("/api/oauth/callback", async (req: Request, res: Response) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");

    if (!code || !state) {
      res.status(400).json({ error: "code and state are required" });
      return;
    }

    // CSRF guard: the nonce in `state` must match the one-time cookie that
    // startLogin set in the browser that began this login. An attacker can
    // forge `state`, but cannot plant this cookie in the victim's browser.
    const { nonce } = decodeOAuthState(state);
    const expectedNonce = parseCookieHeader(req.headers.cookie ?? "")[OAUTH_STATE_COOKIE];
    if (!nonce || nonce !== expectedNonce) {
      res.status(403).json({ error: "invalid oauth state" });
      return;
    }
    res.clearCookie(OAUTH_STATE_COOKIE, { path: "/", secure: true, sameSite: "none" });

    try {
      const tokenResponse = await sdk.exchangeCodeForToken(code, state);
      const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);

      if (!userInfo.openId) {
        res.status(400).json({ error: "openId missing from user info" });
        return;
      }

      await db.upsertUser({
        openId: userInfo.openId,
        name: userInfo.name || null,
        email: userInfo.email ?? null,
        loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
        lastSignedIn: new Date(),
      });

      const sessionToken = await sdk.createSessionToken(userInfo.openId, {
        name: userInfo.name || "",
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      // KYC check: new / unverified user -> force onboarding, verified -> home
    let kycStatus = "unverified";
    try {
      const dbUser = await db.getUserByOpenId(userInfo.openId);
      if (dbUser) {
        const kyc = await db.getKycVerificationForUser(dbUser.id);
        if (kyc?.lifecycleStatus) kycStatus = kyc.lifecycleStatus;
      }
    } catch {}
    res.redirect(302, kycStatus === "verified" ? "/" : "/?onboarding=1");
    } catch (error) {
      console.error("[OAuth] Callback failed", error);
      res.status(500).json({ error: "OAuth callback failed" });
    }
  });
}
