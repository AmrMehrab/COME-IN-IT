# CIT PORTAL SECURITY REVIEW

## Scope

This review covers the commerce portal design and trust boundary for:

- `client/src/components/RoleBasedCommercePortal.tsx`
- `server/routers.ts`
- `server/db.ts`
- `drizzle/schema.ts`
- `server/policyEngine.ts`
- `server/_core/trpc.ts`
- `server/_core/context.ts`

## Executive Summary

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

## Specific Findings

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

## Explicit Validation Check: Does commerce order creation validate these?

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

## Security Risk Statement

The current implementation is not safe for production commerce because it uses a client-supplied order payload as the source of truth. This violates the rule “Never trust client-supplied partner name, product name, unit price, MOQ, verification status, business role.”

## Required Stop Condition

Before any auth, KYC/KYB, business membership, schema, migration, or audit-behavior change is implemented, human approval is required. This review confirms the current commerce flow is not ready for production authorization enforcement and should remain a design/documentation-only gate until those server-side trust checks are explicitly approved.

## Recommended Immediate Controls (Design Only)

These are design-level controls that should be implemented under explicit approval:

1. Replace client input with server-resolved partner/product IDs and authoritative values.
2. Verify buyer identity and business membership before order creation.
3. Verify partner and product records are active and verified.
4. Enforce relationship policy before allowing any commercial transaction.
5. Reject any order where price or MOQ are client-supplied rather than DB-resolved.
6. Require audit event persistence for each order action.
7. Keep role filtering server-driven and never client-controlled.

## Conclusion

The order creation flow is not yet production-compliant. It is a functional UI demo and not a trust-gated commerce workflow.

---

Prepared for: `feature/CIT-PORTAL-001`
Status: review-only, no production changes applied
