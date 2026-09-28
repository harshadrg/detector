-- ============================================================================
-- Migration: 004_seed_platform_data.sql
-- Description: Seed System Modules, Platform & Organizational Roles,
--              Permissions Catalog, and Initial Role-Permission Mappings
-- Module: CORE / BPMS
-- ============================================================================

-- 1. Seed System Modules (CORE, BPMS)
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

-- 2. Seed System Roles (Administrative + Organizational)
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

-- 3. Seed Permissions Catalog
DECLARE @coreModuleId INT = (SELECT module_id FROM dbo.System_Modules WHERE module_code = 'CORE');
DECLARE @bpmsModuleId INT = (SELECT module_id FROM dbo.System_Modules WHERE module_code = 'BPMS');

MERGE dbo.Permissions AS target
USING (VALUES
    -- Core Permissions
    (@coreModuleId, 'CORE.USER.VIEW', 'View employee roster and profile information'),
    (@coreModuleId, 'CORE.USER.MANAGE', 'Create, update, and manage employee active status'),
    (@coreModuleId, 'CORE.ROLE.ASSIGN_ADMIN', 'Assign or revoke administrative platform roles'),
    (@coreModuleId, 'CORE.ROLE.ASSIGN_ORG', 'Assign or revoke organizational hierarchy roles'),
    (@coreModuleId, 'CORE.CONTEXT.SWITCH', 'Simulate role view in UI preview context'),
    (@coreModuleId, 'CORE.AUDIT.VIEW_GLOBAL', 'Inspect global immutable platform audit ledger'),
    (@coreModuleId, 'CORE.NOTIFICATION.VIEW', 'View and mark personal notifications'),

    -- BPMS Module Permissions
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

-- 4. Seed Role-Permission Mappings (RBAC Matrix)
-- Clear existing role-permission mappings and rebuild from deterministic definition
DECLARE @RolePermMap TABLE (
    role_code VARCHAR(50),
    permission_code VARCHAR(100)
);

-- SUPER_ADMIN: Holds all permissions across platform and modules
INSERT INTO @RolePermMap (role_code, permission_code)
SELECT 'SUPER_ADMIN', permission_code FROM dbo.Permissions;

-- BPMS_ADMIN: Complete BPMS governance + organizational role assignment & user viewing
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

-- OPS_QUALITY_HEAD: Hierarchy-scoped view and audit
INSERT INTO @RolePermMap (role_code, permission_code)
VALUES
    ('OPS_QUALITY_HEAD', 'CORE.USER.VIEW'),
    ('OPS_QUALITY_HEAD', 'CORE.NOTIFICATION.VIEW'),
    ('OPS_QUALITY_HEAD', 'BPMS.PROCESS.VIEW'),
    ('OPS_QUALITY_HEAD', 'BPMS.AUDIT.VIEW');

-- CBO: Hierarchy-scoped view and audit
INSERT INTO @RolePermMap (role_code, permission_code)
VALUES
    ('CBO', 'CORE.USER.VIEW'),
    ('CBO', 'CORE.NOTIFICATION.VIEW'),
    ('CBO', 'BPMS.PROCESS.VIEW'),
    ('CBO', 'BPMS.AUDIT.VIEW');

-- SBU_HEAD: Hierarchy-scoped view, handover requests, and deactivation requests
INSERT INTO @RolePermMap (role_code, permission_code)
VALUES
    ('SBU_HEAD', 'CORE.USER.VIEW'),
    ('SBU_HEAD', 'CORE.NOTIFICATION.VIEW'),
    ('SBU_HEAD', 'BPMS.PROCESS.VIEW'),
    ('SBU_HEAD', 'BPMS.HANDOVER.REQUEST'),
    ('SBU_HEAD', 'BPMS.PROCESS.DEACTIVATE_REQUEST'),
    ('SBU_HEAD', 'BPMS.AUDIT.VIEW');

-- ACCOUNT_HEAD: Hierarchy-scoped view, handover requests, and deactivation requests
INSERT INTO @RolePermMap (role_code, permission_code)
VALUES
    ('ACCOUNT_HEAD', 'CORE.USER.VIEW'),
    ('ACCOUNT_HEAD', 'CORE.NOTIFICATION.VIEW'),
    ('ACCOUNT_HEAD', 'BPMS.PROCESS.VIEW'),
    ('ACCOUNT_HEAD', 'BPMS.HANDOVER.REQUEST'),
    ('ACCOUNT_HEAD', 'BPMS.PROCESS.DEACTIVATE_REQUEST'),
    ('ACCOUNT_HEAD', 'BPMS.AUDIT.VIEW');

-- PROJECT_MANAGER: Own process view, change requests (draft/submit), handover requests, deactivation requests
INSERT INTO @RolePermMap (role_code, permission_code)
VALUES
    ('PROJECT_MANAGER', 'CORE.NOTIFICATION.VIEW'),
    ('PROJECT_MANAGER', 'BPMS.PROCESS.VIEW'),
    ('PROJECT_MANAGER', 'BPMS.CHANGE_REQUEST.DRAFT'),
    ('PROJECT_MANAGER', 'BPMS.CHANGE_REQUEST.SUBMIT'),
    ('PROJECT_MANAGER', 'BPMS.HANDOVER.REQUEST'),
    ('PROJECT_MANAGER', 'BPMS.PROCESS.DEACTIVATE_REQUEST'),
    ('PROJECT_MANAGER', 'BPMS.AUDIT.VIEW');

-- Merge into Role_Permissions
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
