# COME IN IT Health — Permissions Matrix

| الدور | المورد | الأفعال المسموحة | ABAC إلزامي | ممنوع صراحة |
|---|---|---|---|---|
| Health Individual | Health Profile | view own / manage consent / review access | `actor=profile_owner` | الاطلاع على ملف شخص آخر |
| Health Provider Admin | Health Provider / Roles | submit provider / assign role | provider verified أو pending submission؛ نطاق المؤسسة | الوصول إلى أي Health Record |
| Health Professional | Health projection | request / read minimum projection | provider verified + active health role + active consent + purpose + scope + time | الوصول دون موافقة أو استخدام أغراض تجارية |
| Health Compliance | Provider Verification / Emergency Review | review / suspend / audit | privileged session + compliance scope | قراءة محتوى سجل طبي خام دون سبب رقابي |
| Emergency Clinician | Emergency access | request break-glass | provider verified + active health role + reason + time limit | الوصول المفتوح أو الدائم |
| Security Auditor | Health Access Log | audit read | audit purpose + privileged scope | تغيير أو حذف log |
| Trade Roles | Health resources | none | n/a | أي وصول تلقائي من KYB أو Membership أو Contract |

## القاعدة المركبة للوصول

```text
ALLOW health.read IF
  health_profile.status = ACTIVE
  AND provider.verification_status = VERIFIED
  AND health_role.status = ACTIVE
  AND requested_purpose IN consent.allowed_purposes
  AND requested_scope ⊆ consent.scope
  AND now < consent.expires_at
ELSE DENY + HEALTH_ACCESS_DENIED audit
```

يكسر Break-Glass القيد الخاص بالموافقة فقط ولا يكسر تحقق مقدم الخدمة أو الدور الصحي أو التدقيق أو المدة. لا يكسر أي دور تجاري القيود أعلاه.
