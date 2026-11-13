import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  FileText,
  Lock,
  Package,
  ShieldCheck,
  User,
  Users,
  ChevronRight,
  RotateCcw,
  Zap,
  TrendingUp,
  Database,
  Eye,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";

interface Stage {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  duration: number;
  status: "pending" | "active" | "completed" | "failed";
  details: string[];
  requirements: string[];
  outcomes: string[];
  canFail?: boolean;
}

interface JourneyStep {
  stage: Stage;
  timestamp: string;
  result: "success" | "pending" | "failed";
  message: string;
}

export default function DataFlowSimulator() {
  const [stages, setStages] = useState<Stage[]>([
    {
      id: "1-kyc",
      title: "1. تسجيل الحساب (User Registration)",
      description: "إنشاء حساب جديد بالبريد الإلكتروني والكلمة المرورية",
      icon: <User className="w-5 h-5" />,
      duration: 1000,
      status: "pending",
      details: [
        "التحقق من البريد الإلكتروني",
        "إنشاء كلمة مرورية قوية",
        "قبول الشروط والأحكام",
      ],
      requirements: ["بريد إلكتروني صحيح", "كلمة مرور قوية"],
      outcomes: ["حساب مستخدم نشط", "رمز تحقق مرسل"],
      canFail: false,
    },
    {
      id: "2-kyc-docs",
      title: "2. رفع وثائق الهوية (KYC Documents)",
      description: "رفع وثائق الهوية الشخصية (جواز سفر، بطاقة هوية، إلخ)",
      icon: <FileText className="w-5 h-5" />,
      duration: 2000,
      status: "pending",
      details: [
        "صورة من الوجه الأمامي للهوية",
        "صورة من الوجه الخلفي للهوية",
        "صورة شخصية حديثة (Selfie)",
        "إثبات العنوان (فاتورة أو عقد)",
      ],
      requirements: [
        "وثائق واضحة وغير منتهية الصلاحية",
        "صور بجودة عالية",
      ],
      outcomes: [
        "وثائق مخزنة بشكل آمن",
        "بدء مراجعة KYC",
      ],
      canFail: true,
    },
    {
      id: "3-kyc-review",
      title: "3. مراجعة التحقق الشخصي (KYC Review)",
      description: "فحص الوثائق والتحقق من البيانات الشخصية",
      icon: <ShieldCheck className="w-5 h-5" />,
      duration: 3000,
      status: "pending",
      details: [
        "فحص صحة الوثائق",
        "التحقق من عدم وجود في قوائم العقوبات",
        "التحقق من البيانات البيومترية",
        "اعتماد أو رفض KYC",
      ],
      requirements: ["وثائق صحيحة", "بيانات متطابقة"],
      outcomes: [
        "KYC_PROFILE.status = VERIFIED",
        "إمكانية إنشاء كيان تجاري",
      ],
      canFail: true,
    },
    {
      id: "4-business-creation",
      title: "4. إنشاء كيان تجاري (Business Entity)",
      description: "إنشاء شركة أو مصنع أو كيان تجاري جديد",
      icon: <Users className="w-5 h-5" />,
      duration: 1500,
      status: "pending",
      details: [
        "إدخال اسم الشركة القانوني",
        "اختيار نوع النشاط (مصنع، مستورد، مصدر، إلخ)",
        "إدخال رقم التسجيل التجاري",
        "إدخال الرقم الضريبي",
        "تحديد الموقع الجغرافي",
      ],
      requirements: [
        "KYC موثق",
        "بيانات تجارية صحيحة",
      ],
      outcomes: [
        "BUSINESS.id = UUID",
        "BUSINESS.status = PENDING_VERIFICATION",
      ],
      canFail: false,
    },
    {
      id: "5-kyb-docs",
      title: "5. رفع وثائق الشركة (KYB Documents)",
      description: "رفع وثائق الكيان التجاري (سجل تجاري، ترخيص، إلخ)",
      icon: <FileText className="w-5 h-5" />,
      duration: 2000,
      status: "pending",
      details: [
        "السجل التجاري",
        "البطاقة الضريبية",
        "شهادة التسجيل الصناعي",
        "ترخيص النشاط",
        "شهادات الجودة والاعتمادات",
      ],
      requirements: [
        "وثائق رسمية",
        "ختوم وتوقيعات صحيحة",
      ],
      outcomes: [
        "وثائق مخزنة بشكل آمن",
        "بدء مراجعة KYB",
      ],
      canFail: true,
    },
    {
      id: "6-kyb-review",
      title: "6. مراجعة التحقق التجاري (KYB Review)",
      description: "فحص الوثائق التجارية والتحقق من الشركة",
      icon: <ShieldCheck className="w-5 h-5" />,
      duration: 3000,
      status: "pending",
      details: [
        "فحص صحة الوثائق التجارية",
        "التحقق من السجل التجاري",
        "التحقق من عدم وجود في قوائم العقوبات",
        "التحقق من الموقع الجغرافي",
        "اعتماد أو رفض KYB",
      ],
      requirements: [
        "وثائق تجارية صحيحة",
        "بيانات متطابقة",
      ],
      outcomes: [
        "BUSINESS_VERIFICATION.kyb_status = VERIFIED",
        "إمكانية إضافة أعضاء وأدوار",
      ],
      canFail: true,
    },
    {
      id: "7-roles-assignment",
      title: "7. تعيين الأدوار (Role Assignment)",
      description: "تعيين أدوار الأعضاء داخل الشركة",
      icon: <Lock className="w-5 h-5" />,
      duration: 1000,
      status: "pending",
      details: [
        "اختيار دور المستخدم (مالك، مدير، مشتري، إلخ)",
        "تحديد نطاق المسؤولية",
        "تعيين تاريخ بدء الدور",
        "تعيين تاريخ انتهاء الدور (اختياري)",
      ],
      requirements: [
        "KYB موثق",
        "دور محدد",
      ],
      outcomes: [
        "BUSINESS_MEMBERSHIP.status = APPROVED",
        "ربط المستخدم بالشركة والدور",
      ],
      canFail: false,
    },
    {
      id: "8-permissions-grant",
      title: "8. منح الصلاحيات (Permissions Grant)",
      description: "منح الصلاحيات بناءً على الدور والحالة",
      icon: <ShieldCheck className="w-5 h-5" />,
      duration: 1500,
      status: "pending",
      details: [
        "تحديد الصلاحيات بناءً على RBAC (الدور)",
        "إضافة صلاحيات إضافية بناءً على ABAC (السمات)",
        "التحقق من حالة التحقق (KYC + KYB)",
        "تطبيق قيود الصلاحيات",
      ],
      requirements: [
        "دور محدد",
        "KYC + KYB موثقة",
      ],
      outcomes: [
        "ROLE_PERMISSION.* = GRANTED",
        "إمكانية الوصول للعمليات المسموحة",
      ],
      canFail: false,
    },
    {
      id: "9-product-creation",
      title: "9. إضافة المنتجات (Product Creation)",
      description: "إضافة منتجات الشركة إلى المنصة",
      icon: <Package className="w-5 h-5" />,
      duration: 2000,
      status: "pending",
      details: [
        "إدخال اسم المنتج",
        "اختيار الفئة",
        "إدخال الكود الجمركي (HS Code)",
        "إدخال المواصفات والخصائص",
        "تحديد الحد الأدنى للطلب (MOQ)",
        "تحديد القدرة الإنتاجية",
      ],
      requirements: [
        "صلاحيات كافية",
        "بيانات منتج صحيحة",
      ],
      outcomes: [
        "PRODUCT.id = UUID",
        "PRODUCT.status = DRAFT",
      ],
      canFail: false,
    },
    {
      id: "10-product-docs",
      title: "10. رفع وثائق المنتج (Product Documentation)",
      description: "رفع وثائق وشهادات المنتج",
      icon: <FileText className="w-5 h-5" />,
      duration: 2000,
      status: "pending",
      details: [
        "شهادات الجودة (ISO, CE, إلخ)",
        "صور المنتج",
        "مواصفات تقنية",
        "شهادات صحية وسلامة",
        "شهادات بيئية",
      ],
      requirements: [
        "وثائق رسمية",
        "صور عالية الجودة",
      ],
      outcomes: [
        "PRODUCT_DOCUMENT.* = UPLOADED",
        "بدء مراجعة المنتج",
      ],
      canFail: true,
    },
    {
      id: "11-product-verification",
      title: "11. توثيق المنتج (Product Verification)",
      description: "فحص والتحقق من بيانات المنتج والوثائق",
      icon: <ShieldCheck className="w-5 h-5" />,
      duration: 3000,
      status: "pending",
      details: [
        "فحص صحة البيانات",
        "التحقق من الشهادات",
        "فحص الصور والمواصفات",
        "التحقق من الامتثال للمعايير",
        "اعتماد أو رفض المنتج",
      ],
      requirements: [
        "وثائق صحيحة",
        "بيانات متطابقة",
      ],
      outcomes: [
        "PRODUCT_VERIFICATION.status = VERIFIED",
        "ظهور المنتج في نتائج المطابقة",
      ],
      canFail: true,
    },
    {
      id: "12-matching-access",
      title: "12. الوصول لمحرك المطابقة (Matching Access)",
      description: "ظهور المنتج في نتائج المطابقة والطلبات",
      icon: <TrendingUp className="w-5 h-5" />,
      duration: 1000,
      status: "pending",
      details: [
        "تفعيل المنتج في محرك المطابقة",
        "ربط المنتج بطلبات الشراء المطابقة",
        "حساب نسب التوافق",
        "إرسال إشعارات للمشترين المحتملين",
      ],
      requirements: [
        "منتج موثق",
        "بيانات صحيحة",
      ],
      outcomes: [
        "MATCH.* = CREATED",
        "استقبال طلبات شراء",
      ],
      canFail: false,
    },
  ]);

  const [journey, setJourney] = useState<JourneyStep[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [currentStageIndex, setCurrentStageIndex] = useState(-1);
  const [overallProgress, setOverallProgress] = useState(0);
  const [failureMode, setFailureMode] = useState<string | null>(null);

  const completedCount = stages.filter(s => s.status === "completed").length;
  const failedCount = stages.filter(s => s.status === "failed").length;
  const totalStages = stages.length;

  const runSimulation = async () => {
    setIsRunning(true);
    setJourney([]);
    setCurrentStageIndex(-1);
    setFailureMode(null);
    setStages(stages.map(s => ({ ...s, status: "pending" })));

    for (let i = 0; i < stages.length; i++) {
      setCurrentStageIndex(i);

      // Update stage status to active
      setStages(prev => {
        const updated = [...prev];
        updated[i] = { ...updated[i], status: "active" };
        return updated;
      });

      // Simulate processing
      await new Promise(resolve => setTimeout(resolve, stages[i].duration));

      // Randomly fail some stages if they can fail
      const shouldFail = stages[i].canFail && Math.random() < 0.15; // 15% failure rate

      if (shouldFail) {
        setFailureMode(stages[i].id);
        setStages(prev => {
          const updated = [...prev];
          updated[i] = { ...updated[i], status: "failed" };
          return updated;
        });

        setJourney(prev => [
          ...prev,
          {
            stage: stages[i],
            timestamp: new Date().toLocaleTimeString("ar-EG"),
            result: "failed",
            message: `❌ فشل: ${stages[i].title} — تم رفض الوثائق أو البيانات غير صحيحة. يرجى إعادة المحاولة.`,
          },
        ]);

        toast.error(`فشل: ${stages[i].title}`);
        break;
      } else {
        setStages(prev => {
          const updated = [...prev];
          updated[i] = { ...updated[i], status: "completed" };
          return updated;
        });

        setJourney(prev => [
          ...prev,
          {
            stage: stages[i],
            timestamp: new Date().toLocaleTimeString("ar-EG"),
            result: "success",
            message: `✅ نجح: ${stages[i].title} — تم الانتقال للمرحلة التالية.`,
          },
        ]);

        toast.success(`نجح: ${stages[i].title}`);
      }

      setOverallProgress(((i + 1) / totalStages) * 100);
    }

    if (!failureMode) {
      toast.success("🎉 رحلة المستخدم مكتملة! تم الوصول إلى محرك المطابقة.");
    }

    setIsRunning(false);
  };

  const resetSimulation = () => {
    setStages(stages.map(s => ({ ...s, status: "pending" })));
    setJourney([]);
    setCurrentStageIndex(-1);
    setOverallProgress(0);
    setFailureMode(null);
    setIsRunning(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-8">
        <div className="flex items-center gap-3 mb-4">
          <Zap className="w-8 h-8 text-amber-400" />
          <h2 className="text-3xl font-bold text-white">محاكي تدفق البيانات التفاعلي</h2>
        </div>
        <p className="text-slate-400 text-base">
          تتبع رحلة المستخدم الكاملة من تسجيل الحساب إلى الحصول على الصلاحيات وإضافة المنتجات والوصول لمحرك المطابقة
        </p>
      </div>

      {/* Control Panel */}
      <div className="flex gap-3 flex-wrap">
        <Button
          onClick={runSimulation}
          disabled={isRunning}
          className="bg-blue-600 hover:bg-blue-500 text-white font-medium shadow-lg shadow-blue-600/20"
        >
          <Zap className="w-4 h-4 ml-2" />
          {isRunning ? "جاري التشغيل..." : "تشغيل المحاكاة"}
        </Button>
        <Button
          onClick={resetSimulation}
          variant="outline"
          className="border-slate-700 bg-slate-800/50 hover:bg-slate-800 text-slate-200"
        >
          <RotateCcw className="w-4 h-4 ml-2" />
          إعادة تعيين
        </Button>
      </div>

      {/* Progress Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-slate-900/80 border-slate-800">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-400">{completedCount}</div>
              <div className="text-xs text-slate-400 mt-1">مراحل مكتملة</div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900/80 border-slate-800">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-400">{totalStages - completedCount - failedCount}</div>
              <div className="text-xs text-slate-400 mt-1">مراحل متبقية</div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900/80 border-slate-800">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-red-400">{failedCount}</div>
              <div className="text-xs text-slate-400 mt-1">مراحل فاشلة</div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900/80 border-slate-800">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-amber-400">{Math.round(overallProgress)}%</div>
              <div className="text-xs text-slate-400 mt-1">التقدم الإجمالي</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Overall Progress Bar */}
      <Card className="bg-slate-900/80 border-slate-800">
        <CardContent className="pt-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-white">التقدم الإجمالي</span>
              <span className="text-xs text-slate-400">{Math.round(overallProgress)}%</span>
            </div>
            <Progress value={overallProgress} className="h-3" />
          </div>
        </CardContent>
      </Card>

      {/* Stages Timeline */}
      <div className="space-y-3">
        {stages.map((stage, idx) => {
          const isActive = currentStageIndex === idx;
          const isCompleted = stage.status === "completed";
          const isFailed = stage.status === "failed";
          const isPending = stage.status === "pending";

          return (
            <div key={stage.id} className="relative">
              {/* Connector Line */}
              {idx < stages.length - 1 && (
                <div
                  className={`absolute right-8 top-16 w-0.5 h-12 ${
                    isCompleted ? "bg-green-500" : isFailed ? "bg-red-500" : "bg-slate-700"
                  }`}
                />
              )}

              {/* Stage Card */}
              <Card
                className={`relative border-2 transition-all ${
                  isActive
                    ? "bg-blue-600/20 border-blue-500 shadow-lg shadow-blue-600/20"
                    : isCompleted
                    ? "bg-green-600/10 border-green-500/30"
                    : isFailed
                    ? "bg-red-600/10 border-red-500/30"
                    : "bg-slate-900/60 border-slate-800"
                }`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start gap-4">
                    {/* Status Icon */}
                    <div
                      className={`p-3 rounded-lg shrink-0 ${
                        isCompleted
                          ? "bg-green-500/20 text-green-400"
                          : isFailed
                          ? "bg-red-500/20 text-red-400"
                          : isActive
                          ? "bg-blue-500/20 text-blue-400 animate-pulse"
                          : "bg-slate-800 text-slate-400"
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="w-5 h-5" />
                      ) : isFailed ? (
                        <AlertTriangle className="w-5 h-5" />
                      ) : isActive ? (
                        <Clock className="w-5 h-5" />
                      ) : (
                        stage.icon
                      )}
                    </div>

                    {/* Title and Description */}
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base font-bold text-white">
                        {stage.title}
                      </CardTitle>
                      <CardDescription className="text-sm mt-1">
                        {stage.description}
                      </CardDescription>
                    </div>

                    {/* Status Badge */}
                    <Badge
                      className={`shrink-0 ${
                        isCompleted
                          ? "bg-green-500/20 text-green-400 border-green-500/30"
                          : isFailed
                          ? "bg-red-500/20 text-red-400 border-red-500/30"
                          : isActive
                          ? "bg-blue-500/20 text-blue-400 border-blue-500/30 animate-pulse"
                          : "bg-slate-800 text-slate-400 border-slate-700"
                      }`}
                      variant="outline"
                    >
                      {isCompleted ? "✓ مكتمل" : isFailed ? "✗ فاشل" : isActive ? "⚙ جاري" : "⏳ معلق"}
                    </Badge>
                  </div>
                </CardHeader>

                {/* Expandable Details */}
                {(isActive || isCompleted || isFailed) && (
                  <CardContent className="space-y-4 border-t border-slate-700/50 pt-4">
                    {/* Requirements */}
                    <div>
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-blue-400 mb-2 flex items-center gap-2">
                        <Lock className="w-3.5 h-3.5" />
                        المتطلبات
                      </h4>
                      <ul className="space-y-1">
                        {stage.requirements.map((req, i) => (
                          <li key={i} className="text-xs text-slate-400 flex items-start gap-2">
                            <span className="text-blue-400 mt-0.5">•</span>
                            <span>{req}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Details */}
                    <div>
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2 flex items-center gap-2">
                        <FileText className="w-3.5 h-3.5" />
                        التفاصيل
                      </h4>
                      <ul className="space-y-1">
                        {stage.details.map((detail, i) => (
                          <li key={i} className="text-xs text-slate-400 flex items-start gap-2">
                            <span className="text-slate-500 mt-0.5">→</span>
                            <span>{detail}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Outcomes */}
                    <div>
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-green-400 mb-2 flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        النتائج
                      </h4>
                      <ul className="space-y-1">
                        {stage.outcomes.map((outcome, i) => (
                          <li key={i} className="text-xs text-slate-400 flex items-start gap-2">
                            <span className="text-green-400 mt-0.5">✓</span>
                            <span>{outcome}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                )}
              </Card>
            </div>
          );
        })}
      </div>

      {/* Journey Log */}
      {journey.length > 0 && (
        <Card className="bg-slate-900/80 border-slate-800">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
              <Database className="w-5 h-5 text-blue-400" />
              سجل الرحلة (Journey Log)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {journey.map((step, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-lg border text-sm font-mono ${
                    step.result === "success"
                      ? "bg-green-500/10 border-green-500/30 text-green-300"
                      : "bg-red-500/10 border-red-500/30 text-red-300"
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <span className="text-xs text-slate-400 shrink-0">[{step.timestamp}]</span>
                    <span>{step.message}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Success Message */}
      {completedCount === totalStages && !isRunning && (
        <div className="bg-gradient-to-r from-green-600/20 to-emerald-600/20 border border-green-500/30 rounded-xl p-6 text-center">
          <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto mb-3" />
          <h3 className="text-xl font-bold text-white mb-2">🎉 رحلة المستخدم مكتملة بنجاح!</h3>
          <p className="text-slate-300 text-sm">
            تم الانتقال بنجاح عبر جميع المراحل الـ 12 من التسجيل إلى الوصول لمحرك المطابقة. المستخدم الآن موثق بالكامل وجاهز لتلقي طلبات الشراء.
          </p>
        </div>
      )}

      {/* Failure Message */}
      {failureMode && !isRunning && (
        <div className="bg-gradient-to-r from-red-600/20 to-rose-600/20 border border-red-500/30 rounded-xl p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-red-400 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-lg font-bold text-white mb-1">⚠️ فشل في المحاكاة</h3>
              <p className="text-slate-300 text-sm mb-3">
                تم إيقاف المحاكاة في المرحلة: <strong>{stages.find(s => s.id === failureMode)?.title}</strong>
              </p>
              <p className="text-slate-400 text-xs">
                في الواقع، قد يحدث الفشل في أي مرحلة من مراحل التحقق (KYC أو KYB أو توثيق المنتج) إذا كانت الوثائق غير صحيحة أو البيانات غير متطابقة. يمكن إعادة المحاولة بعد تصحيح البيانات.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
