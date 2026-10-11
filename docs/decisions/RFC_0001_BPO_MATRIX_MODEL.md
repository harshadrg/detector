# RFC 0001 — Future BPO Matrix Organization & Delivery Project Model (v2 Proposal)

> **Document Status:** Future Architectural Proposal / RFC (Not Active for v1)  
> **Context:** The current v1 platform runs on a Hierarchical BPMS model (`Client → Vertical → SBU → Process`). This document records the proposed design requirements should the platform undergo a future v2 re-architecture into a cross-cutting BPO matrix organization with bounded delivery projects.

---

## 1. Architectural Problem Statement (v2 Matrix Model)

In a cross-cutting BPO enterprise:
- Access is matrix-based and responsibility-scoped rather than purely process-centric.
- Explicit separation is required between designation, business responsibility, and application permissions.
- A first-class `Account` entity exists where an Account can span multiple SBUs, and SBUs can serve multiple Accounts and Verticals.
- Delivery projects are time-bounded work assignments separate from ongoing operational process ownership.
- KPI/SLA measurement with source-of-truth, freshness, and role-based visibility.

---

## 2. Target Architectural Goals

The proposed v2 architecture would:
- Represent the BPO business model using explicit domains: vertical, account, client, SBU, project, employee responsibility, and process.
- Keep designation, business responsibility, and application role as distinct concepts.
- Evaluate access using explicit permissions and explicit scope (`GLOBAL`, `VERTICAL`, `ACCOUNT`, `SBU`, `PROJECT`, `PROCESS`).
- Implement durable asynchronous outbox pattern for notifications and external integrations.
- Require re-authentication for all destructive or approval-changing database actions.

---

## Proposed Phase Roadmap (For Future Migration)

### Phase 0: Business and BPO Model Alignment
- Define domain glossary: Vertical, SBU, Client, Account, Designation, Business Responsibility, Application Role, Process, Delivery Project.
- Formalize cardinality rules: Clients have multiple Accounts; Accounts span multiple SBUs; SBUs serve multiple Accounts and Verticals.

### Phase 1: Foundation Hardening & Production Baseline
- Environment validation, production secret validation.
- Structured JSON logging (`correlationId`, `requestId`, `user`, route, duration).
- Health endpoints (`/api/health`, readiness, liveness).
- Automated CI pipeline with unit and integration tests.

### Phase 2: Identity, Sessions, and Authentication Hardening
- Decouple employee profile from authentication identity.
- Session revocation on role or status changes.
- Generic failure messages and rate limiting.

### Phase 3: Role, Responsibility, and Scope Model Redesign
- Domain entities: `Employee_Designation`, `Business_Responsibility`, `Employee_Responsibility_Assignment`, `Application_Role`.
- Scopes: company-wide, vertical, account, sbu, project, process, quality/compliance.

### Phase 4: Organization and Master Data Redesign
- Entities: `Clients`, `Accounts`, `Verticals`, `SBUs`, `Vertical_SBU_Association`, `Account_SBU_Association`.
- Effective-dated assignments.

### Phase 5: Process and Project Model Redesign
- First-class `Delivery_Projects` and `Project_Assignment`.
- Separate operational process ownership from bounded delivery project manager assignment.

### Phase 6: Process Registry & SQL Scope Enforcement
- Scope filtering by Account, SBU, Vertical, Project, Process Ownership.
- Parameterized SQL scope predicates.

### Phase 7: Import Pipeline, Validation, and Commit Security
- Batch metadata, row diff (`NEW`, `EXISTING_EXACT`, `DIFFERENCE`), and all-or-nothing transactional commit.

### Phase 8: Workflow Review, Approvals, and Handovers
- State machine for change requests and project handovers with password re-authentication.

### Phase 9: Audit, Notifications, and Async Outbox
- Durable outbox table, notification queue processing, retry & dead-letter handling.

### Phase 10: KPI, SLA, and Performance Management
- Metric definitions (AHT, FCR, quality score, SLA compliance, attrition, NPS).
- Observation tables and role-scoped dashboards.

### Phase 11: Security, Performance, and Test Coverage Hardening
- Automated test suites (unit, integration, lifecycle).
- IDOR and scope leakage validation.

### Phase 12: Production Rollout and Operational Readiness
- Deployment runbooks, restore validation, canary rollouts, alerting.

