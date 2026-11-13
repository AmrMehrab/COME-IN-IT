import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { API_ENDPOINTS, ApiEndpoint } from "@/data/apiDocsData";
import { Terminal, Copy, Check, Code2, ShieldCheck, Send, ArrowRight } from "lucide-react";
import { toast } from "sonner";

export function ApiDocumentationView() {
  const [selectedEndpoint, setSelectedEndpoint] = useState<ApiEndpoint>(API_ENDPOINTS[0]);
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [simulatedResponse, setSimulatedResponse] = useState<any>(selectedEndpoint.responseBody);
  const [isSimulating, setIsSimulating] = useState(false);

  const filteredEndpoints = API_ENDPOINTS.filter(
    (ep) =>
      ep.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ep.path.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ep.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success("تم نسخ كود الـ cURL بنجاح!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleRunSimulation = (ep: ApiEndpoint) => {
    setIsSimulating(true);
    setSelectedEndpoint(ep);
    toast.info(`جاري إرسال طلب تجريبي إلى ${ep.path}...`);
    setTimeout(() => {
      setSimulatedResponse(ep.responseBody);
      setIsSimulating(false);
      toast.success("تم استلام الاستجابة بنجاح (HTTP 200/201 OK)");
    }, 600);
  };

  const getMethodBadge = (method: string) => {
    switch (method) {
      case "POST":
        return <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 font-mono text-xs">POST</Badge>;
      case "GET":
        return <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20 font-mono text-xs">GET</Badge>;
      case "PUT":
        return <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 font-mono text-xs">PUT</Badge>;
      case "DELETE":
        return <Badge className="bg-rose-500/10 text-rose-600 border-rose-500/20 font-mono text-xs">DELETE</Badge>;
      default:
        return <Badge variant="outline">{method}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-card/60 p-6 rounded-2xl border border-border/60 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2 text-foreground">
            <Code2 className="w-6 h-6 text-primary" />
            توثيق واجهات برمجة التطبيقات (API Endpoints & JSON Samples)
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            مرجع مطوري الأنظمة والجهات الحكومية والشركات للتعامل مع خدمات الهوية، التحقق، الكيانات، والمطابقة السيادية.
          </p>
        </div>
        <div className="w-full md:w-72">
          <Input
            placeholder="ابحث في المسارات أو الأقسام..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-background"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* قائمة المسارات الجانبية */}
        <div className="lg:col-span-4 space-y-3">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">
            مسارات النظام المتاحة ({filteredEndpoints.length})
          </h3>
          <div className="space-y-2 max-h-[650px] overflow-y-auto pr-1">
            {filteredEndpoints.map((ep) => (
              <div
                key={ep.id}
                onClick={() => handleRunSimulation(ep)}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                  selectedEndpoint.id === ep.id
                    ? "border-primary bg-primary/5 shadow-sm ring-1 ring-primary"
                    : "border-border/60 bg-card hover:border-border"
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  {getMethodBadge(ep.method)}
                  <span className="text-[10px] text-muted-foreground font-mono">{ep.category}</span>
                </div>
                <div className="font-bold text-sm text-foreground mb-1">{ep.title}</div>
                <div className="text-xs font-mono text-muted-foreground truncate">{ep.path}</div>
              </div>
            ))}
          </div>
        </div>

        {/* تفاصيل المسار المختار ومحاكي الاستعلام */}
        <div className="lg:col-span-8 space-y-6">
          <Card className="border border-border/60 shadow-md">
            <CardHeader className="border-b border-border/40 pb-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  {getMethodBadge(selectedEndpoint.method)}
                  <CardTitle className="text-lg font-bold">{selectedEndpoint.title}</CardTitle>
                </div>
                <Button
                  onClick={() => handleRunSimulation(selectedEndpoint)}
                  disabled={isSimulating}
                  size="sm"
                  className="gap-2"
                >
                  <Send className={`w-3.5 h-3.5 ${isSimulating ? "animate-spin" : ""}`} />
                  {isSimulating ? "جاري الإرسال..." : "تنفيذ تجريبي (Test Request)"}
                </Button>
              </div>
              <CardDescription className="text-xs font-mono mt-2 bg-muted/60 p-2 rounded border border-border/40 text-foreground">
                {selectedEndpoint.path}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">وصف الخدمة والسيادة</h4>
                <p className="text-sm text-foreground/90">{selectedEndpoint.description}</p>
                <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  <span>متطلبات المصادقة: <strong className="text-foreground">{selectedEndpoint.authRequired}</strong></span>
                </div>
              </div>

              {selectedEndpoint.requestBody && (
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">نموذج الطلب (Request JSON Schema)</h4>
                  </div>
                  <pre className="bg-slate-950 text-slate-200 p-4 rounded-xl text-xs font-mono overflow-x-auto border border-slate-800">
                    {JSON.stringify(selectedEndpoint.requestBody, null, 2)}
                  </pre>
                </div>
              )}

              <div>
                <div className="flex justify-between items-center mb-2">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">الاستجابة المتوقعة (Response JSON)</h4>
                  <span className="text-xs text-emerald-600 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">HTTP 200 OK</span>
                </div>
                <pre className="bg-slate-950 text-slate-300 p-4 rounded-xl text-xs font-mono overflow-x-auto border border-slate-800">
                  {JSON.stringify(simulatedResponse, null, 2)}
                </pre>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">مثال استخدام cURL</h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs gap-1.5"
                    onClick={() => handleCopy(selectedEndpoint.curlExample, selectedEndpoint.id)}
                  >
                    {copiedId === selectedEndpoint.id ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedId === selectedEndpoint.id ? "تم النسخ" : "نسخ الكود"}
                  </Button>
                </div>
                <div className="bg-slate-950 text-slate-300 p-4 rounded-xl text-xs font-mono overflow-x-auto border border-slate-800 relative">
                  <code>{selectedEndpoint.curlExample}</code>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
