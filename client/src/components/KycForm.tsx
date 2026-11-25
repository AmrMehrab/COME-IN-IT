import { useState } from "react";
import { Button } from "@/components/ui/button";
export function KycForm() {
  const isBack = window.location.search.includes("didit"); const [msg, setMsg] = useState(isBack ? "Verified via Didit - you can continue." : ""); const [done, setDone] = useState(isBack);
  const [loading, setLoading] = useState(false);
  const start = async () => { if (done) { window.location.href = "/"; return; }
    setLoading(true);
    setMsg("جارٍ تجهيز جلسة التوثيق...");
    try {
      const r = await fetch("/api/didit/create-session", { method: "POST", credentials: "include" });
      const j = await r.json();
      if (j.url) { window.location.href = j.url; return; }
      setMsg("مش قادر أجهز جلسة التوثيق. اتأكد ان DIDIT_API_KEY و DIDIT_WORKFLOW_ID متسجلين في Vercel.");
    } catch { setMsg("اتأكد من النت وحاول تاني."); }
    setLoading(false);
  };
  return (
    <div dir="rtl" className="min-h-screen bg-slate-50 p-4">
      <div className="mx-auto max-w-xl rounded-2xl bg-white p-6 shadow text-center">
        <h1 className="text-2xl font-black">توثيق الهوية - KYC</h1>
        <p className="mt-2 text-sm text-slate-600">هتتحول على Didit عشان توثق هويتك: مسح البطاقة، والتأكد انك صاحبها، وLiveness.</p>
        <p className="mt-1 text-sm text-slate-500">مش هتكتب حاجة خالص هنا. Didit هو اللي هيقرا بياناتك بشكل سليم.</p>
        {msg && <p className="mt-3 text-sm text-slate-600">{msg}</p>}
        <Button className="mt-4 w-full" onClick={start} disabled={loading}>{loading ? "جارٍ التحويل..." : "وثق هويتك عبر Didit"}</Button>
        <Button variant="ghost" className="mt-2 w-full" onClick={() => window.location.href = "/"}>رجوع للرئيسية</Button>
      </div>
    </div>
  );
}
