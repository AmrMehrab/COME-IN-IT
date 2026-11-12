# COME IN IT — V1.0 Workflow Catalog

## قالب الحوكمة

لكل مسار: **Actor → Permission → Trigger → Validation → Transition → Audit Event → Invalid Transition**. أي مسار غير مطبق في الواجهة الحالية يبقى baseline تصميميًا ولا يُدّعى أنه API منفذ.

| ID | المسار | Actor | Permission | Audit Event | نطاق V1.0 |
|---|---|---|---|---|---|
| WF-001 | Registration | INDIVIDUAL | account.create | ACCOUNT_CREATED | In scope |
| WF-002 | KYC Submission | INDIVIDUAL | kyc.submit | KYC_SUBMITTED | In scope |
| WF-003 | KYC Verification | COMPLIANCE | kyc.verify | KYC_VERIFIED/REJECTED | In scope |
| WF-004 | KYB | BUSINESS_ADMIN | kyb.submit | KYB_SUBMITTED | In scope |
| WF-005 | Business Membership | BUSINESS_ADMIN | membership.invite | MEMBERSHIP_CREATED | In scope |
| WF-006 | Role Assignment | BUSINESS_ADMIN | role.assign | ROLE_ASSIGNED | In scope |
| WF-007 | Product Registration | AUTHORIZED_MEMBER | product.create | PRODUCT_REGISTERED | In scope |
| WF-008 | Product Verification | COMPLIANCE | product.verify | PRODUCT_VERIFIED | In scope |
| WF-009 | Service Registration | SERVICE_PROVIDER | service.create | SERVICE_REGISTERED | In scope |
| WF-010 | Service Verification | COMPLIANCE | service.verify | SERVICE_VERIFIED | In scope |
| WF-011 | Used Asset Registration | INDIVIDUAL/ENTITY | asset.create | ASSET_REGISTERED | In scope |
| WF-012 | Asset Verification | COMPLIANCE | asset.verify | ASSET_VERIFIED | In scope |
| WF-013 | Demand Creation | VERIFIED_ACTOR | demand.create | DEMAND_CREATED | In scope |
| WF-014 | Matching | MATCHING_SERVICE | matching.evaluate | MATCH_EVALUATED | Baseline only |
| WF-015 | Offer | TRADE_PARTY | offer.create | OFFER_SENT | Baseline only |
| WF-016 | Negotiation | TRADE_PARTY | negotiation.write | NEGOTIATION_UPDATED | Baseline only |
| WF-017 | Contract | TRADE_PARTY | contract.create | CONTRACT_CREATED/SIGNED | Baseline only |
| WF-018 | Order | TRADE_PARTY | order.create | ORDER_PLACED | Baseline only |
| WF-019 | Transaction | TRADE_PARTY | transaction.record | TRANSACTION_UPDATED | Baseline only |
| WF-020 | B2C Purchase | CONSUMER/STORE | order.create | B2C_ORDER_CREATED | Baseline only |
| WF-021 | C2C Used Market | INDIVIDUAL | asset.transfer | ASSET_TRANSFERRED | Baseline only |
| WF-022 | C2B Request | CONSUMER/BUSINESS | demand.create | C2B_DEMAND_CREATED | Baseline only |
| WF-023 | B2G Procurement | GOVERNMENT/BUSINESS | procurement.respond | PROCUREMENT_SUBMITTED | Baseline only |
| WF-024 | Fulfillment | LOGISTICS/TRADE_PARTY | order.fulfill | FULFILLMENT_UPDATED | Baseline only |
| WF-025 | Completion | TRADE_PARTY | transaction.complete | TRANSACTION_COMPLETED | Baseline only |
| WF-026 | Dispute | TRADE_PARTY | dispute.open | DISPUTE_OPENED | In scope as simulator |
| WF-027 | Evidence | DISPUTE_PARTY/COMPLIANCE | evidence.submit | EVIDENCE_SEALED | In scope as simulator |
| WF-028 | Audit | COMPLIANCE/ADMIN | audit.read | AUDIT_QUERIED | In scope as WORM view |
| WF-029 | Verification Suspension | COMPLIANCE | verification.suspend | VERIFICATION_SUSPENDED | Baseline only |
| WF-030 | Verification Revocation | COMPLIANCE | verification.revoke | VERIFICATION_REVOKED | Baseline only |

## انتقالات غير صحيحة

لا ينتقل أي كيان إلى `VERIFIED` دون actor وpermission وأدلة تحقق صالحة. لا ينتقل Contract إلى Active دون متطلبات التوقيع المحددة. لا يُغلق Dispute قبل قرار موثق أو تصعيد. الانتقال غير الصحيح يعيد خطأ domain، ولا يغير الحالة، ويسجل محاولة الرفض في Audit Log.

## ملاحظة التنفيذ

المحاكيات الحالية تعرض المسار وتجربة المستخدم فقط. تحويلها إلى workflows تشغيلية يحتاج backend، مخزن حالة، سياسات تفويض server-side، وتكاملات معتمدة؛ هذه متطلبات V1.1 وليست افتراضات صامتة.
