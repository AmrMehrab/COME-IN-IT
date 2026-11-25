import { useEffect, useState, useCallback } from "react";
export function useAuth() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);
  useEffect(() => {
    fetch("/api/auth/me", { credentials: "include" })
      .then(async (r) => {
        if (!r.ok) { setUser(null); setLoading(false); return; }
        const d = await r.json();
        setUser(d.user ?? d ?? null);
        setLoading(false);
      })
      .catch((e) => { setError(e); setLoading(false); });
  }, []);
  const logout = useCallback(async () => {
    document.cookie = "session=; Path=/; Max-Age=0";
    document.cookie = "auth_token=; Path=/; Max-Age=0";
    setUser(null);
    window.location.href = "/";
  }, []);
  return { user, loading, error, isAuthenticated: Boolean(user), logout };
}
