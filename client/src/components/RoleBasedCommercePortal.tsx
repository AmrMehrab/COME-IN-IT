import { useMemo, useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Building2, PackageSearch, Send, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

function formatMoney(minor: number) {
  return new Intl.NumberFormat("ar-EG", { style: "currency", currency: "EGP" }).format(minor / 100);
}

function hasOrderableTerms<T extends { unitPriceMinor: number | null; moq: number | null; quantityUnit: string | null }>(
  offering: T,
): offering is T & { unitPriceMinor: number; moq: number; quantityUnit: string } {
  return offering.unitPriceMinor !== null && offering.moq !== null && offering.quantityUnit !== null;
}

export function RoleBasedCommercePortal() {
  const { user } = useAuth();
  const trpcUtils = trpc.useUtils();
  const ordersQuery = trpc.commerceOrders.list.useQuery(undefined, { enabled: Boolean(user) });
  const catalogQuery = trpc.commerceOrders.catalog.useQuery(undefined, { enabled: Boolean(user) });
  const businessesQuery = trpc.businesses.list.useQuery(undefined, { enabled: Boolean(user) });
  const kycQuery = trpc.verification.kyc.me.useQuery(undefined, { enabled: Boolean(user) });
  const [buyerBusinessId, setBuyerBusinessId] = useState<number | null>(null);
  const [selectedOfferingId, setSelectedOfferingId] = useState<number | null>(null);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [message, setMessage] = useState("");

  const kycVerified = kycQuery.data?.lifecycleStatus === "verified";
  const catalog = (catalogQuery.data ?? []).filter(hasOrderableTerms);
  const selectedOffering = catalog.find(offering => offering.offeringId === selectedOfferingId);
  const categories = useMemo(
    () => Array.from(new Set(catalog.map(offering => offering.category || "غير مصنف"))).sort((a, b) => a.localeCompare(b, "ar")),
    [catalog],
  );
  const filteredCatalog = useMemo(() => catalog.filter(offering => {
    const matchesCategory = categoryFilter === "all" || (offering.category || "غير مصنف") === categoryFilter;
    const searchText = `${offering.productName} ${offering.partnerName} ${offering.category ?? ""}`.toLowerCase();
    return matchesCategory && searchText.includes(query.trim().toLowerCase());
  }), [catalog, categoryFilter, query]);
  const buyerBusinesses = (businessesQuery.data ?? []).filter(business =>
    business.membershipStatus === "active" &&
    business.verificationStatus === "verified" &&
    business.entityType !== "government_entity",
  );

  const createOrderMutation = trpc.commerceOrders.create.useMutation({
    onSuccess: async () => {
      await trpcUtils.commerceOrders.list.invalidate();
      toast.success("تم حفظ أمر الشراء في قاعدة البيانات وسجل التدقيق.");
      setMessage("");
    },
    onError: error => toast.error(error.message || "تعذر حفظ أمر الشراء."),
  });

  const submitOrder = () => {
    const parsedQuantity = Number(quantity);
    if (!user) {
      toast.error("سجّل الدخول أولاً.");
      return;
    }
    if (!kycVerified) {
      toast.error("يتطلب الوصول التجاري حالة KYC معتمدة.");
      return;
    }
    if (!buyerBusinessId || !buyerBusinesses.some(business => business.id === buyerBusinessId)) {
      toast.error("اختر منشأة موثقة مرتبطة بحسابك؛ ويتحقق الخادم من الصلاحية النهائية.");
      return;
    }
    if (!selectedOffering || !Number.isInteger(parsedQuantity) || parsedQuantity < selectedOffering.moq || message.trim().length < 5) {
      toast.error("اختر عرضاً صالحاً، وكمية لا تقل عن MOQ، واكتب رسالة من خمسة أحرف على الأقل.");
      return;
    }
    createOrderMutation.mutate({
      buyerBusinessId,
      offeringId: selectedOffering.offeringId,
      quantity: parsedQuantity,
      message: message.trim(),
    });
  };

  const kycLabel = !user
    ? "يتطلب تسجيل الدخول"
    : kycQuery.isLoading
      ? "جارٍ تحميل حالة KYC"
      : kycVerified
        ? "KYC معتمد"
        : `KYC: ${kycQuery.data?.lifecycleStatus ?? "غير متحقق"}`;

  return (
    <section dir="rtl" className="space-y-6">
      <Card className="overflow-hidden border-slate-900 bg-gradient-to-l from-slate-950 via-indigo-950 to-teal-950 text-white shadow-2xl">
        <CardContent className="flex flex-col gap-5 p-6 md:flex-row md:items-end md:justify-between md:p-8">
          <div>
            <div className="mb-3 flex flex-wrap gap-2">
              <Badge className="border border-cyan-300/30 bg-cyan-400/10 text-cyan-100">كتالوج خادمي · B2B</Badge>
              <Badge variant="outline" className="border-amber-300/30 text-amber-100">التحقق النهائي على الخادم</Badge>
            </div>
            <h2 className="text-2xl font-black md:text-3xl">بوابة التجارة للمنشآت</h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300">
              العروض والأسعار والحد الأدنى للطلب تأتي من سجلات الخادم المنشورة والمتحققة. عرض السعر لا ينشئ عقداً أو التزاماً مالياً.
            </p>
          </div>
          <div className="min-w-56 rounded-2xl border border-cyan-300/20 bg-cyan-400/10 p-4 text-sm">
            <p className="text-cyan-100">حالة الهوية الشخصية</p>
            <p className="mt-1 font-bold">{kycLabel}</p>
          </div>
        </CardContent>
      </Card>

      {!user && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-5 text-sm leading-7 text-amber-950">سجّل الدخول لعرض حالة التحقق والكتالوج التجاري وقوائم المنشآت المرتبطة بحسابك.</CardContent>
        </Card>
      )}
      {user && !kycVerified && !kycQuery.isLoading && (
        <Card className="border-rose-200 bg-rose-50">
          <CardContent className="p-5 text-sm leading-7 text-rose-950">الكتالوج وإنشاء أوامر الشراء مغلقان حتى اعتماد KYC. لا تعتبر هذه الواجهة بديلاً عن قرار الخادم.</CardContent>
        </Card>
      )}
      {catalogQuery.isError && (
        <Card className="border-rose-200 bg-rose-50">
          <CardContent className="p-5 text-sm text-rose-900">تعذر تحميل الكتالوج التجاري من الخادم.</CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          <Card className="border-slate-200">
            <CardContent className="grid gap-3 p-4 md:grid-cols-[1fr_220px]">
              <div className="space-y-2"><Label htmlFor="catalog-search">البحث في العروض المنشورة</Label><Input id="catalog-search" value={query} onChange={event => setQuery(event.target.value)} placeholder="اسم المنتج أو المنشأة أو الفئة" /></div>
              <div className="space-y-2"><Label htmlFor="catalog-category">الفئة</Label><select id="catalog-category" value={categoryFilter} onChange={event => setCategoryFilter(event.target.value)} className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"><option value="all">كل الفئات</option>{categories.map(category => <option key={category} value={category}>{category}</option>)}</select></div>
            </CardContent>
          </Card>

          {catalogQuery.isLoading && <Card><CardContent className="p-8 text-center text-sm text-slate-500">جارٍ تحميل العروض المتحققة…</CardContent></Card>}
          {user && kycVerified && !catalogQuery.isLoading && filteredCatalog.length === 0 && <Card><CardContent className="p-8 text-center text-sm leading-6 text-slate-600"><PackageSearch className="mx-auto mb-3 h-8 w-8 text-indigo-400" />لا توجد عروض منتجات منشورة ومتحققة مطابقة للبحث.</CardContent></Card>}
          {user && kycVerified && filteredCatalog.length > 0 && <div className="grid gap-3 md:grid-cols-2">{filteredCatalog.map(offering => {
            const active = selectedOfferingId === offering.offeringId;
            return <button key={offering.offeringId} type="button" onClick={() => {
              setSelectedOfferingId(offering.offeringId);
              setQuantity(String(offering.moq));
              setMessage(`أرغب في طلب ${offering.productName} بكمية ${offering.moq} ${offering.quantityUnit}. يرجى تأكيد السعر وشروط التسليم.`);
            }} className={`rounded-xl border bg-white p-4 text-right transition hover:border-indigo-400 hover:shadow-sm ${active ? "border-indigo-500 ring-2 ring-indigo-100" : "border-slate-200"}`}>
              <div className="flex items-start justify-between gap-3"><div><p className="font-bold text-slate-950">{offering.productName}</p><p className="mt-1 text-xs text-slate-500">{offering.partnerName} · {offering.category || "غير مصنف"}</p></div><Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">عرض متحقق</Badge></div>
              <div className="mt-4 grid grid-cols-2 gap-2 text-xs"><div className="rounded-lg bg-slate-50 p-3"><p className="text-slate-500">سعر الوحدة المسجل</p><p className="mt-1 font-bold text-slate-800">{formatMoney(offering.unitPriceMinor)}</p></div><div className="rounded-lg bg-slate-50 p-3"><p className="text-slate-500">الحد الأدنى للطلب</p><p className="mt-1 font-bold text-slate-800">{offering.moq.toLocaleString("ar-EG")} {offering.quantityUnit}</p></div></div>
            </button>;
          })}</div>}

          <Card className="border-slate-200">
            <CardHeader><CardTitle className="text-base text-slate-950">أوامر الشراء</CardTitle><CardDescription>تُعرض الأوامر التي يسمح الخادم لهذا المستخدم بقراءتها ضمن سياق المنشأة.</CardDescription></CardHeader>
            <CardContent className="space-y-2">{!user ? <p className="text-sm text-slate-500">سجّل الدخول لعرض الأوامر.</p> : ordersQuery.isLoading ? <p className="text-sm text-slate-500">جارٍ تحميل الأوامر…</p> : (ordersQuery.data ?? []).length === 0 ? <p className="text-sm text-slate-500">لا توجد أوامر شراء ظاهرة لهذا الحساب.</p> : (ordersQuery.data ?? []).map(order => <div key={order.id} className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 p-3 text-xs"><span className="font-semibold text-slate-800">{order.partnerName}</span><Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-800">{order.status}</Badge></div>)}</CardContent>
          </Card>
        </div>

        <Card className="h-fit border-indigo-200 bg-indigo-50/40">
          <CardHeader><CardTitle className="flex items-center gap-2 text-base text-slate-950"><ShoppingCart className="h-5 w-5 text-indigo-700" />إنشاء أمر شراء B2B</CardTitle><CardDescription>{selectedOffering ? `إلى: ${selectedOffering.partnerName}` : "اختر عرضاً من الكتالوج الخادمي"}</CardDescription></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2"><Label htmlFor="buyer-business">منشأة المشتري</Label><select id="buyer-business" value={buyerBusinessId ?? ""} onChange={event => setBuyerBusinessId(event.target.value ? Number(event.target.value) : null)} className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"><option value="">اختر منشأة مرتبطة بالحساب</option>{buyerBusinesses.map(business => <option key={business.id} value={business.id}>{business.tradeName || business.legalName}</option>)}</select><p className="text-xs leading-5 text-slate-500">تصفية القائمة لا تثبت صلاحية الشراء؛ الخادم يعيد التحقق من العضوية والمنحة والأهلية.</p></div>
            {!businessesQuery.isLoading && buyerBusinesses.length === 0 && <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-900">لا توجد منشأة موثقة ذات عضوية نشطة ظاهرة لهذا الحساب. لا يمكن إجراء شراء فردي أو حكومي.</p>}
            {selectedOffering && <div className="rounded-lg border border-indigo-100 bg-white p-3 text-xs"><p className="font-bold text-slate-900">{selectedOffering.productName}</p><p className="mt-1 text-slate-600">{formatMoney(selectedOffering.unitPriceMinor)} / {selectedOffering.quantityUnit} · MOQ {selectedOffering.moq}</p></div>}
            <div className="space-y-2"><Label htmlFor="order-quantity">الكمية</Label><Input id="order-quantity" type="number" min={selectedOffering?.moq ?? 1} value={quantity} onChange={event => setQuantity(event.target.value)} /></div>
            <div className="space-y-2"><Label htmlFor="order-message">رسالة الطلب</Label><textarea id="order-message" value={message} onChange={event => setMessage(event.target.value)} placeholder="أضف تفاصيل الطلب أو موعد التسليم المطلوب…" className="min-h-28 w-full rounded-md border border-slate-200 bg-white p-3 text-sm" /></div>
            <Button type="button" onClick={submitOrder} disabled={!user || !kycVerified || !buyerBusinessId || !selectedOffering || createOrderMutation.isPending} className="w-full bg-indigo-700 hover:bg-indigo-800"><Send className="ml-2 h-4 w-4" />{createOrderMutation.isPending ? "جارٍ الحفظ…" : "حفظ وإرسال أمر الشراء"}</Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-3 md:grid-cols-3"><div className="rounded-xl border border-indigo-200 bg-indigo-50 p-4 text-sm text-indigo-950"><Building2 className="mb-2 h-5 w-5 text-indigo-700" /><strong>شراء المنشآت</strong><p className="mt-1 text-xs leading-5">يتطلب KYC، وKYB، وعضوية نشطة، ومنحة صلاحية صريحة، وأهلية علاقة B2B. جميعها يعاد التحقق منها في الخادم.</p></div><div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-800"><strong>الشراء الفردي C2C</strong><p className="mt-1 text-xs leading-5">مغلق افتراضياً حتى اعتماد السياسة المناسبة.</p></div><div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-800"><strong>المشتريات الحكومية B2G</strong><p className="mt-1 text-xs leading-5">مرفوضة تشغيلياً؛ لا يوجد مسار اعتماد فعلي حالياً.</p></div></div>
    </section>
  );
}
