// Style reminder: this is the evidence room of the product—dark, precise, layered,
// and intentionally condition-led. Avoid decorative claims; every status points to a source.

import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  CircleDot,
  FileCheck2,
  GitCompare,
  Layers3,
  LockKeyhole,
  Search,
  ShieldAlert,
  Target,
} from "lucide-react";
import {
  acceptanceCriteria,
  decisionLedger,
  gapRegister,
  reconciliationAreas,
  reconciliationSummary,
  traceabilityRows,
  trustSequence,
  type ReconciliationStatus,
  type Severity,
} from "@/data/reconciliationData";

const statusCopy: Record<ReconciliationStatus, { label: string; className: string; icon: typeof CheckCircle2 }> = {
  aligned: { label: "متوافق", className: "bg-emerald-500/10 text-emerald-300 border-emerald-500/30", icon: CheckCircle2 },
  conditional: { label: "مشروط", className: "bg-amber-500/10 text-amber-300 border-amber-500/30", icon: CircleDot },
  gap: { label: "فجوة مفتوحة", className: "bg-rose-500/10 text-rose-300 border-rose-500/30", icon: ShieldAlert },
  "out-of-scope": { label: "خارج النطاق", className: "bg-slate-500/10 text-slate-300 border-slate-500/30", icon: ArrowLeft },
};

const severityCopy: Record<Severity, { label: string; className: string }> = {
  critical: { label: "حرجة", className: "bg-rose-500/15 text-rose-300 border-rose-500/30" },
  high: { label: "مرتفعة", className: "bg-amber-500/15 text-amber-300 border-amber-500/30" },
  medium: { label: "متوسطة", className: "bg-sky-500/15 text-sky-300 border-sky-500/30" },
};

const toneClasses: Record<string, string> = {
  cyan: "bg-cyan-400",
  blue: "bg-blue-400",
  indigo: "bg-indigo-400",
  violet: "bg-violet-400",
  purple: "bg-purple-400",
  amber: "bg-amber-400",
  orange: "bg-orange-400",
  emerald: "bg-emerald-400",
  teal: "bg-teal-400",
  sky: "bg-sky-400",
};

type ViewMode = "overview" | "gaps" | "traceability";

export function ArchitectureReconciliationView() {
  const [viewMode, setViewMode] = useState<ViewMode>("overview");
  const [query, setQuery] = useState("");
  const [expandedGap, setExpandedGap] = useState<string | null>("G-002");

  const filteredGaps = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return gapRegister;
    return gapRegister.filter((gap) =>
      [gap.id, gap.area, gap.title, gap.finding, gap.decision, gap.owner, gap.status].some((value) =>
        value.toLowerCase().includes(normalized),
      ),
    );
  }, [query]);

  const alignedCount = reconciliationAreas.filter((area) => area.status === "aligned").length;
  const openGapCount = gapRegister.filter((gap) => gap.status.includes("Open")).length;

  return (
    <div className="space-y-6" dir="rtl">
      <section className="relative overflow-hidden rounded-2xl border border-indigo-500/20 bg-gradient-to-br from-indigo-950/70 via-slate-900 to-slate-950 p-6 shadow-2xl shadow-indigo-950/30">
        <div className="absolute -left-16 -top-20 h-52 w-52 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <Badge className="border-indigo-400/30 bg-indigo-400/10 text-indigo-200">Architecture Reconciliation</Badge>
              <Badge variant="outline" className="border-amber-400/30 bg-amber-400/10 text-amber-200">{reconciliationSummary.verdict}</Badge>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-white md:text-3xl">مصالحة معمارية من Baseline V1.0 إلى V1.1</h2>
            <p className="mt-3 text-sm leading-7 text-slate-300">{reconciliationSummary.governingRule} تم فصل ما هو متوافق، وما هو مشروط، وما يزال فجوة تنفيذية، بدل تحويل المحاكاة الحالية إلى ادعاء جاهزية إنتاجية.</p>
          </div>
          <div className="grid grid-cols-2 gap-2 text-right sm:grid-cols-3">
            <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3"><p className="text-[11px] text-slate-400">نطاق المراجعة</p><p className="mt-1 text-sm font-semibold text-white">{reconciliationSummary.baseline}</p></div>
            <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3"><p className="text-[11px] text-slate-400">مجالات متوافقة</p><p className="mt-1 text-xl font-bold text-emerald-300">{alignedCount}/{reconciliationAreas.length}</p></div>
            <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3"><p className="text-[11px] text-slate-400">فجوات مفتوحة</p><p className="mt-1 text-xl font-bold text-amber-300">{openGapCount}</p></div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
        <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-400">Canonical trust sequence</p><h3 className="mt-1 text-lg font-bold text-white">تسلسل الثقة الذي لا يمكن تجاوزه</h3></div>
          <div className="flex gap-2">
            {(["overview", "gaps", "traceability"] as ViewMode[]).map((mode) => (
              <Button key={mode} size="sm" variant={viewMode === mode ? "default" : "outline"} onClick={() => setViewMode(mode)} className={viewMode === mode ? "bg-indigo-600 text-white hover:bg-indigo-500" : "border-slate-700 bg-transparent text-slate-300 hover:bg-slate-800"}>
                {mode === "overview" ? "النظرة العامة" : mode === "gaps" ? "سجل الفجوات" : "التتبع والقبول"}
              </Button>
            ))}
          </div>
        </div>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
          {trustSequence.map((item, index) => (
            <div key={item.label} className="relative rounded-xl border border-slate-800 bg-slate-950/60 p-3 transition-colors hover:border-indigo-500/40">
              <div className="flex items-center justify-between"><span className="font-mono text-[10px] text-slate-500">0{item.step}</span><span className={`h-2 w-2 rounded-full ${toneClasses[item.tone]}`} /></div>
              <p className="mt-3 text-sm font-bold text-white">{item.label}</p><p className="mt-1 text-[11px] leading-5 text-slate-400">{item.caption}</p>
              {index < trustSequence.length - 1 && <span className="pointer-events-none absolute -left-2 top-1/2 hidden text-slate-700 lg:block">←</span>}
            </div>
          ))}
        </div>
      </section>

      {viewMode === "overview" && (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {reconciliationAreas.map((area) => {
              const state = statusCopy[area.status];
              const StateIcon = state.icon;
              return <Card key={area.id} className="border-slate-800 bg-slate-900/80 shadow-xl"><CardHeader className="pb-3"><div className="flex items-start justify-between gap-3"><CardTitle className="text-base text-white">{area.title}</CardTitle><Badge variant="outline" className={state.className}><StateIcon className="ml-1 h-3.5 w-3.5" />{state.label}</Badge></div><CardDescription className="text-xs leading-6 text-slate-400">{area.summary}</CardDescription></CardHeader><CardContent><div className="border-t border-slate-800 pt-3 text-[11px] leading-5 text-slate-500">{area.evidence}</div></CardContent></Card>;
            })}
          </div>
          <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
            <Card className="border-slate-800 bg-slate-900/80"><CardHeader><CardTitle className="flex items-center gap-2 text-white"><GitCompare className="h-5 w-5 text-indigo-400" />سجل القرارات المعمارية</CardTitle><CardDescription className="text-slate-400">قرارات تم تثبيتها أو إبقاؤها مشروطة بدل إخفاء تبعاتها.</CardDescription></CardHeader><CardContent className="space-y-3">{decisionLedger.map((item) => <div key={item.id} className="flex gap-3 rounded-xl border border-slate-800 bg-slate-950/50 p-3"><span className="font-mono text-[10px] text-indigo-300">{item.id}</span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center justify-between gap-2"><p className="text-sm font-semibold text-white">{item.label}</p><Badge variant="outline" className={item.status === "accepted" ? "border-emerald-500/30 text-emerald-300" : "border-amber-500/30 text-amber-300"}>{item.status === "accepted" ? "Accepted" : "Conditional"}</Badge></div><p className="mt-1 text-xs leading-5 text-slate-400">{item.decision}</p></div></div>)}</CardContent></Card>
            <Card className="border-slate-800 bg-gradient-to-b from-slate-900 to-indigo-950/30"><CardHeader><CardTitle className="flex items-center gap-2 text-white"><LockKeyhole className="h-5 w-5 text-cyan-400" />حدود الحكم التنفيذي</CardTitle></CardHeader><CardContent className="space-y-4 text-sm leading-7 text-slate-300"><p>{reconciliationSummary.scope}</p><div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-amber-100"><AlertTriangle className="mb-2 h-5 w-5 text-amber-300" /><p className="text-xs">خارج النطاق: الربط الفعلي بالبوابات الحكومية، المدفوعات، اختيار مزود سحابة، blockchain، وإعلان الجاهزية التنظيمية النهائية.</p></div><div className="flex items-center gap-2 text-xs text-slate-400"><FileCheck2 className="h-4 w-4 text-emerald-400" />آخر مراجعة: {reconciliationSummary.reviewedAt}</div></CardContent></Card>
          </div>
        </div>
      )}

      {viewMode === "gaps" && (
        <section className="space-y-4">
          <div className="relative"><Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" /><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ابحث في سجل الفجوات حسب المجال أو المالك أو القرار..." className="border-slate-800 bg-slate-900 pr-10 text-slate-100 placeholder:text-slate-500" /></div>
          {filteredGaps.map((gap) => { const severity = severityCopy[gap.severity]; const open = expandedGap === gap.id; return <Card key={gap.id} className="border-slate-800 bg-slate-900/80"><button className="w-full text-right" onClick={() => setExpandedGap(open ? null : gap.id)}><CardHeader className="pb-3"><div className="flex items-start gap-3"><span className="rounded-lg border border-slate-700 bg-slate-950 px-2 py-1 font-mono text-[10px] text-slate-400">{gap.id}</span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center justify-between gap-2"><CardTitle className="text-base text-white">{gap.title}</CardTitle><div className="flex items-center gap-2"><Badge variant="outline" className={severity.className}>{severity.label}</Badge><ChevronDown className={`h-4 w-4 text-slate-500 transition-transform ${open ? "rotate-180" : ""}`} /></div></div><CardDescription className="mt-1 text-xs text-slate-500">{gap.area} · {gap.owner} · {gap.status}</CardDescription></div></div></CardHeader></button>{open && <CardContent className="space-y-3 border-t border-slate-800 pt-4 text-sm"><div><p className="text-[11px] font-semibold uppercase tracking-wider text-rose-300">Finding</p><p className="mt-1 leading-6 text-slate-300">{gap.finding}</p></div><div className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-3"><p className="text-[11px] font-semibold uppercase tracking-wider text-indigo-300">Reconciliation decision</p><p className="mt-1 leading-6 text-slate-300">{gap.decision}</p></div></CardContent>}</Card>; })}
        </section>
      )}

      {viewMode === "traceability" && (
        <section className="space-y-5">
          <Card className="border-slate-800 bg-slate-900/80"><CardHeader><CardTitle className="flex items-center gap-2 text-white"><Target className="h-5 w-5 text-cyan-400" />مصفوفة التتبع وقبول التنفيذ</CardTitle><CardDescription className="text-slate-400">كل مطلب يربط الكيان بمسار العمل وAPI وواجهة العرض وسجل التدقيق.</CardDescription></CardHeader><CardContent className="overflow-x-auto"><table className="w-full min-w-[820px] text-right text-xs"><thead><tr className="border-b border-slate-800 text-slate-500"><th className="px-3 py-3 font-medium">المطلب</th><th className="px-3 py-3 font-medium">Entities</th><th className="px-3 py-3 font-medium">Workflow</th><th className="px-3 py-3 font-medium">API</th><th className="px-3 py-3 font-medium">UI</th><th className="px-3 py-3 font-medium">Audit</th></tr></thead><tbody>{traceabilityRows.map((row) => <tr key={row.requirement} className="border-b border-slate-800/70 text-slate-300"><td className="px-3 py-3 font-semibold text-white">{row.requirement}</td><td className="px-3 py-3 font-mono text-[10px] text-cyan-300">{row.entity}</td><td className="px-3 py-3 font-mono text-[10px] text-indigo-300">{row.workflow}</td><td className="px-3 py-3 text-slate-400">{row.api}</td><td className="px-3 py-3 text-slate-400">{row.ui}</td><td className="px-3 py-3 text-emerald-300">{row.audit}</td></tr>)}</tbody></table></CardContent></Card>
          <div className="grid gap-3 md:grid-cols-2">{acceptanceCriteria.map((criterion) => <div key={criterion.id} className="rounded-xl border border-slate-800 bg-slate-900/70 p-4"><div className="flex items-center justify-between gap-3"><span className="font-mono text-[10px] text-cyan-300">{criterion.id}</span><Badge variant="outline" className="border-slate-700 text-slate-400">{criterion.area}</Badge></div><p className="mt-3 text-xs leading-6 text-slate-300"><strong className="text-slate-100">GIVEN</strong> {criterion.given}<br /><strong className="text-indigo-300">WHEN</strong> {criterion.when}<br /><strong className="text-emerald-300">THEN</strong> {criterion.then}</p></div>)}</div>
        </section>
      )}

      <div className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-3 text-xs text-slate-500"><Layers3 className="h-4 w-4 text-indigo-400" />المصدر الكنسي: `01–11_COME_IN_IT_V1_0_*` · العرض الحالي توثيقي ومحاكاة آمنة، وليس تنفيذًا خلفيًا أو اعتمادًا حكوميًا فعليًا.</div>
    </div>
  );
}

export default ArchitectureReconciliationView;
