import { useState } from "react";
import { startLogin } from "@/const";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";

const PATTERNS = {
  C2C: "سوق مستعمل، من شخص لشخص",
  C2B: "شخص أو ورشة بيورّد لمصنع أو مصدّر أو شركة",
  B2C: "متجر بيبيع للمستهلك",
  B2B: "مصنع أو مستورد بيورّد للمتاجر",
  B2G: "متجر أو مصنع أو مستورد بيورّد لجهة حكومية",
} as const;

type PatternKey = keyof typeof PATTERNS;
type BusinessType = "factory" | "importer" | "exporter" | "store" | "service_provider";

const statusLabels: Record<string, string> = {
  unverified: "غير مكتمل",
  pending: "قيد المراجعة",
  verified: "تم التحقق",
  rejected: "مرفوض ويحتاج مراجعة",
  expired: "منتهي الصلاحية",
  suspended: "معلّق",
};

const panelStyle: React.CSSProperties = {
  width: "min(100%, 760px)",
  marginTop: 28,
  padding: 24,
  border: "1px solid #dbe4ee",
  borderRadius: 20,
  background: "#fff",
  boxShadow: "0 18px 50px rgba(15, 42, 68, 0.12)",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  border: "1px solid #cbd5e1",
  borderRadius: 10,
  padding: "11px 12px",
  fontSize: 14,
  color: "#0f2a44",
  background: "#fff",
};

export default function Home() {
  const [active, setActive] = useState<PatternKey | null>(null);
  const { user, loading, isAuthenticated, logout } = useAuth();
  const utils = trpc.useUtils();
  const kycQuery = trpc.verification.kyc.me.useQuery(undefined, { enabled: isAuthenticated });
  const businessesQuery = trpc.businesses.list.useQuery(undefined, { enabled: isAuthenticated });
  const kybQuery = trpc.verification.kyb.list.useQuery(undefined, { enabled: isAuthenticated });

  const [countryCode, setCountryCode] = useState("EG");
  const [identityReference, setIdentityReference] = useState("");
  const [providerReference, setProviderReference] = useState("");
  const [documentMetadataJson, setDocumentMetadataJson] = useState("");
  const [legalName, setLegalName] = useState("");
  const [tradeName, setTradeName] = useState("");
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [entityType, setEntityType] = useState<BusinessType>("store");
  const [selectedBusinessId, setSelectedBusinessId] = useState("");
  const [kybProviderReference, setKybProviderReference] = useState("");
  const [kybRegistrationReference, setKybRegistrationReference] = useState("");
  const [kybMetadataJson, setKybMetadataJson] = useState("");

  const kycStatus = kycQuery.data?.latest?.status ?? kycQuery.data?.lifecycleStatus ?? "unverified";
  const kycSubmit = trpc.verification.kyc.submit.useMutation({
    onSuccess: async () => {
      setIdentityReference("");
      setProviderReference("");
      setDocumentMetadataJson("");
      await utils.verification.kyc.me.invalidate();
    },
  });
  const businessCreate = trpc.businesses.create.useMutation({
    onSuccess: async business => {
      setLegalName("");
      setTradeName("");
      setRegistrationNumber("");
      setSelectedBusinessId(String(business.id));
      await utils.businesses.list.invalidate();
    },
  });
  const kybSubmit = trpc.verification.kyb.submit.useMutation({
    onSuccess: async () => {
      setKybProviderReference("");
      setKybRegistrationReference("");
      setKybMetadataJson("");
      await utils.verification.kyb.list.invalidate();
      await utils.businesses.list.invalidate();
    },
  });

  const errorMessage = (error: unknown) => (error instanceof Error ? error.message : "تعذر إتمام العملية. حاول مرة أخرى.");
  const businesses = businessesQuery.data ?? [];
  const latestKyb = kybQuery.data?.[0];

  const submitKyc = () => {
    if (identityReference.trim().length < 2) return;
    kycSubmit.mutate({
      countryCode,
      identityReference: identityReference.trim(),
      providerReference: providerReference.trim() || undefined,
      documentMetadataJson: documentMetadataJson.trim() || undefined,
    });
  };

  const submitKyb = () => {
    if (!selectedBusinessId) return;
    kybSubmit.mutate({
      businessId: Number(selectedBusinessId),
      providerReference: kybProviderReference.trim() || undefined,
      registrationReference: kybRegistrationReference.trim() || undefined,
      documentMetadataJson: kybMetadataJson.trim() || undefined,
    });
  };

  return (
    <div dir="rtl" style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", background: "#fff", fontFamily: "Alexandria, Tajawal, sans-serif", padding: "16px 16px 48px", overflow: "hidden" }}>
      <div style={{ width: "100%", maxWidth: 900, position: "relative", textAlign: "center", marginBottom: 8 }}>
        <div style={{ fontFamily: "Inter, sans-serif", fontWeight: 800, fontSize: 32, letterSpacing: 1.5, color: "#0f2a44" }}>COME-IN-IT</div>
        <div style={{ position: "absolute", top: 8, left: 0, fontSize: 13, color: "#64748b" }}>AR | EN</div>
      </div>

      <div style={{ position: "relative", width: "min(88vw, 460px)", aspectRatio: "1", marginTop: 8 }}>
        <div style={{ position: "absolute", inset: "-14%", display: "flex", alignItems: "center", justifyContent: "center", opacity: 0.22, pointerEvents: "none" }}>
          <svg viewBox="0 0 200 200" width="100%" height="100%" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="1.2" aria-hidden="true">
            <path d="M55 35 L125 28 L150 45 L162 70 L155 105 L140 140 L105 165 L70 155 L48 120 L35 85 L42 55 Z" />
            <path d="M95 165 L110 185 L125 170 L115 150 Z" />
          </svg>
          <span style={{ position: "absolute", fontSize: 120, fontWeight: 900, color: "#e2e8f0", fontFamily: "Inter, sans-serif" }}>EG</span>
        </div>

        <div style={{ position: "absolute", inset: 0, borderRadius: "50%", border: "2px solid #0f2a44", display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(255,255,255,0.55)" }}>
          {Object.keys(PATTERNS).map((key, index) => {
            const angle = (index * 72 - 90) * Math.PI / 180;
            const x = 50 + 38 * Math.cos(angle);
            const y = 50 + 38 * Math.sin(angle);
            const isActive = active === key;
            return (
              <button key={key} type="button" onClick={() => setActive(key as PatternKey)} style={{ position: "absolute", left: `${x}%`, top: `${y}%`, transform: "translate(-50%,-50%)", background: isActive ? "#0f2a44" : "#fff", color: isActive ? "#fff" : "#0f2a44", border: "1.5px solid #0f2a44", borderRadius: 999, padding: "10px 14px", fontFamily: "Inter, sans-serif", fontWeight: 700, cursor: "pointer", zIndex: 2 }}>{key}</button>
            );
          })}
          <button type="button" onClick={startLogin} style={{ background: "#0f2a44", color: "#fff", border: "none", borderRadius: 999, padding: "18px 34px", fontSize: 22, fontWeight: 700, cursor: "pointer", zIndex: 2 }}>ادخل</button>
        </div>
      </div>

      <div style={{ marginTop: 14, minHeight: 24, fontSize: 16, color: "#334155", textAlign: "center" }}>
        {active ? PATTERNS[active] : "اختار نمط عشان تشوف شرحه"}
      </div>
      <button type="button" onClick={startLogin} style={{ marginTop: 6, border: 0, background: "transparent", fontSize: 14, color: "#0f766e", textDecoration: "underline", cursor: "pointer" }}>سجل الآن</button>
      <div style={{ marginTop: 10, fontSize: 12, color: "#94a3b8" }}>كل الأنماط في دايرة واحدة مقفولة جوه مصر</div>

      {loading ? <div style={panelStyle}>جاري تجهيز جلسة المستخدم…</div> : null}

      {!loading && !isAuthenticated ? (
        <div style={{ ...panelStyle, textAlign: "center" }}>
          <h2 style={{ margin: "0 0 8px", color: "#0f2a44" }}>ابدأ بحسابك الشخصي</h2>
          <p style={{ margin: 0, color: "#64748b", lineHeight: 1.8 }}>التسجيل والدخول يتمان عبر بوابة آمنة. بعد العودة إلى المنصة تبدأ خطوة KYC، ولا يتم فتح KYB قبل اعتماد هويتك.</p>
          <button type="button" onClick={startLogin} style={{ marginTop: 18, background: "#0f2a44", color: "#fff", border: 0, borderRadius: 10, padding: "12px 24px", cursor: "pointer", fontWeight: 700 }}>إنشاء حساب أو تسجيل الدخول</button>
        </div>
      ) : null}

      {!loading && isAuthenticated ? (
        <section style={panelStyle} aria-labelledby="account-title">
          <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "flex-start", flexWrap: "wrap" }}>
            <div>
              <h2 id="account-title" style={{ margin: 0, color: "#0f2a44" }}>حساب المستخدم</h2>
              <p style={{ margin: "6px 0 0", color: "#64748b" }}>{user?.name || user?.email || "مستخدم مسجل"}</p>
            </div>
            <button type="button" onClick={() => logout()} style={{ border: "1px solid #cbd5e1", background: "#fff", color: "#0f2a44", borderRadius: 8, padding: "8px 14px", cursor: "pointer" }}>تسجيل الخروج</button>
          </div>

          <div style={{ marginTop: 22, padding: 18, borderRadius: 14, background: "#f8fafc", border: "1px solid #e2e8f0" }}>
            <h3 style={{ margin: 0, color: "#0f2a44" }}>الخطوة الأولى: KYC</h3>
            <p style={{ color: "#64748b", lineHeight: 1.7, marginBottom: 14 }}>يجب إتمام مسح وثيقة الهوية عبر مزود KYC معتمد. نخزن مرجع العملية وحالتها فقط، ولا نرفع صورة الهوية إلى قاعدة البيانات.</p>
            <strong style={{ color: kycStatus === "verified" ? "#047857" : "#b45309" }}>الحالة: {statusLabels[kycStatus] ?? kycStatus}</strong>
            {kycStatus === "unverified" || kycStatus === "rejected" || kycStatus === "expired" ? (
              <div style={{ display: "grid", gap: 10, marginTop: 14 }}>
                <input style={inputStyle} value={identityReference} onChange={event => setIdentityReference(event.target.value)} placeholder="مرجع جلسة مسح الهوية من مزود KYC" aria-label="مرجع جلسة مسح الهوية" />
                <input style={inputStyle} value={providerReference} onChange={event => setProviderReference(event.target.value)} placeholder="مرجع مزود KYC (اختياري)" aria-label="مرجع مزود KYC" />
                <input style={inputStyle} value={countryCode} onChange={event => setCountryCode(event.target.value.toUpperCase().slice(0, 2))} placeholder="رمز الدولة مثل EG" aria-label="رمز الدولة" />
                <textarea style={{ ...inputStyle, minHeight: 76, resize: "vertical" }} value={documentMetadataJson} onChange={event => setDocumentMetadataJson(event.target.value)} placeholder='بيانات وصفية غير حساسة بصيغة JSON، مثال: {"documentType":"national_id"}' aria-label="بيانات وصفية لوثيقة الهوية" />
                <button type="button" disabled={kycSubmit.isPending || identityReference.trim().length < 2} onClick={submitKyc} style={{ background: "#0f766e", color: "#fff", border: 0, borderRadius: 10, padding: "12px", cursor: "pointer", opacity: kycSubmit.isPending || identityReference.trim().length < 2 ? 0.6 : 1 }}>إرسال KYC للمراجعة</button>
                {kycSubmit.error ? <p style={{ color: "#b91c1c", margin: 0 }}>{errorMessage(kycSubmit.error)}</p> : null}
              </div>
            ) : null}
            {kycStatus === "pending" ? <p style={{ color: "#92400e", lineHeight: 1.7 }}>تم إرسال الطلب. لن يتم فتح تسجيل KYB حتى تعتمد المراجعة.</p> : null}
          </div>

          {kycStatus === "verified" ? (
            <div style={{ marginTop: 18, padding: 18, borderRadius: 14, background: "#f0fdf4", border: "1px solid #bbf7d0" }}>
              <h3 style={{ margin: 0, color: "#166534" }}>الخطوة الثانية: KYB</h3>
              <p style={{ color: "#365314", lineHeight: 1.7 }}>بعد اعتماد هويتك، يمكنك إنشاء كيان تجاري ثم إرسال طلب KYB للمتجر أو المصنع أو المستورد أو المصدر أو الخدمات.</p>
              {businesses.length === 0 ? (
                <div style={{ display: "grid", gap: 10 }}>
                  <input style={inputStyle} value={legalName} onChange={event => setLegalName(event.target.value)} placeholder="الاسم القانوني للمنشأة" aria-label="الاسم القانوني" />
                  <input style={inputStyle} value={tradeName} onChange={event => setTradeName(event.target.value)} placeholder="الاسم التجاري (اختياري)" aria-label="الاسم التجاري" />
                  <input style={inputStyle} value={registrationNumber} onChange={event => setRegistrationNumber(event.target.value)} placeholder="رقم التسجيل (اختياري)" aria-label="رقم التسجيل" />
                  <select style={inputStyle} value={entityType} onChange={event => setEntityType(event.target.value as BusinessType)} aria-label="نوع المنشأة">
                    <option value="store">متجر</option>
                    <option value="factory">مصنع</option>
                    <option value="importer">مستورد</option>
                    <option value="exporter">مصدر</option>
                    <option value="service_provider">خدمات</option>
                  </select>
                  <button type="button" disabled={businessCreate.isPending || legalName.trim().length < 2} onClick={() => businessCreate.mutate({ legalName: legalName.trim(), tradeName: tradeName.trim() || undefined, registrationNumber: registrationNumber.trim() || undefined, entityType })} style={{ background: "#166534", color: "#fff", border: 0, borderRadius: 10, padding: "12px", cursor: "pointer", opacity: businessCreate.isPending || legalName.trim().length < 2 ? 0.6 : 1 }}>إنشاء الكيان التجاري</button>
                  {businessCreate.error ? <p style={{ color: "#b91c1c", margin: 0 }}>{errorMessage(businessCreate.error)}</p> : null}
                </div>
              ) : (
                <div style={{ display: "grid", gap: 10 }}>
                  <select style={inputStyle} value={selectedBusinessId} onChange={event => setSelectedBusinessId(event.target.value)} aria-label="اختيار الكيان التجاري">
                    <option value="">اختر الكيان التجاري</option>
                    {businesses.map(business => <option key={business.id} value={String(business.id)}>{business.legalName}</option>)}
                  </select>
                  <input style={inputStyle} value={kybProviderReference} onChange={event => setKybProviderReference(event.target.value)} placeholder="مرجع مزود KYB (اختياري)" aria-label="مرجع مزود KYB" />
                  <input style={inputStyle} value={kybRegistrationReference} onChange={event => setKybRegistrationReference(event.target.value)} placeholder="مرجع السجل التجاري (اختياري)" aria-label="مرجع السجل التجاري" />
                  <textarea style={{ ...inputStyle, minHeight: 76, resize: "vertical" }} value={kybMetadataJson} onChange={event => setKybMetadataJson(event.target.value)} placeholder="بيانات وصفية غير حساسة للمنشأة بصيغة JSON" aria-label="بيانات وصفية للمنشأة" />
                  <button type="button" disabled={kybSubmit.isPending || !selectedBusinessId} onClick={submitKyb} style={{ background: "#166534", color: "#fff", border: 0, borderRadius: 10, padding: "12px", cursor: "pointer", opacity: kybSubmit.isPending || !selectedBusinessId ? 0.6 : 1 }}>إرسال طلب KYB</button>
                  {kybSubmit.error ? <p style={{ color: "#b91c1c", margin: 0 }}>{errorMessage(kybSubmit.error)}</p> : null}
                  {latestKyb ? <p style={{ color: "#365314", margin: 0 }}>آخر حالة KYB: {statusLabels[latestKyb.status] ?? latestKyb.status}</p> : null}
                </div>
              )}
            </div>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}
