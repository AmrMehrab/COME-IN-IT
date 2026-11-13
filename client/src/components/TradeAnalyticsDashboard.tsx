import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BarChart3, TrendingUp, Globe, Filter, ArrowUpRight, ShieldCheck, Factory, Layers, PieChart } from "lucide-react";

interface DemandItem {
  id: string;
  category: "PRODUCT" | "SERVICE";
  title: string;
  sector: string;
  tradeModel: "B2B" | "B2G" | "B2C" | "C2B" | "C2C";
  region: string;
  volume: string;
  growthRate: number;
  verifiedOnly: boolean;
}

const DEMAND_DATA: DemandItem[] = [
  {
    id: "dem-1",
    category: "PRODUCT",
    title: "خطوط إنتاج ألواح الطاقة الشمسية المتطورة",
    sector: "التصنيع المستدام والطاقة",
    tradeModel: "B2B",
    region: "محافظة الإسكندرية / المنطقة الاقتصادية",
    volume: "1,250,000 دولار",
    growthRate: 18.4,
    verifiedOnly: true,
  },
  {
    id: "dem-2",
    category: "SERVICE",
    title: "خدمات التخليص الجمركي السيادي الذكي",
    sector: "الخدمات اللوجستية والتجارة العابرة",
    tradeModel: "B2G",
    region: "ميناء الإسكندرية والعين السخنة",
    volume: "3,800,000 دولار",
    growthRate: 24.1,
    verifiedOnly: true,
  },
  {
    id: "dem-3",
    category: "PRODUCT",
    title: "مكونات وأجهزة تحكم صناعية PLC مبرمجة",
    sector: "الأتمتة الصناعية والروبوتكس",
    tradeModel: "B2B",
    region: "القاهرة الكبرى / السادس من أكتوبر",
    volume: "890,000 دولار",
    growthRate: 12.8,
    verifiedOnly: true,
  },
  {
    id: "dem-4",
    category: "SERVICE",
    title: "استشارات هندسة العمليات وتدقيق الـ WORM",
    sector: "التكنولوجيا والامتثال الرقمي",
    tradeModel: "B2B",
    region: "العاصمة الإدارية الجديدة",
    volume: "650,000 دولار",
    growthRate: 31.5,
    verifiedOnly: true,
  },
  {
    id: "dem-5",
    category: "PRODUCT",
    title: "مستلزمات التغليف والتعليب الحيوي الصديق للبيئة",
    sector: "الصناعات الغذائية والدوائية",
    tradeModel: "B2C",
    region: "دلتا مصر (طنطا والمحلة)",
    volume: "420,000 دولار",
    growthRate: 9.6,
    verifiedOnly: false,
  },
];

export function TradeAnalyticsDashboard() {
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [selectedModel, setSelectedModel] = useState<string>("ALL");

  const filteredDemand = DEMAND_DATA.filter((item) => {
    if (selectedCategory !== "ALL" && item.category !== selectedCategory) return false;
    if (selectedModel !== "ALL" && item.tradeModel !== selectedModel) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="bg-card/60 p-6 rounded-2xl border border-border/65 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2 text-foreground">
            <BarChart3 className="w-6 h-6 text-primary" />
            لوحة تحليل مؤشرات الطلب المحلي والدولي (Trade Intelligence Analytics)
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            رصد وتحليل حجم الطلب على المنتجات والخدمات عبر الأنماط التجارية الخمسة وضمن بيئة التحقق السيادية.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs px-3 py-1 bg-emerald-500/10 text-emerald-600 border-emerald-500/25">
            محدث فوريًا (Real-time Sync)
          </Badge>
        </div>
      </div>

      {/* مؤشرات عامة سريعة */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border border-border/60 bg-card/40">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">إجمالي حجم الطلب النشط</p>
              <h3 className="text-xl font-bold mt-1 text-foreground">7,010,000 $</h3>
              <span className="text-[11px] text-emerald-500 flex items-center gap-1 mt-1">
                <TrendingUp className="w-3 h-3" /> +16.8% مقارنة بالشهر السابق
              </span>
            </div>
            <div className="p-3 bg-primary/10 rounded-xl text-primary">
              <Globe className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/60 bg-card/40">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">الفرص الموثقة (KYB Secured)</p>
              <h3 className="text-xl font-bold mt-1 text-foreground">88.2%</h3>
              <span className="text-[11px] text-primary flex items-center gap-1 mt-1">
                <ShieldCheck className="w-3 h-3" /> التزام كامل بالمعايير السيادية
              </span>
            </div>
            <div className="p-3 bg-blue-500/10 rounded-xl text-blue-500">
              <ShieldCheck className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/60 bg-card/40">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">القطاعات الأكثر طلباً</p>
              <h3 className="text-xl font-bold mt-1 text-foreground">الخدمات اللوجستية والطاقة</h3>
              <span className="text-[11px] text-muted-foreground mt-1 block">نمو متسارع في B2B & B2G</span>
            </div>
            <div className="p-3 bg-amber-500/10 rounded-xl text-amber-500">
              <Factory className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/60 bg-card/40">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">متوسط معدل النمو السنوي</p>
              <h3 className="text-xl font-bold mt-1 text-foreground">+19.3%</h3>
              <span className="text-[11px] text-emerald-500 flex items-center gap-1 mt-1">
                <ArrowUpRight className="w-3 h-3" /> توسع إقليمي ومحلي
              </span>
            </div>
            <div className="p-3 bg-purple-500/10 rounded-xl text-purple-500">
              <PieChart className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* أدوات التصفية */}
      <div className="bg-card/40 p-4 rounded-xl border border-border/60 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> تصفية الفئة:
          </span>
          <Button
            variant={selectedCategory === "ALL" ? "default" : "outline"}
            size="sm"
            className="text-xs h-7"
            onClick={() => setSelectedCategory("ALL")}
          >
            الكل
          </Button>
          <Button
            variant={selectedCategory === "PRODUCT" ? "default" : "outline"}
            size="sm"
            className="text-xs h-7"
            onClick={() => setSelectedCategory("PRODUCT")}
          >
            المنتجات
          </Button>
          <Button
            variant={selectedCategory === "SERVICE" ? "default" : "outline"}
            size="sm"
            className="text-xs h-7"
            onClick={() => setSelectedCategory("SERVICE")}
          >
            الخدمات
          </Button>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-muted-foreground">نمط التجارة:</span>
          {["ALL", "B2B", "B2G", "B2C"].map((model) => (
            <Button
              key={model}
              variant={selectedModel === model ? "secondary" : "outline"}
              size="sm"
              className="text-xs h-7 font-mono"
              onClick={() => setSelectedModel(model)}
            >
              {model}
            </Button>
          ))}
        </div>
      </div>

      {/* جدول اتجاهات الطلب */}
      <div className="space-y-3">
        {filteredDemand.map((item) => (
          <Card key={item.id} className="border border-border/60 bg-card/50 hover:border-primary/40 transition-all">
            <CardContent className="p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px]">
                    {item.category === "PRODUCT" ? "منتج صناعي/تجاري" : "خدمة مساندة"}
                  </Badge>
                  <Badge variant="outline" className="text-[10px] font-mono font-semibold">
                    {item.tradeModel}
                  </Badge>
                  {item.verifiedOnly && (
                    <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px]">
                      مضمون بـ KYB
                    </Badge>
                  )}
                </div>
                <h4 className="text-sm font-bold text-foreground">{item.title}</h4>
                <p className="text-xs text-muted-foreground">
                  القطاع: <span className="text-foreground font-medium">{item.sector}</span> | الموقع: {item.region}
                </p>
              </div>

              <div className="flex items-center gap-6 self-end md:self-center shrink-0">
                <div className="text-left">
                  <p className="text-xs text-muted-foreground">حجم الطلب</p>
                  <p className="text-sm font-bold text-foreground font-mono">{item.volume}</p>
                </div>
                <div className="text-left bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20">
                  <p className="text-[10px] text-emerald-600 font-medium">معدل النمو</p>
                  <p className="text-xs font-bold text-emerald-700 font-mono">+{item.growthRate}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
