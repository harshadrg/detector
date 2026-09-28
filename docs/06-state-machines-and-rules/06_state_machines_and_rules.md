# 06 — State Machines & Core Business Invariants

## 1. Process Lifecycle State Machine (Process_Registry.status)

              ┌────────────┐
              │   DRAFT    │
              └─────┬──────┘
                    │
           ┌────────┴────────┐
           ▼                 ▼
    ┌────────────┐    ┌────────────┐
    │ TRANSITION │───►│   ACTIVE   │
    └─────┬──────┘    └─────┬──────┘
          │                 │
          └────────┬────────┘
                   ▼
            ┌────────────┐
            │  INACTIVE  │ (Closed)
            └─────┬──────┘
                  ▼
            ┌────────────┐
            │  ARCHIVED  │
            └────────────┘

| From State | To State | Trigger | Guard Conditions |
| :--- | :--- | :--- | :--- |
| `NONE` | `TRANSITION` / `ACTIVE` / `INACTIVE` | Initial Staged Excel Import Commit | Batch passes validation; `BPMS_ADMIN` commits batch. |
| `DRAFT` / `TRANSITION` | `ACTIVE` | Approved `Process_Change_Request` | `client_id`, `process_name`, `wps_code`, `location_id`, `started_on`, and active `PM` must all be non-null. |
| `TRANSITION` / `ACTIVE` | `INACTIVE` | Approved `PROCESS_END` Request | `ended_on` date and closure remarks provided; approved by `BPMS_ADMIN`. |
| `INACTIVE` | `ARCHIVED` | Admin Archive Action | Process has been `INACTIVE` with no pending requests. |

---

## 2. Change Request State Machine (Process_Change_Requests.status)

    ┌─────────┐   Submit    ┌───────────┐   Open Review   ┌──────────────┐
    │  DRAFT  │────────────►│ SUBMITTED │────────────────►│ UNDER_REVIEW │
    └────▲────┘             └─────┬─────┘                 └──────┬───────┘
         │                        │                              │
         │ Edit        Cancel     ▼                  ┌───────────┴───────────┐
         │             ┌─────────────┐               ▼                       ▼
         │             │  CANCELLED  │        ┌────────────┐          ┌────────────┐
         │             └─────────────┘        │  APPROVED  │          │  REJECTED  │
         └────────────────────────────────────┴────────────┘          └──────┬─────┘
                                                                             │
                                               (PM Revises & Resubmits) ─────┘

- **Concurrency Lock Rule:** A process can have at most **one** active (`DRAFT`, `SUBMITTED`, or `UNDER_REVIEW`) `Process_Change_Request` at a time.
- **Non-Destructive Rule:** Rejecting a `Process_Change_Request` leaves `Process_Registry` untouched in its previously approved state.

---

## 3. PM Handover State Machine (Process_Handover_Requests.status)

    SUBMITTED ──► UNDER_REVIEW ──┬──► APPROVED ──► EXECUTED
                                 └──► REJECTED

- When `APPROVED`, the database transaction atomically:
  1. Sets `is_current = 0, effective_to = SYSUTCDATETIME()` on the old PM's `Process_Ownership` row.
  2. Inserts `is_current = 1, effective_from = SYSUTCDATETIME()` for the new PM in `Process_Ownership`.
  3. Marks handover status `EXECUTED`.
  4. Checks if the old PM has 0 remaining `is_current = 1` PM rows on `ACTIVE`/`TRANSITION` processes; if 0, revokes `PROJECT_MANAGER` from `Employee_Role_Mapping`.
  5. Writes an immutable `Audit_Event` and sends `Notifications`.

---

## 4. Import Batch State Machine (Import_Batches.status)

    UPLOADED ──► VALIDATING ──┬──► VALIDATED_WITH_ERRORS (Cannot commit until resolved/filtered)
                              └──► READY_TO_COMMIT ──► COMMITTED

---

## 5. Core Business Invariants
1. **Optimistic Concurrency Control:** Mutable tables (`Process_Registry`, `Process_Change_Requests`) carry a version counter (`version_num`). Updates with a stale version return `409 Conflict`.
2. **Separation of Duties:** `reviewed_by` cannot equal `requested_by` unless `SUPER_ADMIN` exercises an explicit audited override.
3. **WPS vs. WBS Naming Resolution:** `wps_code` is the canonical process-location identifier in `Process_Registry`. No `wbs_code` column is placed on `Employees`.