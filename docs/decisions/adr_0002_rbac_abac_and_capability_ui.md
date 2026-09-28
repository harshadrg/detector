# ADR-0002: Decoupling Administrative Roles from Organizational Hierarchy & Capability-Driven UI

- **Status:** Accepted
- **Context:** In `DummyData.xlsx`, hierarchy columns (`Ops_Quality_Head`, `CBO`, `SBU_Head`, `Account_Head`, `PM`) represent business ownership, whereas `SUPER_ADMIN` and `BPMS_ADMIN` govern the system. Furthermore, 20 employees serve as both `Account_Head` and `PM` on 52 rows.
- **Decision:**
  1. Model `Roles` with explicit categories (`PLATFORM_ADMIN`, `MODULE_ADMIN`, `ORGANIZATIONAL`) and many-to-many `Employee_Role_Mapping`.
  2. Enforce access via a two-step `AuthorizationService` (RBAC permission check + ABAC `Process_Ownership` scope check).
  3. Return resolved `permissions` at login and row-level `capabilities` on each process record so the React frontend uses a single shared UI shell with zero hardcoded `if (role === ...)` checks.
- **Consequences:** Dual-hatted employees work seamlessly, and new roles can be introduced without duplicating React dashboards.