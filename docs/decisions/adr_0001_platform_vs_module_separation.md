# ADR-0001: Separation of Detector Core Platform from Pluggable Modules

- **Status:** Accepted
- **Context:** Detector begins with BPMS as its first operational workflow, but must support future enterprise modules (FMEA, HR, Finance) without rewriting authentication, RBAC, notifications, or auditing.
- **Decision:** Split the architecture into `core` (Identity, RBAC/ABAC `AuthorizationService`, `Notifications`, append-only `Audit_Events`) and `modules/*` (`modules/bpms`). Core tables never contain foreign keys pointing strictly to `Process_Registry`; instead, `Notifications` and `Audit_Events` use polymorphic `(module_code, entity_type, entity_id)` references.
- **Consequences:** New modules can plug directly into Detector Core's session, permission, notification, and audit infrastructure without schema changes to Core.