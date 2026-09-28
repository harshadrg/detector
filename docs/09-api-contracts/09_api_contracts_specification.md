# 09 — REST API Contracts & Security Boundaries

## 1. Standard JSON Response Envelope
Every endpoint returns a deterministic JSON envelope:

    // Success Response (200 / 201)
    {
      "success": true,
      "data": {},
      "meta": { "page": 1, "pageSize": 25, "totalCount": 266 },
      "error": null
    }

    // Error Response (4xx / 5xx)
    {
      "success": false,
      "data": null,
      "error": {
        "code": "VALIDATION_ERROR",
        "message": "Review remarks are required when rejecting a change request.",
        "details": []
      }
    }

---

## 2. Core Platform Endpoints (`/api/core`)

| Method | Path | Permission Required | Purpose |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/core/auth/login` | Public | Authenticates `ecode` + `password`; verifies `Employees.status === 'ACTIVE'`; sets `HttpOnly`, `SameSite=Strict` JWT cookie + CSRF token. |
| `POST` | `/api/core/auth/logout` | Authenticated | Increments `token_version` and clears session cookie. |
| `GET` | `/api/core/auth/me` | Authenticated | Hydrates current user profile, assigned roles, effective permissions, and active UI context. |
| `GET` | `/api/core/employees` | `CORE.USER.VIEW` | Paginated employee list with assigned roles and status. |
| `POST` | `/api/core/employees` | `CORE.USER.MANAGE` | Creates or updates an employee record. |
| `PATCH` | `/api/core/employees/:ecode/status` | `CORE.USER.MANAGE` | Sets `ACTIVE`/`INACTIVE`; triggers active-process handover alerts if `INACTIVE`. |
| `POST` | `/api/core/rbac/assign-role` | `CORE.ROLE.ASSIGN_ORG` or `CORE.ROLE.ASSIGN_ADMIN` | Assigns or revokes a role while enforcing category boundaries. |
| `GET` | `/api/core/notifications` | `CORE.NOTIFICATION.VIEW` | Lists unread/recent notifications for `req.user.ecode`. |
| `PATCH` | `/api/core/notifications/:id/read` | `CORE.NOTIFICATION.VIEW` | Marks notification as read. |
| `GET` | `/api/core/audit` | `CORE.AUDIT.VIEW_GLOBAL` | Paginated platform audit events. |

---

## 3. BPMS Module Endpoints (`/api/modules/bpms`)

| Method | Path | Permission Required | Purpose |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/modules/bpms/imports/stage` | `BPMS.IMPORT.STAGE` | Multipart `.xlsx` upload -> Parses via `read-excel-file` -> Creates `Import_Batch` + `Import_Staging_Rows` -> Returns validation summary. |
| `GET` | `/api/modules/bpms/imports/:batchId` | `BPMS.IMPORT.STAGE` | Returns staged rows, normalization preview, and row-level validation errors. |
| `POST` | `/api/modules/bpms/imports/:batchId/commit` | `BPMS.IMPORT.COMMIT` | Commits valid staged rows into `Process_Registry` and `Process_Ownership` inside a transaction. |
| `GET` | `/api/modules/bpms/processes` | `BPMS.PROCESS.VIEW` | Server-side paginated/filtered process list. Scoped by ABAC (`GLOBAL`, `OWN_HIERARCHY`, `OWN_PROCESS`) and enriched with row `capabilities`. |
| `GET` | `/api/modules/bpms/processes/:id` | `BPMS.PROCESS.VIEW` | Returns process details, current ownership across all 5 hierarchy levels, active change request, and row `capabilities`. |
| `GET` | `/api/modules/bpms/processes/:id/ownership-history` | `BPMS.PROCESS.VIEW` | Returns chronological `Process_Ownership` timeline (Q1–Q4 effective dates). |
| `POST` | `/api/modules/bpms/processes/:id/change-requests` | `BPMS.CHANGE_REQUEST.DRAFT` or `SUBMIT` | Creates/updates/submits a `Process_Change_Request` (validates `version_num` concurrency). |
| `POST` | `/api/modules/bpms/change-requests/:crId/review` | `BPMS.CHANGE_REQUEST.APPROVE` or `REJECT` | Approves or rejects a pending change request; applies changes to `Process_Registry` if approved. |
| `POST` | `/api/modules/bpms/processes/:id/handovers` | `BPMS.HANDOVER.REQUEST` | Submits a scenario-driven `Process_Handover_Request`. |
| `POST` | `/api/modules/bpms/handovers/:handoverId/review` | `BPMS.HANDOVER.APPROVE` | Approves or rejects handover; closes old PM ownership, opens new PM ownership, and evaluates automated PM role revocation. |