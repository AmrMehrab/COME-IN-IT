import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Fingerprint, CheckCircle2, ShieldCheck, FileSignature, Send, Lock, AlertCircle, RefreshCw, Stamp } from "lucide-react";

interface SignDocItem {
  id: string;
  title: string;
  type: string;
  parties: string;
  amount: string;
  status: "DRAFT" | "KYC_VERIFIED" | "STAMPED_WORM" | "GOV_ATTESTED";
  hash: string;
  updatedAt: string;
}

const INITIAL_DOCS: SignDocItem[] = [
  {
    id: "doc-001",
    title: "عقد توريد خطوط إنتاج طاقة شمسية (B2B)",
    type: "عقد تجاري مؤسسي",
    parties: "شركة النور للطاقة ↔ المصنع المصري للتصنيع",
    amount: "1,250,000 $",
    status: "GOV_ATTESTED",
    hash: "0x8f9b2c1a4e6f8d3c5b7a9e1f... (WORM Validated)",
    updatedAt: "2026-08-14 10:30",
  },
  {
    id: "doc-002",
    title: "مذكرة تفاهم مناقصة حكومية توريد معدات (B2G)",
    type: "مستند تعاقد حكومي سيادي",
    parties: "وزارة الإنتاج الحربي ↔ تحالف التقنية الموثوقة",
    amount: "3,800,000 $",
    status: "STAMPED_WORM",
    hash: "0x3a4b5c6d7e8f9a0b1c2d3e4f... (Pending Gateway)",
    updatedAt: "2026-08-14 11:15",
  },
  {
    id: "doc-003",
    title: "اتفاقية شراكة خدمات لوجستية وتخليص عابر",
    type: "عقد خدمات مساندة",
    parties: "الشركة المصرية للتخليص ↔ شبكة التجارة الموثوقة",
    amount: "450,000 $",
    status: "KYC_VERIFIED",
    hash: "0x11223344556677889900aabb... (Draft Ready)",
    updatedAt: "2026-08-14 12:00",
  },
];

export function ElectronicSignatureWorkflow() {
  const [docs, setDocs] = useState<SignDocItem[]>(INITIAL_DOCS);
  const [selectedDocId, setSelectedDocId] = useState<string>("doc-002");
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [actionMessage, setActionMessage] = useState<string>("");

  const currentDoc = docs.find((d) => d.id === selectedDocId) || docs[0];

  const handleProgressWorkflow = (nextStatus: "KYC_VERIFIED" | "STAMPED_WORM" | "GOV_ATTESTED") => {
    setIsProcessing(true);
    setActionMessage("جارٍ التحقق المشفر والاتصال ببوابة التوثيق السيادية...");

    setTimeout(() => {
      setDocs((prev) =>
        prev.map((doc) => {
          if (doc.id === selectedDocId) {
            return {
              ...doc,
              status: nextStatus,
              hash: `0x${Math.random().toString(16).substring(2, 10)}${Math.random().toString(16).substring(2, 10)}... (Attested)`,
              updatedAt: new Date().toISOString().replace("T", " ").substring(0, 16),
            };
          }
          return doc;
        })
      );
      setIsProcessing(false);
      setActionMessage("تمت العملية بنجاح وتوثيق البصمة الزمنية WORM والتوقيع الرقمي.");
    }, 1200);
  };

  return (
    <div className="space-y-6">
      <div className="bg-card/60 p-6 rounded-2xl border border-border/65 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2 text-foreground">
            <FileSignature className="w-6 h-6 text-primary" />
            محاكي التوقيع الإلكتروني المشفر وبوابات التوثيق الحكومية (e-Signature & Government Attestation)
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            إدارة دورة حياة التوقيع الرقمي للتعاقدات (B2B / B2G) مع التحقق من الهوية (KYC/KYB)، الختم السيادي، وبصمات WORM الزمنية.
          </p>
        </div>
        <Badge variant="outline" className="text-xs px-3 py-1 bg-primary/10 text-primary border-primary/25">
          متوافق مع قانون التوقيع الإلكتروني المصري
        </Badge>
      </div>

      {actionMessage && (
        <div className="bg-primary/10 border border-primary/30 p-4 rounded-xl text-primary text-sm flex items-center gap-3">
          <ShieldCheck className="w-5 h-5 shrink-0" />
          <span>{actionMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* قائمة المستندات */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground px-1">المستندات والعقود المتاحة للتوقيع</h3>
          {docs.map((doc) => (
            <Card
              key={doc.id}
              className={`border transition-all cursor-pointer ${
                selectedDocId === doc.id
                  ? "border-primary bg-card/80 shadow-md ring-1 ring-primary/30"
                  : "border-border/60 bg-card/40 hover:border-primary/40"
              }`}
              onClick={() => setSelectedDocId(doc.id)}
            >
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-[10px] font-mono">
                    {doc.type}
                  </Badge>
                  <span className="text-xs font-mono font-bold text-foreground">{doc.amount}</span>
                </div>
                <h4 className="text-sm font-bold text-foreground">{doc.title}</h4>
                <p className="text-xs text-muted-foreground truncate">{doc.parties}</p>
                <div className="flex items-center justify-between pt-2 border-t border-border/40 text-[11px]">
                  <span className="text-muted-foreground">الحالة:</span>
                  <span
                    className={`font-semibold ${
                      doc.status === "GOV_ATTESTED"
                        ? "text-emerald-600"
                        : doc.status === "STAMPED_WORM"
                        ? "text-blue-500"
                        : "text-amber-500"
                    }`}
                  >
                    {doc.status === "GOV_ATTESTED"
                      .toString()
                      .replace("GOV_ATTESTED", "موثق حكومياً نهائياً")
                      .replace("STAMPED_WORM", "مختوم WORM")
                      .replace("KYC_VERIFIED", "تم التحقق KYC")}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* تفاصيل المستند ومسار التوقيع */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border border-border/60 bg-card/50">
            <CardHeader className="pb-4 border-b border-border/50">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold">{currentDoc.title}</CardTitle>
                  <CardDescription className="text-xs mt-1">الأطراف المتعاقدة: {currentDoc.parties}</CardDescription>
                </div>
                <Badge
                  className={
                    currentDoc.status === "GOV_ATTESTED"
                      ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                      : currentDoc.status === "STAMPED_WORM"
                      ? "bg-blue-500/10 text-blue-500 border-blue-500/20"
                      : "bg-amber-500/10 text-amber-600 border-amber-500/20"
                  }
                >
                  {currentDoc.status}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="p-6 space-y-6">
              {/* مسار المراحل الأربع */}
              <div className="space-y-4">
                <h4 className="text-xs font-semibold text-muted-foreground tracking-wider uppercase">مراحل التدقيق والتوثيق السيادي</h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  {/* المرحلة 1 */}
                  <div
                    className={`p-3 rounded-xl border text-center space-y-1 ${
                      ["KYC_VERIFIED", "STAMPED_WORM", "GOV_ATTESTED"].includes(currentDoc.status)
                        ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-700"
                        : "bg-card/40 border-border/60 text-muted-foreground"
                    }`}
                  >
                    <Fingerprint className="w-5 h-5 mx-auto mb-1 text-primary" />
                    <p className="text-xs font-bold">1. التحقق (KYC/KYB)</p>
                    <p className="text-[10px]">التحقق من هوية الممثلين وصلاحياتهم</p>
                  </div>

                  {/* المرحلة 2 */}
                  <div
                    className={`p-3 rounded-xl border text-center space-y-1 ${
                      ["STAMPED_WORM", "GOV_ATTESTED"].includes(currentDoc.status)
                        ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-700"
                        : "bg-card/40 border-border/60 text-muted-foreground"
                    }`}
                  >
                    <Stamp className="w-5 h-5 mx-auto mb-1 text-blue-500" />
                    <p className="text-xs font-bold">2. الختم المشفر</p>
                    <p className="text-[10px]">توليد بصمة SHA-256 وسجل WORM</p>
                  </div>

                  {/* المرحلة 3 */}
                  <div
                    className={`p-3 rounded-xl border text-center space-y-1 ${
                      currentDoc.status === "GOV_ATTESTED"
                        ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-700"
                        : "bg-card/40 border-border/60 text-muted-foreground"
                    }`}
                  >
                    <ShieldCheck className="w-5 h-5 mx-auto mb-1 text-purple-500" />
                    <p className="text-xs font-bold">3. بوابة التوثيق</p>
                    <p className="text-[10px]">الإحالة لجهات الاعتماد الحكومية</p>
                  </div>

                  {/* المرحلة 4 */}
                  <div
                    className={`p-3 rounded-xl border text-center space-y-1 ${
                      currentDoc.status === "GOV_ATTESTED"
                        ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-700"
                        : "bg-card/40 border-border/60 text-muted-foreground"
                    }`}
                  >
                    <CheckCircle2 className="w-5 h-5 mx-auto mb-1 text-emerald-600" />
                    <p className="text-xs font-bold">4. العقد المعتمد</p>
                    <p className="text-[10px]">جاهز للتنفيذ وبدء المعاملات</p>
                  </div>
                </div>
              </div>

              {/* بيانات البصمة والهندسة */}
              <div className="bg-card/60 p-4 rounded-xl border border-border/65 space-y-2 font-mono text-xs">
                <div className="flex justify-between items-center text-muted-foreground">
                  <span>معرف العقد: {currentDoc.id}</span>
                  <span>آخر تحديث: {currentDoc.updatedAt}</span>
                </div>
                <div className="text-foreground break-all">
                  <span className="text-muted-foreground">البصمة المشفرة (SHA-256):</span> {currentDoc.hash}
                </div>
              </div>

              {/* أزرار التحكم */}
              <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
                {currentDoc.status === "KYC_VERIFIED" && (
                  <Button
                    onClick={() => handleProgressWorkflow("STAMPED_WORM")}
                    disabled={isProcessing}
                    className="gap-2"
                  >
                    {isProcessing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Stamp className="w-4 h-4" />}
                    تنفيذ الختم وتوليد بصمة WORM
                  </Button>
                )}

                {currentDoc.status === "STAMPED_WORM" && (
                  <Button
                    onClick={() => handleProgressWorkflow("GOV_ATTESTED")}
                    disabled={isProcessing}
                    className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    {isProcessing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    إرسال إلى بوابة التوثيق الحكومية
                  </Button>
                )}

                {currentDoc.status === "GOV_ATTESTED" && (
                  <Button variant="outline" className="gap-2 text-emerald-600 border-emerald-500/30" disabled>
                    <CheckCircle2 className="w-4 h-4" />
                    المستند موثق ومعتمد سيادياً
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
