export default function handler(req: any, res: any) {
  const host = req.headers.host;
  const proto = req.headers["x-forwarded-proto"] || "https";
  const redirectUri = `${proto}://${host}/api/oauth/google/callback`;
  const clientId = process.env.GOOGLE_CLIENT_ID || "";
  const state = (req.query?.state as string) || "";
  if (req.url?.includes("/callback")) {
    res.status(200).json({ ok: true, msg: "callback reached, google code present", hasCode: !!req.query?.code });
    return;
  }
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "openid email profile");
  url.searchParams.set("state", state);
  url.searchParams.set("access_type", "offline");
  url.searchParams.set("prompt", "select_account");
  res.redirect(302, url.toString());
}
