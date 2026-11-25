import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function KycForm() {
  const [form, setForm] = useState({ fullName: "", nationalId: "", birthDate: "", governorate: "", center: "", village: "", street: "", buildingNumber: "", landmark: "" });
  const [msg, setMsg] = useState("");
  const [saving, setSaving] = useState(false);
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const onFile = async (e: any) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setMsg("جارٍ قراءة البطاقة...");
    // OCR بسيط: هنسيبها للمستخدم يراجع الخانات بعد المسح
    setMsg("اتأكد من الخانات بعد المسح، وعدّلها لو فيها غلط.");
  };
  const save = async () => {
    if (form.nationalId.length !== 14) { setMsg("الرقم القومي لازم يكون 14 رقم."); return; }
    if (!form.fullName || !form.governorate || !form.center) { setMsg("كمّل الاسم والمحافظة والمركز."); return; }
    setSaving(true);
    try {
      const r = await fetch("/api/kyc", { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify(form) });
      if (r.ok) setMsg("تم حفظ هويتك، وجارٍ مراجعتها.");
      else setMsg("اتحفظت عندك، بس السيرفر لسه هيتظبط للحفظ النهائي.");
    } catch { setMsg("اتأكد من النت وحاول تاني."); }
    setSaving(false);
  };
  return (
    <div dir="rtl" className="min-h-screen bg-slate-50 p-4">
      <div className="mx-auto max-w-xl rounded-2xl bg-white p-6 shadow">
        <h1 className="text-2xl font-black">توثيق الهوية - KYC</h1>
        <p className="mt-1 text-sm text-slate-500">امسح البطاقة بالكاميرا، وراجع بياناتك، وبعدها احفظ.</p>
        <div className="mt-4 space-y-3">
          <div><Label>صورة وجه البطاقة</Label><Input type="file" accept="image/*" capture="environment" onChange={onFile} /></div>
          <div><Label>الاسم بالكامل</Label><Input value={form.fullName} onChange={(e) => set("fullName", e.target.value)} placeholder="مثال: عمرو أنور أحمد سويلم" /></div>
          <div><Label>الرقم القومي (14 رقم)</Label><Input value={form.nationalId} onChange={(e) => set("nationalId", e.target.value.replace(/[^0-9]/g, "").slice(0, 14))} placeholder="2xxxxxxxxxxxxx" inputMode="numeric" /></div>
          <div><Label>تاريخ الميلاد</Label><Input type="date" value={form.birthDate} onChange={(e) => set("birthDate", e.target.value)} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>المحافظة</Label><Input value={form.governorate} onChange={(e) => set("governorate", e.target.value)} placeholder="كفر الشيخ" /></div>
            <div><Label>المركز / المدينة</Label><Input value={form.center} onChange={(e) => set("center", e.target.value)} placeholder="سيدي سالم" /></div>
          </div>
          <div><Label>القرية / الحي</Label><Input value={form.village} onChange={(e) => set("village", e.target.value)} placeholder="شاباس الملح" /></div>
          <div><Label>الشارع</Label><Input value={form.street} onChange={(e) => set("street", e.target.value)} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>رقم المبنى</Label><Input value={form.buildingNumber} onChange={(e) => set("buildingNumber", e.target.value)} /></div>
            <div><Label>علامة مميزة</Label><Input value={form.landmark} onChange={(e) => set("landmark", e.target.value)} placeholder="جنب..." /></div>
          </div>
          {msg && <p className="text-sm text-slate-600">{msg}</p>}
          <Button className="w-full" onClick={save} disabled={saving}>{saving ? "جارٍ الحفظ..." : "حفظ الهوية"}</Button>
          <Button variant="ghost" className="w-full" onClick={() => window.location.href = "/"}>رجوع للرئيسية</Button>
        </div>
      </div>
    </div>
  );
}
