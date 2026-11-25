import { SignJWT } from "jose";
export default async function handler(req: any, res: any) {
  if (req.url?.includes("/api/auth/me")) {
    try {
      const { jwtVerify } = await import("jose");
      const cookie = req.headers.cookie || "";
      const m = cookie.match(/(?:session|auth_token)=([^;]+)/);
      const token = m?.[1];
      if (!token) { res.status(401).json({ user: null }); return; }
      const secretKey = new TextEncoder().encode(process.env.JWT_SECRET || "dev-secret-change-me");
      const { payload }: any = await jwtVerify(token, secretKey, { algorithms: ["HS256"] });
      const openId = payload.openId as string;
      let dbUser: any = null;
      try {
        const { db } = await import("../server/_core/db");
        dbUser = await db.getUserByOpenId(openId);
      } catch {}
      res.status(200).json({ user: { id: dbUser?.id ?? openId, openId, name: payload.name || dbUser?.name || "", email: dbUser?.email || null, loginMethod: "google" } });
    } catch (e: any) { res.status(401).json({ user: null, error: String(e) }); }
    return;
  }

  const host = req.headers.host;
  const proto = req.headers["x-forwarded-proto"] || "https";
  const redirectUri = `${proto}://${host}/api/oauth/google/callback`;
  const clientId = process.env.GOOGLE_CLIENT_ID || "";
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET || "";
  const jwtSecret = process.env.JWT_SECRET || "dev-secret-change-me";
  const isCallback = req.url?.includes("/callback");
  if (!isCallback) {
    const state = (req.query?.state as string) || "";
    const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    url.searchParams.set("client_id", clientId);
    url.searchParams.set("redirect_uri", redirectUri);
    url.searchParams.set("response_type", "code");
    url.searchParams.set("scope", "openid email profile");
    url.searchParams.set("state", state);
    url.searchParams.set("access_type", "offline");
    url.searchParams.set("prompt", "select_account");
    res.redirect(302, url.toString());
    return;
  }
  const code = req.query?.code as string;
  if (!code) { res.status(400).json({ error: "missing code" }); return; }
  try {
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ code, client_id: clientId, client_secret: clientSecret, redirect_uri: redirectUri, grant_type: "authorization_code" }),
    });
    const tokens: any = await tokenRes.json();
    if (!tokens.access_token) { res.status(400).json({ error: "token exchange failed", details: tokens }); return; }
    const meRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", { headers: { Authorization: `Bearer ${tokens.access_token}` } });
    const g: any = await meRes.json();
    const openId = `google:${g.sub}`;
    try {
      const { db } = await import("../server/_core/db");
      await db.upsertUser({ openId, name: g.name ?? null, email: g.email ?? null, loginMethod: "google", lastSignedIn: new Date() });
    } catch (e) { console.log("upsertUser skipped", e); }
    const secretKey = new TextEncoder().encode(jwtSecret);
    const sessionToken = await new SignJWT({ openId, name: g.name || "", appId: process.env.VITE_APP_ID || "" })
      .setProtectedHeader({ alg: "HS256", typ: "JWT" })
      .setExpirationTime("365d")
      .sign(secretKey);
    res.setHeader("Set-Cookie", [`session=${sessionToken}; Path=/; Max-Age=31536000; Secure; SameSite=None`, `auth_token=${sessionToken}; Path=/; Max-Age=31536000; Secure; SameSite=None`]);
    res.redirect(302, "/?onboarding=1");
  } catch (e: any) { console.error(e); res.status(500).json({ error: "callback failed", details: String(e) }); }
}
