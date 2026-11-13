import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { FileCheck2, ShieldAlert, ShieldCheck, Stethoscope, TimerReset } from "lucide-react";
import { toast } from "sonner";

const profileStatusLabel: Record<string, string> = {
  active: "نشط",
  suspended: "معلّق",
  archived: "مؤرشف",
};

const consentStatusLabel: Record<string, string> = {
  active: "سارية",
  revoked: "ملغاة",
  expired: "منتهية",
};

const recordSourceLabel: Record<string, string> = {
  patient_statement: "إفادة صاحب الملف",
  professional_encounter: "واقعة مهنية",
  laboratory_result: "نتيجة مختبرية",
  radiology_report: "تقرير أشعة",
  hospital_encounter: "واقعة مستشفى",
  medication_dispense: "صرف دواء",
  medical_document: "وثيقة طبية مرجعية",
};

const provenanceStatusLabel: Record<string, string> = {
  submitted: "مُحال للمراجعة",
  verified: "مرجع متحقق",
  rejected: "مرفوض",
  superseded: "استُبدل بتعديل",
};

function formatDate(value: Date | string) {
  return new Date(value).toLocaleDateString("ar-EG", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/**
 * Healthcare is deliberately isolated from commerce. This panel only handles
 * a verified identity reference, consent metadata and provider-facing scope;
 * it does not capture or render clinical records.
 */
export function HealthcareDomainDashboard() {
  const { isAuthenticated, loading } = useAuth();
  const utils = trpc.useUtils();
  const profileQuery = trpc.health.profile.me.useQuery(undefined, { enabled: isAuthenticated });
  const providersQuery = trpc.health.providers.listVerified.useQuery(undefined, { enabled: isAuthenticated });
  const hasProfile = Boolean(profileQuery.data?.profile);
  const recordReferencesQuery = trpc.health.records.listMine.useQuery(undefined, { enabled: isAuthenticated && hasProfile });
  const accessLogsQuery = trpc.health.access.listMine.useQuery(undefined, { enabled: isAuthenticated && hasProfile });
  const [identityReference, setIdentityReference] = useState("");
  const [providerId, setProviderId] = useState("");
  const [purposeCode, setPurposeCode] = useState("care_continuity");
  const [scopeCode, setScopeCode] = useState("care_summary");
  const [evidenceHash, setEvidenceHash] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [recordSourceType, setRecordSourceType] = useState("patient_statement");
  const [recordReferenceHash, setRecordReferenceHash] = useState("");
  const [recordIntegrityHash, setRecordIntegrityHash] = useState("");
  const [recordOccurredAt, setRecordOccurredAt] = useState("");

  const refresh = async () => {
    await Promise.all([
      utils.health.profile.me.invalidate(),
      utils.health.providers.listVerified.invalidate(),
      utils.health.records.listMine.invalidate(),
      utils.health.access.listMine.invalidate(),
    ]);
  };

  const createProfile = trpc.health.profile.create.useMutation({
    onSuccess: async () => {
      await refresh();
      setIdentityReference("");
      toast.success("تم إنشاء الملف الصحي المرجعي بعد التحقق من KYC.");
    },
    onError: error => toast.error(error.message || "تعذر إنشاء الملف الصحي المرجعي."),
  });

  const createConsent = trpc.health.consents.grant.useMutation({
    onSuccess: async () => {
      await refresh();
      setEvidenceHash("");
      toast.success("تم حفظ الموافقة المحددة النطاق وتسجيلها في سجل التدقيق.");
    },
    onError: error => toast.error(error.message || "تعذر حفظ الموافقة الصحية."),
  });

  const revokeConsent = trpc.health.consents.revoke.useMutation({
    onSuccess: async () => {
      await refresh();
      toast.success("تم إلغاء الموافقة وتسجيل الإلغاء في سجل التدقيق.");
    },
    onError: error => toast.error(error.message || "تعذر إلغاء الموافقة."),
  });

  const submitRecordReference = trpc.health.records.submitReference.useMutation({
    onSuccess: async () => {
      await refresh();
      setRecordReferenceHash("");
      setRecordIntegrityHash("");
      setRecordOccurredAt("");
      toast.success("تم تسجيل مرجع السجل وبصمته فقط للمراجعة؛ لم يُحفظ أي محتوى سريري.");
    },
    onError: error => toast.error(error.message || "تعذر تسجيل مرجع السجل الصحي."),
  });

  if (loading) {
    return <Card className="border-cyan-200 bg-white shadow-sm"><CardContent className="p-8 text-center text-sm text-slate-600">يجري التحقق من جلسة الحساب…</CardContent></Card>;
  }

  if (!isAuthenticated) {
    return (
      <Card className="border-cyan-200 bg-gradient-to-br from-cyan-50 via-white to-blue-50 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-slate-950"><Stethoscope className="h-5 w-5 text-cyan-700" /> نطاق Healthcare المعزول</CardTitle>
          <CardDescription className="text-slate-600">يتطلب الوصول تسجيل الدخول. لا تُعرض هنا سجلات سريرية أو مستندات صحية خام.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => startLogin()} className="bg-cyan-700 hover:bg-cyan-800">تسجيل الدخول لعرض حالة الموافقة</Button>
        </CardContent>
      </Card>
    );
  }

  if (profileQuery.isLoading || providersQuery.isLoading || (hasProfile && (recordReferencesQuery.isLoading || accessLogsQuery.isLoading))) {
    return <Card className="border-cyan-200 bg-white shadow-sm"><CardContent className="p-8 text-center text-sm text-slate-600">يجري تحميل حالة الملف الصحي والموافقات…</CardContent></Card>;
  }

  if (profileQuery.isError || providersQuery.isError || recordReferencesQuery.isError || accessLogsQuery.isError) {
    return (
      <Card className="border-rose-200 bg-rose-50 shadow-sm">
        <CardContent className="flex flex-wrap items-center justify-between gap-4 p-6 text-sm text-rose-900">
          <span>تعذر تحميل نطاق Healthcare. لم يتم عرض أو إرسال أي محتوى سريري.</span>
          <Button variant="outline" onClick={() => void refresh()}>إعادة المحاولة</Button>
        </CardContent>
      </Card>
    );
  }

  const summary = profileQuery.data;
  const profile = summary?.profile;
  const providers = providersQuery.data ?? [];
  const kycVerified = summary?.kycStatus === "verified";

  return (
    <section className="space-y-6" dir="rtl">
      <Card className="overflow-hidden border-cyan-200 bg-gradient-to-br from-slate-950 via-cyan-950 to-slate-900 text-white shadow-xl">
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2 text-xl"><ShieldCheck className="h-5 w-5 text-cyan-300" /> COME IN IT Health — Consent Boundary</CardTitle>
              <CardDescription className="mt-2 max-w-3xl text-slate-300">نطاق صحي Phase 2 مستقل عن التجارة. يعيد استخدام الهوية المتحققة كمرجع فقط، ويفرض الحد الأدنى من الغرض والنطاق والزمن.</CardDescription>
            </div>
            <Badge className="border border-cyan-300/30 bg-cyan-400/10 text-cyan-100">لا محتوى سريرياً في الواجهة</Badge>
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-slate-200 bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-slate-950">الهوية والملف الصحي المرجعي</CardTitle>
            <CardDescription className="text-slate-600">لا يُنشأ الملف إلا بعد KYC متحقق. المعرّف المدخل هو مرجع خارجي فقط وليس محتوى طبياً.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm">
              <span className="text-slate-600">حالة KYC</span>
              <Badge className={kycVerified ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-amber-200 bg-amber-50 text-amber-800"}>{kycVerified ? "متحقق" : "غير مؤهل بعد"}</Badge>
            </div>
            {profile ? (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-950">
                <div className="flex items-center justify-between gap-3"><span className="font-semibold">الملف الصحي المرجعي</span><Badge className="border-emerald-200 bg-white text-emerald-800">{profileStatusLabel[profile.status] ?? profile.status}</Badge></div>
                <p className="mt-2 text-emerald-800">أُنشئ في {formatDate(profile.createdAt)}. لا يعرض هذا القسم أي تشخيص أو نتيجة أو وثيقة صحية.</p>
              </div>
            ) : (
              <div className="space-y-3 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4">
                <p className="text-sm text-slate-600">لا يوجد ملف صحي مرجعي. يلزم KYC متحقق قبل الإنشاء.</p>
                <Input value={identityReference} onChange={event => setIdentityReference(event.target.value)} placeholder="مرجع هوية خارجي غير سريري (8 أحرف فأكثر)" disabled={!kycVerified || createProfile.isPending} />
                <Button disabled={!kycVerified || identityReference.trim().length < 8 || createProfile.isPending} onClick={() => createProfile.mutate({ healthIdentityReference: identityReference.trim() })} className="bg-cyan-700 hover:bg-cyan-800">إنشاء ملف مرجعي</Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-slate-950">سياسة الوصول والطوارئ</CardTitle>
            <CardDescription className="text-slate-600">كل وصول يتطلب غرضاً ونطاقاً ومدة صريحة، ويُسجل في سجل وصول مستقل قابل للتدقيق.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-700">
            <div className="flex gap-3 rounded-lg border border-cyan-100 bg-cyan-50 p-3"><ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-cyan-700" /><p><strong>الطوارئ ليست تجاوزاً عاماً:</strong> تتطلب سبباً مصرحاً به، ودوراً مخصصاً، ونافذة زمنية قصيرة، ثم مراجعة لاحقة.</p></div>
            <div className="flex gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3"><TimerReset className="mt-0.5 h-5 w-5 shrink-0 text-slate-700" /><p>الموافقة تنتهي تلقائياً في تاريخ محدد، ويمكن إلغاؤها فوراً من سجل الموافقات.</p></div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-slate-200 bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="text-slate-950">الموافقات الصحية المحكومة</CardTitle>
          <CardDescription className="text-slate-600">تُنشأ الموافقة لمزود متحقق، لغرض ونطاق محدودين، دون حفظ أو عرض محتوى الملف الصحي.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {profile && providers.length > 0 ? (
            <div className="grid gap-3 rounded-xl border border-cyan-100 bg-cyan-50/50 p-4 md:grid-cols-2">
              <select value={providerId} onChange={event => setProviderId(event.target.value)} className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900"><option value="">اختر مزوداً صحياً متحققاً</option>{providers.map(provider => <option key={provider.id} value={provider.id}>{provider.legalName} — {provider.providerType}</option>)}</select>
              <Input value={purposeCode} onChange={event => setPurposeCode(event.target.value)} placeholder="غرض الوصول" />
              <Input value={scopeCode} onChange={event => setScopeCode(event.target.value)} placeholder="نطاق الوصول" />
              <Input value={evidenceHash} onChange={event => setEvidenceHash(event.target.value)} placeholder="بصمة SHA-256 لإثبات الموافقة (64 رمزاً سداسياً)" />
              <Input type="date" value={expiryDate} onChange={event => setExpiryDate(event.target.value)} />
              <Button disabled={!providerId || !purposeCode.trim() || !scopeCode.trim() || !/^[a-fA-F0-9]{64}$/.test(evidenceHash.trim()) || !expiryDate || createConsent.isPending} onClick={() => createConsent.mutate({ beneficiaryProviderId: Number(providerId), purposeCode: purposeCode.trim(), scopeCodes: [scopeCode.trim()], evidenceHash: evidenceHash.trim(), expiresAt: new Date(`${expiryDate}T23:59:59.000Z`) })} className="bg-cyan-700 hover:bg-cyan-800">حفظ الموافقة المحددة</Button>
            </div>
          ) : profile ? <p className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">لا يوجد مزود صحي متحقق حالياً. لا يمكن إصدار موافقة قبل اعتماد المزود.</p> : null}

          {(summary?.consents ?? []).length === 0 ? (
            <p className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-5 text-center text-sm text-slate-600">لا توجد موافقات صحية محفوظة حتى الآن.</p>
          ) : (
            <div className="space-y-3">{summary?.consents.map(consent => <div key={consent.id} className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-slate-200 p-4"><div><p className="font-semibold text-slate-900">{consent.providerName}</p><p className="mt-1 text-xs text-slate-500">الغرض: {consent.purposeCode} · ينتهي: {formatDate(consent.expiresAt)}</p></div><div className="flex items-center gap-3"><Badge className={consent.status === "active" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-slate-200 bg-slate-50 text-slate-700"}>{consentStatusLabel[consent.status] ?? consent.status}</Badge>{consent.status === "active" && <Button variant="outline" size="sm" disabled={revokeConsent.isPending} onClick={() => revokeConsent.mutate({ consentId: consent.id, revocationReason: "revoked_by_subject" })}>إلغاء</Button>}</div></div>)}</div>
          )}
        </CardContent>
      </Card>

      {profile && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="border-slate-200 bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-slate-950"><FileCheck2 className="h-5 w-5 text-cyan-700" /> مراجع السجل وسلسلة المصدر</CardTitle>
              <CardDescription className="text-slate-600">تسجل المنصة بصمتين مرجعيتين وحالة المراجعة فقط. لا تُخزن أو تُعرض نتيجة أو تشخيص أو ملف طبي.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 rounded-xl border border-cyan-100 bg-cyan-50/50 p-4 md:grid-cols-2">
                <select value={recordSourceType} onChange={event => setRecordSourceType(event.target.value)} className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900">
                  {Object.entries(recordSourceLabel).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
                <Input type="date" value={recordOccurredAt} onChange={event => setRecordOccurredAt(event.target.value)} />
                <Input value={recordReferenceHash} onChange={event => setRecordReferenceHash(event.target.value)} placeholder="بصمة مرجع خارجي SHA-256" />
                <Input value={recordIntegrityHash} onChange={event => setRecordIntegrityHash(event.target.value)} placeholder="بصمة النزاهة SHA-256" />
                <Button
                  className="bg-cyan-700 hover:bg-cyan-800 md:col-span-2"
                  disabled={recordSourceType !== "patient_statement" || !recordOccurredAt || !/^[a-fA-F0-9]{64}$/.test(recordReferenceHash.trim()) || !/^[a-fA-F0-9]{64}$/.test(recordIntegrityHash.trim()) || submitRecordReference.isPending}
                  onClick={() => submitRecordReference.mutate({ sourceType: "patient_statement", externalReferenceHash: recordReferenceHash.trim(), integrityHash: recordIntegrityHash.trim(), occurredAt: new Date(`${recordOccurredAt}T00:00:00.000Z`) })}
                >تسجيل مرجع صاحب الملف</Button>
              </div>
              {(recordReferencesQuery.data ?? []).length === 0 ? <p className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-center text-sm text-slate-600">لا توجد مراجع سجلات محفوظة حتى الآن.</p> : <div className="space-y-3">{recordReferencesQuery.data?.map(record => <div key={record.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 p-4"><div><p className="font-semibold text-slate-900">{recordSourceLabel[record.sourceType] ?? record.sourceType}</p><p className="mt-1 text-xs text-slate-500">الواقعة: {formatDate(record.occurredAt)} · الإحالة: {formatDate(record.submittedAt)}</p></div><Badge className="border-cyan-200 bg-cyan-50 text-cyan-800">{provenanceStatusLabel[record.provenanceStatus] ?? record.provenanceStatus}</Badge></div>)}</div>}
            </CardContent>
          </Card>

          <Card className="border-slate-200 bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="text-slate-950">سجل قرار الوصول</CardTitle>
              <CardDescription className="text-slate-600">يعرض الغرض وقرار السماح أو الرفض فقط؛ تُحجب رموز النطاق والبصمات وأي محتوى سريري.</CardDescription>
            </CardHeader>
            <CardContent>
              {(accessLogsQuery.data ?? []).length === 0 ? <p className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-center text-sm text-slate-600">لم تُسجل قرارات وصول لهذا الملف بعد.</p> : <div className="space-y-3">{accessLogsQuery.data?.map(log => <div key={log.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 p-4"><div><p className="font-semibold text-slate-900">{log.providerName ?? "مزود صحي"}</p><p className="mt-1 text-xs text-slate-500">الغرض: {log.purposeCode} · {formatDate(log.createdAt)}</p></div><Badge className={log.decision === "allowed" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-rose-200 bg-rose-50 text-rose-800"}>{log.decision === "allowed" ? "مسموح" : "مرفوض"}</Badge></div>)}</div>}
            </CardContent>
          </Card>
        </div>
      )}
    </section>
  );
}
