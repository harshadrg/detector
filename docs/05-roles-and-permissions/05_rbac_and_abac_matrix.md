# 05 — Authorization Model: RBAC + ABAC & Role Matrix

## 1. Separation of Administrative Authority vs. Organizational Hierarchy
Detector strictly separates system governance from business hierarchy:
- **Platform Admin (`PLATFORM_ADMIN`):** `SUPER_ADMIN` — Governs Core platform modules, employees, admin role mappings, and global audit logs.
- **Module Admin (`MODULE_ADMIN`):** `BPMS_ADMIN` — Governs the BPMS module, imports, approvals, and BPMS organizational role mappings.
- **Organizational Hierarchy (`ORGANIZATIONAL`):** `OPS_QUALITY_HEAD`, `CBO`, `SBU_HEAD`, `ACCOUNT_HEAD`, `PROJECT_MANAGER` — Operate on business processes within their assigned ownership scope.

An employee can hold multiple roles simultaneously (e.g., `ACCOUNT_HEAD` + `PROJECT_MANAGER` on 52 rows in `DummyData.xlsx`, or `CBO` + `SUPER_ADMIN`).

---

## 2. Role × Permission × ABAC Scope Matrix

**ABAC Scopes:**
- `GLOBAL`: All records in the module/platform.
- `OWN_HIERARCHY`: Processes where `current_user.ecode` has an active row (`is_current = 1`) in `Process_Ownership` for any hierarchy role (`OPS_QUALITY_HEAD`, `CBO`, `SBU_HEAD`, `ACCOUNT_HEAD`, `PM`).
- `OWN_PROCESS`: Processes where `current_user.ecode` is the current `PM` (`role_type = 'PM' AND is_current = 1`) in `Process_Ownership`.
- `SELF`: Only records addressed to or created by `current_user.ecode`.

| Permission Code | `SUPER_ADMIN` | `BPMS_ADMIN` | `OPS_QUALITY_HEAD` | `CBO` | `SBU_HEAD` | `ACCOUNT_HEAD` | `PROJECT_MANAGER` |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| `CORE.USER.VIEW` | `GLOBAL` | `GLOBAL` | `OWN_HIERARCHY` | `OWN_HIERARCHY` | `OWN_HIERARCHY` | `OWN_HIERARCHY` | Denied |
| `CORE.USER.MANAGE` | `GLOBAL` | Denied | Denied | Denied | Denied | Denied | Denied |
| `CORE.ROLE.ASSIGN_ADMIN` | `GLOBAL` | Denied | Denied | Denied | Denied | Denied | Denied |
| `CORE.ROLE.ASSIGN_ORG` | `GLOBAL` | `GLOBAL` (BPMS) | Denied | Denied | Denied | Denied | Denied |
| `CORE.CONTEXT.SWITCH` | `GLOBAL` | Denied | Denied | Denied | Denied | Denied | Denied |
| `CORE.AUDIT.VIEW_GLOBAL` | `GLOBAL` | Denied | Denied | Denied | Denied | Denied | Denied |
| `CORE.NOTIFICATION.VIEW` | `SELF` | `SELF` | `SELF` | `SELF` | `SELF` | `SELF` | `SELF` |
| `BPMS.PROCESS.VIEW` | `GLOBAL` | `GLOBAL` | `OWN_HIERARCHY` | `OWN_HIERARCHY` | `OWN_HIERARCHY` | `OWN_HIERARCHY` | `OWN_PROCESS` |
| `BPMS.PROCESS.CREATE` | `GLOBAL` | `GLOBAL` | Denied | Denied | Denied | Denied | Denied |
| `BPMS.CHANGE_REQUEST.DRAFT` | `GLOBAL` | `GLOBAL` | Denied | Denied | Denied | Denied* | `OWN_PROCESS` |
| `BPMS.CHANGE_REQUEST.SUBMIT` | `GLOBAL` | `GLOBAL` | Denied | Denied | Denied | Denied* | `OWN_PROCESS` |
| `BPMS.CHANGE_REQUEST.APPROVE` | `GLOBAL` | `GLOBAL` | Denied | Denied | Denied | Denied | Denied |
| `BPMS.CHANGE_REQUEST.REJECT` | `GLOBAL` | `GLOBAL` | Denied | Denied | Denied | Denied | Denied |
| `BPMS.HANDOVER.REQUEST` | `GLOBAL` | `GLOBAL` | Denied | Denied | `OWN_HIERARCHY` | `OWN_HIERARCHY` | `OWN_PROCESS` |
| `BPMS.HANDOVER.APPROVE` | `GLOBAL` | `GLOBAL` | Denied | Denied | Denied | Denied | Denied |
| `BPMS.PROCESS.DEACTIVATE_REQUEST` | `GLOBAL` | `GLOBAL` | Denied | Denied | `OWN_HIERARCHY` | `OWN_HIERARCHY` | `OWN_PROCESS` |
| `BPMS.PROCESS.DEACTIVATE_APPROVE` | `GLOBAL` | `GLOBAL` | Denied | Denied | Denied | Denied | Denied |
| `BPMS.IMPORT.STAGE` | `GLOBAL` | `GLOBAL` | Denied | Denied | Denied | Denied | Denied |
| `BPMS.IMPORT.COMMIT` | `GLOBAL` | `GLOBAL` | Denied | Denied | Denied | Denied | Denied |
| `BPMS.AUDIT.VIEW` | `GLOBAL` | `GLOBAL` | `OWN_HIERARCHY` | `OWN_HIERARCHY` | `OWN_HIERARCHY` | `OWN_HIERARCHY` | `OWN_PROCESS` |

*Note on Dual-Hatting:* When an `ACCOUNT_HEAD` is also the assigned `PM` on a process, they hold both `ACCOUNT_HEAD` and `PROJECT_MANAGER` roles and therefore have `OWN_PROCESS` capability to draft/submit changes on that specific process.

---

## 3. Centralized AuthorizationService & UI Context Switching
1. **Evaluation Order:**
   - Check `Employees.status === 'ACTIVE'` (immediately reject `INACTIVE` users even if their JWT has not expired).
   - Check RBAC (`hasPermission(user, permissionCode)`).
   - Check ABAC (`evaluatePolicy(user, permissionCode, resource)`).
2. **Row-Level Capability Resolution:**
   - Every process object returned by the API includes a computed `capabilities` array (e.g., `["BPMS.PROCESS.VIEW", "BPMS.CHANGE_REQUEST.SUBMIT", "BPMS.HANDOVER.REQUEST"]`) so the React UI never hardcodes role names.
3. **Safe UI Context Switcher (`CORE.CONTEXT.SWITCH`):**
   - Allows `SUPER_ADMIN` to preview the UI filtered to a specific role's permissions (`X-UI-Context-Role: BPMS_ADMIN`), while the backend always authenticates and records `performed_by` using the real `SUPER_ADMIN` identity and logs `acting_context` in `Audit_Events`.