import { useMemo, useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Boxes, CheckCircle2, CircleAlert, Handshake, Loader2, PackagePlus, SearchCheck, Truck, ClipboardList, CircleDollarSign, Gavel } from "lucide-react";
import { toast } from "sonner";

type TradeObjectType = "product" | "service" | "used_asset";

const typeLabel: Record<TradeObjectType, string> = {
  product: "منتج",
  service: "خدمة",
  used_asset: "أصل مستخدم",
};

const verificationStyle: Record<string, string> = {
  verified: "border-emerald-200 bg-emerald-50 text-emerald-700",
  pending: "border-amber-200 bg-amber-50 text-amber-800",
  draft: "border-slate-200 bg-slate-50 text-slate-600",
  rejected: "border-rose-200 bg-rose-50 text-rose-700",
  suspended: "border-rose-200 bg-rose-50 text-rose-700",
  expired: "border-orange-200 bg-orange-50 text-orange-700",
};

const matchStyle: Record<string, string> = {
  eligible: "border-emerald-200 bg-emerald-50 text-emerald-700",
  ineligible: "border-rose-200 bg-rose-50 text-rose-700",
  candidate: "border-slate-200 bg-slate-50 text-slate-600",
  declined: "border-orange-200 bg-orange-50 text-orange-700",
  expired: "border-orange-200 bg-orange-50 text-orange-700",
};

function isVerifiedBusiness(business: { verificationStatus: string; membershipStatus: string }) {
  return business.verificationStatus === "verified" && business.membershipStatus === "active";
}

export function TradeOperationsDashboard() {
  const { isAuthenticated, loading } = useAuth();
  const utils = trpc.useUtils();
  const businessesQuery = trpc.businesses.list.useQuery(undefined, { enabled: isAuthenticated });
  const offeringsQuery = trpc.trade.offerings.list.useQuery(undefined, { enabled: isAuthenticated });
  const demandsQuery = trpc.trade.demands.list.useQuery(undefined, { enabled: isAuthenticated });
  const matchesQuery = trpc.trade.matches.list.useQuery(undefined, { enabled: isAuthenticated });
  const rfqsQuery = trpc.trade.transactions.rfqs.useQuery(undefined, { enabled: isAuthenticated });
  const quotationsQuery = trpc.trade.transactions.quotations.useQuery(undefined, { enabled: isAuthenticated });
  const transactionsQuery = trpc.trade.transactions.list.useQuery(undefined, { enabled: isAuthenticated });

  const [offeringBusinessId, setOfferingBusinessId] = useState("");
  const [offeringType, setOfferingType] = useState<TradeObjectType>("product");
  const [offeringTitle, setOfferingTitle] = useState("");
  const [offeringCategory, setOfferingCategory] = useState("");
  const [offeringDescription, setOfferingDescription] = useState("{}");
  const [demandBusinessId, setDemandBusinessId] = useState("");
  const [demandType, setDemandType] = useState<TradeObjectType>("product");
  const [demandTitle, setDemandTitle] = useState("");
  const [demandRequirements, setDemandRequirements] = useState("{}");
  const [matchDemandId, setMatchDemandId] = useState("");
  const [matchOfferingId, setMatchOfferingId] = useState("");
  const [selectedRfqId, setSelectedRfqId] = useState("");
  const [rfqQuantity, setRfqQuantity] = useState("1");
  const [quoteQuantity, setQuoteQuantity] = useState("1");
  const [quoteUnitPriceMinor, setQuoteUnitPriceMinor] = useState("1000");
  const [quoteLeadTimeDays, setQuoteLeadTimeDays] = useState("7");
  const [quoteTerms, setQuoteTerms] = useState('{"warranty":"standard"}');
  const [rfqUnit, setRfqUnit] = useState("unit");
  const [rfqDeliveryTerms, setRfqDeliveryTerms] = useState('{"incoterm":"EXW","location":"Egypt"}');
  const [rfqPaymentTerms, setRfqPaymentTerms] = useState('{"method":"bank_transfer","due":"after_acceptance"}');
  const [selectedTransactionId, setSelectedTransactionId] = useState("");
  const [selectedJobId, setSelectedJobId] = useState("");
  const [selectedDeliveryId, setSelectedDeliveryId] = useState("");
  const [providerBusinessId, setProviderBusinessId] = useState("");
  const [pickupLocation, setPickupLocation] = useState('{"city":"Cairo"}');
  const [deliveryLocation, setDeliveryLocation] = useState('{"city":"Giza"}');
  const [deliveryProof, setDeliveryProof] = useState("");
  const [disputeReason, setDisputeReason] = useState("");

  const verifiedBusinesses = useMemo(
    () => (businessesQuery.data ?? []).filter(isVerifiedBusiness),
    [businessesQuery.data],
  );

  const refresh = async () => {
    await Promise.all([
      utils.trade.offerings.list.invalidate(),
      utils.trade.demands.list.invalidate(),
      utils.trade.matches.list.invalidate(),
      utils.trade.transactions.rfqs.invalidate(),
      utils.trade.transactions.quotations.invalidate(),
      utils.trade.transactions.list.invalidate(),
    ]);
  };

  const createOffering = trpc.trade.offerings.create.useMutation({
    onSuccess: async () => {
      await refresh();
      setOfferingTitle("");
      setOfferingCategory("");
      setOfferingDescription("{}");
      toast.success("تم تسجيل العرض وإحالته للتحقق المستقل.");
    },
    onError: error => toast.error(error.message || "تعذر تسجيل العرض التجاري."),
  });

  const createDemand = trpc.trade.demands.create.useMutation({
    onSuccess: async () => {
      await refresh();
      setDemandTitle("");
      setDemandRequirements("{}");
      toast.success("تم نشر طلب الاحتياج في المسار التشغيلي.");
    },
    onError: error => toast.error(error.message || "تعذر نشر طلب الاحتياج."),
  });

  const evaluateMatch = trpc.trade.matches.evaluate.useMutation({
    onSuccess: async result => {
      await refresh();
      toast.success(result.status === "eligible" ? "المطابقة مؤهلة ضمن بوابات الثقة." : "سُجلت المطابقة كغير مؤهلة مع سبب قابل للتدقيق.");
    },
    onError: error => toast.error(error.message || "تعذر تقييم المطابقة."),
  });

  const openRfq = trpc.trade.transactions.openRfq.useMutation({
    onSuccess: async result => { await refresh(); setSelectedRfqId(String(result.id)); toast.success("فُتح طلب عرض سعر بعد اجتياز بوابات المطابقة."); },
    onError: error => toast.error(error.message || "تعذر فتح طلب عرض السعر."),
  });
  const submitQuotation = trpc.trade.transactions.submitQuotation.useMutation({
    onSuccess: async () => { await refresh(); toast.success("تم تقديم الاقتباس وسُجل في سجل التدقيق."); },
    onError: error => toast.error(error.message || "تعذر تقديم الاقتباس."),
  });
  const acceptQuotation = trpc.trade.transactions.acceptQuotation.useMutation({
    onSuccess: async result => { await refresh(); setSelectedTransactionId(String(result.id)); toast.success("تم قبول الاقتباس وإنشاء المعاملة."); },
    onError: error => toast.error(error.message || "تعذر قبول الاقتباس."),
  });
  const updatePayment = trpc.trade.transactions.updatePayment.useMutation({
    onSuccess: async () => { await refresh(); toast.success("تم تحديث حالة الدفع خارجياً مع تسجيل الدليل."); },
    onError: error => toast.error(error.message || "تعذر تحديث الدفع."),
  });
  const assignTransport = trpc.trade.transactions.assignTransport.useMutation({
    onSuccess: async result => { await refresh(); setSelectedJobId(String(result.id)); toast.success("تم تعيين الناقل بصفته حائزاً لا مالكاً."); },
    onError: error => toast.error(error.message || "تعذر تعيين النقل."),
  });
  const advanceTransport = trpc.trade.transactions.advanceTransport.useMutation({
    onSuccess: async () => { await refresh(); toast.success("تم تحديث حالة النقل."); },
    onError: error => toast.error(error.message || "تعذر تحديث النقل."),
  });
  const recordDelivery = trpc.trade.transactions.recordDelivery.useMutation({
    onSuccess: async result => { await refresh(); setSelectedDeliveryId(String(result.deliveryId)); toast.success(`تم تسجيل التسليم رقم ${result.deliveryId} مع مرجع إثبات.`); },
    onError: error => toast.error(error.message || "تعذر تسجيل التسليم."),
  });
  const receiveDelivery = trpc.trade.transactions.receiveDelivery.useMutation({
    onSuccess: async () => { await refresh(); toast.success("تم تسجيل استلام التسليم."); },
    onError: error => toast.error(error.message || "تعذر تسجيل الاستلام."),
  });
  const closeTransaction = trpc.trade.transactions.close.useMutation({
    onSuccess: async () => { await refresh(); toast.success("أُغلقت المعاملة بعد الاستلام."); },
    onError: error => toast.error(error.message || "تعذر إغلاق المعاملة."),
  });
  const disputeTransaction = trpc.trade.transactions.dispute.useMutation({
    onSuccess: async () => { await refresh(); setDisputeReason(""); toast.success("فُتح النزاع وسُجل في سجل التدقيق."); },
    onError: error => toast.error(error.message || "تعذر فتح النزاع."),
  });

  if (loading) {
    return <div className="flex min-h-64 items-center justify-center text-slate-500"><Loader2 className="ml-2 h-5 w-5 animate-spin" /> جارٍ التحقق من الجلسة…</div>;
  }

  if (!isAuthenticated) {
    return (
      <Card className="border-indigo-100 bg-indigo-50/40">
        <CardHeader><CardTitle className="flex items-center gap-2 text-slate-900"><Handshake className="h-5 w-5 text-indigo-700" /> بوابة التجارة التشغيلية</CardTitle><CardDescription>سجّل الدخول لإدارة عروضك وطلباتك داخل مسار B2B المحكوم بالثقة.</CardDescription></CardHeader>
        <CardContent><Button onClick={startLogin} className="bg-indigo-700 hover:bg-indigo-800">تسجيل الدخول للمتابعة</Button></CardContent>
      </Card>
    );
  }

  const isLoading = businessesQuery.isLoading || offeringsQuery.isLoading || demandsQuery.isLoading || matchesQuery.isLoading;
  const queryError = businessesQuery.error || offeringsQuery.error || demandsQuery.error || matchesQuery.error;

  return (
    <section dir="rtl" className="space-y-6">
      <Card className="overflow-hidden border-indigo-100 bg-gradient-to-l from-indigo-950 via-indigo-900 to-slate-950 text-white shadow-xl shadow-indigo-950/10">
        <CardContent className="grid gap-5 p-6 lg:grid-cols-[1fr_auto] lg:items-center">
          <div><div className="mb-3 flex items-center gap-2 text-indigo-200"><Boxes className="h-5 w-5" /><span className="text-xs font-bold tracking-[0.16em]">TRADE OPERATIONS · FOUNDATION</span></div><h2 className="text-2xl font-black">عروض، احتياج، ومطابقة تحت بوابات الثقة</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-indigo-100">النطاق التشغيلي الحالي يدعم B2B فقط: KYC متحقق ثم KYB متحقق ثم عضوية نشطة، ثم تحقق مستقل للعرض قبل اعتباره مؤهلاً. لا ينشئ هذا القسم عقداً أو طلب تنفيذ أو معاملة مالية.</p></div>
          <Badge variant="outline" className="w-fit border-indigo-300/40 bg-white/10 px-3 py-1.5 text-indigo-100">Healthcare معزول تماماً</Badge>
        </CardContent>
      </Card>

      {queryError ? <Card className="border-rose-200 bg-rose-50"><CardContent className="flex items-center gap-2 p-4 text-sm text-rose-800"><CircleAlert className="h-4 w-4" />{queryError.message || "تعذر تحميل بيانات التجارة التشغيلية."}</CardContent></Card> : null}
      {isLoading ? <div className="flex min-h-40 items-center justify-center text-slate-500"><Loader2 className="ml-2 h-5 w-5 animate-spin" /> جارٍ تحميل المسار التشغيلي…</div> : null}

      {!isLoading && verifiedBusinesses.length === 0 ? <Card className="border-amber-200 bg-amber-50"><CardContent className="flex gap-3 p-5 text-sm text-amber-900"><CircleAlert className="mt-0.5 h-5 w-5 shrink-0" /><p>لا توجد جهة تجارية مؤهلة بعد. يلزم إتمام KYC ثم KYB وتفعيل العضوية قبل تسجيل عرض أو طلب احتياج.</p></CardContent></Card> : null}

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="border-slate-200"><CardHeader><CardTitle className="flex items-center gap-2 text-lg"><PackagePlus className="h-5 w-5 text-indigo-700" /> تسجيل عرض</CardTitle><CardDescription>يسجل العرض بحالة «قيد التحقق» ولا يشارك في المطابقة المؤهلة قبل اعتماده.</CardDescription></CardHeader><CardContent className="space-y-4">
          <div className="space-y-2"><Label>الجهة التجارية المؤهلة</Label><select value={offeringBusinessId} onChange={e => setOfferingBusinessId(e.target.value)} className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"><option value="">اختر جهة متحققة</option>{verifiedBusinesses.map(business => <option key={business.id} value={business.id}>{business.legalName}</option>)}</select></div>
          <div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label>نوع العرض</Label><select value={offeringType} onChange={e => setOfferingType(e.target.value as TradeObjectType)} className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm">{Object.entries(typeLabel).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div><div className="space-y-2"><Label>رمز الفئة</Label><Input value={offeringCategory} onChange={e => setOfferingCategory(e.target.value)} placeholder="اختياري" /></div></div>
          <div className="space-y-2"><Label>عنوان العرض</Label><Input value={offeringTitle} onChange={e => setOfferingTitle(e.target.value)} placeholder="وصف موجز وغير حساس" /></div>
          <div className="space-y-2"><Label>وصف منظم (JSON)</Label><textarea value={offeringDescription} onChange={e => setOfferingDescription(e.target.value)} className="min-h-20 w-full rounded-md border border-slate-200 p-3 font-mono text-xs" /></div>
          <Button disabled={!offeringBusinessId || !offeringTitle.trim() || createOffering.isPending} onClick={() => createOffering.mutate({ businessId: Number(offeringBusinessId), offeringType, title: offeringTitle, categoryCode: offeringCategory || undefined, descriptionJson: offeringDescription })} className="w-full bg-indigo-700 hover:bg-indigo-800">{createOffering.isPending ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : null}تسجيل العرض</Button>
        </CardContent></Card>

        <Card className="border-slate-200"><CardHeader><CardTitle className="flex items-center gap-2 text-lg"><SearchCheck className="h-5 w-5 text-emerald-700" /> نشر طلب احتياج</CardTitle><CardDescription>يسجل الطلب باسم جهة B2B متحققة ويفتحه لتقييم أهلية المطابقة.</CardDescription></CardHeader><CardContent className="space-y-4">
          <div className="space-y-2"><Label>الجهة الطالبة المؤهلة</Label><select value={demandBusinessId} onChange={e => setDemandBusinessId(e.target.value)} className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"><option value="">اختر جهة متحققة</option>{verifiedBusinesses.map(business => <option key={business.id} value={business.id}>{business.legalName}</option>)}</select></div>
          <div className="space-y-2"><Label>نوع الاحتياج</Label><select value={demandType} onChange={e => setDemandType(e.target.value as TradeObjectType)} className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm">{Object.entries(typeLabel).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>
          <div className="space-y-2"><Label>عنوان الطلب</Label><Input value={demandTitle} onChange={e => setDemandTitle(e.target.value)} placeholder="وصف موجز وغير حساس" /></div>
          <div className="space-y-2"><Label>متطلبات منظمة (JSON)</Label><textarea value={demandRequirements} onChange={e => setDemandRequirements(e.target.value)} className="min-h-20 w-full rounded-md border border-slate-200 p-3 font-mono text-xs" /></div>
          <Button disabled={!demandBusinessId || !demandTitle.trim() || createDemand.isPending} onClick={() => createDemand.mutate({ businessId: Number(demandBusinessId), demandType, title: demandTitle, requirementsJson: demandRequirements })} className="w-full bg-emerald-700 hover:bg-emerald-800">{createDemand.isPending ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : null}نشر طلب الاحتياج</Button>
        </CardContent></Card>
      </div>

      <Card className="border-slate-200"><CardHeader><CardTitle className="flex items-center gap-2 text-lg"><Handshake className="h-5 w-5 text-violet-700" /> تقييم مطابقة B2B</CardTitle><CardDescription>التقييم حتمي وقابل للتدقيق: يمنع المطابقة الذاتية، ويشترط تطابق النوع وKYB للجهة المالكة والتحقق المستقل ونشر العرض.</CardDescription></CardHeader><CardContent className="grid gap-4 lg:grid-cols-[1fr_1fr_auto] lg:items-end"><div className="space-y-2"><Label>طلب الاحتياج</Label><select value={matchDemandId} onChange={e => setMatchDemandId(e.target.value)} className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"><option value="">اختر طلباً</option>{(demandsQuery.data ?? []).map(demand => <option key={demand.id} value={demand.id}>{demand.title} · {typeLabel[demand.demandType]}</option>)}</select></div><div className="space-y-2"><Label>عرض مسجل</Label><select value={matchOfferingId} onChange={e => setMatchOfferingId(e.target.value)} className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"><option value="">اختر عرضاً</option>{(offeringsQuery.data ?? []).map(offering => <option key={offering.id} value={offering.id}>{offering.title} · {typeLabel[offering.offeringType]}</option>)}</select></div><Button disabled={!matchDemandId || !matchOfferingId || evaluateMatch.isPending} onClick={() => evaluateMatch.mutate({ demandId: Number(matchDemandId), offeringId: Number(matchOfferingId) })} className="bg-violet-700 hover:bg-violet-800">{evaluateMatch.isPending ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : null}تقييم الأهلية</Button></CardContent></Card>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card><CardHeader><CardTitle className="text-base">عروضي</CardTitle></CardHeader><CardContent className="space-y-3">{(offeringsQuery.data ?? []).length === 0 ? <p className="text-sm text-slate-500">لا توجد عروض مسجلة بعد.</p> : (offeringsQuery.data ?? []).map(item => <div key={item.id} className="rounded-lg border border-slate-100 p-3"><p className="font-semibold text-slate-900">{item.title}</p><p className="mt-1 text-xs text-slate-500">{item.businessName} · {typeLabel[item.offeringType]}</p><Badge variant="outline" className={`mt-2 ${verificationStyle[item.verificationStatus] ?? verificationStyle.draft}`}>{item.verificationStatus}</Badge></div>)}</CardContent></Card>
        <Card><CardHeader><CardTitle className="text-base">طلبات الاحتياج</CardTitle></CardHeader><CardContent className="space-y-3">{(demandsQuery.data ?? []).length === 0 ? <p className="text-sm text-slate-500">لا توجد طلبات منشورة بعد.</p> : (demandsQuery.data ?? []).map(item => <div key={item.id} className="rounded-lg border border-slate-100 p-3"><p className="font-semibold text-slate-900">{item.title}</p><p className="mt-1 text-xs text-slate-500">{item.businessName} · {typeLabel[item.demandType]}</p><Badge variant="outline" className="mt-2 border-blue-200 bg-blue-50 text-blue-700">{item.status}</Badge></div>)}</CardContent></Card>
        <Card><CardHeader><CardTitle className="text-base">نتائج المطابقة</CardTitle></CardHeader><CardContent className="space-y-3">{(matchesQuery.data ?? []).length === 0 ? <p className="text-sm text-slate-500">لا توجد نتائج بعد.</p> : (matchesQuery.data ?? []).map(item => <div key={item.id} className="rounded-lg border border-slate-100 p-3"><div className="flex items-start justify-between gap-2"><p className="font-semibold text-slate-900">{item.demandTitle}</p><Badge variant="outline" className={matchStyle[item.status] ?? matchStyle.candidate}>{item.status}</Badge></div><p className="mt-1 text-xs text-slate-500">↔ {item.offeringTitle} · {item.score}%</p><p className="mt-2 break-words text-[11px] text-slate-600">{item.decisionReason}</p></div>)}</CardContent></Card>
      </div>

      <Card className="border-indigo-200 bg-indigo-50/40 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl"><ClipboardList className="h-5 w-5 text-indigo-700" /> دورة الصفقة المكتملة</CardTitle>
          <CardDescription>مسار تشغيلي قابل للإثبات يبدأ من Match ثم RFQ وQuotation، وينتهي بالمعاملة والدفع والنقل والتسليم والاستلام والإغلاق. كل خطوة محكومة بملكية الطرف وصلاحياته وتُسجل في التدقيق.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-2 md:grid-cols-9">
            {[
              ["01", "Match"], ["02", "RFQ"], ["03", "Quotation"], ["04", "Accept"], ["05", "Pay"], ["06", "Transport"], ["07", "Deliver"], ["08", "Receive"], ["09", "Close"],
            ].map(([step, label], index) => <div key={step} className="flex items-center gap-2 rounded-lg border border-white bg-white p-2 text-xs shadow-sm"><span className="font-mono font-bold text-indigo-700">{step}</span><span className="font-semibold text-slate-700">{label}</span>{index < 8 ? <span className="hidden text-slate-300 md:inline">←</span> : null}</div>)}
          </div>

          <div className="grid gap-5 xl:grid-cols-2">
            <Card className="border-white bg-white"><CardHeader><CardTitle className="text-base">فتح RFQ من مطابقة مؤهلة</CardTitle><CardDescription>لا يمكن فتح طلب عرض سعر إلا من Match بحالة eligible وبعد اجتياز بوابات الهوية والنشاط.</CardDescription></CardHeader><CardContent className="space-y-3">
              <select value={matchDemandId && matchOfferingId ? `${matchDemandId}:${matchOfferingId}` : ""} onChange={e => { const [demandId, offeringId] = e.target.value.split(":"); setMatchDemandId(demandId ?? ""); setMatchOfferingId(offeringId ?? ""); }} className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"><option value="">اختر المطابقة من القائمتين أدناه</option>{(matchesQuery.data ?? []).filter(item => item.status === "eligible").map(item => <option key={item.id} value={`${item.demandId}:${item.offeringId}`}>{item.demandTitle} ← {item.offeringTitle}</option>)}</select>
              <div className="grid gap-3 sm:grid-cols-3"><Input type="number" min="1" value={rfqQuantity} onChange={e => setRfqQuantity(e.target.value)} placeholder="الكمية" /><Input value={rfqUnit} onChange={e => setRfqUnit(e.target.value)} placeholder="الوحدة" /><Input value={rfqDeliveryTerms} onChange={e => setRfqDeliveryTerms(e.target.value)} placeholder="شروط التسليم JSON" /></div>
              <Input value={rfqPaymentTerms} onChange={e => setRfqPaymentTerms(e.target.value)} placeholder="شروط الدفع JSON" />
              <Button disabled={!matchDemandId || !matchOfferingId || openRfq.isPending} onClick={() => { const match = (matchesQuery.data ?? []).find(item => item.demandId === Number(matchDemandId) && item.offeringId === Number(matchOfferingId)); if (!match) return toast.error("اختر مطابقة مؤهلة أولاً"); openRfq.mutate({ matchId: match.id, requestedQuantity: Number(rfqQuantity), quantityUnit: rfqUnit, deliveryTermsJson: rfqDeliveryTerms, paymentTermsJson: rfqPaymentTerms }); }} className="w-full bg-indigo-700 hover:bg-indigo-800">فتح RFQ</Button>
            </CardContent></Card>

            <Card className="border-white bg-white"><CardHeader><CardTitle className="text-base">تقديم اقتباس ثم قبوله</CardTitle><CardDescription>يظهر الاقتباس للمورد وصاحب RFQ. القبول وحده ينشئ سجل المعاملة، وليس مجرد إنشاء الحساب أو المطابقة.</CardDescription></CardHeader><CardContent className="space-y-3">
              <select value={selectedRfqId} onChange={e => setSelectedRfqId(e.target.value)} className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"><option value="">اختر RFQ</option>{(rfqsQuery.data ?? []).map(item => <option key={item.id} value={item.id}>RFQ #{item.id} · {item.status} · {item.requestedQuantity} {item.quantityUnit}</option>)}</select>
              <div className="grid gap-3 sm:grid-cols-3"><Input type="number" min="1" value={quoteQuantity} onChange={e => setQuoteQuantity(e.target.value)} placeholder="الكمية" /><Input type="number" min="0" value={quoteUnitPriceMinor} onChange={e => setQuoteUnitPriceMinor(e.target.value)} placeholder="سعر الوحدة" /><Input type="number" min="0" value={quoteLeadTimeDays} onChange={e => setQuoteLeadTimeDays(e.target.value)} placeholder="أيام التنفيذ" /></div>
              <Input value={quoteTerms} onChange={e => setQuoteTerms(e.target.value)} placeholder="شروط الاقتباس JSON" />
              <Button disabled={!selectedRfqId || submitQuotation.isPending} onClick={() => submitQuotation.mutate({ rfqId: Number(selectedRfqId), quantity: Number(quoteQuantity), unitPriceMinor: Number(quoteUnitPriceMinor), leadTimeDays: Number(quoteLeadTimeDays), termsJson: quoteTerms })} className="w-full bg-emerald-700 hover:bg-emerald-800">تقديم اقتباس</Button>
              <div className="space-y-2">{(quotationsQuery.data ?? []).map(item => <div key={item.quotation.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-100 p-3 text-xs"><span>Quotation #{item.quotation.id} · RFQ #{item.quotation.rfqId} · {item.quotation.unitPriceMinor} {item.quotation.currencyCode}</span><Button size="sm" disabled={item.quotation.status !== "submitted" || acceptQuotation.isPending} onClick={() => acceptQuotation.mutate({ quotationId: item.quotation.id })}>قبول الاقتباس</Button></div>)}</div>
            </CardContent></Card>
          </div>

          <Card className="border-white bg-white"><CardHeader><CardTitle className="flex items-center gap-2 text-base"><CircleDollarSign className="h-4 w-4 text-amber-700" /> تشغيل المعاملة: دفع، نقل، تسليم، استلام وإغلاق</CardTitle><CardDescription>المدفوعات هنا تسجيل لحالة خارجية وليست بوابة دفع؛ أما الناقل فهو Custodian ولا تنتقل إليه الملكية.</CardDescription></CardHeader><CardContent className="space-y-4">
            <select value={selectedTransactionId} onChange={e => setSelectedTransactionId(e.target.value)} className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"><option value="">اختر معاملة</option>{(transactionsQuery.data ?? []).map(item => <option key={item.id} value={item.id}>Transaction #{item.id} · {item.status} · payment={item.paymentStatus}</option>)}</select>
            <div className="grid gap-3 lg:grid-cols-3"><Button disabled={!selectedTransactionId || updatePayment.isPending} onClick={() => updatePayment.mutate({ transactionId: Number(selectedTransactionId), paymentStatus: "external_recorded" })}>تسجيل الدفع خارجياً</Button><Button disabled={!selectedTransactionId || updatePayment.isPending} onClick={() => updatePayment.mutate({ transactionId: Number(selectedTransactionId), paymentStatus: "settled" })}>تأكيد التسوية</Button><Button variant="outline" disabled={!selectedTransactionId || closeTransaction.isPending} onClick={() => closeTransaction.mutate({ transactionId: Number(selectedTransactionId) })}>إغلاق بعد الاستلام</Button></div>
            <div className="grid gap-3 lg:grid-cols-2"><div className="space-y-3 rounded-lg border border-slate-100 p-4"><p className="flex items-center gap-2 font-semibold text-slate-800"><Truck className="h-4 w-4 text-indigo-700" /> تعيين النقل وتحديث الرحلة</p><select value={providerBusinessId} onChange={e => setProviderBusinessId(e.target.value)} className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"><option value="">اختر ناقلاً متحققاً</option>{verifiedBusinesses.map(business => <option key={business.id} value={business.id}>{business.legalName}</option>)}</select><div className="grid gap-2 sm:grid-cols-2"><Input value={pickupLocation} onChange={e => setPickupLocation(e.target.value)} placeholder="موقع الاستلام JSON" /><Input value={deliveryLocation} onChange={e => setDeliveryLocation(e.target.value)} placeholder="موقع التسليم JSON" /></div><Button disabled={!selectedTransactionId || !providerBusinessId || assignTransport.isPending} onClick={() => assignTransport.mutate({ transactionId: Number(selectedTransactionId), providerBusinessId: Number(providerBusinessId), pickupLocationJson: pickupLocation, deliveryLocationJson: deliveryLocation, driverReference: "driver-reference", vehicleReference: "vehicle-reference" })} className="w-full bg-indigo-700 hover:bg-indigo-800">تعيين ناقل</Button><div className="flex gap-2"><Input value={selectedJobId} onChange={e => setSelectedJobId(e.target.value)} placeholder="Job ID" /><Button disabled={!selectedJobId} onClick={() => advanceTransport.mutate({ jobId: Number(selectedJobId), status: "picked_up" })}>Picked up</Button><Button disabled={!selectedJobId} onClick={() => advanceTransport.mutate({ jobId: Number(selectedJobId), status: "in_transit" })}>In transit</Button></div></div>
              <div className="space-y-3 rounded-lg border border-slate-100 p-4"><p className="font-semibold text-slate-800">التسليم والاستلام والأدلة</p><div className="grid gap-2 sm:grid-cols-3"><Input value={selectedJobId} onChange={e => setSelectedJobId(e.target.value)} placeholder="Job ID" /><Input type="number" min="1" defaultValue="1" id="delivered-quantity" placeholder="الكمية" /><Input value={deliveryProof} onChange={e => setDeliveryProof(e.target.value)} placeholder="مرجع إثبات التسليم" /></div><Button disabled={!selectedTransactionId || !selectedJobId || deliveryProof.trim().length < 2 || recordDelivery.isPending} onClick={() => { const quantity = Number((document.getElementById("delivered-quantity") as HTMLInputElement)?.value || 1); recordDelivery.mutate({ transactionId: Number(selectedTransactionId), transportJobId: Number(selectedJobId), deliveredQuantity: quantity, proofReference: deliveryProof }); }} className="w-full bg-emerald-700 hover:bg-emerald-800">تسجيل التسليم</Button><div className="flex gap-2"><Input value={selectedDeliveryId} onChange={e => setSelectedDeliveryId(e.target.value)} placeholder="Delivery ID" /><Button disabled={!selectedDeliveryId || receiveDelivery.isPending} onClick={() => receiveDelivery.mutate({ deliveryId: Number(selectedDeliveryId), acceptanceStatus: "accepted_full" })}>تأكيد الاستلام</Button></div></div></div>
            <div className="flex flex-col gap-2 rounded-lg border border-rose-100 bg-rose-50 p-4 sm:flex-row"><Input value={disputeReason} onChange={e => setDisputeReason(e.target.value)} placeholder="سبب النزاع، إن وجد" /><Button variant="outline" disabled={!selectedTransactionId || disputeReason.trim().length < 5 || disputeTransaction.isPending} onClick={() => disputeTransaction.mutate({ transactionId: Number(selectedTransactionId), reason: disputeReason })}><Gavel className="ml-2 h-4 w-4" />فتح نزاع</Button></div>
          </CardContent></Card>
        </CardContent>
      </Card>

      <div className="flex gap-2 rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs leading-5 text-slate-600"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />تُسجّل كل خطوة حساسة في مسار تدقيق التطبيق. لا تستخدم هذه الشاشة بيانات عملاء حقيقية أو بيانات سريرية، ولا تعتبر تسجيل الدفع تكاملاً مصرفياً أو تسوية مالية.</div>
    </section>
  );
}
