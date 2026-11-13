import { useMemo, useState } from "react";
import {
  ArrowLeft,
  BadgeCheck,
  Building2,
  CheckCircle2,
  CircleAlert,
  ClipboardCheck,
  FileSearch,
  Handshake,
  LockKeyhole,
  Play,
  RefreshCcw,
  ShieldCheck,
  Sparkles,
  UserRound,
  Workflow,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import {
  getPrototypeJourney,
  prototypeJourneys,
  prototypeProgress,
  type PrototypeJourneyId,
  type PrototypeStage,
} from "@/data/prototypeData";

type InteractivePrototypeProps = {
  onNavigate?: (tab: PrototypeStage["destination"]) => void;
};

const accentStyles = {
  emerald: "border-emerald-500/25 bg-emerald-500/[0.07] text-emerald-700 dark:text-emerald-300",
  sky: "border-sky-500/25 bg-sky-500/[0.07] text-sky-700 dark:text-sky-300",
  violet: "border-violet-500/25 bg-violet-500/[0.07] text-violet-700 dark:text-violet-300",
};

const dataLabels = {
  public: "عام",
  verified: "متحقق",
  restricted: "مقيد",
  confidential_sovereign: "سري سيادي",
} as const;

function DecisionPill({ stage }: { stage: PrototypeStage }) {
  const review = stage.decision === "review";
  return (
    <Badge
      variant="outline"
      className={cn(
        "gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold",
        review
          ? "border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-300"
          : "border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
      )}
    >
      {review ? <CircleAlert className="h-3.5 w-3.5" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
      {stage.decisionLabel}
    </Badge>
  );
}

export default function InteractivePrototype({ onNavigate }: InteractivePrototypeProps) {
  const [journeyId, setJourneyId] = useState<PrototypeJourneyId>("business");
  const [stageIndex, setStageIndex] = useState(0);
  const journey = useMemo(() => getPrototypeJourney(journeyId), [journeyId]);
  const stage = journey.stages[stageIndex];
  const progress = prototypeProgress(stageIndex, journey.stages.length);

  const selectJourney = (nextJourneyId: PrototypeJourneyId) => {
    setJourneyId(nextJourneyId);
    setStageIndex(0);
  };

  const nextStage = () => setStageIndex(value => Math.min(value + 1, journey.stages.length - 1));
  const reset = () => setStageIndex(0);

  return (
    <section dir="rtl" className="space-y-6">
      <Card className="overflow-hidden border-cyan-500/20 bg-[radial-gradient(circle_at_88%_0%,rgba(14,165,233,0.14),transparent_28%),radial-gradient(circle_at_8%_100%,rgba(16,185,129,0.1),transparent_30%),linear-gradient(135deg,hsl(var(--card)),hsl(var(--muted)/0.45))] shadow-sm">
        <CardContent className="relative p-0">
          <div className="relative grid gap-6 p-6 lg:grid-cols-[1fr_auto] lg:items-end sm:p-8">
            <div>
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <Badge className="gap-1.5 rounded-full bg-slate-950 px-3 py-1 text-white hover:bg-slate-950">
                  <Sparkles className="h-3.5 w-3.5" />
                  CLICKABLE PROTOTYPE
                </Badge>
                <Badge variant="outline" className="gap-1.5 rounded-full border-cyan-500/25 bg-background/65 px-3 py-1 text-cyan-700 dark:text-cyan-300">
                  <LockKeyhole className="h-3.5 w-3.5" />
                  حالة خيالية محلية — بلا كتابة إنتاجية
                </Badge>
              </div>
              <h2 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">Prototype رحلة التجارة الموثوقة</h2>
              <p className="mt-2 max-w-3xl text-sm leading-7 text-muted-foreground">
                انتقل عبر قرارات الهوية والتحقق وملف النشاط والمطابقة في واجهة واحدة، ثم افتح الشاشة الأصلية المقابلة لكل خطوة.
                لا تتصل هذه التجربة بقاعدة البيانات ولا تكشف بيانات حقيقية أو معلومات Healthcare.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 lg:justify-end">
              <Button variant="outline" size="sm" onClick={reset} className="gap-2 bg-background/65">
                <RefreshCcw className="h-4 w-4" />
                إعادة الرحلة
              </Button>
              <Button size="sm" onClick={nextStage} disabled={stageIndex === journey.stages.length - 1} className="gap-2">
                <Play className="h-4 w-4" />
                الخطوة التالية
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-3 lg:grid-cols-3">
        {prototypeJourneys.map(item => {
          const selected = item.id === journeyId;
          const Icon = item.id === "business" ? Building2 : item.id === "individual" ? UserRound : ClipboardCheck;
          return (
            <button
              key={item.id}
              onClick={() => selectJourney(item.id)}
              className={cn(
                "rounded-2xl border p-4 text-right transition-all duration-200",
                selected ? `${accentStyles[item.accent]} shadow-sm` : "border-border/70 bg-card hover:-translate-y-0.5 hover:border-cyan-500/25 hover:bg-muted/30"
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="rounded-xl bg-background/70 p-2.5 shadow-sm"><Icon className="h-5 w-5" /></div>
                <Badge variant="outline" className="bg-background/50 font-mono text-[10px]">{item.model}</Badge>
              </div>
              <p className="mt-4 font-black text-foreground">{item.title}</p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">{item.description}</p>
            </button>
          );
        })}
      </div>

      <Card className="border-border/70 shadow-sm">
        <CardHeader className="border-b border-border/60 bg-muted/20 pb-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className={cn("gap-1.5", accentStyles[journey.accent])}>
                  <Workflow className="h-3.5 w-3.5" />
                  {journey.model} · Prototype محلي
                </Badge>
                <span className="text-xs font-semibold text-muted-foreground">{journey.persona}</span>
              </div>
              <CardTitle className="mt-2 text-xl">{journey.title}</CardTitle>
              <CardDescription className="mt-1 max-w-3xl leading-6">{journey.outcome}</CardDescription>
            </div>
            <div className="min-w-48 rounded-xl border border-border/70 bg-background/75 px-3 py-2.5">
              <div className="flex items-center justify-between text-[11px] font-semibold text-muted-foreground">
                <span>تقدم الرحلة</span><span>{stageIndex + 1} / {journey.stages.length}</span>
              </div>
              <Progress value={progress} className="mt-2 h-1.5" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-5 sm:p-6">
          <div className="grid gap-2 lg:grid-cols-4">
            {journey.stages.map((item, index) => {
              const active = index === stageIndex;
              const complete = index < stageIndex;
              return (
                <button
                  key={item.id}
                  onClick={() => setStageIndex(index)}
                  className={cn(
                    "relative rounded-xl border p-3.5 text-right transition-all duration-200",
                    active ? "border-cyan-500/35 bg-cyan-500/[0.07] shadow-sm" : "border-border/70 bg-background hover:border-cyan-500/25",
                    complete && "border-emerald-500/20 bg-emerald-500/[0.04]"
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className={cn("flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-black", active ? "bg-cyan-600 text-white" : complete ? "bg-emerald-500 text-white" : "bg-muted text-muted-foreground")}>{index + 1}</span>
                    {complete && <CheckCircle2 className="h-4 w-4 text-emerald-600" />}
                  </div>
                  <p className="mt-3 text-xs font-black leading-5 text-foreground">{item.title}</p>
                </button>
              );
            })}
          </div>

          <div className="mt-5 grid gap-5 rounded-2xl border border-border/70 bg-[linear-gradient(135deg,hsl(var(--background)),hsl(var(--muted)/0.35))] p-5 lg:grid-cols-[1.35fr_0.65fr]">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="font-mono text-[10px] text-muted-foreground">{stage.eyebrow}</Badge>
                <DecisionPill stage={stage} />
              </div>
              <h3 className="mt-3 text-xl font-black text-foreground">{stage.title}</h3>
              <p className="mt-2 max-w-2xl text-sm leading-7 text-muted-foreground">{stage.description}</p>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-border/70 bg-background/75 p-3.5">
                  <p className="text-[11px] font-bold text-muted-foreground">بوابة القرار</p>
                  <p className="mt-1 font-mono text-xs font-semibold text-foreground">{stage.gate}</p>
                </div>
                <div className="rounded-xl border border-border/70 bg-background/75 p-3.5">
                  <p className="text-[11px] font-bold text-muted-foreground">تصنيف البيانات في هذه الخطوة</p>
                  <p className="mt-1 text-sm font-bold text-foreground">{dataLabels[stage.dataClass]}</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col rounded-2xl border border-cyan-500/15 bg-cyan-500/[0.04] p-4">
              <div className="flex items-center gap-2 text-cyan-700 dark:text-cyan-300"><FileSearch className="h-4 w-4" /><span className="text-xs font-black">شاشة مرتبطة في المنصة</span></div>
              <p className="mt-3 text-sm font-bold text-foreground">{stage.destinationLabel}</p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">يفتح هذا الاختصار واجهة العرض الحقيقية في المشروع؛ لا ينفذ قراراً ولا يغير بياناتاً.</p>
              <div className="mt-auto pt-5">
                <Button size="sm" className="w-full gap-2" onClick={() => onNavigate?.(stage.destination)}>
                  افتح الشاشة المرتبطة
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {[
              { label: "فصل الهوية", value: "PERSON ≠ BUSINESS", icon: UserRound },
              { label: "محرك الأهلية", value: "Allow / Deny / Review", icon: Handshake },
              { label: "مسار التدقيق", value: "WORM decision trace", icon: ShieldCheck },
            ].map(item => {
              const Icon = item.icon;
              return <div key={item.label} className="flex items-center gap-3 rounded-xl border border-border/70 bg-background/55 p-3"><div className="rounded-lg bg-muted p-2"><Icon className="h-4 w-4 text-primary" /></div><div><p className="text-[11px] font-semibold text-muted-foreground">{item.label}</p><p className="mt-0.5 text-xs font-bold text-foreground">{item.value}</p></div></div>;
            })}
          </div>

          <p className="mt-5 flex items-start gap-2 rounded-xl border border-amber-500/20 bg-amber-500/[0.06] p-3 text-xs leading-6 text-amber-800 dark:text-amber-200"><BadgeCheck className="mt-0.5 h-4 w-4 shrink-0" />هذا نموذج تفسيري لاستعراض تصميم المنتج؛ لا يمثل اعتماداً تنظيمياً، ولا يربط بوابة حكومية أو مدفوعات أو بيانات سريرية.</p>
        </CardContent>
      </Card>
    </section>
  );
}
