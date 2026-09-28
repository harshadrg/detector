-- ============================================================================
-- Migration: 001_core_platform_schema.sql
-- Description: Core Platform Tables, Constraints, Indexes & Immutability Trigger
-- Module: CORE
-- ============================================================================

-- 1. Employees (Central Employee Directory)
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

-- 2. Employee_Identities (Authentication Credentials & Session Invalidation)
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

-- 3. System_Modules (Modular Architecture Registry: CORE, BPMS, etc.)
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

-- 4. Roles (Separation of PLATFORM_ADMIN, MODULE_ADMIN, ORGANIZATIONAL)
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

-- 5. Permissions (Granular Permission Tokens)
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

-- 6. Role_Permissions (Role-to-Permission Mappings)
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

-- 7. Employee_Role_Mapping (Many-to-Many Multi-Role & Dual-Hatting)
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

-- 8. Notifications (Polymorphic Cross-Module Alerting)
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

-- 9. Audit_Events (Immutable Platform Ledger)
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

-- 10. Audit_Events Immutability Trigger (Strict Append-Only Enforcement)
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
