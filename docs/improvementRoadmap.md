# Detector Enterprise Platform - Improvement Roadmap

This document outlines the verified, implementation-ready improvement plan for the Detector platform. 

**Mandatory Security Rule (Option B - High-Risk Only):**
> *Any frontend action that results in a high-risk, destructive, or workflow-approval change (e.g., Bulk Excel Commits, Approving/Rejecting Change Requests or Handovers, Deactivating Employees, or Deactivating Master Data) MUST require password confirmation before the database change is committed. Standard single-record creations or drafts do not require password re-authentication.*

---

## Phase 1: Frontend Infrastructure & Dashboard Resilience
**Status:** [x] Completed

* **Objective:** Prevent full-application crashes caused by undefined data properties and correct dashboard queries to respect authorization scopes.
* **Current Behavior:** The frontend lacks React `ErrorBoundary` wrappers. Mismatches in API payloads (like in ReviewQueue) cause white-screen crashes. The dashboard fires queries unconditionally, causing 403 errors for unauthorized users, and incorrectly uses `hasCapability` (a row-level ABAC check) for the global "New Process" button. Pending metrics read the wrong JSON keys.
* **Affected Components:** `AppShell.jsx`, `OperationalOverview.jsx`
* **Dependencies:** None.
* **Security & Validation:** No password confirmation required.
* **Step-by-Step Actions:**
  - [x] **Step 1:** Create a reusable `ErrorBoundary` component in `apps/client/src/components/`.
  - [x] **Step 2:** Wrap major route sections (Dashboard, Master Data, Process Registry, Review Queue) with the `ErrorBoundary` in the router configuration.
  - [x] **Step 3:** Update `OperationalOverview.jsx` to map `reviews` and `handovers` instead of `pending_reviews` and `pending_handovers`.
  - [x] **Step 4:** Replace `hasCapability('BPMS.PROCESS.CREATE')` with `hasPermission('BPMS.PROCESS.CREATE')` in the Dashboard.
  - [x] **Step 5:** Wrap Dashboard `useQuery` calls with an `enabled: hasPermission(...)` flag to prevent unauthorized 403 API calls.
* **Verification Criteria:** Trigger a manual render error in a component and verify only that component section crashes, not the sidebar/app shell. Verify the dashboard metrics load correctly for an authorized user.

---

## Phase 2: Audit Ledger Logging Gaps & Export Engine
**Status:** [x] Completed

* **Objective:** Ensure all critical application lifecycle events are captured in the immutable ledger and build the missing backend export capabilities.
* **Current Behavior:** `auth.controller.js` does not log `LOGIN` events. `employee.controller.js` does not log Employee Creation, Update, or Deactivation. The backend lacks any export endpoints for audit logs, while the frontend displays a non-functional static `.csv` export button.
* **Affected Components:** `auth.controller.js`, `employee.controller.js`, `audit.routes.js`, `audit.service.js`, `AuditLedger.jsx`.
* **Dependencies:** None.
* **Security & Validation:** Audit routes remain guarded by `CORE.AUDIT.VIEW_GLOBAL` and `BPMS.AUDIT.VIEW`.
* **Step-by-Step Actions:**
  - [x] **Step 1:** Inject `auditService.logEvent` into `auth.controller.js` (for `LOGIN`) and `employee.controller.js` (for `CREATE`, `UPDATE`, `DEACTIVATE`).
  - [x] **Step 2:** Create a new `GET /api/core/audit/export` endpoint in `audit.routes.js` that accepts the exact same filter schema as the list endpoint.
  - [x] **Step 3:** Implement backend service logic to stream the filtered output into CSV, Excel (`write-excel-file`), and PDF formats.
  - [x] **Step 4:** In `AuditLedger.jsx`, remove the static export button from the header. Add an export dropdown next to the "Apply Filters" button, wired to the new backend endpoint.
  - [x] **Step 5:** Replace the static "Date Range" HTML with a functional date picker and map `startDate`/`endDate` to the backend filter.
* **Verification Criteria:** Deactivating an employee and logging in should produce visible records in the Audit Ledger. Exporting the ledger should download a valid file matching the current on-screen filters.

---

## Phase 3: Master Data Cascading Integrity & UI Overhaul
**Status:** [x] Completed

* **Objective:** Establish relational safety for master data, implement the missing Manage UI, and visualize the Vertical -> SBU hierarchy.
* **Current Behavior:** Master Data uses soft deletes (`is_active = 0`), but deactivating a Client or SBU leaves attached processes orphaned (no cascading checks). The UI presents Verticals and SBUs in disconnected tabs. Add/Filter/Edit actions are static mockups.
* **Affected Components:** `master.service.js`, `master.controller.js`, `MasterData.jsx`, `init.sql` (conceptually, for constraints).
* **Dependencies:** None.
* **Security & Validation:** **High-Risk Action:** Deactivating a Master Data entity via the new Manage modal must require password confirmation.
* **Step-by-Step Actions:**
  - [x] **Step 1:** **Backend:** Update `master.service.js` `listVerticals` and `listSBUs` to compute `COUNT(DISTINCT po.employee_ecode) AS employee_count`.
  - [x] **Step 2:** **Backend:** Create a detailed endpoint (`GET .../verticals/:id/employees`) to list assigned employees.
  - [x] **Step 3:** **Backend:** Implement a cascading validation check in the `updateX` endpoints: if `is_active = 0` is requested, verify no active processes depend on this entity. If they do, block the deactivation or require an explicit override flag.
  - [x] **Step 4:** **Frontend:** Redesign `MasterData.jsx` to show SBUs nested under their parent Verticals (e.g., using an accordion).
  - [x] **Step 5:** **Frontend:** Create `Add[Entity]Modal` components and wire them to the backend create endpoints.
  - [x] **Step 6:** **Frontend:** Replace the dummy "Edit" button with a "Manage" modal that shows details, the derived employee list, and allows toggling `is_active` (with password confirmation for deactivation).
  - [x] **Step 7:** **Frontend:** Remove the static "Export Schema" and "Sync All" buttons.
* **Verification Criteria:** Attempting to deactivate an SBU with active processes should be blocked or safely handled. The UI should display the nested relationship.

---

## Phase 4: Employee Directory Scoping & Security
**Status:** [x] Completed

* **Objective:** Secure employee visibility based on ownership connections and enforce password confirmation for account deactivation.
* **Current Behavior:** All employees are visible globally. Deactivation occurs instantly without password verification. A full "hierarchy view" was requested but is unsupported by the architecture (hierarchy only exists per-process).
* **Affected Components:** `employee.service.js`, `employee.controller.js`, `EmployeeDirectory.jsx`.
* **Dependencies:** None.
* **Security & Validation:** **High-Risk Action:** Employee deactivation requires password confirmation.
* **Step-by-Step Actions:**
  - [x] **Step 1:** **Backend:** Update `employee.controller.js` `updateEmployeeStatus`. If status is `INACTIVE`, require a `password` parameter, fetch the hash from `dbo.Employee_Identities`, and verify it before proceeding.
  - [x] **Step 2:** **Backend:** Update `listEmployees` to evaluate user roles. If not an Admin, inject a subquery to return only employees who co-own processes with the requester.
  - [x] **Step 3:** **Frontend:** Move the "Deactivate" action inside a new "Manage" modal.
  - [x] **Step 4:** **Frontend:** Add a password input challenge to the deactivation flow in the Manage modal.
  - [x] **Step 5:** **Frontend:** Since a global organizational tree doesn't exist, display a list of the employee's assigned processes in the Manage modal to represent their "hierarchy".
* **Verification Criteria:** Non-admins only see connected peers. Deactivating an employee requires a valid password.

---

## Phase 5: Process Registry Search & Validation Enhancements
**Status:** [ ] Pending

* **Objective:** Improve search precision, enforce role-based download limits, and fix the broken 5-tier ownership creation logic.
* **Current Behavior:** Search uses a massive 6-column `OR` block. You cannot search by PM. The "Register Process" form randomly fetches 100 employees without validating if they actually hold the required role (e.g., `SBU_HEAD`).
* **Affected Components:** `process.service.js`, `employee.service.js`, `ProcessRegistry.jsx`, `RegisterProcessModal.jsx`.
* **Dependencies:** None.
* **Security & Validation:** Form submission requires async `wps_code` validation and a final summary check, but no password (standard data entry). CSV/Excel downloads restricted to Admins; others get PDF.
* **Step-by-Step Actions:**
  - [ ] **Step 1:** **Backend:** Update `process.service.js` `listProcesses` to parse search prefixes (`wps:`, `code:`, `name:`, `pm:`). Implement specific targeted `WHERE` clauses for these to replace the broad `OR` search.
  - [ ] **Step 2:** **Backend:** Add a `role_code` filter to the `listEmployees` API so the frontend can query valid role holders.
  - [ ] **Step 3:** **Backend:** Enforce domain integrity in `createProcess`: validate that the submitted ecodes actively hold their respective roles in `Employee_Role_Mapping` before creating ownership records.
  - [ ] **Step 4:** **Frontend:** Update the Process Registry search placeholder to advertise prefixes.
  - [ ] **Frontend:** Restrict CSV/Excel download buttons based on the user's role payload (Admins only).
  - [ ] **Step 6:** **Frontend:** Expand `RegisterProcessModal.jsx` to capture all 5 ownership tiers using dynamic, searchable comboboxes filtered by role. Add a final summary confirmation screen before submission.
* **Verification Criteria:** Searching `pm:John` strictly returns processes managed by John. The creation modal only allows selecting true SBU Heads for the SBU Head field.

---

## Phase 6: BPMS Workflow Engine (Review Queue & Handovers)
**Status:** [ ] Pending

* **Objective:** Unify and fix the workflow execution interfaces, enforce approval security, and activate the notification engine for BPMS actions.
* **Current Behavior:** The Review Queue frontend expects a mapped object, but backend returns stringified JSON, causing crashes. Priority is a hardcoded UI illusion. Handovers lack a review UI, and Admins are forced to request handovers from themselves. No notifications are sent for approvals.
* **Affected Components:** `change-request.service.js`, `handover.service.js`, `ReviewQueue.jsx`, `PMHandovers.jsx` / `ProcessDetail.jsx`.
* **Dependencies:** Frontend Error Boundaries (Phase 1) should be in place.
* **Security & Validation:** **High-Risk Action:** Approving or Rejecting a Change Request or Handover MUST require password confirmation.
* **Step-by-Step Actions:**
  - [ ] **Step 1:** **Backend:** Update `listPendingReviews` to parse `proposed_data` JSON and generate the `diff` and `proposed_fields` objects expected by the frontend.
  - [ ] **Step 2:** **Backend:** Modify `handover.service.js` `requestHandover` to auto-execute (bypass `SUBMITTED`) if the requester is an Admin.
  - [ ] **Step 3:** **Backend:** Inject `notificationService.dispatch` into both services to notify requesters/target PMs upon submission, approval, and rejection.
  - [ ] **Step 4:** **Backend:** Update the review/approve endpoints for CRs and Handovers to accept and verify a `password`.
  - [ ] **Step 5:** **Frontend:** In `ReviewQueue.jsx`, remove all "Priority" UI elements. Update the data mapping to use `{cr.requested_by_name}` instead of `submitted_by`. Add password confirmation to the Approve/Reject flow.
  - [ ] **Step 6:** **Frontend:** Remove "PM Handovers" from the global application sidebar. Build the missing Review Handover modal and place handover initiation/review directly into the Process Registry / Process Detail views. Add password confirmation to the handover approval flow.
* **Verification Criteria:** Priority badges are gone. Approving a CR requires a password and sends a notification to the requester. Handovers can be approved from the Process Registry.

---

## Phase 7: Excel Import Pipeline Refinement
**Status:** [ ] Pending

* **Objective:** Prevent duplicate data ingestion by implementing a staging diff comparison, and secure the bulk import with password validation.
* **Current Behavior:** `commitBatch` blindly inserts all staged rows, causing duplicates. The final commit occurs instantly without user verification of the specific differences or password authentication.
* **Affected Components:** `import.service.js`, `import.controller.js`, `ExcelImport.jsx`, `init.sql` (staging table columns).
* **Dependencies:** Phase 2 (Audit Logging) ensures changes made during bulk updates are properly logged.
* **Security & Validation:** **High-Risk Action:** The final batch commit requires password confirmation.
* **Step-by-Step Actions:**
  - [ ] **Step 1:** **Database:** Add `match_status`, `existing_registry_id`, `diff_summary_json`, and `is_confirmed` to `dbo.Import_Staging_Rows`.
  - [ ] **Step 2:** **Backend:** Enhance `stageExcelUpload` to search `Process_Registry` for matches. Flag rows as `NEW`, `EXISTING_EXACT`, or `DIFFERENCE` (generating a JSON diff payload).
  - [ ] **Step 3:** **Backend:** Update `commitBatch` to require a `password` parameter (validate via `verifyPassword`). Process only explicitly confirmed rows (inserting `NEW`, updating `DIFFERENCE` while emitting audit events).
  - [ ] **Step 4:** **Frontend:** In `ExcelImport.jsx`, build a "Check/Compare" view showing grouped rows (New, Existing, Differences). Allow users to explicitly select which rows to commit.
  - [ ] **Step 5:** **Frontend:** Intercept the final submit button to display a Security Confirmation Modal, requiring the user's password before sending the payload.
* **Verification Criteria:** Re-uploading the exact same Excel sheet results in all rows being flagged as `EXISTING_EXACT` with no duplicates created. The final commit prompts for a password and correctly executes updates.
