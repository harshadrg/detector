# 07 — User Flows & Capability-Driven Screen Map

## 1. Shared Application Shell Architecture
Detector uses a **single unified layout shell** (`Sidebar + Topbar + Context Bar + Main Content Area`). Navigation links, page access, and row buttons are rendered strictly from the user's `permissions` and row-level `capabilities`.

    ┌────────────────────────────────────────────────────────────────────────────┐
    │ DETECTOR PLATFORM          [Role Context: Real / Switch ▼]   Alerts  User  │
    ├────────────────────┬───────────────────────────────────────────────────────┤
    │ • Dashboard        │  Page Header + Primary Capability Actions             │
    │ • Process Registry │  ───────────────────────────────────────────────────  │
    │ • My Submissions   │  Filters: [Search] [Vertical ▼] [SBU ▼] [Status ▼]    │
    │ • Review Queue     │  ┌─────────────────────────────────────────────────┐  │
    │ • PM Handovers     │  │ AG Grid (Server-Side Paginated / Filtered)      │  │
    │ • Excel Import     │  └─────────────────────────────────────────────────┘  │
    │ • Employees & RBAC │                                                       │
    │ • Audit Explorer   │                                                       │
    └────────────────────┴───────────────────────────────────────────────────────┘

---

## 2. Screen Inventory & Required Permissions

| Screen / Route | Required Permission | Primary Features & Actions |
| :--- | :--- | :--- |
| `/login` | Public | Corporate `ecode` + password login; redirects authenticated users to `/dashboard`. |
| `/dashboard` | Authenticated | Actionable operational metrics scoped to user: Active Processes, Pending Form Completions, Pending Admin Reviews, Pending Handovers, Recent Audit Activity. |
| `/bpms/processes` | `BPMS.PROCESS.VIEW` | AG Grid table of `Process_Registry` + current `Process_Ownership`. Server-side filtering by Vertical, SBU, Status, Pending Changes, and Search. |
| `/bpms/processes/:id` | `BPMS.PROCESS.VIEW` | **Unified Process Detail & Manage Page:** Tab 1: Canonical Process Details & Current Hierarchy; Tab 2: Draft / Submit Change Request Form (`BPMS.CHANGE_REQUEST.DRAFT`/`SUBMIT`); Tab 3: Ownership History Timeline (Q1–Q4 effective dates); Tab 4: Process Audit Trail (`BPMS.AUDIT.VIEW`); Action Modals: Request Handover (`BPMS.HANDOVER.REQUEST`), Request Deactivation (`BPMS.PROCESS.DEACTIVATE_REQUEST`). |
| `/bpms/reviews` | `BPMS.CHANGE_REQUEST.APPROVE` | Side-by-side before/after diff viewer for `SUBMITTED` change requests and deactivation requests with **Approve** and **Reject (with mandatory remarks)** actions. |
| `/bpms/handovers` | `BPMS.HANDOVER.REQUEST` or `BPMS.HANDOVER.APPROVE` | List of initiated/pending PM handovers, scenario badges, and approval actions for `BPMS_ADMIN`. |
| `/bpms/imports` | `BPMS.IMPORT.STAGE` | Drag-and-drop `.xlsx` uploader, Staging table preview, Row-level validation warnings/errors, and **Commit Validated Batch** (`BPMS.IMPORT.COMMIT`). |
| `/core/employees` | `CORE.USER.VIEW` | Employee roster, status toggle (`CORE.USER.MANAGE`), and Role Assignment modal (`CORE.ROLE.ASSIGN_ORG` / `CORE.ROLE.ASSIGN_ADMIN`). |
| `/core/audit` | `CORE.AUDIT.VIEW_GLOBAL` or `BPMS.AUDIT.VIEW` | Immutable audit log viewer with JSON diff inspection and correlation ID filtering. |