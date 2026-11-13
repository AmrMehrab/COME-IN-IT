export type DemoKycStatus = "unverified" | "pending" | "verified" | "rejected";
export type DemoKybStatus = "unverified" | "pending" | "verified" | "rejected";
export type DemoTradeMode = "b2b" | "b2c" | "c2b" | "c2c" | "b2g";
export type DemoAction =
  | "submit_kyc"
  | "review_kyc"
  | "create_business"
  | "submit_kyb"
  | "review_kyb"
  | "activate_membership"
  | "create_offering"
  | "verify_offering"
  | "create_demand"
  | "evaluate_match"
  | "view_aggregate";

export type DemoPersona = {
  id: string;
  name: string;
  title: string;
  organization?: string;
  role: "consumer" | "owner" | "authorized_representative" | "compliance_reviewer" | "government_analyst";
  kycStatus: DemoKycStatus;
  businessId?: string;
  accent: "amber" | "emerald" | "sky" | "violet" | "rose";
};

type DemoBusiness = {
  id: string;
  legalName: string;
  entityType: "factory" | "buyer" | "store" | "service_provider";
  ownerId: string;
  kybStatus: DemoKybStatus;
  membershipActive: boolean;
};

type DemoOffering = {
  id: string;
  ownerId: string;
  businessId?: string;
  title: string;
  offeringType: "product" | "service" | "used_asset";
  status: "draft" | "pending" | "verified";
};

type DemoDemand = {
  id: string;
  createdById: string;
  title: string;
  mode: DemoTradeMode;
  status: "draft" | "published" | "matching";
};

export type DemoAuditEvent = {
  id: string;
  actor: string;
  action: string;
  resource: string;
  result: "allowed" | "denied";
  classification: "verified" | "restricted" | "confidential_sovereign";
  timestamp: string;
  reason: string;
};

export type SimulationState = {
  personas: DemoPersona[];
  businesses: DemoBusiness[];
  offerings: DemoOffering[];
  demands: DemoDemand[];
  matches: Array<{ id: string; demandId: string; offeringId: string; status: "eligible" | "ineligible"; score: number }>;
  audit: DemoAuditEvent[];
  sequence: number;
};

export type SimulationCommand = {
  action: DemoAction;
  actorId: string;
  targetId?: string;
  mode: DemoTradeMode;
  label: string;
};

export type PermissionDecision = {
  allowed: boolean;
  rule: string;
  reason: string;
  missing?: string[];
};

export type DemoScenario = {
  id: string;
  mode: DemoTradeMode;
  title: string;
  shortTitle: string;
  description: string;
  intent: string;
  steps: SimulationCommand[];
};

const baseState: SimulationState = {
  personas: [
    {
      id: "lina",
      name: "لينا فؤاد",
      title: "ممثلة مصنع — قيد التحقق",
      organization: "مصنع النيل للأدوات الهندسية",
      role: "owner",
      kycStatus: "unverified",
      businessId: "nile-factory",
      accent: "amber",
    },
    {
      id: "fadi",
      name: "فادي منصور",
      title: "مدير مشتريات",
      organization: "الشروق للتوريدات",
      role: "authorized_representative",
      kycStatus: "verified",
      businessId: "shorouk-buyer",
      accent: "emerald",
    },
    {
      id: "samir",
      name: "سمير حاتم",
      title: "مالك متجر موثق",
      organization: "متجر نقطة بيع",
      role: "owner",
      kycStatus: "verified",
      businessId: "point-store",
      accent: "sky",
    },
    {
      id: "huda",
      name: "هدى أمين",
      title: "مستهلك موثق",
      role: "consumer",
      kycStatus: "verified",
      accent: "violet",
    },
    {
      id: "nour",
      name: "نور صلاح",
      title: "مراجع امتثال",
      role: "compliance_reviewer",
      kycStatus: "verified",
      accent: "rose",
    },
    {
      id: "gov",
      name: "مراقب جهة عامة",
      title: "محلل مؤشرات مجمعة",
      role: "government_analyst",
      kycStatus: "verified",
      accent: "amber",
    },
  ],
  businesses: [
    { id: "nile-factory", legalName: "مصنع النيل للأدوات الهندسية", entityType: "factory", ownerId: "lina", kybStatus: "unverified", membershipActive: false },
    { id: "shorouk-buyer", legalName: "الشروق للتوريدات", entityType: "buyer", ownerId: "fadi", kybStatus: "verified", membershipActive: true },
    { id: "point-store", legalName: "متجر نقطة بيع", entityType: "store", ownerId: "samir", kybStatus: "verified", membershipActive: true },
  ],
  offerings: [],
  demands: [],
  matches: [],
  audit: [],
  sequence: 0,
};

export const createInitialSimulationState = (): SimulationState => JSON.parse(JSON.stringify(baseState)) as SimulationState;

const actor = (state: SimulationState, actorId: string) => state.personas.find(persona => persona.id === actorId);
const businessOf = (state: SimulationState, actorId: string) => state.businesses.find(business => business.ownerId === actorId);
const verifiedBusinessAccess = (state: SimulationState, actorId: string) => {
  const person = actor(state, actorId);
  const business = businessOf(state, actorId);
  return Boolean(person?.kycStatus === "verified" && business?.kybStatus === "verified" && business.membershipActive);
};

const noActor = (): PermissionDecision => ({ allowed: false, rule: "SIM-AUTH-000", reason: "الشخصية غير معرفة في سياق المحاكاة." });

export function evaluateDemoPermission(state: SimulationState, command: SimulationCommand): PermissionDecision {
  const person = actor(state, command.actorId);
  if (!person) return noActor();
  const target = command.targetId ? actor(state, command.targetId) : undefined;
  const targetBusiness = command.targetId ? state.businesses.find(business => business.id === command.targetId) : undefined;

  switch (command.action) {
    case "submit_kyc":
      return person.kycStatus === "unverified"
        ? { allowed: true, rule: "SIM-TRUST-001", reason: "يمكن بدء KYC للشخصية غير المتحققة في وضع العرض." }
        : { allowed: false, rule: "SIM-TRUST-001", reason: "لا يقبل النظام طلب KYC جديداً بعد بدء أو اكتمال التحقق." };
    case "review_kyc":
      return person.role === "compliance_reviewer" && target?.kycStatus === "pending"
        ? { allowed: true, rule: "SIM-TRUST-002", reason: "مراجع الامتثال هو الوحيد المخول باعتماد KYC قيد المراجعة." }
        : { allowed: false, rule: "SIM-TRUST-002", reason: "يتطلب الفعل مراجع امتثال وطلب KYC قيد المراجعة." };
    case "create_business":
      return person.kycStatus === "verified" && person.role !== "consumer"
        ? { allowed: true, rule: "SIM-TRUST-003", reason: "KYC متحقق والشخصية تملك دوراً تجارياً." }
        : { allowed: false, rule: "SIM-TRUST-003", reason: "إنشاء النشاط يتطلب KYC متحققاً ودوراً تجارياً." };
    case "submit_kyb":
      return person.kycStatus === "verified" && person.role === "owner" && targetBusiness?.ownerId === person.id
        ? { allowed: true, rule: "SIM-TRUST-004", reason: "المالك المتحقق يمكنه إحالة KYB لنشاطه فقط." }
        : { allowed: false, rule: "SIM-TRUST-004", reason: "KYB يتطلب مالكاً متحققاً ونشاطاً تابعاً له." };
    case "review_kyb":
      return person.role === "compliance_reviewer" && targetBusiness?.kybStatus === "pending"
        ? { allowed: true, rule: "SIM-TRUST-005", reason: "المراجعة منفصلة عن المالك وتقبل KYB قيد المراجعة فقط." }
        : { allowed: false, rule: "SIM-TRUST-005", reason: "يتطلب الفعل مراجع امتثال وKYB قيد المراجعة." };
    case "activate_membership":
      return person.role === "compliance_reviewer" && targetBusiness?.kybStatus === "verified"
        ? { allowed: true, rule: "SIM-TRUST-006", reason: "لا تُفعل العضوية قبل اعتماد KYB." }
        : { allowed: false, rule: "SIM-TRUST-006", reason: "تنشيط العضوية يتطلب KYB متحققاً ومراجع امتثال." };
    case "create_offering": {
      const c2cAllowed = command.mode === "c2c" && person.role === "consumer" && person.kycStatus === "verified";
      if (c2cAllowed) return { allowed: true, rule: "SIM-TRADE-001", reason: "يسمح C2C بأصل مستعمل لشخصية مستهلك متحققة فقط." };
      return verifiedBusinessAccess(state, person.id)
        ? { allowed: true, rule: "SIM-TRADE-001", reason: "العرض التجاري يتطلب KYC وKYB وعضوية نشطة." }
        : { allowed: false, rule: "SIM-TRADE-001", reason: "العرض محجوب حتى اكتمال KYC وKYB والعضوية النشطة." };
    }
    case "verify_offering": {
      const offering = state.offerings.find(item => item.id === command.targetId) ?? state.offerings.find(item => item.status === "pending");
      return person.role === "compliance_reviewer" && offering?.status === "pending"
        ? { allowed: true, rule: "SIM-TRADE-002", reason: "فصل الواجبات يمنع صاحب العرض من اعتماده ذاتياً." }
        : { allowed: false, rule: "SIM-TRADE-002", reason: "يتطلب اعتماد العرض مراجع امتثال وعرضاً قيد المراجعة." };
    }
    case "create_demand":
      if (command.mode === "b2b") {
        return verifiedBusinessAccess(state, person.id)
          ? { allowed: true, rule: "SIM-TRADE-003", reason: "طلب B2B يتطلب ثقة تجارية مكتملة." }
          : { allowed: false, rule: "SIM-TRADE-003", reason: "طلب B2B محجوب حتى اكتمال الثقة التجارية." };
      }
      return person.kycStatus === "verified"
        ? { allowed: true, rule: "SIM-TRADE-003", reason: "هذا المسار الخيالي يتطلب هوية شخصية متحققة." }
        : { allowed: false, rule: "SIM-TRADE-003", reason: "إنشاء الطلب يتطلب KYC متحققاً." };
    case "evaluate_match": {
      const hasVerifiedOffering = state.offerings.some(item => item.status === "verified");
      const hasDemand = state.demands.some(item => item.mode === command.mode && item.status === "published");
      const access = command.mode === "b2b" ? verifiedBusinessAccess(state, person.id) : person.kycStatus === "verified";
      return access && hasVerifiedOffering && hasDemand
        ? { allowed: true, rule: "SIM-TRADE-004", reason: "يتطلب التطابق طرفاً مؤهلاً وطلباً منشوراً وعرضاً متحققاً." }
        : { allowed: false, rule: "SIM-TRADE-004", reason: "لا يمكن تقييم المطابقة قبل التحقق المستقل للعرض ونشر الطلب وأهلية الطرف." };
    }
    case "view_aggregate":
      return person.role === "government_analyst" || person.role === "compliance_reviewer"
        ? { allowed: true, rule: "SIM-VISIBILITY-001", reason: "تقتصر الجهة العامة على المؤشرات المجمعة في بيئة العرض." }
        : { allowed: false, rule: "SIM-VISIBILITY-001", reason: "المؤشرات المجمعة محجوبة عن أدوار السوق العادية في هذا السيناريو." };
  }
}

const nextId = (state: SimulationState, prefix: string) => `${prefix}-${state.sequence + 1}`;
const clone = (state: SimulationState): SimulationState => JSON.parse(JSON.stringify(state)) as SimulationState;

function appendAudit(next: SimulationState, command: SimulationCommand, decision: PermissionDecision) {
  const person = actor(next, command.actorId);
  next.sequence += 1;
  next.audit.unshift({
    id: nextId(next, "sim-audit"),
    actor: person?.name ?? "شخصية غير معرفة",
    action: command.label,
    resource: command.mode.toUpperCase(),
    result: decision.allowed ? "allowed" : "denied",
    classification: command.action === "view_aggregate" ? "confidential_sovereign" : "verified",
    timestamp: `T+${String(next.sequence).padStart(2, "0")}`,
    reason: decision.reason,
  });
}

export function executeSimulationCommand(state: SimulationState, command: SimulationCommand) {
  const next = clone(state);
  const decision = evaluateDemoPermission(next, command);
  if (decision.allowed) {
    switch (command.action) {
      case "submit_kyc": {
        const person = actor(next, command.actorId);
        if (person) person.kycStatus = "pending";
        break;
      }
      case "review_kyc": {
        const person = command.targetId ? actor(next, command.targetId) : undefined;
        if (person) person.kycStatus = "verified";
        break;
      }
      case "create_business":
        break;
      case "submit_kyb": {
        const business = command.targetId ? next.businesses.find(item => item.id === command.targetId) : undefined;
        if (business) business.kybStatus = "pending";
        break;
      }
      case "review_kyb": {
        const business = command.targetId ? next.businesses.find(item => item.id === command.targetId) : undefined;
        if (business) business.kybStatus = "verified";
        break;
      }
      case "activate_membership": {
        const business = command.targetId ? next.businesses.find(item => item.id === command.targetId) : undefined;
        if (business) business.membershipActive = true;
        break;
      }
      case "create_offering": {
        const person = actor(next, command.actorId);
        if (person) {
          next.offerings.push({
            id: nextId(next, "sim-offering"),
            ownerId: person.id,
            businessId: person.businessId,
            title: command.mode === "c2c" ? "أصل مستعمل خيالي" : command.mode === "b2c" ? "عرض متجر خيالي" : "عرض صناعي خيالي",
            offeringType: command.mode === "c2c" ? "used_asset" : command.mode === "b2c" ? "service" : "product",
            status: "pending",
          });
        }
        break;
      }
      case "verify_offering": {
        const offering = next.offerings.find(item => item.id === command.targetId) ?? next.offerings.find(item => item.status === "pending");
        if (offering) offering.status = "verified";
        break;
      }
      case "create_demand":
        next.demands.push({ id: nextId(next, "sim-demand"), createdById: command.actorId, title: "طلب احتياج خيالي", mode: command.mode, status: "published" });
        break;
      case "evaluate_match": {
        const demand = next.demands.find(item => item.mode === command.mode && item.status === "published");
        const offering = next.offerings.find(item => item.status === "verified");
        if (demand && offering) {
          demand.status = "matching";
          next.matches.unshift({ id: nextId(next, "sim-match"), demandId: demand.id, offeringId: offering.id, status: "eligible", score: command.mode === "b2b" ? 92 : 84 });
        }
        break;
      }
      case "view_aggregate":
        break;
    }
  }
  appendAudit(next, command, decision);
  return { state: next, decision };
}

export const demoScenarios: DemoScenario[] = [
  {
    id: "b2b-trust-chain", mode: "b2b", shortTitle: "B2B", title: "مصنع → مشتري موثق", description: "يبين تسلسل KYC ثم KYB ثم عضوية ثم تحقق العرض قبل المطابقة.", intent: "إظهار أن المطابقة ليست نقطة البداية بل نتيجة طبقات الثقة.",
    steps: [
      { action: "submit_kyc", actorId: "lina", mode: "b2b", label: "إحالة KYC خيالي" },
      { action: "review_kyc", actorId: "nour", targetId: "lina", mode: "b2b", label: "اعتماد KYC" },
      { action: "create_business", actorId: "lina", mode: "b2b", label: "تثبيت نشاط خيالي" },
      { action: "submit_kyb", actorId: "lina", targetId: "nile-factory", mode: "b2b", label: "إحالة KYB" },
      { action: "review_kyb", actorId: "nour", targetId: "nile-factory", mode: "b2b", label: "اعتماد KYB" },
      { action: "activate_membership", actorId: "nour", targetId: "nile-factory", mode: "b2b", label: "تفعيل عضوية الممثل" },
      { action: "create_offering", actorId: "lina", mode: "b2b", label: "إنشاء عرض منتج" },
      { action: "verify_offering", actorId: "nour", mode: "b2b", label: "اعتماد العرض" },
      { action: "create_demand", actorId: "fadi", mode: "b2b", label: "نشر طلب شراء" },
      { action: "evaluate_match", actorId: "fadi", mode: "b2b", label: "تقييم المطابقة" },
    ],
  },
  {
    id: "b2c-store", mode: "b2c", shortTitle: "B2C", title: "متجر موثق → مستهلك", description: "يبين عرض خدمة خيالي لمستهلك متحقق مع عدم كشف KYB التفصيلي.", intent: "فصل العرض العام عن بيانات المنشأة المقيدة.",
    steps: [
      { action: "create_offering", actorId: "samir", mode: "b2c", label: "إنشاء عرض خدمة" },
      { action: "verify_offering", actorId: "nour", mode: "b2c", label: "اعتماد العرض" },
      { action: "create_demand", actorId: "huda", mode: "b2c", label: "إرسال طلب مستهلك" },
      { action: "evaluate_match", actorId: "huda", mode: "b2c", label: "تقييم توافق الطلب" },
    ],
  },
  {
    id: "c2b-demand", mode: "c2b", shortTitle: "C2B", title: "مستهلك → احتياج لنشاط", description: "يبين إنشاء طلب احتياج خيالي من هوية شخصية متحققة.", intent: "إثبات أن المستهلك لا يرث صلاحيات النشاط التجاري.",
    steps: [
      { action: "create_demand", actorId: "huda", mode: "c2b", label: "نشر طلب احتياج" },
      { action: "view_aggregate", actorId: "gov", mode: "c2b", label: "عرض مؤشر مجمع" },
    ],
  },
  {
    id: "c2c-used-asset", mode: "c2c", shortTitle: "C2C", title: "مستهلك ↔ مستهلك — أصل مستعمل", description: "يبين عرض أصل مستعمل خيالي من مستهلك متحقق فقط.", intent: "عدم تحويل C2C إلى وصول تجاري دون KYB.",
    steps: [
      { action: "create_offering", actorId: "huda", mode: "c2c", label: "نشر أصل مستعمل" },
      { action: "verify_offering", actorId: "nour", mode: "c2c", label: "اعتماد العرض" },
      { action: "create_demand", actorId: "huda", mode: "c2c", label: "نشر طلب C2C" },
      { action: "evaluate_match", actorId: "huda", mode: "c2c", label: "فحص التطابق" },
    ],
  },
  {
    id: "b2g-aggregate", mode: "b2g", shortTitle: "B2G", title: "سوق → جهة عامة", description: "يبين حق الجهة العامة في مؤشر مجمع فقط دون صفقات أو هوية تفصيلية.", intent: "فرض مبدأ الرؤية حسب الغرض ومستوى العلاقة.",
    steps: [
      { action: "view_aggregate", actorId: "gov", mode: "b2g", label: "عرض مؤشرات مجمعة" },
      { action: "view_aggregate", actorId: "nour", mode: "b2g", label: "مراجعة امتثال مجمعة" },
    ],
  },
];

export const actionLabels: Record<DemoAction, string> = {
  submit_kyc: "تقديم KYC", review_kyc: "مراجعة KYC", create_business: "إنشاء نشاط", submit_kyb: "تقديم KYB", review_kyb: "مراجعة KYB", activate_membership: "تفعيل عضوية", create_offering: "إنشاء عرض", verify_offering: "اعتماد عرض", create_demand: "إنشاء طلب", evaluate_match: "تقييم مطابقة", view_aggregate: "عرض مؤشر مجمع",
};
