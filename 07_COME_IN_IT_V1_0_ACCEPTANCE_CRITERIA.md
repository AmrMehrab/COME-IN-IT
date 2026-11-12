# COME IN IT V1.0 — Acceptance Criteria

## AC-001 — Identity and membership

**GIVEN** a Person with `KYC=Verified`, **WHEN** the person requests a Business Membership, **THEN** the system creates an independent relationship and does not equate User with Business.

## AC-002 — KYB gate

**GIVEN** an Entity with `KYB=Under Review`, **WHEN** a representative attempts a B2B interaction, **THEN** the request is denied and the denial is audited.

## AC-003 — Offering verification

**GIVEN** a verified Business and an unverified Product, Service, or Used Asset, **WHEN** the owner publishes it for commercial matching, **THEN** the system keeps it outside Trade Access.

## AC-004 — Contextual authorization

**GIVEN** a role that has the nominal permission but fails geography, data classification, relationship, or government scope, **WHEN** policy evaluation runs, **THEN** the action is denied and an immutable audit event is written.

## AC-005 — Trade lifecycle

**GIVEN** an eligible Match, **WHEN** a Contract is created, **THEN** Contract creation does not complete Order or Transaction lifecycle.

## AC-006 — Evidence and dispute

**GIVEN** Evidence linked to a Contract, Order, or Transaction, **WHEN** mediation issues a decision, **THEN** the source evidence remains immutable and the decision receives a distinct WORM hash.

## AC-007 — Sovereignty

**GIVEN** data classified as `Confidential/Sovereign`, **WHEN** a Hybrid route is requested, **THEN** the route is blocked unless an approved policy explicitly allows a derived, non-sensitive projection.

## AC-008 — Export

**GIVEN** a user requests a report export, **WHEN** the policy engine evaluates scope, **THEN** the export contains only permitted fields and records an audit event with actor, reason, and timestamp.


## AC-TRX-001 — دورة تجارية مكتملة من المطابقة إلى الإغلاق

**GIVEN** وجود Match بحالة `eligible` وطلب صالح وعرض موثق منشور، **WHEN** ينشئ صاحب الطلب RFQ ثم يقدم صاحب العرض Quotation، **THEN** يسجل النظام RFQ وQuotation ويربطهما بالمطابقة ويمنع أي طرف غير مصرح له من التنفيذ.

**GIVEN** Quotation بحالة `submitted`، **WHEN** يقبله صاحب الطلب، **THEN** ينشئ النظام Transaction واحدة مرتبطة بالـRFQ والاقتباس، ويكتب Audit Event، ولا يسمح بقبول اقتباس مرفوض أو منتهي.

**GIVEN** Transaction نشطة، **WHEN** يحدّث الطرف المخول حالة الدفع التشغيلية، **THEN** يحفظ النظام الحالة مع الفاعل والوقت والتدقيق، ولا يدّعي تنفيذ بوابة دفع فعلية.

**GIVEN** Transaction تحتاج إلى تنفيذ، **WHEN** ينشئ الطرف المخول Fulfillment Job ويعين ناقلاً مؤهلاً، **THEN** تنشأ مهمة نقل مرتبطة بالمعاملة، وتُرفض هوية ناقل غير موثقة أو غير حاصلة على Business Activity Verification المناسبة.

**GIVEN** Fulfillment Job صحيحة، **WHEN** يسجل الناقل Pickup ثم In Transit ثم Delivered، **THEN** تُحفظ الأحداث بترتيبها وتُرفض القفزات غير المسموحة، مع بقاء السجل قابلاً للتدقيق.

**GIVEN** حالة `Delivered`، **WHEN** يسجل المستلم Receipt، **THEN** ينشئ النظام Receipt منسوباً للمستخدم ويتيح Closure للطرف المخول فقط.

**GIVEN** Transaction مغلقة أو نزاع مفتوح حاجب، **WHEN** يطلب مستخدم تغييراً متعارضاً، **THEN** يرفض النظام العملية ولا يمحو أي حدث تدقيق سابق.

**GIVEN** أي مرحلة من الدورة، **WHEN** يحاول المسار قراءة أو كتابة Healthcare data، **THEN** لا يوجد مسار FK أو API يسمح بذلك، وتبقى Health Domain معزولة.

## AC-POL-001 — قرار سياسة موحد قبل الإنفاذ
**GIVEN** أي فعل تجاري حساس، **WHEN** يستدعي الخادم Policy Engine، **THEN** يعيد القرار `allow` أو `deny` أو `manual_review` مع إصدار السياسة ومعرّفات القواعد والأسباب ووقت التقييم، ويسجل القرار في Audit Event قبل الإنفاذ.

## AC-POL-002 — عدم إنفاذ الرفض أو المراجعة اليدوية
**GIVEN** قرار `deny` أو `manual_review`، **WHEN** تصل النتيجة إلى طبقة الإنفاذ، **THEN** تفشل العملية ولا تُنشأ أو تُحدّث المعاملة ولا يُعامل `manual_review` كأنه سماح.

## AC-POL-003 — تغطية دورة المعاملة
**GIVEN** مسار المعاملة من RFQ حتى الإغلاق أو النزاع، **WHEN** ينفذ المستخدم أي انتقال حساس، **THEN** يمر الانتقال عبر Policy Engine المناسب، وتظهر أسباب القرار وإصدار السياسة في سجل التدقيق.

## AC-POL-004 — قابلية التطوير المحكومة
**GIVEN** تغيير قاعدة عمل، **WHEN** يضاف إصدار سياسة جديد، **THEN** تتغير الاختبارات والعقد الموثق ويظل الإصدار السابق قابلاً للتتبع، ولا يمكن تعديل قواعد الإنتاج من واجهة العرض مباشرة.
