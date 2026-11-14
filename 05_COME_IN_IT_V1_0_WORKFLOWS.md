# COME IN IT — V1.0 Workflow Catalog

## قالب الحوكمة

لكل مسار: **Actor → Permission → Trigger → Validation → Transition → Audit Event → Invalid Transition**. أي مسار غير مطبق في الواجهة الحالية يبقى baseline تصميميًا ولا يُدّعى أنه API منفذ.

| ID | المسار | Actor | Permission | Audit Event | نطاق V1.0 |
|---|---|---|---|---|---|
| WF-001 | Registration | INDIVIDUAL | account.create | ACCOUNT_CREATED | In scope |
| WF-002 | KYC Submission | INDIVIDUAL | kyc.submit | KYC_SUBMITTED | In scope |
| WF-003 | KYC Verification | COMPLIANCE | kyc.verify | KYC_VERIFIED/REJECTED | In scope |
| WF-004 | KYB | BUSINESS_ADMIN | kyb.submit | KYB_SUBMITTED | In scope |
| WF-005 | Business Membership | BUSINESS_ADMIN | membership.invite | MEMBERSHIP_CREATED | تصميم فقط؛ الدعوة/الاعتماد غير منفذين |
| WF-006 | Role Assignment | BUSINESS_ADMIN | role.assign | ROLE_ASSIGNED | تصميم فقط؛ إسناد الدور تشغيلياً غير منفذ |
| WF-007 | Product Registration | AUTHORIZED_MEMBER | product.create | PRODUCT_REGISTERED | In scope |
| WF-008 | Product Verification | COMPLIANCE | product.verify | PRODUCT_VERIFIED | In scope |
| WF-009 | Service Registration | SERVICE_PROVIDER | service.create | SERVICE_REGISTERED | In scope |
| WF-010 | Service Verification | COMPLIANCE | service.verify | SERVICE_VERIFIED | In scope |
| WF-011 | Used Asset Registration | INDIVIDUAL/ENTITY | asset.create | ASSET_REGISTERED | In scope |
| WF-012 | Asset Verification | COMPLIANCE | asset.verify | ASSET_VERIFIED | In scope |
| WF-013 | Demand Creation | VERIFIED_ACTOR | demand.create | DEMAND_CREATED | In scope |
| WF-014 | Matching | MATCHING_SERVICE | matching.evaluate | MATCH_EVALUATED | Baseline only |
| WF-015 | Offer | TRADE_PARTY | offer.create | OFFER_SENT | Baseline only |
| WF-016 | Negotiation | TRADE_PARTY | negotiation.write | NEGOTIATION_UPDATED | Baseline only |
| WF-017 | Contract | TRADE_PARTY | contract.create | CONTRACT_CREATED/SIGNED | Baseline only |
| WF-018 | Order | TRADE_PARTY | order.create | ORDER_PLACED | Baseline only |
| WF-019 | Transaction | TRADE_PARTY | transaction.record | TRANSACTION_UPDATED | Baseline only |
| WF-020 | B2C Purchase | CONSUMER/STORE | order.create | B2C_ORDER_CREATED | Baseline only |
| WF-021 | C2C Used Market | INDIVIDUAL | asset.transfer | ASSET_TRANSFERRED | Baseline only |
| WF-022 | C2B Request | CONSUMER/BUSINESS | demand.create | C2B_DEMAND_CREATED | Baseline only |
| WF-023 | B2G Procurement | GOVERNMENT/BUSINESS | procurement.respond | PROCUREMENT_SUBMITTED | Baseline only |
| WF-024 | Fulfillment | LOGISTICS/TRADE_PARTY | order.fulfill | FULFILLMENT_UPDATED | Baseline only |
| WF-025 | Completion | TRADE_PARTY | transaction.complete | TRANSACTION_COMPLETED | Baseline only |
| WF-026 | Dispute | TRADE_PARTY | dispute.open | DISPUTE_OPENED | In scope as simulator |
| WF-027 | Evidence | DISPUTE_PARTY/COMPLIANCE | evidence.submit | EVIDENCE_SUBMITTED | تصميم/جزئي؛ لا يثبت ختم تخزين |
| WF-028 | Audit | COMPLIANCE/ADMIN | audit.read | AUDIT_QUERIED | جزئي: سجل تطبيقي؛ لا WORM |
| WF-029 | Verification Suspension | COMPLIANCE | verification.suspend | VERIFICATION_SUSPENDED | Baseline only |
| WF-030 | Verification Revocation | COMPLIANCE | verification.revoke | VERIFICATION_REVOKED | Baseline only |

## انتقالات غير صحيحة

لا ينتقل أي كيان إلى `VERIFIED` دون actor وpermission وأدلة تحقق صالحة. لا ينتقل Contract إلى Active دون متطلبات التوقيع المحددة. لا يُغلق Dispute قبل قرار موثق أو تصعيد. الانتقال غير الصحيح يعيد خطأ domain، ولا يغير الحالة، ويسجل محاولة الرفض في Audit Log.

## ملاحظة التنفيذ

الجدول أعلاه هو فهرس التصميم، وليس تقرير تنفيذ دقيقاً. يتضمن التطبيق الحالي خدمات خلفية فعلية لبعض عمليات التحقق والتجارة، ولا يصح وصف كل المسارات بأنها محاكاة فقط. تحدد الإضافة أدناه ما نفذ وما بقي مغلقاً أو غير مختبر.

## حالة التنفيذ على feature/CIT-PORTAL-001 — 2026-11-15

| المسار | الحالة في الشيفرة | حدود الإثبات |
|---|---|---|
| إنشاء سجل المنشأة | منفذ؛ يسجل مقدم الطلب، ويترك المالك فارغاً ولا ينشئ عضوية | إثبات الملكية وإسناد المالك والعضوية والمنح غير منفذ كإجراء إداري |
| اختيار سياق المنشأة وقراءة البيانات | منفذ عند وجود KYC وعضوية نشطة ومنحة `business.read` صريحة | لا توجد واجهة عامة لإدارة العضويات أو منح الصلاحيات |
| تحديث المنشأة / إرسال KYB / النشاط | يتطلب صلاحية صريحة مرتبطة بعضوية نشطة وسياق المنشأة | سياسة الأدلة والممثل القانوني ومسار الإسناد غير محسومة؛ التنفيذ التكاملي لم يختبر |
| العرض والطلب والمطابقة | خدمات خادمية مع صلاحيات وثقة وسياق؛ إنشاء العرض والطلب التجاري يتطلب منحاً صريحة | مطابقة التنفيذ التجاري متاحة لمسارات الأعمال المؤهلة فقط؛ C2B/C2C ليست مسارات تجارة مفتوحة |
| أمر الشراء | منفذ للشراء من منشأة إلى منشأة مؤهلة؛ يعيد الخادم بيانات العرض التجارية المعتمدة | الشراء الفردي وB2G مغلقان؛ لا دفع مالي فعلي |
| RFQ → عرض سعر → معاملة ونقل وتسليم وإغلاق/نزاع | خدمات خلفية موجودة وحراس تفويض وسياسات انتقال | لا توجد قاعدة اختبار متاحة لهذا التشغيل؛ اختبارات التكامل تعثرت لغياب `DATABASE_URL`، ولا يثبت ذلك نجاح التكامل |
| قرارات التفويض | يكتب الخادم أحداث سماح/رفض منظمة مع رموز أسباب | سجل قاعدة البيانات ليس WORM؛ الاحتفاظ ومخزن التدقيق المحمي لم يعتمدا |

لا تغطي الشيفرة حالياً واجهات دعوة/اعتماد عضوية أو إدارة منح الصلاحيات؛ لذلك لا يُفهم من قابلية الاختبار بزرع بيانات العضوية مباشرة أن هذه الرحلة التشغيلية قد نُفذت. تبقى MFA، أعمار الجلسات، الملكية متعددة الأطراف، C2C، B2C، C2B، B2G، الخصوصية/الاحتفاظ، والتكاملات القانونية أو الحكومية قرارات معلقة أو خارج النطاق حتى اعتمادها.

أي حالة باسم `EVIDENCE_SEALED` في نموذج أو سجل لا تثبت بذاتها وجود ختم تشفيري أو تخزين غير قابل للتعديل أو سياسة احتفاظ. لا يوجد حالياً إثبات تخزين WORM للأدلة أو لسجل التدقيق.
