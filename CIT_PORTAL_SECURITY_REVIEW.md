# CIT PORTAL SECURITY REVIEW

> **تحديث مُلزم — 2026-11-15:** الأقسام القديمة أدناه توثق خط أساس سابقاً لهذه التغييرات، وليست وصفاً للشيفرة الحالية. يعتمد القارئ إعادة التقييم في نهاية الملف عند تحديد الوضع الراهن. تم تصحيح خصوصاً ادعاء أن واجهة إنشاء أمر الشراء تقبل السعر وMOQ من العميل.

## Scope

This review covers the commerce portal design and trust boundary for:

- `client/src/components/RoleBasedCommercePortal.tsx`
- `server/routers.ts`
- `server/db.ts`
- `drizzle/schema.ts`
- `server/policyEngine.ts`
- `server/_core/trpc.ts`
- `server/_core/context.ts`

## Historical Executive Summary (pre-change baseline; superseded below)

The portal currently has a UI demo flow that looks production-oriented, but it does not enforce production commerce trust gates in the server boundary. The most significant issue is that the order-creation API accepts client-supplied partner and product information and uses it directly to insert a purchase order without verifying the current authenticated user, business membership, product status, partner verification, or authoritative price and MOQ values from the database.

`protectedProcedure` is an authentication gate only. It does not, by itself, enforce:

- verified KYC
- verified KYB where required
- active business membership
- buyer/seller relationship permissions
- active and verified partner
- active and verified product
- authoritative price and MOQ from the database
- audit event creation obligations

## Files Reviewed

- `client/src/components/RoleBasedCommercePortal.tsx`
- `server/routers.ts`
- `server/db.ts`
- `drizzle/schema.ts`
- `server/policyEngine.ts`
- `server/_core/trpc.ts`
- `server/_core/context.ts`

## Historical Specific Findings (pre-change baseline; superseded below)

### 1) Commerce order input is not server-trusted

In `server/routers.ts`, the `commerceOrders.create` mutation accepts all of the following as input from the client:

- `partnerKey`
- `partnerName`
- `productKey`
- `productName`
- `category`
- `quantity`
- `quantityUnit`
- `moq`
- `unitPriceMinor`
- `message`

This means the browser can send arbitrary values such as:

- a partner name not tied to a verified business record
- a product name not tied to an active product record
- a unit price that differs from the authoritative catalog price
- a MOQ that does not match the database-defined threshold

This violates the requirement: “Never trust client-supplied partner name, product name, unit price, MOQ, verification status, or business role.”

### 2) The order creation function does not validate identity or business trust gates

In `server/db.ts`, `createCommercePurchaseOrderForUser(userId, input)` performs only:

- `if (input.quantity < input.moq) throw new Error(...)`
- database insert into `commercePurchaseOrders`
- append audit event

It does not perform checks such as:

- `person.kycStatus === "verified"`
- `businessEntities.verificationStatus === "verified"`
- active membership (`businessMemberships.status === "active"`)
- member role exclusion (`viewer` or unauthorized role)
- buyer/seller relationship eligibility via `checkCommercialRelationshipForUser(...)`
- partner business active/verified state
- product catalog verification state
- authoritative price and MOQ from DB

### 3) The portal UI uses local role state and a local verification toggle

In `client/src/components/RoleBasedCommercePortal.tsx`, the component does this:

- `const [role, setRole] = useState<PortalRole>("consumer")`
- `const [verified, setVerified] = useState(true)`
- `const allowedKinds = role === ...`

This is a UI-only simulation. It is not trusted server authorization and should never be treated as a production trust gate. The requirement explicitly says: “The authenticated user role and active business membership must come from trusted server-side data, not a client-side role selector.”

### 4) The portal is not enforcing the production commerce role matrix

The design intends to support:

- Individual consumer
- Store / merchant
- Factory
- Importer
- Exporter
- Transport provider

But the current UI yields role and product filtering entirely on the client. There is no server-side role boundary enforcement for allowed business pairs and no gating based on verified membership or commerce policy.

### 5) Audit logging exists, but it is not enough by itself

`appendAuditEvent(...)` is used in `server/db.ts`, and the order creation path logs `commerce_purchase_order_created`. That is a positive control, but it does not replace compliance enforcement.

The system still allows an order to be written with unverified or untrusted partner/product data if the input is accepted by the API. Therefore, audit creation alone does not satisfy the trust requirement.

## Historical Explicit Validation Check (pre-change baseline; superseded below)

| Condition | Status | Evidence |
| --- | --- | --- |
| verified KYC | No | `createCommercePurchaseOrderForUser` never checks `persons.kycStatus` |
| verified KYB where required | No | `createCommercePurchaseOrderForUser` never checks `businessEntities.verificationStatus` or `kybVerifications` |
| active business membership | No | No membership query before insert |
| buyer/seller relationship permissions | No | No relationship validation via `checkCommercialRelationshipForUser` |
| active and verified partner | No | Input partner is accepted directly without DB lookup and verification |
| active and verified product | No | Input product is accepted directly without DB lookup and verification |
| authoritative price and MOQ from the database | No | Input `unitPriceMinor` and `moq` are client-supplied and inserted as-is |
| audit event creation | Yes | `appendAuditEvent({ action: "commerce_purchase_order_created" ... })` happens after insert |

## Historical Security Risk Statement (pre-change baseline; superseded below)

The current implementation is not safe for production commerce because it uses a client-supplied order payload as the source of truth. This violates the rule “Never trust client-supplied partner name, product name, unit price, MOQ, verification status, business role.”

## Historical Required Stop Condition (pre-change baseline; superseded below)

Before any auth, KYC/KYB, business membership, schema, migration, or audit-behavior change is implemented, human approval is required. This review confirms the current commerce flow is not ready for production authorization enforcement and should remain a design/documentation-only gate until those server-side trust checks are explicitly approved.

## Historical Recommended Controls (pre-change baseline; superseded below)

These are design-level controls that should be implemented under explicit approval:

1. Replace client input with server-resolved partner/product IDs and authoritative values.
2. Verify buyer identity and business membership before order creation.
3. Verify partner and product records are active and verified.
4. Enforce relationship policy before allowing any commercial transaction.
5. Reject any order where price or MOQ are client-supplied rather than DB-resolved.
6. Require audit event persistence for each order action.
7. Keep role filtering server-driven and never client-controlled.

## Historical Conclusion (pre-change baseline; superseded below)

The order creation flow is not yet production-compliant. It is a functional UI demo and not a trust-gated commerce workflow.

---

Prepared for: `feature/CIT-PORTAL-001`
Status of historical review: superseded by the reassessment below; no production data or services were changed.

---

## Reassessment after IAM and commerce changes — 2026-11-15

### Scope and conclusion

Reassessment covers `server/organizationAuthorization.ts`, `server/db.ts`, `server/routers.ts`, `drizzle/schema.ts`, `drizzle/0016_cit_arch_iam_001.sql`, the portal component, and the unit/integration test files. The branch now contains a meaningful server-side authorization slice, but it is **not production-ready**. Grant provisioning, ownership evidence, broader policy decisions, protected audit storage, and database integration proof remain incomplete or intentionally closed.

### Order input trust boundary — corrected

`commerceOrders.create` accepts only `buyerBusinessId`, `offeringId`, `quantity`, and `message`. The server resolves supplier identity, product name/category, quantity unit, MOQ, and unit price from the verified/published catalog. A buyer business must satisfy active membership, KYC, explicit `commerce.purchase_order.create` permission, verified KYB and verified operational activity. Government entities are explicitly rejected. This does not implement personal consumer purchase, C2C, or B2G procurement.

### Business creation and membership

`createBusinessEntityForUser` requires verified KYC, stores `createdByUserId/createdByPersonId`, leaves owner identifiers null, and does not create an owner membership. This avoids treating an applicant as a legal owner. However, the branch does not provide an approved ownership-evidence review process or a public membership/permission grant API. Consequently, operational access depends on an explicitly provisioned active membership and an explicit permission grant; otherwise it fails closed.

### Authorization and tenant isolation

`authorizeBusinessPermission` checks the exact requested business, user/person, active membership, explicit permission code and status, grant expiry, KYC, and KYB where required. A `viewer` role is denied for business operations; all other membership roles still require explicit grants. Covered create/update/review/list and trade flows apply the helper or equivalent scoped checks. Reads of business-bound trade records are filtered by creator/party scope and rechecked against active membership and permission. The unit authorization engine has eight tests for missing grants, context mismatch, inactive membership, expiry, and KYC/KYB gates. Database-backed IDOR/revocation coverage exists in `server/trade.integration.test.ts` but was not executable here.

### Authorization audit

`audit_events` now records actor, action/resource, business and membership when known, permission code, `allow/deny/manual_review`, reason code, optional request ID, classification, and metadata. Denials are written before `FORBIDDEN` is returned. This is structured application-level insertion, **not** proof of immutable/WORM storage, retention, tamper detection, or complete audit coverage for every system action.

### Independent review findings — remediation status

- **Ownership assignment without evidence (previously High):** quotation acceptance no longer copies the requester into transaction owner fields. `ownerBusinessId` and `ownerIndividualProfileId` remain `NULL`, and the audit metadata records `ownershipDetermination=unresolved`. No ownership transfer is implied.
- **Client catalog and false KYC state (previously Medium):** the portal now reads the verified commerce catalog and current KYC lifecycle state from server procedures. Hardcoded demo products, client-side prices/MOQ, and the fixed “KYC Verified” state were removed. Only the server-backed B2B purchase form is operationally offered; C2C and B2G remain closed.
- **Relationship authority and audit role:** the relationship-evaluation handler now requires the requester to hold the exact business permission or own the requester individual profile. Purchase-order creation evaluates the B2B relationship and accepts only `allow`; `deny` and `manual_review` stop before insertion. The membership role is recorded in authorization and relationship audit metadata.

Integration assertions were added for relationship eligibility, membership-role audit metadata, and unresolved transaction ownership. They remain **unverified** until run against an approved isolated test database; their presence is not reported as a passing integration result.

### Migration and production boundary

`0016_cit_arch_iam_001.sql` is generated only. It has not been applied, and no `db:push`, production migration, deployment, or production-data change was performed. Historical creator fields are nullable to avoid fabricating identity for legacy rows.

### Verification evidence

- `pnpm check`: passed.
- `pnpm test:unit`: passed; 40 tests across 9 files, including 8 authorization-engine tests and 7 pure relationship-eligibility tests.
- `pnpm build`: passed; Vite reported undefined Analytics variables and a non-blocking frontend chunk larger than 500KB.
- `pnpm test:integration`: the package script found no files via its filter. Direct execution of `server/trade.integration.test.ts` and `server/commercial-capabilities.integration.test.ts` failed all four DB-backed tests at `getDb() === null` because no `DATABASE_URL` is configured. No database writes occurred; there is no passing integration result.
- `git diff --check`: passed after all code and documentation edits.

### Residual risks / required follow-up

1. Approve and implement evidence, reviewer authority, and lifecycle for ownership/representation; do not auto-grant owner.
2. Define safe membership and permission grant/revoke administration and ensure revocation is immediate for every read and mutation.
3. Complete endpoint-level IDOR/revocation tests on an approved isolated test database.
4. Keep C2C, B2C, C2B, and B2G operations closed until their commercial, safety, and legal policies are approved; personal purchase is not enabled.
5. Decide MFA, session lifetime, recovery, privacy/consent, retention/deletion, and support-access rules without assuming regulatory requirements.
6. Provide protected audit retention/WORM only after a separate infrastructure and policy decision.

**Review outcome:** suitable for code review in a feature-branch PR only. Not approved for merge, production migration, deployment, or production commerce.
