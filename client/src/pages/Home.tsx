import { useState } from "react";
import { startLogin } from "@/const";
import { useAuth } from "@/_core/hooks/useAuth";

const PATTERNS = {
  C2C: "سوق مستعمل، من شخص لشخص",
  C2B: "شخص أو ورشة بيورّد لمصنع أو مصدّر أو شركة",
  B2C: "متجر بيبيع للمستهلك",
  B2B: "مصنع أو مستورد بيورّد للمتاجر",
  B2G: "متجر أو مصنع أو مستورد بيورّد لجهة حكومية",
} as const;

type PatternKey = keyof typeof PATTERNS;
type AuthMode = "login" | "register" | null;

export default function Home() {
  const [active, setActive] = useState<PatternKey | null>(null);
  const [authMode, setAuthMode] = useState<AuthMode>(null);
  const { user, loading, isAuthenticated } = useAuth();

  return (
    <div
      dir="rtl"
      lang="ar"
      translate="no"
      className="notranslate"
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "#fff",
        fontFamily: "Alexandria, Tajawal, sans-serif",
        padding: 16,
        position: "relative",
      }}
    >
      <div style={{ width: "100%", maxWidth: 900, position: "relative", textAlign: "center", marginBottom: 8 }}>
        <div style={{ fontFamily: "Inter, sans-serif", fontWeight: 800, fontSize: 32, letterSpacing: 1.5, color: "#0f2a44" }}>
          COME-IN-IT
        </div>
        <div style={{ position: "absolute", top: 8, left: 0, fontSize: 13, color: "#64748b" }}>AR | EN</div>
        {isAuthenticated && user && (
          <div style={{ position: "absolute", top: 8, right: 0, fontSize: 13, color: "#0f766e", fontWeight: 600 }}>
            مرحباً{user.name ? `، ${user.name}` : ""}
          </div>
        )}
      </div>

      <div style={{ position: "relative", width: "min(88vw, 460px)", aspectRatio: "1", marginTop: 8 }}>
        <div style={{ position: "absolute", inset: "-14%", display: "flex", alignItems: "center", justifyContent: "center", opacity: 0.22, pointerEvents: "none" }}>
          <svg viewBox="0 0 200 200" width="100%" height="100%" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="1.2">
            <path d="M55 35 L125 28 L150 45 L162 70 L155 105 L140 140 L105 165 L70 155 L48 120 L35 85 L42 55 Z" />
            <path d="M95 165 L110 185 L125 170 L115 150 Z" />
          </svg>
        </div>

        <div style={{ position: "absolute", inset: 0, borderRadius: "50%", border: "2px solid #0f2a44", display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(255,255,255,0.55)" }}>
          {(Object.keys(PATTERNS) as PatternKey[]).map((k, i) => {
            const angle = ((i * 72 - 90) * Math.PI) / 180;
            const x = 50 + 38 * Math.cos(angle);
            const y = 50 + 38 * Math.sin(angle);
            const isActive = active === k;
            return (
              <button
                key={k}
                type="button"
                onClick={() => setActive(k)}
                style={{
                  position: "absolute",
                  left: `${x}%`,
                  top: `${y}%`,
                  transform: "translate(-50%, -50%)",
                  background: isActive ? "#0f2a44" : "#fff",
                  color: isActive ? "#fff" : "#0f2a44",
                  border: "1.5px solid #0f2a44",
                  borderRadius: 999,
                  padding: "10px 14px",
                  fontFamily: "Inter, sans-serif",
                  fontWeight: 700,
                  cursor: "pointer",
                  zIndex: 2,
                }}
              >
                {k}
              </button>
            );
          })}

          <button
            type="button"
            onClick={() => setAuthMode("login")}
            disabled={loading}
            translate="no"
            style={{
              background: "#0f2a44",
              color: "#fff",
              border: "none",
              borderRadius: 999,
              padding: "18px 34px",
              fontSize: 22,
              fontWeight: 700,
              cursor: loading ? "wait" : "pointer",
              zIndex: 2,
            }}
          >
            ادخل
          </button>
        </div>
      </div>

      <div style={{ marginTop: 14, minHeight: 24, fontSize: 16, color: "#334155", textAlign: "center" }}>
        {active ? PATTERNS[active] : "اختار نمط عشان تشوف شرحه"}
      </div>

      <button
        type="button"
        onClick={() => setAuthMode("register")}
        translate="no"
        style={{
          marginTop: 8,
          fontSize: 14,
          color: "#0f766e",
          textDecoration: "underline",
          background: "none",
          border: "none",
          cursor: "pointer",
          fontFamily: "inherit",
        }}
      >
        سجل الآن
      </button>

      <div style={{ marginTop: 10, fontSize: 12, color: "#94a3b8" }}>
        كل الأنماط في دايرة واحدة مقفولة جوه مصر
      </div>

      {authMode && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 42, 68, 0.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
            zIndex: 50,
          }}
          onClick={() => setAuthMode(null)}
        >
          <div
            lang="ar"
            translate="no"
            className="notranslate"
            style={{
              width: "100%",
              maxWidth: 420,
              background: "#fff",
              borderRadius: 20,
              border: "1px solid #e2e8f0",
              boxShadow: "0 25px 50px -12px rgba(15, 42, 68, 0.25)",
              padding: "28px 24px",
              textAlign: "right",
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ fontSize: 12, fontWeight: 700, color: "#0f766e", marginBottom: 8 }}>
              {authMode === "login" ? "تسجيل الدخول" : "مستخدم جديد"}
            </div>

            <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#0f2a44", lineHeight: 1.35 }}>
              {authMode === "login" ? "مرحباً بعودتك إلى COME-IN-IT" : "أنشئ حسابك وابدأ التداول"}
            </h2>

            <p style={{ margin: "12px 0 0", fontSize: 14, lineHeight: 1.7, color: "#475569" }}>
              {authMode === "login"
                ? "هتتوجه لتسجيل دخول آمن عبر Manus OAuth. بعد النجاح هترجع للمنصة بنفس الجلسة."
                : "أول مرة؟ نفس المسار الآمن بينشئ هويتك. بعد الدخول تقدر تكمل التحقق (KYC) وتفعّل قدراتك التجارية."}
            </p>

            {active && (
              <div style={{ marginTop: 16, padding: "10px 12px", borderRadius: 12, background: "#f8fafc", border: "1px solid #e2e8f0", fontSize: 13, color: "#334155" }}>
                <strong>النمط المختار:</strong> {active} — {PATTERNS[active]}
              </div>
            )}

            <ol style={{ margin: "18px 0 0", padding: "0 18px 0 0", fontSize: 13, lineHeight: 1.8, color: "#64748b" }}>
              <li>مصادقة آمنة عبر OAuth</li>
              <li>إنشاء أو استرجاع الهوية الشخصية</li>
              <li>التحقق من الهوية (KYC) عند الحاجة</li>
              <li>تفعيل القدرات التجارية حسب دورك</li>
            </ol>

            <div style={{ display: "flex", gap: 10, marginTop: 24, flexDirection: "row-reverse" }}>
              <button
                type="button"
                onClick={() => startLogin()}
                style={{
                  flex: 1,
                  background: "#0f2a44",
                  color: "#fff",
                  border: "none",
                  borderRadius: 12,
                  padding: "14px 16px",
                  fontSize: 15,
                  fontWeight: 700,
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                {authMode === "login" ? "متابعة الدخول" : "إنشاء حساب والدخول"}
              </button>
              <button
                type="button"
                onClick={() => setAuthMode(null)}
                style={{
                  minWidth: 88,
                  background: "#fff",
                  color: "#475569",
                  border: "1px solid #e2e8f0",
                  borderRadius: 12,
                  padding: "14px 16px",
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                إلغاء
              </button>
            </div>

            <p style={{ margin: "14px 0 0", fontSize: 11, lineHeight: 1.6, color: "#94a3b8", textAlign: "center" }}>
              بالمتابعة هتتم إعادة توجيهك لبوابة OAuth. مفيش كلمة مرور بتتخزن على المنصة.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}