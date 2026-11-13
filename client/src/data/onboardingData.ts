export type OnboardingDestination = "verification" | "commercial-capabilities" | "trade-operations" | "prototype";

export type OnboardingStep = {
  id: "identity" | "verification" | "commercial-access";
  number: number;
  title: string;
  shortTitle: string;
  description: string;
  checkpoint: string;
  actionLabel: string;
  destination: OnboardingDestination;
  icon: "identity" | "verification" | "commercial";
};

export const ONBOARDING_STORAGE_KEY = "come-in-it:onboarding-seen:v1";

export const onboardingSteps: OnboardingStep[] = [
  {
    id: "identity",
    number: 1,
    title: "ابدأ بهويتك الشخصية",
    shortTitle: "إنشاء الهوية",
    description: "أنشئ حسابك الشخصي أولاً. الحساب لا يساوي نشاطاً تجارياً؛ فهو نقطة البدء لإدارة KYC والتمثيل والصلاحيات لاحقاً.",
    checkpoint: "PERSON → حساب مستخدم",
    actionLabel: "افتح مركز التحقق",
    destination: "verification",
    icon: "identity",
  },
  {
    id: "verification",
    number: 2,
    title: "استكمل التحقق والثقة",
    shortTitle: "KYC ثم KYB",
    description: "أكمل KYC، ثم أضف الكيان التجاري عند الحاجة وابدأ KYB. لا يمنح إنشاء الحساب وحده وصولاً تجارياً أو صلاحية تمثيل.",
    checkpoint: "KYC → Business identity → KYB",
    actionLabel: "راجع حالة التحقق",
    destination: "verification",
    icon: "verification",
  },
  {
    id: "commercial-access",
    number: 3,
    title: "فعّل نشاطك والوصول التجاري",
    shortTitle: "ملف النشاط",
    description: "أنشئ أو راجع ملف النشاط، حدّد مصدر العرض أو الطلب، ثم انتقل إلى المطابقة بعد تحقق شروط العلاقة التجارية المناسبة.",
    checkpoint: "Activity profile → Eligibility → Matching",
    actionLabel: "افتح القدرات التجارية",
    destination: "commercial-capabilities",
    icon: "commercial",
  },
];
