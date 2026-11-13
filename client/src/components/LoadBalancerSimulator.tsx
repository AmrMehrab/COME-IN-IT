import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Activity, Server, Shield, Cpu, RefreshCw, AlertTriangle, CheckCircle2, Zap } from "lucide-react";
import { toast } from "sonner";

interface NodeStats {
  id: string;
  name: string;
  type: "SOVEREIGN_CORE" | "HYBRID_RELAY" | "GOV_GATEWAY";
  load: number; // percentage
  latency: number; // ms
  status: "ONLINE" | "HIGH_LOAD" | "FAILOVER";
  requestsProcessed: number;
}

export function LoadBalancerSimulator() {
  const [nodes, setNodes] = useState<NodeStats[]>([
    { id: "node-1", name: "العقدة السيادية المركزية (Sovereign Core Alpha)", type: "SOVEREIGN_CORE", load: 42, latency: 14, status: "ONLINE", requestsProcessed: 1420 },
    { id: "node-2", name: "عقدة التخزين والتدقيق الآمن (WORM Vault Node)", type: "SOVEREIGN_CORE", load: 28, latency: 18, status: "ONLINE", requestsProcessed: 980 },
    { id: "node-3", name: "بوابة الربط الحكومي (NTRA & Customs Gateway)", type: "GOV_GATEWAY", load: 68, latency: 45, status: "ONLINE", requestsProcessed: 2310 },
    { id: "node-4", name: "بوابة السحابة الهجينة (Hybrid Relay Edge)", type: "HYBRID_RELAY", load: 35, latency: 22, status: "ONLINE", requestsProcessed: 1150 },
  ]);

  const [simulationActive, setSimulationActive] = useState(false);
  const [trafficRate, setTrafficRate] = useState<number>(50); // req/s
  const [activeStrategy, setActiveStrategy] = useState<"GEO_IP" | "LEAST_LOAD" | "SOVEREIGN_PRIORITY">("SOVEREIGN_PRIORITY");

  // محاكاة تغير الأحمال دورياً عند تفعيل المحاكي
  useEffect(() => {
    let interval: any;
    if (simulationActive) {
      interval = setInterval(() => {
        setNodes((prevNodes) =>
          prevNodes.map((node) => {
            const fluctuation = Math.floor(Math.random() * 16) - 8;
            const newLoad = Math.min(Math.max(node.load + fluctuation, 10), 96);
            const newLatency = Math.min(Math.max(node.latency + Math.floor(Math.random() * 6) - 3, 10), 120);
            let status: "ONLINE" | "HIGH_LOAD" | "FAILOVER" = "ONLINE";
            if (newLoad > 85) status = "HIGH_LOAD";
            if (newLoad > 92) status = "FAILOVER";

            return {
              ...node,
              load: newLoad,
              latency: newLatency,
              status,
              requestsProcessed: node.requestsProcessed + Math.floor(Math.random() * 15) + 5,
            };
          })
        );
      }, 1500);
    }
    return () => clearInterval(interval);
  }, [simulationActive]);

  const handleSimulateSpike = () => {
    setNodes((prev) =>
      prev.map((n) => ({
        ...n,
        load: Math.min(n.load + 35, 98),
        latency: n.latency + 25,
        status: n.load + 35 > 85 ? "HIGH_LOAD" : "ONLINE",
      }))
    );
    toast.warning("تم حقن ضغط مفاجئ (Traffic Spike) في الشبكة! محرك الموازنة يعيد توجيه الأحمال...");
  };

  const handleReset = () => {
    setNodes([
      { id: "node-1", name: "العقدة السيادية المركزية (Sovereign Core Alpha)", type: "SOVEREIGN_CORE", load: 42, latency: 14, status: "ONLINE", requestsProcessed: 1420 },
      { id: "node-2", name: "عقدة التخزين والتدقيق الآمن (WORM Vault Node)", type: "SOVEREIGN_CORE", load: 28, latency: 18, status: "ONLINE", requestsProcessed: 980 },
      { id: "node-3", name: "بوابة الربط الحكومي (NTRA & Customs Gateway)", type: "GOV_GATEWAY", load: 68, latency: 45, status: "ONLINE", requestsProcessed: 2310 },
      { id: "node-4", name: "بوابة السحابة الهجينة (Hybrid Relay Edge)", type: "HYBRID_RELAY", load: 35, latency: 22, status: "ONLINE", requestsProcessed: 1150 },
    ]);
    toast.success("تم إعادة ضبط مؤشرات العقد السيادية.");
  };

  return (
    <div className="space-y-6">
      <div className="bg-card/60 p-6 rounded-2xl border border-border/60 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2 text-foreground">
            <Activity className="w-6 h-6 text-primary animate-pulse" />
            محاكي موازنة الأحمال والسيادة السحابية (Cloud Load Balancer)
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            مراقبة وتوزيع حركة البيانات وحمل الطلبات بين العقد السيادية المركزية وبوابات الربط الحكومي مع ضمان زمن الاستجابة وحوكمة WORM.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant={simulationActive ? "destructive" : "default"}
            size="sm"
            onClick={() => {
              setSimulationActive(!simulationActive);
              toast.info(simulationActive ? "تم إيقاف محاكاة التدفق الحي." : "تم تفعيل محاكاة التدفق الحي بنجاح!");
            }}
            className="gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${simulationActive ? "animate-spin" : ""}`} />
            {simulationActive ? "إيقاف المحاكاة" : "تشغيل المحاكاة الحية"}
          </Button>
          <Button variant="outline" size="sm" onClick={handleSimulateSpike} className="gap-2">
            <Zap className="w-4 h-4 text-amber-500" />
            حقن ضغط مفاجئ
          </Button>
          <Button variant="outline" size="sm" onClick={handleReset}>
            إعادة ضبط
          </Button>
        </div>
      </div>

      {/* لوحة إحصائيات عامة */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border border-border/60">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">استراتيجية التوزيع</p>
              <h3 className="text-sm font-bold text-foreground mt-1">Sovereign Priority First</h3>
            </div>
            <div className="p-3 bg-primary/10 text-primary rounded-xl">
              <Shield className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
        <Card className="border border-border/60">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">إجمالي الطلبات المعالجة</p>
              <h3 className="text-lg font-bold text-foreground mt-1">
                {nodes.reduce((acc, n) => acc + n.requestsProcessed, 0).toLocaleString()} طلب
              </h3>
            </div>
            <div className="p-3 bg-emerald-500/10 text-emerald-600 rounded-xl">
              <Activity className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
        <Card className="border border-border/60">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">متوسط زمن الاستجابة</p>
              <h3 className="text-lg font-bold text-foreground mt-1">
                {Math.round(nodes.reduce((acc, n) => acc + n.latency, 0) / nodes.length)} مللي ثانية
              </h3>
            </div>
            <div className="p-3 bg-blue-500/10 text-blue-600 rounded-xl">
              <Cpu className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
        <Card className="border border-border/60">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">حالة التوافر العام</p>
              <h3 className="text-sm font-bold text-emerald-600 mt-1 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" /> 99.99% (SLA Secured)
              </h3>
            </div>
            <div className="p-3 bg-purple-500/10 text-purple-600 rounded-xl">
              <Server className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* شبكة العقد والموازنة */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {nodes.map((node) => (
          <Card key={node.id} className="border border-border/60 shadow-sm relative overflow-hidden">
            <div
              className={`absolute top-0 right-0 left-0 h-1 ${
                node.status === "ONLINE"
                  ? "bg-emerald-500"
                  : node.status === "HIGH_LOAD"
                  ? "bg-amber-500"
                  : "bg-rose-500"
              }`}
            />
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <Badge variant="outline" className="mb-2 text-[10px] font-mono">
                    {node.type}
                  </Badge>
                  <CardTitle className="text-base font-bold">{node.name}</CardTitle>
                </div>
                {node.status === "ONLINE" && (
                  <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-xs">متصل ومستقر</Badge>
                )}
                {node.status === "HIGH_LOAD" && (
                  <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-xs">ضغط مرتفع</Badge>
                )}
                {node.status === "FAILOVER" && (
                  <Badge className="bg-rose-500/10 text-rose-600 border-rose-500/20 text-xs">تحويل احتياطي</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">نسبة استهلاك المعالج والذاكرة (Load)</span>
                  <span className="font-bold text-foreground">{node.load}%</span>
                </div>
                <Progress value={node.load} className="h-2" />
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border/40 text-xs">
                <div>
                  <span className="text-muted-foreground block mb-0.5">زمن الاستجابة (Latency)</span>
                  <strong className="text-foreground text-sm font-mono">{node.latency} ms</strong>
                </div>
                <div>
                  <span className="text-muted-foreground block mb-0.5">الطلبات المعالجة</span>
                  <strong className="text-foreground text-sm font-mono">{node.requestsProcessed.toLocaleString()}</strong>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
