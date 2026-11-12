# COME IN IT V1.0 — Traceability Matrix

| Requirement | Canonical entities | Workflows | API contract | UI surface | Audit event |
|---|---|---|---|---|---|
| KYC/KYB gate | PERSON, IDENTITY, ENTITY, VERIFICATION | WF-001…WF-006 | identity.verify, entity.verify | Data Flow, Certificate | verification.status.changed |
| Commercial access | MEMBERSHIP, ROLE, PERMISSION, RELATIONSHIP | WF-007…WF-012 | membership.assign, access.evaluate | Permissions Matrix | access.denied / granted |
| Offering integrity | OFFERING, OFFERING_VERIFICATION | WF-013…WF-016 | offering.register, offering.verify | ERD, API Docs | offering.lifecycle.changed |
| Trade completion | MATCH, OFFER, CONTRACT, ORDER, TRANSACTION | WF-017…WF-023 | match.evaluate, contract.create | Analytics, Contracts | trade.lifecycle.changed |
| Dispute evidence | DISPUTE, EVIDENCE, RESOLUTION | WF-024…WF-027 | dispute.open, evidence.submit | Dispute Simulator | dispute.decision.issued |
| Sovereign audit | AUDIT_EVENT, CERTIFICATE, NOTIFICATION | WF-028…WF-030 | audit.query, certificate.issue | WORM Dashboard | worm.hash.anchored |
| Healthcare boundary and consent | PERSON (reference only), HEALTH_PROFILE, HEALTH_CONSENT, HEALTH_ACCESS_LOG | HW-001…HW-006 | healthcare.consent.*, healthcare.access.* | Healthcare Domain | healthcare.consent.created / healthcare.access.recorded |

## Coverage interpretation

The current application demonstrates these surfaces through safe simulations and documentation. The Healthcare ERD remains a separate canonical sidecar (`COME_IN_IT_HEALTH_ERD.mmd`) whose only cross-domain reference is `PERSON`; it does not extend the commercial ERD with clinical foreign keys. Production acceptance requires backend state machines, server-side policy evaluation, contract tests, and retention enforcement.
