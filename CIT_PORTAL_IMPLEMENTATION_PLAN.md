# CIT PORTAL IMPLEMENTATION PLAN

> **الحالة المحدثة — 2026-11-15:** الخطة أدناه بدأت كوثيقة ما قبل التنفيذ. تم تنفيذ نطاق تقني قابل للحسم على `feature/CIT-PORTAL-001` بعد موافقة المستخدم. الأقسام التي تحمل وصفاً قديماً للحالة تُقرأ كتاريخ للخط الأساس؛ ملحق التنفيذ في نهاية الملف هو المرجع للحالة الحالية. هذا لا يعد موافقة دمج أو نشر.

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

## Phase 0 — Review Gate (historical baseline)

- Confirm repository state and trust boundary
- Review auth, policy, schemas, and membership checks
- Produce review documents
- Freeze any schema or policy changes until human approval is received

Status at plan creation: complete for review-only stage; superseded by the approved feature-branch implementation below.

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

### Historical status before approved implementation

At plan creation, the implementation failed these checks because the order API accepted client-supplied values. This specific finding was corrected in the approved feature-branch work; see the current status below.

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

## Historical Risks and Constraints (pre-implementation)

- The current portal design uses local role and verification state, which is not production-safe.
- The current commerce order API accepts client-supplied commercial values.
- Price and MOQ are not yet the server-authoritative source of truth.
- Additional schema or policy enforcement will require explicit approval before implementation.

## Final Implementation Rule

No commerce feature may be implemented by trusting client-side inputs or UI state. All authorization, trust, and commercial pricing decisions must come from the server and the database-backed verification records.

---

Status: original pre-implementation plan; current execution results and outstanding work follow.

---

## Current implementation status — 2026-11-15

### Completed in this branch

- Separated business applicant/creator fields from legal owner fields; business creation requires KYC, stores the creator, leaves owner unset, and does not create owner membership automatically.
- Added a deny-by-default authorization helper requiring the exact business context, active membership, explicit permission code/status, unexpired grant, KYC, and KYB for operations that require a verified business. No membership role implicitly grants permissions.
- Added structured allow/deny audit fields for covered business authorization checks, including `membershipRole` in metadata; tightened list/read/mutation scopes against cross-business access and revoked/expired authorization.
- Changed commerce order input to `buyerBusinessId`, `offeringId`, `quantity`, and `message`; the server resolves partner/product and commercial terms from the verified catalog and permits creation only when the B2B relationship evaluation is `allow`. B2C/C2C/B2G purchase flows are not enabled; government entities are rejected.
- Replaced portal demo prices, products, and fixed KYC claims with server catalog/KYC queries; the UI exposes a B2B-only purchase path and labels server revalidation, while individual and government purchase remain closed.
- Prevented quotation acceptance from assigning legal ownership without evidence; transaction owner fields remain null and the audit event states `ownershipDetermination=unresolved`.
- Added authorization unit tests and strengthened trade integration scenarios for missing grants, role-only access, IDOR/context mismatch, membership revocation, and counterparty permissions.
- Updated the canonical specification, entity dictionary, workflow catalog, permissions matrix, acceptance criteria, gap register, architecture decisions, security review, and this implementation plan.

### Quality results

- `pnpm check`: passed.
- `pnpm test:unit`: passed (40 tests across 9 files; 8 authorization-engine tests plus 7 pure relationship-eligibility tests).
- `pnpm build`: passed; Vite reports undefined Analytics variables and a non-blocking frontend chunk larger than 500KB.
- Integration tests: `pnpm test:integration` found no files via its script filter. Direct execution of `server/trade.integration.test.ts` and `server/commercial-capabilities.integration.test.ts` failed all four DB-backed tests at `getDb() === null` because `DATABASE_URL` is not configured. No database writes occurred; integration remains unverified.
- Migration `drizzle/0016_cit_arch_iam_001.sql` and snapshot/journal are generated locally only and were not applied.

### Decisions and implementation deliberately deferred

- Ownership evidence, legal representative proof, owner assignment, multiple owners/quorum, membership invitation/approval, and permission-grant/revoke administration.
- KYC/KYB evidence standards and provider/operational review rules; no legal standard is inferred.
- MFA, session lifetime/recovery, individual commerce and used-asset/C2C thresholds, B2C/C2B/B2G eligibility, and government integration.
- Professional-profile and job workflows (Issue #9) remain unimplemented pending approval of privacy, sharing/consent, field-scope, and retention rules; no legal or commercial policy is inferred. Privacy and retention/deletion rules, support access, and storage-level immutable/WORM audit also remain unresolved.
- Successful endpoint-level integration testing on an approved isolated test database.

### Final delivery gate

The branch is for review via a Pull Request only. Do not merge, deploy, run `db:push`, apply the migration, or modify production data. Operations depending on unresolved policy remain denied/closed by default. The PR must state that integration tests remain unverified due to the absent test database.
