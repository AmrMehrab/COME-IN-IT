import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, Check, Fingerprint, LockKeyhole, ShieldCheck, UserRound } from "lucide-react";
import { consumeLoginReturnTo } from "@/const";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type AuthMode = "login" | "register" | null;

const oauthErrorMessages: Record<string, string> = {
  cancelled: "أُلغيت عملية تسجيل الدخول. يمكنك المحاولة مرة أخرى متى شئت.",
  invalid_state: "تعذّر تأكيد جلسة الدخول الآمنة. ابدأ المحاولة من جديد.",
  missing_parameters: "لم تكتمل عملية الدخول. أعد المحاولة من البداية.",
  failed: "تعذّر إكمال تسجيل الدخول الآن. حاول مرة أخرى لاحقًا.",
};

function BrandMark() {
  return (
    <span className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-[#0f2a44] text-white shadow-lg shadow-slate-900/10" aria-hidden="true">
      <svg viewBox="0 0 32 32" className="h-7 w-7" fill="none">
        <path d="M7 26V9.5A2.5 2.5 0 0 1 9.5 7h13A2.5 2.5 0 0 1 25 9.5V26" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
        <path d="M12 26V14h8v12M15 20h2" stroke="#5eead4" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M4 26h24" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      </svg>
    </span>
  );
}

export default function Home() {
  const [authMode, setAuthMode] = useState<AuthMode>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const { user, loading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    const currentUrl = new URL(window.location.href);
    const errorCode = currentUrl.searchParams.get("authError");
    if (!errorCode) return;

    setAuthError(oauthErrorMessages[errorCode] ?? oauthErrorMessages.failed);
    consumeLoginReturnTo();
    currentUrl.searchParams.delete("authError");
    window.history.replaceState(window.history.state, "", `${currentUrl.pathname}${currentUrl.search}${currentUrl.hash}`);
  }, []);

  useEffect(() => {
    if (loading || !isAuthenticated) return;
    const returnTo = consumeLoginReturnTo();
    if (returnTo) setLocation(returnTo);
  }, [loading, isAuthenticated, user?.id, setLocation]);

  const begin = (mode: Exclude<AuthMode, null>) => {
    setAuthError(null);
    if (isAuthenticated) {
      setLocation("/onboarding");
      return;
    }
    setAuthMode(mode);
  };

  const continueWithOAuth = () => {
    try {
      window.location.assign("/api/oauth/google/start");
    } catch {
      setAuthMode(null);
      setAuthError("لم نتمكن من بدء تسجيل الدخول في هذه البيئة. يرجى المحاولة لاحقًا.");
    }
  };

  return (
    <main lang="ar" dir="rtl" className="min-h-screen overflow-hidden bg-[#f5f8fa] text-[#132b43]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[560px] bg-[radial-gradient(ellipse_at_top_left,_rgba(13,148,136,0.12),_transparent_56%)]" />
      <header className="relative z-10 mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-5 sm:px-7 lg:px-10">
        <a href="/" className="flex items-center gap-3 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600" aria-label="COME IN IT - الصفحة الرئيسية">
          <BrandMark />
          <span>
            <span className="block text-lg font-black tracking-[0.04em] text-[#0f2a44] sm:text-xl">COME IN IT</span>
            <span className="block text-[10px] font-semibold tracking-[0.18em] text-teal-700">IDENTITY · COMMERCE</span>
          </span>
        </a>
        <nav className="flex items-center gap-2 sm:gap-3" aria-label="التنقل الرئيسي">
          {isAuthenticated ? (
            <button type="button" onClick={() => setLocation("/onboarding")} className="rounded-xl bg-[#0f2a44] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#173d5e] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2">
              متابعة ملفي
            </button>
          ) : (
            <>
              <button type="button" onClick={() => begin("login")} disabled={loading} className="hidden rounded-xl px-4 py-2.5 text-sm font-bold text-[#0f2a44] transition hover:bg-white sm:inline-flex focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500">
                تسجيل الدخول
              </button>
              <button type="button" onClick={() => begin("register")} disabled={loading} className="rounded-xl bg-[#0f2a44] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#173d5e] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2">
                ابدأ الآن
              </button>
            </>
          )}
        </nav>
      </header>

      <section className="relative mx-auto flex w-full max-w-7xl flex-col gap-12 px-4 pb-16 pt-8 sm:px-7 sm:pt-12 lg:flex-row lg:items-center lg:gap-16 lg:px-10 lg:pb-24 lg:pt-16">
        <div className="relative z-10 flex-1 lg:max-w-[58%]">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-teal-200 bg-white/80 px-3.5 py-2 text-xs font-bold text-teal-800 shadow-sm">
            <ShieldCheck className="h-4 w-4" aria-hidden="true" />
            هوية موثقة، وتعاملات أوضح
          </div>
          <h1 className="max-w-3xl text-4xl font-black leading-[1.25] tracking-tight text-[#0f2a44] sm:text-5xl lg:text-[3.65rem]">
            ابدأ بهويتك،<br className="hidden sm:block" /> واترك الثقة <span className="text-teal-700">تفتح الطريق.</span>
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
            COME IN IT مساحة موحدة للأفراد والأنشطة الموثقة. أنشئ حسابك بهوية واحدة، أكمل التحقق من هويتك، ثم استخدم الخدمات والصلاحيات التي تستوفي شروطها.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <button type="button" onClick={() => begin("register")} className="group inline-flex min-h-13 items-center justify-center gap-3 rounded-2xl bg-[#0f2a44] px-6 py-4 text-base font-bold text-white shadow-xl shadow-[#0f2a44]/15 transition hover:-translate-y-0.5 hover:bg-[#173d5e] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2">
              {isAuthenticated ? "أكمل ملفك الشخصي" : "ابدأ الآن"}
              <ArrowLeft className="h-5 w-5 transition-transform group-hover:-translate-x-1" aria-hidden="true" />
            </button>
            {!isAuthenticated && (
              <button type="button" onClick={() => begin("login")} className="inline-flex min-h-13 items-center justify-center rounded-2xl border border-slate-200 bg-white/90 px-6 py-4 text-base font-bold text-[#0f2a44] transition hover:border-teal-300 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500">
                لدي حساب بالفعل
              </button>
            )}
          </div>
          {authError && (
            <div role="alert" className="mt-5 flex max-w-xl items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900">
              <LockKeyhole className="mt-1 h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{authError}</span>
            </div>
          )}
          <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-medium text-slate-500">
            <span className="inline-flex items-center gap-2"><LockKeyhole className="h-4 w-4 text-teal-700" aria-hidden="true" /> لا نخزن كلمة مرور محلية</span>
            <span className="inline-flex items-center gap-2"><Fingerprint className="h-4 w-4 text-teal-700" aria-hidden="true" /> إثبات الهوية منفصل عن بيانات الحساب</span>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-md flex-1 lg:mr-auto lg:ml-0">
          <div className="absolute -inset-5 rounded-[2.5rem] bg-gradient-to-br from-teal-200/50 via-white to-blue-100/60 blur-xl" />
          <div className="relative overflow-hidden rounded-[2rem] border border-white bg-white p-5 shadow-[0_30px_80px_-38px_rgba(15,42,68,0.35)] sm:p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-teal-700">مسارك يبدأ هنا</p>
                <h2 className="mt-2 text-xl font-extrabold text-[#0f2a44]">خطوات بسيطة، بدون تجاوزات</h2>
              </div>
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-teal-50 text-teal-800">
                <Fingerprint className="h-6 w-6" aria-hidden="true" />
              </div>
            </div>
            <div className="mt-7 space-y-5">
              <div className="flex gap-4">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#0f2a44] text-sm font-black text-white">01</span>
                <div><h3 className="font-bold text-slate-800">حسابك عبر Google</h3><p className="mt-1 text-sm leading-6 text-slate-500">دخول آمن أو إنشاء حساب جديد بالمسار نفسه.</p></div>
              </div>
              <div className="mr-4 h-5 border-r border-dashed border-slate-300" />
              <div className="flex gap-4">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-teal-200 bg-teal-50 text-sm font-black text-teal-800">02</span>
                <div><h3 className="font-bold text-slate-800">ملف شخصي مرتبط بحسابك</h3><p className="mt-1 text-sm leading-6 text-slate-500">بيانات الحساب تبقى منفصلة عن وثائق إثبات الهوية.</p></div>
              </div>
              <div className="mr-4 h-5 border-r border-dashed border-slate-300" />
              <div className="flex gap-4">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-sm font-black text-slate-600">03</span>
                <div><h3 className="font-bold text-slate-800">تحقق KYC عبر Didit</h3><p className="mt-1 text-sm leading-6 text-slate-500">حالة التحقق تعتمد على نتيجة موثوقة من النظام، لا على العودة من صفحة التحقق.</p></div>
              </div>
            </div>
            <div className="mt-7 flex items-start gap-3 rounded-2xl bg-[#f4f8fb] p-4 text-xs leading-6 text-slate-600">
              <UserRound className="mt-0.5 h-4 w-4 shrink-0 text-teal-700" aria-hidden="true" />
              <p>إنشاء الحساب لا يمنح صلاحيات تجارية تلقائيًا؛ الوصول إلى الأنشطة يتطلب التحقق من العضوية والصلاحيات المناسبة.</p>
            </div>
          </div>
          <div className="absolute -bottom-5 -left-3 hidden items-center gap-2 rounded-2xl border border-slate-100 bg-white px-4 py-3 text-xs font-bold text-slate-700 shadow-lg sm:flex">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-teal-50 text-teal-700"><Check className="h-4 w-4" aria-hidden="true" /></span>
            أنت تتحكم في كل خطوة
          </div>
        </div>
      </section>

      <footer className="relative border-t border-slate-200/80 bg-white/60">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-5 text-xs leading-6 text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-7 lg:px-10">
          <span>COME IN IT — هوية شخصية واحدة، وأنشطة تجارية بصلاحيات موثقة.</span>
          <span>لا تُعد العودة من Didit تأكيدًا للهوية؛ اعتمد دائمًا الحالة المسجلة في المنصة.</span>
        </div>
      </footer>

      <Dialog open={authMode !== null} onOpenChange={open => !open && setAuthMode(null)}>
        <DialogContent dir="rtl" className="rounded-3xl border-slate-200 p-6 sm:p-8">
          <DialogHeader className="text-right">
            <div className="mb-2 inline-flex w-fit items-center gap-2 rounded-full bg-teal-50 px-3 py-1.5 text-xs font-bold text-teal-800">
              <LockKeyhole className="h-3.5 w-3.5" aria-hidden="true" /> مصادقة آمنة
            </div>
            <DialogTitle className="text-2xl font-black text-[#0f2a44]">
              {authMode === "login" ? "مرحبًا بعودتك" : "أنشئ حساب COME IN IT"}
            </DialogTitle>
            <DialogDescription className="text-sm leading-7 text-slate-600">
              {authMode === "login"
                ? "سجّل الدخول بحساب Google لاستعادة حسابك وملفك المرتبط."
                : "سيُنشأ الحساب أو يُستعاد عبر Google؛ لا توجد كلمة مرور محلية ولا حسابات مكررة."}
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-7 text-slate-600">
            بعد المصادقة ستنتقل إلى ملفك الشخصي، ثم يمكنك مراجعة معلومات KYC وبدء التحقق عبر Didit عند الاستعداد.
          </div>
          <DialogFooter className="gap-2 sm:flex-row-reverse">
            <button type="button" onClick={continueWithOAuth} className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-[#0f2a44] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#173d5e] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2">
              {authMode === "login" ? "متابعة تسجيل الدخول" : "إنشاء الحساب والمتابعة"}
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            </button>
            <button type="button" onClick={() => setAuthMode(null)} className="min-h-12 rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500">
              إلغاء
            </button>
          </DialogFooter>
          <p className="text-center text-xs leading-6 text-slate-500">باستمرارك ستنتقل إلى بوابة المصادقة الآمنة ثم تعود إلى COME IN IT.</p>
        </DialogContent>
      </Dialog>
    </main>
  );
}
