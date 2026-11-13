import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Database, GitBranch, Shield, Package, ShoppingCart, Users, FileText, BarChart3, Building2, Landmark, Layers, Search, X, ChevronUp, ChevronDown, Copy, Download, Code2 } from "lucide-react";

interface ForeignKeyTarget {
  table: string;
  field: string;
}

interface FieldInfo {
  name: string;
  type: string;
  key?: "PK" | "FK";
  description: string;
  targets?: ForeignKeyTarget[];
}

interface TableInfo {
  name: string;
  description: string;
  layer: string;
  fields: FieldInfo[];
  relationships: string[];
  icon: React.ReactNode;
}

interface SearchResult {
  tableKey: string;
  fieldName?: string;
  kind: "table" | "field";
}

type KeyFilter = "all" | "pk" | "fk";

const tables: Record<string, TableInfo> = {
  USER: {
    name: "USER (Identities)",
    description: "الهوية الأساسية للفرد مع دعم الملفات المتعددة",
    layer: "Identity & KYC",
    fields: [
      { name: "id", type: "UUID", key: "PK", description: "المعرف الفريد للهوية" },
      { name: "email", type: "VARCHAR(255)", description: "البريد الإلكتروني الموثق" },
      { name: "phone", type: "VARCHAR(32)", description: "رقم الهاتف المستخدم في التحقق" },
      { name: "kyc_status", type: "ENUM", description: "حالة التحقق الشخصي" },
      { name: "created_at", type: "TIMESTAMPTZ", description: "وقت إنشاء الهوية" }
    ],
    relationships: ["1:1 → KYC_RECORD", "1:N → BUSINESS_MEMBERSHIP", "1:N → AUDIT_LOG"],
    icon: <Users className="w-4 h-4" />
  },
  KYC_RECORD: {
    name: "KYC_RECORD",
    description: "سجلات ومستندات التحقق الفردي المشفرة محلياً",
    layer: "Identity & KYC",
    fields: [
      { name: "id", type: "UUID", key: "PK", description: "معرف سجل التحقق" },
      { name: "user_id", type: "UUID", key: "FK", description: "يربط السجل بالهوية الأساسية", targets: [{ table: "USER", field: "id" }] },
      { name: "national_id_hash", type: "CHAR(64)", description: "بصمة غير قابلة للعكس لوثيقة الهوية" },
      { name: "document_urls", type: "JSONB", description: "مراجع المستندات المشفرة" },
      { name: "verified_at", type: "TIMESTAMPTZ", description: "وقت اعتماد KYC" }
    ],
    relationships: ["1:1 ← USER"],
    icon: <Shield className="w-4 h-4" />
  },
  BUSINESS_ENTITY: {
    name: "BUSINESS_ENTITY",
    description: "الشركات، المصانع، والأنشطة التجارية المستقلة",
    layer: "Business Entity",
    fields: [
      { name: "id", type: "UUID", key: "PK", description: "معرف الكيان التجاري" },
      { name: "name", type: "VARCHAR(255)", description: "الاسم القانوني أو التجاري" },
      { name: "commercial_register", type: "VARCHAR(64)", description: "رقم السجل التجاري" },
      { name: "tax_id", type: "VARCHAR(64)", description: "المعرف الضريبي" },
      { name: "kyb_status", type: "ENUM", description: "حالة التحقق التجاري" }
    ],
    relationships: ["1:N → BUSINESS_MEMBERSHIP", "1:N → PRODUCT", "1:N → TRADE_RELATIONSHIP"],
    icon: <Building2 className="w-4 h-4" />
  },
  GOVERNMENT_ENTITY: {
    name: "GOVERNMENT_ENTITY",
    description: "الوزارات والهيئات الحكومية ككيان مستقل (B2G)",
    layer: "Government Entity",
    fields: [
      { name: "id", type: "UUID", key: "PK", description: "معرف الجهة الحكومية" },
      { name: "entity_name", type: "VARCHAR(255)", description: "اسم الوزارة أو الهيئة" },
      { name: "gov_id_code", type: "VARCHAR(64)", description: "الرمز المؤسسي الرسمي" },
      { name: "procurement_auth", type: "BOOLEAN", description: "صلاحية تنفيذ المشتريات الحكومية" }
    ],
    relationships: ["1:N → TRADE_RELATIONSHIP", "1:N → GOV_TENDER"],
    icon: <Landmark className="w-4 h-4" />
  },
  BUSINESS_MEMBERSHIP: {
    name: "BUSINESS_MEMBERSHIP",
    description: "ربط المستخدمين بالكيانات والأدوار والصلاحيات (RBAC+ABAC)",
    layer: "Roles & Permissions",
    fields: [
      { name: "id", type: "UUID", key: "PK", description: "معرف العضوية" },
      { name: "user_id", type: "UUID", key: "FK", description: "المستخدم المفوض", targets: [{ table: "USER", field: "id" }] },
      { name: "business_id", type: "UUID", key: "FK", description: "الكيان الذي ينتمي إليه المستخدم", targets: [{ table: "BUSINESS_ENTITY", field: "id" }] },
      { name: "role", type: "ENUM", description: "الدور التنظيمي داخل الكيان" },
      { name: "permissions", type: "JSONB", description: "قيود RBAC وABAC الخاصة بالعضوية" }
    ],
    relationships: ["N:1 ← USER", "N:1 ← BUSINESS_ENTITY"],
    icon: <GitBranch className="w-4 h-4" />
  },
  TRADE_RELATIONSHIP: {
    name: "TRADE_RELATIONSHIP",
    description: "إدارة العلاقات التجارية للأنماط الخمسة (B2B, B2C, C2B, C2C, B2G)",
    layer: "Trade Models (5)",
    fields: [
      { name: "id", type: "UUID", key: "PK", description: "معرف العلاقة التجارية" },
      { name: "seller_entity_id", type: "UUID", key: "FK", description: "الطرف البائع أو مقدم العرض", targets: [{ table: "BUSINESS_ENTITY", field: "id" }] },
      { name: "buyer_entity_id", type: "UUID", key: "FK", description: "الطرف المشتري أو طالب العرض", targets: [{ table: "BUSINESS_ENTITY", field: "id" }, { table: "GOVERNMENT_ENTITY", field: "id" }] },
      { name: "business_model", type: "ENUM", description: "B2B أو B2C أو C2B أو C2C أو B2G" },
      { name: "access_scope", type: "JSONB", description: "حدود البيانات والإجراءات المسموح بها" },
      { name: "status", type: "ENUM", description: "حالة العلاقة التجارية" }
    ],
    relationships: ["N:1 ← BUSINESS_ENTITY", "N:1 ← GOVERNMENT_ENTITY", "1:N → MATCH"],
    icon: <Layers className="w-4 h-4" />
  },
  PRODUCT: {
    name: "PRODUCT (Product Identity)",
    description: "المنتج الموثق والمرتبط حصرياً بكيان (KYB)",
    layer: "Product Identity",
    fields: [
      { name: "id", type: "UUID", key: "PK", description: "معرف المنتج" },
      { name: "business_id", type: "UUID", key: "FK", description: "مالك المنتج أو المصنع الموثق", targets: [{ table: "BUSINESS_ENTITY", field: "id" }] },
      { name: "name", type: "VARCHAR(255)", description: "اسم المنتج" },
      { name: "hs_code", type: "VARCHAR(16)", description: "الرمز الجمركي" },
      { name: "verification_status", type: "ENUM", description: "حالة توثيق هوية المنتج" }
    ],
    relationships: ["N:1 ← BUSINESS_ENTITY", "1:N → MATCH"],
    icon: <Package className="w-4 h-4" />
  },
  MATCH: {
    name: "MATCH (Matching Engine)",
    description: "محرك المطابقة الواعي بالعلاقات والأهلية",
    layer: "Purchase & Matching",
    fields: [
      { name: "id", type: "UUID", key: "PK", description: "معرف نتيجة المطابقة" },
      { name: "requester_id", type: "UUID", key: "FK", description: "صاحب طلب المطابقة", targets: [{ table: "USER", field: "id" }, { table: "BUSINESS_ENTITY", field: "id" }, { table: "GOVERNMENT_ENTITY", field: "id" }] },
      { name: "target_id", type: "UUID", key: "FK", description: "الطرف أو المنتج المطابق", targets: [{ table: "PRODUCT", field: "id" }, { table: "BUSINESS_ENTITY", field: "id" }] },
      { name: "business_model", type: "ENUM", description: "النمط التجاري المستخدم في التقييم" },
      { name: "eligibility_score", type: "DECIMAL(5,2)", description: "درجة الأهلية والتوافق" }
    ],
    relationships: ["N:1 ← TRADE_RELATIONSHIP", "N:1 ← PRODUCT"],
    icon: <BarChart3 className="w-4 h-4" />
  },
  AUDIT_LOG: {
    name: "AUDIT_LOG (WORM)",
    description: "سجلات التدقيق غير القابلة للتعديل للحوكمة والأمان",
    layer: "Audit & Security",
    fields: [
      { name: "id", type: "UUID", key: "PK", description: "معرف حدث التدقيق" },
      { name: "actor_id", type: "UUID", key: "FK", description: "المستخدم أو النظام المنفذ", targets: [{ table: "USER", field: "id" }] },
      { name: "action_type", type: "VARCHAR(96)", description: "نوع العملية الحساسة" },
      { name: "immutable_hash", type: "CHAR(64)", description: "بصمة WORM لمنع التلاعب" },
      { name: "created_at", type: "TIMESTAMPTZ", description: "الطابع الزمني للحدث" }
    ],
    relationships: ["N:1 ← USER"],
    icon: <FileText className="w-4 h-4" />
  }
};

interface SqlPlaygroundQuery {
  id: string;
  label: string;
  query: string;
  description: string;
  columns: string[];
  rows: Record<string, string | number | boolean>[];
}

const PLAYGROUND_QUERIES: SqlPlaygroundQuery[] = [
  {
    id: "verified-businesses",
    label: "الشركات الموثقة KYB",
    query: `SELECT id, name, commercial_register, kyb_status \nFROM "BUSINESS_ENTITY" \nWHERE kyb_status = 'VERIFIED';`,
    description: "يستعلم عن الكيانات التجارية التي أتمت التحقق بنجاح وتحمل صفة VERIFIED للمشاركة في صفقات B2B.",
    columns: ["id", "name", "commercial_register", "kyb_status"],
    rows: [
      { id: "ent_egypt_steel_01", name: "شركة حديد الدلتا الصناعية", commercial_register: "CR-982341", kyb_status: "VERIFIED" },
      { id: "ent_cairo_pharma_02", name: "مجموعة القاهرة للأدوية والمستلزمات", commercial_register: "CR-441209", kyb_status: "VERIFIED" },
      { id: "ent_alex_logistics_03", name: "الإسكندرية للخدمات اللوجستية والتصدير", commercial_register: "CR-119283", kyb_status: "VERIFIED" },
    ],
  },
  {
    id: "trade-relationships",
    label: "علاقات التجارة الخمسة",
    query: `SELECT id, pattern, buyer_entity_id, supplier_entity_id, status \nFROM "TRADE_RELATIONSHIP" \nWHERE pattern IN ('B2B', 'B2G');`,
    description: "يستعرض العلاقات التجارية النشطة عبر نمطي B2B و B2G مع التحقق من الأهلية والترخيص.",
    columns: ["id", "pattern", "buyer_entity_id", "supplier_entity_id", "status"],
    rows: [
      { id: "rel_b2b_01", pattern: "B2B", buyer_entity_id: "ent_cairo_pharma_02", supplier_entity_id: "ent_egypt_steel_01", status: "ACTIVE" },
      { id: "rel_b2g_02", pattern: "B2G", buyer_entity_id: "gov_ministry_health", supplier_entity_id: "ent_cairo_pharma_02", status: "VERIFYING" },
      { id: "rel_b2b_03", pattern: "B2B", buyer_entity_id: "ent_alex_logistics_03", supplier_entity_id: "ent_egypt_steel_01", status: "ACTIVE" },
    ],
  },
  {
    id: "active-matching",
    label: "نتائج مطابقة المنتجات والكيانات",
    query: `SELECT id, product_id, buyer_entity_id, match_score, verification_passed \nFROM "MATCH" \nWHERE verification_passed = true \nORDER BY match_score DESC;`,
    description: "يعرض المطابقات الناجحة التي استوفت شروط KYC/KYB ومطابقة المعايير الصناعية.",
    columns: ["id", "product_id", "buyer_entity_id", "match_score", "verification_passed"],
    rows: [
      { id: "match_01", product_id: "prod_steel_rebar_12m", buyer_entity_id: "ent_alex_logistics_03", match_score: 98.5, verification_passed: true },
      { id: "match_02", product_id: "prod_pharma_vials_dx", buyer_entity_id: "gov_ministry_health", match_score: 96.2, verification_passed: true },
    ],
  },
  {
    id: "worm-audit",
    label: "سجلات التدقيق غير القابلة للتعديل (WORM)",
    query: `SELECT id, actor_user_id, action_type, entity_affected, timestamp \nFROM "AUDIT_LOG" \nORDER BY timestamp DESC \nLIMIT 3;`,
    description: "يراقب العمليات الحساسة وتغيرات الصلاحيات المسجلة بتقنية WORM غير القابلة للحذف أو التعديل.",
    columns: ["id", "actor_user_id", "action_type", "entity_affected", "timestamp"],
    rows: [
      { id: "audit_9981", actor_user_id: "usr_ahmed_owner", action_type: "KYB_VERIFICATION_APPROVE", entity_affected: "BUSINESS_ENTITY:ent_egypt_steel_01", timestamp: "2026-08-13T22:15:00Z" },
      { id: "audit_9982", actor_user_id: "usr_fatma_admin", action_type: "ROLE_PERMISSION_ASSIGN", entity_affected: "BUSINESS_MEMBERSHIP:mem_02", timestamp: "2026-08-13T22:30:12Z" },
      { id: "audit_9983", actor_user_id: "usr_system_engine", action_type: "MATCHING_ENGINE_RUN", entity_affected: "MATCH:match_01", timestamp: "2026-08-13T23:00:45Z" },
    ],
  },
];

const normalizeSqlType = (type: string) => (type === "ENUM" ? "VARCHAR(64)" : type);

const buildCreateTableSql = (tableKey: string, table: TableInfo) => {
  const columns = table.fields.map((field) => {
    const constraints = [field.key === "PK" ? "PRIMARY KEY" : ""];
    if (field.key === "FK" && field.targets?.length === 1) {
      const target = field.targets[0];
      constraints.push(`REFERENCES "${target.table}"("${target.field}")`);
    }
    return `  "${field.name}" ${normalizeSqlType(field.type)}${constraints.filter(Boolean).length ? ` ${constraints.filter(Boolean).join(" ")}` : ""}`;
  });
  const polymorphicReferences = table.fields
    .filter((field) => field.key === "FK" && field.targets && field.targets.length > 1)
    .flatMap((field) => field.targets?.map((target) => `-- Polymorphic FK ${field.name} → ${target.table}.${target.field}`) ?? []);
  return [
    `CREATE TABLE "${tableKey}" (`,
    `${columns.join(",\n")}${polymorphicReferences.length ? "," : ""}`,
    ...polymorphicReferences,
    ");",
  ].join("\n");
};

export default function ERDVisualization() {
  const [selectedTable, setSelectedTable] = useState<string>("USER");
  const [activeLayer, setActiveLayer] = useState<string>("All");
  const [keyFilter, setKeyFilter] = useState<KeyFilter>("all");
  const [activeForeignKey, setActiveForeignKey] = useState<{
    sourceTable: string;
    field: FieldInfo;
    targets: ForeignKeyTarget[];
  } | null>(null);
  const [sqlSelectedTable, setSqlSelectedTable] = useState<string>("USER");
  const [sqlMessage, setSqlMessage] = useState("");
  const [activePlaygroundQueryId, setActivePlaygroundQueryId] = useState<string>(PLAYGROUND_QUERIES[0].id);
  const [customSqlQuery, setCustomSqlQuery] = useState<string>(PLAYGROUND_QUERIES[0].query);
  const [playgroundResult, setPlaygroundResult] = useState<SqlPlaygroundQuery>(PLAYGROUND_QUERIES[0]);
  const [isExecutingQuery, setIsExecutingQuery] = useState(false);

  const layers = ["All", "Identity & KYC", "Business Entity", "Government Entity", "Roles & Permissions", "Trade Models (5)", "Product Identity", "Purchase & Matching", "Audit & Security"];
  
  const filteredTables = Object.entries(tables).filter(([, table]) => {
    const matchesLayer = activeLayer === "All" || table.layer === activeLayer;
    const hasPK = table.fields.some((field) => field.key === "PK");
    const hasFK = table.fields.some((field) => field.key === "FK");
    const matchesKeyFilter = keyFilter === "all" || (keyFilter === "pk" ? hasPK : hasFK);
    return matchesLayer && matchesKeyFilter;
  });
  const keyFilterCounts = {
    all: Object.keys(tables).length,
    pk: Object.values(tables).filter((table) => table.fields.some((field) => field.key === "PK")).length,
    fk: Object.values(tables).filter((table) => table.fields.some((field) => field.key === "FK")).length,
  };
  const selectedTableInfo = tables[selectedTable];
  const activeSqlTableKey = filteredTables.some(([tableKey]) => tableKey === sqlSelectedTable) ? sqlSelectedTable : filteredTables[0]?.[0] ?? "";
  const activeSqlTable = activeSqlTableKey ? tables[activeSqlTableKey] : null;
  const sqlStatements = filteredTables.map(([tableKey, table]) => buildCreateTableSql(tableKey, table));
  const sqlScript = sqlStatements.join("\n\n");

  const copySql = async (sql: string, message: string) => {
    try {
      await navigator.clipboard.writeText(sql);
      setSqlMessage(message);
      window.setTimeout(() => setSqlMessage(""), 2200);
    } catch {
      setSqlMessage("تعذر النسخ؛ استخدم زر التنزيل بدلاً منه");
    }
  };

  const downloadSql = () => {
    const blob = new Blob([sqlScript], { type: "text/sql;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `come-in-it-erd-${keyFilter}-${activeLayer === "All" ? "all-layers" : activeLayer.replace(/\s+/g, "-")}.sql`;
    anchor.click();
    URL.revokeObjectURL(url);
    setSqlMessage("تم تنزيل ملف SQL للجداول الظاهرة");
    window.setTimeout(() => setSqlMessage(""), 2200);
  };

  const handleSelectPlaygroundQuery = (queryObj: SqlPlaygroundQuery) => {
    setActivePlaygroundQueryId(queryObj.id);
    setCustomSqlQuery(queryObj.query);
    setPlaygroundResult(queryObj);
  };

  const handleExecutePlaygroundQuery = () => {
    setIsExecutingQuery(true);
    window.setTimeout(() => {
      const matched = PLAYGROUND_QUERIES.find((q) => q.id === activePlaygroundQueryId);
      if (matched) {
        setPlaygroundResult(matched);
      } else {
        setPlaygroundResult({
          id: "custom",
          label: "استعلام مخصص محاكى",
          query: customSqlQuery,
          description: "تم تنفيذ الاستعلام بنجاح على قاعدة البيانات السيادية الافتراضية.",
          columns: ["result_status", "affected_rows", "execution_time_ms", "security_check"],
          rows: [
            { result_status: "SUCCESS", affected_rows: 3, execution_time_ms: 12, security_check: "PASSED (WORM & RBAC Enforced)" }
          ],
        });
      }
      setIsExecutingQuery(false);
      setSqlMessage("تم تنفيذ الاستعلام بنجاح على محرك قاعدة البيانات السيادية");
      window.setTimeout(() => setSqlMessage(""), 2500);
    }, 350);
  };
  const highlightedTableNames = new Set(
    activeForeignKey
      ? [activeForeignKey.sourceTable, ...activeForeignKey.targets.map((target) => target.table)]
      : [],
  );
  const isTableHighlighted = (tableKey: string) => highlightedTableNames.has(tableKey);
  const isTargetTable = (tableKey: string) => Boolean(activeForeignKey?.targets.some((target) => target.table === tableKey));
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResultIndex, setSearchResultIndex] = useState(0);
  const normalizedSearchQuery = searchQuery.trim().toLowerCase();
  const searchResults: SearchResult[] = normalizedSearchQuery
    ? Object.entries(tables).flatMap(([tableKey, table]) => {
        const tableText = `${tableKey} ${table.name} ${table.description} ${table.layer}`.toLowerCase();
        const fieldMatches = table.fields.filter((field) =>
          `${field.name} ${field.type} ${field.description}`.toLowerCase().includes(normalizedSearchQuery),
        );
        return [
          ...(tableText.includes(normalizedSearchQuery) ? [{ tableKey, kind: "table" as const }] : []),
          ...fieldMatches.map((field) => ({ tableKey, fieldName: field.name, kind: "field" as const })),
        ];
      })
    : [];
  const searchTableKeys = new Set(searchResults.map((result) => result.tableKey));
  const searchFieldKeys = new Set(
    searchResults.filter((result) => result.fieldName).map((result) => `${result.tableKey}.${result.fieldName}`),
  );
  const activeSearchResult = searchResults[searchResultIndex] ?? null;

  const selectSearchResult = (result: SearchResult, index: number) => {
    setSearchResultIndex(index);
    setSelectedTable(result.tableKey);
    setActiveForeignKey(null);
  };

  const moveSearchResult = (direction: 1 | -1) => {
    if (!searchResults.length) return;
    const nextIndex = (searchResultIndex + direction + searchResults.length) % searchResults.length;
    selectSearchResult(searchResults[nextIndex], nextIndex);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-8">
        <div className="flex items-center gap-3 mb-4">
          <Database className="w-8 h-8 text-blue-400" />
          <h2 className="text-3xl font-bold text-white">Updated Entity Relationship Diagram (ERD v1.0)</h2>
        </div>
        <p className="text-slate-400 text-base">
          مخطط قاعدة البيانات المحدث ليعكس الهوية متعددة الملفات، كيانات الأعمال والجهات الحكومية، وعلاقات التجارة الخمسة (TradeRelationship).
        </p>
      </div>

      {/* ERD Search */}
      <Card className="border-slate-800 bg-slate-900/80">
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-cyan-300" />
              <input
                value={searchQuery}
                onChange={(event) => {
                  setSearchQuery(event.target.value);
                  setSearchResultIndex(0);
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    moveSearchResult(event.shiftKey ? -1 : 1);
                  }
                }}
                placeholder="ابحث عن جدول أو حقل أو نوع بيانات أو وصف..."
                aria-label="البحث داخل مخطط ERD"
                className="h-11 w-full rounded-xl border border-slate-700 bg-slate-950/80 px-10 text-right text-sm text-white outline-none transition-colors placeholder:text-slate-500 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setSearchResultIndex(0);
                  }}
                  aria-label="مسح بحث ERD"
                  className="absolute left-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <div className="flex items-center justify-between gap-3 text-xs text-slate-400 lg:min-w-[260px]">
              <span>
                {normalizedSearchQuery ? `${searchResults.length} نتيجة مطابقة` : "اكتب للبحث داخل الجداول والحقول"}
              </span>
              {searchResults.length > 0 && (
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => moveSearchResult(-1)}
                    aria-label="النتيجة السابقة"
                    className="rounded-md border border-slate-700 bg-slate-950 p-1.5 text-slate-300 transition-colors hover:border-cyan-400 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
                  >
                    <ChevronUp className="h-4 w-4" />
                  </button>
                  <span className="min-w-[54px] text-center font-mono text-[11px] text-cyan-200">
                    {searchResultIndex + 1}/{searchResults.length}
                  </span>
                  <button
                    type="button"
                    onClick={() => moveSearchResult(1)}
                    aria-label="النتيجة التالية"
                    className="rounded-md border border-slate-700 bg-slate-950 p-1.5 text-slate-300 transition-colors hover:border-cyan-400 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
          {activeSearchResult && (
            <button
              type="button"
              onClick={() => selectSearchResult(activeSearchResult, searchResultIndex)}
              className="mt-3 w-full rounded-lg border border-cyan-400/20 bg-cyan-400/5 px-3 py-2 text-right text-xs text-cyan-100 transition-colors hover:bg-cyan-400/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
            >
              النتيجة النشطة: <span className="font-mono">{activeSearchResult.tableKey}{activeSearchResult.fieldName ? `.${activeSearchResult.fieldName}` : ""}</span>
            </button>
          )}
        </CardContent>
      </Card>

      {/* Layer Filter */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        <span className="text-xs font-semibold text-slate-400 shrink-0">تصفية حسب الطبقة:</span>
        {layers.map((layer) => (
          <button
            key={layer}
            type="button"
            onClick={() => setActiveLayer(layer)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 ${
              activeLayer === layer
                ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
          >
            {layer}
          </button>
        ))}
      </div>

      {/* Key Filter */}
      <div className="flex flex-col gap-3 rounded-xl border border-slate-800 bg-slate-900/60 p-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 overflow-x-auto">
          <span className="shrink-0 text-xs font-semibold text-slate-400">مفاتيح الجداول:</span>
          {([
            ["all", "كل الجداول"],
            ["pk", "تحتوي PK"],
            ["fk", "تحتوي FK"],
          ] as const).map(([filter, label]) => (
            <button
              key={filter}
              type="button"
              onClick={() => setKeyFilter(filter)}
              aria-pressed={keyFilter === filter}
              className={`shrink-0 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 ${
                keyFilter === filter
                  ? "border-cyan-400/60 bg-cyan-400/15 text-cyan-100 shadow-md shadow-cyan-950/30"
                  : "border-slate-800 bg-slate-950/70 text-slate-400 hover:border-slate-600 hover:text-white"
              }`}
            >
              {label}
              <span className="mr-1 font-mono text-[10px] text-cyan-300/80">({keyFilterCounts[filter]})</span>
            </button>
          ))}
        </div>
        <span className="shrink-0 text-xs text-slate-500">
          ظاهر الآن: <span className="font-mono text-slate-300">{filteredTables.length}</span> من {Object.keys(tables).length} جدول
        </span>
      </div>

      {activeForeignKey && (
        <Card className="border-blue-400/40 bg-blue-950/20 shadow-lg shadow-blue-950/20">
          <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-blue-100">
                <GitBranch className="h-4 w-4 text-cyan-300" />
                مسار المفتاح الأجنبي النشط
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="rounded-lg border border-violet-400/40 bg-violet-400/10 px-2 py-1 font-mono text-violet-100">
                  {activeForeignKey.sourceTable}.{activeForeignKey.field.name}
                </span>
                <span className="text-slate-500">→</span>
                {activeForeignKey.targets.map((target) => (
                  <span key={`${target.table}.${target.field}`} className="rounded-lg border border-emerald-400/40 bg-emerald-400/10 px-2 py-1 font-mono text-emerald-100">
                    {target.table}.{target.field}
                  </span>
                ))}
              </div>
              <p className="mt-2 text-xs text-slate-400">تم تظليل جدول المصدر وجميع الجداول الهدف. انقر على FK آخر لتغيير المسار.</p>
            </div>
            <button
              type="button"
              onClick={() => setActiveForeignKey(null)}
              className="shrink-0 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-300 transition-colors hover:border-slate-500 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
            >
              إلغاء التظليل
            </button>
          </CardContent>
        </Card>
      )}

      {/* Interactive SQL Viewer */}
      <Card className="overflow-hidden border-emerald-400/20 bg-slate-900/80 shadow-xl shadow-emerald-950/10">
        <CardHeader className="border-b border-slate-800/80 pb-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg font-bold text-white">
                <Code2 className="h-5 w-5 text-emerald-300" />
                عارض SQL للجداول الظاهرة
              </CardTitle>
              <CardDescription className="mt-1 text-xs leading-5 text-slate-400">
                يولّد كود CREATE TABLE للجداول المعروضة حالياً وفق طبقة <span className="font-mono text-emerald-200">{activeLayer}</span> وفلتر المفاتيح <span className="font-mono text-emerald-200">{keyFilter.toUpperCase()}</span>.
              </CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => copySql(sqlScript, "تم نسخ SQL الكامل")}
                disabled={!sqlScript}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs font-semibold text-slate-200 transition-colors hover:border-emerald-400/60 hover:text-white disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
              >
                <Copy className="h-3.5 w-3.5" /> نسخ الكل
              </button>
              <button
                type="button"
                onClick={downloadSql}
                disabled={!sqlScript}
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-3 py-2 text-xs font-bold text-slate-950 transition-colors hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
              >
                <Download className="h-3.5 w-3.5" /> تنزيل .sql
              </button>
            </div>
          </div>
          {sqlMessage && <p className="mt-3 text-xs font-semibold text-emerald-200" role="status">{sqlMessage}</p>}
        </CardHeader>
        <CardContent className="space-y-4 p-4">
          <div className="flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="اختيار جدول SQL">
            {filteredTables.map(([tableKey, table]) => (
              <button
                key={tableKey}
                type="button"
                role="tab"
                aria-selected={activeSqlTableKey === tableKey}
                onClick={() => setSqlSelectedTable(tableKey)}
                className={`shrink-0 rounded-lg border px-3 py-2 text-xs font-mono transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 ${activeSqlTableKey === tableKey ? "border-emerald-400/60 bg-emerald-400/15 text-emerald-100" : "border-slate-800 bg-slate-950/70 text-slate-400 hover:border-slate-600 hover:text-white"}`}
              >
                {tableKey}
                <span className="mr-1 text-[10px] text-slate-500">({table.fields.length})</span>
              </button>
            ))}
          </div>
          {activeSqlTable && activeSqlTableKey ? (
            <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.35fr)]">
              <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <div>
                    <p className="font-mono text-sm font-bold text-white">{activeSqlTableKey}</p>
                    <p className="mt-1 text-[11px] text-slate-500">{activeSqlTable.description}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => copySql(buildCreateTableSql(activeSqlTableKey, activeSqlTable), `تم نسخ CREATE TABLE لـ ${activeSqlTableKey}`)}
                    className="rounded-md border border-slate-700 p-2 text-slate-400 transition-colors hover:border-emerald-400/60 hover:text-emerald-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
                    aria-label={`نسخ SQL لجدول ${activeSqlTableKey}`}
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
                <div className="space-y-2">
                  {activeSqlTable.fields.map((field) => (
                    <div key={field.name} className="flex items-center justify-between gap-3 rounded-lg border border-slate-800/80 bg-slate-900/70 px-3 py-2 text-xs">
                      <span className="font-mono text-slate-200">{field.name}</span>
                      <span className="flex items-center gap-2">
                        {field.key && <span className={`rounded px-1.5 py-0.5 font-mono text-[10px] ${field.key === "PK" ? "bg-amber-400/15 text-amber-200" : "bg-violet-400/15 text-violet-200"}`}>{field.key}</span>}
                        <span className="font-mono text-cyan-200">{normalizeSqlType(field.type)}</span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <pre className="max-h-[360px] overflow-auto rounded-xl border border-emerald-400/20 bg-[#07121a] p-4 text-left text-xs leading-6 text-emerald-100 shadow-inner" dir="ltr"><code>{activeSqlTable ? buildCreateTableSql(activeSqlTableKey, activeSqlTable) : ""}</code></pre>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-700 p-8 text-center text-sm text-slate-500">لا توجد جداول مطابقة للفلاتر الحالية لتوليد SQL.</div>
          )}
        </CardContent>
      </Card>

      {/* Interactive SQL Playground */}
      <Card className="overflow-hidden border-cyan-400/30 bg-slate-900/90 shadow-2xl shadow-cyan-950/20">
        <CardHeader className="border-b border-slate-800 pb-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg font-bold text-white">
                <Database className="h-5 w-5 text-cyan-300" />
                مساحة لعب استعلامات SQL السيادية (SQL Playground)
              </CardTitle>
              <CardDescription className="mt-1 text-xs leading-5 text-slate-400">
                اختبر استعلامات التحقق والامتثال والمطابقة مباشرة على نموذج قاعدة بيانات <span className="font-mono text-cyan-200">COME IN IT</span> مع استعراض النتائج الفورية وشرح قواعد الأمان.
              </CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleExecutePlaygroundQuery}
                disabled={isExecutingQuery}
                className="inline-flex items-center gap-2 rounded-lg bg-cyan-500 px-4 py-2 text-xs font-bold text-slate-950 transition-colors hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
              >
                {isExecutingQuery ? "جاري التنفيذ..." : "تنفيذ الاستعلام ⚡"}
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 p-4">
          <div className="flex flex-wrap gap-2" role="tablist" aria-label="أمثلة استعلامات SQL">
            {PLAYGROUND_QUERIES.map((q) => (
              <button
                key={q.id}
                type="button"
                role="tab"
                aria-selected={activePlaygroundQueryId === q.id}
                onClick={() => handleSelectPlaygroundQuery(q)}
                className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 ${
                  activePlaygroundQueryId === q.id
                    ? "border-cyan-400/60 bg-cyan-400/15 text-cyan-100 shadow-md shadow-cyan-950/30"
                    : "border-slate-800 bg-slate-950/70 text-slate-400 hover:border-slate-600 hover:text-white"
                }`}
              >
                {q.label}
              </button>
            ))}
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="sql-playground-input" className="block text-xs font-semibold text-slate-300">محرر الاستعلامات (SQL Editor):</label>
              <textarea
                id="sql-playground-input"
                value={customSqlQuery}
                onChange={(e) => {
                  setCustomSqlQuery(e.target.value);
                  setActivePlaygroundQueryId("custom");
                }}
                rows={5}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 p-3 font-mono text-xs leading-6 text-cyan-200 shadow-inner focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400"
                dir="ltr"
                placeholder="اكتب استعلام SQL هنا..."
              />
              <p className="text-[11px] text-slate-400">{playgroundResult.description}</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300">نتائج التنفيذ الآمن (Query Results):</span>
                <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 font-mono text-[10px] text-emerald-300 border border-emerald-500/30">
                  {playgroundResult.rows.length} صفوف مرجعة
                </span>
              </div>
              <div className="max-h-[190px] overflow-auto rounded-xl border border-slate-800 bg-slate-950/80 p-2">
                <table className="w-full text-left font-mono text-[11px]" dir="ltr">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400">
                      {playgroundResult.columns.map((col) => (
                        <th key={col} className="p-2 font-medium">{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {playgroundResult.rows.map((row, idx) => (
                      <tr key={idx} className="border-b border-slate-900/60 text-slate-200 hover:bg-slate-900/40">
                        {playgroundResult.columns.map((col) => (
                          <td key={col} className="p-2">{String(row[col] ?? "")}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tables Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTables.map(([tableKey, table]) => {
          const highlighted = isTableHighlighted(tableKey);
          const sourceTable = activeForeignKey?.sourceTable === tableKey;
          const targetTable = isTargetTable(tableKey);
          const searchMatch = searchTableKeys.has(tableKey);
          const activeSearchTable = activeSearchResult?.tableKey === tableKey;
          return (
            <button
              key={tableKey}
              type="button"
              aria-pressed={selectedTable === tableKey}
              onClick={() => setSelectedTable(tableKey)}
              className={`relative p-4 rounded-xl border-2 text-left transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 ${
                selectedTable === tableKey
                  ? "bg-blue-600/20 border-blue-500 shadow-lg shadow-blue-600/20"
                  : "bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900"
              } ${activeForeignKey && !highlighted ? "opacity-35 grayscale" : ""} ${normalizedSearchQuery && !searchMatch ? "opacity-30 grayscale" : ""} ${activeSearchTable ? "ring-2 ring-cyan-400/70 ring-offset-2 ring-offset-slate-950" : ""} ${sourceTable ? "ring-2 ring-violet-400/70 ring-offset-2 ring-offset-slate-950" : ""} ${targetTable ? "border-emerald-400/70 shadow-lg shadow-emerald-950/30" : ""}`}
            >
              {activeForeignKey && highlighted && (
                <span className={`absolute right-3 top-3 rounded-full px-2 py-1 text-[10px] font-semibold ${sourceTable ? "bg-violet-400/15 text-violet-200" : "bg-emerald-400/15 text-emerald-200"}`}>
                  {sourceTable ? "مصدر FK" : "هدف العلاقة"}
                </span>
              )}
              {normalizedSearchQuery && searchMatch && (
                <span className="absolute left-3 top-3 rounded-full bg-cyan-400/15 px-2 py-1 text-[10px] font-semibold text-cyan-200">
                  نتيجة بحث
                </span>
              )}
              <div className="flex items-center gap-2 mb-2">
                <div className={selectedTable === tableKey ? "text-blue-400" : highlighted ? "text-emerald-300" : "text-slate-400"}>
                  {table.icon}
                </div>
                <h3 className="font-bold text-white text-sm">{table.name}</h3>
              </div>
              <p className="text-xs text-slate-400 mb-2">{table.description}</p>
              <Badge variant="outline" className="text-xs bg-slate-800/50 text-slate-300 border-slate-700">
                {table.layer}
              </Badge>
            </button>
          );
        })}
      </div>

      {/* Table Details */}
      {selectedTableInfo && (
        <Card className="bg-slate-900/80 border-slate-800">
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
                {selectedTableInfo.icon}
              </div>
              <div>
                <CardTitle className="text-xl font-bold text-white">{selectedTableInfo.name}</CardTitle>
                <CardDescription className="text-slate-400 text-sm mt-1">
                  {selectedTableInfo.description}
                </CardDescription>
              </div>
            </div>
            <Badge className="w-fit bg-blue-500/10 text-blue-400 border-blue-500/20">
              {selectedTableInfo.layer}
            </Badge>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <Database className="w-4 h-4 text-blue-400" />
                الحقول الأساسية
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {selectedTableInfo.fields.map((field) => (
                  <button
                    key={field.name}
                    type="button"
                    title={`${field.name}: ${field.description}`}
                    aria-label={`تفاصيل الحقل ${field.name}`}
                    aria-pressed={Boolean(activeForeignKey?.sourceTable === selectedTable && activeForeignKey.field.name === field.name)}
                    onClick={() => {
                      if (field.key === "FK" && field.targets?.length) {
                        setActiveForeignKey({ sourceTable: selectedTable, field, targets: field.targets });
                      } else {
                        setActiveForeignKey(null);
                      }
                    }}
                    className={`group relative text-right rounded-xl border p-3 transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-400/70 hover:bg-blue-950/20 hover:shadow-lg hover:shadow-blue-950/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 ${
                      activeForeignKey?.sourceTable === selectedTable && activeForeignKey.field.name === field.name
                        ? "border-violet-400 bg-violet-950/30 shadow-lg shadow-violet-950/30"
                        : searchFieldKeys.has(`${selectedTable}.${field.name}`)
                          ? "border-cyan-400 bg-cyan-950/30 shadow-lg shadow-cyan-950/30"
                          : "border-slate-800 bg-slate-950/80"
                    } ${normalizedSearchQuery && !searchFieldKeys.has(`${selectedTable}.${field.name}`) ? "opacity-35" : ""} ${activeSearchResult?.tableKey === selectedTable && activeSearchResult.fieldName === field.name ? "ring-2 ring-cyan-300 ring-offset-2 ring-offset-slate-900" : ""} ${field.key === "FK" ? "cursor-crosshair" : ""}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-xs font-semibold text-slate-100">{field.name}</span>
                      <span className="rounded-md border border-cyan-400/30 bg-cyan-400/10 px-2 py-1 font-mono text-[10px] text-cyan-200 transition-colors group-hover:border-cyan-300/60 group-hover:text-cyan-100">
                        {field.type}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      {field.key && (
                        <span className={`rounded-md px-1.5 py-0.5 font-mono text-[10px] font-bold ${field.key === "PK" ? "bg-amber-400/15 text-amber-200 border border-amber-400/30" : "bg-violet-400/15 text-violet-200 border border-violet-400/30"}`}>
                          {field.key}
                        </span>
                      )}
                      <span className="text-[11px] text-slate-500 transition-colors group-hover:text-slate-300">
                        {field.key === "FK" ? "انقر لتظليل العلاقة المرتبطة" : "مرر أو ركّز لعرض الوصف"}
                      </span>
                    </div>
                    <span className="pointer-events-none absolute inset-x-3 top-full z-30 mt-2 hidden rounded-lg border border-blue-400/30 bg-slate-950/95 p-3 text-xs leading-5 text-slate-200 shadow-2xl shadow-black/40 backdrop-blur group-hover:block group-focus-visible:block">
                      <span className="mb-1 block font-semibold text-blue-200">تفاصيل الحقل</span>
                      {field.description}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                  <GitBranch className="w-4 h-4 text-indigo-400" />
                  العلاقات المعمارية
                </h4>
                <div className="flex items-center gap-2 text-[10px] text-slate-500">
                  <span className="rounded border border-amber-400/30 bg-amber-400/10 px-1.5 py-0.5 text-amber-200">PK</span>
                  <span className="rounded border border-violet-400/30 bg-violet-400/10 px-1.5 py-0.5 text-violet-200">FK</span>
                  <span>المفتاح الأساسي / المرجعي</span>
                </div>
              </div>
              <div className="space-y-2">
                {selectedTableInfo.relationships.map((rel, idx) => (
                  <div
                    key={idx}
                    className="px-4 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300 font-mono"
                  >
                    {rel}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Key Architectural Constraints */}
      <Card className="bg-slate-900/80 border-slate-800">
        <CardHeader>
          <CardTitle className="text-lg font-bold text-white">القيود المعمارية المرتبطة بالجداول</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { rule: "Multi-Profile Identity", desc: "المستخدم (USER) يربطه جدول KYC_RECORD بالهوية، ويمكنه الارتباط بعدة كيانات تجارية أو حكومية عبر BUSINESS_MEMBERSHIP." },
              { rule: "TradeRelationship Engine", desc: "العلاقات التجارية (B2B, B2C, C2B, C2C, B2G) تُدار عبر TRADE_RELATIONSHIP لتحديد الأهلية والوصول بدلاً من افتراض نوع ثابت." },
              { rule: "Government Entity Isolation", desc: "الجهات الحكومية (GOVERNMENT_ENTITY) تمتلك جداول وعلاقات مستقلة لضمان أمان المناقصات والتعاملات المؤسسية (B2G)." },
              { rule: "Product Verification Constraint", desc: "لا يُسمح بإدراج أي منتج (PRODUCT) أو ربطه بمحرك المطابقة (MATCH) دون نجاح توثيق KYB للكيان ومرور المنتج بمرحلة التحقق." }
            ].map((item, idx) => (
              <div key={idx} className="flex gap-3 p-3 rounded-lg bg-slate-950/60 border border-slate-800">
                <Shield className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-white">{item.rule}</h4>
                  <p className="text-xs text-slate-400 mt-1">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
