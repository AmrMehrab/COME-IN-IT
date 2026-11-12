# COME IN IT Health — Workflow Catalogue

| ID | المسار | الممثل | الحراسة | الحدث المدقق | النتيجة |
|---|---|---|---|---|---|
| WF-H-001 | إنشاء Health ID | Individual | KYC = Verified | `HEALTH_PROFILE_CREATED` | ملف Health Profile نشط |
| WF-H-002 | تسجيل مقدم صحي | Provider Admin | هوية الممثل متحققة | `HEALTH_PROVIDER_SUBMITTED` | Provider قيد التحقق |
| WF-H-003 | تحقق مقدم صحي | Health Compliance | صلاحية `health.provider.verify` | `HEALTH_PROVIDER_VERIFIED` | Provider محقق أو مرفوض |
| WF-H-004 | تعيين دور صحي | Provider Admin | Provider محقق + دور مفوض | `HEALTH_ROLE_ASSIGNED` | Health Role فعال |
| WF-H-005 | منح موافقة | Individual | Profile فعال + مقصد/نطاق/مدة | `CONSENT_GRANTED` | Consent Active |
| WF-H-006 | إلغاء موافقة | Individual | مالك الملف | `CONSENT_REVOKED` | منع وصولات لاحقة |
| WF-H-007 | وصول صحي عادي | Health Professional | Provider + Role + Consent + Purpose | `HEALTH_ACCESS_ALLOWED/DENIED` | Projection أدنى أو رفض |
| WF-H-008 | وصول طارئ | Health Professional | Provider + Role + سبب + مدة | `EMERGENCY_ACCESS_GRANTED/REJECTED` | Grant مؤقت ومراجع |
| WF-H-009 | مراجعة طوارئ | Health Compliance | صلاحية مراجعة | `EMERGENCY_ACCESS_REVIEWED` | تثبيت/تصعيد النتيجة |
| WF-H-010 | ربط مرجع سجل | Individual/Provider مخول | Consent أو ملكية | `HEALTH_RECORD_REFERENCE_LINKED` | مرجع مع بصمة فقط |
| WF-H-011 | مراجعة سجل الوصول | Individual/Compliance | نطاق ذاتي أو امتيازي | `HEALTH_AUDIT_REVIEWED` | عرض WORM مقيد |
| WF-H-012 | إغلاق Health Profile | Individual/Compliance | سياسة احتفاظ وموافقة | `HEALTH_PROFILE_CLOSED` | إيقاف الوصول لا حذف الأدلة |

> لا تعدل هذه المسارات WF-001 إلى WF-030 ولا تستدعي Matching أو Contract أو Transaction أو تحليلات التجارة.
