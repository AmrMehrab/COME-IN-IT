import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ShieldCheck, Scale, GitBranch, AlertTriangle, CheckCircle2, XCircle } from "lucide-react";

type PolicyEffect = "allow" | "deny" | "manual_review";

type PolicyRow = {
  action: string;
  label: string;
  stage: string;
  ruleIds: string[];
  allowSummary: string;
  denySummary: string;
};

const policies: PolicyRow[] = [
  { action: "trade.rfq.open", label: "فتح RFQ", stage: "المطابقة → الطلب", ruleIds: ["TRUST_KYC_KYB_MEMBERSHIP", "RFQ_DEMAND_CONTROLLER", "RFQ_ELIGIBLE_MATCH", "RFQ_ACTIVE_OFFERING"], allowSummary: "المطابقة مؤهلة، والطالب مخوّل، والعرض متحقق ومنشور.", denySummary: "غياب التحقق أو العضوية أو صلاحية المطابقة أو نشاط العرض." },
  { action: "trade.quotation.submit", label: "تقديم عرض سعر", stage: "RFQ → اقتباس", ruleIds: ["QUOTATION_OFFERING_CONTROLLER", "QUOTATION_PARTICIPANT", "QUOTATION_RFQ_OPEN", "QUOTATION_ELIGIBLE_MATCH"], allowSummary: "متحكم العرض يشارك في العلاقة وRFQ مفتوح.", denySummary: "المستخدم ليس متحكماً في العرض أو أن RFQ غير قابل للاقتباس." },
  { action: "trade.quotation.accept", label: "قبول عرض السعر", stage: "اقتباس → معاملة", ruleIds: ["ACCEPT_DEMAND_CONTROLLER", "ACCEPT_QUOTATION_OPEN", "ACCEPT_RFQ_OPEN", "ACCEPT_ACTIVE_OFFERING"], allowSummary: "متحكم الطلب يقبل اقتباساً صالحاً لإنشاء معاملة.", denySummary: "القبول خارج صلاحية متحكم الطلب أو الحالة غير صالحة." },
  { action: "trade.payment.update", label: "تحديث الدفع", stage: "معاملة → دفع", ruleIds: ["PAYMENT_PARTICIPANT", "PAYMENT_OPEN_TRANSACTION"], allowSummary: "مشارك في المعاملة يسجل حالة الدفع.", denySummary: "المستخدم ليس مشاركاً أو المعاملة مغلقة/ملغاة." },
  { action: "trade.transport.assign", label: "إسناد النقل", stage: "تنفيذ → نقل", ruleIds: ["TRANSPORT_PARTICIPANT", "TRANSPORT_PROVIDER_ACTIVITY", "TRANSPORT_ASSIGNABLE_TRANSACTION"], allowSummary: "ناقل ذو نشاط تشغيلي متحقق يُسند قبل العبور.", denySummary: "الناقل غير متحقق أو المعاملة تجاوزت نقطة الإسناد." },
  { action: "trade.transport.advance", label: "تقدم حالة النقل", stage: "نقل → تسليم", ruleIds: ["TRANSPORT_ADVANCE_PARTICIPANT", "TRANSPORT_STATE_MACHINE"], allowSummary: "الانتقال يطابق آلة الحالات المركزية.", denySummary: "الانتقال المطلوب غير مسموح من الحالة الحالية." },
  { action: "trade.delivery.record", label: "تسجيل التسليم", stage: "نقل → تسليم", ruleIds: ["DELIVERY_RECORD_PARTICIPANT", "DELIVERY_IN_TRANSIT", "DELIVERY_JOB_OWNERSHIP"], allowSummary: "المشارك يسجل تسليماً مرتبطاً بالمعاملة.", denySummary: "المعاملة ليست في حالة قابلة للتسليم أو المرجع غير مرتبط." },
  { action: "trade.delivery.accept", label: "استلام التسليم", stage: "تسليم → استلام", ruleIds: ["DELIVERY_ACCEPT_RECEIVER", "DELIVERY_ACCEPT_DELIVERED"], allowSummary: "المالك/المشتري يقبل التسليم المسجل.", denySummary: "المستلم ليس الطرف المخول أو لم تُسجل حالة التسليم." },
  { action: "trade.transaction.close", label: "إغلاق المعاملة", stage: "استلام → إغلاق", ruleIds: ["CLOSE_OWNER", "CLOSE_RECEIVED", "CLOSE_PAYMENT"], allowSummary: "المعاملة مستلمة والدفع مثبت والطرف مخول بالإغلاق.", denySummary: "لم يثبت الاستلام أو الدفع أو صلاحية المالك." },
  { action: "trade.dispute.open", label: "فتح نزاع", stage: "أي مرحلة مفتوحة", ruleIds: ["DISPUTE_PARTICIPANT", "DISPUTE_OPEN_TRANSACTION"], allowSummary: "مشارك يفتح نزاعاً على معاملة غير مغلقة.", denySummary: "لا توجد مشاركة أو أن المعاملة مغلقة/ملغاة." },
];

const effectStyles: Record<PolicyEffect, string> = {
  allow: "border-emerald-200 bg-emerald-50 text-emerald-800",
  deny: "border-rose-200 bg-rose-50 text-rose-800",
  manual_review: "border-amber-200 bg-amber-50 text-amber-800",
};

export default function PolicyEngineDashboard() {
  const [selectedAction, setSelectedAction] = useState(policies[0].action);
  const selected = useMemo(() => policies.find(policy => policy.action === selectedAction) ?? policies[0], [selectedAction]);

  return (
    <div className="space-y-6">
      <Card className="border-slate-200 bg-white shadow-sm">
        <CardHeader className="border-b border-slate-100 bg-slate-50/80">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2 text-slate-950"><ShieldCheck className="h-5 w-5 text-blue-700" /> Policy Engine المركزي</CardTitle>
              <CardDescription className="mt-2 max-w-3xl leading-6 text-slate-600">عقد خادمي موحد يقيّم كل انتقال تجاري قبل الإنفاذ، ويعيد التأثير والأسباب وإصدار السياسة ومعرّفات القواعد. هذه اللوحة للقراءة والمراجعة؛ تغيير القواعد في الإنتاج يتطلب مسار حوكمة وإصداراً جديداً.</CardDescription>
            </div>
            <Badge className="bg-slate-950 text-white">policy-engine.v1</Badge>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 p-5 md:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white p-4"><p className="text-xs font-semibold uppercase tracking-widest text-slate-500">نطاق القرار</p><p className="mt-2 text-2xl font-bold text-slate-950">10</p><p className="mt-1 text-sm text-slate-600">أفعال حساسة من RFQ حتى النزاع</p></div>
          <div className="rounded-xl border border-slate-200 bg-white p-4"><p className="text-xs font-semibold uppercase tracking-widest text-slate-500">شكل النتيجة</p><p className="mt-2 text-2xl font-bold text-slate-950">3</p><p className="mt-1 text-sm text-slate-600">allow / deny / manual_review</p></div>
          <div className="rounded-xl border border-slate-200 bg-white p-4"><p className="text-xs font-semibold uppercase tracking-widest text-slate-500">التدقيق</p><p className="mt-2 flex items-center gap-2 text-lg font-bold text-emerald-700"><GitBranch className="h-5 w-5" /> قبل الإنفاذ</p><p className="mt-1 text-sm text-slate-600">القرار يُسجل مع الفعل والموارد</p></div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <Card className="border-slate-200 bg-white shadow-sm">
          <CardHeader><CardTitle className="text-lg text-slate-950">كتالوج الأفعال</CardTitle><CardDescription>اختر نقطة انتقال لمراجعة قواعدها وأسباب الرفض المتوقعة.</CardDescription></CardHeader>
          <CardContent className="space-y-2">
            {policies.map(policy => <button key={policy.action} type="button" onClick={() => setSelectedAction(policy.action)} className={`w-full rounded-lg border p-3 text-right transition ${selectedAction === policy.action ? "border-blue-500 bg-blue-50" : "border-slate-200 bg-white hover:border-slate-300"}`}><div className="flex items-center justify-between gap-3"><span className="font-semibold text-slate-900">{policy.label}</span><Badge variant="outline" className="text-[10px]">{policy.stage}</Badge></div><code className="mt-1 block text-left text-[11px] text-slate-500">{policy.action}</code></button>)}
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white shadow-sm">
          <CardHeader><div className="flex items-center justify-between gap-3"><div><CardTitle className="text-lg text-slate-950">تفاصيل القرار</CardTitle><CardDescription>{selected.label} — {selected.stage}</CardDescription></div><Badge className={effectStyles.allow}><CheckCircle2 className="mr-1 h-3.5 w-3.5" />قرار نموذجي: allow</Badge></div></CardHeader>
          <CardContent className="space-y-5">
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4"><p className="flex items-center gap-2 font-semibold text-emerald-900"><CheckCircle2 className="h-4 w-4" />حالة السماح</p><p className="mt-2 text-sm leading-6 text-emerald-800">{selected.allowSummary}</p></div>
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-4"><p className="flex items-center gap-2 font-semibold text-rose-900"><XCircle className="h-4 w-4" />حالة الرفض</p><p className="mt-2 text-sm leading-6 text-rose-800">{selected.denySummary}</p></div>
            <Separator />
            <div><p className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900"><Scale className="h-4 w-4 text-blue-700" />القواعد المطبقة</p><div className="flex flex-wrap gap-2">{selected.ruleIds.map(rule => <Badge key={rule} variant="outline" className="border-slate-300 bg-slate-50 font-mono text-[10px]">{rule}</Badge>)}</div></div>
            <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-900"><AlertTriangle className="mt-1 h-4 w-4 shrink-0" /><span>قرارات <strong>manual_review</strong> تُستخدم عندما تُضاف قاعدة مراجعة بشرية؛ لا تُحوّل تلقائياً إلى allow.</span></div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
