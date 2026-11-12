# COME IN IT Health — Acceptance Criteria

| ID | Given | When | Then | دليل |
|---|---|---|---|---|
| H-AC-001 | شخص دون KYC متحقق | يطلب Health ID | يرفض الطلب | Audit deny + لا Health Profile |
| H-AC-002 | Provider غير متحقق | يطلب Health access | يرفض الطلب | `HEALTH_ACCESS_DENIED` |
| H-AC-003 | Provider ودور صالحان بلا Consent | يطلب قراءة | يرفض ولا يعيد مرجعاً صحياً | Audit + response redaction |
| H-AC-004 | Consent فعال ومطابق | يطلب الوصول ضمن scope والغرض | يعيد Projection أدنى فقط | Access log sealed |
| H-AC-005 | Consent ملغى أو منتهٍ | يحاول مقدم الوصول | يرفض فوراً | Access deny log |
| H-AC-006 | حالة طارئة مبررة | يطلب Break-Glass | يمنح وقتياً ويسجل ويضع للمراجعة | Emergency request + WORM |
| H-AC-007 | دور تجاري موثق KYB | يستدعي health.read دون Health Role | يرفض | Policy test |
| H-AC-008 | تدفق B2B قائم | إضافة كيان صحي | لا تتغير FK أو حالة أو مسار WF-001..030 | regression test |
| H-AC-009 | Health record reference | يعرض في UI | لا يعرض token أو محتوى طبي خام | UI/API redaction test |
| H-AC-010 | Health access event | يكتب في audit | لا يقبل update/delete | WORM integrity test |
