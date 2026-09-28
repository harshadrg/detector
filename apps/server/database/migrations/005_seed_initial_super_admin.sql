-- ============================================================================
-- Migration: 005_seed_initial_super_admin.sql
-- Description: Provision initial platform bootstrap super administrator (ADMIN001)
-- Module: CORE
-- ============================================================================

-- 1. Ensure initial super admin employee exists
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

-- 2. Ensure super admin credentials identity exists with scrypt password hash
-- Default bootstrap password: Admin@Detector2026!
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

-- 3. Assign SUPER_ADMIN role to ADMIN001
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
