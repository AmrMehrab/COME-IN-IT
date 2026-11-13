import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, Download, Share2, Copy, FileText, CheckCircle2, Building, Server, Lock, Globe, ArrowRight, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function SovereignExecutiveReport() {
  const [isExporting, setIsExporting] = useState(false);

  const reportContent = `# COME IN IT — Sovereign Architecture & Investment Executive Report
**Version 1.0 | Date: August 2026**
**Prepared for:** Investors, Strategic Partners, and Stakeholders (Blue Port & Enterprise Partners)

---

## 1. Executive Summary & Product Vision
COME IN IT is not merely an e-commerce marketplace; it is a **Trusted Digital Trade Network** designed to connect Egyptian manufacturing capacity with local and international demand through an uncompromised architecture of trust, identity, and sovereign data governance.

Our foundational rule is absolute: **"لا جهة مجهولة تتاجر مع جهة مجهولة، ولا يُجرى أي تداول على منتج مجهول."** (No unknown entity trades with an unknown entity, and no trade occurs on an unknown product.)

---

## 2. Core Architectural Philosophy: Egypt-First Sovereign Hybrid Cloud
To balance national data sovereignty with global scalability, COME IN IT implements a **Sovereign Hybrid Cloud Architecture**:

- **Sovereign Core (Egypt):** All sensitive data including KYC vaults, KYB business verification records, legal documents, legal representatives' data, and immutable audit logs reside **exclusively inside sovereign data centers in Egypt**, complying fully with Egypt's Personal Data Protection Law No. 151 of 2020 and NTRA regulatory frameworks.
- **Hybrid Operations Layer:** Non-sensitive workloads (public UI, public product catalogs, aggregated market intelligence, and anonymized AI matching algorithms) operate on flexible hybrid cloud infrastructure with strict data anonymization gateways.

---

## 3. The 10-Layer Trust & Commercial Hierarchy
1. **KYC:** Individual identity verification.
2. **KYB:** Business entity verification and legal compliance check.
3. **Business Identity:** Independent commercial entity model supporting multiple members and authorized representatives.
4. **Roles:** Organizational roles (Owner, Director, Procurement Manager, Finance Manager, etc.).
5. **Permissions:** Server-side RBAC + ABAC enforcement.
6. **Product Identity:** Verified products linked exclusively to verified businesses.
7. **Matching Engine:** Blind matching algorithm using tokenized IDs to connect verified supply and demand.
8. **B2B Interaction:** Secure commercial exchange governed by strict data visibility rules.
9. **Audit Logs:** Immutable WORM (Write Once, Read Many) logging for all sensitive actions.
10. **Intelligence:** Aggregated market and governmental insights for decision-makers.

---

## 4. Data Visibility Matrix (Who Sees What?)
- **Factories / Suppliers:** See purchase order requirements, specifications, and delivery locations without accessing buyer's financial details.
- **Buyers / Importers:** See verified product catalogs, certifications, and production capacities without exposing proprietary operational details.
- **Executives / Government:** Access macro-level aggregated supply chain intelligence and trade gaps without compromising individual privacy.

---

## 5. Investment Highlights & Strategic Value
- **Regulatory Alignment:** Built in direct alignment with Egypt's digital sovereignty strategy and NTRA's modern data center licensing frameworks.
- **Risk Mitigation:** Zero tolerance for unverified entities eliminates fraud and counterparty risk in B2B transactions.
- **Scalability:** Egypt-First sovereign core enables secure domestic baseline expansion, while the hybrid cloud layer permits seamless international scaling.

---
*© 2026 COME IN IT Network. All rights reserved.*`;

  const handleDownloadMarkdown = () => {
    setIsExporting(true);
    setTimeout(() => {
      const blob = new Blob([reportContent], { type: "text/markdown;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "COME_IN_IT_Sovereign_Executive_Report_2026.md";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setIsExporting(false);
      toast.success("تم تصنيف وتنزيل التقرير التنفيذي بنجاح!");
    }, 800);
  };

  const handleDownloadHtml = () => {
    setIsExporting(true);
    setTimeout(() => {
      const escaped = reportContent
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\n/g, "<br />");
      const html = `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width,initial-scale=1" /><title>COME IN IT — Sovereign Executive Report</title><style>body{margin:0;background:#07111f;color:#dbeafe;font-family:Arial, sans-serif;line-height:1.8}main{max-width:960px;margin:0 auto;padding:56px 28px}header{border:1px solid #1d4ed8;background:linear-gradient(135deg,#0f2b55,#101827);border-radius:20px;padding:32px;margin-bottom:28px}h1{margin:0 0 8px;font-size:30px;color:#fff}p.meta{color:#93c5fd;margin:0}.report{background:#0b1728;border:1px solid #1e3a5f;border-radius:16px;padding:30px;white-space:normal;font-size:15px}.footer{margin-top:24px;color:#7dd3fc;font-size:12px}@media print{body{background:#fff;color:#0f172a}.report,header{border:1px solid #cbd5e1;background:#fff}h1{color:#0f172a}}</style></head><body><main><header><h1>COME IN IT — تقرير السيادة المعمارية والاستثمار</h1><p class="meta">الإصدار 1.0 · مخصص للمستثمرين والشركاء الاستراتيجيين</p></header><section class="report">${escaped}</section><p class="footer">© 2026 COME IN IT Network · للاستخدام التنفيذي والمشاركة المنضبطة</p></main></body></html>`;
      const blob = new Blob([html], { type: "text/html;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "COME_IN_IT_Sovereign_Executive_Report_2026.html";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setIsExporting(false);
      toast.success("تم تنزيل التقرير المنسق بصيغة HTML بنجاح!");
    }, 500);
  };

  const handleExportPdf = () => {
    setIsExporting(true);
    toast.info("جاري تجهيز مستند السيادة المعمارية للطباعة والتصدير بصيغة PDF...");
    setTimeout(() => {
      const printWindow = window.open("", "_blank");
      if (!printWindow) {
        toast.error("تعذر فتح نافذة الطباعة التلقائية؛ يرجى السماح بالنوافذ المنبثقة من متصفحك والمحاولة مرة أخرى.");
        setIsExporting(false);
        return;
      }
      const escaped = reportContent
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\n/g, "<br />");
      printWindow.document.write(`<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8" /><title>COME IN IT — Sovereign Executive Report (PDF)</title><style>body{margin:0;padding:40px;background:#fff;color:#0f172a;font-family:Arial, sans-serif;line-height:1.7}header{border-bottom:2px solid #2563eb;padding-bottom:20px;margin-bottom:24px}h1{margin:0 0 6px;font-size:26px;color:#1e3a8a}p.meta{color:#475569;font-size:13px;margin:0}.report{font-size:14px;color:#1e293b}.footer{margin-top:32px;padding-top:16px;border-top:1px solid #e2e8f0;color:#64748b;font-size:11px;text-align:center}@media print{body{padding:0}}</style></head><body><header><h1>COME IN IT — تقرير السيادة المعمارية والاستثمار</h1><p class="meta">الإصدار 1.0 · شبكة التجارة الرقمية الموثوقة (Trusted Digital Trade Network) · تاريخ الإصدار: أغسطس 2026</p></header><div class="report">${escaped}</div><div class="footer">© 2026 COME IN IT Network · وثيقة رسمية معتمدة للتصدير والمشاركة التنفيذية</div><script>window.onload=function(){window.print();};</script></body></html>`);
      printWindow.document.close();
      setIsExporting(false);
      toast.success("✅ اكتمل توليد التقرير بنجاح! تم فتح نافذة التصدير والحفظ كملف PDF.");
    }, 800);
  };

  const handleCopyReport = () => {
    navigator.clipboard.writeText(reportContent);
    toast.success("تم نسخ التقرير التنفيذي إلى الحافظة بنجاح!");
  };

  const handleShareReport = () => {
    if (navigator.share) {
      navigator.share({
        title: "COME IN IT — Sovereign Architecture & Investment Report",
        text: "تقرير السيادة المعمارية والاستثمارية لمنصة COME IN IT",
        url: window.location.href,
      }).catch(() => {});
    } else {
      handleCopyReport();
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 p-8 rounded-2xl border border-blue-500/20 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <ShieldCheck className="w-48 h-48 text-blue-400" />
        </div>
        <div className="relative z-10 space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <Badge className="bg-blue-600 text-white px-3 py-1 text-xs font-medium rounded-full flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
تقرير موثق للسيادة والمعمارية
            </Badge>
            <Badge variant="outline" className="border-blue-400/40 text-blue-300 px-3 py-1 text-xs font-medium rounded-full">
              إصدار المستثمرين والشركاء (v1.0)
            </Badge>
          </div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight">
            التقرير التنفيذي للسيادة المعمارية والاستثمار (Executive Report)
          </h2>
          <p className="text-slate-300 text-base max-w-3xl leading-relaxed">
            وثيقة تنفيذية شاملة ومصممة خصيصاً للمستثمرين (مثل Blue Port) والشركاء الاستراتيجيين، توضح معمارية السحابة الهجينة السيادية (Egypt-First Sovereign Hybrid Cloud) وإطار تصنيف البيانات وحوكمة الثقة.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Button
              onClick={handleDownloadMarkdown}
              disabled={isExporting}
              className="bg-blue-600 hover:bg-blue-500 text-white font-medium px-5 py-2.5 rounded-xl shadow-lg shadow-blue-600/20 flex items-center gap-2 transition-all"
            >
              <Download className="w-4 h-4" />
              {isExporting ? "جاري التصدير..." : "تحميل التقرير كملف (Markdown/MD)"}
            </Button>
            <Button
              onClick={handleExportPdf}
              disabled={isExporting}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium px-4 py-2.5 rounded-xl shadow-lg shadow-emerald-600/20 flex items-center gap-2 transition-all disabled:opacity-50"
            >
              {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
              {isExporting ? "جاري التصدير..." : "تصدير التقرير بصيغة PDF 📄"}
            </Button>
            <Button
              onClick={handleDownloadHtml}
              disabled={isExporting}
              variant="outline"
              className="border-blue-500/40 bg-blue-950/40 hover:bg-blue-900/60 text-blue-200 px-4 py-2.5 rounded-xl flex items-center gap-2"
            >
              <FileText className="w-4 h-4" />
              تنزيل HTML منسق
            </Button>
            <Button
              variant="outline"
              onClick={handleCopyReport}
              className="border-slate-700 bg-slate-900/60 hover:bg-slate-800 text-slate-200 px-4 py-2.5 rounded-xl flex items-center gap-2"
            >
              <Copy className="w-4 h-4" />
              نسخ النص الكامل
            </Button>
            <Button
              variant="outline"
              onClick={handleShareReport}
              className="border-slate-700 bg-slate-900/60 hover:bg-slate-800 text-slate-200 px-4 py-2.5 rounded-xl flex items-center gap-2"
            >
              <Share2 className="w-4 h-4" />
              مشاركة التقرير
            </Button>
          </div>
        </div>
      </div>

      {/* Report Sections Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-slate-900/80 border-slate-800/80 backdrop-blur-md">
          <CardHeader>
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-2">
              <Server className="w-5 h-5 text-blue-400" />
            </div>
            <CardTitle className="text-white text-lg">السيادة الوطنية (Sovereign Core)</CardTitle>
            <CardDescription className="text-slate-400 text-xs">توطين البيانات الحساسة بالكامل داخل مصر</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-slate-300 space-y-2">
            <p>حفظ وثائق KYC, KYB، سجلات التدقيق (Audit Logs)، ومفاتيح التشفير حصرياً داخل مراكز بيانات محلية متوافقة مع قانون 151 لسنة 2020.</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/80 border-slate-800/80 backdrop-blur-md">
          <CardHeader>
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-2">
              <Globe className="w-5 h-5 text-indigo-400" />
            </div>
            <CardTitle className="text-white text-lg">السحابة الهجينة (Hybrid Layer)</CardTitle>
            <CardDescription className="text-slate-400 text-xs">أحمال العمل المرنة مع تعقيم البيانات</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-slate-300 space-y-2">
            <p>إدارة الواجهات والبحث ومحركات المطابقة عبر سحب هجينة مرنة مع تمرير معرفات مجهولة (Tokenized IDs) لحماية الخصوصية.</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/80 border-slate-800/80 backdrop-blur-md">
          <CardHeader>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-2">
              <Lock className="w-5 h-5 text-emerald-400" />
            </div>
            <CardTitle className="text-white text-lg">حوكمة الثقة (Trust & RBAC)</CardTitle>
            <CardDescription className="text-slate-400 text-xs">منع أي تفاعل مجهول مسبقاً</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-slate-300 space-y-2">
            <p>تطبيق صارم لطبقات KYC ثم KYB ثم الأدوار والصلاحيات قبل السماح بأي تفاعل تجاري B2B على مستوى المنظومة بالكامل.</p>
          </CardContent>
        </Card>
      </div>

      {/* Full Report Preview Container */}
      <Card className="bg-slate-900/90 border-slate-800/80 shadow-xl overflow-hidden">
        <CardHeader className="border-b border-slate-800 bg-slate-950/40 flex flex-row items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-white text-xl flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-400" />
              معاينة محتوى التقرير التنفيذي
            </CardTitle>
            <CardDescription className="text-slate-400 text-xs">
              النص الكامل المعتمد للتقرير الموجه للمستثمرين وأصحاب المصلحة
            </CardDescription>
          </div>
          <Button
            size="sm"
            onClick={handleDownloadMarkdown}
            className="bg-blue-600 hover:bg-blue-500 text-white text-xs gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            تنزيل التقرير
          </Button>
        </CardHeader>
        <CardContent className="p-6 md:p-8">
          <div className="bg-slate-950/80 p-6 rounded-xl border border-slate-800/80 font-mono text-xs md:text-sm text-slate-300 leading-relaxed max-h-[500px] overflow-y-auto whitespace-pre-wrap selection:bg-blue-500 selection:text-white">
            {reportContent}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
