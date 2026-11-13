import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, Cloud, Server, ArrowRight, Lock, CheckCircle2, AlertTriangle, RefreshCw, Layers, Database, Cpu } from "lucide-react";

interface SimulationScenario {
  id: string;
  title: string;
  category: "KYC/KYB" | "B2B Trade" | "Government (B2G)" | "Market Analytics";
  description: string;
  sourceLayer: "Client Edge / Hybrid" | "Enterprise Edge" | "Government Gateway";
  destinationLayer: "Sovereign Core (Egypt NTRA / WORM)" | "Secure Vault" | "Encrypted Cache";
  dataClassification: "Confidential / Restricted" | "Verified Public" | "Sensitive Financial";
  complianceChecks: string[];
  flowSteps: {
    step: number;
    node: string;
    action: string;
    status: "SECURED" | "ENCRYPTED" | "VERIFIED" | "STORED";
    latency: string;
  }[];
}

const SCENARIOS: SimulationScenario[] = [
  {
    id: "kyc-flow",
    title: "1. تدفق بيانات التحقق الفردي (KYC) والهوية المشفرة",
    category: "KYC/KYB",
    description: "عند تسجيل مستخدم جديد وإدخال مستندات الهوية، يتم تشفير البصمة محلياً وإرسال الـ Hash فقط إلى السحابة السيادية بينما تبقى المستندات في الحفظ السيادي المحلي.",
    sourceLayer: "Client Edge / Hybrid",
    destinationLayer: "Sovereign Core (Egypt NTRA / WORM)",
    dataClassification: "Confidential / Restricted",
    complianceChecks: ["SHA-256 National ID Hashing", "Zero-Knowledge Proof Verification", "WORM Immutable Audit Log"],
    flowSteps: [
      { step: 1, node: "Client Browser / Edge", action: "التقاط مستند الهوية وتوليد التشفير المحلي (SHA-256)", status: "ENCRYPTED", latency: "12ms" },
      { step: 2, node: "Hybrid Gateway Proxy", action: "تمرير الهش فقط وحجب المستندات الخام عن السحابة العامة", status: "VERIFIED", latency: "24ms" },
      { step: 3, node: "Sovereign Core (NTRA)", action: "مطابقة الهش مع سجلات الدولة وحفظ السجل في WORM", status: "SECURED", latency: "45ms" },
      { step: 4, node: "Secure Vault", action: "تأكيد حالة التحقق (KYC_VERIFIED) وإنشاء جلسة الوصول", status: "STORED", latency: "18ms" }
    ]
  },
  {
    id: "b2b-trade",
    title: "2. تدفق عقود وتداولات B2B عبر محرك المطابقة وعلاقات التجارة",
    category: "B2B Trade",
    description: "التحقق من أهلية الطرفين عبر TradeRelationship ومطابقة المواصفات دون كشف الأسرار التجارية أو الحسابات البنكية لطرف ثالث.",
    sourceLayer: "Enterprise Edge",
    destinationLayer: "Sovereign Core (Egypt NTRA / WORM)",
    dataClassification: "Sensitive Financial",
    complianceChecks: ["KYB Active Status Check", "Role-Based Access Control (RBAC)", "Data Visibility Matrix Enforcement"],
    flowSteps: [
      { step: 1, node: "Buyer Enterprise Node", action: "إرسال طلب شراء موثق برقم السجل التجاري والـ KYB", status: "ENCRYPTED", latency: "15ms" },
      { step: 2, node: "Relationship Engine", action: "التحقق من وجود علاقة تجارية مفعلة (TRADE_RELATIONSHIP)", status: "VERIFIED", latency: "30ms" },
      { step: 3, node: "Sovereign Matching Core", action: "مطابقة المواصفات مع كتالوج المنتجات الموثقة فقط", status: "SECURED", latency: "52ms" },
      { step: 4, node: "Immutable Audit Log", action: "تسجيل العملية في سجل WORM غير القابل للتعديل", status: "STORED", latency: "20ms" }
    ]
  },
  {
    id: "b2g-tender",
    title: "3. تدفق مناقصات الجهات الحكومية (B2G) والسيادة المطلقة",
    category: "Government (B2G)",
    description: "معاملات الوزارات والهيئات الحكومية تُعزل بالكامل داخل السحابة السيادية داخل جمهورية مصر العربية مع تشفير من الطرف للطرف.",
    sourceLayer: "Government Gateway",
    destinationLayer: "Sovereign Core (Egypt NTRA / WORM)",
    dataClassification: "Confidential / Restricted",
    complianceChecks: ["Government Entity Isolation", "High-Security Encryption (AES-256)", "Sovereign Data Residency"],
    flowSteps: [
      { step: 1, node: "Government Entity Node", action: "إطلاق مناقصة رسمية برمز مؤسسي حكومي معتمد", status: "ENCRYPTED", latency: "10ms" },
      { step: 2, node: "Sovereign Gateway", action: "توجيه البيانات عبر القناة السيادية المعزولة حصرياً", status: "VERIFIED", latency: "22ms" },
      { step: 3, node: "Government Database", action: "تخزين المناقصة وضمان عدم مغادرتها للحدود الوطنية", status: "SECURED", latency: "35ms" },
      { step: 4, node: "Compliance Engine", action: "إصدار شهادة التشفير السيادي ومتابعة العروض", status: "STORED", latency: "15ms" }
    ]
  },
  {
    id: "market-intel",
    title: "4. تجميع المؤشرات الاقتصادية وصناع القرار (Market Intelligence)",
    category: "Market Analytics",
    description: "تجميع المؤشرات الإحصائية العامة وحجم الطلب والعرض لصناع القرار دون كشف البيانات الفردية أو الهويات التجارية الحساسة.",
    sourceLayer: "Enterprise Edge",
    destinationLayer: "Encrypted Cache",
    dataClassification: "Verified Public",
    complianceChecks: ["Anonymization & Aggregation", "Public vs Restricted Firewall", "Read-Only Analytics Access"],
    flowSteps: [
      { step: 1, node: "Aggregated Nodes", action: "تجميع إحصائيات الأسعار وحجم التداول بدون هويات", status: "ENCRYPTED", latency: "20ms" },
      { step: 2, node: "Analytics Firewall", action: "فلترة البيانات للتأكد من خلوها من الأسرار الفردية", status: "VERIFIED", latency: "28ms" },
      { step: 3, node: "Executive Dashboard", action: "عرض مؤشرات السوق لصناع القرار والمستثمرين", status: "SECURED", latency: "40ms" }
    ]
  }
];

export default function SovereignHybridSimulator() {
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>(SCENARIOS[0].id);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [simulationSpeed, setSimulationSpeed] = useState<number>(1000);

  const activeScenario = SCENARIOS.find((s) => s.id === selectedScenarioId) ?? SCENARIOS[0];

  const handleStartSimulation = () => {
    setIsPlaying(true);
    setCurrentStepIndex(0);
    const interval = window.setInterval(() => {
      setCurrentStepIndex((prev) => {
        if (prev < activeScenario.flowSteps.length - 1) {
          return prev + 1;
        } else {
          window.clearInterval(interval);
          setIsPlaying(false);
          return prev;
        }
      });
    }, simulationSpeed);
  };

  const handleReset = () => {
    setIsPlaying(false);
    setCurrentStepIndex(0);
  };

  return (
    <div className="space-y-6">
      <Card className="border-cyan-500/30 bg-slate-900/90 shadow-2xl shadow-cyan-950/20 backdrop-blur-xl">
        <CardHeader className="border-b border-slate-800 pb-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="border-cyan-400/40 bg-cyan-400/10 font-mono text-cyan-200">
                  Egypt-First Sovereign Hybrid Cloud
                </Badge>
                <Badge variant="outline" className="border-emerald-400/40 bg-emerald-400/10 font-mono text-emerald-200">
                  WORM & NTRA Compliance
                </Badge>
              </div>
              <CardTitle className="mt-2 text-xl font-bold text-white flex items-center gap-2">
                <Cloud className="h-6 w-6 text-cyan-400" />
                المحاكي المرئي لتدفق البيانات بين السحابة السيادية والهجينة
              </CardTitle>
              <CardDescription className="mt-1 text-xs leading-6 text-slate-400">
                استعرض بصرياً رحلة البيانات ومعالجة التشفير وحوكمة السيادة الوطنية بين الأطراف، البوابة الهجينة، والسحابة السيادية المركزية داخل مصر.
              </CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleStartSimulation}
                disabled={isPlaying}
                className="inline-flex items-center gap-2 rounded-xl bg-cyan-500 px-4 py-2.5 text-xs font-bold text-slate-950 transition-colors hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 shadow-lg shadow-cyan-500/20"
              >
                <RefreshCw className={`h-4 w-4 ${isPlaying ? "animate-spin" : ""}`} />
                {isPlaying ? "جاري تشغيل التدفق..." : "بدء المحاكاة المرئية ⚡"}
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-xs font-semibold text-slate-300 transition-colors hover:border-slate-500 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
              >
                إعادة ضبط
              </button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6 p-6">
          {/* Scenario Tabs */}
          <div className="flex flex-wrap gap-2" role="tablist" aria-label="سيناريوهات محاكي السحابة">
            {SCENARIOS.map((sc) => (
              <button
                key={sc.id}
                type="button"
                role="tab"
                aria-selected={selectedScenarioId === sc.id}
                onClick={() => {
                  setSelectedScenarioId(sc.id);
                  setCurrentStepIndex(0);
                  setIsPlaying(false);
                }}
                className={`rounded-xl border px-4 py-2.5 text-xs font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 ${
                  selectedScenarioId === sc.id
                    ? "border-cyan-400/60 bg-cyan-400/15 text-cyan-100 shadow-lg shadow-cyan-950/40"
                    : "border-slate-800 bg-slate-950/70 text-slate-400 hover:border-slate-600 hover:text-white"
                }`}
              >
                {sc.title}
              </button>
            ))}
          </div>

          {/* Active Scenario Info Box */}
          <div className="grid gap-4 md:grid-cols-3 rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
            <div className="space-y-1">
              <span className="text-[11px] font-semibold text-slate-400">طبقة المصدر (Source Layer):</span>
              <p className="font-mono text-xs text-cyan-200">{activeScenario.sourceLayer}</p>
            </div>
            <div className="space-y-1">
              <span className="text-[11px] font-semibold text-slate-400">طبقة الوجهة والسيادة (Destination):</span>
              <p className="font-mono text-xs text-emerald-200">{activeScenario.destinationLayer}</p>
            </div>
            <div className="space-y-1">
              <span className="text-[11px] font-semibold text-slate-400">تصنيف البيانات (Classification):</span>
              <p className="font-mono text-xs text-amber-200">{activeScenario.dataClassification}</p>
            </div>
          </div>

          {/* Visual Architecture Flow Diagram */}
          <div className="relative rounded-2xl border border-slate-800 bg-[#060e17] p-6 shadow-inner">
            <div className="absolute top-3 left-3 flex items-center gap-1.5 rounded-full bg-slate-900/90 border border-slate-800 px-3 py-1 font-mono text-[10px] text-slate-400">
              <Shield className="h-3.5 w-3.5 text-cyan-400" />
              Sovereign Hybrid Pipeline v1.0
            </div>

            <div className="grid gap-6 md:grid-cols-4 pt-6">
              {activeScenario.flowSteps.map((step, idx) => {
                const isCurrent = currentStepIndex >= idx;
                const isActiveStep = currentStepIndex === idx;

                return (
                  <div
                    key={step.step}
                    className={`relative flex flex-col rounded-xl border p-4 transition-all duration-300 ${
                      isActiveStep
                        ? "border-cyan-400 bg-cyan-950/30 shadow-lg shadow-cyan-950/50 scale-[1.02]"
                        : isCurrent
                        ? "border-emerald-500/50 bg-slate-900/80 text-white"
                        : "border-slate-800/80 bg-slate-950/40 text-slate-500 opacity-60"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className={`flex h-7 w-7 items-center justify-center rounded-lg font-mono text-xs font-bold ${
                        isActiveStep ? "bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30" : isCurrent ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40" : "bg-slate-800 text-slate-400"
                      }`}>
                        0{step.step}
                      </span>
                      <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">
                        {step.latency}
                      </span>
                    </div>

                    <div className="space-y-1 mb-3">
                      <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                        <Server className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
                        {step.node}
                      </h4>
                      <p className="text-[11px] leading-5 text-slate-300">{step.action}</p>
                    </div>

                    <div className="mt-auto pt-3 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono">
                      <span className="text-slate-400">الحالة:</span>
                      <span className={`font-semibold ${step.status === "SECURED" ? "text-cyan-300" : step.status === "ENCRYPTED" ? "text-amber-300" : step.status === "VERIFIED" ? "text-blue-300" : "text-emerald-300"}`}>
                        {step.status}
                      </span>
                    </div>

                    {idx < activeScenario.flowSteps.length - 1 && (
                      <div className="hidden md:flex absolute -left-3 top-1/2 -translate-y-1/2 z-10 items-center justify-center text-slate-600">
                        <ArrowRight className={`h-4 w-4 ${isCurrent ? "text-cyan-400" : "text-slate-700"}`} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Compliance & Security Gates */}
          <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5 space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Lock className="h-4 w-4 text-emerald-400" />
              قواعد الحوكمة والسيادة المفروضة على هذا التدفق:
            </h4>
            <div className="grid gap-2 sm:grid-cols-3">
              {activeScenario.complianceChecks.map((check, i) => (
                <div key={i} className="flex items-center gap-2 rounded-xl border border-slate-800/80 bg-slate-900/60 p-3 text-xs text-slate-200">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span className="font-mono">{check}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
