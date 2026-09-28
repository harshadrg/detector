# 08 — Revised Database Architecture & ERD Specification (Detector_DB)

## 1. Domain-Separated Schema Overview

    CORE PLATFORM TABLES               MASTER TABLES              BPMS MODULE TABLES
    ────────────────────               ─────────────              ──────────────────
    • Employees                        • Verticals                • Process_Registry
    • Employee_Identities              • SBUs                     • Process_Ownership
    • System_Modules                   • Clients                  • Process_Change_Requests
    • Roles                            • Locations                • Process_Handover_Requests
    • Permissions                                                 • Import_Batches
    • Role_Permissions                                            • Import_Staging_Rows
    • Employee_Role_Mapping
    • Notifications
    • Audit_Events (Append-Only)

---

## 2. Table Specifications

### A. Core Platform Tables (`CORE`)

#### 1. `Employees`
- `ecode` `VARCHAR(20) PRIMARY KEY`
- `name` `NVARCHAR(100) NOT NULL`
- `email` `VARCHAR(150) NOT NULL UNIQUE`
- `status` `VARCHAR(20) NOT NULL DEFAULT 'ACTIVE'` (`ACTIVE`, `INACTIVE`)
- `created_at` `DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()`
- `updated_at` `DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()`

#### 2. `Employee_Identities`
- `identity_id` `INT IDENTITY(1,1) PRIMARY KEY`
- `ecode` `VARCHAR(20) NOT NULL UNIQUE FOREIGN KEY REFERENCES Employees(ecode)`
- `password_hash` `VARCHAR(255) NOT NULL`
- `token_version` `INT NOT NULL DEFAULT 1` *(Incremented on logout/deactivation to immediately invalidate old JWTs)*
- `last_login_at` `DATETIME2 NULL`

#### 3. `System_Modules`
- `module_id` `INT IDENTITY(1,1) PRIMARY KEY`
- `module_code` `VARCHAR(30) NOT NULL UNIQUE` (`CORE`, `BPMS`)
- `module_name` `VARCHAR(100) NOT NULL`
- `is_active` `BIT NOT NULL DEFAULT 1`

#### 4. `Roles`
- `role_id` `INT IDENTITY(1,1) PRIMARY KEY`
- `role_code` `VARCHAR(50) NOT NULL UNIQUE` (`SUPER_ADMIN`, `BPMS_ADMIN`, `OPS_QUALITY_HEAD`, `CBO`, `SBU_HEAD`, `ACCOUNT_HEAD`, `PROJECT_MANAGER`)
- `role_name` `VARCHAR(100) NOT NULL`
- `role_category` `VARCHAR(30) NOT NULL` (`PLATFORM_ADMIN`, `MODULE_ADMIN`, `ORGANIZATIONAL`)
- `module_id` `INT NOT NULL FOREIGN KEY REFERENCES System_Modules(module_id)`
- `is_system_default` `BIT NOT NULL DEFAULT 0`
- `is_active` `BIT NOT NULL DEFAULT 1`

#### 5. `Permissions` & `Role_Permissions` & `Employee_Role_Mapping`
- `Permissions`: `permission_id` (PK), `module_id` (FK), `permission_code` (`VARCHAR(100) UNIQUE`), `description`.
- `Role_Permissions`: Composite PK `(role_id, permission_id)`.
- `Employee_Role_Mapping`: Composite PK `(ecode, role_id)`, plus `assigned_by` (`FK Employees`), `assigned_at` (`DATETIME2`).

#### 6. `Notifications`
- `notification_id` `BIGINT IDENTITY(1,1) PRIMARY KEY`
- `recipient_ecode` `VARCHAR(20) NOT NULL FOREIGN KEY REFERENCES Employees(ecode)`
- `sender_ecode` `VARCHAR(20) NULL FOREIGN KEY REFERENCES Employees(ecode)` *(Nullable for SYSTEM alerts)*
- `notification_type` `VARCHAR(50) NOT NULL`
- `entity_type` `VARCHAR(50) NOT NULL` (`PROCESS`, `CHANGE_REQUEST`, `HANDOVER`, `IMPORT_BATCH`)
- `entity_id` `VARCHAR(50) NOT NULL`
- `message` `NVARCHAR(500) NOT NULL`
- `action_url` `VARCHAR(255) NULL`
- `is_read` `BIT NOT NULL DEFAULT 0`
- `read_at` `DATETIME2 NULL`
- `created_at` `DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()`

#### 7. `Audit_Events` (Immutable Platform Ledger)
- `event_id` `BIGINT IDENTITY(1,1) PRIMARY KEY`
- `module_code` `VARCHAR(30) NOT NULL`
- `entity_type` `VARCHAR(50) NOT NULL`
- `entity_id` `VARCHAR(50) NOT NULL`
- `action` `VARCHAR(100) NOT NULL`
- `performed_by` `VARCHAR(20) NOT NULL FOREIGN KEY REFERENCES Employees(ecode)`
- `acting_context` `VARCHAR(50) NULL` *(Records active UI role context if switched)*
- `previous_data` `NVARCHAR(MAX) NULL`
- `updated_data` `NVARCHAR(MAX) NULL`
- `remarks` `NVARCHAR(500) NULL`
- `correlation_id` `VARCHAR(64) NULL`
- `created_at` `DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()`

> **Immutability Enforcement:** An `INSTEAD OF UPDATE, DELETE` trigger on `Audit_Events` raises an error to block any mutation or deletion of audit rows.

---

### B. Master Data Tables (`MASTER`)
1. `Verticals`: `vertical_id` (PK), `vertical_code` (`UNIQUE`), `vertical_name`, `is_active`.
2. `SBUs`: `sbu_id` (PK), `sbu_code` (`UNIQUE`), `sbu_name`, `vertical_id` (FK), `is_active`.
3. `Clients`: `client_id` (PK), `client_name` (`UNIQUE`), `client_type` (`DOMESTIC`, `INTERNATIONAL`), `is_active`.
4. `Locations`: `location_id` (PK), `state`, `city`, `facility_name`, `UNIQUE(state, city, facility_name)`.

---

### C. BPMS Operational Tables (`BPMS`)

#### 1. `Process_Registry` (Canonical Approved Truth)
- `registry_id` `INT IDENTITY(1,1) PRIMARY KEY`
- `process_code` `VARCHAR(30) NOT NULL UNIQUE` *(e.g., `PRC-0001`)*
- `wps_code` `VARCHAR(100) NULL` *(Filtered Unique Index `WHERE wps_code IS NOT NULL`)*
- `client_id` `INT NULL FOREIGN KEY REFERENCES Clients(client_id)`
- `process_name` `NVARCHAR(200) NULL`
- `client_type` `VARCHAR(30) NULL` (`DOMESTIC`, `INTERNATIONAL`)
- `vertical_id` `INT NOT NULL FOREIGN KEY REFERENCES Verticals(vertical_id)`
- `sbu_id` `INT NULL FOREIGN KEY REFERENCES SBUs(sbu_id)`
- `location_id` `INT NULL FOREIGN KEY REFERENCES Locations(location_id)`
- `status` `VARCHAR(30) NOT NULL DEFAULT 'TRANSITION'` (`DRAFT`, `TRANSITION`, `ACTIVE`, `INACTIVE`, `ARCHIVED`)
- `status_reason` `NVARCHAR(255) NULL` *(Preserves notes like `PO_NOT_RAISED` or `BUSINESS_CLOSED`)*
- `started_on` `DATE NULL`
- `ended_on` `DATE NULL`
- `version_num` `INT NOT NULL DEFAULT 1` *(Optimistic concurrency control)*
- `created_by` `VARCHAR(20) NOT NULL FOREIGN KEY REFERENCES Employees(ecode)`
- `created_at` `DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()`
- `updated_at` `DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()`

#### 2. `Process_Ownership` (Current & Historical Ownership Ledger)
- `ownership_id` `BIGINT IDENTITY(1,1) PRIMARY KEY`
- `registry_id` `INT NOT NULL FOREIGN KEY REFERENCES Process_Registry(registry_id)`
- `role_type` `VARCHAR(30) NOT NULL` (`OPS_QUALITY_HEAD`, `CBO`, `SBU_HEAD`, `ACCOUNT_HEAD`, `PM`)
- `employee_ecode` `VARCHAR(20) NOT NULL FOREIGN KEY REFERENCES Employees(ecode)`
- `effective_from` `DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()`
- `effective_to` `DATETIME2 NULL`
- `is_current` `BIT NOT NULL DEFAULT 1`
- `assigned_by` `VARCHAR(20) NOT NULL FOREIGN KEY REFERENCES Employees(ecode)`
- `source_type` `VARCHAR(40) NOT NULL` (`INITIAL_MIGRATION`, `HANDOVER`, `ADMIN_ASSIGNMENT`)
- `reason` `NVARCHAR(500) NULL`

> **Filtered Unique Index:** `CREATE UNIQUE NONCLUSTERED INDEX UX_ProcessOwnership_Current ON Process_Ownership(registry_id, role_type) WHERE is_current = 1;`

#### 3. `Process_Change_Requests` (Non-Destructive Proposed Edits)
- `change_request_id` `INT IDENTITY(1,1) PRIMARY KEY`
- `registry_id` `INT NOT NULL FOREIGN KEY REFERENCES Process_Registry(registry_id)`
- `change_type` `VARCHAR(40) NOT NULL` (`PROCESS_DETAILS_UPDATE`, `PROCESS_DEACTIVATION`)
- `proposed_data` `NVARCHAR(MAX) NOT NULL` *(JSON of proposed fields)*
- `status` `VARCHAR(30) NOT NULL DEFAULT 'DRAFT'` (`DRAFT`, `SUBMITTED`, `UNDER_REVIEW`, `APPROVED`, `REJECTED`, `CANCELLED`)
- `requested_by` `VARCHAR(20) NOT NULL FOREIGN KEY REFERENCES Employees(ecode)`
- `requested_at` `DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()`
- `submitted_at` `DATETIME2 NULL`
- `reviewed_by` `VARCHAR(20) NULL FOREIGN KEY REFERENCES Employees(ecode)`
- `reviewed_at` `DATETIME2 NULL`
- `review_remarks` `NVARCHAR(500) NULL`

#### 4. `Process_Handover_Requests`
- `handover_id` `INT IDENTITY(1,1) PRIMARY KEY`
- `registry_id` `INT NOT NULL FOREIGN KEY REFERENCES Process_Registry(registry_id)`
- `from_pm_ecode` `VARCHAR(20) NULL FOREIGN KEY REFERENCES Employees(ecode)`
- `to_pm_ecode` `VARCHAR(20) NOT NULL FOREIGN KEY REFERENCES Employees(ecode)`
- `scenario` `VARCHAR(50) NOT NULL`
- `effective_date` `DATE NOT NULL`
- `reason` `NVARCHAR(500) NOT NULL`
- `status` `VARCHAR(30) NOT NULL DEFAULT 'SUBMITTED'` (`SUBMITTED`, `UNDER_REVIEW`, `APPROVED`, `EXECUTED`, `REJECTED`, `CANCELLED`)
- `requested_by` `VARCHAR(20) NOT NULL FOREIGN KEY REFERENCES Employees(ecode)`
- `reviewed_by` `VARCHAR(20) NULL FOREIGN KEY REFERENCES Employees(ecode)`
- `reviewed_at` `DATETIME2 NULL`
- `review_remarks` `NVARCHAR(500) NULL`
- `created_at` `DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()`

#### 5. `Import_Batches` & `Import_Staging_Rows`
- `Import_Batches`: `batch_id` (PK), `file_name`, `uploaded_by` (FK), `status`, `total_rows`, `valid_rows`, `error_rows`, `created_at`, `committed_at`.
- `Import_Staging_Rows`: `staging_row_id` (PK), `batch_id` (FK), `row_number`, `raw_json`, `normalized_json`, `validation_errors_json`, `is_valid` (`BIT`).