# Detector Enterprise Platform

**Detector** is a modular, air-gapped internal enterprise platform built as a clean JavaScript monorepo (`detector-client` and `detector-server`). It unifies corporate identity, capability-driven authorization (RBAC + ABAC), system notifications, and immutable platform-wide audit logging under a single foundation, serving pluggable business operational modules.

The primary operational module hosted on Detector Core is **BPMS (Business Process Management System)**, which migrates legacy spreadsheet-driven process tracking into an audited, capability-driven, and non-destructive management workflow.

---

## Architecture Overview

Detector enforces a strict architectural boundary between platform core services and operational business modules:

- **Detector Core (`core`):**
  - **Corporate Identity & Auth:** Secure session management (HttpOnly cookies, JWT, token invalidation).
  - **Capability-Driven Authorization:** Strict decoupling of administrative roles (`SUPER_ADMIN`, `BPMS_ADMIN`) from corporate hierarchy roles (`OPS_QUALITY_HEAD`, `CBO`, `SBU_HEAD`, `ACCOUNT_HEAD`, `PROJECT_MANAGER`). Resolves row-level capabilities so the frontend shell has zero hardcoded role checks.
  - **Employee Directory:** Centralized employee master roster with assignment governance and offboarding safeguards.
  - **Notifications Engine:** Polymorphic alerting dispatched across entities and modules.
  - **Audit Ledger (`Audit_Events`):** Immutable platform-wide event ledger with database-level immutability triggers.

- **Pluggable Modules (`modules/*`):**
  - **BPMS Module:** Business process registry, multi-level hierarchy ownership tracking, staged Excel ingestion pipeline, unified change request engine, and scenario-driven PM handovers.
  - **Future Enterprise Modules:** Additional operational workflows (such as FMEA, Compliance, Asset Management) plug directly into Core services without schema modifications to Core.

---

## Workspace Structure

The project is structured as an npm workspaces monorepo:

- **`apps/client` (`detector-client`):** Enterprise React single-page application built with React 19, Vite 8, React Compiler, Tailwind CSS v4, React Router, TanStack Query, AG Grid Community, React Hook Form, Zod, and Lucide Icons.
- **`apps/server` (`detector-server`):** Node.js ES Modules REST API powered by Express 5, Microsoft SQL Server (`mssql` with parameterized T-SQL; zero ORMs), `multer`, and `read-excel-file`.
- **`packages/`:** Reserved workspace for shared libraries and utility packages.
- **`docs/`:** Master technical specifications, data dictionary, business workflows, state machines, database schema ERDs, API contracts, and Architecture Decision Records (ADRs).

---

## Operating Governance & Documentation

All engineering sessions follow strict phase-gated execution and architectural boundaries:
- **Operating Rules & Guidelines:** See [`AGENTS.md`](file:///f:/projects/detector/AGENTS.md).
- **Master Implementation Roadmap:** See [`docs/ROADMAP.md`](file:///f:/projects/detector/docs/ROADMAP.md) for the 14-phase schedule (Phases 0 through 13).
- **Architecture Decision Records:** See [`docs/decisions`](file:///f:/projects/detector/docs/decisions).

---

## Development Setup

### Prerequisites
- Node.js `>= 22.22.0`
- npm `>= 11.0.0`

### Commands
```bash
# Run both client and server development servers
npm run dev

# Run client only (http://localhost:5173)
npm run dev:client

# Run server only (http://localhost:5000)
npm run dev:server

# Run linting across the monorepo
npm run lint

# Run fast AST lint checks via Oxlint
npm run oxlint

# Production build across workspaces
npm run build
```