import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Clock3,
  ExternalLink,
  Fingerprint,
  LoaderCircle,
  LockKeyhole,
  LogOut,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { useLocation } from "wouter";

import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { getKycDisplayState, getProfileCompletion } from "@/lib/onboarding-status";

type Step = 1 | 2 | 3;

const stepLabels = ["ملفي الشخصي", "الاستعداد للتحقق", "حالة KYC"] as const;

const kycCopy = {
  not_started: {
    label: "لم يبدأ التحقق",
    description: "ملفك الشخصي جاهز. يمكنك قراءة المعلومات والموافقة على المتابعة قبل فتح جلسة Didit.",
    icon: Fingerprint,
    tone: "border-slate-200 bg-slate-50 text-slate-700",
  },
  in_progress: {
    label: "التحقق قيد التنفيذ",
    description: "هناك جلسة تحقق قيد التنفيذ. أكمل الخطوات لدى Didit ثم حدّث الحالة هنا.",
    icon: Clock3,
    tone: "border-blue-200 bg-blue-50 text-blue-800",
  },
  awaiting_result: {
    label: "في انتظار النتيجة",
    description: "استلم النظام تحديثًا بأن المراجعة لدى مزود التحقق جارية. ستظهر النتيجة هنا عند تسجيلها.",
    icon: Clock3,
    tone: "border-amber-200 bg-amber-50 text-amber-900",
  },
  verified: {
    label: "تم التحقق بنجاح",
    description: "تظهر هذه الحالة لأن النظام سجّل نتيجة تحقق موثوقة، وليس لمجرد عودتك من صفحة Didit.",
    icon: CheckCircle2,
    tone: "border-emerald-200 bg-emerald-50 text-emerald-800",
  },
  failed: {
    label: "تعذر التحقق",
    description: "لم يكتمل التحقق بنجاح. راجع تعليمات مزود التحقق أو تواصل مع الدعم إذا كانت الحالة موقوفة.",
    icon: ShieldAlert,
    tone: "border-rose-200 bg-rose-50 text-rose-800",
  },
  retry_required: {
    label: "مطلوب إعادة المحاولة",
    description: "انتهت صلاحية جلسة التحقق. يمكنك الموافقة على بدء جلسة جديدة.",
    icon: RefreshCw,
    tone: "border-amber-200 bg-amber-50 text-amber-900",
  },
} as const;

function friendlyError(error: unknown, stage: "profile" | "kyc") {
  const code = (error as { data?: { code?: string } } | null)?.data?.code;
  if (code === "PRECONDITION_FAILED") {
    return "خدمة التحقق غير جاهزة حاليًا. لم نغيّر حالة ملفك؛ حاول مرة أخرى لاحقًا.";
  }
  if (code === "BAD_GATEWAY") {
    return "لم نتمكن من بدء جلسة التحقق لدى المزود. يمكنك المحاولة لاحقًا.";
  }
  if (code === "UNAUTHORIZED") {
    return "انتهت جلسة الدخول. سجّل الدخول مجددًا للمتابعة.";
  }
  return stage === "profile"
    ? "تعذّر تحميل أو إنشاء رابط الملف الشخصي الآن. لم نعرض بيانات افتراضية؛ أعد المحاولة لاحقًا."
    : "تعذّر تحميل حالة التحقق الآن. لم نعتبر ذلك نجاحًا؛ حاول تحديث الحالة لاحقًا.";
}

export default function Onboarding() {
  const [, setLocation] = useLocation();
  const { user, loading, isAuthenticated, logout } = useAuth();
  const [step, setStep] = useState<Step>(1);
  const [consentRead, setConsentRead] = useState(false);
  const [verificationUrl, setVerificationUrl] = useState<string | null>(null);
  const [logoutError, setLogoutError] = useState<string | null>(null);
  const requestedForUser = useRef<number | null>(null);
  const utils = trpc.useUtils();

  const bootstrap = trpc.onboarding.bootstrap.useMutation();
  const kyc = trpc.verification.kyc.me.useQuery(undefined, {
    enabled: isAuthenticated && bootstrap.isSuccess,
    retry: false,
    refetchOnWindowFocus: false,
  });
  const submitKyc = trpc.verification.kyc.submit.useMutation({
    onSuccess: result => {
      setVerificationUrl(result.verificationUrl);
      setStep(3);
      void utils.verification.kyc.me.invalidate();
    },
  });

  useEffect(() => {
    if (loading || !isAuthenticated || !user) return;
    if (requestedForUser.current === user.id || bootstrap.isPending || bootstrap.isSuccess) return;
    requestedForUser.current = user.id;
    bootstrap.mutate();
  }, [loading, isAuthenticated, user?.id, bootstrap.isPending, bootstrap.isSuccess]);

  useEffect(() => {
    if (loading || isAuthenticated) return;
    requestedForUser.current = null;
    bootstrap.reset();
    setVerificationUrl(null);
  }, [loading, isAuthenticated]);

  const personId = bootstrap.data?.personId;
  const profileCompletion = getProfileCompletion(Boolean(user), personId);
  const kycState = getKycDisplayState(kyc.data);
  const currentKyc = kycCopy[kycState];
  const KycIcon = currentKyc.icon;
  const canStartNewSession = Boolean(
    kyc.data &&
      ["unverified", "rejected", "expired"].includes(kyc.data.lifecycleStatus) &&
      ["not_started", "failed", "retry_required"].includes(kycState),
  );

  const tryStartLogin = () => {
    try {
      window.location.assign("/api/oauth/google/start");
    } catch {
      setLogoutError("تعذّر بدء المصادقة في هذه البيئة. حاول لاحقًا.");
    }
  };

  const handleLogout = async () => {
    setLogoutError(null);
    try {
      await logout();
      setLocation("/");
    } catch {
      setLogoutError("تعذّر إنهاء الجلسة الآن. حاول مرة أخرى.");
    }
  };

  if (loading) {
    return (
      <main lang="ar" dir="rtl" className="flex min-h-screen items-center justify-center bg-[#f5f8fa] text-[#0f2a44]">
        <div className="flex items-center gap-3 rounded-2xl bg-white px-6 py-5 shadow-sm" role="status">
          <LoaderCircle className="h-5 w-5 animate-spin text-teal-700" aria-hidden="true" />
          <span className="font-semibold">جارٍ التحقق من جلسة الدخول…</span>
        </div>
      </main>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <main lang="ar" dir="rtl" className="flex min-h-screen items-center justify-center bg-[#f5f8fa] px-4 py-12 text-[#0f2a44]">
        <section className="w-full max-w-lg rounded-[2rem] border border-slate-200 bg-white p-7 text-center shadow-xl shadow-slate-900/5 sm:p-10">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-50 text-teal-800"><LockKeyhole className="h-7 w-7" aria-hidden="true" /></div>
          <h1 className="mt-5 text-2xl font-black">سجّل الدخول بحساب Google لمتابعة ملفك</h1>
          <p className="mt-3 text-sm leading-7 text-slate-600">سنستخدم حساب Google لاستعادة الحساب الموجود أو إنشاء حساب جديد. لا ننشئ كلمة مرور محلية.</p>
          <button type="button" onClick={tryStartLogin} className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#0f2a44] px-5 py-3 font-bold text-white hover:bg-[#173d5e] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2">تسجيل الدخول للمتابعة <ArrowLeft className="h-4 w-4" aria-hidden="true" /></button>
          {logoutError && <p role="alert" className="mt-4 text-sm text-rose-700">{logoutError}</p>}
          <button type="button" onClick={() => setLocation("/")} className="mt-4 text-sm font-semibold text-teal-800 underline underline-offset-4">العودة إلى الصفحة الرئيسية</button>
        </section>
      </main>
    );
  }

  return (
    <main lang="ar" dir="rtl" className="min-h-screen bg-[#f5f8fa] text-[#132b43]">
      <header className="border-b border-slate-200 bg-white/90">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-4 sm:px-7 lg:px-10">
          <button type="button" onClick={() => setLocation("/")} className="flex items-center gap-3 rounded-xl text-right focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0f2a44] text-sm font-black text-white">CI</span>
            <span><span className="block font-black tracking-wide text-[#0f2a44]">COME IN IT</span><span className="block text-[10px] font-semibold tracking-wider text-teal-700">ملفك الشخصي والتحقق</span></span>
          </button>
          <div className="flex items-center gap-2">
            <span className="hidden max-w-40 truncate text-sm text-slate-600 sm:inline">{user.name || "حساب COME IN IT"}</span>
            <button type="button" onClick={handleLogout} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"><LogOut className="h-4 w-4" aria-hidden="true" /><span className="hidden sm:inline">تسجيل الخروج</span></button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 pb-12 pt-8 sm:px-7 lg:px-10 lg:pt-12">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-bold text-teal-700">مرحبًا{user.name ? `، ${user.name}` : " بك"}</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-[#0f2a44] sm:text-4xl">ملفك يبدأ من هنا</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">أنشأنا أو استعدنا سجل الشخص المرتبط بحسابك. بيانات الحساب منفصلة عن إثبات الهوية الذي تتم معالجته عبر Didit.</p>
          </div>
          <div className="w-full rounded-2xl border border-teal-100 bg-white p-4 shadow-sm sm:max-w-xs">
            <div className="flex items-center justify-between text-sm"><span className="font-semibold text-slate-600">اكتمال الملف الأساسي</span><strong className="text-teal-800">{profileCompletion}%</strong></div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-label="اكتمال الملف الأساسي" aria-valuemin={0} aria-valuemax={100} aria-valuenow={profileCompletion}>
              <div className="h-full rounded-full bg-teal-600 transition-all" style={{ width: `${profileCompletion}%` }} />
            </div>
            <p className="mt-2 text-xs leading-5 text-slate-500">يُقاس الاكتمال وفق حقول المخطط الحالي ورابط الحساب الشخصي.</p>
          </div>
        </div>

        <nav aria-label="مراحل إنشاء الملف والتحقق" className="mt-8 grid grid-cols-3 gap-2 sm:gap-3">
          {stepLabels.map((label, index) => {
            const stepNumber = (index + 1) as Step;
            const active = step === stepNumber;
            const complete = stepNumber === 1 ? Boolean(personId) : stepNumber < step;
            return (
              <button key={label} type="button" onClick={() => setStep(stepNumber)} className={`flex min-h-16 items-center gap-2 rounded-2xl border px-3 py-3 text-right transition sm:gap-3 sm:px-4 ${active ? "border-[#0f2a44] bg-[#0f2a44] text-white shadow-lg shadow-[#0f2a44]/10" : complete ? "border-teal-200 bg-teal-50 text-teal-900" : "border-slate-200 bg-white text-slate-500 hover:border-slate-300"}`} aria-current={active ? "step" : undefined}>
                <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-black ${active ? "bg-white/15 text-white" : complete ? "bg-teal-100 text-teal-800" : "bg-slate-100 text-slate-500"}`}>{complete ? <Check className="h-4 w-4" aria-hidden="true" /> : `0${stepNumber}`}</span>
                <span className="text-xs font-bold leading-5 sm:text-sm">{label}</span>
              </button>
            );
          })}
        </nav>

        <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
          <section className="min-w-0 rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-7" aria-live="polite">
            {step === 1 && (
              <>
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-[#0f2a44]"><UserRound className="h-6 w-6" aria-hidden="true" /></div>
                  <div><p className="text-xs font-bold uppercase tracking-wider text-teal-700">الخطوة الأولى</p><h2 className="mt-1 text-xl font-black text-[#0f2a44]">بيانات حسابك</h2><p className="mt-2 text-sm leading-7 text-slate-600">هذه بيانات الحساب التي أتاحها مزود المصادقة. لا تُستخدم بدل وثائق الهوية.</p></div>
                </div>
                {bootstrap.isPending && <div className="mt-6 flex items-center gap-3 rounded-xl bg-slate-50 p-4 text-sm text-slate-600" role="status"><LoaderCircle className="h-4 w-4 animate-spin text-teal-700" aria-hidden="true" />جارٍ ربط سجل الشخص بحسابك…</div>}
                {bootstrap.isError && <div className="mt-6 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm leading-6 text-rose-800" role="alert"><p>{friendlyError(bootstrap.error, "profile")}</p><button type="button" onClick={() => { requestedForUser.current = user.id; bootstrap.mutate(); }} className="mt-3 inline-flex items-center gap-2 font-bold underline underline-offset-4">إعادة المحاولة <RefreshCw className="h-4 w-4" aria-hidden="true" /></button></div>}
                {bootstrap.isSuccess && (
                  <>
                    <div className="mt-6 grid gap-3 sm:grid-cols-2">
                      <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4"><p className="text-xs font-semibold text-slate-500">الاسم من حساب المصادقة</p><p className="mt-2 break-words font-bold text-slate-800">{user.name?.trim() || "غير متاح من مزود المصادقة"}</p></div>
                      <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4"><p className="text-xs font-semibold text-slate-500">البريد الإلكتروني</p><p className="mt-2 break-words font-bold text-slate-800" dir="ltr">{user.email || "غير متاح من مزود المصادقة"}</p></div>
                      <div className="rounded-2xl border border-teal-100 bg-teal-50/60 p-4 sm:col-span-2"><p className="text-xs font-semibold text-teal-800">معرّف سجل الشخص</p><p className="mt-2 font-bold text-slate-800">{personId ? `PERSON #${personId}` : "جارٍ إنشاء الرابط…"}</p><p className="mt-1 text-xs leading-5 text-slate-600">السجل مرتبط بحسابك الحالي؛ لا تُنشأ صلاحية تجارية من خلال التسجيل.</p></div>
                    </div>
                    <div className="mt-5 flex items-start gap-3 rounded-2xl border border-slate-200 p-4 text-sm leading-6 text-slate-600"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-teal-700" aria-hidden="true" /><p>الاسم والبريد بيانات حساب. إثبات الهوية ونتيجة التحقق بيانات منفصلة، ولا تصبح حالة KYC موثقة إلا بعد تسجيل نتيجة موثوقة من النظام.</p></div>
                  </>
                )}
                <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
                  <button type="button" onClick={() => setLocation("/")} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50"><ArrowRight className="h-4 w-4" aria-hidden="true" />العودة للرئيسية</button>
                  <button type="button" onClick={() => setStep(2)} disabled={!bootstrap.isSuccess || profileCompletion < 100} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#0f2a44] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#173d5e] disabled:cursor-not-allowed disabled:opacity-50">المتابعة إلى KYC <ArrowLeft className="h-4 w-4" aria-hidden="true" /></button>
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-teal-50 text-teal-800"><Fingerprint className="h-6 w-6" aria-hidden="true" /></div>
                  <div><p className="text-xs font-bold uppercase tracking-wider text-teal-700">الخطوة الثانية</p><h2 className="mt-1 text-xl font-black text-[#0f2a44]">الاستعداد للتحقق من هويتك</h2><p className="mt-2 text-sm leading-7 text-slate-600">يساعد KYC على حماية المستخدمين والتعاملات. ستُجرى عملية التحقق لدى Didit عبر جلسة آمنة مرتبطة بسجل الشخص.</p></div>
                </div>
                <div className="mt-6 space-y-3">
                  <div className="flex gap-3 rounded-2xl border border-slate-200 p-4"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-teal-700" aria-hidden="true" /><p className="text-sm leading-6 text-slate-600">لن تُعتبر موثقًا لمجرد فتح جلسة Didit أو الرجوع منها؛ تعتمد المنصة الحالة التي يسجلها النظام من نتيجة موثوقة.</p></div>
                  <div className="flex gap-3 rounded-2xl border border-slate-200 p-4"><LockKeyhole className="mt-0.5 h-5 w-5 shrink-0 text-teal-700" aria-hidden="true" /><p className="text-sm leading-6 text-slate-600">قبل المتابعة، راجع إشعارات الخصوصية والموافقة التي يعرضها Didit في مسار التحقق. لا نضيف هنا موافقة بيومترية غير مسجلة في مخطط المنظومة.</p></div>
                </div>
                <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-2xl border border-teal-200 bg-teal-50/60 p-4 text-sm leading-6 text-slate-700">
                  <input type="checkbox" checked={consentRead} onChange={event => setConsentRead(event.target.checked)} className="mt-1 h-4 w-4 accent-teal-700" />
                  <span>قرأت الغرض من التحقق وأوافق على متابعة إنشاء جلسة تحقق لدى Didit. سأراجع أي موافقات إضافية وسياسة الخصوصية المعروضة هناك قبل إرسال بياناتي.</span>
                </label>
                {submitKyc.isError && <p role="alert" className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm leading-6 text-rose-800">{friendlyError(submitKyc.error, "kyc")}</p>}
                {kyc.isError && <p role="alert" className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">{friendlyError(kyc.error, "kyc")}</p>}
                <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
                  <button type="button" onClick={() => setStep(1)} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50"><ArrowRight className="h-4 w-4" aria-hidden="true" />العودة إلى الملف</button>
                  <button type="button" onClick={() => submitKyc.mutate()} disabled={!consentRead || !canStartNewSession || submitKyc.isPending} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-teal-700 px-5 py-3 text-sm font-bold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-50">
                    {submitKyc.isPending ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Fingerprint className="h-4 w-4" aria-hidden="true" />}
                    {submitKyc.isPending ? "جارٍ إعداد جلسة Didit…" : kycState === "retry_required" || kycState === "failed" ? "بدء محاولة جديدة" : "ابدأ التحقق من هويتي"}
                  </button>
                </div>
              </>
            )}

            {step === 3 && (
              <>
                <div className="flex items-start gap-4">
                  <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border ${currentKyc.tone}`}><KycIcon className="h-6 w-6" aria-hidden="true" /></div>
                  <div><p className="text-xs font-bold uppercase tracking-wider text-teal-700">الخطوة الثالثة</p><h2 className="mt-1 text-xl font-black text-[#0f2a44]">حالة التحقق من الهوية</h2><p className="mt-2 text-sm leading-7 text-slate-600">تُقرأ الحالة من سجل المنصة المرتبط بحسابك، ولا تتغير نتيجةً للرجوع من صفحة خارجية.</p></div>
                </div>
                {kyc.isLoading && <div className="mt-6 flex items-center gap-3 rounded-xl bg-slate-50 p-4 text-sm text-slate-600" role="status"><LoaderCircle className="h-4 w-4 animate-spin text-teal-700" aria-hidden="true" />جارٍ تحميل الحالة من النظام…</div>}
                {kyc.isError && <p role="alert" className="mt-6 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm leading-6 text-rose-800">{friendlyError(kyc.error, "kyc")}</p>}
                {kyc.data && (
                  <>
                    <div className={`mt-6 rounded-2xl border p-5 ${currentKyc.tone}`}>
                      <div className="flex items-center gap-3"><KycIcon className="h-6 w-6" aria-hidden="true" /><h3 className="text-lg font-black">{currentKyc.label}</h3></div>
                      <p className="mt-2 text-sm leading-7">{currentKyc.description}</p>
                      {kyc.data.latest?.submittedAt && <p className="mt-2 text-xs opacity-80">آخر تحديث معروف: {new Intl.DateTimeFormat("ar", { dateStyle: "medium", timeStyle: "short" }).format(new Date(kyc.data.latest.submittedAt))}</p>}
                    </div>
                    {verificationUrl && <div className="mt-4 rounded-2xl border border-teal-200 bg-teal-50 p-4"><p className="text-sm font-bold text-teal-900">جلسة Didit جاهزة</p><p className="mt-1 text-xs leading-6 text-teal-900/80">افتح صفحة التحقق في نافذة جديدة، ثم عد إلى هذه الصفحة لتحديث الحالة.</p><a href={verificationUrl} target="_blank" rel="noreferrer" className="mt-3 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-teal-700 px-4 py-3 text-sm font-bold text-white hover:bg-teal-800">فتح Didit <ExternalLink className="h-4 w-4" aria-hidden="true" /></a></div>}
                    {kycState === "in_progress" || kycState === "awaiting_result" ? <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50/70 p-4 text-sm leading-6 text-blue-900">لن نبدأ جلسة بديلة بينما التحقق الحالي معلّق. استخدم زر تحديث الحالة بعد إكمال الخطوات لدى Didit.</div> : null}
                  </>
                )}
                <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
                  <button type="button" onClick={() => setStep(2)} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50"><ArrowRight className="h-4 w-4" aria-hidden="true" />العودة إلى الاستعداد</button>
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <button type="button" onClick={() => void kyc.refetch()} disabled={kyc.isFetching} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50"><RefreshCw className={`h-4 w-4 ${kyc.isFetching ? "animate-spin" : ""}`} aria-hidden="true" />تحديث الحالة</button>
                    {canStartNewSession && <button type="button" onClick={() => { setConsentRead(false); setStep(2); }} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#0f2a44] px-4 py-3 text-sm font-bold text-white hover:bg-[#173d5e]">{kycState === "not_started" ? "بدء التحقق" : "إعادة المحاولة"}<ArrowLeft className="h-4 w-4" aria-hidden="true" /></button>}
                  </div>
                </div>
              </>
            )}
            {logoutError && <p role="alert" className="mt-4 text-sm text-rose-700">{logoutError}</p>}
          </section>

          <aside className="space-y-4">
            <section className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-800"><ShieldCheck className="h-5 w-5" aria-hidden="true" /></div><h2 className="font-black text-[#0f2a44]">حالة الهوية</h2></div>
              {kyc.data ? <div className={`mt-4 rounded-xl border px-3 py-3 text-sm font-bold ${currentKyc.tone}`}>{currentKyc.label}</div> : <p className="mt-4 text-sm leading-6 text-slate-500">{bootstrap.isSuccess ? "جارٍ تحميل حالة KYC…" : "سيتم عرض الحالة بعد ربط سجل الشخص."}</p>}
              <p className="mt-3 text-xs leading-6 text-slate-500">لا يمنح تسجيل الدخول وحده صفة مستخدم موثق أو صلاحيات تجارية.</p>
            </section>
            <section className="rounded-[1.5rem] bg-[#0f2a44] p-5 text-white shadow-lg shadow-[#0f2a44]/10">
              <div className="flex items-center gap-3"><LockKeyhole className="h-5 w-5 text-teal-300" aria-hidden="true" /><h2 className="font-black">بياناتك منفصلة</h2></div>
              <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-200">
                <li className="flex gap-2"><Check className="mt-1 h-4 w-4 shrink-0 text-teal-300" aria-hidden="true" />بيانات الحساب تأتي من OAuth.</li>
                <li className="flex gap-2"><Check className="mt-1 h-4 w-4 shrink-0 text-teal-300" aria-hidden="true" />سجل PERSON يربط الحساب بدورة الهوية.</li>
                <li className="flex gap-2"><Check className="mt-1 h-4 w-4 shrink-0 text-teal-300" aria-hidden="true" />نتيجة KYC تعتمد على تحديث موثوق من الخادم.</li>
              </ul>
            </section>
            <button type="button" onClick={() => setLocation("/")} className="inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-slate-600 transition hover:bg-white">العودة إلى COME IN IT <ArrowLeft className="h-4 w-4" aria-hidden="true" /></button>
          </aside>
        </div>
      </div>
    </main>
  );
}
