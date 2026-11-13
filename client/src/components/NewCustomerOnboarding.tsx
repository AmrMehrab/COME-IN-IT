import { useEffect, useState } from "react";
import {
  ArrowLeft,
  BadgeCheck,
  BriefcaseBusiness,
  CheckCircle2,
  Fingerprint,
  LockKeyhole,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { startLogin } from "@/const";
import {
  ONBOARDING_STORAGE_KEY,
  onboardingSteps,
  type OnboardingDestination,
  type OnboardingStep,
} from "@/data/onboardingData";

type NewCustomerOnboardingProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onNavigate?: (destination: OnboardingDestination) => void;
};

const stepIcon: Record<OnboardingStep["icon"], typeof Fingerprint> = {
  identity: Fingerprint,
  verification: ShieldCheck,
  commercial: BriefcaseBusiness,
};

export function NewCustomerOnboarding({ open, onOpenChange, onNavigate }: NewCustomerOnboardingProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeStep = onboardingSteps[activeIndex];
  const isLastStep = activeIndex === onboardingSteps.length - 1;
  const ActiveIcon = stepIcon[activeStep.icon];

  useEffect(() => {
    if (typeof window === "undefined") return;
    const forcedOpen = new URLSearchParams(window.location.search).get("onboarding") === "1";
    if ((forcedOpen || !window.localStorage.getItem(ONBOARDING_STORAGE_KEY)) && !open) {
      onOpenChange(true);
    }
  }, [onOpenChange, open]);

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen && typeof window !== "undefined") {
      window.localStorage.setItem(ONBOARDING_STORAGE_KEY, "seen");
    }
    onOpenChange(nextOpen);
  };

  const navigate = (destination: OnboardingDestination) => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(ONBOARDING_STORAGE_KEY, "seen");
    }
    onNavigate?.(destination);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        dir="rtl"
        className="max-h-[calc(100vh-2rem)] max-w-3xl overflow-y-auto border-cyan-500/20 bg-[radial-gradient(circle_at_90%_0%,rgba(14,165,233,0.16),transparent_32%),radial-gradient(circle_at_3%_100%,rgba(16,185,129,0.1),transparent_26%),hsl(var(--background))] p-0 shadow-2xl sm:rounded-2xl"
      >
        <div className="border-b border-border/70 px-6 pb-5 pt-7 sm:px-8">
          <div className="flex items-start gap-3 pl-8">
            <div className="rounded-2xl bg-slate-950 p-3 text-cyan-300 shadow-lg shadow-slate-950/20">
              <Sparkles className="h-5 w-5" />
            </div>
            <DialogHeader className="min-w-0 text-right sm:text-right">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="gap-1.5 rounded-full bg-slate-950 px-3 py-1 text-[10px] text-white hover:bg-slate-950">
                  <LockKeyhole className="h-3 w-3" />
                  بداية آمنة
                </Badge>
                <Badge variant="outline" className="rounded-full border-cyan-500/25 bg-cyan-500/[0.06] text-[10px] text-cyan-800 dark:text-cyan-200">
                  3 خطوات فقط
                </Badge>
              </div>
              <DialogTitle className="mt-3 text-2xl font-black tracking-tight">مرحباً بك في COME IN IT</DialogTitle>
              <DialogDescription className="mt-2 max-w-xl text-right leading-6">
                ابدأ بالترتيب الصحيح: هوية شخصية، تحقق موثوق، ثم نشاط تجاري مؤهل. لا تُنشئ هذه الشاشة أي بيانات ولا تمنح صلاحيات فعلية.
              </DialogDescription>
              <Button type="button" size="sm" className="mt-4 bg-slate-950 text-white hover:bg-blue-900" onClick={startLogin}>
                تسجيل الدخول للبدء
                <ArrowLeft className="mr-2 h-4 w-4" />
              </Button>
            </DialogHeader>
          </div>
        </div>

        <div className="space-y-5 px-6 py-6 sm:px-8">
          <div className="grid gap-2 sm:grid-cols-3">
            {onboardingSteps.map((step, index) => {
              const Icon = stepIcon[step.icon];
              const active = index === activeIndex;
              const completed = index < activeIndex;
              return (
                <button
                  type="button"
                  key={step.id}
                  onClick={() => setActiveIndex(index)}
                  className={cn(
                    "rounded-xl border p-3 text-right transition-all duration-200",
                    active
                      ? "border-cyan-500/40 bg-cyan-500/[0.08] shadow-sm"
                      : completed
                        ? "border-emerald-500/25 bg-emerald-500/[0.05] hover:border-emerald-500/40"
                        : "border-border/70 bg-background/65 hover:border-cyan-500/25 hover:bg-muted/40"
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className={cn("flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-black", active ? "bg-cyan-600 text-white" : completed ? "bg-emerald-600 text-white" : "bg-muted text-muted-foreground")}>{step.number}</span>
                    {completed ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <Icon className={cn("h-4 w-4", active ? "text-cyan-700 dark:text-cyan-300" : "text-muted-foreground")} />}
                  </div>
                  <p className="mt-3 text-xs font-black text-foreground">{step.shortTitle}</p>
                </button>
              );
            })}
          </div>

          <Progress value={((activeIndex + 1) / onboardingSteps.length) * 100} className="h-1.5" />

          <div className="grid gap-5 rounded-2xl border border-border/70 bg-background/70 p-5 sm:p-6 lg:grid-cols-[1fr_auto] lg:items-start">
            <div>
              <Badge variant="outline" className="gap-1.5 border-cyan-500/25 bg-cyan-500/[0.06] text-cyan-800 dark:text-cyan-200">
                <ActiveIcon className="h-3.5 w-3.5" />
                الخطوة {activeStep.number} من {onboardingSteps.length}
              </Badge>
              <h3 className="mt-3 text-xl font-black text-foreground">{activeStep.title}</h3>
              <p className="mt-2 max-w-xl text-sm leading-7 text-muted-foreground">{activeStep.description}</p>
              <div className="mt-4 flex items-center gap-2 rounded-xl border border-border/70 bg-muted/30 px-3 py-2.5">
                <BadgeCheck className="h-4 w-4 shrink-0 text-emerald-600" />
                <div>
                  <p className="text-[10px] font-semibold text-muted-foreground">نقطة التحقق</p>
                  <p className="font-mono text-xs font-bold text-foreground">{activeStep.checkpoint}</p>
                </div>
              </div>
            </div>
            <div className="flex min-w-44 flex-col gap-2 lg:pt-1">
              <Button type="button" className="gap-2" onClick={() => navigate(activeStep.destination)}>
                {activeStep.actionLabel}
                <ArrowLeft className="h-4 w-4" />
              </Button>
              {isLastStep ? (
                <Button type="button" variant="outline" className="gap-2" onClick={() => navigate("prototype")}>
                  استعرض Prototype
                  <Sparkles className="h-4 w-4" />
                </Button>
              ) : (
                <Button type="button" variant="outline" className="gap-2" onClick={() => setActiveIndex(index => index + 1)}>
                  الخطوة التالية
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              )}
              <Button type="button" variant="ghost" size="sm" className="text-muted-foreground" onClick={() => handleOpenChange(false)}>
                سأكمل لاحقاً
              </Button>
            </div>
          </div>

          <p className="flex items-start gap-2 rounded-xl border border-amber-500/20 bg-amber-500/[0.06] p-3 text-xs leading-6 text-amber-800 dark:text-amber-200">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
            تظهر هذه الشاشة تلقائياً للزائر الجديد، ويمكن فتحها لاحقاً من زر «ابدأ الآن». تظل KYC/KYB وملفات النشاط خاضعة للبوابات والمراجعة الفعلية في النظام.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
