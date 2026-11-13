import { useMemo, useState } from "react";
import {
  ArrowLeft,
  BarChart3,
  BadgeCheck,
  Building2,
  CheckCircle2,
  ChevronLeft,
  CircleAlert,
  CloudOff,
  Eye,
  Fingerprint,
  FlaskConical,
  Landmark,
  LockKeyhole,
  Play,
  Presentation,
  RotateCcw,
  ScrollText,
  ShieldCheck,
  Sparkles,
  UserRound,
  Workflow,
  XCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { investorTourStages } from "@/data/investorTourData";
import {
  actionLabels,
  createInitialSimulationState,
  demoScenarios,
  evaluateDemoPermission,
  executeSimulationCommand,
  type DemoPersona,
  type PermissionDecision,
  type SimulationCommand,
  type SimulationState,
} from "@/data/liveSimulationData";

const kycLabels = {
  unverified: "غير متحقق",
  pending: "قيد المراجعة",
  verified: "متحقق",
  rejected: "مرفوض",
} as const;

const kybLabels = {
  unverified: "غير محال",
  pending: "قيد المراجعة",
  verified: "متحقق",
  rejected: "مرفوض",
} as const;

const accentClasses = {
  amber: "bg-amber-500/10 border-amber-500/20 text-amber-700 dark:text-amber-300",
  emerald: "bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-300",
  sky: "bg-sky-500/10 border-sky-500/20 text-sky-700 dark:text-sky-300",
  violet: "bg-violet-500/10 border-violet-500/20 text-violet-700 dark:text-violet-300",
  rose: "bg-rose-500/10 border-rose-500/20 text-rose-700 dark:text-rose-300",
};

const roleLabels: Record<DemoPersona["role"], string> = {
  consumer: "مستهلك",
  owner: "مالك نشاط",
  authorized_representative: "ممثل معتمد",
  compliance_reviewer: "مراجع امتثال",
  government_analyst: "محلل جهة عامة",
};

function StatePill({ label, success }: { label: string; success: boolean }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold",
        success
          ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
          : "border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-300"
      )}
    >
      {success ? <CheckCircle2 className="h-3 w-3" /> : <CircleAlert className="h-3 w-3" />}
      {label}
    </Badge>
  );
}

function DecisionCard({ decision, command }: { decision: PermissionDecision; command: SimulationCommand }) {
  return (
    <div
      className={cn(
        "rounded-2xl border p-4 transition-colors",
        decision.allowed
          ? "border-emerald-500/20 bg-emerald-500/[0.06]"
          : "border-rose-500/20 bg-rose-500/[0.06]"
      )}
    >
      <div className="mb-2 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {decision.allowed ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
          ) : (
            <XCircle className="h-5 w-5 text-rose-600" />
          )}
          <span className="font-bold text-foreground">{decision.allowed ? "مسموح في المحاكاة" : "ممنوع في المحاكاة"}</span>
        </div>
        <Badge variant="outline" className="font-mono text-[10px] text-muted-foreground">
          {decision.rule}
        </Badge>
      </div>
      <p className="text-sm leading-6 text-muted-foreground">{decision.reason}</p>
      <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
        <LockKeyhole className="h-3.5 w-3.5" />
        <span>الإجراء المحلل: {actionLabels[command.action]}</span>
      </div>
    </div>
  );
}

export default function LiveSimulationEnvironment() {
  const [simulation, setSimulation] = useState<SimulationState>(() => createInitialSimulationState());
  const [scenarioId, setScenarioId] = useState(demoScenarios[0].id);
  const [stepIndex, setStepIndex] = useState(0);
  const [completedSteps, setCompletedSteps] = useState(0);
  const [selectedPersonaId, setSelectedPersonaId] = useState("lina");
  const [lastDecision, setLastDecision] = useState<PermissionDecision | null>(null);
  const [investorMode, setInvestorMode] = useState(false);
  const [investorStageIndex, setInvestorStageIndex] = useState(0);

  const scenario = useMemo(
    () => demoScenarios.find(item => item.id === scenarioId) ?? demoScenarios[0],
    [scenarioId]
  );
  const currentCommand = scenario.steps[Math.min(stepIndex, scenario.steps.length - 1)];
  const prospectiveDecision = evaluateDemoPermission(simulation, currentCommand);
  const selectedPersona = simulation.personas.find(persona => persona.id === selectedPersonaId) ?? simulation.personas[0];
  const selectedBusiness = simulation.businesses.find(business => business.ownerId === selectedPersona.id);
  const trustPercent = Math.round(
    ((selectedPersona.kycStatus === "verified" ? 1 : 0) +
      (selectedBusiness?.kybStatus === "verified" ? 1 : 0) +
      (selectedBusiness?.membershipActive ? 1 : 0)) /
      (selectedPersona.role === "consumer" || selectedPersona.role === "government_analyst" || selectedPersona.role === "compliance_reviewer" ? 1 : 3) *
      100
  );

  const reset = (nextScenarioId = scenarioId) => {
    const nextScenario = demoScenarios.find(item => item.id === nextScenarioId) ?? demoScenarios[0];
    setSimulation(createInitialSimulationState());
    setScenarioId(nextScenario.id);
    setStepIndex(0);
    setCompletedSteps(0);
    setSelectedPersonaId(nextScenario.steps[0].actorId);
    setLastDecision(null);
  };

  const selectInvestorStage = (index: number) => {
    const stage = investorTourStages[index];
    setInvestorStageIndex(index);
    setInvestorMode(true);
    reset(stage.scenarioId);
  };

  const runStep = () => {
    const { state, decision } = executeSimulationCommand(simulation, currentCommand);
    setSimulation(state);
    setLastDecision(decision);
    setSelectedPersonaId(currentCommand.actorId);
    setCompletedSteps(value => Math.min(value + 1, scenario.steps.length));
    setStepIndex(value => Math.min(value + 1, scenario.steps.length - 1));
  };

  const runAll = () => {
    let nextState = simulation;
    let decision: PermissionDecision | null = null;
    for (let index = stepIndex; index < scenario.steps.length; index += 1) {
      const result = executeSimulationCommand(nextState, scenario.steps[index]);
      nextState = result.state;
      decision = result.decision;
    }
    setSimulation(nextState);
    setLastDecision(decision);
    setSelectedPersonaId(scenario.steps[scenario.steps.length - 1].actorId);
    setCompletedSteps(scenario.steps.length);
    setStepIndex(scenario.steps.length - 1);
  };

  const verifiedOfferings = simulation.offerings.filter(item => item.status === "verified").length;
  const approvedActions = simulation.audit.filter(item => item.result === "allowed").length;

  return (
    <section dir="rtl" className="space-y-6">
      <Card className="overflow-hidden border-primary/15 bg-[radial-gradient(circle_at_90%_0%,hsl(var(--primary)/0.12),transparent_30%),linear-gradient(135deg,hsl(var(--card)),hsl(var(--muted)/0.48))] shadow-sm">
        <CardContent className="relative p-0">
          <div className="absolute left-0 top-0 h-28 w-28 rounded-full bg-primary/10 blur-3xl" />
          <div className="relative grid gap-6 p-6 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <Badge className="gap-1.5 rounded-full bg-amber-500 px-3 py-1 text-amber-950 hover:bg-amber-500">
                  <FlaskConical className="h-3.5 w-3.5" />
                  DEMO / SIMULATION
                </Badge>
                <Badge variant="outline" className="gap-1.5 rounded-full border-primary/25 bg-background/50 px-3 py-1 text-primary">
                  <CloudOff className="h-3.5 w-3.5" />
                  ذاكرة محلية — بلا كتابة إنتاجية
                </Badge>
                {investorMode && (
                  <Badge variant="outline" className="gap-1.5 rounded-full border-violet-500/25 bg-violet-500/10 px-3 py-1 text-violet-700 dark:text-violet-300">
                    <Presentation className="h-3.5 w-3.5" />
                    INVESTOR TOUR
                  </Badge>
                )}
              </div>
              <h2 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">بيئة المحاكاة الحية</h2>
              <p className="mt-2 max-w-3xl text-sm leading-7 text-muted-foreground">
                اختبر رحلة الثقة من الهوية إلى المطابقة باستخدام شخصيات خيالية، مع تفسير فوري لكل قرار. لا تتصل هذه التجربة بقاعدة البيانات ولا تنشط نطاق Healthcare.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 lg:justify-end">
              <Button variant={investorMode ? "default" : "outline"} size="sm" onClick={() => setInvestorMode(value => !value)} className="gap-2 bg-background/60">
                <Presentation className="h-4 w-4" />
                {investorMode ? "إنهاء عرض المستثمر" : "وضع المستثمر"}
              </Button>
              <Button variant="outline" size="sm" onClick={() => reset()} className="gap-2 bg-background/60">
                <RotateCcw className="h-4 w-4" />
                إعادة الضبط
              </Button>
              <Button size="sm" onClick={runStep} className="gap-2">
                <Play className="h-4 w-4" />
                تنفيذ الخطوة التالية
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {investorMode && (() => {
        const activeStage = investorTourStages[investorStageIndex];
        return (
          <Card className="overflow-hidden border-violet-500/20 bg-[linear-gradient(120deg,rgba(124,58,237,0.08),rgba(14,165,233,0.05),transparent)] shadow-sm">
            <CardContent className="p-5 sm:p-6">
              <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <div className="flex items-center gap-2 text-violet-700 dark:text-violet-300">
                    <Sparkles className="h-4 w-4" />
                    <span className="text-xs font-bold tracking-wide">رحلة عرض استثمارية · محلية وتفسيرية</span>
                  </div>
                  <h3 className="mt-2 text-xl font-black text-foreground">استكشف المنصة كسلسلة قرارات قابلة للفحص</h3>
                  <p className="mt-1 max-w-3xl text-sm leading-6 text-muted-foreground">المؤشرات هنا تشغيلية وغير مالية؛ وهي تشرح تصميم المنتج ولا تمثل توقعات إيراد أو التزاماً استثمارياً.</p>
                </div>
                <Badge variant="outline" className="w-fit border-violet-500/25 bg-background/60 font-mono text-[10px]">DEMO-INV-1.0</Badge>
              </div>

              <div className="grid gap-2 md:grid-cols-4">
                {investorTourStages.map((stage, index) => (
                  <button
                    key={stage.id}
                    onClick={() => selectInvestorStage(index)}
                    className={cn(
                      "rounded-xl border p-3 text-right transition-all duration-200",
                      index === investorStageIndex ? "border-violet-500/35 bg-violet-500/10 shadow-sm" : "border-border/70 bg-background/45 hover:border-violet-500/25 hover:bg-violet-500/[0.04]"
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <Badge variant="outline" className="border-violet-500/20 bg-background/60 font-mono text-[10px]">{stage.number}</Badge>
                      {index === investorStageIndex && <CheckCircle2 className="h-4 w-4 text-violet-600" />}
                    </div>
                    <p className="mt-2 text-xs font-bold text-foreground">{stage.eyebrow}</p>
                  </button>
                ))}
              </div>

              <div className="mt-4 grid gap-4 rounded-2xl border border-violet-500/15 bg-background/55 p-4 lg:grid-cols-[1.35fr_0.65fr] lg:items-center">
                <div>
                  <p className="text-xs font-bold text-violet-700 dark:text-violet-300">{activeStage.number} · {activeStage.eyebrow}</p>
                  <h4 className="mt-1 text-lg font-black text-foreground">{activeStage.title}</h4>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{activeStage.description}</p>
                </div>
                <div className="rounded-xl border border-border/70 bg-muted/35 p-3.5">
                  <p className="text-[11px] font-bold text-foreground">دليل حي داخل المحاكاة</p>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">{activeStage.evidence}</p>
                  <Button size="sm" className="mt-3 w-full gap-2" onClick={() => reset(activeStage.scenarioId)}>
                    افتح المسار المرتبط
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="mt-4 grid gap-2 sm:grid-cols-3">
                {[
                  ["طبقات الثقة", "KYC → KYB → عضوية → عرض"],
                  ["نماذج ممثلة", `${demoScenarios.length} مسارات دون تكرار منطق الثقة`],
                  ["سطح بيانات حساس", "0 بيانات حقيقية · 0 نطاق Healthcare"],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-xl border border-border/70 bg-background/45 p-3">
                    <p className="text-[11px] font-semibold text-muted-foreground">{label}</p>
                    <p className="mt-1 text-sm font-bold text-foreground">{value}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })()}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "شخصيات خيالية", value: simulation.personas.length, icon: UserRound, tone: "text-sky-600 bg-sky-500/10" },
          { label: "أفعال مسجلة محلياً", value: simulation.audit.length, icon: ScrollText, tone: "text-violet-600 bg-violet-500/10" },
          { label: "قرارات مسموحة", value: approvedActions, icon: ShieldCheck, tone: "text-emerald-600 bg-emerald-500/10" },
          { label: "عروض متحققة", value: verifiedOfferings, icon: BadgeCheck, tone: "text-amber-600 bg-amber-500/10" },
        ].map(stat => (
          <Card key={stat.label} className="border-border/70 shadow-none">
            <CardContent className="flex items-center justify-between p-4">
              <div>
                <p className="text-xs font-medium text-muted-foreground">{stat.label}</p>
                <p className="mt-1 text-2xl font-black tabular-nums text-foreground">{stat.value}</p>
              </div>
              <div className={cn("rounded-xl p-2.5", stat.tone)}>
                <stat.icon className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[300px_minmax(0,1fr)_330px]">
        <Card className="border-border/70 shadow-none">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base"><Workflow className="h-4 w-4 text-primary" /> سيناريوهات التجارة</CardTitle>
            <CardDescription>كل سيناريو يعيد ضبط الحالة المحلية.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {demoScenarios.map(item => {
              const active = item.id === scenario.id;
              return (
                <button
                  key={item.id}
                  onClick={() => reset(item.id)}
                  className={cn(
                    "group w-full rounded-xl border p-3 text-right transition-all duration-200",
                    active ? "border-primary/30 bg-primary/8 shadow-sm" : "border-transparent hover:border-border hover:bg-muted/60"
                  )}
                >
                  <div className="flex items-center justify-between gap-3">
                    <Badge variant={active ? "default" : "outline"} className="rounded-md text-[10px]">{item.shortTitle}</Badge>
                    <ChevronLeft className={cn("h-4 w-4 transition-transform", active ? "text-primary" : "text-muted-foreground group-hover:-translate-x-0.5")} />
                  </div>
                  <p className="mt-2 text-sm font-bold text-foreground">{item.title}</p>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">{item.intent}</p>
                </button>
              );
            })}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="border-border/70 shadow-none">
            <CardHeader className="border-b border-border/60 pb-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="rounded-full text-primary">{scenario.shortTitle}</Badge>
                    <span className="text-xs text-muted-foreground">{completedSteps}/{scenario.steps.length} خطوة منفذة</span>
                  </div>
                  <CardTitle className="mt-2 text-xl">{scenario.title}</CardTitle>
                  <CardDescription className="mt-1 max-w-2xl leading-6">{scenario.description}</CardDescription>
                </div>
                <Button variant="secondary" size="sm" onClick={runAll} className="gap-2 self-start">
                  تشغيل المسار
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </div>
              <Progress value={(completedSteps / scenario.steps.length) * 100} className="mt-4 h-1.5" />
            </CardHeader>
            <CardContent className="p-5">
              <div className="relative space-y-1 before:absolute before:right-[15px] before:top-5 before:h-[calc(100%-40px)] before:w-px before:bg-border">
                {scenario.steps.map((step, index) => {
                  const completed = index < completedSteps;
                  const isCurrent = index === stepIndex;
                  const isFuture = index > completedSteps;
                  const itemActor = simulation.personas.find(persona => persona.id === step.actorId);
                  return (
                    <button
                      key={`${scenario.id}-${index}`}
                      onClick={() => setStepIndex(index)}
                      className={cn(
                        "relative z-10 flex w-full items-center gap-3 rounded-xl p-3 text-right transition-all",
                        isCurrent ? "bg-primary/8 ring-1 ring-primary/15" : "hover:bg-muted/60",
                        isFuture && "opacity-55"
                      )}
                    >
                      <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 bg-background", completed ? "border-emerald-500 text-emerald-600" : isCurrent ? "border-primary text-primary" : "border-muted-foreground/30 text-muted-foreground")}>
                        {completed ? <CheckCircle2 className="h-4 w-4" /> : <span className="text-xs font-bold">{index + 1}</span>}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-bold text-foreground">{step.label}</span>
                          <Badge variant="outline" className="shrink-0 text-[10px]">{itemActor?.name}</Badge>
                        </div>
                        <span className="mt-0.5 block text-xs text-muted-foreground">{actionLabels[step.action]}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/70 shadow-none">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base"><Fingerprint className="h-4 w-4 text-primary" /> مفسر الصلاحية</CardTitle>
              <CardDescription>القرار التالي يحسب قبل التنفيذ من حالة السيناريو الحالية.</CardDescription>
            </CardHeader>
            <CardContent>
              <DecisionCard decision={lastDecision ?? prospectiveDecision} command={currentCommand} />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-border/70 shadow-none">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base"><UserRound className="h-4 w-4 text-primary" /> شخصيات المحاكاة</CardTitle>
              <CardDescription>سجلات خيالية، منفصلة عن الحسابات الحقيقية.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {simulation.personas.map(persona => (
                <button
                  key={persona.id}
                  onClick={() => setSelectedPersonaId(persona.id)}
                  className={cn(
                    "w-full rounded-xl border p-3 text-right transition-all",
                    selectedPersona.id === persona.id ? "border-primary/30 bg-primary/7" : "border-transparent hover:border-border hover:bg-muted/60"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <div className={cn("flex h-8 w-8 items-center justify-center rounded-full border", accentClasses[persona.accent])}>
                      <UserRound className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-foreground">{persona.name}</p>
                      <p className="truncate text-[11px] text-muted-foreground">{roleLabels[persona.role]}</p>
                    </div>
                  </div>
                </button>
              ))}
            </CardContent>
          </Card>

          <Card className="border-border/70 shadow-none">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base"><ShieldCheck className="h-4 w-4 text-primary" /> بطاقة الثقة</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <div className="mb-1.5 flex items-center justify-between text-xs">
                  <span className="font-bold text-foreground">{selectedPersona.name}</span>
                  <span className="tabular-nums text-muted-foreground">{trustPercent}%</span>
                </div>
                <Progress value={trustPercent} className="h-2" />
              </div>
              <div className="flex flex-wrap gap-2">
                <StatePill label={`KYC: ${kycLabels[selectedPersona.kycStatus]}`} success={selectedPersona.kycStatus === "verified"} />
                {selectedBusiness && <StatePill label={`KYB: ${kybLabels[selectedBusiness.kybStatus]}`} success={selectedBusiness.kybStatus === "verified"} />}
                {selectedBusiness && <StatePill label={selectedBusiness.membershipActive ? "عضوية نشطة" : "عضوية غير نشطة"} success={selectedBusiness.membershipActive} />}
              </div>
              {selectedBusiness && (
                <div className="rounded-xl bg-muted/60 p-3 text-xs leading-5 text-muted-foreground">
                  <div className="mb-1 flex items-center gap-1.5 font-semibold text-foreground"><Building2 className="h-3.5 w-3.5" /> {selectedBusiness.legalName}</div>
                  الكيان: {selectedBusiness.entityType} — تمثيل خيالي للقرار فقط.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.25fr]">
        <Card className="border-border/70 shadow-none">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base"><Landmark className="h-4 w-4 text-primary" /> مبدأ الرؤية حسب الغرض</CardTitle>
            <CardDescription>تظهر الجهة العامة مؤشرات مجمعة فقط في المحاكاة.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-3 gap-2">
              {[
                ["نماذج ممثلة", "5"],
                ["صفقات فردية", "0"],
                ["بيانات صحية", "0"],
              ].map(([label, value]) => (
                <div key={label} className="rounded-xl border border-border/70 bg-muted/30 p-3 text-center">
                  <p className="text-lg font-black text-foreground">{value}</p>
                  <p className="mt-1 text-[10px] text-muted-foreground">{label}</p>
                </div>
              ))}
            </div>
            <div className="flex gap-2 rounded-xl border border-sky-500/20 bg-sky-500/[0.06] p-3 text-xs leading-5 text-sky-800 dark:text-sky-200">
              <Eye className="mt-0.5 h-4 w-4 shrink-0" />
              تعرض B2G في هذا السياق مؤشراً تجميعياً خيالياً؛ لا توجد هوية مشترٍ أو تفاصيل عقد أو سجلات فردية.
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/70 shadow-none">
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
            <div>
              <CardTitle className="flex items-center gap-2 text-base"><ScrollText className="h-4 w-4 text-primary" /> سجل تدقيق المحاكاة</CardTitle>
              <CardDescription className="mt-1">أحداث محلية مرئية لا تمثل WORM إنتاجياً.</CardDescription>
            </div>
            <Badge variant="outline" className="font-mono text-[10px]">LOCAL ONLY</Badge>
          </CardHeader>
          <CardContent>
            {simulation.audit.length === 0 ? (
              <div className="flex min-h-28 flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 p-5 text-center">
                <ScrollText className="mb-2 h-5 w-5 text-muted-foreground" />
                <p className="text-sm font-semibold text-foreground">لم تسجل أحداث بعد</p>
                <p className="mt-1 text-xs text-muted-foreground">نفذ خطوة لعرض أثر القرار محلياً.</p>
              </div>
            ) : (
              <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
                {simulation.audit.map(event => (
                  <div key={event.id} className="rounded-xl border border-border/70 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-foreground">{event.action}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">{event.actor} · {event.resource} · {event.timestamp}</p>
                      </div>
                      <Badge className={cn("shrink-0 text-[10px]", event.result === "allowed" ? "bg-emerald-600 hover:bg-emerald-600" : "bg-rose-600 hover:bg-rose-600")}>
                        {event.result === "allowed" ? "مسموح" : "مرفوض"}
                      </Badge>
                    </div>
                    <p className="mt-2 text-xs leading-5 text-muted-foreground">{event.reason}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-amber-500/20 bg-amber-500/[0.06] p-4 text-sm text-amber-950 dark:text-amber-100 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-2.5"><CircleAlert className="mt-0.5 h-4 w-4 shrink-0" /><span><strong>حدود SIM-1.0:</strong> لا دفع، لا عقد، لا توقيع، لا بوابة حكومية، لا بيانات حقيقية، ولا سجل صحي نشط.</span></div>
        <span className="whitespace-nowrap text-xs font-semibold">SIM-1.0 · In-memory</span>
      </div>
    </section>
  );
}
