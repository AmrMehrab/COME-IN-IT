# COME IN IT V1.0 — Gap Register

| ID | Severity | Finding | Resolution / condition | Owner | Status |
|---|---|---|---|---|---|
| G-001 | Critical | Contract, Order, Transaction, Dispute, and Evidence were incomplete in the previous baseline. | Adopt canonical entities and non-destructive migrations. | Domain + Data Architecture | Resolved in canonical model |
| G-002 | Critical | Existing permission matrix is not a complete contextual policy engine. | Implement server-side RBAC + ABAC with lifecycle and classification attributes. | Security + Authorization | Open for V1.1 |
| G-003 | High | Existing API examples cover only part of the workflow baseline. | Complete endpoint contracts and contract tests for WF-001…WF-030. | API Platform | Open for V1.1 |
| G-004 | High | Current simulators are illustrative, not authoritative state machines. | Move lifecycle transitions to governed backend services with idempotency. | Platform Engineering | Open for V1.1 |
| G-005 | Medium | Government attestation and real e-signature integration lack approved credentials and legal scope. | Keep safe simulation until provider, key, and legal approvals exist. | Legal + Government Relations | Explicitly out of scope |

## Release gate

The reconciliation verdict remains **READY WITH CONDITIONS** until G-002, G-003, and G-004 have implementation evidence and the acceptance criteria pass in an environment with controlled audit retention.



## Transaction Vertical Slice update — 2026-09-06

أُغلق الجزء الحرج من G-001 وG-004 بالنسبة إلى Vertical Slice المنفذ: توجد الآن جداول وخدمات وعقود tRPC وواجهة تشغيلية واختبار تكامل يثبت المسار `Match → RFQ → Quotation → Transaction → Payment Status → Fulfillment → Pickup → In Transit → Delivery → Receipt → Closure` مع مسار Dispute، ورفض الانتقالات غير المسموحة، وعزل Healthcare.

تبقى القيود التالية قبل اعتبار المعاملة جاهزة للإنتاج المفتوح: بوابة دفع فعلية وتسوية مالية، تكامل ناقل خارجي، توقيع إلكتروني قانوني، Policy Engine مركزي موحد بدلاً من حراس متفرقين، idempotency ومفاتيح إعادة المحاولة، إثبات WORM تخزيني غير قابل للحذف خارج قاعدة البيانات، واختبارات تحميل ونسخ احتياطي واستعادة. لذلك يصبح الحكم **MVP تجريبي مغلق — جاهز مشروط**، وليس إطلاقاً تجارياً مفتوحاً.


## Policy Engine Update — 2026-09

| Gap | الحالة | الدليل | القيد المتبقي |
|---|---|---|---|
| قواعد العمل موزعة داخل خدمات المعاملة | مغلق جزئياً | `server/policyEngine.ts` وربط RFQ/Quotation/Transaction/Fulfillment/Receipt/Closure/Dispute | ما زال الإصدار الأول خادميّاً ثابتاً وليس محرر سياسات إنتاجياً |
| عدم توحيد قرار allow/deny/manual_review | مغلق | عقد قرار موحد مع policy version وrule IDs والأسباب | يلزم لاحقاً تخزين إصدارات السياسات في قاعدة بيانات مع موافقات |
| احتمال تمرير manual_review كأنه allow | مغلق | إنفاذ محصور في `allow` واختبار صريح | يلزم اختبار mutation/authorization شامل لكل endpoint جديد |
| غياب عرض مركزي للسياسات والقرارات | منفذ جزئياً | `PolicyEngineDashboard.tsx` للقراءة والمراجعة | لا يسمح بالتعديل؛ إدارة السياسات الإنتاجية خارج النطاق الحالي |

الحكم: Policy Engine v1 يحسن فصل القواعد وقابلية التدقيق، لكنه لا يساوي منصة إدارة سياسات كاملة حتى تُضاف إصدارات مخزنة، موافقات تغيير، فعالية زمنية، ومحاكاة أثر القاعدة قبل نشرها.
