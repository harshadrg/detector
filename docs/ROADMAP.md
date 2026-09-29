# Detector Enterprise Platform — Master Implementation Roadmap

This roadmap governs the phased engineering delivery of the **Detector Enterprise Platform**, spanning Core Platform capabilities and the initial operational module, **BPMS (Business Process Management System)**.

---

## Operating Protocol for Roadmap Execution
- **Strict Phase Gate:** Execute **EXACTLY ONE PHASE PER PROMPT**.
- **Deliverables per Phase:** Full implementation, zero lint/build regressions, documentation update, verified tests/assertions, and exact git commit commands.
- **Stop Requirement:** Stop immediately after each phase and request user approval before advancing to the next phase.

---

## Master Phase Checklist

- [x] **Phase 0: System Initialization & Monorepo Baseline**
- [x] **Phase 1: Database Foundation & Core Schemas (T-SQL Scripts, Constraints & Triggers)**
- [x] **Phase 2: Core Platform Identity, Authentication & Session Security**
- [x] **Phase 3: Core Authorization Engine (RBAC + ABAC Middleware & Capability Resolver)**
- [ ] **Phase 4: Core Employee Directory & Role Governance**
- [ ] **Phase 5: Core Immutable Audit Ledger (`Audit_Events`) & Notifications Engine**
- [ ] **Phase 6: BPMS Master Data Management (Verticals, SBUs, Clients & Locations)**
- [ ] **Phase 7: BPMS Staged Excel Migration & Ingestion Pipeline**
- [ ] **Phase 8: BPMS Process Registry & Server-Side AG Grid Engine**
- [ ] **Phase 9: BPMS Process Detail & Unified Process Management View**
- [ ] **Phase 10: BPMS Change Request Engine & Side-by-Side Review Workflow**
- [ ] **Phase 11: BPMS Scenario-Driven PM Handover Workflow & Zero Standing Privileges**
- [ ] **Phase 12: BPMS Process Closure & Lifecycle Deactivation Workflow**
- [ ] **Phase 13: Platform Hardening, Offboarding Safeguards, Operational Dashboard & E2E Validation**

---

## Detailed Phase Specifications

### Phase 0: System Initialization & Monorepo Baseline
- **Status:** `COMPLETED` (`[x]`)
- **Objectives:**
  - Audit monorepo workspace dependencies, directory structure, and tooling configuration.
  - Establish `AGENTS.md` governing all future development sessions with strict phase-gate rules.
  - Initialize `docs/ROADMAP.md` tracking all 14 execution phases against architectural documentation.
  - Clean Vite/React starter boilerplate and configure minimal status card baseline in `detector-client`.
  - Maintain zero lint warnings (`eslint`, `oxlint`) and zero build errors across workspaces.

---

### Phase 1: Database Foundation & Core Schemas (T-SQL Scripts, Constraints & Triggers)
- **Status:** `COMPLETED` (`[x]`)
- **Objectives:**
  - Implement raw parameterized T-SQL database migration scripts for Microsoft SQL Server (`Detector_DB`).
  - Deploy **Core Platform Tables:** `Employees`, `Employee_Identities`, `System_Modules`, `Roles`, `Permissions`, `Role_Permissions`, `Employee_Role_Mapping`, `Notifications`, `Audit_Events`.
  - Deploy **Master Tables:** `Verticals`, `SBUs`, `Clients`, `Locations`.
  - Deploy **BPMS Module Tables:** `Process_Registry`, `Process_Ownership`, `Process_Change_Requests`, `Process_Handover_Requests`, `Import_Batches`, `Import_Staging_Rows`.
  - Implement filtered unique indices (e.g. `UX_ProcessOwnership_Current` on `(registry_id, role_type) WHERE is_current = 1`).
  - Implement immutable `INSTEAD OF UPDATE, DELETE` trigger on `Audit_Events`.
  - Seed initial platform modules (`CORE`, `BPMS`), system roles, and permissions catalog.

---

### Phase 2: Core Platform Identity, Authentication & Session Security
- **Status:** `COMPLETED` (`[x]`)
- **Objectives:**
  - Implement backend authentication endpoints (`/api/core/auth/login`, `/api/core/auth/logout`, `/api/core/auth/me`).
  - Secure credential verification with password hashing and `token_version` invalidation.
  - Implement `HttpOnly`, `SameSite=Strict` secure session cookies with CSRF mitigation.
  - Enforce active employee account checks (reject `INACTIVE` users immediately regardless of token expiry).
  - Build minimal client authentication state provider and login screen.

---

### Phase 3: Core Authorization Engine (RBAC + ABAC Middleware & Capability Resolver)
- **Status:** `COMPLETED` (`[x]`)
- **Objectives:**
  - Implement centralized `AuthorizationService` evaluating RBAC permissions and ABAC ownership scopes (`GLOBAL`, `OWN_HIERARCHY`, `OWN_PROCESS`, `SELF`).
  - Implement Express middleware guards: `requirePermission(code)` and `requireScope(evaluator)`.
  - Build server-side capability resolver returning row-level `capabilities` array on resources.
  - Implement Safe UI Context Switcher (`CORE.CONTEXT.SWITCH` via `X-UI-Context-Role` header) with immutable audit attribution.
  - Connect client React navigation and layout shell to render strictly from resolved capabilities (zero hardcoded role strings).

---

### Phase 4: Core Employee Directory & Role Governance
- **Status:** `COMPLETED` (`[x]`)
- **Objectives:**
  - Build `/api/core/employees` endpoints (list, create, update, role assignment, status toggling).
  - Enforce separation between administrative roles (`PLATFORM_ADMIN`, `MODULE_ADMIN`) and organizational roles (`ORGANIZATIONAL`).
  - Implement employee administration interface in `detector-client` with role assignment modal.
  - Implement guard checking active process assignments before deactivating any employee.

---

### Phase 5: Core Immutable Audit Ledger (`Audit_Events`) & Notifications Engine
- **Status:** `COMPLETED` (`[x]`)
- **Objectives:**
  - Build centralized, platform-wide auditing service logging previous/updated JSON diffs, actor identity, acting context, and correlation IDs.
  - Build polymorphic notification dispatch engine (`recipient_ecode`, `entity_type`, `entity_id`, `message`, `action_url`).
  - Implement `/api/core/audit` query endpoints and `/api/core/notifications` feed.
  - Implement real-time or polled client notification bell and audit inspection drawer.

---

### Phase 6: BPMS Master Data Management (Verticals, SBUs, Clients & Locations)
- **Status:** `COMPLETED` (`[x]`)
- **Objectives:**
  - Build master data management REST endpoints under `/api/modules/bpms/masters` (Verticals, SBUs, Clients, Locations).
  - Seed baseline master records derived from `DummyData.xlsx` analysis (BFSI, MEU, TECH&DIGITAL, EMERGING).
  - Implement master data caching and dropdown lookup providers for client forms.

---

### Phase 7: BPMS Staged Excel Migration & Ingestion Pipeline
- **Status:** `COMPLETED` (`[x]`)
- **Objectives:**
  - Implement staged Excel upload endpoint (`/api/modules/bpms/imports/stage`) using `multer` and `read-excel-file`.
  - Implement data normalization engine (handling sentinel values like `PO_NOT_RAISED`, `BUSINESS_CLOSED`, `-`, trimming whitespace, standardizing client types).
  - Implement validation engine against `Employees` and `SBUs` with row-level error reporting.
  - Build staged preview UI showing valid vs. errored rows with error summaries.
  - Implement transactional batch commit (`/api/modules/bpms/imports/:batchId/commit`) creating canonical `Process_Registry` rows and initial `Process_Ownership` records.

---

### Phase 8: BPMS Process Registry & Server-Side AG Grid Engine
- **Status:** `PENDING` (`[ ]`)
- **Objectives:**
  - Implement server-side paginated, sorted, and filtered process query endpoint (`/api/modules/bpms/processes`).
  - Enrich each process record with current 5-level hierarchy owners and computed row-level `capabilities`.
  - Enforce ABAC scoping (`GLOBAL`, `OWN_HIERARCHY`, `OWN_PROCESS`) directly in SQL query predicates.
  - Build high-performance client AG Grid table with server-side data source, multi-column filtering, and capability-driven row action triggers.

---

### Phase 9: BPMS Process Detail & Unified Process Management View
- **Status:** `PENDING` (`[ ]`)
- **Objectives:**
  - Build unified process management screen (`/bpms/processes/:id`) featuring a tabbed interface:
    - **Tab 1:** Approved Process Details & Current Hierarchy.
    - **Tab 2:** Change Request Drafting & Submission form.
    - **Tab 3:** Ownership History Timeline (visualizing historical handovers and dates).
    - **Tab 4:** Process Audit Trail (isolated event history).
  - Display contextual capability buttons (Request Handover, Request Deactivation, Edit Details).

---

### Phase 10: BPMS Change Request Engine & Side-by-Side Review Workflow
- **Status:** `PENDING` (`[ ]`)
- **Objectives:**
  - Implement `Process_Change_Requests` API (`DRAFT`, `SUBMITTED`, `UNDER_REVIEW`, `APPROVED`, `REJECTED`, `CANCELLED`).
  - Implement optimistic concurrency control using `version_num` on `Process_Registry`.
  - Build side-by-side before/after visual diff viewer in `detector-client`.
  - Implement review flow requiring mandatory `review_remarks` on rejection and non-destructive approval updating `Process_Registry`.

---

### Phase 11: BPMS Scenario-Driven PM Handover Workflow & Zero Standing Privileges
- **Status:** `PENDING` (`[ ]`)
- **Objectives:**
  - Implement `/api/modules/bpms/processes/:id/handovers` supporting standard operational scenarios (`PM_MOVED_PROJECT`, `PM_ROLE_CHANGE`, `PM_LEFT_COMPANY`, `TEMPORARY_HANDOVER`, `ESCALATION`, `ADMIN_OVERRIDE`).
  - Implement atomic handover execution: close current PM ownership (`effective_to = now`), open new PM ownership (`effective_from = now`).
  - Implement **Zero Standing Privileges rule:** automatically revoke `PROJECT_MANAGER` role from outgoing PM if they have 0 remaining active PM ownerships.
  - Build handover modal and review approval interface in client.

---

### Phase 12: BPMS Process Closure & Lifecycle Deactivation Workflow
- **Status:** `PENDING` (`[ ]`)
- **Objectives:**
  - Implement `PROCESS_END` change request workflow requiring operational closure date (`ended_on`) and closure remarks.
  - Transition `Process_Registry.status` to `INACTIVE` upon approval without destroying ownership history.
  - Enforce invariant that deactivated processes remain queryable in historical audit and ownership timelines.

---

### Phase 13: Platform Hardening, Offboarding Safeguards, Operational Dashboard & E2E Validation
- **Status:** `PENDING` (`[ ]`)
- **Objectives:**
  - Implement employee offboarding safeguard blocking or warning upon deactivation of employees with active ownership assignments, generating automated handover alerts.
  - Build role-scoped Operational Dashboard with real-time KPI metrics (Active Processes, Pending Reviews, Handover Queue, Recent Audits).
  - Verify complete platform workflow end-to-end (Import → Process Registry → Change Request → Approval → Handover → Deactivation).
  - Conduct air-gap security audit, verify zero console errors, zero lint warnings, and finalize production deployment documentation.
