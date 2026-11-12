# COME IN IT — Canonical Entity Dictionary

## قاعدة القراءة

كل كيان له هوية مستقلة، غرض واضح، حالة، مالك أو نطاق، متطلبات تدقيق، وقيود رؤية. `USER_ACCOUNT` ليس شركة، و`KYB_RECORD` لا يثبت منتجًا أو خدمة أو أصلًا.

| Entity | الطبقة | الغرض | الحالة الأساسية | المالك/الرابط الحاكم |
|---|---|---|---|---|
| PERSON | Identity | الفرد الذي تبدأ منه الهوية | ACTIVE | لا يعتمد على كيان تجاري |
| USER_ACCOUNT | Identity | حساب الدخول | ACTIVE/SUSPENDED/CLOSED | PERSON 1:1 |
| KYC_RECORD | Verification | تحقق الشخص | DRAFT→VERIFIED أو REJECTED/SUSPENDED/REVOKED/EXPIRED | PERSON |
| VERIFIED_IDENTITY | Identity | إسقاط الهوية الناجحة | ACTIVE/SUSPENDED/REVOKED | KYC_RECORD |
| BUSINESS_ENTITY | Entity | الشركة أو المصنع أو المتجر أو المزود | DRAFT/PENDING_KYB/VERIFIED/SUSPENDED/REVOKED | KYB_RECORD |
| GOVERNMENT_ENTITY | Entity | الجهة الحكومية صاحبة الاختصاص | PENDING/VERIFIED/SUSPENDED/REVOKED | Government authority |
| KYB_RECORD | Verification | تحقق الكيان | DRAFT→VERIFIED أو REJECTED/SUSPENDED/REVOKED/EXPIRED | BUSINESS_ENTITY |
| BUSINESS_MEMBERSHIP | Authorization | علاقة الشخص بالكيان | INVITED/PENDING/ACTIVE/SUSPENDED/REVOKED | PERSON + ENTITY |
| INDIVIDUAL_ACTIVITY_PROFILE | Commercial Capability | ملف نشاط للمستهلك أو المنتج الفردي | PENDING/VERIFIED/REJECTED/SUSPENDED/EXPIRED | PERSON فقط؛ لا رابط لـHealthcare |
| BUSINESS_ACTIVITY_VERIFICATION | Commercial Capability | تحقق مستقل من قدرة تشغيلية لمصنع أو متجر أو مستورد أو مصدر أو مزود خدمة | PENDING/VERIFIED/REJECTED/SUSPENDED/EXPIRED | BUSINESS_ENTITY بعد KYB |
| ROLE | Authorization | مجموعة وظيفة | ACTIVE/INACTIVE | Platform policy |
| PERMISSION | Authorization | فعل محكوم | ACTIVE/INACTIVE | Policy registry |
| ROLE_PERMISSION | Authorization | تفويض permission للدور | ACTIVE/REVOKED | ROLE + PERMISSION |
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
| AUDIT_LOG | Audit | سجل WORM | SEALED فقط بعد append | Actor/Subject |
| COMPLIANCE_CERTIFICATE | Compliance | شهادة مشتقة | ISSUED/ACTIVE/SUSPENDED/EXPIRED/REVOKED | ENTITY |
| NOTIFICATION | Support | تنبيه قابل للتتبع | UNREAD/READ/ACKNOWLEDGED/DISMISSED | Recipient |

## قواعد الحقول والقيود

تستخدم الكيانات الكنسية UUID منطقياً؛ أما جداول التنفيذ الحالية لملفات النشاط والتجارة التشغيلية فتستخدم مفاتيح `bigint` محلية. كل FK يجب أن يشير إلى كيان كنسي صالح. الحقول الحساسة لا تُفهرس في فهارس عامة بصورتها الخام. يجب توفير فهارس على `status`, `entity_id`, `person_id`, `created_at`, وحقول البحث المرمزة عند الحاجة. يحتاج مصدر `TRADE_OFFERING` و`TRADE_DEMAND` إلى discriminator وواحد فقط من المراجع الفردية أو التجارية، فلا يُترك polymorphism غامضاً في migration.

## قواعد العلاقات

العلاقة توثق Cardinality وDirection وOptionality وOwnership وDelete Behavior وBusiness Meaning. لا يسمح بالحذف الصلب لسجلات KYC/KYB أو Audit أو Evidence المختومة. الإلغاء والتعليق حالات domain لا حذف للسجل.
