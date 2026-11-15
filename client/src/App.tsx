import { useState } from "react";

const PATTERNS = {
  "C2C": "سوق مستعمل، من شخص لشخص",
  "C2B": "شخص أو ورشة بيورّد لمصنع أو مصدّر أو شركة",
  "B2C": "متجر بيبيع للمستهلك",
  "B2B": "مصنع أو مستورد بيورّد للمتاجر",
  "B2G": "متجر أو مصنع أو مستورد بيورّد لجهة حكومية",
};

export default function App() {
  const [active, setActive] = useState<string | null>(null);
  return (
    <div dir="rtl" style={{minHeight:"100vh", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", background:"#fff", fontFamily:"Alexandria, Tajawal, sans-serif", padding:16, overflow:"hidden"}}>
      <div style={{width:"100%", maxWidth:900, display:"flex", justifyContent:"space-between", alignItems:"center"}}>
        <div style={{fontFamily:"Inter, sans-serif", fontWeight:800, letterSpacing:1}}>COME-IN-IT</div>
        <div style={{fontSize:13, color:"#64748b"}}>AR | EN</div>
      </div>

      <div style={{position:"relative", width:"min(88vw, 460px)", aspectRatio:"1", marginTop:12, borderRadius:"50%", border:"2px solid #0f2a44", display:"flex", alignItems:"center", justifyContent:"center", background:"radial-gradient(circle, #f8fafc 0%, #ffffff 70%)"}}>
        <div style={{position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center", opacity:0.06, fontSize:180, fontWeight:900}}>EG</div>
        {Object.keys(PATTERNS).map((k, i) => {
          const angle = (i * 72 - 90) * Math.PI / 180;
          const x = 50 + 38 * Math.cos(angle);
          const y = 50 + 38 * Math.sin(angle);
          return (
            <button key={k} onClick={() => setActive(k)} style={{position:"absolute", left:`${x}%`, top:`${y}%`, transform:"translate(-50%,-50%)", background: active===k ? "#0f2a44" : "#fff", color: active===k ? "#fff" : "#0f2a44", border:"1.5px solid #0f2a44", borderRadius:999, padding:"10px 14px", fontFamily:"Inter, sans-serif", fontWeight:700, cursor:"pointer"}}>{k}</button>
          );
        })}
        <button style={{background:"#0f2a44", color:"#fff", border:"none", borderRadius:999, padding:"18px 34px", fontSize:22, fontWeight:700, cursor:"pointer", zIndex:2}}>ادخل</button>
      </div>

      <div style={{marginTop:14, minHeight:24, fontSize:16, color:"#334155", textAlign:"center"}}>
        {active ? PATTERNS[active as keyof typeof PATTERNS] : "اختار نمط عشان تشوف شرحه"}
      </div>
      <a href="#" style={{marginTop:6, fontSize:14, color:"#0f766e", textDecoration:"underline"}}>سجل الآن</a>
      <div style={{marginTop:10, fontSize:12, color:"#94a3b8"}}>كل الأنماط في دايرة واحدة مقفولة جوه مصر</div>
    </div>
  );
}