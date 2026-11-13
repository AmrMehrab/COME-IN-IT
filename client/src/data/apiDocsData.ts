export interface ApiEndpoint {
  id: string;
  method: "GET" | "POST" | "PUT" | "DELETE";
  path: string;
  title: string;
  category: string;
  description: string;
  authRequired: string;
  requestBody?: object;
  responseBody: object;
  curlExample: string;
}

export const API_ENDPOINTS: ApiEndpoint[] = [
  {
    id: "kyc-verify",
    method: "POST",
    path: "/api/v1/identity/kyc/verify",
    title: "التحقق من هوية المستخدم (KYC)",
    category: "Identity & Trust",
    description: "إرسال البيانات الشخصية والوثائق الرسمية للتحقق من هوية الأفراد عبر البوابة القومية للاتصالات والداخلية.",
    authRequired: "Bearer Token (User Level)",
    requestBody: {
      nationalId: "29812050102938",
      fullName: "محمد أحمد حسن إبراهيم",
      documentType: "NATIONAL_ID",
      documentFrontUrl: "/manus-storage/doc_front_9918.png",
      documentBackUrl: "/manus-storage/doc_back_9918.png",
      issuingState: "ARE"
    },
    responseBody: {
      status: "success",
      code: 200,
      data: {
        userId: "usr_99182049",
        kycStatus: "VERIFIED",
        verificationLevel: "LEVEL_3_BIOMETRIC",
        verifiedAt: "2026-08-14T10:30:00Z",
        riskScore: 0.02,
        message: "تم التحقق بنجاح وربط بصمة الهوية بالبنية السيادية."
      }
    },
    curlExample: `curl -X POST "https://api.come-in-it.gov.eg/api/v1/identity/kyc/verify" \\
  -H "Authorization: Bearer cii_live_99812...кура" \\
  -H "Content-Type: application/json" \\
  -d '{"nationalId": "29812050102938", "fullName": "محمد أحمد حسن إبراهيم"}'`
  },
  {
    id: "kyb-submit",
    method: "POST",
    path: "/api/v1/business/kyb/register",
    title: "تسجيل والتحقق من الكيان التجاري (KYB)",
    category: "Identity & Trust",
    description: "تسجيل السجل التجاري والبطاقة الضريبية والتراخيص الحكومية للكيان التجاري وإثبات الممثلين المفوضين.",
    authRequired: "Bearer Token (KYC Verified User)",
    requestBody: {
      commercialRegisterNumber: "109283-EG",
      taxId: "492-102-398",
      companyName: "الشركة المصرية للصناعات الهندسية والتصدير",
      legalForm: "ش.م.م",
      governorate: "القاهرة",
      authorizedRepresentativeUserId: "usr_99182049",
      tradeModelsSupported: ["B2B", "B2G"]
    },
    responseBody: {
      status: "success",
      code: 201,
      data: {
        businessId: "biz_88192041",
        kybStatus: "VERIFIED",
        assignedEntityId: "EGY-KYB-2026-90412",
        chamberOfCommerceStatus: "ACTIVE",
        verifiedAt: "2026-08-14T11:00:00Z",
        wormLogRef: "worm_tx_99102938"
      }
    },
    curlExample: `curl -X POST "https://api.come-in-it.gov.eg/api/v1/business/kyb/register" \\
  -H "Authorization: Bearer cii_live_99812..." \\
  -H "Content-Type: application/json" \\
  -d '{"commercialRegisterNumber": "109283-EG", "taxId": "492-102-398"}'`
  },
  {
    id: "product-verify",
    method: "POST",
    path: "/api/v1/marketplace/products/verify",
    title: "إدراج والتحقق من هوية المنتج",
    category: "Marketplace & Engine",
    description: "إدراج منتج جديد بواسطة كيان موثق (KYB) مع إخضاعه لدورة حياة التحقق المستقلة والمواصفات الجمركية.",
    authRequired: "Bearer Token (Business KYB Verified)",
    requestBody: {
      businessId: "biz_88192041",
      productName: "خط إنتاج تعبئة أوتوماتيكي موديل X9",
      hsCode: "8422.30.00",
      technicalSpecs: {
        capacity: "5000 units/hr",
        power: "380V 3-phase",
        origin: "مصر"
      },
      complianceCertificates: ["ISO-9001", "CE-MARK"],
      priceExwUsd: 125000
    },
    responseBody: {
      status: "success",
      code: 201,
      data: {
        productId: "prd_77192031",
        verificationStatus: "VERIFIED",
        lifecycleStage: "ACTIVE_LISTING",
        qualityScore: 9.8,
        createdAt: "2026-08-14T12:15:00Z"
      }
    },
    curlExample: `curl -X POST "https://api.come-in-it.gov.eg/api/v1/marketplace/products/verify" \\
  -H "Authorization: Bearer cii_live_99812..." \\
  -H "Content-Type: application/json" \\
  -d '{"businessId": "biz_88192041", "productName": "خط إنتاج تعبئة أوتوماتيكي موديل X9", "hsCode": "8422.30.00"}'`
  },
  {
    id: "service-register",
    method: "POST",
    path: "/api/v1/services/register",
    title: "تسجيل خدمة مساندة (شحن / تخليص / صيانة)",
    category: "Marketplace & Engine",
    description: "تسجيل خدمة مساندة ضمن سجل الخدمات (Service Registry) بمعايير SLA وتسعير ونطاق تغطية جغرافية.",
    authRequired: "Bearer Token (Business KYB Verified)",
    requestBody: {
      businessId: "biz_55210931",
      serviceType: "LOGISTICS_FREIGHT",
      serviceName: "نقل حاويات ثقيلة 40 قدم - الإسكندرية للقاهرة",
      slaCommitment: "48 hours maximum transit",
      coverageArea: "جمهورية مصر العربية",
      pricingModel: "PER_TON_KM"
    },
    responseBody: {
      status: "success",
      code: 201,
      data: {
        serviceId: "srv_44920192",
        status: "VERIFIED",
        serviceRegistryRef: "SRV-REG-2026-092",
        registeredAt: "2026-08-14T13:00:00Z"
      }
    },
    curlExample: `curl -X POST "https://api.come-in-it.gov.eg/api/v1/services/register" \\
  -H "Authorization: Bearer cii_live_99812..." \\
  -H "Content-Type: application/json" \\
  -d '{"businessId": "biz_55210931", "serviceType": "LOGISTICS_FREIGHT"}'`
  },
  {
    id: "matching-engine",
    method: "POST",
    path: "/api/v1/engine/match",
    title: "محرك المطابقة الواعي بالعلاقات (Matching Engine)",
    category: "Marketplace & Engine",
    description: "استعلام متقدم لمطابقة طلبات الشراء (RFQ) أو الطلب (Demand) مع المنتجات والخدمات المؤهلة جغرافياً وقانونياً.",
    authRequired: "Bearer Token (Verified Entity)",
    requestBody: {
      buyerBusinessId: "biz_88192041",
      tradeModel: "B2B",
      targetCategory: "INDUSTRIAL_MACHINERY",
      destinationGovernorate: "السويس",
      maxLeadTimeDays: 30,
      requiredCertifications: ["ISO-9001"]
    },
    responseBody: {
      status: "success",
      code: 200,
      data: {
        matchSessionId: "mat_99182049",
        totalCandidatesChecked: 142,
        eligibleMatchesCount: 5,
        matches: [
          {
            supplierBusinessId: "biz_11293841",
            supplierName: "مصانع الهندسية الثقيلة",
            productId: "prd_77192031",
            matchScore: 0.96,
            relationshipStatus: "ESTABLISHED_VERIFIED",
            incotermsSupported: ["EXW", "FOB"]
          }
        ]
      }
    },
    curlExample: `curl -X POST "https://api.come-in-it.gov.eg/api/v1/engine/match" \\
  -H "Authorization: Bearer cii_live_99812..." \\
  -H "Content-Type: application/json" \\
  -d '{"buyerBusinessId": "biz_88192041", "tradeModel": "B2B", "targetCategory": "INDUSTRIAL_MACHINERY"}'`
  },
  {
    id: "audit-worm-query",
    method: "GET",
    path: "/api/v1/audit/worm/logs?entityId=biz_88192041&limit=10",
    title: "استعلام سجلات التدقيق غير القابلة للتعديل (WORM Audit)",
    category: "Security & Governance",
    description: "استعراض سجلات التدقيق الزمنية المشفرة وغير القابلة للحذف لجميع العمليات والأحداث الحساسة المرتبطة بالكيان.",
    authRequired: "Bearer Token (Admin / Compliance Officer)",
    responseBody: {
      status: "success",
      code: 200,
      data: {
        queryTimestamp: "2026-08-14T14:00:00Z",
        totalRecords: 1,
        immutableStorage: "WORM_SECURE_VAULT_EG",
        logs: [
          {
            logId: "worm_log_9918204",
            eventType: "KYB_VERIFICATION_APPROVED",
            actorId: "usr_admin_01",
            targetEntityId: "biz_88192041",
            sha256Hash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
            createdAt: "2026-08-14T11:00:00Z"
          }
        ]
      }
    },
    curlExample: `curl -X GET "https://api.come-in-it.gov.eg/api/v1/audit/worm/logs?entityId=biz_88192041&limit=10" \\
  -H "Authorization: Bearer cii_admin_token..."`
  }
];
