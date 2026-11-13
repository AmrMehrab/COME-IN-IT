import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Streamdown } from "streamdown";
import { specSections, SpecSection } from "@/data/specData";
import { architectureDocs, ArchitectureDocItem } from "@/data/architectureDocs";
import ERDVisualization from "@/components/ERDVisualization";
import DataFlowSimulator from "@/components/DataFlowSimulator";
import PermissionsMatrix from "@/components/PermissionsMatrix";
import SovereignExecutiveReport from "@/components/SovereignExecutiveReport";
import TradeModelsMatrix from "@/components/TradeModelsMatrix";
import SovereignHybridSimulator from "@/components/SovereignHybridSimulator";
import { DigitalComplianceCertificate } from "@/components/DigitalComplianceCertificate";
import { ApiDocumentationView } from "@/components/ApiDocumentationView";
import { LoadBalancerSimulator } from "@/components/LoadBalancerSimulator";
import { ContractsAndWormDashboard } from "@/components/ContractsAndWormDashboard";
import { NotificationCenter } from "@/components/NotificationCenter";
import { TradeAnalyticsDashboard } from "@/components/TradeAnalyticsDashboard";
import { ElectronicSignatureWorkflow } from "@/components/ElectronicSignatureWorkflow";
import { DisputeResolutionSimulator } from "@/components/DisputeResolutionSimulator";
import ArchitectureReconciliationView from "@/components/ArchitectureReconciliationView";
import { HealthcareDomainDashboard } from "@/components/HealthcareDomainDashboard";
import { TradeOperationsDashboard } from "@/components/TradeOperationsDashboard";
import PolicyEngineDashboard from "@/components/PolicyEngineDashboard";
import { CommercialCapabilitiesDashboard } from "@/components/CommercialCapabilitiesDashboard";
import LiveSimulationEnvironment from "@/components/LiveSimulationEnvironment";
import InteractivePrototype from "@/components/InteractivePrototype";
import { NewCustomerOnboarding } from "@/components/NewCustomerOnboarding";
import { OwnerControlCenter } from "@/components/OwnerControlCenter";
import { CriticalGapsDashboard } from "@/components/CriticalGapsDashboard";
import { OwnerOAuthLoginPanel } from "@/components/OwnerOAuthLoginPanel";
import { RoleBasedCommercePortal } from "@/components/RoleBasedCommercePortal";
import {
  ShieldCheck, 
  Award,
  Code2,
  Server,
  FileCheck,
  Bell,
  TrendingUp,
  FileSignature,
  Scale,
  Search, 
  BookOpen, 
  Layers, 
  FileText, 
  Lock, 
  Cpu, 
  Users, 
  CheckCircle2, 
  AlertTriangle, 
  Building2, 
  Factory, 
  ShoppingBag, 
  BarChart3, 
  Share2, 
  Bookmark, 
  ExternalLink,
  Cloud,
  ChevronRight,
  SlidersHorizontal,
  Database,
  Zap,
  LogIn,
  LogOut,
  Play,
  Stethoscope,
  FlaskConical,
  BriefcaseBusiness,
  GitCompare,
  KeyRound,
  Sparkles
} from "lucide-react";
import { toast } from "sonner";

const verificationStatusLabel: Record<string, string> = {
  unverified: "غير متحقق",
  pending: "قيد المراجعة",
  verified: "متحقق",
  suspended: "معلّق",
  expired: "منتهي",
  rejected: "مرفوض",
  manual_review: "مراجعة يدوية",
  passed: "اجتاز الحيوية",
  failed: "فشل الحيوية",
};

const verificationStatusClass: Record<string, string> = {
  unverified: "border-slate-200 bg-slate-50 text-slate-700",
  pending: "border-amber-200 bg-amber-50 text-amber-800",
  verified: "border-emerald-200 bg-emerald-50 text-emerald-800",
  suspended: "border-rose-200 bg-rose-50 text-rose-800",
  expired: "border-orange-200 bg-orange-50 text-orange-800",
  rejected: "border-rose-200 bg-rose-50 text-rose-800",
};

export default function Home() {
  const { user, loading, isAuthenticated, logout } = useAuth();
  useEffect(() => {
    if (loading || isAuthenticated || typeof window === "undefined") return;
    if (new URLSearchParams(window.location.search).get("login") === "1") {
      startLogin();
    }
  }, [loading, isAuthenticated]);
  const bookmarksQuery = trpc.bookmarks.list.useQuery(undefined, { enabled: isAuthenticated });
  const businessesQuery = trpc.businesses.list.useQuery(undefined, { enabled: isAuthenticated });
  const kycQuery = trpc.verification.kyc.me.useQuery(undefined, { enabled: isAuthenticated });
  const kybQuery = trpc.verification.kyb.list.useQuery(undefined, { enabled: isAuthenticated });
  const biometricQuery = trpc.verification.biometric.me.useQuery(undefined, { enabled: isAuthenticated });
  const trpcUtils = trpc.useUtils();
  const bookmarkMutation = trpc.bookmarks.toggle.useMutation({
    onSuccess: async result => {
      await trpcUtils.bookmarks.list.invalidate();
      toast.success(result.bookmarked ? "تم حفظ القسم في حسابك" : "تمت إزالة القسم من حسابك");
    },
    onError: () => {
      toast.error("تعذر تحديث الحفظ الدائم. حاول مرة أخرى.");
    },
  });
  const kycSubmission = trpc.verification.kyc.submit.useMutation({
    onSuccess: async () => {
      await trpcUtils.verification.kyc.me.invalidate();
      await trpcUtils.verification.kyb.list.invalidate();
      toast.success("تم حفظ طلب KYC وإحالته إلى المراجعة.");
    },
    onError: () => toast.error("تعذر حفظ طلب KYC. لم يتم تخزين أي مستندات حساسة في المتصفح."),
  });
  const kybSubmission = trpc.verification.kyb.submit.useMutation({
    onSuccess: async () => {
      await trpcUtils.verification.kyb.list.invalidate();
      await trpcUtils.businesses.list.invalidate();
      toast.success("تم حفظ طلب KYB وربطه بالكيان التجاري للمراجعة.");
    },
    onError: error => toast.error(error.message || "تعذر حفظ طلب KYB."),
  });
  const biometricConsent = trpc.verification.biometric.grantConsent.useMutation({
    onSuccess: async () => {
      await trpcUtils.verification.biometric.me.invalidate();
      toast.success("تم تسجيل موافقتك البيومترية وتوثيقها في سجل التدقيق.");
    },
    onError: error => toast.error(error.message || "تعذر تسجيل الموافقة البيومترية."),
  });
  const revokeBiometricConsent = trpc.verification.biometric.revokeConsent.useMutation({
    onSuccess: async () => {
      await trpcUtils.verification.biometric.me.invalidate();
      toast.success("تم تسجيل سحب الموافقة البيومترية.");
    },
    onError: error => toast.error(error.message || "تعذر سحب الموافقة البيومترية."),
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedDoc, setSelectedDoc] = useState<ArchitectureDocItem | null>(null);
  const [activeTab, setActiveTab] = useState(() => {
    if (typeof window === "undefined") return "specs";
    const directTab = new URLSearchParams(window.location.search).get("tab");
    const availableTabs = ["specs", "saved", "verification", "health", "trade-operations", "commercial-capabilities", "commerce-portal", "prototype", "live-simulation", "architecture-docs", "erd", "simulator", "cloud-sim", "permissions", "report", "models", "certificate", "api", "balancer", "contracts", "notifications", "analytics", "signature", "disputes", "reconciliation", "critical-gaps", "owner-login", "owner-console"];
    return directTab && availableTabs.includes(directTab) ? directTab : "specs";
  });
  const [onboardingOpen, setOnboardingOpen] = useState(() => {
    if (typeof window === "undefined") return false;
    return new URLSearchParams(window.location.search).get("onboarding") === "1";
  });

  const navigateToTab = (tab: string) => {
    setActiveTab(tab);
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    params.set("tab", tab);
    const query = params.toString();
    window.history.replaceState({}, "", `${window.location.pathname}${query ? `?${query}` : ""}`);
  };
  const [kycCountry, setKycCountry] = useState("EG");
  const [kycProviderReference, setKycProviderReference] = useState("");
  const [kybBusinessId, setKybBusinessId] = useState("");
  const [kybProviderReference, setKybProviderReference] = useState("");
  const bookmarkedIds = bookmarksQuery.data ?? [];
  const userBusinesses = businessesQuery.data ?? [];
  const kycStatus = kycQuery.data?.latest?.status ?? kycQuery.data?.lifecycleStatus ?? "unverified";
  const savedSections = useMemo(
    () => specSections.filter(section => bookmarkedIds.includes(section.id)),
    [bookmarkedIds],
  );

  // Filter sections
  const filteredSections = useMemo(() => {
    return specSections.filter((section) => {
      const matchesSearch = 
        section.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        section.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
        section.content.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = selectedCategory === "All" || section.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchTerm, selectedCategory]);

  const categories = useMemo(() => {
    const cats = ["All", ...Array.from(new Set(specSections.map(s => s.category)))];
    return cats;
  }, []);

  const toggleBookmark = (id: number) => {
    if (!isAuthenticated) {
      toast.info("سجّل الدخول لحفظ أقسامك واستعادتها عند العودة.");
      startLogin();
      return;
    }

    bookmarkMutation.mutate({ sectionId: id });
  };

  const handleShare = (title: string) => {
    navigator.clipboard.writeText(window.location.href);
    toast.success(`تم نسخ رابط القسم (${title}) للمشاركة بسهولة!`);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-blue-700 selection:text-white">
      <NewCustomerOnboarding
        open={onboardingOpen}
        onOpenChange={setOnboardingOpen}
        onNavigate={destination => {
          setOnboardingOpen(false);
          navigateToTab(destination);
        }}
      />
      {/* Top Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 rounded-xl bg-slate-950 flex items-center justify-center shadow-lg shadow-slate-900/20 overflow-hidden">
              <div className="absolute inset-1 rounded-lg border border-cyan-300/70" />
              <ShieldCheck className="relative w-5 h-5 text-cyan-300" />
            </div>
            <div>
              <h1 className="font-black text-[15px] tracking-[0.18em] text-slate-950 flex items-center gap-2">
                COME / IN IT
                <Badge variant="outline" className="text-[10px] bg-blue-50 text-blue-700 border-blue-200">
                  Version 1.0 — Architecture & Spec
                </Badge>
              </h1>
              <p className="text-xs text-slate-500">شبكة التجارة الرقمية الموثوقة · Sovereign Trade Network</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {loading ? (
              <Badge variant="outline" className="hidden border-slate-200 bg-slate-50 text-slate-500 sm:inline-flex">
                تجهيز الحفظ
              </Badge>
            ) : isAuthenticated ? (
              <Button
                variant="outline"
                size="sm"
                className="hidden border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 sm:inline-flex"
                onClick={() => logout()}
                title="تسجيل الخروج من الحفظ الدائم"
              >
                <LogOut className="ml-2 h-4 w-4" />
                {user?.role === "owner" ? "Amr.Anwar — المالك" : user?.name || "الحفظ مفعّل"}
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="inline-flex border-blue-200 bg-blue-50 text-blue-800 hover:bg-blue-100"
                onClick={startLogin}
              >
                <LogIn className="ml-2 h-4 w-4" />
                تسجيل الدخول
              </Button>
            )}
            {user?.role === "owner" && <Button
              size="sm"
              className="bg-slate-950 text-white shadow-md shadow-slate-900/15 hover:bg-blue-900"
              onClick={() => navigateToTab("owner-console")}
              title="فتح لوحة تحكم المالك"
            >
              <ShieldCheck className="ml-2 h-4 w-4 text-cyan-300" />
              لوحة المالك
            </Button>}
            <Button
              variant="outline"
              size="sm"
              className="hidden border-cyan-200 bg-cyan-50 text-cyan-800 hover:bg-cyan-100 md:inline-flex"
              onClick={() => setOnboardingOpen(true)}
            >
              <Sparkles className="ml-2 h-4 w-4" />
              ابدأ الآن
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
              onClick={() => {
                toast.success("تم تفعيل وضع استكشاف البيانات بسهولة والاتجاهات الشاملة.");
              }}
            >
              <Share2 className="w-4 h-4 ml-2 text-blue-400" />
              مشاركة المواصفات
            </Button>
            <Button 
              size="sm"
              className="bg-slate-950 hover:bg-blue-900 text-white font-medium shadow-lg shadow-slate-900/15"
              onClick={() => {
                const el = document.getElementById("architecture-docs");
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              <Cpu className="w-4 h-4 ml-2" />
              الوثائق المعمارية
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-16 lg:py-24 bg-gradient-to-b from-slate-950 via-slate-900 to-[#0f172a] border-b border-slate-800/80">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.14),transparent_48%)]" />
        <div className="absolute right-0 top-0 h-full w-px bg-cyan-300/25" />
        <div className="container mx-auto px-4 relative z-10 max-w-5xl text-center">
          <Badge className="mb-4 bg-cyan-400/10 text-cyan-200 border-cyan-300/25 px-3 py-1 text-sm font-medium">
            MANUS FIRST ACTION — المرجع التقني والمنتج الموحد
          </Badge>
          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white mb-6 leading-tight">
            لا جهة مجهولة تتاجر مع جهة مجهولة، <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-blue-300 to-indigo-300">
              ولا يُجرى أي تداول على منتج مجهول.
            </span>
          </h2>
          <p className="text-slate-300 text-base md:text-lg max-w-3xl mx-auto mb-10 leading-relaxed">
            المرجع التقني والهندسي الشامل لربط الصناعة المصرية بالطلب المحلي والدولي من خلال بنية أساسية صارمة للثقة، الهوية، التحقق، هوية المنتج، واستخبارات السوق.
          </p>

          {/* Search Box */}
          <div className="max-w-2xl mx-auto relative mb-8">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <Input 
              type="text"
              placeholder="ابحث في أقسام المواصفات المعمارية، KYC، KYB، المطابقة، الأذونات..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pr-12 pl-4 py-4 bg-slate-900/90 border-slate-700 text-slate-100 placeholder:text-slate-500 rounded-xl shadow-2xl focus:border-blue-500 text-base"
            />
          </div>

          {!isAuthenticated && !loading && <Button type="button" variant="outline" onClick={() => navigateToTab("owner-login")} className="mb-8 border-cyan-300/40 bg-cyan-400/10 text-cyan-100 hover:bg-cyan-400/20">
            <KeyRound className="ml-2 h-4 w-4" /> واجهة دخول المالك OAuth وبيانات الاختبار
          </Button>}

          {!isAuthenticated && !loading && <div className="mb-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button size="lg" onClick={startLogin} className="w-full bg-cyan-400 px-8 font-bold text-slate-950 shadow-lg shadow-cyan-400/20 hover:bg-cyan-300 sm:w-auto">
              <LogIn className="ml-2 h-5 w-5" /> تسجيل الدخول للبدء
            </Button>
            <span className="text-xs text-slate-400">مصادقة آمنة عبر Manus OAuth — لا توجد كلمة مرور محلية</span>
          </div>}

          {/* 3 Core Benefits Showcase */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-right max-w-4xl mx-auto">
            <div className="bg-slate-900/60 border border-slate-800/80 p-4 rounded-xl flex items-start gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 mt-1">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-white text-sm">استكشاف البيانات بشكل أكثر سهولة</h3>
                <p className="text-xs text-slate-400 mt-1">تصفح فوري ومصنف للأقسام الـ 10 الرئيسية والوثائق المعمارية والرسوم البيانية.</p>
              </div>
            </div>
            <div className="bg-slate-900/60 border border-slate-800/80 p-4 rounded-xl flex items-start gap-3">
              <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 mt-1">
                <BarChart3 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-white text-sm">فهم الاتجاهات بشكل أفضل</h3>
                <p className="text-xs text-slate-400 mt-1">تحليلات دقيقة لهندسة المنظومة وسلاسل الإمداد ومؤشرات الثقة والسيادة.</p>
              </div>
            </div>
            <div className="bg-slate-900/60 border border-slate-800/80 p-4 rounded-xl flex items-start gap-3">
              <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 mt-1">
                <Bookmark className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-white text-sm">الحفظ أو المشاركة بسهولة</h3>
                <p className="text-xs text-slate-400 mt-1">إمكانية حفظ الأقسام المهمة في المفضلة ومشاركة التقرير بضغطة زر واحدة.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="flex-1 container mx-auto px-4 py-12 max-w-6xl">
        <div className="mb-8 grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm"><div className="rounded-lg bg-emerald-50 p-2 text-emerald-700"><CheckCircle2 className="h-4 w-4" /></div><div><p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">Identity gate</p><p className="text-sm font-bold text-slate-900">KYC / KYB verified</p></div><Badge variant="outline" className="mr-auto border-emerald-200 bg-emerald-50 text-emerald-700">Active</Badge></div>
          <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm"><div className="rounded-lg bg-blue-50 p-2 text-blue-700"><Lock className="h-4 w-4" /></div><div><p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">Data boundary</p><p className="text-sm font-bold text-slate-900">Egypt sovereign core</p></div><Badge variant="outline" className="mr-auto border-blue-200 bg-blue-50 text-blue-700">Guarded</Badge></div>
          <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm"><div className="rounded-lg bg-amber-50 p-2 text-amber-700"><FileCheck className="h-4 w-4" /></div><div><p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">Audit posture</p><p className="text-sm font-bold text-slate-900">WORM event trail</p></div><Badge variant="outline" className="mr-auto border-amber-200 bg-amber-50 text-amber-700">Immutable</Badge></div>
        </div>
        <Tabs value={activeTab} onValueChange={navigateToTab} className="w-full">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8 overflow-x-auto">
            <TabsList className="bg-white border border-slate-200 p-1 rounded-xl shadow-sm">
              <TabsTrigger value="specs" className="data-[state=active]:bg-slate-950 data-[state=active]:text-white text-slate-600 rounded-lg px-4 text-sm">
                أقسام المواصفات
              </TabsTrigger>
              <TabsTrigger value="saved" className="data-[state=active]:bg-amber-600 data-[state=active]:text-white text-slate-600 rounded-lg px-4 text-sm flex items-center gap-2">
                <Bookmark className="w-4 h-4" />
                محفوظاتي
              </TabsTrigger>
              <TabsTrigger value="verification" className="data-[state=active]:bg-emerald-700 data-[state=active]:text-white text-slate-600 rounded-lg px-4 text-sm flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" />
                التحقق KYC/KYB
              </TabsTrigger>
              {user?.role === "owner" && <TabsTrigger value="owner-console" className="data-[state=active]:bg-slate-950 data-[state=active]:text-white text-slate-600 rounded-lg px-4 text-sm flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-cyan-600" />لوحة المالك</TabsTrigger>}
              <TabsTrigger value="owner-login" className="data-[state=active]:bg-cyan-700 data-[state=active]:text-white text-slate-600 rounded-lg px-4 text-sm flex items-center gap-2"><LogIn className="h-4 w-4" />دخول المالك</TabsTrigger>
              <TabsTrigger value="health" className="data-[state=active]:bg-cyan-700 data-[state=active]:text-white text-slate-600 rounded-lg px-4 text-sm flex items-center gap-2">
                <Stethoscope className="w-4 h-4" />
                Healthcare
              </TabsTrigger>
              <TabsTrigger value="trade-operations" className="data-[state=active]:bg-indigo-700 data-[state=active]:text-white text-slate-600 rounded-lg px-4 text-sm flex items-center gap-2">
                <ShoppingBag className="w-4 h-4" />
                التجارة التشغيلية
              </TabsTrigger>
              <TabsTrigger value="policy-engine" className="data-[state=active]:bg-blue-700 data-[state=active]:text-white text-slate-600 rounded-lg px-4 text-sm flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" />
                Policy Engine
              </TabsTrigger>
              <TabsTrigger value="commercial-capabilities" className="data-[state=active]:bg-teal-700 data-[state=active]:text-white text-slate-600 rounded-lg px-4 text-sm flex items-center gap-2">
                <BriefcaseBusiness className="w-4 h-4" />
                القدرات التجارية
              </TabsTrigger>
              <TabsTrigger value="commerce-portal" className="data-[state=active]:bg-indigo-700 data-[state=active]:text-white text-slate-600 rounded-lg px-4 text-sm flex items-center gap-2">
                <ShoppingBag className="w-4 h-4" />
                بوابة الشراء والتوريد
              </TabsTrigger>
              <TabsTrigger value="live-simulation" className="data-[state=active]:bg-fuchsia-700 data-[state=active]:text-white text-slate-600 rounded-lg px-4 text-sm flex items-center gap-2">
                <FlaskConical className="w-4 h-4" />
                Live Simulation
              </TabsTrigger>
              <TabsTrigger value="prototype" className="data-[state=active]:bg-cyan-700 data-[state=active]:text-white text-slate-600 rounded-lg px-4 text-sm flex items-center gap-2">
                <Play className="w-4 h-4" />
                Prototype
              </TabsTrigger>
              <TabsTrigger value="architecture-docs" id="architecture-docs" className="data-[state=active]:bg-slate-950 data-[state=active]:text-white text-slate-600 rounded-lg px-4 text-sm">
                الوثائق المعمارية (10 طبقات)
              </TabsTrigger>
              <TabsTrigger value="erd" className="data-[state=active]:bg-slate-950 data-[state=active]:text-white text-slate-600 rounded-lg px-4 text-sm flex items-center gap-2">
                <Database className="w-4 h-4" />
                مخطط ERD
              </TabsTrigger>
              <TabsTrigger value="simulator" className="data-[state=active]:bg-slate-950 data-[state=active]:text-white text-slate-600 rounded-lg px-4 text-sm flex items-center gap-2">
                <Zap className="w-4 h-4" />
                محاكي التدفق
              </TabsTrigger>
              <TabsTrigger value="cloud-sim" className="data-[state=active]:bg-cyan-700 data-[state=active]:text-white text-slate-600 rounded-lg px-4 text-sm flex items-center gap-2">
                <Cloud className="w-4 h-4 text-cyan-300" />
                السحابة السيادية والهجينة
              </TabsTrigger>
              <TabsTrigger value="permissions" className="data-[state=active]:bg-slate-950 data-[state=active]:text-white text-slate-600 rounded-lg px-4 text-sm flex items-center gap-2">
                <Lock className="w-4 h-4" />
                مصفوفة الصلاحيات
              </TabsTrigger>
              <TabsTrigger value="report" className="data-[state=active]:bg-slate-950 data-[state=active]:text-white text-slate-600 rounded-lg px-4 text-sm flex items-center gap-2">
                <FileText className="w-4 h-4" />
                التقرير التنفيذي
              </TabsTrigger>
              <TabsTrigger value="models" className="data-[state=active]:bg-slate-950 data-[state=active]:text-white text-slate-600 rounded-lg px-4 text-sm flex items-center gap-2">
                <Layers className="w-4 h-4" />
                الأنماط التجارية (5)
              </TabsTrigger>
              <TabsTrigger value="certificate" className="data-[state=active]:bg-emerald-700 data-[state=active]:text-white text-slate-600 rounded-lg px-4 text-sm flex items-center gap-2">
                <Award className="w-4 h-4 text-emerald-300" />
                شهادة الامتثال
              </TabsTrigger>
              <TabsTrigger value="api" className="data-[state=active]:bg-slate-950 data-[state=active]:text-white text-slate-600 rounded-lg px-4 text-sm flex items-center gap-2">
                <Code2 className="w-4 h-4 text-indigo-300" />
                واجهات API
              </TabsTrigger>
              <TabsTrigger value="balancer" className="data-[state=active]:bg-cyan-700 data-[state=active]:text-white text-slate-600 rounded-lg px-4 text-sm flex items-center gap-2">
                <Server className="w-4 h-4 text-cyan-300" />
                موازنة الأحمال
              </TabsTrigger>
              <TabsTrigger value="contracts" className="data-[state=active]:bg-amber-700 data-[state=active]:text-white text-slate-600 rounded-lg px-4 text-sm flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-amber-300" />
                العقود والتدقيق
              </TabsTrigger>
              <TabsTrigger value="notifications" className="data-[state=active]:bg-rose-700 data-[state=active]:text-white text-slate-600 rounded-lg px-4 text-sm flex items-center gap-2">
                <Bell className="w-4 h-4 text-rose-300" />
                مركز التنبيهات
              </TabsTrigger>
              <TabsTrigger value="analytics" className="data-[state=active]:bg-purple-700 data-[state=active]:text-white text-slate-600 rounded-lg px-4 text-sm flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-purple-300" />
                تحليلات الطلب
              </TabsTrigger>
              <TabsTrigger value="signature" className="data-[state=active]:bg-emerald-700 data-[state=active]:text-white text-slate-600 rounded-lg px-4 text-sm flex items-center gap-2">
                <FileSignature className="w-4 h-4 text-emerald-300" />
                التوقيع والتوثيق
              </TabsTrigger>
              <TabsTrigger value="disputes" className="data-[state=active]:bg-amber-700 data-[state=active]:text-white text-slate-600 rounded-lg px-4 text-sm flex items-center gap-2">
                <Scale className="w-4 h-4 text-amber-300" />
                إدارة النزاعات
              </TabsTrigger>
              <TabsTrigger value="reconciliation" className="data-[state=active]:bg-indigo-700 data-[state=active]:text-white text-slate-600 rounded-lg px-4 text-sm flex items-center gap-2">
                <GitCompare className="w-4 h-4" />
                المصالحة المعمارية
              </TabsTrigger>
              <TabsTrigger value="critical-gaps" className="data-[state=active]:bg-rose-700 data-[state=active]:text-white text-slate-600 rounded-lg px-4 text-sm flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Critical Gaps
              </TabsTrigger>
            </TabsList>
            <div className="text-xs text-slate-500 shrink-0">
              عرض {filteredSections.length} من أصل {specSections.length} قسم
            </div>
          </div>

          {/* Tab 1: Specs */}
          <TabsContent value="specs" className="space-y-6 mt-0">
            {/* Category Filter */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
              <SlidersHorizontal className="w-4 h-4 text-slate-400 ml-1 shrink-0" />
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 ${
                    selectedCategory === cat 
                      ? "bg-blue-600 text-white shadow-md shadow-blue-600/30" 
                      : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800"
                  }`}
                >
                  {cat === "All" ? "كافة التصنيفات" : cat}
                </button>
              ))}
            </div>

            {/* Sections Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredSections.map((section) => {
                const isBookmarked = bookmarkedIds.includes(section.id);
                return (
                      <Card id={`section-${section.id}`} key={section.id} className="bg-white border-slate-200 hover:border-blue-300 transition-all duration-200 flex flex-col justify-between shadow-sm hover:shadow-lg">
                    <CardHeader className="pb-4">
                      <div className="flex items-center justify-between mb-2">
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs font-mono">
                          قسم #{section.id} — {section.category}
                        </Badge>
                        <div className="flex items-center gap-1">
                          <button 
                            onClick={() => toggleBookmark(section.id)}
                            disabled={isAuthenticated && (bookmarksQuery.isLoading || bookmarkMutation.isPending)}
                            className={`p-1.5 rounded-lg transition-colors ${isBookmarked ? "text-amber-600 bg-amber-50" : "text-slate-400 hover:text-slate-900 hover:bg-slate-100"}`}
                            title={isBookmarked ? "إزالة من الحفظ الدائم" : "حفظ في حسابي"}
                            aria-label={isBookmarked ? "إزالة القسم من الحفظ الدائم" : "حفظ القسم في حسابي"}
                            aria-pressed={isBookmarked}
                          >
                            <Bookmark className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleShare(section.title)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                            title="مشاركة القسم"
                          >
                            <Share2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <CardTitle className="text-xl font-bold text-slate-950 tracking-tight">
                        {section.title}
                      </CardTitle>
                      <CardDescription className="text-slate-600 text-sm mt-1">
                        {section.summary}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-0">
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-sm text-slate-700 leading-relaxed">
                        <Streamdown>{section.summary}</Streamdown>
                      </div>
                      {section.keyPoints && section.keyPoints.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="text-xs font-semibold uppercase tracking-wider text-blue-700">النقاط الحاكمة:</h4>
                          <ul className="space-y-1.5">
                            {section.keyPoints.map((point, idx) => (
                              <li key={idx} className="text-xs text-slate-600 flex items-start gap-2">
                                <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                                <span>{point}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="saved" className="mt-0 space-y-6">
            <Card className="border-slate-200 bg-white shadow-sm">
              <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-slate-950"><Bookmark className="h-5 w-5 text-amber-600" /> المحفوظات الدائمة</CardTitle>
                    <CardDescription className="mt-1 text-slate-600">تُربط الأقسام المحفوظة بحسابك، وتظهر عند تسجيل الدخول من جديد.</CardDescription>
                  </div>
                  {isAuthenticated && <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">الحفظ مفعّل</Badge>}
                </div>
              </CardHeader>
              <CardContent>
                {!isAuthenticated ? (
                  <div className="rounded-xl border border-dashed border-blue-200 bg-blue-50 p-7 text-center">
                    <h3 className="font-bold text-slate-900">سجّل الدخول لتفعيل الحفظ الدائم</h3>
                    <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-600">لن تُحفظ العلامات في متصفح غير مصادق عليه. الدخول يربطها بحسابك دون تخزين وثائق تحقق أو بيانات تجارية حساسة.</p>
                    <Button className="mt-4 bg-slate-950 text-white hover:bg-blue-900" onClick={startLogin}><LogIn className="ml-2 h-4 w-4" />دخول للحفظ</Button>
                  </div>
                ) : bookmarksQuery.isLoading ? (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-7 text-center text-sm text-slate-600" role="status">يجري استعادة الأقسام المحفوظة من قاعدة البيانات…</div>
                ) : bookmarksQuery.isError ? (
                  <div className="rounded-xl border border-rose-200 bg-rose-50 p-7 text-center">
                    <h3 className="font-bold text-rose-900">تعذر استعادة المحفوظات</h3>
                    <p className="mt-2 text-sm text-rose-800">لم تتغير بياناتك المخزنة، ويمكنك إعادة المحاولة الآن.</p>
                    <Button variant="outline" className="mt-4 border-rose-200 bg-white text-rose-800 hover:bg-rose-100" onClick={() => bookmarksQuery.refetch()}>إعادة المحاولة</Button>
                  </div>
                ) : savedSections.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-7 text-center">
                    <h3 className="font-bold text-slate-900">لا توجد أقسام محفوظة بعد</h3>
                    <p className="mt-2 text-sm text-slate-600">استخدم رمز الحفظ داخل أي قسم من المواصفات لتجميع قائمة العمل الخاصة بك.</p>
                    <Button variant="outline" className="mt-4 border-slate-300 bg-white text-slate-800 hover:bg-slate-100" onClick={() => setActiveTab("specs")}>استعراض المواصفات</Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {savedSections.map(section => (
                      <Card key={section.id} className="border-amber-200 bg-amber-50/40 shadow-none">
                        <CardHeader className="pb-3"><Badge variant="outline" className="w-fit border-amber-200 bg-white text-amber-800">قسم #{section.id}</Badge><CardTitle className="mt-3 text-lg text-slate-950">{section.title}</CardTitle></CardHeader>
                        <CardContent className="space-y-3"><p className="text-sm leading-6 text-slate-700">{section.summary}</p><Button variant="outline" size="sm" className="border-amber-200 bg-white text-amber-800 hover:bg-amber-100" onClick={() => { setActiveTab("specs"); document.getElementById(`section-${section.id}`)?.scrollIntoView({ behavior: "smooth" }); }}>عرض القسم</Button></CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="verification" className="mt-0 space-y-6">
            <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50 to-white shadow-sm">
              <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-slate-950"><ShieldCheck className="h-5 w-5 text-emerald-700" />متابعة التحقق المرتبط بالحساب</CardTitle>
                    <CardDescription className="mt-1 text-slate-600">تُخزَّن حالات الطلب والمراجع الوصفية فقط. لا تُرفع وثائق الهوية أو وثائق الشركة الخام عبر هذه الواجهة.</CardDescription>
                  </div>
                  <Badge variant="outline" className="border-emerald-200 bg-white text-emerald-800">KYC → KYB → Trade Access</Badge>
                </div>
              </CardHeader>
              <CardContent>
                {!isAuthenticated ? (
                  <div className="rounded-xl border border-dashed border-emerald-200 bg-white/80 p-7 text-center">
                    <h3 className="font-bold text-slate-900">سجّل الدخول لمتابعة حالة التحقق</h3>
                    <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-600">تُربط طلبات KYC وKYB بالحساب والكيان التجاري المخوّل، وتظهر لك عند العودة إلى المنصة.</p>
                    <Button className="mt-4 bg-emerald-700 text-white hover:bg-emerald-800" onClick={startLogin}><LogIn className="ml-2 h-4 w-4" />دخول لبدء التحقق</Button>
                  </div>
                ) : kycQuery.isLoading || kybQuery.isLoading || biometricQuery.isLoading || businessesQuery.isLoading ? (
                  <div className="rounded-xl border border-slate-200 bg-white p-7 text-center text-sm text-slate-600" role="status">يجري استعادة حالات التحقق والكيانات المرتبطة من قاعدة البيانات…</div>
                ) : kycQuery.isError || kybQuery.isError || biometricQuery.isError || businessesQuery.isError ? (
                  <div className="rounded-xl border border-rose-200 bg-rose-50 p-7 text-center">
                    <h3 className="font-bold text-rose-900">تعذر استعادة بيانات التحقق</h3>
                    <p className="mt-2 text-sm text-rose-800">لم تتغير أي بيانات محفوظة. يمكنك إعادة المحاولة دون فقدان الطلبات السابقة.</p>
                    <Button variant="outline" className="mt-4 border-rose-200 bg-white text-rose-800 hover:bg-rose-100" onClick={() => { void kycQuery.refetch(); void kybQuery.refetch(); void businessesQuery.refetch(); }}>إعادة المحاولة</Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    <section className="rounded-xl border border-slate-200 bg-white p-5">
                      <div className="flex items-start justify-between gap-3"><div><h3 className="font-bold text-slate-950">KYC — الهوية الشخصية</h3><p className="mt-1 text-sm leading-6 text-slate-600">التحقق الشخصي يسبق أي طلب تحقق تجاري.</p></div><Badge variant="outline" className={verificationStatusClass[kycStatus]}>{verificationStatusLabel[kycStatus]}</Badge></div>
                      {kycQuery.data?.latest && <p className="mt-3 text-xs text-slate-500">آخر طلب: {new Date(kycQuery.data.latest.submittedAt).toLocaleDateString("ar-EG")}{kycQuery.data.latest.reviewReason ? ` — ${kycQuery.data.latest.reviewReason}` : ""}</p>}
                      <div className="mt-5 grid gap-3 sm:grid-cols-2"><Input value={kycCountry} maxLength={2} aria-label="رمز الدولة للتحقق الشخصي" onChange={event => setKycCountry(event.target.value.toUpperCase())} placeholder="رمز الدولة، مثال EG" /><Input value={kycProviderReference} aria-label="مرجع مزود التحقق الشخصي" onChange={event => setKycProviderReference(event.target.value)} placeholder="مرجع مزود التحقق (اختياري)" /></div>
                      <Button className="mt-3 bg-emerald-700 text-white hover:bg-emerald-800" disabled={kycSubmission.isPending || kycStatus === "verified"} onClick={() => kycSubmission.mutate({ countryCode: kycCountry || undefined, providerReference: kycProviderReference || undefined })}>{kycSubmission.isPending ? "يجري الحفظ…" : kycStatus === "verified" ? "KYC مكتمل" : "إرسال طلب KYC"}</Button>
                    </section>

                    <section className="rounded-xl border border-slate-200 bg-white p-5">
                      <div className="flex items-start justify-between gap-3"><div><h3 className="font-bold text-slate-950">KYB — الكيان التجاري</h3><p className="mt-1 text-sm leading-6 text-slate-600">يتطلب KYC متحققاً وعضوية نشطة مخوّلة في الكيان.</p></div><Badge variant="outline" className={kycStatus === "verified" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-slate-200 bg-slate-50 text-slate-700"}>{kycStatus === "verified" ? "مؤهل للتقديم" : "ينتظر KYC"}</Badge></div>
                      {userBusinesses.length === 0 ? <div className="mt-5 rounded-lg border border-dashed border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-600">لا يوجد كيان تجاري مرتبط بحسابك بعد. أنشئ كياناً عبر واجهة الأعمال قبل تقديم KYB.</div> : <><select value={kybBusinessId} onChange={event => setKybBusinessId(event.target.value)} aria-label="اختيار الكيان التجاري للتحقق" className="mt-5 h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-800"><option value="">اختر الكيان التجاري</option>{userBusinesses.map(business => <option key={business.id} value={String(business.id)}>{business.legalName} — {verificationStatusLabel[business.verificationStatus]}</option>)}</select><Input value={kybProviderReference} aria-label="مرجع مزود التحقق التجاري" onChange={event => setKybProviderReference(event.target.value)} className="mt-3" placeholder="مرجع مزود التحقق (اختياري)" /><Button className="mt-3 bg-slate-950 text-white hover:bg-blue-900" disabled={kybSubmission.isPending || kycStatus !== "verified" || !kybBusinessId} onClick={() => kybSubmission.mutate({ businessId: Number(kybBusinessId), providerReference: kybProviderReference || undefined })}>{kybSubmission.isPending ? "يجري الحفظ…" : "إرسال طلب KYB"}</Button></>}
                    </section>
                  </div>
                )}
              </CardContent>
            </Card>

            {isAuthenticated && !biometricQuery.isLoading && !biometricQuery.isError && (
              <Card className="border-violet-200 bg-white shadow-sm">
                <CardHeader>
                  <CardTitle className="text-slate-950">التحقق بالوجه والحيوية — المرحلة الأولى</CardTitle>
                  <CardDescription className="text-slate-600">تسجيل الحالات والموافقة فقط. لا تُخزّن صور الوجه أو قوالب البصمة أو فيديوهات الحيوية داخل المنصة في هذه المرحلة.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4"><p className="text-xs text-slate-500">مطابقة الوجه</p><Badge variant="outline" className={`mt-2 ${verificationStatusClass[biometricQuery.data?.faceVerificationStatus ?? "unverified"] ?? verificationStatusClass.unverified}`}>{verificationStatusLabel[biometricQuery.data?.faceVerificationStatus ?? "unverified"]}</Badge></div>
                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4"><p className="text-xs text-slate-500">اختبار الحيوية</p><Badge variant="outline" className={`mt-2 ${verificationStatusClass[biometricQuery.data?.livenessStatus ?? "unverified"] ?? verificationStatusClass.unverified}`}>{verificationStatusLabel[biometricQuery.data?.livenessStatus ?? "unverified"]}</Badge></div>
                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4"><p className="text-xs text-slate-500">الموافقة</p><Badge variant="outline" className={`mt-2 ${verificationStatusClass[biometricQuery.data?.biometricConsentStatus ?? "unverified"] ?? verificationStatusClass.unverified}`}>{biometricQuery.data?.biometricConsentStatus === "granted" ? "ممنوحة" : biometricQuery.data?.biometricConsentStatus === "revoked" ? "مسحوبة" : "غير ممنوحة"}</Badge></div>
                  </div>
                  <div className="rounded-lg border border-violet-100 bg-violet-50 p-4 text-sm leading-6 text-violet-950">الموافقة لا تعني نجاح التحقق ولا تستبدل KYC. سيتم ربط مزود التحقق لاحقاً، وتُحفظ حالاته ومراجعه الوصفية فقط.</div>
                  <div className="flex flex-wrap gap-3">
                    <Button className="bg-violet-700 text-white hover:bg-violet-800" disabled={biometricConsent.isPending || biometricQuery.data?.biometricConsentStatus === "granted"} onClick={() => { const common = { purpose: "التحقق من الهوية ومنع انتحال الشخصية", policyVersion: "biometric-consent.v1", consentTextHash: "sha256:come-in-it-biometric-consent-v1" }; biometricConsent.mutate({ ...common, consentType: "face_verification" }); biometricConsent.mutate({ ...common, consentType: "liveness_detection" }); }}>منح موافقة الوجه والحيوية</Button>
                    <Button variant="outline" className="border-rose-200 bg-white text-rose-800 hover:bg-rose-50" disabled={revokeBiometricConsent.isPending || biometricQuery.data?.biometricConsentStatus !== "granted"} onClick={() => revokeBiometricConsent.mutate()}>سحب الموافقة</Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {isAuthenticated && !kybQuery.isLoading && !kybQuery.isError && (
              <Card className="border-slate-200 bg-white shadow-sm"><CardHeader><CardTitle className="text-slate-950">سجل طلبات KYB المرتبطة بكياناتك</CardTitle><CardDescription className="text-slate-600">تظهر الحالات وتواريخ المراجعة دون أي مراجع وثائقية حساسة.</CardDescription></CardHeader><CardContent>{(kybQuery.data ?? []).length === 0 ? <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-5 text-center text-sm text-slate-600">لا توجد طلبات KYB محفوظة حتى الآن.</p> : <div className="space-y-3">{kybQuery.data?.map(item => <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 p-4"><div><p className="font-semibold text-slate-900">{item.legalName}</p><p className="mt-1 text-xs text-slate-500">تم التقديم: {new Date(item.submittedAt).toLocaleDateString("ar-EG")}{item.reviewReason ? ` — ${item.reviewReason}` : ""}</p></div><Badge variant="outline" className={verificationStatusClass[item.status]}>{verificationStatusLabel[item.status]}</Badge></div>)}</div>}</CardContent></Card>
            )}
          </TabsContent>

          {user?.role === "owner" && <TabsContent value="owner-console" className="mt-0 space-y-6"><OwnerControlCenter ownerName="Amr.Anwar" ownerEmail={user.email} onNavigate={navigateToTab} /></TabsContent>}

          <TabsContent value="owner-login" className="mt-0 space-y-6"><OwnerOAuthLoginPanel /></TabsContent>

          <TabsContent value="health" className="mt-0 space-y-6">
            <HealthcareDomainDashboard />
          </TabsContent>

          <TabsContent value="trade-operations" className="mt-0 space-y-6">
            <TradeOperationsDashboard />
          </TabsContent>

          <TabsContent value="policy-engine" className="mt-0 space-y-6">
            <PolicyEngineDashboard />
          </TabsContent>
          <TabsContent value="commercial-capabilities" className="mt-0 space-y-6">
            <CommercialCapabilitiesDashboard />
          </TabsContent>

          <TabsContent value="live-simulation" className="mt-0 space-y-6">
            <LiveSimulationEnvironment />
          </TabsContent>

          <TabsContent value="prototype" className="mt-0 space-y-6">
            <InteractivePrototype onNavigate={navigateToTab} />
          </TabsContent>

          {/* Tab 2: Architecture Documents */}
          <TabsContent value="architecture-docs" className="space-y-6 mt-0">
            <div className="bg-slate-950 border border-slate-800 p-6 rounded-2xl mb-6 shadow-xl">
              <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                <Cpu className="w-5 h-5 text-blue-500" />
                الطبقات المعمارية العشرة الحاكمة
              </h3>
              <p className="text-sm text-slate-300">
                التسلسل الأساسي الذي يحكم كل قرار تطويري: KYC → KYB → Business Identity → Roles → Permissions → Product Identity → Matching → B2B → Audit → Intelligence
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {architectureDocs.map((doc) => (
                <Card 
                  key={doc.id} 
                  className="bg-white border-slate-200 hover:border-blue-300 transition-all cursor-pointer flex flex-col justify-between group shadow-sm hover:shadow-lg"
                  onClick={() => setSelectedDoc(doc)}
                >
                  <CardHeader>
                    <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-sm mb-2 group-hover:bg-blue-700 group-hover:text-white transition-colors">
                      {doc.id}
                    </div>
                    <CardTitle className="text-base font-bold text-slate-950 group-hover:text-blue-700 transition-colors">
                      {doc.title}
                    </CardTitle>
                    <CardDescription className="text-xs text-slate-600 line-clamp-2 mt-1">
                      {doc.summary}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center justify-between text-xs text-blue-400 font-medium">
                      <span>عرض التفاصيل</span>
                      <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Modal */}
            {selectedDoc && (
              <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
                <div className="bg-white border border-slate-200 w-full max-w-3xl max-h-[85vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
                  <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-slate-50">
                    <div>
                      <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20 mb-1">
                        الطبقة #{selectedDoc.id}
                      </Badge>
                      <h3 className="text-xl font-bold text-slate-950">{selectedDoc.title}</h3>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setSelectedDoc(null)}
                      className="text-slate-500 hover:text-slate-950"
                    >
                      ✕
                    </Button>
                  </div>
                  <div className="p-6 overflow-y-auto space-y-4 text-slate-700 text-sm leading-relaxed">
                    <Streamdown>{selectedDoc.content || selectedDoc.summary || ""}</Streamdown>
                  </div>
                  <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        navigator.clipboard.writeText(selectedDoc.content || selectedDoc.summary || "");
                        toast.success("تم نسخ محتوى الطبقة بنجاح!");
                      }}
                      className="border-slate-200 text-slate-700"
                    >
                      نسخ المحتوى
                    </Button>
                    <Button 
                      size="sm"
                      onClick={() => setSelectedDoc(null)}
                      className="bg-blue-600 hover:bg-blue-500 text-white"
                    >
                      إغلاق
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>

          {/* Tab 3: ERD */}
          <TabsContent value="erd" className="space-y-6 mt-0">
            <ERDVisualization />
          </TabsContent>

          {/* Tab 4: Data Flow Simulator */}
          <TabsContent value="simulator" className="space-y-6 mt-0">
            <DataFlowSimulator />
          </TabsContent>

          {/* Tab 4.5: Sovereign Cloud Simulator */}
          <TabsContent value="cloud-sim" className="space-y-6 mt-0">
            <SovereignHybridSimulator />
          </TabsContent>

          {/* Tab 5: Permissions Matrix */}
          <TabsContent value="permissions" className="space-y-6 mt-0">
            <PermissionsMatrix />
          </TabsContent>

          {/* Tab 6: Executive Report */}
          <TabsContent value="report" className="space-y-6 mt-0">
            <SovereignExecutiveReport />
          </TabsContent>

          {/* Tab 7: Trade Models Matrix */}
          <TabsContent value="models" className="space-y-6 mt-0">
            <TradeModelsMatrix />
          </TabsContent>

          {/* Tab 8: Digital Compliance Certificate */}
          <TabsContent value="certificate" className="space-y-6 mt-0">
            <DigitalComplianceCertificate />
          </TabsContent>

          {/* Tab 9: API Documentation */}
          <TabsContent value="api" className="space-y-6 mt-0">
            <ApiDocumentationView />
          </TabsContent>

          {/* Tab 10: Load Balancer Simulator */}
          <TabsContent value="balancer" className="space-y-6 mt-0">
            <LoadBalancerSimulator />
          </TabsContent>

          {/* Tab 11: Contracts and WORM Dashboard */}
          <TabsContent value="contracts" className="space-y-6 mt-0">
            <ContractsAndWormDashboard />
          </TabsContent>

          {/* Tab 12: Notification Center */}
          <TabsContent value="notifications" className="space-y-6 mt-0">
            <NotificationCenter />
          </TabsContent>

          {/* Tab 13: Trade Analytics Dashboard */}
          <TabsContent value="analytics" className="space-y-6 mt-0">
            <TradeAnalyticsDashboard />
          </TabsContent>

          {/* Tab 14: Electronic Signature Workflow */}
          <TabsContent value="signature" className="space-y-6 mt-0">
            <ElectronicSignatureWorkflow />
          </TabsContent>

          {/* Tab 15: Dispute Resolution Simulator */}
          <TabsContent value="disputes" className="space-y-6 mt-0">
            <DisputeResolutionSimulator />
          </TabsContent>

          {/* Tab 16: Architecture Reconciliation */}
          <TabsContent value="reconciliation" className="space-y-6 mt-0">
            <ArchitectureReconciliationView />
          </TabsContent>

          <TabsContent value="critical-gaps" className="space-y-6 mt-0">
            <CriticalGapsDashboard />
          </TabsContent>

          <TabsContent value="commerce-portal" className="space-y-6 mt-0">
            <RoleBasedCommercePortal />
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-8 text-center text-xs text-slate-500">
        <div className="container mx-auto px-4 space-y-2">
          <p className="font-semibold tracking-[0.12em] text-slate-700">COME / IN IT — Trusted Digital Trade Network</p>
          <p>
            تتيح لك هذه المنصة التفاعلية **استكشاف البيانات بشكل أكثر سهولة**، و**فهم الاتجاهات بشكل أفضل**، وإمكانية **الحفظ أو المشاركة بسهولة**.
          </p>
          <p className="text-slate-400">جميع الحقوق محفوظة © 2026 — تنفيذ وتطوير MANUS AI</p>
        </div>
      </footer>
    </div>
  );
}
