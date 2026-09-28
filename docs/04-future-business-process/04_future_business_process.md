# 04 — Future-State Business Processes (Detector Target Workflows)

## 1. Phase 1: Platform Bootstrap
1. System is initialized with a single `SUPER_ADMIN` employee account.
2. `SUPER_ADMIN` logs in and provisions:
   - **Employee Master Roster** (`ecode`, `name`, `email`, `status`).
   - **Role Assignments:** Maps `BPMS_ADMIN` (Administrative Role) and organizational roles (`OPS_QUALITY_HEAD`, `CBO`, `SBU_HEAD`, `ACCOUNT_HEAD`, `PROJECT_MANAGER`).

---

## 2. Phase 2: Staged Initial Excel Migration (Baseline)
Instead of writing raw Excel rows directly into live tables, `BPMS_ADMIN` uses a **Staged Import Pipeline**:

    Upload .xlsx
        ↓
    Create Import_Batch + Import_Staging_Rows
        ↓
    Automated Validation & Normalization Engine
      • Normalizes "Domestic_Client" -> "DOMESTIC", "TECH&_DIGITAL" -> "TECH&DIGITAL"
      • Extracts sentinel strings ("PO_NOT_RAISED", "BUSINESS_CLOSED", "-") into status/reason notes
      • Checks that all referenced employee names exist and are ACTIVE in Employees
        ↓
    Preview & Error Report UI
      • Shows valid rows vs. rows with missing employees or invalid SBUs
        ↓
    Admin Approves & Commits Batch
      • Creates canonical Process_Registry rows (with system-generated process_code PRC-XXXX)
      • Creates initial Process_Ownership records (effective_from = migration_date, source = 'INITIAL_MIGRATION')
      • Emits immutable Audit_Events

**Outcome:** Excel ceases to be the operational system of record. Detector becomes the single source of truth.

---

## 3. Phase 3: The Unified Change Request Engine
All subsequent changes follow a unified governance pipeline (`Request → Validation → Approval → Execution → Ownership History + Audit + Notification`) across three business operations:

### Operation A: Process Detail Completion / Update (`CHANGE_REQUEST`)
1. Assigned `PROJECT_MANAGER` opens a process row created during migration (where Client, Process Name, WPS Code, Location, and Dates are missing or need updating).
2. PM saves a `DRAFT` or submits (`SUBMITTED`) a `Process_Change_Request` containing the proposed field values.
3. The canonical `Process_Registry` record remains untouched while the request is pending.
4. `BPMS_ADMIN` reviews the diff:
   - **If Approved:** Proposed values are written to `Process_Registry`, `Audit_Events` logs the before/after snapshot, and the PM is notified.
   - **If Rejected:** Mandatory `review_remarks` are recorded, the request transitions to `REJECTED`, and the PM is notified to revise and resubmit.

### Operation B: Scenario-Driven PM Handover (`HANDOVER`)
1. Initiated by the current `PROJECT_MANAGER`, the process's `ACCOUNT_HEAD` / `SBU_HEAD`, or `BPMS_ADMIN`.
2. Requester specifies:
   - `to_pm_ecode` (must be an `ACTIVE` employee holding the `PROJECT_MANAGER` role)
   - `scenario` (`PM_MOVED_PROJECT`, `PM_ROLE_CHANGE`, `PM_LEFT_COMPANY`, `TEMPORARY_HANDOVER`, `ESCALATION`, `ADMIN_OVERRIDE`)
   - `effective_date` and `reason`.
3. Upon `BPMS_ADMIN` approval:
   - Outgoing PM's `Process_Ownership` row is closed (`effective_to = SYSUTCDATETIME()`, `is_current = 0`).
   - Incoming PM's `Process_Ownership` row is opened (`effective_from = SYSUTCDATETIME()`, `is_current = 1`).
   - **Zero Standing Privileges Check:** If the outgoing PM now has 0 active `PM` ownership records across all active processes, their `PROJECT_MANAGER` role is automatically revoked.

### Operation C: Process End / Deactivation (`PROCESS_END`)
1. `PROJECT_MANAGER` or `ACCOUNT_HEAD` submits a deactivation request with `ended_on` date and closure reason.
2. `BPMS_ADMIN` approves the closure.
3. `Process_Registry.status` transitions to `INACTIVE`, ownership history is preserved intact (never overwritten with `BUSINESS_CLOSED`), and an `Audit_Event` is recorded.

---

## 4. Phase 4: Employee Offboarding / Deactivation Safeguard
When `SUPER_ADMIN` attempts to set an employee's status to `INACTIVE`:
1. System checks `Process_Ownership` for any `is_current = 1` assignments on `ACTIVE` or `TRANSITION` processes.
2. If active assignments exist, the system flags the affected processes, revokes active sessions immediately, and creates high-priority handover alerts for `BPMS_ADMIN` and the respective `ACCOUNT_HEAD`.