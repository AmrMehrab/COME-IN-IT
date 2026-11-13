import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, ArrowLeft, FileCheck2, Fingerprint, Gavel, LockKeyhole, ShieldCheck, Users } from "lucide-react";

type OwnerControlCenterProps = {
  ownerName: string;
  ownerEmail?: string | null;
  onNavigate: (tab: string) => void;
};

const accessCards = [
  { tab: "verification", title: "الهوية والتحقق", description: "مراجعة KYC/KYB وحالات الوجه والحيوية والموافقات.", icon: Fingerprint, tone: "border-emerald-200 bg-emerald-50 text-emerald-800" },
  { tab: "policy-engine", title: "Policy Engine", description: "قرارات allow / deny / manual_review وقواعد الإغلاق الآمن.", icon: Gavel, tone: "border-blue-200 bg-blue-50 text-blue-800" },
  { tab: "trade-operations", title: "التشغيل التجاري", description: "متابعة دورة RFQ إلى التسليم والإغلاق.", icon: Activity, tone: "border-indigo-200 bg-indigo-50 text-indigo-800" },
  { tab: "permissions", title: "مصفوفة الصلاحيات", description: "مراجعة RBAC + ABAC وحدود الوصول حسب التحقق.", icon: LockKeyhole, tone: "border-amber-200 bg-amber-50 text-amber-800" },
];

export function OwnerControlCenter({ ownerName, ownerEmail, onNavigate }: OwnerControlCenterProps) {
  return (
    <div className="space-y-6">
      <Card className="overflow-hidden border-slate-900 bg-slate-950 text-white shadow-xl">
        <CardContent className="p-6 md:p-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <Badge className="border border-cyan-300/30 bg-cyan-400/10 text-cyan-200">Owner Console</Badge>
                <Badge variant="outline" className="border-emerald-300/30 text-emerald-200">دخول مؤسس مصادق عليه</Badge>
              </div>
              <h2 className="text-2xl font-black tracking-tight md:text-3xl">مرحباً {ownerName}</h2>
              <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-300">لوحة التحكم التنفيذية لمالك COME IN IT: الحوكمة، الثقة، السياسات، التشغيل التجاري، وسلامة البيانات السيادية.</p>
              {ownerEmail && <p className="mt-3 text-xs text-slate-400">الحساب المصادق: {ownerEmail}</p>}
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-right">
              <ShieldCheck className="mb-3 h-8 w-8 text-cyan-300" />
              <p className="text-xs uppercase tracking-[0.18em] text-slate-400">الدور الحالي</p>
              <p className="mt-1 text-xl font-bold text-white">OWNER</p>
              <p className="mt-1 text-xs text-emerald-300">صلاحيات الإدارة مفعّلة</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><Users className="h-5 w-5 text-slate-700" /><p className="mt-4 text-xs text-slate-500">نطاق الإدارة</p><p className="mt-1 font-bold text-slate-950">المستخدمون والكيانات</p></div>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm"><FileCheck2 className="h-5 w-5 text-emerald-700" /><p className="mt-4 text-xs text-emerald-700">بوابة الثقة</p><p className="mt-1 font-bold text-emerald-950">KYC قبل Business</p></div>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 shadow-sm"><LockKeyhole className="h-5 w-5 text-amber-700" /><p className="mt-4 text-xs text-amber-700">مبدأ الحماية</p><p className="mt-1 font-bold text-amber-950">Fail-closed</p></div>
      </div>

      <Card className="border-slate-200 bg-white shadow-sm">
        <CardHeader><CardTitle className="text-slate-950">مراكز التحكم</CardTitle><CardDescription className="text-slate-600">اختصارات المالك إلى الوحدات التشغيلية الفعلية داخل المنظومة.</CardDescription></CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          {accessCards.map(({ tab, title, description, icon: Icon, tone }) => <button key={tab} type="button" onClick={() => onNavigate(tab)} className={`group rounded-xl border p-5 text-right transition hover:-translate-y-0.5 hover:shadow-md ${tone}`}><div className="flex items-start justify-between gap-4"><div><Icon className="h-6 w-6" /><h3 className="mt-4 font-bold">{title}</h3><p className="mt-2 text-sm leading-6 opacity-80">{description}</p></div><ArrowLeft className="h-5 w-5 opacity-60 transition group-hover:-translate-x-1" /></div></button>)}
        </CardContent>
      </Card>

      <div className="rounded-xl border border-violet-200 bg-violet-50 p-5 text-sm leading-7 text-violet-950"><strong>حدود الدور:</strong> دور Owner يمنح صلاحيات الحوكمة والإدارة، لكنه لا يثبت الهوية الشخصية تلقائياً ولا يلغي KYC أو KYB أو قرارات Policy Engine. تسجيل الدخول يتم عبر Manus OAuth، وليس عبر كلمة مرور محلية.</div>
    </div>
  );
}
