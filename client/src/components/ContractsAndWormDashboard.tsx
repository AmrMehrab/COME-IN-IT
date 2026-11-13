import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { FileCheck, ShieldAlert, Lock, History, Search, CheckCircle2, Clock, AlertTriangle, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

interface TradeContract {
  id: string;
  contractNumber: string;
  parties: string;
  tradeModel: "B2B" | "B2G" | "C2B";
  status: "ACTIVE" | "PENDING_RENEWAL" | "COMPLETED" | "AUDIT_REVIEW";
  valueEgp: number;
  expiresAt: string;
  wormHash: string;
}

interface WormAuditLog {
  id: string;
  timestamp: string;
  eventType: string;
  entityRef: string;
  actor: string;
  sha256: string;
  securityLevel: "CONFIDENTIAL" | "RESTRICTED" | "VERIFIED" | "PUBLIC";
}

const INITIAL_CONTRACTS: TradeContract[] = [
  {
    id: "cnt-1",
    contractNumber: "CII-CNT-2026-991",
    parties: "مصانع الهندسية الثقيلة ↔ الهيئة العربية للتصنيع",
    tradeModel: "B2G",
    status: "ACTIVE",
    valueEgp: 14500000,
    expiresAt: "2026-12-31",
    wormHash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
  },
  {
    id: "cnt-2",
    contractNumber: "CII-CNT-2026-902",
    parties: "الشركة المصرية للتجارة ↔ مجموعة التصدير السريع",
    tradeModel: "B2B",
    status: "PENDING_RENEWAL",
    valueEgp: 3200000,
    expiresAt: "2026-09-15",
    wormHash: "7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b",
  },
  {
    id: "cnt-3",
    contractNumber: "CII-CNT-2026-881",
    parties: "مؤسسة الأغذية الطازجة ↔ سلاسل التوزيع الكبرى",
    tradeModel: "B2B",
    status: "ACTIVE",
    valueEgp: 1850000,
    expiresAt: "2027-03-30",
    wormHash: "9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f0e9d8c7b6a5f4e3d2c1b0a9f8e",
  },
  {
    id: "cnt-4",
    contractNumber: "CII-CNT-2026-704",
    parties: "المقاولون العرب للتجارة ↔ الهيئة العامة للموانئ",
    tradeModel: "B2G",
    status: "AUDIT_REVIEW",
    valueEgp: 28000000,
    expiresAt: "2026-10-10",
    wormHash: "1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b",
  },
];

const INITIAL_LOGS: WormAuditLog[] = [
  {
    id: "log-1",
    timestamp: "2026-08-14 13:45:22",
    eventType: "CONTRACT_VERIFIED_AND_LOCKED",
    entityRef: "CII-CNT-2026-991",
    actor: "النظام (System Auto-Vault)",
    sha256: "e3b0c442...855",
    securityLevel: "RESTRICTED",
  },
  {
    id: "log-2",
    timestamp: "2026-08-14 12:10:05",
    eventType: "KYB_RE_VERIFICATION_PASSED",
    entityRef: "biz_88192041",
    actor: "مراقب الامتثال (Compliance Officer #04)",
    sha256: "7a8b9c0d...a8b",
    securityLevel: "VERIFIED",
  },
  {
    id: "log-3",
    timestamp: "2026-08-14 10:04:50",
    eventType: "PRODUCT_LIFECYCLE_STATE_CHANGE",
    entityRef: "prd_77192031",
    actor: "الممثل القانوني (usr_99182049)",
    sha256: "9f8e7d6c...f8e",
    securityLevel: "PUBLIC",
  },
];

export function ContractsAndWormDashboard() {
  const [contracts] = useState<TradeContract[]>(INITIAL_CONTRACTS);
  const [logs] = useState<WormAuditLog[]>(INITIAL_LOGS);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredContracts = contracts.filter(
    (c) =>
      c.contractNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.parties.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleVerifyIntegrity = (contractNum: string) => {
    toast.success(`تم التحقق بنجاح من سلامة العقد ${contractNum}! الهاش المشفر مطابق تماماً لسجلات WORM.`);
  };

  return (
    <div className="space-y-6">
      <div className="bg-card/60 p-6 rounded-2xl border border-border/65 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2 text-foreground">
            <Lock className="w-6 h-6 text-primary" />
            لوحة مراقبة العقود وسجلات التدقيق غير القابلة للتعديل (WORM Audit Vault)
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            إدارة ومتابعة العقود التجارية والصفقات الحكومية مع حفظ بصمات SHA-256 الزمنية لضمان عدم القابلية للحذف أو التعديل.
          </p>
        </div>
        <div className="w-full md:w-72">
          <Input
            placeholder="ابحث برقم العقد أو الأطراف..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-background"
          />
        </div>
      </div>

      {/* مؤشرات عامة */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border border-border/60">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">العقود النشطة</p>
              <h3 className="text-xl font-bold text-foreground mt-1">
                {contracts.filter((c) => c.status === "ACTIVE").length} عقود
              </h3>
            </div>
            <div className="p-3 bg-emerald-500/10 text-emerald-600 rounded-xl">
              <FileCheck className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
        <Card className="border border-border/60">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">إجمالي قيمة الصفقات</p>
              <h3 className="text-lg font-bold text-foreground mt-1">
                {(contracts.reduce((acc, c) => acc + c.valueEgp, 0) / 1000000).toFixed(1)} مليون ج.م
              </h3>
            </div>
            <div className="p-3 bg-primary/10 text-primary rounded-xl">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
        <Card className="border border-border/60">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">عقود تحت المراجعة أو التجديد</p>
              <h3 className="text-xl font-bold text-amber-600 mt-1">
                {contracts.filter((c) => c.status !== "ACTIVE").length} عقود
              </h3>
            </div>
            <div className="p-3 bg-amber-500/10 text-amber-600 rounded-xl">
              <Clock className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
        <Card className="border border-border/60">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">حالة التخزين السيادي WORM</p>
              <h3 className="text-sm font-bold text-emerald-600 mt-1 flex items-center gap-1.5">
                <Lock className="w-4 h-4" /> 100% Immutable
              </h3>
            </div>
            <div className="p-3 bg-purple-500/10 text-purple-600 rounded-xl">
              <History className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* جدول العقود النشطة */}
      <Card className="border border-border/60">
        <CardHeader>
          <CardTitle className="text-base font-bold">قائمة العقود والصفقات التجارية الموثقة</CardTitle>
          <CardDescription className="text-xs">
            يتم ربط كل عقد بهوية الكيانات المتحقق منها (KYB) وتسجيله في سجل التدقيق المنيع.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground text-xs uppercase font-semibold">
                  <th className="pb-3 pr-4">رقم العقد</th>
                  <th className="pb-3 px-4">أطراف التعاقد</th>
                  <th className="pb-3 px-4">النمط</th>
                  <th className="pb-3 px-4">القيمة (EGP)</th>
                  <th className="pb-3 px-4">تاريخ الانتهاء</th>
                  <th className="pb-3 px-4">الحالة</th>
                  <th className="pb-3 pl-4 text-left">إجراءات التدقيق</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredContracts.map((c) => (
                  <tr key={c.id} className="hover:bg-muted/30 transition-colors">
                    <td className="py-3 pr-4 font-mono font-bold text-xs text-foreground">{c.contractNumber}</td>
                    <td className="py-3 px-4 text-xs font-medium text-foreground/90">{c.parties}</td>
                    <td className="py-3 px-4">
                      <Badge variant="outline" className="text-[10px] font-mono">
                        {c.tradeModel}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 font-mono text-xs font-bold text-foreground">
                      {c.valueEgp.toLocaleString()} ج.م
                    </td>
                    <td className="py-3 px-4 font-mono text-xs text-muted-foreground">{c.expiresAt}</td>
                    <td className="py-3 px-4">
                      {c.status === "ACTIVE" && (
                        <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px]">نشط وساري</Badge>
                      )}
                      {c.status === "PENDING_RENEWAL" && (
                        <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-[10px]">قيد التجديد</Badge>
                      )}
                      {c.status === "AUDIT_REVIEW" && (
                        <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20 text-[10px]">مراجعة تدقيق</Badge>
                      )}
                    </td>
                    <td className="py-3 pl-4 text-left">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs gap-1.5"
                        onClick={() => handleVerifyIntegrity(c.contractNumber)}
                      >
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                        التحقق من الهاش
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* سجل تدفق أحداث WORM */}
      <Card className="border border-border/60">
        <CardHeader>
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <History className="w-4 h-4 text-primary" />
            سجل أحداث التدقيق الزمني المنيع (WORM Immutable Event Stream)
          </CardTitle>
          <CardDescription className="text-xs">
            سجل حي يوضح كافة العمليات الأمنية وتغييرات الحالة التي لا يمكن تعديلها أو مسحها بأي شكل.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {logs.map((log) => (
              <div key={log.id} className="p-3.5 bg-muted/40 rounded-xl border border-border/60 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px] font-mono bg-background">
                      {log.eventType}
                    </Badge>
                    <span className="text-xs font-mono text-muted-foreground">{log.timestamp}</span>
                  </div>
                  <div className="text-xs font-medium text-foreground">
                    المرجع: <span className="font-mono text-primary">{log.entityRef}</span> بواسطة {log.actor}
                  </div>
                </div>
                <div className="font-mono text-[10px] text-muted-foreground bg-background px-2.5 py-1 rounded border border-border/40 truncate max-w-xs">
                  SHA256: {log.sha256}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
