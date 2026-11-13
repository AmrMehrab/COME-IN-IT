import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, ArrowRight, Building2, User, Landmark, ShoppingCart, Layers, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

interface TradeModel {
  code: string;
  nameAr: string;
  nameEn: string;
  actorA: string;
  actorB: string;
  description: string;
  example: string;
  reqs: string[];
}

const tradeModels: TradeModel[] = [
  {
    code: "B2B",
    nameAr: "التعامل التجاري بين الشركات",
    nameEn: "Business to Business",
    actorA: "Business (Manufacturer / Importer)",
    actorB: "Business (Buyer / Trader / Store)",
    description: "تبادل تجاري بين كيانين موثقين (KYB) يشمل صفقات توريد، مواد خام، وتصنيع عقدي.",
    example: "مصنع منتجات معدنية مصري (KYB) يورّد لمستورد سعودي أو سلسلة متاجر (KYB).",
    reqs: ["KYC للممثل", "KYB إلزامي للطرفين", "تراخيص تجارية سارية", "موافقة مدير المشتريات/المبيعات"]
  },
  {
    code: "B2C",
    nameAr: "التعامل التجاري مع المستهلك",
    nameEn: "Business to Consumer",
    actorA: "Business (Store / Brand)",
    actorB: "Consumer (User)",
    description: "مبيعات مباشرة من الكيانات التجارية والمتاجر الموثقة إلى المستهلكين الأفراد.",
    example: "متجر أدوات منزلية موثق يعرض منتجاته لمستهلك فرد.",
    reqs: ["KYC إلزامي للمستهلك", "KYB إلزامي للمتجر البائع", "شروط تداول استهلاكية معتمدة"]
  },
  {
    code: "C2B",
    nameAr: "طلب المستهلك من الأنشطة التجارية",
    nameEn: "Consumer to Business",
    actorA: "Consumer (User)",
    actorB: "Business (Manufacturer / Service Provider)",
    description: "مستهلك أو مستخدم يعرض طلبًا خاصًا، تصنيع مخصص، أو احتياجًا خدميًا على نشاط تجاري.",
    example: "مستخدم يطلب تصميم قطع غيار مخصصة من مصنع هندسي.",
    reqs: ["KYC إلزامي للمستهلك", "KYB للنشاط التجاري المستجيب", "توثيق طلب الشراء الفردي"]
  },
  {
    code: "C2C",
    nameAr: "التعامل بين الأفراد (المضبوط)",
    nameEn: "Consumer to Consumer",
    actorA: "Consumer (User)",
    actorB: "Consumer (User)",
    description: "تفاعلات محدودة ومضبوطة بين الأفراد في الأنشطة والخدمات المسموح بها داخل المنظومة.",
    example: "أفراد يتبادلون أدوات مستعملة أو خدمات مصغرة تحت إشراف المنظومة.",
    reqs: ["KYC إلزامي للطرفين", "الالتزام بقواعد التداول الفردي", "حظر المنتجات التجارية غير المصرح بها"]
  },
  {
    code: "B2G",
    nameAr: "التعامل التجاري مع الجهات الحكومية",
    nameEn: "Business to Government",
    actorA: "Business (Manufacturer / Supplier)",
    actorB: "Government Entity",
    description: "مناقصات، عقود توريد حكومية، واحتياجات مؤسسية تطلبها جهات حكومية مستقلة.",
    example: "شركة مقاولات أو مصنع توريدات طبية يتقدم لمناقصة حكومية رسمية.",
    reqs: ["KYC للممثل الحكومي والشركة", "KYB متقدم وسجل توريدات حكومية", "اعتمادات مستويات موافقة عليا"]
  }
];

export default function TradeModelsMatrix() {
  const [selectedModel, setSelectedModel] = useState<TradeModel>(tradeModels[0]);

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 p-8 rounded-2xl border border-blue-500/20 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Layers className="w-48 h-48 text-blue-400" />
        </div>
        <div className="relative z-10 space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <Badge className="bg-blue-600 text-white px-3 py-1 text-xs font-medium rounded-full flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              الأنماط التجارية الخمسة (V1.0 Core)
            </Badge>
            <Badge variant="outline" className="border-blue-400/40 text-blue-300 px-3 py-1 text-xs font-medium rounded-full">
              Relationship-Aware Architecture
            </Badge>
          </div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight">
            مصفوفة الأنماط التجارية المتكاملة (B2B, B2C, C2B, C2C, B2G)
          </h2>
          <p className="text-slate-300 text-base max-w-3xl leading-relaxed">
            في منصة COME IN IT، لا يُعتبر نوع المعاملة خاصية ثابتة للحساب، بل يُدار عبر كيان <code className="text-blue-300 font-mono">TradeRelationship</code> الذي يحدد الأهلية والصلاحيات تلقائياً بناءً على استيفاء شروط KYC و KYB ونوع الكيان.
          </p>
        </div>
      </div>

      {/* Model Selector Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {tradeModels.map((model) => (
          <button
            key={model.code}
            onClick={() => setSelectedModel(model)}
            className={`p-4 rounded-xl border text-right transition-all flex flex-col justify-between ${
              selectedModel.code === model.code
                ? "bg-blue-600/20 border-blue-500 text-white shadow-lg shadow-blue-600/10"
                : "bg-slate-900/60 border-slate-800 text-slate-400 hover:bg-slate-800/80 hover:text-slate-200"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-lg font-bold text-white font-mono">{model.code}</span>
              <Badge variant="outline" className="text-[10px] border-slate-700 text-slate-300">
                {model.code === "B2G" ? "مؤسسي" : model.code.includes("B") && model.code.includes("C") ? "مختلط" : "رئيسي"}
              </Badge>
            </div>
            <div className="text-xs font-medium line-clamp-1 text-slate-300">{model.nameAr}</div>
          </button>
        ))}
      </div>

      {/* Active Model Detailed Card */}
      <Card className="bg-slate-900/90 border-slate-800 shadow-xl overflow-hidden">
        <CardHeader className="border-b border-slate-800 bg-slate-950/50 flex flex-row items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <span className="text-2xl font-black text-blue-400 font-mono bg-blue-950/80 px-3 py-1 rounded-lg border border-blue-500/30">
                {selectedModel.code}
              </span>
              <div>
                <CardTitle className="text-white text-xl">{selectedModel.nameAr}</CardTitle>
                <CardDescription className="text-slate-400 text-xs font-mono">{selectedModel.nameEn}</CardDescription>
              </div>
            </div>
          </div>
          <Badge className="bg-emerald-600/20 border border-emerald-500/40 text-emerald-300">
            مفعل في الإصدار V1.0
          </Badge>
        </CardHeader>
        <CardContent className="p-6 md:p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-950/60 p-5 rounded-xl border border-slate-800/80 space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-blue-400">أطراف العلاقة (Actors):</h4>
              <div className="flex items-center gap-2 text-sm text-slate-200">
                <Building2 className="w-4 h-4 text-blue-400 shrink-0" />
                <span>الطرف الأول: <strong>{selectedModel.actorA}</strong></span>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-200">
                <User className="w-4 h-4 text-indigo-400 shrink-0" />
                <span>الطرف الثاني: <strong>{selectedModel.actorB}</strong></span>
              </div>
            </div>

            <div className="bg-slate-950/60 p-5 rounded-xl border border-slate-800/80 space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-emerald-400">مثال عملي تطبيقي:</h4>
              <p className="text-sm text-slate-300 leading-relaxed">
                {selectedModel.example}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">وصف النمط التجاري:</h4>
            <p className="text-sm text-slate-300 leading-relaxed bg-slate-950/40 p-4 rounded-xl border border-slate-800/60">
              {selectedModel.description}
            </p>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-blue-400">متطلبات التحقق والأهلية (TradeRelationship Prerequisites):</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {selectedModel.reqs.map((req, idx) => (
                <div key={idx} className="flex items-center gap-2.5 bg-slate-950/60 p-3 rounded-lg border border-slate-800 text-xs text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0" />
                  <span>{req}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
