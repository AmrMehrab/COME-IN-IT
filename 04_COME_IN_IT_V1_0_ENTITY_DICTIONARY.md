# COME IN IT — Canonical Entity Dictionary

## قاعدة القراءة

كل كيان له هوية مستقلة، غرض واضح، حالة، مالك أو نطاق، متطلبات تدقيق، وقيود رؤية. `USER_ACCOUNT` ليس شركة، و`KYB_RECORD` لا يثبت منتجًا أو خدمة أو أصلًا.

| Entity | الطبقة | الغرض | الحالة الأساسية | المالك/الرابط الحاكم |
|---|---|---|---|---|
| PERSON | Identity | الفرد الذي تبدأ منه الهوية | ACTIVE | لا يعتمد على كيان تجاري |
| USER_ACCOUNT | Identity | حساب الدخول | ACTIVE/SUSPENDED/CLOSED | PERSON 1:1 |
| KYC_RECORD | Verification | تحقق الشخص | DRAFT→VERIFIED أو REJECTED/SUSPENDED/REVOKED/EXPIRED | PERSON |
| VERIFIED_IDENTITY | Identity | إسقاط الهوية الناجحة | ACTIVE/SUSPENDED/REVOKED | KYC_RECORD |
| BUSINESS_ENTITY | Entity | الشركة أو المصنع أو المتجر أو المزود؛ مقدم الطلب منفصل عن المالك | DRAFT/PENDING_KYB/VERIFIED/SUSPENDED/REVOKED | KYB_RECORD؛ `createdBy*` مقدم الطلب و`owner*` اختياريان |
| GOVERNMENT_ENTITY | Entity | الجهة الحكومية صاحبة الاختصاص | PENDING/VERIFIED/SUSPENDED/REVOKED | Government authority |
| KYB_RECORD | Verification | تحقق الكيان | DRAFT→VERIFIED أو REJECTED/SUSPENDED/REVOKED/EXPIRED | BUSINESS_ENTITY |
| BUSINESS_MEMBERSHIP | Authorization | علاقة الشخص بالكيان؛ الدور توصيف لا يمنح إذناً تلقائياً | INVITED/PENDING/ACTIVE/SUSPENDED/REVOKED | PERSON + ENTITY؛ يتطلب التفويض النشط إذناً صريحاً |
| INDIVIDUAL_ACTIVITY_PROFILE | Commercial Capability | ملف نشاط للمستهلك أو المنتج الفردي | PENDING/VERIFIED/REJECTED/SUSPENDED/EXPIRED | PERSON فقط؛ لا رابط لـHealthcare |
| BUSINESS_ACTIVITY_VERIFICATION | Commercial Capability | تحقق مستقل من قدرة تشغيلية لمصنع أو متجر أو مستورد أو مصدر أو مزود خدمة | PENDING/VERIFIED/REJECTED/SUSPENDED/EXPIRED | BUSINESS_ENTITY بعد KYB |
| ROLE | Authorization | مجموعة وظيفة | ACTIVE/INACTIVE | Platform policy |
| PERMISSION | Authorization | فعل محكوم | ACTIVE/INACTIVE | Policy registry |
| ROLE_PERMISSION | Authorization | نموذج تصميمي لتجميع الأذونات حسب الدور؛ غير مستخدم كمنح runtime في هذا التنفيذ | ACTIVE/REVOKED | ROLE + PERMISSION |
| BUSINESS_MEMBERSHIP_PERMISSION | Authorization | منحة صريحة لرمز صلاحية ضمن عضوية واحدة، مع مصدر المنح والانتهاء والإبطال | ACTIVE/REVOKED/EXPIRED | BUSINESS_MEMBERSHIP؛ لا يوجد API عام لإدارة المنح بعد |
| PRODUCT | Offering | عرض منتج | DRAFT→VERIFIED أو REJECTED/SUSPENDED/REVOKED/ARCHIVED | BUSINESS_ENTITY |
| PRODUCT_VERIFICATION | Verification | تحقق مستقل للمنتج | DRAFT→VERIFIED أو terminal failure | PRODUCT |
| SERVICE | Offering | قدرة أو خدمة | DRAFT→VERIFIED أو terminal failure | BUSINESS_ENTITY |
| SERVICE_VERIFICATION | Verification | تحقق مستقل للخدمة | DRAFT→VERIFIED أو terminal failure | SERVICE |
| USED_ASSET | Offering | أصل مستخدم للبيع/المطابقة | DRAFT→VERIFIED أو TRANSFERRED/ARCHIVED | PERSON أو BUSINESS_ENTITY |
| ASSET_VERIFICATION | Verification | تحقق الملكية والحالة | DRAFT→VERIFIED أو terminal failure | USED_ASSET |
| DEMAND | Trade | طلب احتياج | DRAFT/PUBLISHED/MATCHING/OFFERED/FULFILLED/CANCELLED/EXPIRED | PERSON/ENTITY |
| TRADE_RELATIONSHIP | Trade | علاقة ونطاق وصول | PROPOSED/ACTIVE/SUSPENDED/CLOSED | طرفان موثقان |
| MATCH | Matching | نتيجة أهلية مفسرة | CANDIDATE/ELIGIBLE/OFFERED/DECLINED/EXPIRED | DEMAND + OFFERING |
| OFFER | Trade | عرض تجاري | DRAFT/SENT/ACCEPTED/REJECTED/EXPIRED/WITHDRAWN | MATCH |
| NEGOTIATION | Trade | سجل التفاوض | OPEN/PENDING_RESPONSE/AGREED/ABANDONED | OFFER |
| CONTRACT | Trade | الاتفاق الموقّع | DRAFT/PENDING_SIGNATURE/ACTIVE/COMPLETED/TERMINATED/EXPIRED | TRADE_RELATIONSHIP |
| ORDER | Trade | أمر التنفيذ | DRAFT/PLACED/CONFIRMED/IN_FULFILLMENT/COMPLETED/CANCELLED | CONTRACT |
| TRANSACTION | Trade | إثبات الإتمام | INITIATED/PROCESSING/COMPLETED/FAILED/REVERSED/DISPUTED | ORDER |
| GOVERNMENT_PROCUREMENT | B2G | مناقصة أو شراء حكومي | DRAFT/PUBLISHED/EVALUATION/AWARDED/CANCELLED/CLOSED | GOVERNMENT_ENTITY + DEMAND |
| DISPUTE | Compliance | نزاع تجاري | OPEN/TRIAGE/MEDIATION/ARBITRATION/DECIDED/CLOSED/ESCALATED | CONTRACT/TRANSACTION |
| EVIDENCE | Compliance | دليل ببصمة | SUBMITTED/VALIDATED/REJECTED/SEALED | DISPUTE |
| AUDIT_LOG | Audit | حدث تطبيقي منظم؛ لا يثبت وحده ضمان WORM | APPENDED؛ قابل للتعديل على مستوى مخزن البيانات ما لم تضف ضوابط بنية تحتية | Actor/Subject/Business/Membership/Permission/Decision/Reason |
| COMMERCE_PURCHASE_ORDER | Trade | طلب شراء من كتالوج موثوق، مرتبط بمنشأة المشتري والعرض والمورد | DRAFT/SUBMITTED/ACKNOWLEDGED/CANCELLED | `buyerBusinessId` + `offeringId` + المورد؛ لا يقبل شراء فردياً حالياً |
| COMPLIANCE_CERTIFICATE | Compliance | شهادة مشتقة | ISSUED/ACTIVE/SUSPENDED/EXPIRED/REVOKED | ENTITY |
| NOTIFICATION | Support | تنبيه قابل للتتبع | UNREAD/READ/ACKNOWLEDGED/DISMISSED | Recipient |

## قواعد الحقول والقيود

تستخدم الكيانات الكنسية UUID منطقياً؛ أما جداول التنفيذ الحالية لملفات النشاط والتجارة التشغيلية فتستخدم مفاتيح `bigint` محلية. كل FK يجب أن يشير إلى كيان كنسي صالح. الحقول الحساسة لا تُفهرس في فهارس عامة بصورتها الخام. يجب توفير فهارس على `status`, `entity_id`, `person_id`, `created_at`, وحقول البحث المرمزة عند الحاجة. يحتاج مصدر `TRADE_OFFERING` و`TRADE_DEMAND` إلى discriminator وواحد فقط من المراجع الفردية أو التجارية، فلا يُترك polymorphism غامضاً في migration.

## ملحق المطابقة مع التنفيذ — 2026-11-15

المخطط الفعلي في `drizzle/schema.ts` يعرّف `businessEntities.createdByUserId/createdByPersonId` منفصلين عن `ownerUserId/ownerPersonId`. حقلا المنشئ والمالك اختياريان للسجلات القديمة؛ إنشاء منشأة جديدة يحفظ مقدم الطلب ويترك المالك فارغاً. إنشاء المنشأة لا ينشئ `BUSINESS_MEMBERSHIP` تلقائياً.

تُخزن المنح الحالية في `business_membership_permissions` وترتبط بعضوية محددة، مع `permissionCode`, `status`, `grantedByUserId`, `grantedAt`, `expiresAt`, و`revokedAt`. لا يوجد حالياً مسار tRPC عام لمنح/إلغاء عضوية أو صلاحية؛ الاختبارات تزرع عضوية ومنحاً مخصصين لبيئة الاختبار. يجب ألا يفهم من وجود جدول أو دور `owner` أن إثبات الملكية أو سير الموافقة قد نُفذ.

يحتوي `audit_events` على الفاعل والعملية والمورد والمنشأة والعضوية ورمز الصلاحية وقرار `allow/deny/manual_review` وسبب الرفض وrequest ID وتصنيف البيانات والبيانات الوصفية. التطبيق يضيف السجلات عند نقاط التنفيذ، لكن لا توجد حماية قاعدة بيانات أو مخزن WORM أو مدد احتفاظ معتمدة. كما أن أوامر الشراء تربط المشتري ب`buyerBusinessId` وبعرض ومورد؛ C2C وB2G مغلقان افتراضياً.

## قواعد العلاقات

العلاقة توثق Cardinality وDirection وOptionality وOwnership وDelete Behavior وBusiness Meaning. **كتوصية تصميمية غير معتمدة وليست سياسة نافذة:** يفضل تجنب الحذف الصلب لسجلات KYC/KYB أو Audit أو Evidence، واستخدام انتقالات domain مثل الإلغاء أو التعليق حيثما يلائم ذلك. لا يحدد هذا المستند مدد الاحتفاظ أو قواعد الحذف؛ وهي قرارات مؤجلة حتى اعتماد سياسة الخصوصية والاحتفاظ.
