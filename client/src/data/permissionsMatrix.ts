export type VerificationStatus = "NOT_VERIFIED" | "VERIFIED" | "SUSPENDED" | "REJECTED";
export type ActivityVerificationStatus = "NOT_SUBMITTED" | "PENDING" | "VERIFIED" | "SUSPENDED" | "REJECTED";
export type RelationshipMode = "b2b" | "b2c" | "c2b" | "c2c" | "b2g";
export type RelationshipDecision = "allow" | "deny" | "manual_review";
export type BusinessType = "MANUFACTURER" | "IMPORTER" | "EXPORTER" | "TRADER" | "RETAILER" | "CONSUMER";
export type UserRole =
  | "OWNER"
  | "DIRECTOR"
  | "PROCUREMENT_MANAGER"
  | "SALES_MANAGER"
  | "EXPORT_MANAGER"
  | "FINANCE_MANAGER"
  | "CONSUMER"
  | "INDIVIDUAL_ACTIVITY_HOLDER"
  | "COMPLIANCE_REVIEWER";

export interface Permission {
  id: string;
  name: string;
  description: string;
  category: "READ" | "CREATE" | "UPDATE" | "DELETE" | "APPROVE" | "EXPORT";
  icon: string;
}

export interface PermissionAssignment {
  permission: Permission;
  requiresKYC: boolean;
  requiresKYB: boolean;
  requiresVerifiedBusiness: boolean;
  requiresRelationship: boolean;
  requiresActiveMembership?: boolean;
  requiresIndividualActivity?: boolean;
  requiresBusinessActivityVerification?: boolean;
  requiresOfferingVerification?: boolean;
  allowedRelationshipModes?: RelationshipMode[];
  manualReviewForModes?: RelationshipMode[];
  notes: string;
}

export interface RolePermissionMatrix {
  role: UserRole;
  roleName: string;
  roleDescription: string;
  businessTypes: BusinessType[];
  permissions: PermissionAssignment[];
}

export const relationshipModeOptions: { value: RelationshipMode; label: string; description: string }[] = [
  { value: "b2b", label: "B2B", description: "كيان تجاري موثق مع كيان تجاري موثق" },
  { value: "b2c", label: "B2C", description: "كيان تجاري موثق مع مستهلك فردي موثق" },
  { value: "c2b", label: "C2B", description: "منتج فردي موثق مع كيان تجاري موثق" },
  { value: "c2c", label: "C2C", description: "ملفا نشاط فرديان موثقان" },
  { value: "b2g", label: "B2G", description: "مسار حكومي مشروط بالمراجعة اليدوية وخارج التشغيل الحالي" },
];

export const permissions: Permission[] = [
  // READ Permissions
  {
    id: "view_own_profile",
    name: "عرض الملف الشخصي",
    description: "عرض بيانات الملف الشخصي والهوية",
    category: "READ",
    icon: "👤",
  },
  {
    id: "view_kyc_status",
    name: "عرض حالة KYC",
    description: "عرض حالة التحقق الشخصي والمستندات",
    category: "READ",
    icon: "🆔",
  },
  {
    id: "view_business_profile",
    name: "عرض ملف الشركة",
    description: "عرض بيانات الشركة والنشاط التجاري",
    category: "READ",
    icon: "🏢",
  },
  {
    id: "view_kyb_status",
    name: "عرض حالة KYB",
    description: "عرض حالة التحقق التجاري والوثائق",
    category: "READ",
    icon: "✅",
  },
  {
    id: "view_products",
    name: "عرض المنتجات",
    description: "عرض قائمة منتجات الشركة",
    category: "READ",
    icon: "📦",
  },
  {
    id: "view_verified_products",
    name: "عرض المنتجات الموثقة",
    description: "عرض المنتجات الموثقة والمعتمدة فقط",
    category: "READ",
    icon: "✔️",
  },
  {
    id: "view_purchase_requests",
    name: "عرض طلبات الشراء",
    description: "عرض الطلبات الواردة من المشترين",
    category: "READ",
    icon: "📋",
  },
  {
    id: "view_quotations",
    name: "عرض عروض الأسعار",
    description: "عرض عروض الأسعار المرسلة والمستقبلة",
    category: "READ",
    icon: "💰",
  },
  {
    id: "view_matches",
    name: "عرض نتائج المطابقة",
    description: "عرض نتائج المطابقة والفرص التجارية",
    category: "READ",
    icon: "🎯",
  },
  {
    id: "view_audit_logs",
    name: "عرض سجلات التدقيق",
    description: "عرض سجلات جميع العمليات والتغييرات",
    category: "READ",
    icon: "📊",
  },
  {
    id: "view_team_members",
    name: "عرض أعضاء الفريق",
    description: "عرض قائمة أعضاء الشركة والأدوار",
    category: "READ",
    icon: "👥",
  },
  {
    id: "view_commercial_relationships",
    name: "عرض العلاقات التجارية",
    description: "عرض العلاقات التجارية المعتمدة",
    category: "READ",
    icon: "🤝",
  },

  // CREATE Permissions
  {
    id: "create_product",
    name: "إضافة منتج",
    description: "إنشاء منتج جديد في الشركة",
    category: "CREATE",
    icon: "➕",
  },
  {
    id: "create_purchase_request",
    name: "إنشاء طلب شراء",
    description: "إنشاء طلب شراء جديد",
    category: "CREATE",
    icon: "📝",
  },
  {
    id: "create_quotation",
    name: "إرسال عرض سعر",
    description: "إرسال عرض سعر للمشترين",
    category: "CREATE",
    icon: "💬",
  },
  {
    id: "create_commercial_relationship",
    name: "إنشاء علاقة تجارية",
    description: "طلب إنشاء علاقة تجارية مع شركة أخرى",
    category: "CREATE",
    icon: "🔗",
  },
  {
    id: "send_message",
    name: "إرسال رسالة",
    description: "إرسال رسائل آمنة للأطراف الأخرى",
    category: "CREATE",
    icon: "💌",
  },

  // UPDATE Permissions
  {
    id: "update_product",
    name: "تعديل المنتج",
    description: "تعديل بيانات المنتج والمواصفات",
    category: "UPDATE",
    icon: "✏️",
  },
  {
    id: "update_business_profile",
    name: "تعديل ملف الشركة",
    description: "تعديل بيانات الشركة والنشاط",
    category: "UPDATE",
    icon: "🔧",
  },
  {
    id: "update_quotation",
    name: "تعديل عرض السعر",
    description: "تعديل عروض الأسعار المرسلة",
    category: "UPDATE",
    icon: "📌",
  },

  // DELETE Permissions
  {
    id: "delete_product",
    name: "حذف المنتج",
    description: "حذف منتج من الشركة",
    category: "DELETE",
    icon: "🗑️",
  },
  {
    id: "delete_quotation",
    name: "حذف عرض السعر",
    description: "حذف عرض سعر مرسل",
    category: "DELETE",
    icon: "❌",
  },

  // APPROVE Permissions
  {
    id: "approve_team_member",
    name: "اعتماد عضو فريق",
    description: "اعتماد انضمام عضو جديد للشركة",
    category: "APPROVE",
    icon: "👍",
  },
  {
    id: "approve_commercial_relationship",
    name: "اعتماد علاقة تجارية",
    description: "اعتماد طلب علاقة تجارية",
    category: "APPROVE",
    icon: "✔️",
  },

  // EXPORT Permissions
  {
    id: "export_products",
    name: "تصدير المنتجات",
    description: "تصدير قائمة المنتجات",
    category: "EXPORT",
    icon: "📤",
  },
  {
    id: "export_reports",
    name: "تصدير التقارير",
    description: "تصدير التقارير والبيانات",
    category: "EXPORT",
    icon: "📊",
  },
  {
    id: "submit_individual_activity_profile",
    name: "تقديم ملف نشاط فردي",
    description: "تقديم أو تحديث ملف نشاط المستهلك أو المنتج الفردي دون وثائق حساسة داخل المصفوفة",
    category: "CREATE",
    icon: "🪪",
  },
  {
    id: "submit_business_activity_verification",
    name: "تقديم تحقق نشاط تجاري",
    description: "طلب اعتماد نوع النشاط التشغيلي للكيان بعد KYB وعضوية فعّالة",
    category: "CREATE",
    icon: "🏭",
  },
  {
    id: "evaluate_commercial_relationship",
    name: "تقييم أهلية العلاقة التجارية",
    description: "فحص سياق الطرفين والنشاط ونمط العلاقة قبل المطابقة أو التفاعل التجاري",
    category: "READ",
    icon: "⚖️",
  },
  {
    id: "create_trade_offering",
    name: "إنشاء عرض تجاري",
    description: "إنشاء عرض من مصدر تجاري أو ملف نشاط فردي واحد فقط",
    category: "CREATE",
    icon: "📦",
  },
  {
    id: "create_trade_demand",
    name: "إنشاء طلب تجاري",
    description: "إنشاء طلب من مصدر تجاري أو ملف نشاط فردي واحد فقط",
    category: "CREATE",
    icon: "🧾",
  },
  {
    id: "view_relationship_decision",
    name: "عرض قرار العلاقة",
    description: "عرض allow أو deny أو manual_review وسبب القرار ضمن نطاق الطرف المصرح له",
    category: "READ",
    icon: "🔎",
  },
  {
    id: "view_relationship_audit",
    name: "عرض أثر تدقيق العلاقة",
    description: "عرض أثر تقييم العلاقة المصنف دون كشف بيانات الطرف الأخرى خارج نطاق العلاقة",
    category: "READ",
    icon: "📜",
  },
  {
    id: "review_activity_verification",
    name: "مراجعة تحقق النشاط",
    description: "اعتماد أو رفض أو تعليق ملف النشاط الفردي أو تحقق النشاط التجاري ضمن نطاق امتثال إداري",
    category: "APPROVE",
    icon: "🛡️",
  },
];

export const rolePermissionMatrix: RolePermissionMatrix[] = [
  {
    role: "OWNER",
    roleName: "المالك",
    roleDescription: "مالك الشركة - صلاحيات كاملة",
    businessTypes: ["MANUFACTURER", "IMPORTER", "EXPORTER", "TRADER"],
    permissions: [
      // All READ permissions
      {
        permission: permissions.find(p => p.id === "view_own_profile")!,
        requiresKYC: true,
        requiresKYB: false,
        requiresVerifiedBusiness: false,
        requiresRelationship: false,
        notes: "متاح دائماً بعد KYC",
      },
      {
        permission: permissions.find(p => p.id === "view_kyc_status")!,
        requiresKYC: true,
        requiresKYB: false,
        requiresVerifiedBusiness: false,
        requiresRelationship: false,
        notes: "متاح دائماً",
      },
      {
        permission: permissions.find(p => p.id === "view_business_profile")!,
        requiresKYC: true,
        requiresKYB: true,
        requiresVerifiedBusiness: false,
        requiresRelationship: false,
        notes: "بعد إنشاء الشركة",
      },
      {
        permission: permissions.find(p => p.id === "view_kyb_status")!,
        requiresKYC: true,
        requiresKYB: true,
        requiresVerifiedBusiness: false,
        requiresRelationship: false,
        notes: "بعد رفع وثائق KYB",
      },
      {
        permission: permissions.find(p => p.id === "view_products")!,
        requiresKYC: true,
        requiresKYB: true,
        requiresVerifiedBusiness: false,
        requiresRelationship: false,
        notes: "عرض جميع المنتجات",
      },
      {
        permission: permissions.find(p => p.id === "view_verified_products")!,
        requiresKYC: true,
        requiresKYB: true,
        requiresVerifiedBusiness: true,
        requiresRelationship: false,
        notes: "فقط المنتجات الموثقة",
      },
      {
        permission: permissions.find(p => p.id === "view_purchase_requests")!,
        requiresKYC: true,
        requiresKYB: true,
        requiresVerifiedBusiness: true,
        requiresRelationship: false,
        notes: "بعد توثيق الشركة",
      },
      {
        permission: permissions.find(p => p.id === "view_quotations")!,
        requiresKYC: true,
        requiresKYB: true,
        requiresVerifiedBusiness: true,
        requiresRelationship: false,
        notes: "عرض جميع العروض",
      },
      {
        permission: permissions.find(p => p.id === "view_matches")!,
        requiresKYC: true,
        requiresKYB: true,
        requiresVerifiedBusiness: true,
        requiresRelationship: false,
        notes: "عرض نتائج المطابقة",
      },
      {
        permission: permissions.find(p => p.id === "view_audit_logs")!,
        requiresKYC: true,
        requiresKYB: true,
        requiresVerifiedBusiness: false,
        requiresRelationship: false,
        notes: "سجلات كاملة",
      },
      {
        permission: permissions.find(p => p.id === "view_team_members")!,
        requiresKYC: true,
        requiresKYB: true,
        requiresVerifiedBusiness: false,
        requiresRelationship: false,
        notes: "عرض جميع الأعضاء",
      },
      {
        permission: permissions.find(p => p.id === "view_commercial_relationships")!,
        requiresKYC: true,
        requiresKYB: true,
        requiresVerifiedBusiness: true,
        requiresRelationship: false,
        notes: "عرض جميع العلاقات",
      },
      // CREATE permissions
      {
        permission: permissions.find(p => p.id === "create_product")!,
        requiresKYC: true,
        requiresKYB: true,
        requiresVerifiedBusiness: false,
        requiresRelationship: false,
        notes: "إنشاء منتج جديد",
      },
      {
        permission: permissions.find(p => p.id === "create_purchase_request")!,
        requiresKYC: true,
        requiresKYB: true,
        requiresVerifiedBusiness: true,
        requiresRelationship: false,
        notes: "للمشترين فقط",
      },
      {
        permission: permissions.find(p => p.id === "create_quotation")!,
        requiresKYC: true,
        requiresKYB: true,
        requiresVerifiedBusiness: true,
        requiresRelationship: true,
        notes: "بعد إنشاء علاقة تجارية",
      },
      {
        permission: permissions.find(p => p.id === "create_commercial_relationship")!,
        requiresKYC: true,
        requiresKYB: true,
        requiresVerifiedBusiness: true,
        requiresRelationship: false,
        notes: "طلب علاقة جديدة",
      },
      {
        permission: permissions.find(p => p.id === "send_message")!,
        requiresKYC: true,
        requiresKYB: true,
        requiresVerifiedBusiness: true,
        requiresRelationship: true,
        notes: "رسائل آمنة",
      },
      // UPDATE permissions
      {
        permission: permissions.find(p => p.id === "update_product")!,
        requiresKYC: true,
        requiresKYB: true,
        requiresVerifiedBusiness: false,
        requiresRelationship: false,
        notes: "تعديل منتجاتك",
      },
      {
        permission: permissions.find(p => p.id === "update_business_profile")!,
        requiresKYC: true,
        requiresKYB: true,
        requiresVerifiedBusiness: false,
        requiresRelationship: false,
        notes: "تعديل بيانات الشركة",
      },
      {
        permission: permissions.find(p => p.id === "update_quotation")!,
        requiresKYC: true,
        requiresKYB: true,
        requiresVerifiedBusiness: true,
        requiresRelationship: true,
        notes: "تعديل عروضك",
      },
      // DELETE permissions
      {
        permission: permissions.find(p => p.id === "delete_product")!,
        requiresKYC: true,
        requiresKYB: true,
        requiresVerifiedBusiness: false,
        requiresRelationship: false,
        notes: "حذف منتجاتك",
      },
      {
        permission: permissions.find(p => p.id === "delete_quotation")!,
        requiresKYC: true,
        requiresKYB: true,
        requiresVerifiedBusiness: true,
        requiresRelationship: true,
        notes: "حذف عروضك",
      },
      // APPROVE permissions
      {
        permission: permissions.find(p => p.id === "approve_team_member")!,
        requiresKYC: true,
        requiresKYB: true,
        requiresVerifiedBusiness: false,
        requiresRelationship: false,
        notes: "اعتماد أعضاء جدد",
      },
      {
        permission: permissions.find(p => p.id === "approve_commercial_relationship")!,
        requiresKYC: true,
        requiresKYB: true,
        requiresVerifiedBusiness: true,
        requiresRelationship: false,
        notes: "اعتماد علاقات جديدة",
      },
      // EXPORT permissions
      {
        permission: permissions.find(p => p.id === "export_products")!,
        requiresKYC: true,
        requiresKYB: true,
        requiresVerifiedBusiness: false,
        requiresRelationship: false,
        notes: "تصدير البيانات",
      },
      {
        permission: permissions.find(p => p.id === "export_reports")!,
        requiresKYC: true,
        requiresKYB: true,
        requiresVerifiedBusiness: false,
        requiresRelationship: false,
        notes: "تصدير التقارير",
      },
    ],
  },
  {
    role: "DIRECTOR",
    roleName: "المدير",
    roleDescription: "مدير الشركة - صلاحيات إدارية",
    businessTypes: ["MANUFACTURER", "IMPORTER", "EXPORTER", "TRADER"],
    permissions: [
      {
        permission: permissions.find(p => p.id === "view_own_profile")!,
        requiresKYC: true,
        requiresKYB: false,
        requiresVerifiedBusiness: false,
        requiresRelationship: false,
        notes: "متاح دائماً",
      },
      {
        permission: permissions.find(p => p.id === "view_business_profile")!,
        requiresKYC: true,
        requiresKYB: true,
        requiresVerifiedBusiness: false,
        requiresRelationship: false,
        notes: "عرض ملف الشركة",
      },
      {
        permission: permissions.find(p => p.id === "view_products")!,
        requiresKYC: true,
        requiresKYB: true,
        requiresVerifiedBusiness: false,
        requiresRelationship: false,
        notes: "عرض المنتجات",
      },
      {
        permission: permissions.find(p => p.id === "view_verified_products")!,
        requiresKYC: true,
        requiresKYB: true,
        requiresVerifiedBusiness: true,
        requiresRelationship: false,
        notes: "المنتجات الموثقة",
      },
      {
        permission: permissions.find(p => p.id === "view_purchase_requests")!,
        requiresKYC: true,
        requiresKYB: true,
        requiresVerifiedBusiness: true,
        requiresRelationship: false,
        notes: "عرض الطلبات",
      },
      {
        permission: permissions.find(p => p.id === "view_quotations")!,
        requiresKYC: true,
        requiresKYB: true,
        requiresVerifiedBusiness: true,
        requiresRelationship: false,
        notes: "عرض العروض",
      },
      {
        permission: permissions.find(p => p.id === "view_matches")!,
        requiresKYC: true,
        requiresKYB: true,
        requiresVerifiedBusiness: true,
        requiresRelationship: false,
        notes: "عرض المطابقات",
      },
      {
        permission: permissions.find(p => p.id === "view_team_members")!,
        requiresKYC: true,
        requiresKYB: true,
        requiresVerifiedBusiness: false,
        requiresRelationship: false,
        notes: "عرض الفريق",
      },
      {
        permission: permissions.find(p => p.id === "create_product")!,
        requiresKYC: true,
        requiresKYB: true,
        requiresVerifiedBusiness: false,
        requiresRelationship: false,
        notes: "إضافة منتج",
      },
      {
        permission: permissions.find(p => p.id === "create_quotation")!,
        requiresKYC: true,
        requiresKYB: true,
        requiresVerifiedBusiness: true,
        requiresRelationship: true,
        notes: "إرسال عرض سعر",
      },
      {
        permission: permissions.find(p => p.id === "update_product")!,
        requiresKYC: true,
        requiresKYB: true,
        requiresVerifiedBusiness: false,
        requiresRelationship: false,
        notes: "تعديل المنتجات",
      },
      {
        permission: permissions.find(p => p.id === "delete_product")!,
        requiresKYC: true,
        requiresKYB: true,
        requiresVerifiedBusiness: false,
        requiresRelationship: false,
        notes: "حذف المنتجات",
      },
      {
        permission: permissions.find(p => p.id === "approve_team_member")!,
        requiresKYC: true,
        requiresKYB: true,
        requiresVerifiedBusiness: false,
        requiresRelationship: false,
        notes: "اعتماد الأعضاء",
      },
    ],
  },
  {
    role: "PROCUREMENT_MANAGER",
    roleName: "مدير المشتريات",
    roleDescription: "مسؤول المشتريات والطلبات",
    businessTypes: ["MANUFACTURER", "IMPORTER", "TRADER"],
    permissions: [
      {
        permission: permissions.find(p => p.id === "view_own_profile")!,
        requiresKYC: true,
        requiresKYB: false,
        requiresVerifiedBusiness: false,
        requiresRelationship: false,
        notes: "عرض الملف الشخصي",
      },
      {
        permission: permissions.find(p => p.id === "view_products")!,
        requiresKYC: true,
        requiresKYB: true,
        requiresVerifiedBusiness: false,
        requiresRelationship: false,
        notes: "عرض منتجات الشركة",
      },
      {
        permission: permissions.find(p => p.id === "view_verified_products")!,
        requiresKYC: true,
        requiresKYB: true,
        requiresVerifiedBusiness: true,
        requiresRelationship: false,
        notes: "المنتجات الموثقة",
      },
      {
        permission: permissions.find(p => p.id === "view_purchase_requests")!,
        requiresKYC: true,
        requiresKYB: true,
        requiresVerifiedBusiness: true,
        requiresRelationship: false,
        notes: "عرض الطلبات",
      },
      {
        permission: permissions.find(p => p.id === "view_matches")!,
        requiresKYC: true,
        requiresKYB: true,
        requiresVerifiedBusiness: true,
        requiresRelationship: false,
        notes: "عرض الفرص",
      },
      {
        permission: permissions.find(p => p.id === "create_purchase_request")!,
        requiresKYC: true,
        requiresKYB: true,
        requiresVerifiedBusiness: true,
        requiresRelationship: false,
        notes: "إنشاء طلب شراء",
      },
      {
        permission: permissions.find(p => p.id === "create_quotation")!,
        requiresKYC: true,
        requiresKYB: true,
        requiresVerifiedBusiness: true,
        requiresRelationship: true,
        notes: "إرسال عرض سعر",
      },
      {
        permission: permissions.find(p => p.id === "send_message")!,
        requiresKYC: true,
        requiresKYB: true,
        requiresVerifiedBusiness: true,
        requiresRelationship: true,
        notes: "التواصل مع الموردين",
      },
    ],
  },
  {
    role: "SALES_MANAGER",
    roleName: "مدير المبيعات",
    roleDescription: "مسؤول المبيعات والعروض",
    businessTypes: ["MANUFACTURER", "EXPORTER", "TRADER"],
    permissions: [
      {
        permission: permissions.find(p => p.id === "view_own_profile")!,
        requiresKYC: true,
        requiresKYB: false,
        requiresVerifiedBusiness: false,
        requiresRelationship: false,
        notes: "عرض الملف الشخصي",
      },
      {
        permission: permissions.find(p => p.id === "view_products")!,
        requiresKYC: true,
        requiresKYB: true,
        requiresVerifiedBusiness: false,
        requiresRelationship: false,
        notes: "عرض المنتجات",
      },
      {
        permission: permissions.find(p => p.id === "view_verified_products")!,
        requiresKYC: true,
        requiresKYB: true,
        requiresVerifiedBusiness: true,
        requiresRelationship: false,
        notes: "المنتجات الموثقة",
      },
      {
        permission: permissions.find(p => p.id === "view_purchase_requests")!,
        requiresKYC: true,
        requiresKYB: true,
        requiresVerifiedBusiness: true,
        requiresRelationship: false,
        notes: "عرض الطلبات الواردة",
      },
      {
        permission: permissions.find(p => p.id === "view_quotations")!,
        requiresKYC: true,
        requiresKYB: true,
        requiresVerifiedBusiness: true,
        requiresRelationship: false,
        notes: "عرض العروض",
      },
      {
        permission: permissions.find(p => p.id === "view_matches")!,
        requiresKYC: true,
        requiresKYB: true,
        requiresVerifiedBusiness: true,
        requiresRelationship: false,
        notes: "عرض الفرص",
      },
      {
        permission: permissions.find(p => p.id === "create_quotation")!,
        requiresKYC: true,
        requiresKYB: true,
        requiresVerifiedBusiness: true,
        requiresRelationship: true,
        notes: "إرسال عرض سعر",
      },
      {
        permission: permissions.find(p => p.id === "update_quotation")!,
        requiresKYC: true,
        requiresKYB: true,
        requiresVerifiedBusiness: true,
        requiresRelationship: true,
        notes: "تعديل العروض",
      },
      {
        permission: permissions.find(p => p.id === "send_message")!,
        requiresKYC: true,
        requiresKYB: true,
        requiresVerifiedBusiness: true,
        requiresRelationship: true,
        notes: "التواصل مع المشترين",
      },
    ],
  },
  {
    role: "EXPORT_MANAGER",
    roleName: "مدير التصدير",
    roleDescription: "مسؤول التصدير والعمليات الدولية",
    businessTypes: ["EXPORTER", "MANUFACTURER"],
    permissions: [
      {
        permission: permissions.find(p => p.id === "view_own_profile")!,
        requiresKYC: true,
        requiresKYB: false,
        requiresVerifiedBusiness: false,
        requiresRelationship: false,
        notes: "عرض الملف الشخصي",
      },
      {
        permission: permissions.find(p => p.id === "view_products")!,
        requiresKYC: true,
        requiresKYB: true,
        requiresVerifiedBusiness: false,
        requiresRelationship: false,
        notes: "عرض المنتجات",
      },
      {
        permission: permissions.find(p => p.id === "view_verified_products")!,
        requiresKYC: true,
        requiresKYB: true,
        requiresVerifiedBusiness: true,
        requiresRelationship: false,
        notes: "المنتجات الموثقة",
      },
      {
        permission: permissions.find(p => p.id === "view_purchase_requests")!,
        requiresKYC: true,
        requiresKYB: true,
        requiresVerifiedBusiness: true,
        requiresRelationship: false,
        notes: "عرض الطلبات الدولية",
      },
      {
        permission: permissions.find(p => p.id === "view_matches")!,
        requiresKYC: true,
        requiresKYB: true,
        requiresVerifiedBusiness: true,
        requiresRelationship: false,
        notes: "عرض الفرص التصديرية",
      },
      {
        permission: permissions.find(p => p.id === "create_quotation")!,
        requiresKYC: true,
        requiresKYB: true,
        requiresVerifiedBusiness: true,
        requiresRelationship: true,
        notes: "إرسال عروض تصديرية",
      },
      {
        permission: permissions.find(p => p.id === "export_products")!,
        requiresKYC: true,
        requiresKYB: true,
        requiresVerifiedBusiness: false,
        requiresRelationship: false,
        notes: "تصدير قوائم المنتجات",
      },
      {
        permission: permissions.find(p => p.id === "export_reports")!,
        requiresKYC: true,
        requiresKYB: true,
        requiresVerifiedBusiness: false,
        requiresRelationship: false,
        notes: "تصدير التقارير",
      },
    ],
  },
  {
    role: "FINANCE_MANAGER",
    roleName: "مدير المالية",
    roleDescription: "مسؤول الشؤون المالية والتقارير",
    businessTypes: ["MANUFACTURER", "IMPORTER", "EXPORTER", "TRADER"],
    permissions: [
      {
        permission: permissions.find(p => p.id === "view_own_profile")!,
        requiresKYC: true,
        requiresKYB: false,
        requiresVerifiedBusiness: false,
        requiresRelationship: false,
        notes: "عرض الملف الشخصي",
      },
      {
        permission: permissions.find(p => p.id === "view_quotations")!,
        requiresKYC: true,
        requiresKYB: true,
        requiresVerifiedBusiness: true,
        requiresRelationship: false,
        notes: "عرض العروض والأسعار",
      },
      {
        permission: permissions.find(p => p.id === "view_audit_logs")!,
        requiresKYC: true,
        requiresKYB: true,
        requiresVerifiedBusiness: false,
        requiresRelationship: false,
        notes: "عرض السجلات المالية",
      },
      {
        permission: permissions.find(p => p.id === "export_reports")!,
        requiresKYC: true,
        requiresKYB: true,
        requiresVerifiedBusiness: false,
        requiresRelationship: false,
        notes: "تصدير التقارير المالية",
      },
    ],
  },
  {
    role: "CONSUMER",
    roleName: "المستهلك",
    roleDescription: "مشتري فردي - صلاحيات محدودة",
    businessTypes: ["CONSUMER"],
    permissions: [
      {
        permission: permissions.find(p => p.id === "view_own_profile")!,
        requiresKYC: true,
        requiresKYB: false,
        requiresVerifiedBusiness: false,
        requiresRelationship: false,
        notes: "عرض الملف الشخصي",
      },
      {
        permission: permissions.find(p => p.id === "view_verified_products")!,
        requiresKYC: true,
        requiresKYB: false,
        requiresVerifiedBusiness: false,
        requiresRelationship: false,
        notes: "عرض المنتجات الموثقة",
      },
      {
        permission: permissions.find(p => p.id === "view_matches")!,
        requiresKYC: true,
        requiresKYB: false,
        requiresVerifiedBusiness: false,
        requiresRelationship: false,
        notes: "عرض الفرص المتاحة",
      },
      {
        permission: permissions.find(p => p.id === "create_purchase_request")!,
        requiresKYC: true,
        requiresKYB: false,
        requiresVerifiedBusiness: false,
        requiresRelationship: false,
        notes: "إنشاء طلب شراء",
      },
    ],
  },
];

const permissionById = (id: string) => permissions.find((permission) => permission.id === id)!;

const commercialAssignment = (
  permissionId: string,
  requirements: Omit<PermissionAssignment, "permission">,
): PermissionAssignment => ({ permission: permissionById(permissionId), ...requirements });

const businessActivityGate = (
  permissionId: string,
  notes: string,
  allowedRelationshipModes: RelationshipMode[] = [],
  manualReviewForModes: RelationshipMode[] = [],
): PermissionAssignment =>
  commercialAssignment(permissionId, {
    requiresKYC: true,
    requiresKYB: true,
    requiresVerifiedBusiness: true,
    requiresRelationship: false,
    requiresActiveMembership: true,
    requiresBusinessActivityVerification: true,
    requiresOfferingVerification: permissionId === "create_trade_offering",
    allowedRelationshipModes,
    manualReviewForModes,
    notes,
  });

const individualActivityGate = (
  permissionId: string,
  notes: string,
  allowedRelationshipModes: RelationshipMode[] = [],
): PermissionAssignment =>
  commercialAssignment(permissionId, {
    requiresKYC: true,
    requiresKYB: false,
    requiresVerifiedBusiness: false,
    requiresRelationship: false,
    requiresIndividualActivity: true,
    allowedRelationshipModes,
    notes,
  });

const appendCommercialPermissions = (role: UserRole, assignments: PermissionAssignment[]) => {
  const roleDefinition = rolePermissionMatrix.find((definition) => definition.role === role);
  if (roleDefinition) roleDefinition.permissions.push(...assignments);
};

appendCommercialPermissions("OWNER", [
  commercialAssignment("submit_business_activity_verification", {
    requiresKYC: true,
    requiresKYB: true,
    requiresVerifiedBusiness: true,
    requiresRelationship: false,
    requiresActiveMembership: true,
    notes: "المالك أو ممثل مفوض يقدّم تحقق النشاط للكيان المملوك أو الممثل.",
  }),
  businessActivityGate("evaluate_commercial_relationship", "يفحص B2B وB2C وC2B؛ مسار B2G يذهب إلى مراجعة يدوية.", ["b2b", "b2c", "c2b", "b2g"], ["b2g"]),
  businessActivityGate("create_trade_offering", "العرض يحتاج تحقق النشاط والتحقق المستقل للعرض قبل المطابقة.", ["b2b", "b2c"]),
  businessActivityGate("create_trade_demand", "الطلب يثبت مصدراً تجارياً واحداً ويخضع لقرار العلاقة.", ["b2b", "c2b"]),
  businessActivityGate("view_relationship_decision", "يرى القرار والسبب ضمن نطاق الكيان فقط.", ["b2b", "b2c", "c2b", "b2g"], ["b2g"]),
  businessActivityGate("view_relationship_audit", "الأثر مقيد بعلاقة الكيان وتصنيف البيانات.", ["b2b", "b2c", "c2b", "b2g"], ["b2g"]),
]);

appendCommercialPermissions("DIRECTOR", [
  commercialAssignment("submit_business_activity_verification", {
    requiresKYC: true,
    requiresKYB: true,
    requiresVerifiedBusiness: true,
    requiresRelationship: false,
    requiresActiveMembership: true,
    notes: "يتطلب تفويضاً نشطاً ضمن Scope الكيان.",
  }),
  businessActivityGate("evaluate_commercial_relationship", "تقييم العلاقة ضمن نطاق تفويض المدير.", ["b2b", "b2c", "c2b", "b2g"], ["b2g"]),
  businessActivityGate("view_relationship_decision", "قراءة قرارات العلاقة ضمن الكيان الممثل.", ["b2b", "b2c", "c2b", "b2g"], ["b2g"]),
]);

appendCommercialPermissions("PROCUREMENT_MANAGER", [
  businessActivityGate("evaluate_commercial_relationship", "يقيّم B2B وC2B لشراء الكيان؛ B2G للمراجعة فقط.", ["b2b", "c2b", "b2g"], ["b2g"]),
  businessActivityGate("create_trade_demand", "ينشئ طلبات B2B أو C2B ضمن تفويض المشتريات.", ["b2b", "c2b"]),
  businessActivityGate("view_relationship_decision", "قراءة قرار الطلبات الواقعة ضمن نطاقه.", ["b2b", "c2b", "b2g"], ["b2g"]),
]);

appendCommercialPermissions("SALES_MANAGER", [
  businessActivityGate("evaluate_commercial_relationship", "يقيّم B2B وB2C لبيع الكيان؛ B2G للمراجعة فقط.", ["b2b", "b2c", "b2g"], ["b2g"]),
  businessActivityGate("create_trade_offering", "ينشئ عروض B2B أو B2C ضمن نطاق المبيعات.", ["b2b", "b2c"]),
  businessActivityGate("view_relationship_decision", "قراءة قرارات العروض الواقعة ضمن نطاقه.", ["b2b", "b2c", "b2g"], ["b2g"]),
]);

appendCommercialPermissions("EXPORT_MANAGER", [
  businessActivityGate("evaluate_commercial_relationship", "يقيّم B2B؛ B2G لا يخرج من المراجعة اليدوية في الإصدار الحالي.", ["b2b", "b2g"], ["b2g"]),
  businessActivityGate("create_trade_offering", "ينشئ عروض B2B ضمن نطاق التصدير والقيود الجغرافية.", ["b2b"]),
  businessActivityGate("view_relationship_decision", "قراءة قرارات التصدير ضمن نطاقه فقط.", ["b2b", "b2g"], ["b2g"]),
]);

appendCommercialPermissions("FINANCE_MANAGER", [
  businessActivityGate("view_relationship_decision", "قراءة قرار العلاقة دون حق إنشاء العرض أو الطلب.", ["b2b", "b2c", "c2b"]),
  businessActivityGate("view_relationship_audit", "عرض محدود لأثر التدقيق وفق Scope المالية والتصنيف.", ["b2b", "b2c", "c2b"]),
]);

appendCommercialPermissions("CONSUMER", [
  individualActivityGate("submit_individual_activity_profile", "يقدّم المستهلك ملف نشاطه بعد KYC."),
  individualActivityGate("evaluate_commercial_relationship", "يقيّم B2C أو C2C فقط؛ لا يتيح Consumer → Factory/Importer.", ["b2c", "c2c"]),
  individualActivityGate("create_trade_demand", "ينشئ طلباً فردياً بعد تحقق ملف النشاط وقرار العلاقة.", ["b2c", "c2c"]),
  individualActivityGate("view_relationship_decision", "يرى القرار والسبب المختصر ضمن نطاقه الفردي.", ["b2c", "c2c"]),
]);

rolePermissionMatrix.push(
  {
    role: "INDIVIDUAL_ACTIVITY_HOLDER",
    roleName: "صاحب نشاط فردي",
    roleDescription: "مستهلك أو منتج فردي بعد KYC وملف نشاط فردي موثق",
    businessTypes: ["CONSUMER"],
    permissions: [
      individualActivityGate("submit_individual_activity_profile", "يحدّث ملف النشاط الفردي الذي يملكه."),
      individualActivityGate("evaluate_commercial_relationship", "يقيّم C2B أو C2C حسب نوع النشاط الفردي.", ["c2b", "c2c"]),
      individualActivityGate("create_trade_offering", "ينشئ عرضاً فردياً واحد المصدر بعد قرار العلاقة والتحقق المستقل للعرض.", ["c2b", "c2c"]),
      individualActivityGate("create_trade_demand", "ينشئ طلباً فردياً ضمن نمط العلاقة المؤهل.", ["c2b", "c2c"]),
      individualActivityGate("view_relationship_decision", "يرى القرار والسبب ضمن ملف النشاط الذي يملكه.", ["c2b", "c2c"]),
    ],
  },
  {
    role: "COMPLIANCE_REVIEWER",
    roleName: "مراجع الامتثال التجاري",
    roleDescription: "دور إداري مقيّد لمراجعة النشاط وقرارات العلاقة؛ لا ينشئ عروضاً أو طلبات.",
    businessTypes: ["MANUFACTURER", "IMPORTER", "EXPORTER", "TRADER", "RETAILER"],
    permissions: [
      commercialAssignment("review_activity_verification", {
        requiresKYC: false,
        requiresKYB: false,
        requiresVerifiedBusiness: false,
        requiresRelationship: false,
        notes: "صلاحية خادمية إدارية مستقلة تتطلب role_scope للمراجعة، ولا يمنحها اختيار الواجهة.",
      }),
      commercialAssignment("view_relationship_audit", {
        requiresKYC: false,
        requiresKYB: false,
        requiresVerifiedBusiness: false,
        requiresRelationship: false,
        notes: "قراءة مقيدة لقرارات العلاقة وأثرها في نطاق الامتثال وتصنيف البيانات.",
      }),
    ],
  },
);
