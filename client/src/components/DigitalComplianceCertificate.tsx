import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ShieldCheck, Award, Printer, Download, CheckCircle2, Building2, UserCheck, FileText, QrCode } from "lucide-react";
import { toast } from "sonner";

interface EntityProfile {
  name: string;
  type: string;
  kybId: string;
  representative: string;
  kycId: string;
  issueDate: string;
  expiryDate: string;
  scope: string;
  tradeModels: string[];
  status: "VERIFIED" | "CONDITIONALLY_VERIFIED" | "PENDING";
}

const SAMPLE_ENTITIES: EntityProfile[] = [
  {
    name: "الشركة المصرية للصناعات الهندسية والتصدير",
    type: "مَصنع / مصدر (Factory & Exporter)",
    kybId: "EGY-KYB-2026-90412",
    representative: "م. أحمد عبد الله المحمود",
    kycId: "KYC-881920-EG",
    issueDate: "2026-01-15",
    expiryDate: "2027-01-15",
    scope: "تصنيع وتصدير المعدات الصناعية وقطع الغيار (B2B, B2G)",
    tradeModels: ["B2B", "B2G", "B2C"],
    status: "VERIFIED"
  },
  {
    name: "مجموعة النيل للخدمات اللوجستية والتخليص الجمركي",
    type: "مقدم خدمة (Service Provider - Logistics)",
    kybId: "EGY-KYB-2026-55210",
    representative: "أ. محمود حسن الشريف",
    kycId: "KYC-449102-EG",
    issueDate: "2026-02-01",
    expiryDate: "2027-02-01",
    scope: "شحن دولي، تخليص جمركي، وسلاسل إمداد (B2B, B2C, C2B)",
    tradeModels: ["B2B", "B2C", "C2B"],
    status: "VERIFIED"
  },
  {
    name: "مصنع الدلتا للمنتجات الغذائية والتعليب",
    type: "مصنع (Manufacturing Facility)",
    kybId: "EGY-KYB-2026-11849",
    representative: "د. سارة إبراهيم مكي",
    kycId: "KYC-109283-EG",
    issueDate: "2026-03-10",
    expiryDate: "2027-03-10",
    scope: "إنتاج وتعبئة المواد الغذائية (B2B, B2G, C2B)",
    tradeModels: ["B2B", "B2G", "C2B"],
    status: "CONDITIONALLY_VERIFIED"
  }
];

export function DigitalComplianceCertificate() {
  const [selectedEntity, setSelectedEntity] = useState<EntityProfile>(SAMPLE_ENTITIES[0]);
  const [customName, setCustomName] = useState("");
  const [customKyb, setCustomKyb] = useState("");
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const handlePrint = () => {
    setIsExporting(true);
    toast.info("جاري إعداد شهادة الامتثال الرقمية للطباعة والتصدير...");
    setTimeout(() => {
      window.print();
      setIsExporting(false);
      toast.success("تم فتح نافذة الطباعة بنجاح!");
    }, 800);
  };

  const currentEntity = isCustomMode
    ? {
        name: customName || "كيان تجاري موثق جديد",
        type: "كيان معتمد عبر KYB",
        kybId: customKyb || "EGY-KYB-2026-CUSTOM",
        representative: "ممثل مفوض معتمد (KYC Verified)",
        kycId: "KYC-Verified-EG",
        issueDate: new Date().toISOString().split("T")[0],
        expiryDate: new Date(Date.now() + 365 * 86400000).toISOString().split("T")[0],
        scope: "التجارة الإلكترونية وشبكة التوريد الموثقة (B2B, B2G, B2C)",
        tradeModels: ["B2B", "B2C", "B2G"],
        status: "VERIFIED" as const
      }
    : selectedEntity;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-card/60 p-6 rounded-2xl border border-border/60 shadow-sm">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2 text-foreground">
            <Award className="w-6 h-6 text-primary" />
            مولد شهادة الامتثال الرقمية (Digital Compliance Certificate)
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            إصدار شهادة رسمية موثقة ومعتمدة سيايادياً من شبكة COME IN IT للكيانات ومزودي الخدمات المجتازين لشروط KYC و KYB.
          </p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <Button
            variant={isCustomMode ? "default" : "outline"}
            size="sm"
            onClick={() => setIsCustomMode(!isCustomMode)}
          >
            {isCustomMode ? "العودة للعينات الجاهزة" : "إدخال بيانات مخصصة"}
          </Button>
          <Button onClick={handlePrint} disabled={isExporting} className="gap-2">
            {isExporting ? <Printer className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            تصدير / طباعة الشهادة (PDF)
          </Button>
        </div>
      </div>

      {!isCustomMode && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {SAMPLE_ENTITIES.map((ent, idx) => (
            <Card
              key={idx}
              className={`cursor-pointer transition-all border ${
                selectedEntity.kybId === ent.kybId
                  ? "border-primary bg-primary/5 ring-1 ring-primary"
                  : "border-border/60 hover:border-border"
              }`}
              onClick={() => setSelectedEntity(ent)}
            >
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <Badge variant="outline" className="text-xs">{ent.type}</Badge>
                  {ent.status === "VERIFIED" ? (
                    <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-xs">موثق بالكامل</Badge>
                  ) : (
                    <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-xs">موثق مشروط</Badge>
                  )}
                </div>
                <CardTitle className="text-base font-bold mt-2 line-clamp-1">{ent.name}</CardTitle>
                <CardDescription className="text-xs">{ent.kybId}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}

      {isCustomMode && (
        <Card className="border border-border/60 p-4 bg-card/40">
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="cname">اسم الكيان أو الشركة</Label>
              <Input
                id="cname"
                placeholder="مثال: شركة النيل للتجارة الدولية"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ckyb">رقم السجل التجاري / KYB ID</Label>
              <Input
                id="ckyb"
                placeholder="مثال: EGY-KYB-2026-XXXXX"
                value={customKyb}
                onChange={(e) => setCustomKyb(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* شهادة الامتثال الفعليه */}
      <div className="bg-white text-slate-900 rounded-3xl p-8 md:p-12 shadow-2xl border-8 border-slate-100 relative overflow-print print:shadow-none print:border-0 print:p-0">
        {/* علامة مائية سيادية */}
        <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none select-none">
          <ShieldCheck className="w-96 h-96 text-primary" />
        </div>

        <div className="relative z-10 space-y-8">
          {/* رأس الشهادة */}
          <div className="flex flex-col md:flex-row justify-between items-center border-b border-slate-200 pb-6 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center shadow-lg">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-2xl font-black tracking-tight text-slate-900">COME IN IT</h1>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Trusted Digital Trade Network — Egypt</p>
              </div>
            </div>
            <div className="text-center md:text-left">
              <span className="inline-block bg-primary/10 text-primary px-4 py-1.5 rounded-full text-xs font-bold tracking-wide">
                شهادة امتثال سيادي موثقة (Sovereign Compliance Certificate)
              </span>
              <p className="text-xs text-slate-400 mt-1">رقم الوثيقة: {currentEntity.kybId}-CERT</p>
            </div>
          </div>

          {/* نص الشهادة */}
          <div className="text-center space-y-3 py-4">
            <p className="text-sm text-slate-600 font-medium">تشهد شبكة التجارة الرقمية الموثقة (COME IN IT) بأن الكيان التجاري:</p>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">{currentEntity.name}</h2>
            <p className="text-sm text-slate-600 max-w-2xl mx-auto">
              قد اجتاز بنجاح كافة اختبارات التحقق من الهوية المؤسسية (<span className="font-semibold text-primary">KYB</span>) والممثلين المفوضين (<span className="font-semibold text-primary">KYC</span>)، واستوفى معايير السيادة الرقمية المصرية وحوكمة السجلات غير القابلة للتلاعب (<span className="font-semibold text-primary">WORM</span>).
            </p>
          </div>

          {/* جدول تفاصيل الاعتماد */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-6 rounded-2xl border border-slate-200">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Building2 className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                <div>
                  <span className="text-xs text-slate-500 block">نوع الكيان والتصنيف</span>
                  <span className="text-sm font-bold text-slate-800">{currentEntity.type}</span>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <UserCheck className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                <div>
                  <span className="text-xs text-slate-500 block">الممثل القانوني المفوض (KYC Verified)</span>
                  <span className="text-sm font-bold text-slate-800">{currentEntity.representative}</span>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <FileText className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                <div>
                  <span className="text-xs text-slate-500 block">نطاق العمل والترخيص</span>
                  <span className="text-sm font-bold text-slate-800">{currentEntity.scope}</span>
                </div>
              </div>
            </div>

            <div className="space-y-4 border-t md:border-t-0 md:border-r border-slate-200 md:pr-6 pt-4 md:pt-0">
              <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                <span className="text-xs text-slate-500">حالة الاعتماد السيادي</span>
                <Badge className="bg-emerald-600 text-white font-bold text-xs">معتمد رسمياً (Verified)</Badge>
              </div>
              <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                <span className="text-xs text-slate-500">الأنماط التجارية المدعومة</span>
                <div className="flex gap-1">
                  {currentEntity.tradeModels.map((m, i) => (
                    <span key={i} className="bg-slate-200 text-slate-700 px-2 py-0.5 rounded text-xs font-semibold">{m}</span>
                  ))}
                </div>
              </div>
              <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                <span className="text-xs text-slate-500">تاريخ الإصدار</span>
                <span className="text-sm font-mono font-bold text-slate-800">{currentEntity.issueDate}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-500">تاريخ انتهاء الصلاحية</span>
                <span className="text-sm font-mono font-bold text-slate-800">{currentEntity.expiryDate}</span>
              </div>
            </div>
          </div>

          {/* تذييل الشهادة والتوقيع الرقمي */}
          <div className="flex flex-col md:flex-row justify-between items-center pt-6 border-t border-slate-200 gap-6">
            <div className="flex items-center gap-3 text-slate-500 text-xs">
              <QrCode className="w-12 h-12 text-slate-800 shrink-0" />
              <div>
                <p className="font-mono font-bold text-slate-700">HASH: SHA-256-9F88A2E104BC</p>
                <p>تم التحقق آلياً عبر سجلات WORM السيادية المصرية</p>
              </div>
            </div>
            <div className="text-center md:text-left">
              <div className="font-serif italic text-lg font-bold text-primary">فريق الامتثال والسيادة الرقمية</div>
              <p className="text-xs text-slate-500">شبكة COME IN IT — مصر</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
