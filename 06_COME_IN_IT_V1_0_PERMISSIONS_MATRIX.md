# COME IN IT V1.0 — Canonical Permissions Matrix

هذه المصفوفة تصف خط الأساس الكنسي المستهدف للصلاحيات، ولا تمنح الأدوار إذناً بحد ذاتها في التطبيق. **RBAC** يصف ما يمكن للدور طلبه، بينما **ABAC** يحدد ما إذا كان الطلب صالحًا في السياق. التنفيذ الحالي يستخدم منحاً صريحة مرتبطة بالعضوية؛ انظر قسم حالة التشغيل في نهاية الملف.

| Domain | RBAC action | Required ABAC gates | Visibility / audit |
|---|---|---|---|
| Identity | submit / verify KYC | actor owns person record; geography and status valid | restricted; immutable verification event |
| Entity | submit / verify KYB | authorized representative; government scope where applicable | verified facts only; lifecycle event |
| Membership | invite / approve representative | business membership scope; active entity | restricted to entity administrators |
| Offering | register / publish / suspend | owner KYB verified; offering verification state; classification | public or verified projection; publish audit |
| Matching | evaluate / reveal match | trade relationship; geography; capacity; certificates | relationship-scoped; access decision audit |
| Contract | create / sign / suspend | parties verified; offering verified; role scope; contract policy | restricted; WORM event |
| Order / Transaction | create / complete / reverse | contract lifecycle; payment or execution policy | confidential; transaction audit |
| Dispute | open / submit evidence / decide | party relationship; evidence ownership; mediator scope | restricted; decision WORM |
| Intelligence | aggregate / export | data classification; anonymization; decision-maker scope | aggregated; export audit |

## Commercial capabilities and relationship eligibility

تضيف طبقة القدرات التجارية ملف نشاط فردي بعد KYC، وتحققاً تشغيلياً للنشاط التجاري بعد KYB وعضوية فعالة. لا يحل أي منهما محل بوابات الهوية أو الكيان أو العرض، ولا يصبح اختيار الدور في الواجهة تفويضاً خادمياً بذاته.

| Role | Commercial RBAC action | Mandatory ABAC gates | Relationship scope | Visibility and audit |
|---|---|---|---|---|
| Owner | submit business activity verification; evaluate relationship; create offering/demand; view decision/audit | KYC, KYB, verified business, active membership, verified business activity; offering verification before matching | B2B, B2C, C2B; B2G is manual review | Entity-scoped; relationship evaluation audit |
| Authorized director | submit business activity verification; evaluate and view decision | KYC, KYB, active membership, role scope, verified business activity | B2B, B2C, C2B; B2G is manual review | Delegated entity scope only |
| Procurement manager | evaluate and create demand | KYC, KYB, active membership, role scope, verified business activity | B2B and C2B; B2G is manual review | Procurement scope; no unrelated counterparty data |
| Sales manager | evaluate and create offering | KYC, KYB, active membership, role scope, verified business activity, offering verification | B2B and B2C; B2G is manual review | Sales scope; publish audit |
| Export manager | evaluate and create offering | KYC, KYB, active membership, role scope, verified business activity, geography | B2B; B2G is manual review | Export scope; geography-sensitive audit |
| Finance manager | view relationship decision and audit | KYC, KYB, active membership, verified business activity, finance scope, classification | B2B, B2C, C2B read-only | Restricted decision projection only |
| Consumer | submit individual activity profile; evaluate and create demand | KYC and verified individual activity profile | B2C and C2C | Individual scope; concise decision reason only |
| Individual activity holder | submit profile; evaluate; create offering/demand; view decision | KYC, verified individual activity profile, offering verification before matching | C2B and C2C | Own profile scope; relationship evaluation audit |
| Compliance reviewer | review or suspend activity verification; view relationship audit | Server-side compliance role scope, decision authority, data classification | Review only; not a trade actor | Restricted audit view; no offering/demand creation |

وصف B2G بأنه `manual_review` في صفوف تصميم الأدوار أو العلاقة هو هدف تصميمي فقط؛ لا يوجد مسار مراجعة حكومي تشغيلي في هذا الإصدار، وتُرفض عمليات B2G الحالية افتراضياً (`FORBIDDEN`).

## Relationship decision semantics — canonical design target

| Relationship mode | Canonical design target (not runtime status) | Required gates | Disallowed or conditional path |
|---|---|---|---|
| B2B | Target: `allow` after gates | Both business activities verified, KYC, KYB, active membership, offering verification before matching | Missing activity or trust gate yields `deny` |
| B2C | Target: `allow` after gates | Verified business activity plus verified consumer activity profile | Missing individual activity yields `deny` |
| C2B | Target: `allow` after gates | Verified individual producer profile plus verified business activity | Missing business activity yields `deny` |
| C2C | Target: `allow` after gates | Both individual activity profiles verified | Missing individual activity yields `deny` |
| Consumer to Factory or Importer | `deny` | No general consumer supply path exists | Deterministic reason: `consumer_to_factory_not_supported` or `consumer_to_importer_not_supported` |
| B2G | `manual_review` | Government scope, procurement policy, and separate gateway/integration decision | Outside current operational trade scope |

> A relationship decision is an eligibility decision, not a contract, order, payment, or regulatory approval. Every evaluation should produce a classified audit event, while Healthcare remains structurally and operationally isolated.

## Runtime authorization and commerce status — 2026-11-15

- Each sensitive business operation requests an exact code from `BusinessPermissionCode` and checks it against `business_membership_permissions`. The grant must be active and unexpired, and must belong to the exact active membership, user, and requested business context. KYC is required; KYB is required for operations that need a verified business. A membership role alone grants nothing; a `viewer` membership is additionally denied for business operations.
- Business creation records its creator separately and leaves legal ownership unset. No automatic owner membership is created. No public membership/grant administration API currently exists; until membership and grants are provisioned through an approved process, affected actions fail closed.
- Runtime trade mutation paths are B2B-only. The purchase-order API requires `buyerBusinessId` and a verified business catalog offering, and reads partner/product/price/MOQ from server-side records. Individual purchase, C2B, C2C and B2G purchase orders are not enabled; government procurement is explicitly denied pending policy approval.
- Authorization allow/deny decisions are written to `audit_events` with actor, business, membership (when found), membership role in metadata, requested permission and reason code. This is structured application logging, not technically immutable WORM storage. Retention, MFA/session conditions, geographic/classification ABAC, ownership evidence, multiple-owner approvals, and the commercial eligibility rules for individual/government paths remain unresolved.
- The code supports only the specific KYC/KYB, membership, permission, business status, verified activity/offering and relationship gates actually present in its handlers; the broader ABAC attributes listed above remain design requirements unless separately implemented and tested.

## Additional ABAC attributes

The permissions matrix must evaluate `individual_activity_status`, `business_activity_status`, `relationship_mode`, `relationship_decision`, `role_scope`, `membership_status`, `offering_verification_status`, `data_classification`, `geography`, and `government_scope` alongside the existing KYC and KYB gates. The interactive platform matrix is an explanatory projection of these rules; enforcement for sensitive operations remains server-side.

## Non-negotiable design requirements — not a claim of complete runtime enforcement

1. إنشاء الحساب لا يثبت الهوية التجارية.
2. لا يوجد تفاعل B2B قبل استيفاء KYC وKYB وMembership وOffering Verification.
3. لا تكشف علاقة تجارية بيانات المشتري الفردية خارج نطاق الرؤية المصرح به.
4. كل رفض أو تعليق أو إلغاء أو تصدير يولد Audit Event.
5. لا يسمح ملف مستهلك فردي بمسار Consumer → Factory أو Consumer → Importer.
6. هدف التصميم لـB2G هو `manual_review` بعد اعتماد نطاق حكومي منفصل؛ أما التنفيذ الحالي فيرفض التشغيل ولا يملك مسار مراجعة.
