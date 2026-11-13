# CIT PORTAL IMPLEMENTATION PLAN

## Objective

Deliver a production-oriented, role-aware commerce portal while preserving the existing architecture and keeping the demo/simulation experience separated from real production commerce flows.

## Execution Constraints

- Work only on branch: `feature/CIT-PORTAL-001`
- Do not commit to `main`
- Do not deploy
- Do not modify production data
- Do not expose secrets, credentials, personal data, or customer records
- Stop before any KYC/KYB/auth/schema/migration/audit-policy change without human approval
- Never treat frontend visibility as authorization
- Never invent fields or API procedures without verifying their existence first

## Affected Files (Planned)

### Frontend

- `client/src/components/RoleBasedCommercePortal.tsx`
- `client/src/components/` related portal screens or route wrappers (if created)
- `client/src/lib/trpc.ts` if contract binds to new server APIs
- `client/src/_core/hooks/useAuth.ts` if role loading is adjusted to server-authenticated data

### Backend

- `server/routers.ts`
- `server/db.ts`
- `server/policyEngine.ts`
- `server/_core/trpc.ts`
- `server/_core/context.ts`
- `drizzle/schema.ts`
- `drizzle/relations.ts` (if relation mapping or new authoritative data references are required)

### Validation / tests

- Existing unit/integration tests under the repo test folders
- New role boundary tests
- New trust gate tests
- New product integrity tests
- New order creation tests

## Phase 0 — Review Gate (Current)

- Confirm repository state and trust boundary
- Review auth, policy, schemas, and membership checks
- Produce review documents
- Freeze any schema or policy changes until human approval is received

Status: complete for review-only stage

## Phase A — Security and Integration Review

### Goal

Verify that commerce operations are guarded by server-side trust checks and not by client-side visibility.

### Deliverables

- `CIT_PORTAL_SECURITY_REVIEW.md`
- `CIT_PORTAL_API_CONTRACT.md`
- `CIT_PORTAL_IMPLEMENTATION_PLAN.md`

### Required verification

Before any implementation code is written, confirm:

- buyer KYC is required and enforced
- business KYB is required where applicable
- active business membership is required
- relationship policy is enforced
- partner and product are active and verified
- price and MOQ are DB-authoritative
- audit logs are created on every order action

### Current status

The current implementation fails these checks because the order API accepts client-supplied values and uses them directly.

## Phase B — Role-Aware Portal Architecture

### Goal

Build role-specific portal experiences for the approved commerce roles while using server-side identity and business membership, not client role state.

### Portal roles

- Individual consumer
- Store / merchant
- Factory
- Importer
- Exporter
- Transport provider

### Required rules

- Consumer access is limited to verified stores only.
- Stores may discover eligible factories and importers.
- Factories and importers may only interact with allowed business types per approved policy.
- Export and transport workflows must honor approved permissions.
- Frontend visibility must never be treated as authorization.

## Phase C — Data Integrity and Server Trust

### Goal

Replace hardcoded demo partner/product data with verified API-backed data.

### Required controls

- Server resolves partner identity from trusted records.
- Server resolves product identity from trusted records.
- Server resolves authoritative unit price and MOQ from database.
- Server validates verification and activity status.
- Client may request list data but may not submit price or MOQ values.
- All order actions are audited.

### Source of truth

Use the existing trust-gated tables already present in the schema:

- `persons`
- `businessEntities`
- `businessMemberships`
- `kycVerifications`
- `kybVerifications`
- `individualActivityProfiles`
- `businessActivityVerifications`
- `tradeOfferings`
- `tradeDemands`
- `tradeMatches`
- `tradeTransactions`
- `auditEvents`

## Phase D — UX and Access States

### Required experience states

- role-aware dashboard
- partner discovery and filtering
- verified catalog
- product detail view
- request / order creation
- order history and status
- loading state
- empty state
- error state
- access denied state
- Arabic RTL layout
- responsive layout

### Demo separation

Demo/simulation flows must be clearly separated from production commerce so that mock data is never used as the source of truth for real orders.

## Phase E — Tests and Quality Gates

### Required tests

- role-boundary tests
- trust-gate tests
- product integrity tests
- order-creation validation tests
- unauthorized API rejection tests
- unverified business/product rejection tests
- order audit logging tests
- TypeScript check
- production build validation

### Required gates

- Existing tests pass
- New tests pass
- TypeScript check passes
- Production build passes

## Risks and Constraints

- The current portal design uses local role and verification state, which is not production-safe.
- The current commerce order API accepts client-supplied commercial values.
- Price and MOQ are not yet the server-authoritative source of truth.
- Additional schema or policy enforcement will require explicit approval before implementation.

## Final Implementation Rule

No commerce feature may be implemented by trusting client-side inputs or UI state. All authorization, trust, and commercial pricing decisions must come from the server and the database-backed verification records.

---

Status: implementation plan prepared for approval before code changes
