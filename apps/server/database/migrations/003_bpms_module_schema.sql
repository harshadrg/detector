-- ============================================================================
-- Migration: 003_bpms_module_schema.sql
-- Description: BPMS Module Tables, Constraints, Filtered Indexes
-- Module: BPMS
-- ============================================================================

-- 1. Process_Registry (Canonical Approved Process State)
IF OBJECT_ID('dbo.Process_Registry', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Process_Registry (
        registry_id INT IDENTITY(1,1) NOT NULL,
        process_code VARCHAR(30) NOT NULL,
        wps_code VARCHAR(100) NULL,
        client_id INT NULL,
        process_name NVARCHAR(200) NULL,
        client_type VARCHAR(30) NULL,
        vertical_id INT NOT NULL,
        sbu_id INT NULL,
        location_id INT NULL,
        status VARCHAR(30) NOT NULL CONSTRAINT DF_ProcessRegistry_status DEFAULT 'TRANSITION',
        status_reason NVARCHAR(255) NULL,
        started_on DATE NULL,
        ended_on DATE NULL,
        version_num INT NOT NULL CONSTRAINT DF_ProcessRegistry_version_num DEFAULT 1,
        created_by VARCHAR(20) NOT NULL,
        created_at DATETIME2 NOT NULL CONSTRAINT DF_ProcessRegistry_created_at DEFAULT SYSUTCDATETIME(),
        updated_at DATETIME2 NOT NULL CONSTRAINT DF_ProcessRegistry_updated_at DEFAULT SYSUTCDATETIME(),
        CONSTRAINT PK_ProcessRegistry PRIMARY KEY CLUSTERED (registry_id),
        CONSTRAINT UQ_ProcessRegistry_process_code UNIQUE (process_code),
        CONSTRAINT FK_ProcessRegistry_Clients FOREIGN KEY (client_id)
            REFERENCES dbo.Clients (client_id),
        CONSTRAINT FK_ProcessRegistry_Verticals FOREIGN KEY (vertical_id)
            REFERENCES dbo.Verticals (vertical_id),
        CONSTRAINT FK_ProcessRegistry_SBUs FOREIGN KEY (sbu_id)
            REFERENCES dbo.SBUs (sbu_id),
        CONSTRAINT FK_ProcessRegistry_Locations FOREIGN KEY (location_id)
            REFERENCES dbo.Locations (location_id),
        CONSTRAINT FK_ProcessRegistry_CreatedBy FOREIGN KEY (created_by)
            REFERENCES dbo.Employees (ecode),
        CONSTRAINT CK_ProcessRegistry_status CHECK (status IN ('DRAFT', 'TRANSITION', 'ACTIVE', 'INACTIVE', 'ARCHIVED')),
        CONSTRAINT CK_ProcessRegistry_client_type CHECK (client_type IS NULL OR client_type IN ('DOMESTIC', 'INTERNATIONAL'))
    );
END;
GO

-- Filtered Unique Index: Enforce unique wps_code only when populated
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'UX_ProcessRegistry_WpsCode' AND object_id = OBJECT_ID('dbo.Process_Registry'))
BEGIN
    CREATE UNIQUE NONCLUSTERED INDEX UX_ProcessRegistry_WpsCode
        ON dbo.Process_Registry (wps_code)
        WHERE wps_code IS NOT NULL;
END;
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_ProcessRegistry_SearchFilters' AND object_id = OBJECT_ID('dbo.Process_Registry'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_ProcessRegistry_SearchFilters
        ON dbo.Process_Registry (status, vertical_id, sbu_id)
        INCLUDE (process_code, client_id, location_id, updated_at);
END;
GO

-- 2. Process_Ownership (Historical Ownership Ledger & Dual-Hatting Support)
IF OBJECT_ID('dbo.Process_Ownership', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Process_Ownership (
        ownership_id BIGINT IDENTITY(1,1) NOT NULL,
        registry_id INT NOT NULL,
        role_type VARCHAR(30) NOT NULL,
        employee_ecode VARCHAR(20) NOT NULL,
        effective_from DATETIME2 NOT NULL CONSTRAINT DF_ProcessOwnership_effective_from DEFAULT SYSUTCDATETIME(),
        effective_to DATETIME2 NULL,
        is_current BIT NOT NULL CONSTRAINT DF_ProcessOwnership_is_current DEFAULT 1,
        assigned_by VARCHAR(20) NOT NULL,
        source_type VARCHAR(40) NOT NULL,
        reason NVARCHAR(500) NULL,
        CONSTRAINT PK_ProcessOwnership PRIMARY KEY CLUSTERED (ownership_id),
        CONSTRAINT FK_ProcessOwnership_Registry FOREIGN KEY (registry_id)
            REFERENCES dbo.Process_Registry (registry_id) ON DELETE CASCADE,
        CONSTRAINT FK_ProcessOwnership_Employees FOREIGN KEY (employee_ecode)
            REFERENCES dbo.Employees (ecode),
        CONSTRAINT FK_ProcessOwnership_AssignedBy FOREIGN KEY (assigned_by)
            REFERENCES dbo.Employees (ecode),
        CONSTRAINT CK_ProcessOwnership_role_type CHECK (role_type IN ('OPS_QUALITY_HEAD', 'CBO', 'SBU_HEAD', 'ACCOUNT_HEAD', 'PM')),
        CONSTRAINT CK_ProcessOwnership_source_type CHECK (source_type IN ('INITIAL_MIGRATION', 'HANDOVER', 'ADMIN_ASSIGNMENT'))
    );
END;
GO

-- Filtered Unique Index: Exactly one active owner per (registry_id, role_type)
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'UX_ProcessOwnership_Current' AND object_id = OBJECT_ID('dbo.Process_Ownership'))
BEGIN
    CREATE UNIQUE NONCLUSTERED INDEX UX_ProcessOwnership_Current
        ON dbo.Process_Ownership (registry_id, role_type)
        WHERE is_current = 1;
END;
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_ProcessOwnership_EmployeeScope' AND object_id = OBJECT_ID('dbo.Process_Ownership'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_ProcessOwnership_EmployeeScope
        ON dbo.Process_Ownership (employee_ecode, is_current, role_type)
        INCLUDE (registry_id, effective_from);
END;
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_ProcessOwnership_Timeline' AND object_id = OBJECT_ID('dbo.Process_Ownership'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_ProcessOwnership_Timeline
        ON dbo.Process_Ownership (registry_id, effective_from, effective_to);
END;
GO

-- 3. Process_Change_Requests (Non-Destructive Proposed Edits)
IF OBJECT_ID('dbo.Process_Change_Requests', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Process_Change_Requests (
        change_request_id INT IDENTITY(1,1) NOT NULL,
        registry_id INT NOT NULL,
        change_type VARCHAR(40) NOT NULL,
        proposed_data NVARCHAR(MAX) NOT NULL,
        status VARCHAR(30) NOT NULL CONSTRAINT DF_ProcessChangeRequests_status DEFAULT 'DRAFT',
        requested_by VARCHAR(20) NOT NULL,
        requested_at DATETIME2 NOT NULL CONSTRAINT DF_ProcessChangeRequests_requested_at DEFAULT SYSUTCDATETIME(),
        submitted_at DATETIME2 NULL,
        reviewed_by VARCHAR(20) NULL,
        reviewed_at DATETIME2 NULL,
        review_remarks NVARCHAR(500) NULL,
        CONSTRAINT PK_ProcessChangeRequests PRIMARY KEY CLUSTERED (change_request_id),
        CONSTRAINT FK_ProcessChangeRequests_Registry FOREIGN KEY (registry_id)
            REFERENCES dbo.Process_Registry (registry_id),
        CONSTRAINT FK_ProcessChangeRequests_RequestedBy FOREIGN KEY (requested_by)
            REFERENCES dbo.Employees (ecode),
        CONSTRAINT FK_ProcessChangeRequests_ReviewedBy FOREIGN KEY (reviewed_by)
            REFERENCES dbo.Employees (ecode),
        CONSTRAINT CK_ProcessChangeRequests_change_type CHECK (change_type IN ('PROCESS_DETAILS_UPDATE', 'PROCESS_DEACTIVATION')),
        CONSTRAINT CK_ProcessChangeRequests_status CHECK (status IN ('DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'CANCELLED'))
    );
END;
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_ProcessChangeRequests_RegistryStatus' AND object_id = OBJECT_ID('dbo.Process_Change_Requests'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_ProcessChangeRequests_RegistryStatus
        ON dbo.Process_Change_Requests (registry_id, status);
END;
GO

-- 4. Process_Handover_Requests (Scenario-Driven Operational PM Handovers)
IF OBJECT_ID('dbo.Process_Handover_Requests', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Process_Handover_Requests (
        handover_id INT IDENTITY(1,1) NOT NULL,
        registry_id INT NOT NULL,
        from_pm_ecode VARCHAR(20) NULL,
        to_pm_ecode VARCHAR(20) NOT NULL,
        scenario VARCHAR(50) NOT NULL,
        effective_date DATE NOT NULL,
        reason NVARCHAR(500) NOT NULL,
        status VARCHAR(30) NOT NULL CONSTRAINT DF_ProcessHandoverRequests_status DEFAULT 'SUBMITTED',
        requested_by VARCHAR(20) NOT NULL,
        reviewed_by VARCHAR(20) NULL,
        reviewed_at DATETIME2 NULL,
        review_remarks NVARCHAR(500) NULL,
        created_at DATETIME2 NOT NULL CONSTRAINT DF_ProcessHandoverRequests_created_at DEFAULT SYSUTCDATETIME(),
        CONSTRAINT PK_ProcessHandoverRequests PRIMARY KEY CLUSTERED (handover_id),
        CONSTRAINT FK_ProcessHandoverRequests_Registry FOREIGN KEY (registry_id)
            REFERENCES dbo.Process_Registry (registry_id),
        CONSTRAINT FK_ProcessHandoverRequests_FromPM FOREIGN KEY (from_pm_ecode)
            REFERENCES dbo.Employees (ecode),
        CONSTRAINT FK_ProcessHandoverRequests_ToPM FOREIGN KEY (to_pm_ecode)
            REFERENCES dbo.Employees (ecode),
        CONSTRAINT FK_ProcessHandoverRequests_RequestedBy FOREIGN KEY (requested_by)
            REFERENCES dbo.Employees (ecode),
        CONSTRAINT FK_ProcessHandoverRequests_ReviewedBy FOREIGN KEY (reviewed_by)
            REFERENCES dbo.Employees (ecode),
        CONSTRAINT CK_ProcessHandoverRequests_scenario CHECK (scenario IN (
            'PM_MOVED_PROJECT', 'PM_ROLE_CHANGE', 'PM_LEFT_COMPANY', 'TEMPORARY_HANDOVER', 'ESCALATION', 'ADMIN_OVERRIDE'
        )),
        CONSTRAINT CK_ProcessHandoverRequests_status CHECK (status IN (
            'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'EXECUTED', 'REJECTED', 'CANCELLED'
        ))
    );
END;
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_ProcessHandoverRequests_RegistryStatus' AND object_id = OBJECT_ID('dbo.Process_Handover_Requests'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_ProcessHandoverRequests_RegistryStatus
        ON dbo.Process_Handover_Requests (registry_id, status);
END;
GO

-- 5. Import_Batches (Staged Excel Import Governance)
IF OBJECT_ID('dbo.Import_Batches', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Import_Batches (
        batch_id INT IDENTITY(1,1) NOT NULL,
        file_name NVARCHAR(255) NOT NULL,
        uploaded_by VARCHAR(20) NOT NULL,
        status VARCHAR(30) NOT NULL CONSTRAINT DF_ImportBatches_status DEFAULT 'UPLOADED',
        total_rows INT NOT NULL CONSTRAINT DF_ImportBatches_total_rows DEFAULT 0,
        valid_rows INT NOT NULL CONSTRAINT DF_ImportBatches_valid_rows DEFAULT 0,
        error_rows INT NOT NULL CONSTRAINT DF_ImportBatches_error_rows DEFAULT 0,
        created_at DATETIME2 NOT NULL CONSTRAINT DF_ImportBatches_created_at DEFAULT SYSUTCDATETIME(),
        committed_at DATETIME2 NULL,
        CONSTRAINT PK_ImportBatches PRIMARY KEY CLUSTERED (batch_id),
        CONSTRAINT FK_ImportBatches_UploadedBy FOREIGN KEY (uploaded_by)
            REFERENCES dbo.Employees (ecode),
        CONSTRAINT CK_ImportBatches_status CHECK (status IN (
            'UPLOADED', 'VALIDATING', 'VALIDATED_WITH_ERRORS', 'READY_TO_COMMIT', 'COMMITTED', 'FAILED'
        ))
    );
END;
GO

-- 6. Import_Staging_Rows (Isolated Staging & Preview for Raw Spreadsheets)
IF OBJECT_ID('dbo.Import_Staging_Rows', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Import_Staging_Rows (
        staging_row_id INT IDENTITY(1,1) NOT NULL,
        batch_id INT NOT NULL,
        row_number INT NOT NULL,
        raw_json NVARCHAR(MAX) NOT NULL,
        normalized_json NVARCHAR(MAX) NULL,
        validation_errors_json NVARCHAR(MAX) NULL,
        is_valid BIT NOT NULL CONSTRAINT DF_ImportStagingRows_is_valid DEFAULT 0,
        CONSTRAINT PK_ImportStagingRows PRIMARY KEY CLUSTERED (staging_row_id),
        CONSTRAINT FK_ImportStagingRows_Batch FOREIGN KEY (batch_id)
            REFERENCES dbo.Import_Batches (batch_id) ON DELETE CASCADE
    );
END;
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_ImportStagingRows_BatchValidation' AND object_id = OBJECT_ID('dbo.Import_Staging_Rows'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_ImportStagingRows_BatchValidation
        ON dbo.Import_Staging_Rows (batch_id, is_valid)
        INCLUDE (row_number);
END;
GO
