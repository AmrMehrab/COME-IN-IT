// Style reminder: the reconciliation surface uses a dark sovereign-console language,
// compact evidence-led cards, restrained status colors, and explicit conditions over hype.

export type ReconciliationStatus = "aligned" | "conditional" | "gap" | "out-of-scope";
export type Severity = "critical" | "high" | "medium";

export const reconciliationSummary = {
  baseline: "COME IN IT V1.0",
  target: "V1.1 execution baseline",
  verdict: "READY WITH CONDITIONS",
  reviewedAt: "14 أغسطس 2026",
  governingRule: "لا جهة مجهولة تتاجر مع جهة مجهولة، ولا يُتداول عرض مجهول.",
  scope: "تصميم كنسي، نماذج ثقة وتجارة، lifecycle، baseline API، صلاحيات، رؤية، تدقيق، وسيادة مصرية.",
};

export const trustSequence = [
  { step: 1, label: "KYC", caption: "Person / Verified Identity", tone: "cyan" },
  { step: 2, label: "KYB", caption: "Entity verification", tone: "blue" },
  { step: 3, label: "Membership", caption: "Person ↔ Entity", tone: "indigo" },
  { step: 4, label: "Role", caption: "Authorized function", tone: "violet" },
  { step: 5, label: "Permission", caption: "RBAC + ABAC", tone: "purple" },
  { step: 6, label: "Offering", caption: "Product / Service / Asset", tone: "amber" },
  { step: 7, label: "Matching", caption: "Demand ↔ Offering", tone: "orange" },
  { step: 8, label: "Trade", caption: "Contract → Order → Transaction", tone: "emerald" },
  { step: 9, label: "Audit", caption: "WORM event trail", tone: "teal" },
  { step: 10, label: "Intelligence", caption: "Aggregated insight", tone: "sky" },
];

export const reconciliationAreas = [
  {
    id: "trust",
    title: "Trust & Identity",
    status: "aligned" as ReconciliationStatus,
    summary: "تم تثبيت الفصل بين Person وAccount وEntity، مع KYC/KYB وMembership قبل الأدوار والصلاحيات.",
    evidence: "Canonical §2–§4 · JSON entities: PERSON, IDENTITY, ENTITY, MEMBERSHIP",
  },
  {
    id: "ecosystem",
    title: "Trade Ecosystem",
    status: "aligned" as ReconciliationStatus,
    summary: "تمت مصالحة Product-only Marketplace إلى منظومة تشمل Product وService وUsed Asset وDemand.",
    evidence: "Canonical §11 · B2B/B2C/C2B/C2C/B2G ownership rules",
  },
  {
    id: "canonical-model",
    title: "Canonical Entity Model",
    status: "conditional" as ReconciliationStatus,
    summary: "النموذج الكنسي أضاف Contract وOrder وTransaction وDispute وEvidence وNotification وCertificate.",
    evidence: "Canonical JSON + ERD · migration and FK constraints remain implementation work",
  },
  {
    id: "access",
    title: "RBAC + ABAC + Visibility",
    status: "gap" as ReconciliationStatus,
    summary: "المصفوفة الحالية تشرح الأدوار لكنها لا تطبق كامل سمات السياق مثل geography وclassification وgovernment_scope.",
    evidence: "permissionsMatrix.ts · Canonical §8–§9 · V1.1 policy engine required",
  },
  {
    id: "api-workflows",
    title: "API & Workflows",
    status: "gap" as ReconciliationStatus,
    summary: "العقود الحالية تغطي ستة أمثلة فقط، بينما baseline يطلب مسارات lifecycle والتدقيق والرفض من WF-001 إلى WF-030.",
    evidence: "apiDocsData.ts · Workflows WF-001…WF-030 · contract tests required",
  },
  {
    id: "sovereignty",
    title: "Egyptian Sovereignty",
    status: "conditional" as ReconciliationStatus,
    summary: "قاعدة الاستضافة داخل مصر وتصنيف البيانات مثبتة؛ مزود السحابة والربط الحكومي الفعلي خارج النطاق.",
    evidence: "Canonical §15 + out-of-scope register · legal and provider approval pending",
  },
];

export const gapRegister = [
  {
    id: "G-001",
    severity: "critical" as Severity,
    area: "Entity lifecycle",
    title: "كيانات التجارة التشغيلية غير مكتملة في Baseline السابق",
    finding: "Contract وOrder وTransaction وDispute وEvidence لم تكن ممثلة بالكامل في JSON السابق.",
    decision: "اعتماد النموذج الكنسي الجديد مع migration غير هدّامة وقواعد FK صريحة.",
    owner: "Domain + Data Architecture",
    status: "Resolved in canonical model",
  },
  {
    id: "G-002",
    severity: "critical" as Severity,
    area: "Policy enforcement",
    title: "RBAC الحالي لا يكفي وحده لحراسة الوصول التجاري",
    finding: "التحقق من الدور لا يثبت صلاحية السياق أو العلاقة أو تصنيف البيانات.",
    decision: "تطبيق server-side policy decision point يجمع RBAC وABAC وحالة lifecycle.",
    owner: "Security + Authorization",
    status: "Open for V1.1",
  },
  {
    id: "G-003",
    severity: "high" as Severity,
    area: "API contract",
    title: "تغطية API الحالية جزئية",
    finding: "العقود المعروضة تغطي KYC وKYB وOffering وMatching وAudit فقط.",
    decision: "إكمال contract catalog للعضوية والعروض والطلب والعقد والطلبية والمعاملة والنزاع.",
    owner: "API Platform",
    status: "Open for V1.1",
  },
  {
    id: "G-004",
    severity: "high" as Severity,
    area: "Workflow integrity",
    title: "المحاكيات الحالية توضيحية وليست state machines خلفية",
    finding: "الواجهة تعرض التدفق لكنها لا تنفذ انتقالات محكومة أو منعًا فعليًا للانتقالات غير الصحيحة.",
    decision: "نقل lifecycle إلى خدمات خلفية مع idempotency وaudit event لكل انتقال.",
    owner: "Platform Engineering",
    status: "Open for V1.1",
  },
  {
    id: "G-005",
    severity: "medium" as Severity,
    area: "Sovereign integration",
    title: "الربط الحكومي والتوقيع الفعلي خارج النطاق",
    finding: "لا توجد بيانات اعتماد أو موافقات قانونية أو عقد مزود محدد.",
    decision: "الإبقاء على محاكاة آمنة حتى اعتماد الجهة والموصل وسياسة المفاتيح.",
    owner: "Legal + Government Relations",
    status: "Explicitly out of scope",
  },
];

export const decisionLedger = [
  { id: "D-001", label: "Trust sequence", decision: "KYC → KYB → Membership → Role → Permission → Offering → Matching → Trade → Audit → Intelligence", status: "accepted" },
  { id: "D-002", label: "Ownership", decision: "User لا يساوي Business؛ الملكية والعلاقة التمثيلية كيانات مستقلة.", status: "accepted" },
  { id: "D-003", label: "Offering verification", decision: "صلاحية Product/Service/Used Asset مستقلة عن KYB لصاحب العرض.", status: "accepted" },
  { id: "D-004", label: "Visibility", decision: "Public / Verified / Restricted / Confidential-Sovereign مع ABAC وسياق العلاقة.", status: "accepted" },
  { id: "D-005", label: "Cloud posture", decision: "البيانات الحساسة والمنظمة داخل مصر؛ Hybrid يقتصر على ما يسمح به التصنيف.", status: "conditional" },
  { id: "D-006", label: "Production claim", decision: "READY WITH CONDITIONS؛ لا إعلان جاهزية نهائية قبل الاختبارات والاعتمادات.", status: "conditional" },
];

export const acceptanceCriteria = [
  { id: "AC-001", area: "Identity", given: "Person لديه KYC Verified", when: "يطلب إنشاء Business Membership", then: "ينشأ الارتباط دون تحويل User إلى Business تلقائيًا." },
  { id: "AC-002", area: "KYB", given: "Entity في حالة Under Review", when: "يحاول ممثلها بدء B2B interaction", then: "يرفض الطلب ولا ينشأ Trade Relationship." },
  { id: "AC-003", area: "Offering", given: "Business Verified لكن Offering غير موثق", when: "يطلب نشر العرض للمطابقة", then: "يبقى العرض غير قابل للتداول التجاري." },
  { id: "AC-004", area: "ABAC", given: "Role يسمح بالفعل لكن geography أو data classification غير متوافق", when: "يصل الطلب إلى policy engine", then: "يرفض الطلب ويسجل Audit Event بسبب الرفض." },
  { id: "AC-005", area: "Trade", given: "Match مؤهل بين طرفين", when: "يتم إنشاء Contract", then: "لا تعتبر العملية Transaction مكتملة قبل Order وTransaction lifecycle." },
  { id: "AC-006", area: "Audit", given: "تغيير حالة حساسة", when: "ينفذ Actor العملية", then: "يسجل الحدث ببصمة وسبب ووقت ولا يمكن تعديله." },
  { id: "AC-007", area: "Sovereignty", given: "بيانات مصنفة Confidential/Sovereign", when: "يطلب مسار Hybrid", then: "يمنع النقل ويحتفظ بالبيانات داخل Egypt sovereign boundary." },
  { id: "AC-008", area: "Dispute", given: "Evidence مرتبط بعقد أو طلبية", when: "يصدر قرار الوساطة", then: "يبقى الأصل محفوظًا ويصدر القرار كبصمة WORM مستقلة." },
];

export const traceabilityRows = [
  { requirement: "KYC/KYB gate", entity: "PERSON, IDENTITY, ENTITY, VERIFICATION", workflow: "WF-001…WF-006", api: "identity.verify / entity.verify", ui: "Data Flow + Certificate", audit: "verification.status.changed" },
  { requirement: "Commercial access", entity: "MEMBERSHIP, ROLE, PERMISSION, RELATIONSHIP", workflow: "WF-007…WF-012", api: "membership.assign / access.evaluate", ui: "Permissions Matrix", audit: "access.denied / granted" },
  { requirement: "Offering integrity", entity: "OFFERING, OFFERING_VERIFICATION", workflow: "WF-013…WF-016", api: "offering.register / verify", ui: "ERD + API Docs", audit: "offering.lifecycle.changed" },
  { requirement: "Trade completion", entity: "MATCH, OFFER, CONTRACT, ORDER, TRANSACTION", workflow: "WF-017…WF-023", api: "match.evaluate / contract.create", ui: "Trade Analytics", audit: "trade.lifecycle.changed" },
  { requirement: "Dispute evidence", entity: "DISPUTE, EVIDENCE, RESOLUTION", workflow: "WF-024…WF-027", api: "dispute.open / evidence.submit", ui: "Dispute Simulator", audit: "dispute.decision.issued" },
  { requirement: "Sovereign audit", entity: "AUDIT_EVENT, CERTIFICATE, NOTIFICATION", workflow: "WF-028…WF-030", api: "audit.query / certificate.issue", ui: "WORM Dashboard", audit: "worm.hash.anchored" },
];

