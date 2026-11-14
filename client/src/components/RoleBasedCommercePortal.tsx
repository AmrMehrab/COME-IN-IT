import { useMemo, useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Building2, CheckCircle2, Factory, Globe2, MessageSquare, PackageSearch, Send, ShoppingCart, Store, Truck, UserRoundCheck } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

type PortalRole = "consumer" | "merchant" | "supplier";
type PartnerKind = "store" | "factory" | "importer";
type Product = {
  id: string;
  partnerId: string;
  name: string;
  category: string;
  unit: string;
  price: number;
  moq: number;
  stock: number;
  leadTime: string;
  specs: string[];
};

type Partner = {
  id: string;
  name: string;
  kind: PartnerKind;
  city: string;
  country: string;
  categories: string[];
  rating: number;
  reviewCount: number;
  priceFrom: number;
  priceTo: number;
  moq: number;
  status: "verified" | "review";
  leadTime: string;
  specs: string[];
};

const partners: Partner[] = [
  { id: "store-cairo-01", name: "متجر النيل للأجهزة المنزلية", kind: "store", city: "القاهرة", country: "مصر", categories: ["أجهزة منزلية", "إلكترونيات"], rating: 4.8, reviewCount: 126, priceFrom: 850, priceTo: 4200, moq: 1, status: "verified", leadTime: "2–4 أيام", specs: ["ضمان سنة", "220V", "توريد محلي"] },
  { id: "store-alex-02", name: "متاجر الإسكندرية للتجزئة", kind: "store", city: "الإسكندرية", country: "مصر", categories: ["مواد غذائية", "تعبئة"], rating: 4.4, reviewCount: 89, priceFrom: 120, priceTo: 1800, moq: 5, status: "verified", leadTime: "3–5 أيام", specs: ["غذائي", "قابل لإعادة التدوير", "تعبئة 100 وحدة"] },
  { id: "factory-ain-01", name: "مصنع النيل للصناعات الهندسية", kind: "factory", city: "العين السخنة", country: "مصر", categories: ["مكونات صناعية", "قطع غيار"], rating: 4.9, reviewCount: 74, priceFrom: 4200, priceTo: 28000, moq: 50, status: "verified", leadTime: "10–14 يوماً", specs: ["فولاذ مقوى", "مطابقة صناعية", "فحص جودة"] },
  { id: "factory-10th-02", name: "مصنع العاشر للعبوات", kind: "factory", city: "العاشر من رمضان", country: "مصر", categories: ["عبوات", "بلاستيك"], rating: 4.6, reviewCount: 118, priceFrom: 650, priceTo: 9500, moq: 100, status: "verified", leadTime: "7–12 يوماً", specs: ["PET", "مقاس 500ml", "خط إنتاج آلي"] },
  { id: "importer-cairo-01", name: "شركة بوابة المتوسط للاستيراد", kind: "importer", city: "القاهرة", country: "مصر", categories: ["مواد خام", "معدات"], rating: 4.7, reviewCount: 61, priceFrom: 7500, priceTo: 65000, moq: 20, status: "verified", leadTime: "14–21 يوماً", specs: ["منشأ أوروبي", "شهادة مطابقة", "ضمان استيراد"] },
  { id: "importer-dubai-02", name: "Gulf Trade Gateway", kind: "importer", city: "دبي", country: "الإمارات", categories: ["إلكترونيات", "مستلزمات صناعية"], rating: 4.5, reviewCount: 203, priceFrom: 12000, priceTo: 90000, moq: 25, status: "verified", leadTime: "18–28 يوماً", specs: ["منشأ خليجي", "رقم تتبع", "شحن متعدد"] },
  { id: "factory-turkey-03", name: "Anatolia Manufacturing Hub", kind: "factory", city: "إسطنبول", country: "تركيا", categories: ["منسوجات", "مكونات صناعية"], rating: 4.2, reviewCount: 37, priceFrom: 1800, priceTo: 22000, moq: 200, status: "review", leadTime: "24–35 يوماً", specs: ["نسيج صناعي", "صبغة ثابتة", "تصدير مباشر"] },
];

const products: Product[] = [
  { id: "prod-001", partnerId: "store-cairo-01", name: "خلاط مطبخ احترافي 1200W", category: "أجهزة منزلية", unit: "قطعة", price: 1850, moq: 1, stock: 84, leadTime: "2–4 أيام", specs: ["ضمان سنة", "220V", "توريد محلي"] },
  { id: "prod-002", partnerId: "store-cairo-01", name: "شاشة ذكية 43 بوصة", category: "إلكترونيات", unit: "قطعة", price: 4200, moq: 1, stock: 32, leadTime: "2–4 أيام", specs: ["ضمان سنة", "220V", "توريد محلي"] },
  { id: "prod-003", partnerId: "store-alex-02", name: "عبوات غذائية PET — كرتونة", category: "تعبئة", unit: "كرتونة", price: 120, moq: 5, stock: 640, leadTime: "3–5 أيام", specs: ["غذائي", "قابل لإعادة التدوير", "تعبئة 100 وحدة"] },
  { id: "prod-004", partnerId: "factory-ain-01", name: "ترس صناعي فولاذي 12T", category: "قطع غيار", unit: "قطعة", price: 4200, moq: 50, stock: 900, leadTime: "10–14 يوماً", specs: ["فولاذ مقوى", "مطابقة صناعية", "فحص جودة"] },
  { id: "prod-005", partnerId: "factory-ain-01", name: "وحدة تحكم خط إنتاج", category: "مكونات صناعية", unit: "وحدة", price: 28000, moq: 50, stock: 120, leadTime: "10–14 يوماً", specs: ["فولاذ مقوى", "مطابقة صناعية", "فحص جودة"] },
  { id: "prod-006", partnerId: "factory-10th-02", name: "عبوة بلاستيكية 500ml", category: "عبوات", unit: "كرتونة", price: 650, moq: 100, stock: 4200, leadTime: "7–12 يوماً", specs: ["PET", "مقاس 500ml", "خط إنتاج آلي"] },
  { id: "prod-007", partnerId: "importer-cairo-01", name: "مضخة صناعية مستوردة", category: "معدات", unit: "قطعة", price: 7500, moq: 20, stock: 75, leadTime: "14–21 يوماً", specs: ["منشأ أوروبي", "شهادة مطابقة", "ضمان استيراد"] },
  { id: "prod-008", partnerId: "importer-dubai-02", name: "لوحات تحكم إلكترونية", category: "إلكترونيات", unit: "صندوق", price: 12000, moq: 25, stock: 210, leadTime: "18–28 يوماً", specs: ["منشأ خليجي", "رقم تتبع", "شحن متعدد"] },
  { id: "prod-009", partnerId: "factory-turkey-03", name: "لفة نسيج صناعي", category: "منسوجات", unit: "لفة", price: 1800, moq: 200, stock: 480, leadTime: "24–35 يوماً", specs: ["نسيج صناعي", "صبغة ثابتة", "تصدير مباشر"] },
];

const roleCopy: Record<PortalRole, { title: string; description: string; color: string; gate: string }> = {
  consumer: { title: "مشتري فردي بعد KYC", description: "اكتشف المتاجر المتحققة وأرسل أوامر شراء فردية مع تتبع حالة الطلب.", color: "teal", gate: "KYC Verified" },
  merchant: { title: "تاجر / متجر", description: "اكتشف المصانع والمستوردين داخل مصر وابدأ طلبات توريد موثقة.", color: "indigo", gate: "KYC + KYB + نشاط تجاري" },
  supplier: { title: "مصنع / مستورد", description: "اعرض احتياجاتك وتواصل مع شركاء داخل مصر وخارجها عبر مسار تجاري محكوم.", color: "violet", gate: "KYC + KYB + عضوية نشطة" },
};

const kindLabel: Record<PartnerKind, string> = { store: "متجر", factory: "مصنع", importer: "مستورد" };
const kindIcon: Record<PartnerKind, typeof Store> = { store: Store, factory: Factory, importer: Truck };

export function RoleBasedCommercePortal() {
  const { user } = useAuth();
  const trpcUtils = trpc.useUtils();
  const ordersQuery = trpc.commerceOrders.list.useQuery(undefined, { enabled: Boolean(user) });
  const createOrderMutation = trpc.commerceOrders.create.useMutation({
    onSuccess: async () => {
      await trpcUtils.commerceOrders.list.invalidate();
      toast.success("تم حفظ أمر الشراء في قاعدة البيانات وسجل التدقيق.");
    },
    onError: (error) => toast.error(error.message || "تعذر حفظ أمر الشراء."),
  });
  const [role, setRole] = useState<PortalRole>("consumer");
  const [verified, setVerified] = useState(true);
  const [countryFilter, setCountryFilter] = useState("all");
  const [kindFilter, setKindFilter] = useState<PartnerKind | "all">("all");
  const [productFilter, setProductFilter] = useState("all");
  const [ratingFilter, setRatingFilter] = useState("all");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [maxMoq, setMaxMoq] = useState("");
  const [sortBy, setSortBy] = useState("rating");
  const [query, setQuery] = useState("");
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [quantity, setQuantity] = useState("1");
  const [message, setMessage] = useState("");
  const [orders, setOrders] = useState<Array<{ id: string; partner: string; role: PortalRole; status: string }>>([]);

  const allowedKinds: PartnerKind[] = role === "consumer" ? ["store"] : role === "merchant" ? ["factory", "importer"] : ["factory", "importer", "store"];
  const productOptions = useMemo(() => Array.from(new Set(partners.flatMap((partner) => partner.categories))).sort(), []);
  const filteredPartners = useMemo(() => partners.filter((partner) => {
    const matchesKind = allowedKinds.includes(partner.kind);
    const matchesKindFilter = kindFilter === "all" || partner.kind === kindFilter;
    const matchesCountry = countryFilter === "all" || partner.country === countryFilter;
    const matchesProduct = productFilter === "all" || partner.categories.includes(productFilter);
    const matchesRating = ratingFilter === "all" || partner.rating >= Number(ratingFilter);
    const matchesPrice = (!minPrice || partner.priceTo >= Number(minPrice)) && (!maxPrice || partner.priceFrom <= Number(maxPrice));
    const matchesMoq = !maxMoq || partner.moq <= Number(maxMoq);
    const text = `${partner.name} ${partner.city} ${partner.country} ${partner.categories.join(" ")}`.toLowerCase();
    return matchesKind && matchesKindFilter && matchesCountry && matchesProduct && matchesRating && matchesPrice && matchesMoq && text.includes(query.trim().toLowerCase());
  }).sort((a, b) => sortBy === "rating" ? b.rating - a.rating : sortBy === "reviews" ? b.reviewCount - a.reviewCount : sortBy === "name" ? a.name.localeCompare(b.name, "ar") : a.leadTime.localeCompare(b.leadTime, "ar")), [allowedKinds, countryFilter, kindFilter, productFilter, ratingFilter, minPrice, maxPrice, maxMoq, query, sortBy]);

  const submitOrder = () => {
    if (!selectedPartner || !selectedProduct || !message.trim()) {
      toast.error("اختر منتجاً وجهة واكتب رسالة الطلب أولاً.");
      return;
    }
    if (!user) {
      toast.error("سجّل الدخول أولاً لحفظ أمر الشراء في قاعدة البيانات.");
      return;
    }
    const offeringId = Number(selectedProduct.id);
    if (!Number.isInteger(offeringId) || offeringId <= 0) {
      toast.error("هذا عرض تجريبي غير مرتبط بكتالوج تجاري موثق. لا يمكن إنشاء أمر شراء منه.");
      return;
    }
    createOrderMutation.mutate({
      offeringId,
      quantity: Number(quantity),
      message,
    });
  };

  const copy = roleCopy[role];
  const gatePassed = verified;
  const visibleProductPartners = new Set(filteredPartners.map((partner) => partner.id));
  const filteredProducts = products.filter((product) => visibleProductPartners.has(product.partnerId) && (!minPrice || product.price >= Number(minPrice)) && (!maxPrice || product.price <= Number(maxPrice)) && (!maxMoq || product.moq <= Number(maxMoq)) && (productFilter === "all" || product.category === productFilter));
  const persistedOrders = (ordersQuery.data ?? []).map((order) => ({ id: `PO-${order.id}`, partner: order.partnerName, role, status: order.status }));
  const visibleOrders = [...orders, ...persistedOrders.filter((stored) => !orders.some((local) => local.id === stored.id))];
  const comparisonProducts = products.filter((product) => compareIds.includes(product.id) && visibleProductPartners.has(product.partnerId));
  const toggleCompare = (productId: string) => setCompareIds((current) => current.includes(productId) ? current.filter((id) => id !== productId) : current.length < 3 ? [...current, productId] : current);

  return <section dir="rtl" className="space-y-6">
    <Card className="overflow-hidden border-slate-900 bg-gradient-to-l from-slate-950 via-indigo-950 to-teal-950 text-white shadow-2xl"><CardContent className="p-6 md:p-8"><div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between"><div className="max-w-3xl"><div className="mb-3 flex flex-wrap gap-2"><Badge className="border border-emerald-300/30 bg-emerald-400/10 text-emerald-200">Commercial Portal · Demo</Badge><Badge variant="outline" className="border-cyan-300/30 text-cyan-200">Fail-closed gates</Badge></div><h2 className="text-2xl font-black md:text-3xl">بوابة التجارة حسب نوع المستخدم</h2><p className="mt-3 text-sm leading-7 text-slate-300">واجهات منفصلة للمشتري الفردي، التاجر، والمصنع/المستورد. هذه نسخة تفاعلية ببيانات تجريبية؛ أمر الشراء لا يرسل إلى مزود خارجي ولا يمثل معاملة مالية حقيقية.</p></div><div className="rounded-2xl border border-emerald-300/20 bg-emerald-400/10 p-4 text-sm"><p className="text-emerald-200">حالة بوابة الثقة</p><p className="mt-1 flex items-center gap-2 font-bold"><CheckCircle2 className="h-4 w-4" />KYC Verified · Access active</p></div></div></CardContent></Card>

    <Card className="border-slate-200 bg-white"><CardHeader><CardTitle className="flex items-center gap-2 text-slate-950"><UserRoundCheck className="h-5 w-5 text-indigo-700" />اختر واجهة الاختبار</CardTitle><CardDescription>في الإنتاج سيتم تحديدها من الكيانات والأدوار والصلاحيات الفعلية، وليس من اختيار المستخدم.</CardDescription></CardHeader><CardContent className="grid gap-3 md:grid-cols-3">{(Object.keys(roleCopy) as PortalRole[]).map((key) => <button type="button" key={key} onClick={() => { setRole(key); setSelectedPartner(null); setSelectedProduct(null); setCountryFilter("all"); }} className={`rounded-xl border p-4 text-right transition ${role === key ? "border-indigo-500 bg-indigo-50 ring-2 ring-indigo-100" : "border-slate-200 hover:border-indigo-300"}`}><p className="font-bold text-slate-950">{roleCopy[key].title}</p><p className="mt-1 text-xs leading-5 text-slate-500">{roleCopy[key].description}</p><Badge variant="outline" className="mt-3 border-slate-300 text-slate-600">{roleCopy[key].gate}</Badge></button>)}</CardContent></Card>

    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <div className="space-y-4">
        <Card className="border-slate-200"><CardContent className="p-4"><div className="flex flex-col gap-3 md:flex-row md:items-end"><div className="flex-1 space-y-2"><Label>بحث في الشركاء</Label><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={role === "consumer" ? "ابحث عن متجر أو فئة" : "ابحث عن مصنع أو مستورد أو فئة"} /></div><div className="space-y-2 md:w-44"><Label>النطاق الجغرافي</Label><select value={countryFilter} onChange={(event) => setCountryFilter(event.target.value)} className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"><option value="all">كل النطاقات</option><option value="مصر">داخل مصر</option><option value="الإمارات">خارج مصر · الإمارات</option><option value="تركيا">خارج مصر · تركيا</option></select></div><div className="space-y-2 md:w-40"><Label>نوع الجهة</Label><select value={kindFilter} onChange={(event) => setKindFilter(event.target.value as PartnerKind | "all")} className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"><option value="all">كل الأنواع</option>{allowedKinds.map((kind) => <option key={kind} value={kind}>{kindLabel[kind]}</option>)}</select></div></div><div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><div className="space-y-2"><Label>نوع المنتجات</Label><select value={productFilter} onChange={(event) => setProductFilter(event.target.value)} className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"><option value="all">كل المنتجات</option>{productOptions.map((product) => <option key={product} value={product}>{product}</option>)}</select></div><div className="space-y-2"><Label>التقييم الأدنى</Label><select value={ratingFilter} onChange={(event) => setRatingFilter(event.target.value)} className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"><option value="all">كل التقييمات</option><option value="4.5">4.5 فأعلى</option><option value="4">4.0 فأعلى</option><option value="3">3.0 فأعلى</option></select></div><div className="space-y-2"><Label>ترتيب النتائج</Label><select value={sortBy} onChange={(event) => setSortBy(event.target.value)} className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"><option value="rating">الأعلى تقييماً</option><option value="reviews">الأكثر مراجعات</option><option value="leadTime">الأسرع توريداً</option><option value="name">الاسم أبجدياً</option></select></div><div className="flex items-end"><Button type="button" variant="outline" onClick={() => { setCountryFilter("all"); setKindFilter("all"); setProductFilter("all"); setRatingFilter("all"); setMinPrice(""); setMaxPrice(""); setMaxMoq(""); setSelectedProduct(null); setSortBy("rating"); setQuery(""); }} className="h-10 w-full border-slate-300">مسح كل الفلاتر</Button></div></div><div className="mt-4 grid gap-3 sm:grid-cols-3"><div className="space-y-2"><Label>السعر الأدنى (جنيه)</Label><Input type="number" min="0" value={minPrice} onChange={(event) => setMinPrice(event.target.value)} placeholder="مثال: 1000" /></div><div className="space-y-2"><Label>السعر الأقصى (جنيه)</Label><Input type="number" min="0" value={maxPrice} onChange={(event) => setMaxPrice(event.target.value)} placeholder="مثال: 50000" /></div><div className="space-y-2"><Label>MOQ الأقصى</Label><Input type="number" min="1" value={maxMoq} onChange={(event) => setMaxMoq(event.target.value)} placeholder="كمية الطلب" /></div></div><div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-100 bg-slate-50 p-3 text-xs"><span className="font-semibold text-slate-700">{copy.title}</span><span className="text-slate-500">{filteredPartners.length} جهة متاحة وفقاً للبوابة</span></div></CardContent></Card>
        {!gatePassed && <Card className="border-rose-200 bg-rose-50"><CardContent className="p-5 text-sm leading-7 text-rose-900">تم إيقاف الوصول التجاري لأن KYC غير متحقق. أكمل التحقق أولاً؛ إخفاء الزر لا يكفي، والقرار يجب أن يطبق في الخادم أيضاً.</CardContent></Card>}
        {gatePassed && <Card className="border-cyan-200 bg-cyan-50/40"><CardHeader><CardTitle className="flex items-center gap-2 text-base text-slate-950"><PackageSearch className="h-5 w-5 text-cyan-700" />كتالوج المنتجات التجريبية</CardTitle><CardDescription>اختبر تأثير فلاتر السعر وMOQ على المنتجات الفعلية، ثم اضغط على أي منتج لتعبئة أمر الشراء.</CardDescription></CardHeader><CardContent><div className="mb-4 flex items-center justify-between text-xs text-slate-600"><span>المنتجات المطابقة للفلاتر الحالية</span><Badge variant="outline" className="border-cyan-200 bg-white text-cyan-800">{filteredProducts.length} منتج</Badge></div>{filteredProducts.length === 0 ? <div className="rounded-xl border border-dashed border-cyan-300 bg-white p-8 text-center text-sm text-slate-500">لا توجد منتجات ضمن النطاق السعري وMOQ المحددين.</div> : <div className="grid gap-3 md:grid-cols-2">{filteredProducts.map((product) => { const owner = partners.find((partner) => partner.id === product.partnerId); const active = selectedProduct?.id === product.id; return <button type="button" key={product.id} onClick={() => { setSelectedProduct(product); setSelectedPartner(owner ?? null); setQuantity(String(product.moq)); setMessage(`أرغب في شراء ${product.name} بكمية ${product.moq} ${product.unit}. يرجى تأكيد السعر وموعد التسليم.`); }} className={`rounded-xl border bg-white p-4 text-right transition hover:border-cyan-400 hover:shadow-sm ${active ? "border-cyan-500 ring-2 ring-cyan-100" : "border-slate-200"}`}><div className="mb-3 flex h-16 items-center justify-between rounded-lg bg-gradient-to-l from-cyan-700 via-indigo-700 to-slate-900 px-4 text-white"><div><p className="text-[10px] uppercase tracking-[0.2em] text-cyan-100">Product Identity</p><p className="mt-1 text-sm font-black">{product.category}</p></div><PackageSearch className="h-8 w-8 text-cyan-200" /></div><div className="flex items-start justify-between gap-3"><div><p className="font-bold text-slate-950">{product.name}</p><p className="mt-1 text-xs text-slate-500">{owner?.name} · {product.category}</p></div><Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">متاح</Badge></div><div className="mt-3 flex flex-wrap gap-1">{product.specs.map((spec) => <span key={spec} className="rounded-full bg-cyan-50 px-2 py-1 text-[11px] text-cyan-800">{spec}</span>)}</div><div className="mt-3 grid grid-cols-3 gap-2 text-xs"><div className="rounded-lg bg-slate-50 p-2"><p className="text-slate-500">سعر الوحدة</p><p className="mt-1 font-bold text-slate-800">{product.price.toLocaleString("ar-EG")} ج.م</p></div><div className="rounded-lg bg-slate-50 p-2"><p className="text-slate-500">MOQ</p><p className="mt-1 font-bold text-slate-800">{product.moq.toLocaleString("ar-EG")} {product.unit}</p></div><div className="rounded-lg bg-slate-50 p-2"><p className="text-slate-500">المخزون</p><p className="mt-1 font-bold text-slate-800">{product.stock.toLocaleString("ar-EG")}</p></div></div><p className="mt-3 text-xs text-cyan-700">مهلة التوريد: {product.leadTime} · اضغط للاختيار</p><span role="button" tabIndex={0} onClick={(event) => { event.stopPropagation(); toggleCompare(product.id); }} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); event.stopPropagation(); toggleCompare(product.id); } }} className={`mt-2 block rounded-md px-2 py-1 text-center text-xs font-semibold ${compareIds.includes(product.id) ? "bg-indigo-100 text-indigo-800" : "bg-slate-100 text-slate-600"}`}>{compareIds.includes(product.id) ? "مضاف للمقارنة" : "أضف للمقارنة"}</span></button>; })}</div>}{comparisonProducts.length > 0 && <div className="mt-5 rounded-xl border border-indigo-200 bg-indigo-50/50 p-4"><div className="mb-3 flex items-center justify-between"><div><p className="font-bold text-slate-900">مقارنة المنتجات والجهات</p><p className="text-xs text-slate-500">حتى 3 منتجات — قارن السعر وMOQ والمخزون ومدة التوريد.</p></div><Button type="button" variant="outline" onClick={() => setCompareIds([])} className="h-8 border-indigo-200 bg-white text-xs">مسح المقارنة</Button></div><div className="grid gap-3 md:grid-cols-3">{comparisonProducts.map((product) => { const owner = partners.find((partner) => partner.id === product.partnerId); return <div key={product.id} className="rounded-lg border border-indigo-100 bg-white p-3 text-xs"><p className="font-bold text-slate-900">{product.name}</p><p className="mt-1 text-slate-500">{owner?.name}</p><div className="mt-3 space-y-1 text-slate-700"><p>السعر: <strong>{product.price.toLocaleString("ar-EG")} ج.م</strong></p><p>MOQ: <strong>{product.moq.toLocaleString("ar-EG")} {product.unit}</strong></p><p>المخزون: <strong>{product.stock.toLocaleString("ar-EG")}</strong></p><p>التوريد: <strong>{product.leadTime}</strong></p></div></div>; })}</div></div>}</CardContent></Card>}
        {gatePassed && <div className="grid gap-4 md:grid-cols-2">{filteredPartners.map((partner) => { const Icon = kindIcon[partner.kind]; return <Card key={partner.id} className={`cursor-pointer border-slate-200 transition hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-md ${selectedPartner?.id === partner.id ? "border-indigo-500 ring-2 ring-indigo-100" : ""}`} onClick={() => setSelectedPartner(partner)}><CardContent className="p-5"><div className="flex items-start justify-between gap-3"><div className="flex items-start gap-3"><div className="rounded-xl bg-indigo-50 p-3 text-indigo-700"><Icon className="h-5 w-5" /></div><div><h3 className="font-bold text-slate-950">{partner.name}</h3><p className="mt-1 text-xs text-slate-500">{kindLabel[partner.kind]} · {partner.city} · {partner.country}</p></div></div><Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">متحقق</Badge></div><div className="mt-4 flex flex-wrap gap-2">{partner.categories.map((category) => <Badge key={category} variant="outline" className="border-slate-200 text-slate-600">{category}</Badge>)}</div><div className="mt-4 flex items-center justify-between rounded-lg bg-amber-50 px-3 py-2 text-xs"><span className="font-bold text-amber-800">★ {partner.rating.toFixed(1)}</span><span className="text-amber-700">{partner.reviewCount} مراجعة موثقة</span></div><div className="mt-3 grid grid-cols-2 gap-2 text-xs"><div className="rounded-lg border border-slate-100 bg-slate-50 p-2"><p className="text-slate-500">السعر التقريبي</p><p className="mt-1 font-bold text-slate-800">{partner.priceFrom.toLocaleString("ar-EG")}–{partner.priceTo.toLocaleString("ar-EG")} ج.م</p></div><div className="rounded-lg border border-slate-100 bg-slate-50 p-2"><p className="text-slate-500">الحد الأدنى MOQ</p><p className="mt-1 font-bold text-slate-800">{partner.moq.toLocaleString("ar-EG")} وحدة</p></div></div><div className="mt-4 flex items-center justify-between text-xs text-slate-500"><span className="flex items-center gap-1"><Truck className="h-3.5 w-3.5" />مهلة التوريد: {partner.leadTime}</span><span className="flex items-center gap-1 text-indigo-700"><MessageSquare className="h-3.5 w-3.5" />تواصل وأمر شراء</span></div></CardContent></Card>; })}</div>}
      </div>
      <div className="space-y-4">
        <Card className="border-indigo-200 bg-indigo-50/40"><CardHeader><CardTitle className="flex items-center gap-2 text-base text-slate-950"><ShoppingCart className="h-5 w-5 text-indigo-700" />أمر شراء / رسالة</CardTitle><CardDescription>{selectedPartner ? `إلى: ${selectedPartner.name}` : "اختر جهة من القائمة لبدء التواصل"}</CardDescription></CardHeader><CardContent className="space-y-4">{selectedPartner ? <><div className="rounded-lg border border-indigo-100 bg-white p-3 text-xs text-slate-600"><p className="font-bold text-slate-900">{selectedPartner.name}</p><p className="mt-1">{selectedPartner.country} · {selectedPartner.categories.join(" · ")}</p>{selectedProduct && <p className="mt-2 rounded bg-cyan-50 p-2 font-semibold text-cyan-900">المنتج: {selectedProduct.name} · {selectedProduct.price.toLocaleString("ar-EG")} ج.م/{selectedProduct.unit} · MOQ {selectedProduct.moq}</p>}</div><div className="space-y-2"><Label>الكمية</Label><Input type="number" min="1" value={quantity} onChange={(event) => setQuantity(event.target.value)} /></div><div className="space-y-2"><Label>نص أمر الشراء</Label><textarea value={message} onChange={(event) => setMessage(event.target.value)} placeholder="أحتاج عرض سعر للمنتج والكمية وموعد التسليم…" className="min-h-28 w-full rounded-md border border-slate-200 bg-white p-3 text-sm" /></div><div className="flex gap-2"><Button type="button" onClick={submitOrder} disabled={createOrderMutation.isPending} className="flex-1 bg-indigo-700 hover:bg-indigo-800"><Send className="ml-2 h-4 w-4" />{createOrderMutation.isPending ? "جارٍ الحفظ…" : "حفظ وإرسال أمر الشراء"}</Button><Button type="button" variant="outline" onClick={() => setSelectedPartner(null)}>إلغاء</Button></div></> : <div className="py-8 text-center text-sm text-slate-500"><PackageSearch className="mx-auto mb-3 h-8 w-8 text-indigo-300" />اختر منتجاً من الكتالوج لعرض نموذج الطلب وتعبئته تلقائياً.</div>}</CardContent></Card>
        <Card className="border-slate-200"><CardHeader><CardTitle className="text-base text-slate-950">أوامر الشراء المحفوظة</CardTitle><CardDescription>تُحفظ للمستخدم المصادق عليه في قاعدة البيانات وتُسجل في Audit Trail.</CardDescription></CardHeader><CardContent className="space-y-2">{visibleOrders.length === 0 ? <p className="text-sm text-slate-500">لا توجد أوامر بعد. سجّل الدخول لحفظ أول أمر في قاعدة البيانات.</p> : visibleOrders.map((order) => <div key={order.id} className="rounded-lg border border-slate-100 bg-slate-50 p-3 text-xs"><div className="flex items-center justify-between"><span className="font-mono text-indigo-700">{order.id}</span><Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-800">{order.status}</Badge></div><p className="mt-2 font-semibold text-slate-800">{order.partner}</p></div>)}</CardContent></Card>
      </div>
    </div>
    <div className="grid gap-3 md:grid-cols-3"><div className="rounded-xl border border-teal-200 bg-teal-50 p-4 text-sm text-teal-950"><Store className="mb-2 h-5 w-5 text-teal-700" /><strong>المشتري الفردي</strong><p className="mt-1 text-xs leading-5">يرى المتاجر فقط بعد KYC، ولا يرى بيانات تجارية غير لازمة.</p></div><div className="rounded-xl border border-indigo-200 bg-indigo-50 p-4 text-sm text-indigo-950"><Building2 className="mb-2 h-5 w-5 text-indigo-700" /><strong>التاجر</strong><p className="mt-1 text-xs leading-5">يرى المصانع والمستوردين داخل مصر وفق النشاط والصلاحية.</p></div><div className="rounded-xl border border-violet-200 bg-violet-50 p-4 text-sm text-violet-950"><Globe2 className="mb-2 h-5 w-5 text-violet-700" /><strong>المصنع / المستورد</strong><p className="mt-1 text-xs leading-5">يرى شركاء داخل مصر وخارجها، مع بقاء المطابقة والقرار محكومين بالسياسة.</p></div></div>
  </section>;
}
