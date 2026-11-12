# COME IN IT V1.0 — Architecture Decisions

| ID | Decision | Status | Rationale |
|---|---|---|---|
| D-001 | KYC → KYB → Membership → Role → Permission → Offering → Matching → Trade → Audit → Intelligence is the governing sequence. | Accepted | Prevents anonymous commercial access. |
| D-002 | User, Person, and Business are separate concepts. | Accepted | Supports multiple businesses and authorized representatives. |
| D-003 | Product, Service, Used Asset, and Demand are first-class trade objects. | Accepted | Extends the platform from product marketplace to trade ecosystem. |
| D-004 | Offering verification is independent from owner KYB. | Accepted | A verified business can still publish an unverified offering. |
| D-005 | Visibility is Public / Verified / Restricted / Confidential-Sovereign. | Accepted | Prevents overexposure of buyer and government data. |
| D-006 | Egyptian sovereign hosting is required for sensitive and regulated data. | Conditional | Provider selection and legal controls remain separate approvals. |
| D-007 | Government integration, payments, blockchain, and final regulatory readiness are out of scope for V1.0. | Accepted | Avoids unsupported production claims. |
| D-008 | Healthcare is a consent-governed bounded domain, modelled in a dedicated ERD and permitted to reference PERSON only. | Accepted | Protects clinical isolation: no health record, consent, provider, emergency access, or health audit foreign key may attach to a commercial entity, offering, match, contract, order, transaction, dispute, or trade audit record. |
