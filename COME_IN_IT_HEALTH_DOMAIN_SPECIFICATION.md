# COME IN IT Health — Domain Specification

## 1. الحالة والحدود

هذه مواصفة **Phase 2** لنطاق Healthcare مستقل داخل منصة COME IN IT. تفعل طبقة metadata محدودة للموافقة وقرار الوصول وسلسلة مصدر السجل، لكنها لا تفعّل خدمة علاجية أو قراراً طبياً أو تكاملاً تنظيمياً فعلياً. الحكم الحالي: **CONTROLLED METADATA FOUNDATION ACTIVE — APPROVED WITH CONDITIONS**.

> Healthcare ليس نوعاً من `SERVICE` التجاري، ولا يُعامل السجل الصحي ككائن عرض أو طلب أو مطابقة أو عقد تجاري.

## 2. قاعدة التكامل

لا يستخدم النطاق الصحي من المجال الأساسي كمرجع علائقي سوى `PERSON` بعد نجاح KYC. إن حالة الهوية المتحققة شرط أهلية يقيّمه الخادم، وليست مفتاحاً أجنبياً إلى `VERIFIED_IDENTITY`. يملك Health Profile وHealth Provider وConsent Grant وHealth Access Log وEmergency Access Request دورات حياة مستقلة. لا تمنح KYB أو Business Membership أو أدوار التجارة وصولاً صحياً تلقائياً.

| المبدأ | القاعدة القابلة للتنفيذ |
|---|---|
| Identity first | لا ينشأ Health Profile قبل KYC متحقق وهوية نشطة. |
| Provider trust | لا يصل مقدم للخدمة إلى أي نطاق صحي قبل Health Provider Verification ودور صحي فعال. |
| Consent by default | يلزم Consent Grant فعال، محدد بالغرض والنطاق والزمن، لكل قراءة أو مشاركة غير طارئة. |
| Least privilege | يعاد أصغر إسقاط بيانات مناسب للغرض، لا نسخة سجل كامل. |
| Emergency exception | Break-Glass محدود المدة، مبرر، مسجل، ويخضع لمراجعة لاحقة. |
| Isolation | لا ينسخ أو يزامن Health Data إلى Marketplace أو Matching أو Trade Intelligence. |

## 3. الكيانات الصحية

| الكيان | المالك | الغرض | تصنيف البيانات |
|---|---|---|---|
| `HEALTH_PROFILE` | Person | ملف صحي مرجعي يمثل المالك والسياسة وحالة Health ID | Confidential-Sovereign |
| `HEALTH_PROVIDER` | Provider Entity | منشأة أو مقدم رعاية مستقل ونطاق ترخيصه | Restricted |
| `HEALTH_PROVIDER_VERIFICATION` | Compliance | سلسلة تحقق المنشأة والترخيص والنطاق | Confidential-Sovereign |
| `HEALTH_ROLE_ASSIGNMENT` | Provider + Person | دور صحي مستقل عن membership التجاري | Restricted |
| `CONSENT_GRANT` | Health Profile | موافقة مرتبطة بالغرض والنطاق والمدة والمستفيد | Confidential-Sovereign |
| `HEALTH_RECORD_REFERENCE` | Health Profile | بصمة مرجع خارجي وبصمة نزاهة وحالة provenance فقط؛ لا رابط مباشر أو محتوى طبي خام | Highly-Sensitive-Health |
| `HEALTH_ACCESS_LOG` | Audit | أثر WORM لكل محاولة وصول أو مشاركة | Confidential-Sovereign |
| `EMERGENCY_ACCESS_REQUEST` | Provider + Profile | Break-Glass قصير المدة ومبرر | Confidential-Sovereign |

## 4. حالات دورة الحياة

| المورد | الحالات | الانتقالات المسموحة |
|---|---|---|
| Health Profile | `PENDING_KYC` → `ACTIVE` → `SUSPENDED` → `CLOSED` | لا يعود ACTIVE إلا بعد مراجعة مخولة |
| Provider Verification | `DRAFT` → `SUBMITTED` → `UNDER_REVIEW` → `VERIFIED` / `REJECTED` / `SUSPENDED` / `EXPIRED` | المسار تديره الامتثال فقط |
| Consent Grant | `DRAFT` → `ACTIVE` → `REVOKED` / `EXPIRED` | `ACTIVE` يستلزم غرضاً ونطاقاً وانتهاء صلاحية |
| Health Record Reference | `SUBMITTED` → `VERIFIED` / `REJECTED` / `SUPERSEDED` | التعديل ينشئ مرجعاً جديداً ويُبقي الأصل قابلاً للتدقيق؛ لا استبدال صامت أو حذف للمصدر. |
| Emergency Access | `REQUESTED` → `GRANTED` → `EXPIRED` → `REVIEWED` أو `REJECTED` | لا يمتد تلقائياً ولا يعفي من التدقيق |

## 5. سياسة الوصول

يُقبل الطلب الصحي فقط إن تحققت كل الشروط التالية: Profile نشط، مقدم خدمة محقق، Health Role صالح، Purpose مسموح، Scope أقل أو يساوي Scope الموافقة، والوقت قبل انتهاء الموافقة. ولا تعرض واجهة صاحب الملف إلا نوع المصدر وتوقيت الواقعة وحالة provenance وقرار الوصول؛ لا تُعاد البصمات أو `referenceToken` أو مراجع الوثائق أو بيانات طبية قابلة للتشخيص إلى واجهة عامة أو من خلال مسارات التجارة.

## 6. عدم الكسر والتوافق

لا تعديل على العلاقات: `PERSON → BUSINESS_MEMBERSHIP`، `BUSINESS_ENTITY → KYB_RECORD`، `DEMAND → MATCH → OFFER`، `CONTRACT → ORDER → TRANSACTION`، أو WF-001 إلى WF-030. تضاف عائلة WF-H-001 إلى WF-H-012 بشكل منفصل. كل ربط علائقي من Health إلى Core هو FK مرجعي باتجاه `PERSON` فقط؛ أما KYC المتحقق فهو بوابة أهلية خادمية لا علاقة تخزينية إضافية.

## 7. خارج النطاق

التشخيص، الوصفات، القرارات العلاجية، ملفات طبية خام، الربط مع EMR/HIS/بوابات حكومية، الاعتماد التنظيمي، الهوية الوطنية الصحية الفعلية، وأي ادعاء بالامتثال النهائي، تبقى خارج نطاق هذه النسخة.
