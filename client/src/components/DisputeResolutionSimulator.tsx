import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Scale, AlertTriangle, ShieldAlert, CheckCircle2, FileText, Lock, RefreshCw, MessageSquare, ArrowRight, Search, Download, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface DisputeItem {
  id: string;
  title: string;
  contractId: string;
  complainant: string;
  respondent: string;
  reason: string;
  amount: string;
  status: "OPEN" | "EVIDENCE_REVIEW" | "MEDIATION" | "RESOLVED";
  wormHash: string;
  createdAt: string;
}

const INITIAL_DISPUTES: DisputeItem[] = [
  {
    id: "DSP-2026-01",
    title: "نزاع تأخير شحنة معدات طاقة شمسية",
    contractId: "CTR-8842-B2B",
    complainant: "شركة النور للطاقة المتجددة",
    respondent: "المصنع المصري للتصنيع",
    reason: "تأخير التسليم لمدة 14 يوماً عن الموعد المحدد في العقد الموثق",
    amount: "120,000 $",
    status: "MEDIATION",
    wormHash: "0x4f9b2c1a4e6f8d3c5b7a9e1f... (Secured)",
    createdAt: "2026-08-10",
  },
  {
    id: "DSP-2026-02",
    title: "مطالبة فروق مواصفات فنية في خط الإنتاج",
    contractId: "CTR-9011-B2G",
    complainant: "تحالف التقنية الموثوقة",
    respondent: "جهة التوريد الحكومية السيادية",
    reason: "اختلاف طفيف في معايير العزم الكهربائي عن المواصفة المعتمَدة",
    amount: "350,000 $",
    status: "EVIDENCE_REVIEW",
    wormHash: "0x7c3b2a1f9e8d4c6b5a2f1e0d... (Secured)",
    createdAt: "2026-08-12",
  },
  {
    id: "DSP-2026-03",
    title: "نزاع تسوية دفعات مالية مرحلية عابرة",
    contractId: "CTR-7712-B2B",
    complainant: "الشركة المصرية للتخليص",
    respondent: "مجموعة التجارة الدولية",
    reason: "إيقاف صرف الدفعة الثالثة نظراً لاكتمال المستندات الجمركية جزئياً",
    amount: "45,000 $",
    status: "OPEN",
    wormHash: "0x11223344556677889900aabb... (Secured)",
    createdAt: "2026-08-13",
  },
];

export function DisputeResolutionSimulator() {
  const [disputes, setDisputes] = useState<DisputeItem[]>(INITIAL_DISPUTES);
  const [selectedDisputeId, setSelectedDisputeId] = useState<string>("DSP-2026-01");
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [actionMessage, setActionMessage] = useState<string>("");

  const currentDispute = disputes.find((d) => d.id === selectedDisputeId) || disputes[0];

  const handleProgressDispute = (nextStatus: "EVIDENCE_REVIEW" | "MEDIATION" | "RESOLVED") => {
    setIsProcessing(true);
    setActionMessage("جارٍ معالجة النزاع والتحقق من سجلات WORM وأدلة الأطراف...");

    setTimeout(() => {
      setDisputes((prev) =>
        prev.map((d) => {
          if (d.id === selectedDisputeId) {
            return {
              ...d,
              status: nextStatus,
              wormHash: `0x${Math.random().toString(16).substring(2, 10)}${Math.random().toString(16).substring(2, 10)}... (Resolved Vault)`,
            };
          }
          return d;
        })
      );
      setIsProcessing(false);
      setActionMessage("تم تحديث حالة النزاع وحفظ قرار الوساطة في سجل WORM المنيع.");
      toast.success("تم تحديث حالة النزاع بنجاح وتوثيق البصمة!");
    }, 1200);
  };

  const handleExportPdf = () => {
    setIsExporting(true);
    toast.loading("جارٍ تجهيز تقرير النزاع السيادي وتوليد ملف PDF...", { id: "export-dispute-pdf" });

    setTimeout(() => {
      try {
        const printWindow = window.open("", "_blank");
        if (!printWindow) {
          toast.error("يرجى السماح بفتح النوافذ المنبثقة (Pop-ups) لتصدير تقرير النزاع.", { id: "export-dispute-pdf" });
          setIsExporting(false);
          return;
        }

        const htmlContent = `
          <!DOCTYPE html>
          <html lang="ar" dir="rtl">
          <head>
            <meta charset="UTF-8">
            <title>تقرير النزاع السيادي - ${currentDispute.id}</title>
            <style>
              body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #1e293b; background: #ffffff; line-height: 1.6; }
              .header { border-bottom: 2px solid #0f172a; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: center; }
              .title { font-size: 24px; font-weight: bold; color: #0f172a; }
              .badge { display: inline-block; padding: 6px 12px; background: #e2e8f0; border-radius: 6px; font-size: 12px; font-family: monospace; }
              .section { margin-bottom: 25px; background: #f8fafc; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0; }
              .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
              .label { font-size: 12px; color: #64748b; font-weight: bold; }
              .value { font-size: 15px; color: #0f172a; font-weight: 600; margin-top: 4px; }
              .footer { margin-top: 50px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; pt-20px; }
            </style>
          </head>
          <body>
            <div class="header">
              <div>
                <div class="title">تقرير النزاع التجاري والوساطة السيادية</div>
                <div style="font-size: 14px; color: #64748b; margin-top: 4px;">منصة COME IN IT v1.1 — شبكة التجارة الرقمية الموثوقة</div>
              </div>
              <div class="badge">${currentDispute.id}</div>
            </div>

            <div class="section">
              <h3 style="margin-top: 0; color: #0f172a; border-bottom: 1px solid #cbd5e1; padding-bottom: 8px;">بيانات العقد والأطراف</h3>
              <div class="grid">
                <div>
                  <div class="label">عنوان النزاع</div>
                  <div class="value">${currentDispute.title}</div>
                </div>
                <div>
                  <div class="label">المرجع التعاقدي</div>
                  <div class="value">${currentDispute.contractId}</div>
                </div>
                <div>
                  <div class="label">الطرف الشاكي</div>
                  <div class="value">${currentDispute.complainant}</div>
                </div>
                <div>
                  <div class="label">الطرف المستجيب</div>
                  <div class="value">${currentDispute.respondent}</div>
                </div>
              </div>
            </div>

            <div class="section">
              <h3 style="margin-top: 0; color: #0f172a; border-bottom: 1px solid #cbd5e1; padding-bottom: 8px;">تفاصيل الشكوى والمطالبة</h3>
              <div class="grid">
                <div>
                  <div class="label">قيمة المطالبة المالية</div>
                  <div class="value" style="color: #d97706; font-family: monospace;">${currentDispute.amount}</div>
                </div>
                <div>
                  <div class="label">حالة النزاع الحالية</div>
                  <div class="value">${currentDispute.status}</div>
                </div>
              </div>
              <div style="margin-top: 15px;">
                <div class="label">سبب النزاع والأدلة</div>
                <div class="value" style="font-weight: normal; margin-top: 6px;">${currentDispute.reason}</div>
              </div>
            </div>

            <div class="section">
              <h3 style="margin-top: 0; color: #0f172a; border-bottom: 1px solid #cbd5e1; padding-bottom: 8px;">التوثيق المشفر (WORM Immutable Vault)</h3>
              <div style="font-family: monospace; font-size: 13px; color: #334155; word-break: break-all; background: #ffffff; padding: 10px; border-radius: 4px; border: 1px solid #cbd5e1;">
                ${currentDispute.wormHash}
              </div>
            </div>

            <div class="footer">
              تم إصدار هذا المستند رسمياً من نظام التجارة الموثوقة COME IN IT في ${new Date().toLocaleString("ar-EG")}. جميع الحقوق محفوظة.
            </div>

            <script>
              window.onload = function() {
                window.print();
              };
            </script>
          </body>
          </html>
        `;

        printWindow.document.write(htmlContent);
        printWindow.document.close();
        setIsExporting(false);
        toast.success("تم بدء تصدير تقرير النزاع بصيغة PDF بنجاح!", { id: "export-dispute-pdf" });
      } catch (err) {
        setIsExporting(false);
        toast.error("حدث خطأ أثناء تصدير التقرير، يرجى المحاولة مرة أخرى.", { id: "export-dispute-pdf" });
      }
    }, 1000);
  };

  return (
    <div className="space-y-6">
      <div className="bg-card/60 p-6 rounded-2xl border border-border/65 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2 text-foreground">
            <Scale className="w-6 h-6 text-primary" />
            محاكي إدارة النزاعات التجارية والتسوية الآلية (Dispute Resolution & Mediation Workflow)
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            منظومة إلكترونية متكاملة للتعامل مع النزاعات التجارية وتعاقدات (B2B/B2G) بناءً على الأدلة الموثقة وبصمات WORM.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleExportPdf}
            disabled={isExporting}
            className="border-amber-500/30 text-amber-600 hover:bg-amber-50 text-xs gap-1.5"
          >
            {isExporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
            تصدير تقرير PDF
          </Button>
          <Badge variant="outline" className="text-xs px-3 py-1 bg-amber-500/10 text-amber-600 border-amber-500/25">
            آلية التحكيم والوساطة السيادية
          </Badge>
        </div>
      </div>

      {actionMessage && (
        <div className="bg-primary/10 border border-primary/30 p-4 rounded-xl text-primary text-sm flex items-center gap-3">
          <ShieldAlert className="w-5 h-5 shrink-0" />
          <span>{actionMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* قائمة النزاعات */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground px-1">النزاعات التجارية النشطة</h3>
          {disputes.map((dispute) => (
            <Card
              key={dispute.id}
              className={`border transition-all cursor-pointer ${
                selectedDisputeId === dispute.id
                  ? "border-primary bg-card/80 shadow-md ring-1 ring-primary/30"
                  : "border-border/60 bg-card/40 hover:border-primary/40"
              }`}
              onClick={() => setSelectedDisputeId(dispute.id)}
            >
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-[10px] font-mono">
                    {dispute.contractId}
                  </Badge>
                  <span className="text-xs font-mono font-bold text-foreground">{dispute.amount}</span>
                </div>
                <h4 className="text-sm font-bold text-foreground">{dispute.title}</h4>
                <p className="text-xs text-muted-foreground truncate">الشاكي: {dispute.complainant}</p>
                <div className="flex items-center justify-between pt-2 border-t border-border/40 text-[11px]">
                  <span className="text-muted-foreground">حالة النزاع:</span>
                  <span
                    className={`font-semibold ${
                      dispute.status === "RESOLVED"
                        ? "text-emerald-600"
                        : dispute.status === "MEDIATION"
                        ? "text-blue-500"
                        : "text-amber-500"
                    }`}
                  >
                    {dispute.status === "RESOLVED"
                      ? "تمت التسوية نهائياً"
                      : dispute.status === "MEDIATION"
                      ? "قيد الوساطة والتحكيم"
                      : dispute.status === "EVIDENCE_REVIEW"
                      ? "مراجعة الأدلة الفنية"
                      : "نزاع جديد مفتوح"}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* تفاصيل النزاع ومراحل المعالجة */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border border-border/60 bg-card/50">
            <CardHeader className="pb-4 border-b border-border/50">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold">{currentDispute.title}</CardTitle>
                  <CardDescription className="text-xs mt-1">
                    المرجع التعاقدي: <span className="font-mono">{currentDispute.contractId}</span> | تاريخ الفتح: {currentDispute.createdAt}
                  </CardDescription>
                </div>
                <Badge
                  className={
                    currentDispute.status === "RESOLVED"
                      ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                      : currentDispute.status === "MEDIATION"
                      ? "bg-blue-500/10 text-blue-500 border-blue-500/20"
                      : "bg-amber-500/10 text-amber-600 border-amber-500/20"
                  }
                >
                  {currentDispute.status}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="p-6 space-y-6">
              {/* أطراف النزاع والسبب */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-card/60 p-4 rounded-xl border border-border/60 space-y-1">
                  <span className="text-xs text-muted-foreground">الطرف الشاكي:</span>
                  <p className="text-sm font-bold text-foreground">{currentDispute.complainant}</p>
                </div>
                <div className="bg-card/60 p-4 rounded-xl border border-border/60 space-y-1">
                  <span className="text-xs text-muted-foreground">الطرف المستجيب:</span>
                  <p className="text-sm font-bold text-foreground">{currentDispute.respondent}</p>
                </div>
              </div>

              <div className="bg-amber-500/5 p-4 rounded-xl border border-amber-500/20 space-y-1">
                <span className="text-xs font-semibold text-amber-600">سبب النزاع والمطالبة المالية ({currentDispute.amount}):</span>
                <p className="text-sm text-foreground">{currentDispute.reason}</p>
              </div>

              {/* مراحل تسوية النزاع */}
              <div className="space-y-4">
                <h4 className="text-xs font-semibold text-muted-foreground tracking-wider uppercase">مسار ومعالجة النزاع السيادي</h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  {/* المرحلة 1 */}
                  <div
                    className={`p-3 rounded-xl border text-center space-y-1 ${
                      ["EVIDENCE_REVIEW", "MEDIATION", "RESOLVED", "OPEN"].includes(currentDispute.status)
                        ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-700"
                        : "bg-card/40 border-border/60 text-muted-foreground"
                    }`}
                  >
                    <FileText className="w-5 h-5 mx-auto mb-1 text-primary" />
                    <p className="text-xs font-bold">1. فتح النزاع</p>
                    <p className="text-[10px]">تسجيل الشكوى وإرفاق العقد</p>
                  </div>

                  {/* المرحلة 2 */}
                  <div
                    className={`p-3 rounded-xl border text-center space-y-1 ${
                      ["EVIDENCE_REVIEW", "MEDIATION", "RESOLVED"].includes(currentDispute.status)
                        ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-700"
                        : "bg-card/40 border-border/60 text-muted-foreground"
                    }`}
                  >
                    <Search className="w-5 h-5 mx-auto mb-1 text-blue-500" />
                    <p className="text-xs font-bold">2. فحص الأدلة</p>
                    <p className="text-[10px]">مراجعة سجلات WORM والأدلة</p>
                  </div>

                  {/* المرحلة 3 */}
                  <div
                    className={`p-3 rounded-xl border text-center space-y-1 ${
                      ["MEDIATION", "RESOLVED"].includes(currentDispute.status)
                        ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-700"
                        : "bg-card/40 border-border/60 text-muted-foreground"
                    }`}
                  >
                    <Scale className="w-5 h-5 mx-auto mb-1 text-purple-500" />
                    <p className="text-xs font-bold">3. جلسة الوساطة</p>
                    <p className="text-[10px]">تفاوض وتسوية ودية أو تحكيم</p>
                  </div>

                  {/* المرحلة 4 */}
                  <div
                    className={`p-3 rounded-xl border text-center space-y-1 ${
                      currentDispute.status === "RESOLVED"
                        ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-700"
                        : "bg-card/40 border-border/60 text-muted-foreground"
                    }`}
                  >
                    <CheckCircle2 className="w-5 h-5 mx-auto mb-1 text-emerald-600" />
                    <p className="text-xs font-bold">4. قرار التسوية</p>
                    <p className="text-[10px]">حفظ القرار وتوثيقه بالكامل</p>
                  </div>
                </div>
              </div>

              {/* البصمة وسجل التدقيق */}
              <div className="bg-card/60 p-4 rounded-xl border border-border/65 space-y-2 font-mono text-xs">
                <div className="text-foreground break-all">
                  <span className="text-muted-foreground">بصمة WORM لحالة النزاع:</span> {currentDispute.wormHash}
                </div>
              </div>

              {/* أزرار الإجراءات */}
              <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
                {currentDispute.status === "OPEN" && (
                  <Button
                    onClick={() => handleProgressDispute("EVIDENCE_REVIEW")}
                    disabled={isProcessing}
                    className="gap-2"
                  >
                    {isProcessing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                    بدء مراجعة الأدلة وسجلات WORM
                  </Button>
                )}

                {currentDispute.status === "EVIDENCE_REVIEW" && (
                  <Button
                    onClick={() => handleProgressDispute("MEDIATION")}
                    disabled={isProcessing}
                    className="gap-2"
                  >
                    {isProcessing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Scale className="w-4 h-4" />}
                    تحويل النزاع لجلسة الوساطة والتحكيم
                  </Button>
                )}

                {currentDispute.status === "MEDIATION" && (
                  <Button
                    onClick={() => handleProgressDispute("RESOLVED")}
                    disabled={isProcessing}
                    className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    {isProcessing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                    إصدار قرار التسوية وإغلاق النزاع
                  </Button>
                )}

                {currentDispute.status === "RESOLVED" && (
                  <Button variant="outline" className="gap-2 text-emerald-600 border-emerald-500/30" disabled>
                    <CheckCircle2 className="w-4 h-4" />
                    تمت تسوية النزاع بنجاح
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
