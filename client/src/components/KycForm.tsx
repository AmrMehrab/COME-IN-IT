import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const GOV: Record<string,string> = { "01":"القاهرة","02":"الإسكندرية","03":"بورسعيد","04":"السويس","11":"دمياط","12":"الدقهلية","13":"الشرقية","14":"القليوبية","15":"كفر الشيخ","16":"الغربية","17":"المنوفية","18":"البحيرة","19":"الإسماعيلية","21":"الجيزة","22":"بني سويف","23":"الفيوم","24":"المنيا","25":"أسيوط","26":"سوهاج","27":"قنا","28":"أسوان","29":"الأقصر","31":"البحر الأحمر","32":"الوادي الجديد","33":"مطروح","34":"شمال سيناء","35":"جنوب سيناء" };

export function KycForm() {
  const [form, setForm] = useState({ fullName:"", nationalId:"", birthDate:"", governorate:"", center:"", village:"", street:"", buildingNumber:"", landmark:"", phone:"" });
  const [msg, setMsg] = useState("");
  const [scanning, setScanning] = useState(false);
  const set = (k:string,v:string) => setForm(f=>({...f,[k]:v}));
  const fillFromNationalId = (nid:string) => {
    if (nid.length!==14) return;
    const century = nid[0]==="2" ? 1900 : nid[0]==="3" ? 2000 : 1900;
    const yy = parseInt(nid.slice(1,3),10), mm = nid.slice(3,5), dd = nid.slice(5,7);
    const birthDate = `${century+yy}-${mm}-${dd}`;
    const govCode = nid.slice(7,9);
    set("birthDate", birthDate);
    if (GOV[govCode]) set("governorate", GOV[govCode]);
  };
  const onFile = async (e:any) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setScanning(true);
    setMsg("جارٍ قراءة البطاقة... ثواني، متكتبش حاجة.");
    try {
      // @ts-ignore
      const { createWorker } = await import("tesseract.js");
      const worker:any = await createWorker(["ara","eng"]);
      const { data } = await worker.recognize(URL.createObjectURL(file));
      await worker.terminate();
      const text = data.text || "";
      const nidMatch = text.replace(/[^0-9]/g,"").match(/\d{14}/);
      if (nidMatch) { set("nationalId", nidMatch[0]); fillFromNationalId(nidMatch[0]); }
      const lines = text.split("\n").map((s:string)=>s.trim()).filter(Boolean);
      const nameLine = lines.find((l:string)=>l.length>8 && /[ء-ي]/.test(l) && !/الرقم|العنوان|جمهورية|بطاقة/.test(l));
      if (nameLine) set("fullName", nameLine);
      const addrLine = lines.find((l:string)=>/كفر|الجيزة|القاهرة|سيدي|شاباس|منشأة|قرية|شارع/.test(l));
      if (addrLine) set("street", addrLine);
      setMsg(nidMatch ? "اتقرت البطاقة أوتوماتيك. راجع بياناتك، واكتب رقم تليفونك بس، وبعدها دوس حفظ." : "معرفتش أقرا الرقم القومي من الصورة. صوّر البطاقة تاني بإضاءة أحسن، والبطاقة تكون معدولة.");
    } catch { setMsg("مش قادر أقرا البطاقة دلوقتي. صوّرها تاني بإضاءة أحسن."); }
    setScanning(false);
  };
  const save = async () => {
    if (form.nationalId.length!==14) { setMsg("امسح البطاقة الأول عشان الرقم القومي يتكتب أوتوماتيك."); return; }
    if (form.phone.replace(/[^0-9]/g,"").length<11) { setMsg("اكتب رقم تليفونك بس (11 رقم)."); return; }
    try {
      const r = await fetch("/api/kyc", { method:"POST", headers:{"Content-Type":"application/json"}, credentials:"include", body: JSON.stringify(form) });
      if (r.ok) setMsg("تم حفظ هويتك، وجارٍ مراجعتها.");
      else setMsg("اتحفظت عندك، بس السيرفر لسه هيتظبط للحفظ النهائي.");
    } catch { setMsg("اتأكد من النت وحاول تاني."); }
  };
  const ro = { readOnly:true, className:"bg-slate-50" };
  return (
    <div dir="rtl" className="min-h-screen bg-slate-50 p-4">
      <div className="mx-auto max-w-xl rounded-2xl bg-white p-6 shadow">
        <h1 className="text-2xl font-black">توثيق الهوية - KYC</h1>
        <p className="mt-1 text-sm text-slate-500">امسح البطاقة بالكاميرا، بياناتك هتتكتب أوتوماتيك. متكتبش حاجة غير رقم تليفونك.</p>
        <div className="mt-4 space-y-3">
          <div><Label>صورة وجه البطاقة - امسح هنا</Label><Input type="file" accept="image/*" capture="environment" onChange={onFile} /></div>
          <div><Label>الاسم بالكامل - أوتوماتيك من البطاقة</Label><Input value={form.fullName} {...ro} placeholder="هيتكتب أوتوماتيك بعد المسح" /></div>
          <div><Label>الرقم القومي (14 رقم) - أوتوماتيك</Label><Input value={form.nationalId} {...ro} placeholder="هيتكتب أوتوماتيك بعد المسح" /></div>
          <div><Label>تاريخ الميلاد - أوتوماتيك من الرقم القومي</Label><Input type="date" value={form.birthDate} {...ro} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>المحافظة - أوتوماتيك</Label><Input value={form.governorate} {...ro} placeholder="أوتوماتيك" /></div>
            <div><Label>المركز / المدينة - أوتوماتيك</Label><Input value={form.center} {...ro} placeholder="أوتوماتيك" /></div>
          </div>
          <div><Label>القرية / الحي - أوتوماتيك</Label><Input value={form.village} {...ro} placeholder="أوتوماتيك" /></div>
          <div><Label>الشارع - أوتوماتيك</Label><Input value={form.street} {...ro} placeholder="أوتوماتيك" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>رقم المبنى - أوتوماتيك</Label><Input value={form.buildingNumber} {...ro} placeholder="أوتوماتيك" /></div>
            <div><Label>علامة مميزة - أوتوماتيك</Label><Input value={form.landmark} {...ro} placeholder="أوتوماتيك" /></div>
          </div>
          <div><Label>رقم التليفون - اكتبه انت (الحاجة الوحيدة اللي بتتكتب)</Label><Input value={form.phone} onChange={(e)=>set("phone", e.target.value.replace(/[^0-9]/g,"").slice(0,11))} placeholder="01xxxxxxxxx" inputMode="numeric" /></div>
          {msg && <p className="text-sm text-slate-600">{msg}</p>}
          <Button className="w-full" onClick={save} disabled={scanning}>{scanning ? "جارٍ قراءة البطاقة..." : "حفظ الهوية"}</Button>
          <Button variant="ghost" className="w-full" onClick={()=>window.location.href="/"}>رجوع للرئيسية</Button>
        </div>
      </div>
    </div>
  );
}
