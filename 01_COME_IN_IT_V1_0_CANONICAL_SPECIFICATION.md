# COME IN IT — V1.0 Canonical Specification

## حالة الوثيقة

هذه الوثيقة هي ناتج **Architecture Reconciliation** بين Prompt المصالحة، Baseline JSON، Baseline Mermaid، مصادر المواصفة الحالية، ومصفوفة الصلاحيات وعقود API المعروضة في المنصة. لا تُعلن الوثيقة جاهزية إنتاجية مطلقة؛ الحكم التنفيذي الحالي هو **READY WITH CONDITIONS**.

## 1. الملخص المعماري التنفيذي

COME IN IT هي شبكة تجارة رقمية موثوقة، وليست سوق منتجات فقط. القاعدة الحاكمة هي: **لا جهة مجهولة تتاجر مع جهة مجهولة، ولا يُجرى أي تداول على منتج أو خدمة أو أصل مجهول**. يبدأ الوصول من Person وKYC، ثم Verified Identity، ثم Entity وKYB، ثم Membership وRole وPermission، ثم Offering Identity وOffering Verification، ثم Matching وTrade Access، ثم Contract وOrder وTransaction، مع Audit وIntelligence كطبقتين عابرتين لكل عملية حساسة.

## 2. المبادئ التجارية

الفصل بين الفرد والحساب والكيان إلزامي. يمكن للفرد الموثق أن يرتبط بأكثر من كيان عبر عضويات مستقلة، ويمكن للكيان أن يملك ممثلين مفوضين متعددين. يدعم النموذج B2B وB2C وC2B وC2C وB2G، ويعامل Product وService وUsed Asset وDemand ككيانات تجارة من الدرجة الأولى. لا تكفي KYB لإثبات صلاحية أي منتج أو خدمة أو أصل.

## 3. الممثلون وواجهات الأدوار

يدعم النموذج Individual/Consumer، Store، Factory، Buyer، Importer، Exporter، Service Provider، Logistics Provider، Government، Decision Maker، Admin، وCompliance. وجود صفحة أو تبويب لا يمنح صلاحية؛ الصلاحية ناتجة عن Server-side RBAC + ABAC، وحالة التحقق، وعلاقة التجارة، ونطاق البيانات.

## 4. نموذج التحقق

KYC يثبت الشخص، وKYB يثبت الكيان التجاري أو الحكومي، وMembership يحدد علاقة الشخص بالكيان، وRole يحدد الوظيفة، وPermission يحدد الفعل، وABAC يقيّد الفعل بالسياق. لكل KYC/KYB/Offering Verification حالات Draft وSubmitted وUnder Review وVerified وRejected وSuspended وRevoked وExpired، مع Actor وPermission وTrigger وValidation وAudit Event لكل انتقال.

## 5. النماذج التجارية

| النموذج | الأطراف | الكيانات الأساسية | شرط الوصول |
|---|---|---|---|
| B2B | Business ↔ Business | Trade Relationship, Match, Offer, Contract | KYC + KYB + Membership + Offering Verification |
| B2C | Business ↔ Consumer | Product/Service, Order, Transaction | KYC للمستهلك وKYB للمتجر والتحقق من العرض |
| C2B | Consumer ↔ Business | Demand, Match, Offer | KYC للمستهلك وKYB للطرف التجاري |
| C2C | Individual ↔ Individual | Used Asset, Demand/Listing, Order | KYC للطرفين وAsset Verification |
| B2G | Business ↔ Government | Government Procurement, Demand, Contract | KYC/KYB وصلاحية حكومية ونطاق مناقصة |

### 5.1 ملفات النشاط وقرار العلاقة التشغيلي

يضيف التنفيذ الحالي طبقتين مستقلتين قبل مصدر التجارة: `Individual Activity Profile` للفرد الموثق و`Business Activity Verification` للكيان الذي اجتاز KYB. لا تختزل هذه الطبقتان KYC أو KYB أو التحقق المستقل للعرض؛ بل تثبتان **نوع النشاط** الذي يحق له طلبه، مثل مستهلك أو منتج فردي أو مصنع أو متجر أو مستورد أو مصدر. يحمل كل عرض أو طلب مصدراً واحداً فقط: كياناً تجارياً أو ملف نشاط فردياً، ولا يقبل المصدرين معاً.

| نمط العلاقة | قرار التنفيذ الحالي | شرط الحد الأدنى | نتيجة الرفض النموذجية |
|---|---|---|---|
| B2B | مسموح بعد البوابات | KYC + KYB + عضوية نشطة + تحقق نشاط للطرفين + تحقق العرض | `business_activity_not_verified` أو بوابة الثقة ذات الصلة |
| B2C | مسموح بعد البوابات | مصدر تجاري موثق + ملف مستهلك فردي موثق | `individual_activity_not_verified` |
| C2B | مسموح بعد البوابات | ملف منتج فردي موثق + مصدر تجاري موثق | `business_activity_not_verified` |
| C2C | مسموح بعد البوابات | ملفا نشاط فرديان موثقان | `individual_activity_not_verified` |
| Consumer → Factory/Importer | مرفوض حتمياً | لا يوجد مسار تجاري عام لهذا الاتجاه | `consumer_to_factory_not_supported` أو `consumer_to_importer_not_supported` |
| B2G | خارج النطاق التشغيلي | يحتاج نطاق مناقصة وتكامل حكومي مستقل | `manual_review` أو بوابة خارج النطاق |

يعيد محرك العلاقة `allow` أو `deny` أو `manual_review` مع سبب ودرجة، ويسجل التقييم في أثر تدقيق مصنف. لا ينشئ هذا القرار عقداً أو طلباً أو دفعة، ولا يشكل اعتماداً تنظيمياً. كما لا يضيف أي رابط إلى نطاق Healthcare أو يستخدم بياناته كمدخل للمطابقة.

## 6. النموذج الكنسي للمجال

النموذج الكنسي يفصل Identity وEntity وMembership وOffering وTrade. الكيانات المرجعية موثقة في `04_COME_IN_IT_V1_0_ENTITY_DICTIONARY.md` وERD في `03_COME_IN_IT_V1_0_CANONICAL_ERD.mmd`.

## 7. العلاقات وقواعد الملكية

كل FK يشير إلى كيان معرف في القاموس. علاقات العضوية والتمثيل لا تعني ملكية قانونية تلقائية. حذف الكيانات التجارية أو سجلات التدقيق يتم عبر Retention/Revocation policy وليس حذفًا صلبًا. كل علاقة حساسة تسجل Actor وScope وReason وTimestamp في Audit Log.

## 8. الصلاحيات وABAC

RBAC يحدد ما يستطيع الدور طلبه، وABAC يحدد ما إذا كان الطلب صالحًا في السياق الحالي. أهم السمات: `kyc_status`, `kyb_status`, `membership_status`, `role_scope`, `business_type`, `individual_activity_status`, `business_activity_status`, `relationship_mode`, `relationship_decision`, `trade_relationship_status`, `offering_verification_status`, `data_classification`, `geography`, و`government_scope`. لا يسمح النظام بالتفاعل التجاري قبل استيفاء شروط التحقق.

## 9. مصفوفة الرؤية

Public يعرض بيانات تعريفية مختارة، Verified يعرض حقائق تم التحقق منها، Restricted يعرضها لأطراف العلاقة التجارية المصرح لها، وConfidential/Sovereign لا يعرضها إلا لمسار امتيازي محكوم. صانع القرار يحصل على مؤشرات مجمعة، ولا يحصل المصنع تلقائيًا على بيانات المشتري الفردية.

## 10. كتالوج مسارات العمل وحالاتها

مسارات العمل WF-001 إلى WF-030 موثقة كاملة في `05_COME_IN_IT_V1_0_WORKFLOWS.md`. كل مسار يحدد actor، permission، trigger، validation، audit event، وسلوك الرفض أو الانتقال غير الصحيح.

## 11. نموذج السوق والعروض

Marketplace هو طبقة اكتشاف وعرض لا تتجاوز طبقة الثقة. العرض قد يكون Product أو Service أو Used Asset، والطلب Demand، والمطابقة Match، ثم Offer وNegotiation قبل Contract. صلاحية العرض مستقلة عن صلاحية صاحب العرض.

## 12. العقود والطلبات والمعاملات

Contract يثبت الاتفاق ونطاق الوصول والبصمة، Order يثبت أمر التنفيذ، Transaction يثبت الحركة التجارية أو الإتمام التشغيلي. لكل واحد Lifecycle مستقل، ولا يجوز اعتبار إنشاء Contract إتمامًا للمعاملة.

## 13. النزاعات والأدلة

Dispute مرتبط بعقد أو طلب أو معاملة، وEvidence يحتفظ ببصمة ومصدر وتصنيف ومالك تقديم. الوساطة والتحكيم لا يغيران السجل الأصلي، ويصدر القرار ببصمة WORM ويؤثر على حالة العقد وفق صلاحية محددة.

## 14. التدقيق والامتثال

كل فعل حساس، بما في ذلك التحقق والتعليق والإلغاء وتغيير الدور والنشر والتعاقد وفتح النزاع والتصدير، يولد Audit Event غير قابل للتعديل. شهادات الامتثال الرقمية مشتقة من حالات التحقق ولا تستبدل السجلات الأصلية.

## 15. السيادة والسحابة الهجينة

البيانات الحساسة والمنظمة تستضاف داخل مصر. طبقة Hybrid قد تستضيف الواجهة والفهارس المرمزة وأعمال المطابقة غير الحساسة فقط عندما يسمح التصنيف والسياسة. لا يحدد هذا baseline مزود سحابة بعينه. لكل تصنيف Storage وEncryption وAccess وBackup وReplication وRetention موثق.

## 16. خط أساس API

المطلوب في V1.0 هو **تعريف العقد** لا بناء APIs فعلية. أمثلة العمليات: KYC submit/verify، KYB submit/verify، membership/role assignment، offering register/verify، demand create، match evaluate، offer create، contract create، order create، transaction complete، dispute open/evidence submit، verification suspend/revoke، وaudit query. التفاصيل في مصفوفة التتبع وملف API الحالي الذي يمثل جزءًا فقط من هذا baseline.

## 17. واجهة الدور

يجب أن تعرض المنصة تجربة منفصلة لكل دور مع حراسة صلاحيات حقيقية. النماذج الحالية تشرح المفهوم وتعرض محاكاة آمنة؛ أي ربط فعلي أو قرار قانوني أو توقيع حكومي يحتاج اعتمادًا منفصلًا وبيانات اعتماد رسمية.

## 18. التتبع ومعايير القبول

كل مطلب رئيسي يتتبع إلى Entity وWorkflow وPermission وAPI وUI وAudit Event وAcceptance Criterion في `08_COME_IN_IT_V1_0_TRACEABILITY_MATRIX.md`. معايير القبول بصيغة GIVEN/WHEN/THEN في `07_COME_IN_IT_V1_0_ACCEPTANCE_CRITERIA.md`.

## 19. سجل الفجوات والقرارات

الفجوات الحرجة الحالية تتمثل في عدم اكتمال lifecycle/API/traceability في Baseline السابق، وضيق مصفوفة الصلاحيات الحالية، وغياب كيانات Contract/Order/Transaction/Dispute عن JSON السابق. القرارات غير المحسومة موثقة في `09_COME_IN_IT_V1_0_GAP_REGISTER.md` و`10_COME_IN_IT_V1_0_ARCHITECTURE_DECISIONS.md` بدل إخفائها.

## 20. الحكم التنفيذي

> **READY WITH CONDITIONS**

ما هو قوي: تسلسل الثقة، الفصل بين KYC وKYB، تعدد النماذج التجارية، التحقق المستقل للعروض، WORM، والسيادة المصرية.

ما تمت مصالحته: JSON مع ERD، Product-only marketplace مع Trade Ecosystem، وRBAC مع ABAC وVisibility.

الشروط: اعتماد الكيانات الكنسية، استكمال عقود API، توسيع الصلاحيات، تحديد سياسات الاحتفاظ والتوقيع والبوابات الحكومية، وتنفيذ اختبارات القبول قبل إعلان الإنتاج.

## 21. نطاق V1.0

يشمل التصميم الكنسي، نماذج الثقة والتجارة، الكيانات والعلاقات، حالات lifecycle، baseline API، الصلاحيات، الرؤية، التدقيق، السيادة، ومعايير القبول.

## 22. خارج النطاق

التكامل الفعلي مع بوابات حكومية، المدفوعات، اختيار مزود سحابة، blockchain، وادعاء الجاهزية التنظيمية النهائية خارج النطاق ما لم تعتمد متطلبات وأدلة إضافية.

## 23. توصيات V1.1

تنفيذ schema migrations غير هدّامة، إضافة contract tests للـAPI، تحويل المحاكيات إلى خدمات خلفية محكومة، اختبار threat model، مراجعة قانونية مصرية، وتدقيق مستقل لمصفوفة الرؤية والتدقيق.

## 24. Healthcare Domain — Phase 2

يُضاف `COME IN IT Health` كنطاق خدمات مستقل عالي الحساسية، لا كامتداد لسوق التجارة أو لخدمة تجارية عامة. يعيد استخدام `PERSON` و`VERIFIED_IDENTITY` مرجعياً بعد KYC المتحقق من أجل تفعيل Health ID، لكنه لا يرث صلاحية وصول صحية من KYB أو Business Membership أو أدوار B2B/B2G. لا تتصل بيانات الصحة تلقائياً بـ Product أو Service أو Used Asset أو Demand أو Match أو Order أو Transaction أو تحليلات التجارة.

يحكم النطاق الصحي مبدأ: **هوية واحدة متحققة، نطاقات موثوقة متعددة، بيانات يتحكم بها المستخدم، وصول قائم على الغرض، وتدقيق كامل**. يتطلب كل وصول طبي تحقق مقدم خدمة صحي، ودوراً صحياً، وموافقة فعالة مقيدة بالغرض والنطاق والزمن، أو مسار Break-Glass محدوداً ومبرراً ومراجعاً. تبقى العمليات الصحية الحقيقية والتكاملات التنظيمية والترخيصية خارج نطاق V1 إلى حين اعتمادها مستقلاً. خريطة الدمج والحزمة الصحية موثقتان في `COME_IN_IT_HEALTH_INTEGRATION_SPEC.md` وملفات `COME_IN_IT_HEALTH_*` التابعة.

## المخرجات التابعة

- `02_COME_IN_IT_V1_0_CANONICAL_SPECIFICATION.json`
- `03_COME_IN_IT_V1_0_CANONICAL_ERD.mmd`
- `04_COME_IN_IT_V1_0_ENTITY_DICTIONARY.md`
- `05_COME_IN_IT_V1_0_WORKFLOWS.md`
- `06_COME_IN_IT_V1_0_PERMISSIONS_MATRIX.md`
- `07_COME_IN_IT_V1_0_ACCEPTANCE_CRITERIA.md`
- `08_COME_IN_IT_V1_0_TRACEABILITY_MATRIX.md`
- `09_COME_IN_IT_V1_0_GAP_REGISTER.md`
- `10_COME_IN_IT_V1_0_ARCHITECTURE_DECISIONS.md`
- `11_COME_IN_IT_V1_0_VALIDATION_REPORT.md`
- `COME_IN_IT_HEALTH_INTEGRATION_SPEC.md`
- `COME_IN_IT_HEALTH_DOMAIN_SPECIFICATION.md`
- `COME_IN_IT_HEALTH_DOMAIN.json`
- `COME_IN_IT_HEALTH_ERD.mmd`

## 25. التشغيل الفعلي للدورة التجارية — Vertical Transaction Slice

أصبح المسار التشغيلي الأدنى القابل للإثبات في التطبيق يبدأ من `eligible Match` ولا يتوقف عند الاكتشاف أو المطابقة. الدورة المنفذة هي: `Match → RFQ → Quotation → Accepted Quotation → Transaction → Payment Status → Transport Job → Pickup → In Transit → Delivery → Receipt → Closure`. كل انتقال حساس يمر بخدمة خادمية محمية، ويتحقق من هوية الطرف وصلاحية دوره وعلاقة العرض أو الطلب، ثم يكتب أثراً تدقيقياً.

| المرحلة | السجل التشغيلي | شرط الدخول | الناتج |
|---|---|---|---|
| RFQ | `trade_rfqs` | Match مؤهل + صاحب الطلب مصرح | طلب تسعير قابل للتتبع |
| Quotation | `trade_quotes` | RFQ مفتوح + مقدّم عرض مؤهل | عرض سعر وإطار صلاحية |
| Acceptance | `trade_quotes.status=accepted` | صاحب الطلب يقبل العرض | إنشاء Transaction |
| Order/Transaction | `trade_transactions` | عرض مقبول + أطراف موثقة | التزام تنفيذي وحالة دفع |
| Fulfillment | `trade_fulfillments` | معاملة نشطة + ناقل مؤهل عند الحاجة | مهمة تنفيذ وتعيين ناقل |
| Transport | `trade_transport_events` | مهمة تنفيذ صحيحة | حالات Pickup/In Transit/Delivered |
| Receipt | `trade_receipts` | إثبات تسليم أو استلام مصرح | سجل استلام منسوب للطرف |
| Closure | حالة المعاملة `closed` | استلام مكتمل ولا نزاع حاجب | إغلاق تشغيلي غير صامت |
| Dispute | `trade_disputes` | سبب نزاع ومرجع معاملة | مسار مراجعة لا يمحو السجل |

لا تمثل هذه الدورة دفعاً مالياً حقيقياً أو توقيعاً قانونياً أو تكاملاً لوجستياً خارجياً؛ حقول الدفع والنقل وإثبات الاستلام هي **حالات تشغيلية قابلة للتكامل** داخل الـMVP. يظل B2G الفعلي، بوابات الحكومة، التسوية المالية، والتوقيع الإلكتروني خارج نطاق هذا الـVertical Slice.

تمنع الخدمات الخادمية الانتقالات غير المسموحة، وتتحقق من أن المستخدم المنفذ هو صاحب الطلب أو ممثل العرض أو الناقل المؤهل وفق العملية. لا يستعمل المسار أي بيانات سريرية، ولا ينشئ FK إلى جداول Healthcare أو ملفاتها.


## 26. محرك السياسات المركزي — Policy Engine v1

أضيف محرك سياسات مركزي خادمي يفصل قواعد العمل عن خدمات المعاملات. يعيد كل تقييم قراراً موحداً من `allow` أو `deny` أو `manual_review` مع `policyVersion` و`ruleIds` و`reasons` ووقت التقييم. لا يُسمح بإنفاذ أي نتيجة غير `allow`.

يغطي المحرك حالياً فتح RFQ، تقديم وقبول الاقتباس، تحديث حالة الدفع التشغيلية، إسناد النقل وتقدم حالته، تسجيل التسليم، قبول الاستلام، إغلاق المعاملة، وفتح النزاع. وتُسجل قراراته قبل الإنفاذ في سجل التدقيق مع الفاعل والكيان والأسباب والإصدار.

يبقى هذا **Policy Engine v1** طبقة قواعد خادمية ثابتة قابلة للتوسعة، وليس بعدُ محرر سياسات إنتاجياً موجهاً للمستخدمين أو نظاماً خارجياً لإدارة الإصدارات والموافقات. أي تغيير مستقبلي في القواعد يجب أن يمر عبر مراجعة كود واختبارات ونسخة سياسة جديدة.
