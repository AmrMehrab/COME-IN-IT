import { useState } from "react";

const PATTERNS = {
  "C2C": "سوق مستعمل، من شخص لشخص",
  "C2B": "شخص أو ورشة بيورّد لمصنع أو مصدّر أو شركة",
  "B2C": "متجر بيبيع للمستهلك",
  "B2B": "مصنع أو مستورد بيورّد للمتاجر",
  "B2G": "متجر أو مصنع أو مستورد بيورّد لجهة حكومية",
} as const;

type PatternKey = keyof typeof PATTERNS;

export default function Home() {
  const [active, setActive] = useState<PatternKey | null>(null);

  return (
    <div dir="rtl" style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#fff", fontFamily: "Alexandria, Tajawal, sans-serif", padding: 16, overflow: "hidden" }}>
      {/* COME-IN-IT في النص وأكبر */}
      <div style={{ width: "100%", maxWidth: 900, position: "relative", textAlign: "center", marginBottom: 8 }}>
        <div style={{ fontFamily: "Inter, sans-serif", fontWeight: 800, fontSize: 32, letterSpacing: 1.5, color: "#0f2a44", textAlign: "center" }}>COME-IN-IT</div>
        <div style={{ position: "absolute", top: 8, left: 0, fontSize: 13, color: "#64748b" }}>AR | EN</div>
      </div>

      {/* الدايرة + خريطة مصر أوضح وراها */}
      <div style={{ position: "relative", width: "min(88vw, 460px)", aspectRatio: "1", marginTop: 8 }}>
        {/* خريطة مصر أوضح */}
        <div style={{ position: "absolute", inset: "-14%", display: "flex", alignItems: "center", justifyContent: "center", opacity: 0.22, pointerEvents: "none" }}>
          <svg viewBox="0 0 200 200" width="100%" height="100%" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="1.2">
            <path d="M55 35 L125 28 L150 45 L162 70 L155 105 L140 140 L105 165 L70 155 L48 120 L35 85 L42 55 Z" />
            <path d="M95 165 L110 185 L125 170 L115 150 Z" />
          </svg>
          <span style={{ position: "absolute", fontSize: 120, fontWeight: 900, color: "#e2e8f0", fontFamily: "Inter, sans-serif" }}>EG</span>
        </div>

        <div style={{ position: "absolute", inset: 0, borderRadius: "50%", border: "2px solid #0f2a44", display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(255,255,255,0.55)" }}>
          {Object.keys(PATTERNS).map((k, i) => {
            const angle = (i * 72 - 90) * Math.PI / 180;
            const x = 50 + 38 * Math.cos(angle);
            const y = 50 + 38 * Math.sin(angle);
            const isActive = active === k;
            return (
              <button key={k} onClick={() => setActive(k as PatternKey)} style={{ position: "absolute", left: `${x}%`, top: `${y}%`, transform: "translate(-50%,-50%)", background: isActive ? "#0f2a44" : "#fff", color: isActive ? "#fff" : "#0f2a44", border: "1.5px solid #0f2a44", borderRadius: 999, padding: "10px 14px", fontFamily: "Inter, sans-serif", fontWeight: 700, cursor: "pointer", zIndex: 2 }}>{k}</button>
            );
          })}
          <button style={{ background: "#0f2a44", color: "#fff", border: "none", borderRadius: 999, padding: "18px 34px", fontSize: 22, fontWeight: 700, cursor: "pointer", zIndex: 2 }}>ادخل</button>
        </div>
      </div>

      {/* الشرح تحت الدايرة */}
      <div style={{ marginTop: 14, minHeight: 24, fontSize: 16, color: "#334155", textAlign: "center" }}>
        {active ? PATTERNS[active] : "اختار نمط عشان تشوف شرحه"}
      </div>
      {/* سجل الآن تحت الدايرة */}
      <a href="#" style={{ marginTop: 6, fontSize: 14, color: "#0f766e", textDecoration: "underline" }}>سجل الآن</a>
      <div style={{ marginTop: 10, fontSize: 12, color: "#94a3b8" }}>كل الأنماط في دايرة واحدة مقفولة جوه مصر</div>
    </div>
  );
}