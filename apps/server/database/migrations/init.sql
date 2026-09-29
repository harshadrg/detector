-- ============================================================================
-- File: init.sql
-- Description: Complete Detector Enterprise Platform Unified Schema & Seed Script
-- Platform: Microsoft SQL Server (T-SQL)
-- Database: detector_db
-- ============================================================================

-- Ensure target database exists
IF NOT EXISTS (SELECT 1 FROM sys.databases WHERE name = 'detector_db')
BEGIN
    CREATE DATABASE detector_db;
END;
GO

USE detector_db;
GO

-- ============================================================================
-- 1. CORE PLATFORM TABLES
-- ============================================================================

-- 1.1 Employees (Central Employee Directory)
IF OBJECT_ID('dbo.Employees', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Employees (
        ecode VARCHAR(20) NOT NULL,
        name NVARCHAR(100) NOT NULL,
        email VARCHAR(150) NOT NULL,
        status VARCHAR(20) NOT NULL CONSTRAINT DF_Employees_status DEFAULT 'ACTIVE',
        created_at DATETIME2 NOT NULL CONSTRAINT DF_Employees_created_at DEFAULT SYSUTCDATETIME(),
        updated_at DATETIME2 NOT NULL CONSTRAINT DF_Employees_updated_at DEFAULT SYSUTCDATETIME(),
        CONSTRAINT PK_Employees PRIMARY KEY CLUSTERED (ecode),
        CONSTRAINT UQ_Employees_email UNIQUE (email),
        CONSTRAINT CK_Employees_status CHECK (status IN ('ACTIVE', 'INACTIVE'))
    );
END;
GO

-- 1.2 Employee_Identities (Authentication Credentials & Session Invalidation)
IF OBJECT_ID('dbo.Employee_Identities', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Employee_Identities (
        identity_id INT IDENTITY(1,1) NOT NULL,
        ecode VARCHAR(20) NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        token_version INT NOT NULL CONSTRAINT DF_EmployeeIdentities_token_version DEFAULT 1,
        last_login_at DATETIME2 NULL,
        CONSTRAINT PK_EmployeeIdentities PRIMARY KEY CLUSTERED (identity_id),
        CONSTRAINT UQ_EmployeeIdentities_ecode UNIQUE (ecode),
        CONSTRAINT FK_EmployeeIdentities_Employees FOREIGN KEY (ecode)
            REFERENCES dbo.Employees (ecode) ON DELETE CASCADE
    );
END;
GO

-- 1.3 System_Modules (Modular Architecture Registry: CORE, BPMS, etc.)
IF OBJECT_ID('dbo.System_Modules', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.System_Modules (
        module_id INT IDENTITY(1,1) NOT NULL,
        module_code VARCHAR(30) NOT NULL,
        module_name NVARCHAR(100) NOT NULL,
        is_active BIT NOT NULL CONSTRAINT DF_SystemModules_is_active DEFAULT 1,
        CONSTRAINT PK_SystemModules PRIMARY KEY CLUSTERED (module_id),
        CONSTRAINT UQ_SystemModules_module_code UNIQUE (module_code)
    );
END;
GO

-- 1.4 Roles (Separation of PLATFORM_ADMIN, MODULE_ADMIN, ORGANIZATIONAL)
IF OBJECT_ID('dbo.Roles', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Roles (
        role_id INT IDENTITY(1,1) NOT NULL,
        role_code VARCHAR(50) NOT NULL,
        role_name NVARCHAR(100) NOT NULL,
        role_category VARCHAR(30) NOT NULL,
        module_id INT NOT NULL,
        is_system_default BIT NOT NULL CONSTRAINT DF_Roles_is_system_default DEFAULT 0,
        is_active BIT NOT NULL CONSTRAINT DF_Roles_is_active DEFAULT 1,
        CONSTRAINT PK_Roles PRIMARY KEY CLUSTERED (role_id),
        CONSTRAINT UQ_Roles_role_code UNIQUE (role_code),
        CONSTRAINT FK_Roles_SystemModules FOREIGN KEY (module_id)
            REFERENCES dbo.System_Modules (module_id),
        CONSTRAINT CK_Roles_category CHECK (role_category IN ('PLATFORM_ADMIN', 'MODULE_ADMIN', 'ORGANIZATIONAL'))
    );
END;
GO

-- 1.5 Permissions (Granular Permission Tokens)
IF OBJECT_ID('dbo.Permissions', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Permissions (
        permission_id INT IDENTITY(1,1) NOT NULL,
        module_id INT NOT NULL,
        permission_code VARCHAR(100) NOT NULL,
        description NVARCHAR(255) NULL,
        CONSTRAINT PK_Permissions PRIMARY KEY CLUSTERED (permission_id),
        CONSTRAINT UQ_Permissions_code UNIQUE (permission_code),
        CONSTRAINT FK_Permissions_SystemModules FOREIGN KEY (module_id)
            REFERENCES dbo.System_Modules (module_id)
    );
END;
GO

-- 1.6 Role_Permissions (Role-to-Permission Mappings)
IF OBJECT_ID('dbo.Role_Permissions', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Role_Permissions (
        role_id INT NOT NULL,
        permission_id INT NOT NULL,
        CONSTRAINT PK_RolePermissions PRIMARY KEY CLUSTERED (role_id, permission_id),
        CONSTRAINT FK_RolePermissions_Roles FOREIGN KEY (role_id)
            REFERENCES dbo.Roles (role_id) ON DELETE CASCADE,
        CONSTRAINT FK_RolePermissions_Permissions FOREIGN KEY (permission_id)
            REFERENCES dbo.Permissions (permission_id) ON DELETE CASCADE
    );
END;
GO

-- 1.7 Employee_Role_Mapping (Many-to-Many Multi-Role & Dual-Hatting)
IF OBJECT_ID('dbo.Employee_Role_Mapping', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Employee_Role_Mapping (
        ecode VARCHAR(20) NOT NULL,
        role_id INT NOT NULL,
        assigned_by VARCHAR(20) NOT NULL,
        assigned_at DATETIME2 NOT NULL CONSTRAINT DF_EmployeeRoleMapping_assigned_at DEFAULT SYSUTCDATETIME(),
        CONSTRAINT PK_EmployeeRoleMapping PRIMARY KEY CLUSTERED (ecode, role_id),
        CONSTRAINT FK_EmployeeRoleMapping_Employees FOREIGN KEY (ecode)
            REFERENCES dbo.Employees (ecode) ON DELETE CASCADE,
        CONSTRAINT FK_EmployeeRoleMapping_Roles FOREIGN KEY (role_id)
            REFERENCES dbo.Roles (role_id) ON DELETE CASCADE,
        CONSTRAINT FK_EmployeeRoleMapping_AssignedBy FOREIGN KEY (assigned_by)
            REFERENCES dbo.Employees (ecode)
    );
END;
GO

-- 1.8 Notifications (Polymorphic Cross-Module Alerting)
IF OBJECT_ID('dbo.Notifications', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Notifications (
        notification_id BIGINT IDENTITY(1,1) NOT NULL,
        recipient_ecode VARCHAR(20) NOT NULL,
        sender_ecode VARCHAR(20) NULL,
        notification_type VARCHAR(50) NOT NULL,
        entity_type VARCHAR(50) NOT NULL,
        entity_id VARCHAR(50) NOT NULL,
        message NVARCHAR(500) NOT NULL,
        action_url VARCHAR(255) NULL,
        is_read BIT NOT NULL CONSTRAINT DF_Notifications_is_read DEFAULT 0,
        read_at DATETIME2 NULL,
        created_at DATETIME2 NOT NULL CONSTRAINT DF_Notifications_created_at DEFAULT SYSUTCDATETIME(),
        CONSTRAINT PK_Notifications PRIMARY KEY CLUSTERED (notification_id),
        CONSTRAINT FK_Notifications_Recipient FOREIGN KEY (recipient_ecode)
            REFERENCES dbo.Employees (ecode),
        CONSTRAINT FK_Notifications_Sender FOREIGN KEY (sender_ecode)
            REFERENCES dbo.Employees (ecode)
    );
END;
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Notifications_RecipientRead' AND object_id = OBJECT_ID('dbo.Notifications'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_Notifications_RecipientRead
        ON dbo.Notifications (recipient_ecode, is_read, created_at DESC);
END;
GO

-- 1.9 Audit_Events (Immutable Platform Ledger)
IF OBJECT_ID('dbo.Audit_Events', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Audit_Events (
        event_id BIGINT IDENTITY(1,1) NOT NULL,
        module_code VARCHAR(30) NOT NULL,
        entity_type VARCHAR(50) NOT NULL,
        entity_id VARCHAR(50) NOT NULL,
        action VARCHAR(100) NOT NULL,
        performed_by VARCHAR(20) NOT NULL,
        acting_context VARCHAR(50) NULL,
        previous_data NVARCHAR(MAX) NULL,
        updated_data NVARCHAR(MAX) NULL,
        remarks NVARCHAR(500) NULL,
        correlation_id VARCHAR(64) NULL,
        created_at DATETIME2 NOT NULL CONSTRAINT DF_AuditEvents_created_at DEFAULT SYSUTCDATETIME(),
        CONSTRAINT PK_AuditEvents PRIMARY KEY CLUSTERED (event_id),
        CONSTRAINT FK_AuditEvents_PerformedBy FOREIGN KEY (performed_by)
            REFERENCES dbo.Employees (ecode)
    );
END;
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_AuditEvents_ModuleEntity' AND object_id = OBJECT_ID('dbo.Audit_Events'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_AuditEvents_ModuleEntity
        ON dbo.Audit_Events (module_code, entity_type, entity_id);
END;
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_AuditEvents_Correlation' AND object_id = OBJECT_ID('dbo.Audit_Events'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_AuditEvents_Correlation
        ON dbo.Audit_Events (correlation_id)
        WHERE correlation_id IS NOT NULL;
END;
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_AuditEvents_PerformedBy' AND object_id = OBJECT_ID('dbo.Audit_Events'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_AuditEvents_PerformedBy
        ON dbo.Audit_Events (performed_by, created_at DESC);
END;
GO

-- 1.10 Audit_Events Immutability Trigger
CREATE OR ALTER TRIGGER dbo.TR_AuditEvents_PreventUpdateDelete
ON dbo.Audit_Events
INSTEAD OF UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;
    RAISERROR ('Audit_Events is an immutable ledger. Direct UPDATE or DELETE operations are strictly prohibited.', 16, 1);
    ROLLBACK TRANSACTION;
END;
GO

-- ============================================================================
-- 2. MASTER DATA TABLES
-- ============================================================================

-- 2.1 Verticals
IF OBJECT_ID('dbo.Verticals', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Verticals (
        vertical_id INT IDENTITY(1,1) NOT NULL,
        vertical_code VARCHAR(50) NOT NULL,
        vertical_name NVARCHAR(100) NOT NULL,
        is_active BIT NOT NULL CONSTRAINT DF_Verticals_is_active DEFAULT 1,
        CONSTRAINT PK_Verticals PRIMARY KEY CLUSTERED (vertical_id),
        CONSTRAINT UQ_Verticals_vertical_code UNIQUE (vertical_code)
    );
END;
GO

-- 2.2 SBUs
IF OBJECT_ID('dbo.SBUs', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.SBUs (
        sbu_id INT IDENTITY(1,1) NOT NULL,
        sbu_code VARCHAR(50) NOT NULL,
        sbu_name NVARCHAR(100) NOT NULL,
        vertical_id INT NOT NULL,
        is_active BIT NOT NULL CONSTRAINT DF_SBUs_is_active DEFAULT 1,
        CONSTRAINT PK_SBUs PRIMARY KEY CLUSTERED (sbu_id),
        CONSTRAINT UQ_SBUs_sbu_code UNIQUE (sbu_code),
        CONSTRAINT FK_SBUs_Verticals FOREIGN KEY (vertical_id)
            REFERENCES dbo.Verticals (vertical_id)
    );
END;
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_SBUs_Vertical' AND object_id = OBJECT_ID('dbo.SBUs'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_SBUs_Vertical ON dbo.SBUs (vertical_id);
END;
GO

-- 2.3 Clients
IF OBJECT_ID('dbo.Clients', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Clients (
        client_id INT IDENTITY(1,1) NOT NULL,
        client_name NVARCHAR(150) NOT NULL,
        client_type VARCHAR(30) NOT NULL,
        is_active BIT NOT NULL CONSTRAINT DF_Clients_is_active DEFAULT 1,
        CONSTRAINT PK_Clients PRIMARY KEY CLUSTERED (client_id),
        CONSTRAINT UQ_Clients_client_name UNIQUE (client_name),
        CONSTRAINT CK_Clients_client_type CHECK (client_type IN ('DOMESTIC', 'INTERNATIONAL'))
    );
END;
GO

-- 2.4 Locations
IF OBJECT_ID('dbo.Locations', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Locations (
        location_id INT IDENTITY(1,1) NOT NULL,
        state NVARCHAR(100) NOT NULL,
        city NVARCHAR(100) NOT NULL,
        facility_name NVARCHAR(150) NOT NULL,
        CONSTRAINT PK_Locations PRIMARY KEY CLUSTERED (location_id),
        CONSTRAINT UQ_Locations_StateCityFacility UNIQUE (state, city, facility_name)
    );
END;
GO

-- ============================================================================
-- 3. BPMS OPERATIONAL TABLES
-- ============================================================================

-- 3.1 Process_Registry
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

-- 3.2 Process_Ownership
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

-- 3.3 Process_Change_Requests
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

-- 3.4 Process_Handover_Requests
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

-- 3.5 Import_Batches
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

-- 3.6 Import_Staging_Rows
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

-- ============================================================================
-- 4. INITIAL PLATFORM SEED DATA
-- ============================================================================

-- 4.1 System Modules
MERGE dbo.System_Modules AS target
USING (VALUES
    ('CORE', 'Detector Core Platform', 1),
    ('BPMS', 'Business Process Management System', 1)
) AS source (module_code, module_name, is_active)
ON target.module_code = source.module_code
WHEN MATCHED THEN
    UPDATE SET target.module_name = source.module_name, target.is_active = source.is_active
WHEN NOT MATCHED THEN
    INSERT (module_code, module_name, is_active)
    VALUES (source.module_code, source.module_name, source.is_active);
GO

-- 4.2 System Roles
DECLARE @coreModuleId INT = (SELECT module_id FROM dbo.System_Modules WHERE module_code = 'CORE');
DECLARE @bpmsModuleId INT = (SELECT module_id FROM dbo.System_Modules WHERE module_code = 'BPMS');

MERGE dbo.Roles AS target
USING (VALUES
    ('SUPER_ADMIN', 'Platform Super Administrator', 'PLATFORM_ADMIN', @coreModuleId, 1, 1),
    ('BPMS_ADMIN', 'BPMS Module Administrator', 'MODULE_ADMIN', @bpmsModuleId, 1, 1),
    ('OPS_QUALITY_HEAD', 'Operations & Quality Head', 'ORGANIZATIONAL', @bpmsModuleId, 0, 1),
    ('CBO', 'Chief Business Officer', 'ORGANIZATIONAL', @bpmsModuleId, 0, 1),
    ('SBU_HEAD', 'Strategic Business Unit Head', 'ORGANIZATIONAL', @bpmsModuleId, 0, 1),
    ('ACCOUNT_HEAD', 'Account Head', 'ORGANIZATIONAL', @bpmsModuleId, 0, 1),
    ('PROJECT_MANAGER', 'Process Project Manager', 'ORGANIZATIONAL', @bpmsModuleId, 0, 1)
) AS source (role_code, role_name, role_category, module_id, is_system_default, is_active)
ON target.role_code = source.role_code
WHEN MATCHED THEN
    UPDATE SET 
        target.role_name = source.role_name,
        target.role_category = source.role_category,
        target.module_id = source.module_id,
        target.is_system_default = source.is_system_default,
        target.is_active = source.is_active
WHEN NOT MATCHED THEN
    INSERT (role_code, role_name, role_category, module_id, is_system_default, is_active)
    VALUES (source.role_code, source.role_name, source.role_category, source.module_id, source.is_system_default, source.is_active);
GO

-- 4.3 Permissions Catalog
DECLARE @coreModuleId INT = (SELECT module_id FROM dbo.System_Modules WHERE module_code = 'CORE');
DECLARE @bpmsModuleId INT = (SELECT module_id FROM dbo.System_Modules WHERE module_code = 'BPMS');

MERGE dbo.Permissions AS target
USING (VALUES
    (@coreModuleId, 'CORE.USER.VIEW', 'View employee roster and profile information'),
    (@coreModuleId, 'CORE.USER.MANAGE', 'Create, update, and manage employee active status'),
    (@coreModuleId, 'CORE.ROLE.ASSIGN_ADMIN', 'Assign or revoke administrative platform roles'),
    (@coreModuleId, 'CORE.ROLE.ASSIGN_ORG', 'Assign or revoke organizational hierarchy roles'),
    (@coreModuleId, 'CORE.CONTEXT.SWITCH', 'Simulate role view in UI preview context'),
    (@coreModuleId, 'CORE.AUDIT.VIEW_GLOBAL', 'Inspect global immutable platform audit ledger'),
    (@coreModuleId, 'CORE.NOTIFICATION.VIEW', 'View and mark personal notifications'),
    (@bpmsModuleId, 'BPMS.PROCESS.VIEW', 'View process registry records and operational details'),
    (@bpmsModuleId, 'BPMS.PROCESS.CREATE', 'Manually register a new process'),
    (@bpmsModuleId, 'BPMS.CHANGE_REQUEST.DRAFT', 'Draft non-destructive process change requests'),
    (@bpmsModuleId, 'BPMS.CHANGE_REQUEST.SUBMIT', 'Submit process change requests for administrative review'),
    (@bpmsModuleId, 'BPMS.CHANGE_REQUEST.APPROVE', 'Approve pending process change requests'),
    (@bpmsModuleId, 'BPMS.CHANGE_REQUEST.REJECT', 'Reject pending process change requests with remarks'),
    (@bpmsModuleId, 'BPMS.HANDOVER.REQUEST', 'Initiate scenario-driven PM handover request'),
    (@bpmsModuleId, 'BPMS.HANDOVER.APPROVE', 'Review and approve PM handover request'),
    (@bpmsModuleId, 'BPMS.PROCESS.DEACTIVATE_REQUEST', 'Request process lifecycle closure and deactivation'),
    (@bpmsModuleId, 'BPMS.PROCESS.DEACTIVATE_APPROVE', 'Approve process lifecycle closure and deactivation'),
    (@bpmsModuleId, 'BPMS.IMPORT.STAGE', 'Upload spreadsheet to staging table for validation'),
    (@bpmsModuleId, 'BPMS.IMPORT.COMMIT', 'Commit validated import batch into live process registry'),
    (@bpmsModuleId, 'BPMS.AUDIT.VIEW', 'View process-scoped audit history')
) AS source (module_id, permission_code, description)
ON target.permission_code = source.permission_code
WHEN MATCHED THEN
    UPDATE SET target.description = source.description, target.module_id = source.module_id
WHEN NOT MATCHED THEN
    INSERT (module_id, permission_code, description)
    VALUES (source.module_id, source.permission_code, source.description);
GO

-- 4.4 Role-Permission Mappings
DECLARE @RolePermMap TABLE (
    role_code VARCHAR(50),
    permission_code VARCHAR(100)
);

INSERT INTO @RolePermMap (role_code, permission_code)
SELECT 'SUPER_ADMIN', permission_code FROM dbo.Permissions;

INSERT INTO @RolePermMap (role_code, permission_code)
VALUES
    ('BPMS_ADMIN', 'CORE.USER.VIEW'),
    ('BPMS_ADMIN', 'CORE.ROLE.ASSIGN_ORG'),
    ('BPMS_ADMIN', 'CORE.NOTIFICATION.VIEW'),
    ('BPMS_ADMIN', 'BPMS.PROCESS.VIEW'),
    ('BPMS_ADMIN', 'BPMS.PROCESS.CREATE'),
    ('BPMS_ADMIN', 'BPMS.CHANGE_REQUEST.DRAFT'),
    ('BPMS_ADMIN', 'BPMS.CHANGE_REQUEST.SUBMIT'),
    ('BPMS_ADMIN', 'BPMS.CHANGE_REQUEST.APPROVE'),
    ('BPMS_ADMIN', 'BPMS.CHANGE_REQUEST.REJECT'),
    ('BPMS_ADMIN', 'BPMS.HANDOVER.REQUEST'),
    ('BPMS_ADMIN', 'BPMS.HANDOVER.APPROVE'),
    ('BPMS_ADMIN', 'BPMS.PROCESS.DEACTIVATE_REQUEST'),
    ('BPMS_ADMIN', 'BPMS.PROCESS.DEACTIVATE_APPROVE'),
    ('BPMS_ADMIN', 'BPMS.IMPORT.STAGE'),
    ('BPMS_ADMIN', 'BPMS.IMPORT.COMMIT'),
    ('BPMS_ADMIN', 'BPMS.AUDIT.VIEW');

INSERT INTO @RolePermMap (role_code, permission_code)
VALUES
    ('OPS_QUALITY_HEAD', 'CORE.USER.VIEW'),
    ('OPS_QUALITY_HEAD', 'CORE.NOTIFICATION.VIEW'),
    ('OPS_QUALITY_HEAD', 'BPMS.PROCESS.VIEW'),
    ('OPS_QUALITY_HEAD', 'BPMS.AUDIT.VIEW');

INSERT INTO @RolePermMap (role_code, permission_code)
VALUES
    ('CBO', 'CORE.USER.VIEW'),
    ('CBO', 'CORE.NOTIFICATION.VIEW'),
    ('CBO', 'BPMS.PROCESS.VIEW'),
    ('CBO', 'BPMS.AUDIT.VIEW');

INSERT INTO @RolePermMap (role_code, permission_code)
VALUES
    ('SBU_HEAD', 'CORE.USER.VIEW'),
    ('SBU_HEAD', 'CORE.NOTIFICATION.VIEW'),
    ('SBU_HEAD', 'BPMS.PROCESS.VIEW'),
    ('SBU_HEAD', 'BPMS.HANDOVER.REQUEST'),
    ('SBU_HEAD', 'BPMS.PROCESS.DEACTIVATE_REQUEST'),
    ('SBU_HEAD', 'BPMS.AUDIT.VIEW');

INSERT INTO @RolePermMap (role_code, permission_code)
VALUES
    ('ACCOUNT_HEAD', 'CORE.USER.VIEW'),
    ('ACCOUNT_HEAD', 'CORE.NOTIFICATION.VIEW'),
    ('ACCOUNT_HEAD', 'BPMS.PROCESS.VIEW'),
    ('ACCOUNT_HEAD', 'BPMS.HANDOVER.REQUEST'),
    ('ACCOUNT_HEAD', 'BPMS.PROCESS.DEACTIVATE_REQUEST'),
    ('ACCOUNT_HEAD', 'BPMS.AUDIT.VIEW');

INSERT INTO @RolePermMap (role_code, permission_code)
VALUES
    ('PROJECT_MANAGER', 'CORE.NOTIFICATION.VIEW'),
    ('PROJECT_MANAGER', 'BPMS.PROCESS.VIEW'),
    ('PROJECT_MANAGER', 'BPMS.CHANGE_REQUEST.DRAFT'),
    ('PROJECT_MANAGER', 'BPMS.CHANGE_REQUEST.SUBMIT'),
    ('PROJECT_MANAGER', 'BPMS.HANDOVER.REQUEST'),
    ('PROJECT_MANAGER', 'BPMS.PROCESS.DEACTIVATE_REQUEST'),
    ('PROJECT_MANAGER', 'BPMS.AUDIT.VIEW');

MERGE dbo.Role_Permissions AS target
USING (
    SELECT r.role_id, p.permission_id
    FROM @RolePermMap rpm
    JOIN dbo.Roles r ON r.role_code = rpm.role_code
    JOIN dbo.Permissions p ON p.permission_code = rpm.permission_code
) AS source (role_id, permission_id)
ON target.role_id = source.role_id AND target.permission_id = source.permission_id
WHEN NOT MATCHED THEN
    INSERT (role_id, permission_id)
    VALUES (source.role_id, source.permission_id);
GO

-- 4.5 Initial Platform Super Administrator
MERGE dbo.Employees AS target
USING (VALUES
    ('ADMIN001', 'Platform Super Administrator', 'admin@detector.internal', 'ACTIVE')
) AS source (ecode, name, email, status)
ON target.ecode = source.ecode
WHEN MATCHED THEN
    UPDATE SET target.name = source.name, target.email = source.email, target.status = source.status
WHEN NOT MATCHED THEN
    INSERT (ecode, name, email, status)
    VALUES (source.ecode, source.name, source.email, source.status);
GO

MERGE dbo.Employee_Identities AS target
USING (VALUES
    ('ADMIN001', 'e36156be2248771f9b6894af2eb6df7c:90e86d914dd5304a9da2f31f20897586500b1e24d7a1af17b085aa2abccb31d1a6522fa579b9971cc05ff43cd6a4742e54d077e95b18ed8220033cd9e856d960', 1)
) AS source (ecode, password_hash, token_version)
ON target.ecode = source.ecode
WHEN MATCHED THEN
    UPDATE SET target.password_hash = source.password_hash
WHEN NOT MATCHED THEN
    INSERT (ecode, password_hash, token_version)
    VALUES (source.ecode, source.password_hash, source.token_version);
GO

DECLARE @superAdminRoleId INT = (SELECT role_id FROM dbo.Roles WHERE role_code = 'SUPER_ADMIN');

MERGE dbo.Employee_Role_Mapping AS target
USING (VALUES
    ('ADMIN001', @superAdminRoleId, 'ADMIN001')
) AS source (ecode, role_id, assigned_by)
ON target.ecode = source.ecode AND target.role_id = source.role_id
WHEN NOT MATCHED THEN
    INSERT (ecode, role_id, assigned_by)
    VALUES (source.ecode, source.role_id, source.assigned_by);
GO

-- 12. Seed Master Data Permissions & Roles
DECLARE @bpmsModuleIdMaster INT = (SELECT module_id FROM dbo.System_Modules WHERE module_code = 'BPMS');

MERGE dbo.Permissions AS target
USING (VALUES
    (@bpmsModuleIdMaster, 'BPMS.MASTER.VIEW', 'View organizational master data catalogs: Verticals, SBUs, Clients, Locations'),
    (@bpmsModuleIdMaster, 'BPMS.MASTER.MANAGE', 'Create, update, and manage organizational master records')
) AS source (module_id, permission_code, description)
ON target.permission_code = source.permission_code
WHEN MATCHED THEN
    UPDATE SET target.description = source.description, target.module_id = source.module_id
WHEN NOT MATCHED THEN
    INSERT (module_id, permission_code, description)
    VALUES (source.module_id, source.permission_code, source.description);
GO

DECLARE @RolePermMapMaster TABLE (
    role_code VARCHAR(50),
    permission_code VARCHAR(100)
);

INSERT INTO @RolePermMapMaster (role_code, permission_code)
VALUES
    ('SUPER_ADMIN', 'BPMS.MASTER.VIEW'),
    ('SUPER_ADMIN', 'BPMS.MASTER.MANAGE'),
    ('BPMS_ADMIN', 'BPMS.MASTER.VIEW'),
    ('BPMS_ADMIN', 'BPMS.MASTER.MANAGE'),
    ('OPS_QUALITY_HEAD', 'BPMS.MASTER.VIEW'),
    ('CBO', 'BPMS.MASTER.VIEW'),
    ('SBU_HEAD', 'BPMS.MASTER.VIEW'),
    ('ACCOUNT_HEAD', 'BPMS.MASTER.VIEW'),
    ('PROJECT_MANAGER', 'BPMS.MASTER.VIEW');

MERGE dbo.Role_Permissions AS target
USING (
    SELECT r.role_id, p.permission_id
    FROM @RolePermMapMaster rpm
    JOIN dbo.Roles r ON r.role_code = rpm.role_code
    JOIN dbo.Permissions p ON p.permission_code = rpm.permission_code
) AS source (role_id, permission_id)
ON target.role_id = source.role_id AND target.permission_id = source.permission_id
WHEN NOT MATCHED THEN
    INSERT (role_id, permission_id)
    VALUES (source.role_id, source.permission_id);
GO

-- 13. Seed Baseline Verticals, SBUs, Clients, Locations
MERGE dbo.Verticals AS target
USING (VALUES
    ('BFSI', N'Banking, Financial Services & Insurance', 1),
    ('MEU', N'Manufacturing, Energy & Utilities', 1),
    ('TECH&DIGITAL', N'Technology & Digital', 1),
    ('EMERGING', N'Emerging Markets & Verticals', 1)
) AS source (vertical_code, vertical_name, is_active)
ON target.vertical_code = source.vertical_code
WHEN MATCHED THEN
    UPDATE SET target.vertical_name = source.vertical_name, target.is_active = source.is_active
WHEN NOT MATCHED THEN
    INSERT (vertical_code, vertical_name, is_active)
    VALUES (source.vertical_code, source.vertical_name, source.is_active);
GO

DECLARE @bfsiId INT = (SELECT vertical_id FROM dbo.Verticals WHERE vertical_code = 'BFSI');
DECLARE @meuId INT = (SELECT vertical_id FROM dbo.Verticals WHERE vertical_code = 'MEU');
DECLARE @techId INT = (SELECT vertical_id FROM dbo.Verticals WHERE vertical_code = 'TECH&DIGITAL');
DECLARE @emergingId INT = (SELECT vertical_id FROM dbo.Verticals WHERE vertical_code = 'EMERGING');

MERGE dbo.SBUs AS target
USING (VALUES
    ('BFSI', N'BFSI Strategic Business Unit', @bfsiId, 1),
    ('MEU', N'MEU Strategic Business Unit', @meuId, 1),
    ('TECH&DIGITAL', N'Tech & Digital Strategic Business Unit', @techId, 1),
    ('EMERGING', N'Emerging Strategic Business Unit', @emergingId, 1)
) AS source (sbu_code, sbu_name, vertical_id, is_active)
ON target.sbu_code = source.sbu_code
WHEN MATCHED THEN
    UPDATE SET target.sbu_name = source.sbu_name, target.vertical_id = source.vertical_id, target.is_active = source.is_active
WHEN NOT MATCHED THEN
    INSERT (sbu_code, sbu_name, vertical_id, is_active)
    VALUES (source.sbu_code, source.sbu_name, source.vertical_id, source.is_active);
GO

MERGE dbo.Clients AS target
USING (VALUES
    (N'Apex Financial Services', 'DOMESTIC', 1),
    (N'Nexus Energy Global', 'INTERNATIONAL', 1),
    (N'Global Tech Innovations', 'INTERNATIONAL', 1),
    (N'Vanguard Retail Systems', 'DOMESTIC', 1),
    (N'Zenith Health Solutions', 'DOMESTIC', 1),
    (N'Meridian Manufacturing Corp', 'INTERNATIONAL', 1),
    (N'Pinnacle Telecom Services', 'DOMESTIC', 1),
    (N'Horizon Logistics International', 'INTERNATIONAL', 1)
) AS source (client_name, client_type, is_active)
ON target.client_name = source.client_name
WHEN MATCHED THEN
    UPDATE SET target.client_type = source.client_type, target.is_active = source.is_active
WHEN NOT MATCHED THEN
    INSERT (client_name, client_type, is_active)
    VALUES (source.client_name, source.client_type, source.is_active);
GO

MERGE dbo.Locations AS target
USING (VALUES
    (N'Maharashtra', N'Mumbai', N'Mindspace Campus Tower A'),
    (N'Maharashtra', N'Pune', N'Hinjewadi Tech Park Phase 1'),
    (N'Karnataka', N'Bengaluru', N'Electronic City Hub 2'),
    (N'Telangana', N'Hyderabad', N'HITEC City Cyber Gate'),
    (N'Tamil Nadu', N'Chennai', N'Taramani Ascendas IT Park'),
    (N'Haryana', N'Gurugram', N'Cyber City DLF Horizon')
) AS source (state, city, facility_name)
ON target.state = source.state AND target.city = source.city AND target.facility_name = source.facility_name
WHEN NOT MATCHED THEN
    INSERT (state, city, facility_name)
    VALUES (source.state, source.city, source.facility_name);
GO

-- ============================================================================
-- Migration: 007_seed_legacy_employees.sql
-- Description: Provision legacy organizational employees from DummyData.xlsx
-- Module: CORE / BPMS
-- ============================================================================

-- 1. Ensure legacy organizational employees exist
MERGE dbo.Employees AS target
USING (VALUES
    ('EMP0101', 'ABDADE_H', 'abdade_h@detector.internal', 'ACTIVE'),
    ('EMP0102', 'ABHINAV_F', 'abhinav_f@detector.internal', 'ACTIVE'),
    ('EMP0103', 'AJDE_H', 'ajde_h@detector.internal', 'ACTIVE'),
    ('EMP0104', 'AKAN_H', 'akan_h@detector.internal', 'ACTIVE'),
    ('EMP0105', 'AKASH_B', 'akash_b@detector.internal', 'ACTIVE'),
    ('EMP0106', 'ALEXANDER_G', 'alexander_g@detector.internal', 'ACTIVE'),
    ('EMP0107', 'ALICE_B', 'alice_b@detector.internal', 'ACTIVE'),
    ('EMP0108', 'AMAR_H', 'amar_h@detector.internal', 'ACTIVE'),
    ('EMP0109', 'AMIT_F', 'amit_f@detector.internal', 'ACTIVE'),
    ('EMP0110', 'ANANYA_G', 'ananya_g@detector.internal', 'ACTIVE'),
    ('EMP0111', 'ANDIKE_H', 'andike_h@detector.internal', 'ACTIVE'),
    ('EMP0112', 'ANNA_G', 'anna_g@detector.internal', 'ACTIVE'),
    ('EMP0113', 'BENJAMIN_G', 'benjamin_g@detector.internal', 'ACTIVE'),
    ('EMP0114', 'CHAR_H', 'char_h@detector.internal', 'ACTIVE'),
    ('EMP0115', 'CLARA_B', 'clara_b@detector.internal', 'ACTIVE'),
    ('EMP0116', 'DAISY_F', 'daisy_f@detector.internal', 'ACTIVE'),
    ('EMP0117', 'DANIEL_G', 'daniel_g@detector.internal', 'ACTIVE'),
    ('EMP0118', 'DIYA_G', 'diya_g@detector.internal', 'ACTIVE'),
    ('EMP0119', 'ELLIE_F', 'ellie_f@detector.internal', 'ACTIVE'),
    ('EMP0120', 'EVA_B', 'eva_b@detector.internal', 'ACTIVE'),
    ('EMP0121', 'FIAN_H', 'fian_h@detector.internal', 'ACTIVE'),
    ('EMP0122', 'FREYA_C', 'freya_c@detector.internal', 'ACTIVE'),
    ('EMP0123', 'HANNAH_G', 'hannah_g@detector.internal', 'ACTIVE'),
    ('EMP0124', 'HARSH_F', 'harsh_f@detector.internal', 'ACTIVE'),
    ('EMP0125', 'HENRY_G', 'henry_g@detector.internal', 'ACTIVE'),
    ('EMP0126', 'HIUR_H', 'hiur_h@detector.internal', 'ACTIVE'),
    ('EMP0127', 'ISHA_G', 'isha_g@detector.internal', 'ACTIVE'),
    ('EMP0128', 'ISLA_B', 'isla_b@detector.internal', 'ACTIVE'),
    ('EMP0129', 'JACK_G', 'jack_g@detector.internal', 'ACTIVE'),
    ('EMP0130', 'JAMES_G', 'james_g@detector.internal', 'ACTIVE'),
    ('EMP0131', 'JULIA_G', 'julia_g@detector.internal', 'ACTIVE'),
    ('EMP0132', 'KAAR_H', 'kaar_h@detector.internal', 'ACTIVE'),
    ('EMP0133', 'KAOR_H', 'kaor_h@detector.internal', 'ACTIVE'),
    ('EMP0134', 'KAVYA_G', 'kavya_g@detector.internal', 'ACTIVE'),
    ('EMP0135', 'LEO_G', 'leo_g@detector.internal', 'ACTIVE'),
    ('EMP0136', 'LUCAS_G', 'lucas_g@detector.internal', 'ACTIVE'),
    ('EMP0137', 'LUCY_C', 'lucy_c@detector.internal', 'ACTIVE'),
    ('EMP0138', 'MEERA_G', 'meera_g@detector.internal', 'ACTIVE'),
    ('EMP0139', 'MOHIT_G', 'mohit_g@detector.internal', 'ACTIVE'),
    ('EMP0140', 'NANDINI_G', 'nandini_g@detector.internal', 'ACTIVE'),
    ('EMP0141', 'NIKHIL_C', 'nikhil_c@detector.internal', 'ACTIVE'),
    ('EMP0142', 'POOJA_G', 'pooja_g@detector.internal', 'ACTIVE'),
    ('EMP0143', 'PRANAV_G', 'pranav_g@detector.internal', 'ACTIVE'),
    ('EMP0144', 'PURI_H', 'puri_h@detector.internal', 'ACTIVE'),
    ('EMP0145', 'RAAR_H', 'raar_h@detector.internal', 'ACTIVE'),
    ('EMP0146', 'RAGH_H', 'ragh_h@detector.internal', 'ACTIVE'),
    ('EMP0147', 'RAJ_B', 'raj_b@detector.internal', 'ACTIVE'),
    ('EMP0148', 'RAJABABU_H', 'rajababu_h@detector.internal', 'ACTIVE'),
    ('EMP0149', 'RARATA_H', 'rarata_h@detector.internal', 'ACTIVE'),
    ('EMP0150', 'RIYA_G', 'riya_g@detector.internal', 'ACTIVE'),
    ('EMP0151', 'ROHIT_C', 'rohit_c@detector.internal', 'ACTIVE'),
    ('EMP0152', 'RUHI_H', 'ruhi_h@detector.internal', 'ACTIVE'),
    ('EMP0153', 'RURI_H', 'ruri_h@detector.internal', 'ACTIVE'),
    ('EMP0154', 'SAAT_H', 'saat_h@detector.internal', 'ACTIVE'),
    ('EMP0155', 'SAMEER_C', 'sameer_c@detector.internal', 'ACTIVE'),
    ('EMP0156', 'SARAH_C', 'sarah_c@detector.internal', 'ACTIVE'),
    ('EMP0157', 'SARI_H', 'sari_h@detector.internal', 'ACTIVE'),
    ('EMP0158', 'SAURABH_F', 'saurabh_f@detector.internal', 'ACTIVE'),
    ('EMP0159', 'SCARLETT_F', 'scarlett_f@detector.internal', 'ACTIVE'),
    ('EMP0160', 'SHDE_H', 'shde_h@detector.internal', 'ACTIVE'),
    ('EMP0161', 'SHEE_H', 'shee_h@detector.internal', 'ACTIVE'),
    ('EMP0162', 'SIDDHI_G', 'siddhi_g@detector.internal', 'ACTIVE'),
    ('EMP0163', 'SNEHA_G', 'sneha_g@detector.internal', 'ACTIVE'),
    ('EMP0164', 'SOPHIA_G', 'sophia_g@detector.internal', 'ACTIVE'),
    ('EMP0165', 'STELLA_G', 'stella_g@detector.internal', 'ACTIVE'),
    ('EMP0166', 'SUKHAR_H', 'sukhar_h@detector.internal', 'ACTIVE'),
    ('EMP0167', 'SUSUTA_H', 'susuta_h@detector.internal', 'ACTIVE'),
    ('EMP0168', 'TANMAY_G', 'tanmay_g@detector.internal', 'ACTIVE'),
    ('EMP0169', 'TEMAAR_H', 'temaar_h@detector.internal', 'ACTIVE'),
    ('EMP0170', 'UMJALI_H', 'umjali_h@detector.internal', 'ACTIVE'),
    ('EMP0171', 'USLOKE_H', 'usloke_h@detector.internal', 'ACTIVE'),
    ('EMP0172', 'VARSHA_G', 'varsha_g@detector.internal', 'ACTIVE'),
    ('EMP0173', 'VARUN_B', 'varun_b@detector.internal', 'ACTIVE'),
    ('EMP0174', 'VELA_H', 'vela_h@detector.internal', 'ACTIVE'),
    ('EMP0175', 'VIAR_H', 'viar_h@detector.internal', 'ACTIVE'),
    ('EMP0176', 'VIASNE_H', 'viasne_h@detector.internal', 'ACTIVE'),
    ('EMP0177', 'VIKU_H', 'viku_h@detector.internal', 'ACTIVE'),
    ('EMP0178', 'VIUR_H', 'viur_h@detector.internal', 'ACTIVE'),
    ('EMP0179', 'VIVEK_G', 'vivek_g@detector.internal', 'ACTIVE'),
    ('EMP0180', 'VOILET_G', 'voilet_g@detector.internal', 'ACTIVE'),
    ('EMP0181', 'WILLIAM_G', 'william_g@detector.internal', 'ACTIVE')
) AS source (ecode, name, email, status)
ON target.name = source.name OR target.ecode = source.ecode
WHEN MATCHED THEN
    UPDATE SET target.status = source.status
WHEN NOT MATCHED THEN
    INSERT (ecode, name, email, status)
    VALUES (source.ecode, source.name, source.email, source.status);
GO

-- 2. Provision authentication credentials identities for all newly seeded employees
MERGE dbo.Employee_Identities AS target
USING (
    SELECT e.ecode, 'e36156be2248771f9b6894af2eb6df7c:90e86d914dd5304a9da2f31f20897586500b1e24d7a1af17b085aa2abccb31d1a6522fa579b9971cc05ff43cd6a4742e54d077e95b18ed8220033cd9e856d960' AS password_hash, 1 AS token_version
    FROM dbo.Employees e
    WHERE e.ecode LIKE 'EMP%'
) AS source (ecode, password_hash, token_version)
ON target.ecode = source.ecode
WHEN MATCHED THEN
    UPDATE SET target.password_hash = source.password_hash
WHEN NOT MATCHED THEN
    INSERT (ecode, password_hash, token_version)
    VALUES (source.ecode, source.password_hash, source.token_version);
GO

-- 3. Assign organizational roles based on DummyData.xlsx hierarchy
DECLARE @opsHeadRoleId INT = (SELECT role_id FROM dbo.Roles WHERE role_code = 'OPS_QUALITY_HEAD');
DECLARE @cboRoleId INT = (SELECT role_id FROM dbo.Roles WHERE role_code = 'CBO');
DECLARE @sbuHeadRoleId INT = (SELECT role_id FROM dbo.Roles WHERE role_code = 'SBU_HEAD');
DECLARE @accountHeadRoleId INT = (SELECT role_id FROM dbo.Roles WHERE role_code = 'ACCOUNT_HEAD');
DECLARE @pmRoleId INT = (SELECT role_id FROM dbo.Roles WHERE role_code = 'PROJECT_MANAGER');

MERGE dbo.Employee_Role_Mapping AS target
USING (VALUES
    ('EMP0101', @pmRoleId, 'ADMIN001'),
    ('EMP0102', @sbuHeadRoleId, 'ADMIN001'),
    ('EMP0103', @pmRoleId, 'ADMIN001'),
    ('EMP0104', @pmRoleId, 'ADMIN001'),
    ('EMP0105', @opsHeadRoleId, 'ADMIN001'),
    ('EMP0106', @accountHeadRoleId, 'ADMIN001'),
    ('EMP0106', @pmRoleId, 'ADMIN001'),
    ('EMP0107', @opsHeadRoleId, 'ADMIN001'),
    ('EMP0108', @pmRoleId, 'ADMIN001'),
    ('EMP0109', @sbuHeadRoleId, 'ADMIN001'),
    ('EMP0110', @accountHeadRoleId, 'ADMIN001'),
    ('EMP0111', @pmRoleId, 'ADMIN001'),
    ('EMP0112', @accountHeadRoleId, 'ADMIN001'),
    ('EMP0112', @pmRoleId, 'ADMIN001'),
    ('EMP0113', @accountHeadRoleId, 'ADMIN001'),
    ('EMP0113', @pmRoleId, 'ADMIN001'),
    ('EMP0114', @pmRoleId, 'ADMIN001'),
    ('EMP0115', @opsHeadRoleId, 'ADMIN001'),
    ('EMP0116', @sbuHeadRoleId, 'ADMIN001'),
    ('EMP0116', @accountHeadRoleId, 'ADMIN001'),
    ('EMP0117', @accountHeadRoleId, 'ADMIN001'),
    ('EMP0118', @accountHeadRoleId, 'ADMIN001'),
    ('EMP0118', @pmRoleId, 'ADMIN001'),
    ('EMP0119', @sbuHeadRoleId, 'ADMIN001'),
    ('EMP0120', @opsHeadRoleId, 'ADMIN001'),
    ('EMP0121', @pmRoleId, 'ADMIN001'),
    ('EMP0122', @cboRoleId, 'ADMIN001'),
    ('EMP0123', @accountHeadRoleId, 'ADMIN001'),
    ('EMP0124', @sbuHeadRoleId, 'ADMIN001'),
    ('EMP0125', @accountHeadRoleId, 'ADMIN001'),
    ('EMP0125', @pmRoleId, 'ADMIN001'),
    ('EMP0126', @pmRoleId, 'ADMIN001'),
    ('EMP0127', @accountHeadRoleId, 'ADMIN001'),
    ('EMP0127', @pmRoleId, 'ADMIN001'),
    ('EMP0128', @opsHeadRoleId, 'ADMIN001'),
    ('EMP0129', @pmRoleId, 'ADMIN001'),
    ('EMP0130', @accountHeadRoleId, 'ADMIN001'),
    ('EMP0130', @pmRoleId, 'ADMIN001'),
    ('EMP0131', @accountHeadRoleId, 'ADMIN001'),
    ('EMP0131', @pmRoleId, 'ADMIN001'),
    ('EMP0132', @pmRoleId, 'ADMIN001'),
    ('EMP0133', @pmRoleId, 'ADMIN001'),
    ('EMP0134', @accountHeadRoleId, 'ADMIN001'),
    ('EMP0135', @accountHeadRoleId, 'ADMIN001'),
    ('EMP0135', @pmRoleId, 'ADMIN001'),
    ('EMP0136', @accountHeadRoleId, 'ADMIN001'),
    ('EMP0136', @pmRoleId, 'ADMIN001'),
    ('EMP0137', @cboRoleId, 'ADMIN001'),
    ('EMP0138', @accountHeadRoleId, 'ADMIN001'),
    ('EMP0138', @pmRoleId, 'ADMIN001'),
    ('EMP0139', @accountHeadRoleId, 'ADMIN001'),
    ('EMP0139', @pmRoleId, 'ADMIN001'),
    ('EMP0140', @accountHeadRoleId, 'ADMIN001'),
    ('EMP0140', @pmRoleId, 'ADMIN001'),
    ('EMP0141', @cboRoleId, 'ADMIN001'),
    ('EMP0142', @accountHeadRoleId, 'ADMIN001'),
    ('EMP0143', @accountHeadRoleId, 'ADMIN001'),
    ('EMP0143', @pmRoleId, 'ADMIN001'),
    ('EMP0144', @pmRoleId, 'ADMIN001'),
    ('EMP0145', @pmRoleId, 'ADMIN001'),
    ('EMP0146', @pmRoleId, 'ADMIN001'),
    ('EMP0147', @opsHeadRoleId, 'ADMIN001'),
    ('EMP0148', @pmRoleId, 'ADMIN001'),
    ('EMP0149', @pmRoleId, 'ADMIN001'),
    ('EMP0150', @accountHeadRoleId, 'ADMIN001'),
    ('EMP0150', @pmRoleId, 'ADMIN001'),
    ('EMP0151', @cboRoleId, 'ADMIN001'),
    ('EMP0152', @pmRoleId, 'ADMIN001'),
    ('EMP0153', @pmRoleId, 'ADMIN001'),
    ('EMP0154', @pmRoleId, 'ADMIN001'),
    ('EMP0155', @cboRoleId, 'ADMIN001'),
    ('EMP0156', @cboRoleId, 'ADMIN001'),
    ('EMP0157', @pmRoleId, 'ADMIN001'),
    ('EMP0158', @sbuHeadRoleId, 'ADMIN001'),
    ('EMP0159', @sbuHeadRoleId, 'ADMIN001'),
    ('EMP0160', @pmRoleId, 'ADMIN001'),
    ('EMP0161', @pmRoleId, 'ADMIN001'),
    ('EMP0162', @accountHeadRoleId, 'ADMIN001'),
    ('EMP0163', @accountHeadRoleId, 'ADMIN001'),
    ('EMP0163', @pmRoleId, 'ADMIN001'),
    ('EMP0164', @accountHeadRoleId, 'ADMIN001'),
    ('EMP0165', @pmRoleId, 'ADMIN001'),
    ('EMP0165', @accountHeadRoleId, 'ADMIN001'),
    ('EMP0166', @pmRoleId, 'ADMIN001'),
    ('EMP0167', @pmRoleId, 'ADMIN001'),
    ('EMP0168', @accountHeadRoleId, 'ADMIN001'),
    ('EMP0169', @pmRoleId, 'ADMIN001'),
    ('EMP0170', @pmRoleId, 'ADMIN001'),
    ('EMP0171', @pmRoleId, 'ADMIN001'),
    ('EMP0172', @accountHeadRoleId, 'ADMIN001'),
    ('EMP0172', @pmRoleId, 'ADMIN001'),
    ('EMP0173', @opsHeadRoleId, 'ADMIN001'),
    ('EMP0174', @pmRoleId, 'ADMIN001'),
    ('EMP0175', @pmRoleId, 'ADMIN001'),
    ('EMP0176', @pmRoleId, 'ADMIN001'),
    ('EMP0177', @pmRoleId, 'ADMIN001'),
    ('EMP0178', @pmRoleId, 'ADMIN001'),
    ('EMP0179', @accountHeadRoleId, 'ADMIN001'),
    ('EMP0179', @pmRoleId, 'ADMIN001'),
    ('EMP0180', @accountHeadRoleId, 'ADMIN001'),
    ('EMP0181', @accountHeadRoleId, 'ADMIN001'),
    ('EMP0181', @pmRoleId, 'ADMIN001')
) AS source (ecode, role_id, assigned_by)
ON target.ecode = source.ecode AND target.role_id = source.role_id
WHEN NOT MATCHED THEN
    INSERT (ecode, role_id, assigned_by)
    VALUES (source.ecode, source.role_id, source.assigned_by);
GO
