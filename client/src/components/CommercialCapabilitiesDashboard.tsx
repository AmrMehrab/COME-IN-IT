import { useMemo, useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BriefcaseBusiness, CheckCircle2, CircleAlert, Loader2, Route, ShieldCheck, UserRoundCheck } from "lucide-react";
import { toast } from "sonner";

type IndividualActivityType = "consumer" | "individual_producer" | "used_asset_seller" | "service_provider";
type BusinessActivityType = "factory" | "importer" | "exporter" | "store" | "service_provider";
type TradePartyKind = "business" | "individual";

const individualLabels: Record<IndividualActivityType, string> = {
  consumer: "مستهلك",
  individual_producer: "منتِج فردي",
  used_asset_seller: "بائع أصل مستخدم",
  service_provider: "مقدم خدمة فردي",
};

const businessLabels: Record<BusinessActivityType, string> = {
  factory: "مصنع",
  importer: "مستورد",
  exporter: "مُصدّر",
  store: "متجر",
  service_provider: "مقدم خدمة",
};

const statusStyle: Record<string, string> = {
  verified: "border-emerald-200 bg-emerald-50 text-emerald-700",
  pending: "border-amber-200 bg-amber-50 text-amber-800",
  unverified: "border-slate-200 bg-slate-50 text-slate-600",
  suspended: "border-rose-200 bg-rose-50 text-rose-700",
  expired: "border-orange-200 bg-orange-50 text-orange-700",
  rejected: "border-rose-200 bg-rose-50 text-rose-700",
};

const decisionStyle: Record<string, string> = {
  allow: "border-emerald-200 bg-emerald-50 text-emerald-800",
  manual_review: "border-amber-200 bg-amber-50 text-amber-900",
  deny: "border-rose-200 bg-rose-50 text-rose-800",
};

function PartySelect({
  kind,
  value,
  onChange,
  businesses,
  profiles,
}: {
  kind: TradePartyKind;
  value: string;
  onChange: (value: string) => void;
  businesses: Array<{ id: number; legalName: string; verificationStatus: string }>;
  profiles: Array<{ id: number; activityType: IndividualActivityType; verificationStatus: string }>;
}) {
  const values = kind === "business" ? businesses : profiles;
  return (
    <select value={value} onChange={event => onChange(event.target.value)} className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm">
      <option value="">اختر طرفاً</option>
      {values.map(item => (
        <option key={item.id} value={item.id}>
          {kind === "business" ? `${(item as { legalName: string }).legalName} · ${(item as { verificationStatus: string }).verificationStatus}` : `${individualLabels[(item as { activityType: IndividualActivityType }).activityType]} · ${(item as { verificationStatus: string }).verificationStatus}`}
        </option>
      ))}
    </select>
  );
}

export function CommercialCapabilitiesDashboard() {
  const { isAuthenticated, loading } = useAuth();
  const utils = trpc.useUtils();
  const businessesQuery = trpc.businesses.list.useQuery(undefined, { enabled: isAuthenticated });
  const profilesQuery = trpc.commercial.individualProfiles.list.useQuery(undefined, { enabled: isAuthenticated });
  const businessActivitiesQuery = trpc.commercial.businessActivities.list.useQuery(undefined, { enabled: isAuthenticated });

  const [individualActivityType, setIndividualActivityType] = useState<IndividualActivityType>("consumer");
  const [capabilitiesJson, setCapabilitiesJson] = useState("{}");
  const [individualEvidence, setIndividualEvidence] = useState("");
  const [activityBusinessId, setActivityBusinessId] = useState("");
  const [businessActivityType, setBusinessActivityType] = useState<BusinessActivityType>("factory");
  const [businessEvidence, setBusinessEvidence] = useState("");
  const [supplierKind, setSupplierKind] = useState<TradePartyKind>("business");
  const [requesterKind, setRequesterKind] = useState<TradePartyKind>("business");
  const [supplierId, setSupplierId] = useState("");
  const [requesterId, setRequesterId] = useState("");

  const businesses = businessesQuery.data ?? [];
  const profiles = profilesQuery.data ?? [];
  const businessActivities = businessActivitiesQuery.data ?? [];
  const queryError = businessesQuery.error || profilesQuery.error || businessActivitiesQuery.error;
  const isLoading = businessesQuery.isLoading || profilesQuery.isLoading || businessActivitiesQuery.isLoading;

  const verifiedOperationalCount = useMemo(
    () => businessActivities.filter(item => item.verificationStatus === "verified").length,
    [businessActivities],
  );

  const refresh = async () => {
    await Promise.all([
      utils.commercial.individualProfiles.list.invalidate(),
      utils.commercial.businessActivities.list.invalidate(),
      utils.trade.offerings.list.invalidate(),
      utils.trade.demands.list.invalidate(),
    ]);
  };

  const submitIndividualProfile = trpc.commercial.individualProfiles.submit.useMutation({
    onSuccess: async () => {
      await refresh();
      setIndividualEvidence("");
      toast.success("تم إرسال ملف النشاط الفردي للمراجعة التشغيلية.");
    },
    onError: error => toast.error(error.message || "تعذر إرسال ملف النشاط الفردي."),
  });

  const submitBusinessActivity = trpc.commercial.businessActivities.submit.useMutation({
    onSuccess: async () => {
      await refresh();
      setBusinessEvidence("");
      toast.success("تم إرسال تحقق النشاط التجاري للمراجعة.");
    },
    onError: error => toast.error(error.message || "تعذر إرسال تحقق النشاط التجاري."),
  });

  const evaluateRelationship = trpc.commercial.relationships.evaluate.useMutation({
    onSuccess: result => toast.success(result.decision === "allow" ? "العلاقة مؤهلة ضمن بوابات الثقة." : "تم تسجيل قرار العلاقة وسببه القابل للتدقيق."),
    onError: error => toast.error(error.message || "تعذر تقييم العلاقة التجارية."),
  });

  if (loading) {
    return <div className="flex min-h-64 items-center justify-center text-slate-500"><Loader2 className="ml-2 h-5 w-5 animate-spin" /> جارٍ التحقق من الجلسة…</div>;
  }

  if (!isAuthenticated) {
    return (
      <Card className="border-teal-100 bg-teal-50/40">
        <CardHeader><CardTitle className="flex items-center gap-2 text-slate-900"><ShieldCheck className="h-5 w-5 text-teal-700" /> القدرات التجارية</CardTitle><CardDescription>سجّل الدخول لإنشاء ملف نشاط فردي أو تجاري وتقييم العلاقة وفق بوابات الثقة.</CardDescription></CardHeader>
        <CardContent><Button onClick={startLogin} className="bg-teal-700 hover:bg-teal-800">تسجيل الدخول للمتابعة</Button></CardContent>
      </Card>
    );
  }

  return (
    <section dir="rtl" className="space-y-6">
      <Card className="overflow-hidden border-teal-100 bg-gradient-to-l from-teal-950 via-cyan-950 to-slate-950 text-white shadow-xl shadow-teal-950/10">
        <CardContent className="grid gap-5 p-6 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <div className="mb-3 flex items-center gap-2 text-teal-200"><Route className="h-5 w-5" /><span className="text-xs font-bold tracking-[0.16em]">COMMERCIAL CAPABILITIES · GOVERNED ACCESS</span></div>
            <h2 className="text-2xl font-black">ملف نشاط قبل الوصول التجاري، وقرار علاقة قبل المطابقة</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-teal-100">تضيف هذه الطبقة ملف نشاط فردياً أو تحققاً تشغيلياً للنشاط التجاري فوق KYC وKYB. قرار العلاقة يعيد سماحاً أو رفضاً أو مراجعة يدوية مع سبب مدقق، ولا ينشئ عقداً أو طلباً تنفيذياً أو دفعاً.</p>
          </div>
          <div className="grid grid-cols-2 gap-2 text-center text-xs"><div className="rounded-lg border border-white/10 bg-white/10 p-3"><p className="text-xl font-black">{profiles.length}</p><p className="text-teal-100">ملفات فردية</p></div><div className="rounded-lg border border-white/10 bg-white/10 p-3"><p className="text-xl font-black">{verifiedOperationalCount}</p><p className="text-teal-100">أنشطة موثقة</p></div></div>
        </CardContent>
      </Card>

      {queryError ? <Card className="border-rose-200 bg-rose-50"><CardContent className="flex items-center gap-2 p-4 text-sm text-rose-800"><CircleAlert className="h-4 w-4" />{queryError.message || "تعذر تحميل بيانات القدرات التجارية."}</CardContent></Card> : null}
      {isLoading ? <div className="flex min-h-40 items-center justify-center text-slate-500"><Loader2 className="ml-2 h-5 w-5 animate-spin" /> جارٍ تحميل ملفات النشاط…</div> : null}

      {!isLoading ? <div className="grid gap-6 xl:grid-cols-2">
        <Card className="border-slate-200">
          <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><UserRoundCheck className="h-5 w-5 text-teal-700" /> ملف النشاط الفردي</CardTitle><CardDescription>يتطلب KYC متحققاً. الملف يمر بحالة مراجعة تشغيلية مستقلة ولا يخزن وثائق خام.</CardDescription></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2"><Label>نوع النشاط</Label><select value={individualActivityType} onChange={event => setIndividualActivityType(event.target.value as IndividualActivityType)} className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm">{Object.entries(individualLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>
            <div className="space-y-2"><Label>قدرات منظمة (JSON)</Label><textarea value={capabilitiesJson} onChange={event => setCapabilitiesJson(event.target.value)} className="min-h-20 w-full rounded-md border border-slate-200 p-3 font-mono text-xs" /></div>
            <div className="space-y-2"><Label>مرجع دليل اختياري</Label><Input value={individualEvidence} onChange={event => setIndividualEvidence(event.target.value)} placeholder="مرجع وصفي فقط، لا ترفع وثيقة حساسة" /></div>
            <Button disabled={submitIndividualProfile.isPending} onClick={() => submitIndividualProfile.mutate({ activityType: individualActivityType, capabilitiesJson, evidenceReference: individualEvidence || undefined })} className="w-full bg-teal-700 hover:bg-teal-800">{submitIndividualProfile.isPending ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : null}إرسال ملف النشاط</Button>
            <div className="space-y-2">{profiles.length === 0 ? <p className="text-sm text-slate-500">لا يوجد ملف نشاط فردي مسجل بعد.</p> : profiles.map(profile => <div key={profile.id} className="flex items-center justify-between rounded-lg border border-slate-100 p-3"><div><p className="font-semibold text-slate-900">{individualLabels[profile.activityType]}</p><p className="mt-1 text-xs text-slate-500">ملف رقم {profile.id} · بيانات وصفية فقط</p></div><Badge variant="outline" className={statusStyle[profile.verificationStatus] ?? statusStyle.unverified}>{profile.verificationStatus}</Badge></div>)}</div>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><BriefcaseBusiness className="h-5 w-5 text-cyan-700" /> تحقق النشاط التجاري</CardTitle><CardDescription>يتطلب KYC ثم KYB وعضوية نشطة. التحقق التشغيلي لا يحل محل الاعتماد التنظيمي النهائي.</CardDescription></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2"><Label>الجهة التجارية</Label><select value={activityBusinessId} onChange={event => setActivityBusinessId(event.target.value)} className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"><option value="">اختر جهة</option>{businesses.map(business => <option key={business.id} value={business.id}>{business.legalName} · {business.verificationStatus}</option>)}</select></div>
            <div className="space-y-2"><Label>النشاط التشغيلي</Label><select value={businessActivityType} onChange={event => setBusinessActivityType(event.target.value as BusinessActivityType)} className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm">{Object.entries(businessLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>
            <div className="space-y-2"><Label>مرجع دليل اختياري</Label><Input value={businessEvidence} onChange={event => setBusinessEvidence(event.target.value)} placeholder="مرجع وصفي فقط" /></div>
            <Button disabled={!activityBusinessId || submitBusinessActivity.isPending} onClick={() => submitBusinessActivity.mutate({ businessId: Number(activityBusinessId), activityType: businessActivityType, evidenceReference: businessEvidence || undefined })} className="w-full bg-cyan-700 hover:bg-cyan-800">{submitBusinessActivity.isPending ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : null}إرسال تحقق النشاط</Button>
            <div className="space-y-2">{businessActivities.length === 0 ? <p className="text-sm text-slate-500">لا يوجد تحقق نشاط تجاري مسجل بعد.</p> : businessActivities.map(activity => <div key={activity.id} className="flex items-center justify-between rounded-lg border border-slate-100 p-3"><div><p className="font-semibold text-slate-900">{activity.businessName} · {businessLabels[activity.activityType]}</p><p className="mt-1 text-xs text-slate-500">سجل تشغيلي رقم {activity.id}</p></div><Badge variant="outline" className={statusStyle[activity.verificationStatus] ?? statusStyle.unverified}>{activity.verificationStatus}</Badge></div>)}</div>
          </CardContent>
        </Card>
      </div> : null}

      {!isLoading ? <Card className="border-violet-100 bg-violet-50/30">
        <CardHeader><CardTitle className="flex items-center gap-2 text-lg text-slate-900"><ShieldCheck className="h-5 w-5 text-violet-700" /> مفسر أهلية العلاقة</CardTitle><CardDescription>يجمع هذا الفحص بين حالة الهوية أو الكيان وحالة النشاط وقواعد الاستبعاد. النتيجة مدققة ولا تنشئ صفقة.</CardDescription></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-lg border border-violet-100 bg-white p-4 space-y-3"><Label>الطرف المورّد</Label><select value={supplierKind} onChange={event => { setSupplierKind(event.target.value as TradePartyKind); setSupplierId(""); }} className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"><option value="business">جهة تجارية</option><option value="individual">فرد</option></select><PartySelect kind={supplierKind} value={supplierId} onChange={setSupplierId} businesses={businesses} profiles={profiles} /></div>
            <div className="rounded-lg border border-violet-100 bg-white p-4 space-y-3"><Label>الطرف الطالب</Label><select value={requesterKind} onChange={event => { setRequesterKind(event.target.value as TradePartyKind); setRequesterId(""); }} className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"><option value="business">جهة تجارية</option><option value="individual">فرد</option></select><PartySelect kind={requesterKind} value={requesterId} onChange={setRequesterId} businesses={businesses} profiles={profiles} /></div>
          </div>
          <Button disabled={!supplierId || !requesterId || evaluateRelationship.isPending} onClick={() => evaluateRelationship.mutate({ supplierKind, supplierBusinessId: supplierKind === "business" ? Number(supplierId) : undefined, supplierIndividualProfileId: supplierKind === "individual" ? Number(supplierId) : undefined, requesterKind, requesterBusinessId: requesterKind === "business" ? Number(requesterId) : undefined, requesterIndividualProfileId: requesterKind === "individual" ? Number(requesterId) : undefined })} className="bg-violet-700 hover:bg-violet-800">{evaluateRelationship.isPending ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : null}تقييم العلاقة</Button>
          {evaluateRelationship.data ? <div className={`rounded-lg border p-4 ${decisionStyle[evaluateRelationship.data.decision]}`}><div className="flex flex-wrap items-center justify-between gap-2"><p className="font-bold">{evaluateRelationship.data.decision === "allow" ? "مسموح" : evaluateRelationship.data.decision === "manual_review" ? "مراجعة يدوية" : "مرفوض"}</p><Badge variant="outline" className="border-current bg-white/40">{evaluateRelationship.data.relationshipMode.toUpperCase()} · {evaluateRelationship.data.score}/100</Badge></div><p className="mt-2 font-mono text-xs">{evaluateRelationship.data.decisionReason}</p></div> : null}
          <p className="text-xs leading-5 text-slate-600"><CheckCircle2 className="ml-1 inline h-4 w-4 text-teal-600" />ملاحظة نطاق: العلاقات الحكومية والمدفوعات والاعتماد التنظيمي النهائي ليست ضمن التشغيل الحالي، وتحوّل القواعد الحكومية إلى مراجعة يدوية.</p>
        </CardContent>
      </Card> : null}
    </section>
  );
}
