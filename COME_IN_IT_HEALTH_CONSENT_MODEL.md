# COME IN IT Health — Consent & Access Model

## بنية Consent Grant

| الحقل | إلزامي | الغرض |
|---|---|---|
| `health_profile_id` | نعم | مالك الموافقة |
| `beneficiary_provider_id` | نعم | مقدم الخدمة أو المنشأة المستفيدة |
| `purpose_code` | نعم | سبب وصول مقنن، مثل `treatment` أو `referral` |
| `scope` | نعم | أصغر فئة بيانات أو مرجع يمكن الوصول إليه |
| `issued_at` و`expires_at` | نعم | نافذة زمنية صريحة |
| `status` | نعم | Draft/Active/Revoked/Expired |
| `revocation_reason` | عند الإلغاء | تفسير قابل للتدقيق |
| `evidence_hash` | نعم | بصمة موافقة، لا نص موافقة حساس |

## قرارات الوصول

| القرار | الشرط | المخرج | حدث التدقيق |
|---|---|---|---|
| Allow | تحقق كل شروط ABAC | Projection أدنى | `HEALTH_ACCESS_ALLOWED` |
| Deny | الموافقة غائبة/منتهية/لا تغطي الغرض | لا بيانات | `HEALTH_ACCESS_DENIED` |
| Break-Glass | حالة طوارئ مبررة + Provider/Role صالحان | Projection محدود ووقت قصير | `EMERGENCY_ACCESS_GRANTED` |
| Revoke | قرار المالك أو السياسة | إبطال فوري للجلسات اللاحقة | `CONSENT_REVOKED` |

> لا توجد موافقة دائمة مفتوحة، ولا موافقة ضمنية ناتجة عن علاقة تجارية أو عضوية شركة أو KYB.
