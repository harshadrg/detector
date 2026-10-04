# Detector Enterprise Platform — Refinement Roadmap

This document serves as the single source of truth for the ongoing UI/UX and backend refinement of the Detector Superadmin platform. It builds upon the initial 14-phase roadmap and addresses discovered architectural gaps.

## 1. Verified System Anomalies

During the comprehensive codebase audit, the following critical bugs and structural gaps were identified:

### A. Critical Execution Failures
1. **Broken Audit Logging:** `AuditService` exports `log()`, but multiple BPMS services (`change-request`, `handover`, `import`, `process`) call `auditService.logEvent()`. This guarantees runtime crashes on core mutations.
2. **Handover SQL Errors:** The handover service uses incorrect column names (`ecode` instead of `employee_ecode`) and invalid role constraints (`PROJECT_MANAGER` instead of `PM`) in its raw SQL queries.
3. **Missing NOT NULL Columns:** Handover `INSERT` operations into `Process_Ownership` omit required `assigned_by` and `source_type` columns.

### B. Transaction & Concurrency Hazards
1. **Role Assignment Vulnerability:** `assignRole` in `employee.controller.js` executes multi-table writes without a transaction wrapper.
2. **Import Staging Gap:** `stageExcelUpload` in `import.service.js` writes to batch and staging tables without transaction safety.
3. **Sequence Collisions:** `process.service.js` and `import.service.js` compute max process sequence codes outside of transactional boundaries, risking collisions during concurrent creation.

### C. Validation & Security Gaps
1. **Missing Zod Schemas:** BPMS controllers bypass payload validation entirely, unlike the Core platform endpoints.
2. **Inconsistent Error Routing:** `master.controller.js` returns `400 Bad Request` instead of `409 Conflict` or `500 Internal Server Error` on database constraint violations.
3. **No Rate Limiting:** `express-rate-limit` is installed but omitted from the Express configuration.

---

## 2. Step-by-Step Implementation Plan

The following phases must be executed sequentially. **Do not proceed to the next step without explicit approval.**

### [x] Phase 1: Core Runtime Stability
* **Objective:** Prevent backend crashes on essential operational routes.
* **Tasks:**
  - Introduce `logEvent(params, transaction)` alias in `AuditService` to prevent BPMS service crashes.
  - Correct the SQL column names (`ecode` -> `employee_ecode`) and role values (`PROJECT_MANAGER` -> `PM`) in `handover.service.js`.
  - Add missing `assigned_by` (using acting user) and `source_type` (`'HANDOVER'`) values to the handover insert query.
* **Verification:** Ensure process creation, change requests, and handovers do not throw runtime TypeErrors or SQL constraint exceptions.

### [x] Phase 2: Transaction & Concurrency Hardening
* **Objective:** Ensure data integrity during multi-table writes and concurrent operations.
* **Tasks:**
  - Wrap `assignRole` in `employee.controller.js` within `executeTransaction`.
  - Wrap `stageExcelUpload` in `import.service.js` within `executeTransaction`.
  - Move `SELECT TOP 1 process_code` logic inside the transactional boundaries in `createProcess` and `commitBatch`.
* **Verification:** Deliberate failures mid-flight correctly rollback all table modifications.

### Phase 3: Zod Schema Enforcement
* **Objective:** Apply strict validation to all BPMS endpoints to match Core platform standards.
* **Tasks:**
  - Define missing schemas in `src/schemas/`: `process.schema.js`, `change-request.schema.js`, `handover.schema.js`, `import.schema.js`.
  - Apply validation layers to the corresponding BPMS controllers.
* **Verification:** Endpoints return HTTP `400 VALIDATION_ERROR` for malformed requests.

### Phase 4: Error Handling & Security Optimization
* **Objective:** Secure endpoints and return semantic HTTP status codes.
* **Tasks:**
  - Fix `catch` blocks in `master.controller.js` to return HTTP `409` (Conflict) for duplicates and `500` for other DB errors.
  - Implement `express-rate-limit` globally and strictly on `/api/core/auth/login`.
* **Verification:** Brute-force requests yield HTTP `429 Too Many Requests`. Duplicate master data yields HTTP `409`.

---

## 3. Pre-Flight Decisions Required
Before executing Phase 1, the following must be decided:
- **Role Alignment:** Do we update the `Roles` table to `'PM'` or keep it as `'PROJECT_MANAGER'` and map it in the services?
- **Rate Limits:** What are the exact thresholds for global vs. login routes?

*(End of Plan)*
