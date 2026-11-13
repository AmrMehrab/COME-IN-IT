export type PrototypeJourneyId = "business" | "individual" | "review";

export type PrototypeStage = {
  id: string;
  title: string;
  eyebrow: string;
  description: string;
  gate: string;
  decision: "ready" | "blocked" | "review";
  decisionLabel: string;
  dataClass: "public" | "verified" | "restricted" | "confidential_sovereign";
  destination: "verification" | "commercial-capabilities" | "trade-operations" | "permissions" | "live-simulation";
  destinationLabel: string;
};

export type PrototypeJourney = {
  id: PrototypeJourneyId;
  title: string;
  description: string;
  persona: string;
  model: "B2B" | "B2C" | "C2B" | "C2C" | "B2G";
  accent: "sky" | "emerald" | "violet";
  outcome: string;
  stages: PrototypeStage[];
};

export const prototypeJourneys: PrototypeJourney[] = [
  {
    id: "business",
    title: "رحلة مورد صناعي",
    description: "من هوية الممثل إلى عرض موثق ثم قرار مطابقة B2B قابل للتدقيق.",
    persona: "هبة — ممثلة معتمدة لشركة تصنيع خيالية",
    model: "B2B",
    accent: "emerald",
    outcome: "مطابقة مشروطة ومسموح بها بعد تحقق جميع البوابات.",
    stages: [
      {
        id: "identity",
        title: "إثبات هوية الممثل",
        eyebrow: "PERSON → KYC",
        description: "تبدأ الرحلة بشخص منفصل عن الكيان التجاري، مع حالة KYC قابلة للمراجعة.",
        gate: "KYC = verified",
        decision: "ready",
        decisionLabel: "متحقق",
        dataClass: "verified",
        destination: "verification",
        destinationLabel: "لوحة KYC / KYB",
      },
      {
        id: "business",
        title: "توثيق النشاط والعضوية",
        eyebrow: "BUSINESS → KYB → MEMBERSHIP",
        description: "يتحقق النظام من KYB والعضوية النشطة وربط الممثل بالكيان قبل فتح أي صلاحية تجارية.",
        gate: "KYB + membership = active",
        decision: "ready",
        decisionLabel: "مؤهل",
        dataClass: "restricted",
        destination: "commercial-capabilities",
        destinationLabel: "القدرات التجارية",
      },
      {
        id: "offering",
        title: "تسجيل عرض والتحقق منه",
        eyebrow: "OFFERING → PRODUCT IDENTITY",
        description: "يُعامل العرض ككائن تجاري أولي له مصدر وهوية وحالة تحقق مستقلة.",
        gate: "offering verification = verified",
        decision: "ready",
        decisionLabel: "جاهز للمطابقة",
        dataClass: "restricted",
        destination: "trade-operations",
        destinationLabel: "التجارة التشغيلية",
      },
      {
        id: "match",
        title: "قرار علاقة ومطابقة",
        eyebrow: "RELATIONSHIP → MATCH → AUDIT",
        description: "تقرر القاعدة الحتمية السماح أو الرفض أو المراجعة اليدوية ثم تسجل النتيجة في مسار WORM.",
        gate: "relationship decision = allow",
        decision: "ready",
        decisionLabel: "سماح مع تدقيق",
        dataClass: "confidential_sovereign",
        destination: "live-simulation",
        destinationLabel: "المحاكاة الحية",
      },
    ],
  },
  {
    id: "individual",
    title: "رحلة مقدم خدمة فردي",
    description: "عرض مبسط يبين فصل الفرد عن النشاط التجاري وإتاحة C2B أو B2C بحسب ملف النشاط.",
    persona: "عمر — مقدم خدمة خيالي بملف نشاط فردي",
    model: "C2B",
    accent: "sky",
    outcome: "الوصول التجاري يتحدد بملف النشاط الفردي ولا يمنح صلاحيات B2B تلقائياً.",
    stages: [
      {
        id: "individual-kyc",
        title: "توثيق الفرد",
        eyebrow: "PERSON → KYC",
        description: "لا يكفي إنشاء الحساب؛ يُراجع KYC أولاً ويحدد مستوى البيانات القابل للاستخدام.",
        gate: "KYC = verified",
        decision: "ready",
        decisionLabel: "متحقق",
        dataClass: "verified",
        destination: "verification",
        destinationLabel: "لوحة KYC / KYB",
      },
      {
        id: "activity-profile",
        title: "ملف نشاط فردي",
        eyebrow: "INDIVIDUAL ACTIVITY PROFILE",
        description: "الملف يصف مجال الخدمة ونطاقها؛ وهو لا يحول الفرد إلى كيان تجاري ولا ينشئ KYB بالنيابة عنه.",
        gate: "activity profile = active",
        decision: "ready",
        decisionLabel: "نشاط مؤهل",
        dataClass: "restricted",
        destination: "commercial-capabilities",
        destinationLabel: "القدرات التجارية",
      },
      {
        id: "relationship-review",
        title: "فحص نمط العلاقة",
        eyebrow: "C2B → ELIGIBILITY ENGINE",
        description: "تقبل القواعد علاقة C2B المناسبة، مع إبقاء نطاقات B2B المقيدة خارج التفويض التلقائي للفرد.",
        gate: "relationship decision = manual_review",
        decision: "review",
        decisionLabel: "مراجعة يدوية",
        dataClass: "restricted",
        destination: "permissions",
        destinationLabel: "مصفوفة الصلاحيات",
      },
      {
        id: "individual-audit",
        title: "سجل القرار",
        eyebrow: "DECISION → AUDIT",
        description: "توثق النتيجة والقاعدة المستخدمة دون عرض بيانات تجارية حساسة لطرف غير مخول.",
        gate: "audit event = recorded",
        decision: "ready",
        decisionLabel: "مسجل محلياً",
        dataClass: "confidential_sovereign",
        destination: "live-simulation",
        destinationLabel: "المحاكاة الحية",
      },
    ],
  },
  {
    id: "review",
    title: "رحلة مراجع الامتثال",
    description: "نموذج قرار يوضح الفصل بين المراجع وصاحب النشاط، وحدود الإذن والتحويل للمراجعة اليدوية.",
    persona: "سلمى — مراجع امتثال خيالية",
    model: "B2G",
    accent: "violet",
    outcome: "يعتمد المراجع القرار وفق أقل صلاحية لازمة ولا ينشئ تجارة لصالح أي طرف.",
    stages: [
      {
        id: "review-role",
        title: "نطاق دور المراجع",
        eyebrow: "ROLE → PERMISSION",
        description: "يتحقق النظام من الدور والنطاق قبل السماح بمراجعة ملف أو قرار علاقة.",
        gate: "role scope = compliance_review",
        decision: "ready",
        decisionLabel: "دور صالح",
        dataClass: "restricted",
        destination: "permissions",
        destinationLabel: "مصفوفة الصلاحيات",
      },
      {
        id: "review-evidence",
        title: "فحص أدلة وصفية",
        eyebrow: "EVIDENCE REFERENCE ONLY",
        description: "يُعرض مرجع الدليل وحالته، لا ملفات وثائق أو بيانات حساسة غير ضرورية لقرار المراجعة.",
        gate: "data classification <= restricted",
        decision: "ready",
        decisionLabel: "عرض مقيد",
        dataClass: "restricted",
        destination: "commercial-capabilities",
        destinationLabel: "القدرات التجارية",
      },
      {
        id: "review-decision",
        title: "قرار الاستثناء التجاري",
        eyebrow: "ALLOW / DENY / MANUAL REVIEW",
        description: "يجعل المحرك قرار العلاقة مرئياً ويطلب سبباً عند التحويل للمراجعة اليدوية.",
        gate: "manual review reason = present",
        decision: "review",
        decisionLabel: "بانتظار اعتماد",
        dataClass: "confidential_sovereign",
        destination: "live-simulation",
        destinationLabel: "المحاكاة الحية",
      },
      {
        id: "review-audit",
        title: "أثر تدقيق ثابت",
        eyebrow: "WORM AUDIT TRAIL",
        description: "يسجل القرار ومن اتخذه وسبب الاستثناء كمعلومة تدقيق لا كتصديق تنظيمي نهائي.",
        gate: "audit event = immutable",
        decision: "ready",
        decisionLabel: "قابل للفحص",
        dataClass: "confidential_sovereign",
        destination: "live-simulation",
        destinationLabel: "المحاكاة الحية",
      },
    ],
  },
];

export function getPrototypeJourney(id: PrototypeJourneyId) {
  return prototypeJourneys.find(journey => journey.id === id) ?? prototypeJourneys[0];
}

export function prototypeProgress(stageIndex: number, stageCount: number) {
  if (stageCount <= 1) return 100;
  return Math.round((Math.max(0, Math.min(stageIndex, stageCount - 1)) / (stageCount - 1)) * 100);
}
