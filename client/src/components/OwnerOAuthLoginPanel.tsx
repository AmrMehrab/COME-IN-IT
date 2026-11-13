import { useState } from "react";
import { Activity, CheckCircle2, Fingerprint, KeyRound, Play, ShieldCheck, UserRound, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { startLogin } from "@/const";

type DemoState = "idle" | "running" | "passed";

const demoEvents = [
  "طلب OAuth تجريبي — appId وredirectUri جاهزان",
  "إنشاء PERSON تجريبي — لا توجد بيانات حقيقية",
  "فحص KYC تجريبي — النتيجة: verified (simulation)",
  "تقييم Owner — النتيجة: لا يمنح صلاحية إنتاجية",
];

export function OwnerOAuthLoginPanel() {
  const [demoState, setDemoState] = useState<DemoState>("idle");
  const [completedEvents, setCompletedEvents] = useState(0);

  const runDemo = () => {
    setDemoState("running");
    setCompletedEvents(0);
    let event = 0;
    const timer = window.setInterval(() => {
      event += 1;
      setCompletedEvents(event);
      if (event >= demoEvents.length) {
        window.clearInterval(timer);
        setDemoState("passed");
      }
    }, 260);
  };

  return (
    <Card className="mx-auto mb-10 max-w-4xl overflow-hidden border-cyan-300/30 bg-slate-950 text-white shadow-2xl shadow-cyan-950/20" dir="rtl">
      <CardHeader className="border-b border-white/10 p-5 md:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="mb-3 flex flex-wrap items-center gap-2"><Badge className="bg-cyan-400/15 text-cyan-200">Owner Access Gateway</Badge><Badge variant="outline" className="border-amber-300/30 text-amber-200">OAuth</Badge></div>
            <CardTitle className="flex items-center gap-2 text-xl text-white"><KeyRound className="h-5 w-5 text-cyan-300" />دخول المالك — COME IN IT</CardTitle>
            <CardDescription className="mt-2 leading-6 text-slate-300">الدخول الحقيقي يتم عبر Manus OAuth. الاسم المعروض Amr.Anwar لا يستبدل هوية OAuth ولا يمنح صلاحيات من تلقاء نفسه.</CardDescription>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-right"><p className="text-[10px] uppercase tracking-wider text-slate-400">الدور المستهدف</p><p className="mt-1 font-bold text-cyan-200">OWNER</p><p className="mt-1 text-[11px] text-slate-400">بعد نجاح callback فقط</p></div>
        </div>
      </CardHeader>
      <CardContent className="grid gap-5 p-5 md:grid-cols-[1fr_1.2fr] md:p-6">
        <div className="space-y-3">
          <div className="rounded-xl border border-cyan-300/20 bg-cyan-400/5 p-4"><p className="flex items-center gap-2 text-sm font-bold text-cyan-100"><ShieldCheck className="h-4 w-4" />مسار الدخول الحقيقي</p><ol className="mt-3 space-y-2 text-xs leading-6 text-slate-300"><li>1. فتح Manus OAuth</li><li>2. المصادقة بالحساب المؤسسي</li><li>3. العودة عبر callback آمن</li><li>4. فحص role=owner ثم فتح اللوحة</li></ol><Button type="button" onClick={startLogin} className="mt-4 w-full bg-cyan-400 font-bold text-slate-950 hover:bg-cyan-300"><KeyRound className="ml-2 h-4 w-4" />بدء دخول المالك الحقيقي</Button></div>
          <div className="rounded-xl border border-amber-300/20 bg-amber-400/5 p-4 text-xs leading-6 text-amber-100"><strong>تنبيه:</strong> الوضع التجريبي لا ينشئ جلسة، ولا يغيّر role، ولا يكتب KYC أو PERSON داخل قاعدة البيانات.</div>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4"><div className="flex items-center justify-between gap-3"><div><p className="flex items-center gap-2 font-bold text-white"><Play className="h-4 w-4 text-emerald-300" />بيانات تجريبية تفاعلية</p><p className="mt-1 text-xs text-slate-400">تشغيل محاكاة دورة الدخول لقياس وضوح الواجهة.</p></div><Button type="button" variant="outline" size="sm" onClick={runDemo} disabled={demoState === "running"} className="border-emerald-300/30 bg-transparent text-emerald-200 hover:bg-emerald-400/10">{demoState === "running" ? "جارٍ الاختبار…" : "تشغيل Demo"}</Button></div><div className="mt-4 space-y-2">{demoEvents.map((event, index) => { const done = index < completedEvents; return <div key={event} className={`flex items-start gap-2 rounded-lg border p-3 text-xs ${done ? "border-emerald-300/20 bg-emerald-400/5 text-emerald-100" : "border-white/10 bg-black/10 text-slate-400"}`}><span className="mt-0.5">{done ? <CheckCircle2 className="h-4 w-4 text-emerald-300" /> : <Activity className="h-4 w-4" />}</span><span>{event}</span></div>; })}</div>{demoState === "passed" && <div className="mt-4 flex items-start gap-2 rounded-lg border border-emerald-300/20 bg-emerald-400/10 p-3 text-xs leading-6 text-emerald-100"><UserRound className="mt-0.5 h-4 w-4 shrink-0" />نجحت المحاكاة البصرية. هذا لا يثبت OAuth الحقيقي؛ لإثبات الدخول اضغط زر «بدء دخول المالك الحقيقي».</div>}{demoState === "idle" && <div className="mt-4 flex items-start gap-2 text-xs leading-6 text-slate-500"><XCircle className="mt-0.5 h-4 w-4 shrink-0" />لم يتم تشغيل بيانات تجريبية بعد.</div>}</div>
      </CardContent>
    </Card>
  );
}
