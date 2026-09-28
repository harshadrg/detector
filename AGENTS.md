# AGENTS.md — Detector Enterprise Platform Operating Guide

> **CRITICAL DIRECTIVE FOR ALL AGENT SESSIONS:**
> Every AI agent, coding assistant, or developer working in this repository MUST strictly follow the operating principles, architectural separation rules, authorization design, and phase-gate workflow defined in this document.

---

## 1. Critical Operating Rules

1. **Strict Phase-Gate Execution:**
   - Execute **EXACTLY ONE PHASE PER PROMPT** as defined in `docs/ROADMAP.md`.
   - Never jump ahead to write future database tables, backend controllers, seed scripts, or frontend UI components scheduled for later phases.
   - For every phase:
     1. Review the phase requirements against the relevant documentation in `docs/`.
     2. Implement only the changes required for the current phase.
     3. Verify outputs (linting, build, type/syntax checks, test runs where applicable).
     4. Mark the phase as completed (`[x]`) in `docs/ROADMAP.md`.
     5. Provide the exact `git add` and `git commit -m` commands following the repository commit rule (`.agents/rules/git-commit.md`).
     6. **STOP AND WAIT FOR USER APPROVAL** before proceeding to any subsequent phase.

2. **Zero Unapproved Package Installations:**
   - Do NOT run `npm install <package>` or introduce new dependencies without explicit, prior user approval.
   - All workspace dependencies must stay explicitly owned in their consuming workspaces (`apps/client` or `apps/server`).

3. **Strict JavaScript (ES Modules) Only:**
   - Use standard modern JavaScript with ES Modules (`import` / `export`) in `.js` and `.jsx` files.
   - Do NOT introduce TypeScript (`.ts`, `.tsx`), TS compiler configs, or compilation overhead into application workspaces.

---

## 2. Platform Architecture: Core vs. Pluggable Modules

Detector is designed as a modular, air-gapped enterprise platform that hosts multiple distinct business operation modules on a unified core shell.

```
                    ┌─────────────────────────────────────────────────────────┐
                    │               DETECTOR CORE PLATFORM                    │
                    │  Corporate Identity • Authentication (JWT / HttpOnly)    │
                    │  Capability-Driven Authorization (RBAC + ABAC)          │
                    │  Employee Directory • Notifications Engine              │
                    │  Immutable Platform Audit Ledger (Audit_Events)         │
                    └────────────────────────────┬────────────────────────────┘
                                                 │
                               ┌─────────────────┴─────────────────┐
                               ▼                                   ▼
                ┌───────────────────────────────┐   ┌───────────────────────────────┐
                │         BPMS MODULE           │   │    FUTURE ENTERPRISE MODULES  │
                │  Business Process Management  │   │  (FMEA, Operations, Finance,  │
                │  Process Registry • Ownership │   │   Compliance, Asset Tracking) │
                │  Change Requests • Handovers  │   │                               │
                └───────────────────────────────┘   └───────────────────────────────┘
```

### Architectural Invariants:
1. **Never pollute Core with Module logic:** Core tables (`Employees`, `Roles`, `Permissions`, `Notifications`, `Audit_Events`) must never contain foreign keys or column references tied exclusively to a specific module (e.g., no `registry_id` or `process_code` in Core tables).
2. **Polymorphic Event & Notification References:**
   - Notifications and Audit events link to modules via `(module_code, entity_type, entity_id)` triples.
   - Any module can trigger notifications or emit audit records without requiring schema migrations in the Core platform.
3. **Pluggable Module Boundary:**
   - Operational modules reside in isolated namespaces (backend: `/api/modules/<module-name>`, frontend: `/modules/<module-name>` or `/bpms/*`).
   - The first operational module is **BPMS (Business Process Management System)**.

---

## 3. Authorization Architecture: RBAC + ABAC

### Separation of Role Categories:
Detector strictly separates system governance authority from organizational corporate hierarchy:
- **Platform Admin (`PLATFORM_ADMIN`):** `SUPER_ADMIN` — System-wide platform governance, employee management, security configurations, and global audit inspection.
- **Module Admin (`MODULE_ADMIN`):** `BPMS_ADMIN` — Module governance, import pipelines, batch approvals, and module-specific role assignments.
- **Organizational Hierarchy (`ORGANIZATIONAL`):** `OPS_QUALITY_HEAD`, `CBO`, `SBU_HEAD`, `ACCOUNT_HEAD`, `PROJECT_MANAGER` — Operational roles representing business reporting lines.

### Dual-Hatting & Multi-Role Support:
- Employees frequently hold multiple roles simultaneously (e.g., an `ACCOUNT_HEAD` acting as operational `PROJECT_MANAGER` on specific accounts, or an executive `CBO` holding `SUPER_ADMIN` privileges).
- Role mappings are stored as a many-to-many relationship in `Employee_Role_Mapping`.

### Capability-Driven UI (No Hardcoded Role Checks):
- **NEVER** write role checks in the React frontend such as `if (user.role === 'SUPER_ADMIN')` or `if (role === 'PM')`.
- The backend evaluates granular permissions and ABAC ownership filters, returning:
  1. A flattened list of user `permissions` on `/api/core/auth/me`.
  2. Row-level `capabilities` arrays on each resource object (e.g., `process.capabilities = ["BPMS.PROCESS.VIEW", "BPMS.CHANGE_REQUEST.SUBMIT", "BPMS.HANDOVER.REQUEST"]`).
- Frontend components render action buttons, edit forms, and review interfaces strictly based on `capabilities.includes(...)`.

### Safe UI Context Switcher (`CORE.CONTEXT.SWITCH`):
- `SUPER_ADMIN` can simulate other roles in the UI via an explicit context header (`X-UI-Context-Role`).
- The backend always authenticates and records `performed_by` using the real authenticated user identity and explicitly logs the `acting_context` in `Audit_Events`.

---

## 4. Technical Stack Constraints & Implementation Rules

### Monorepo Structure:
- **Workspaces:** Native npm workspaces defined in root `package.json` (`apps/*`, `packages/*`).
- **Client Workspace:** `apps/client` (`detector-client`).
- **Server Workspace:** `apps/server` (`detector-server`).

### Client Stack (`detector-client`):
- **Framework:** React 19, Vite 8, React Compiler (`babel-plugin-react-compiler`).
- **Styling:** Tailwind CSS v4 (`@tailwindcss/vite` with `@import "tailwindcss";`).
- **Routing:** React Router (`react-router` v8).
- **Data Fetching & State:** TanStack Query (`@tanstack/react-query`).
- **Data Tables:** AG Grid Community (`ag-grid-community`, `ag-grid-react`).
- **Forms & Validation:** React Hook Form (`react-hook-form`), Zod (`zod`).
- **Icons:** Lucide React (`lucide-react`).
- **HTTP Client:** Native `fetch` with centralized API wrapper. **Do NOT use `axios`**.

### Server Stack (`detector-server`):
- **Runtime:** Node.js (>=22.22.0), ES Modules (`"type": "module"`).
- **Web Framework:** Express 5 (`express`).
- **Database:** Microsoft SQL Server (`mssql`).
- **Zero ORM Rule:** Write raw, parameterized T-SQL queries using `request.input()`. **Never use ORMs** (no Prisma, TypeORM, or Sequelize).
- **File Handling & Excel:**
  - `multer` for secure multipart upload handling into memory/temporary storage.
  - `read-excel-file` for staged spreadsheet parsing.
  - `write-excel-file` for export generation.
  - **Never use `ExcelJS`** (banned due to supply-chain vulnerability risk).
- **Security:** `helmet`, `cors`, `cookie-parser`, `jsonwebtoken` (HttpOnly, SameSite=Strict cookies with CSRF token), `express-rate-limit`.

---

## 5. Phase-Gate Workflow & Roadmap Reference

Consult `docs/ROADMAP.md` for the comprehensive 14-phase schedule:
- **Phase 0:** Architecture Baseline & Monorepo Initialization `[x]`
- **Phase 1:** Database Foundation & Core Schemas (T-SQL Scripts, Constraints, Triggers) `[ ]`
- **Phase 2:** Core Identity, Authentication & Session Security Engine `[ ]`
- **Phase 3:** Core Authorization Engine (RBAC + ABAC Middleware, Capability Resolver) `[ ]`
- **Phase 4:** Core Employee Directory & Role Administration `[ ]`
- **Phase 5:** Core Platform Auditing (`Audit_Events`) & Notifications Engine `[ ]`
- **Phase 6:** BPMS Master Data Management (Verticals, SBUs, Clients, Locations) `[ ]`
- **Phase 7:** BPMS Staged Excel Migration & Ingestion Pipeline `[ ]`
- **Phase 8:** BPMS Process Registry & Server-Side AG Grid Engine `[ ]`
- **Phase 9:** BPMS Process Detail & Unified Process Management View `[ ]`
- **Phase 10:** BPMS Change Request Engine & Approval Workflow `[ ]`
- **Phase 11:** BPMS Scenario-Driven PM Handover Workflow `[ ]`
- **Phase 12:** BPMS Process Closure & Lifecycle Deactivation Workflow `[ ]`
- **Phase 13:** Platform Hardening, Offboarding Safeguards, Dashboard & E2E Validation `[ ]`

When executing any phase:
1. Always maintain zero lint errors (`npm.cmd run lint`, `npm.cmd run oxlint`).
2. Always maintain zero build breaks (`npm.cmd run build --workspaces --if-present`).
3. Follow `.agents/rules/git-commit.md` for conventional, informative commits with explicit staging paths.
