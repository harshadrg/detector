-- ============================================================================
-- Migration: 006_seed_master_data.sql
-- Description: Seed BPMS master permissions, baseline Verticals, SBUs, Clients, and Locations
-- Module: MASTER / BPMS
-- ============================================================================

-- 1. Seed Master Data Permissions
DECLARE @bpmsModuleId INT = (SELECT module_id FROM dbo.System_Modules WHERE module_code = 'BPMS');

MERGE dbo.Permissions AS target
USING (VALUES
    (@bpmsModuleId, 'BPMS.MASTER.VIEW', 'View organizational master data catalogs: Verticals, SBUs, Clients, Locations'),
    (@bpmsModuleId, 'BPMS.MASTER.MANAGE', 'Create, update, and manage organizational master records')
) AS source (module_id, permission_code, description)
ON target.permission_code = source.permission_code
WHEN MATCHED THEN
    UPDATE SET target.description = source.description, target.module_id = source.module_id
WHEN NOT MATCHED THEN
    INSERT (module_id, permission_code, description)
    VALUES (source.module_id, source.permission_code, source.description);
GO

-- 2. Map Permissions to Roles
DECLARE @RolePermMap TABLE (
    role_code VARCHAR(50),
    permission_code VARCHAR(100)
);

INSERT INTO @RolePermMap (role_code, permission_code)
VALUES
    -- Administrative Roles: Full master management & viewing
    ('SUPER_ADMIN', 'BPMS.MASTER.VIEW'),
    ('SUPER_ADMIN', 'BPMS.MASTER.MANAGE'),
    ('BPMS_ADMIN', 'BPMS.MASTER.VIEW'),
    ('BPMS_ADMIN', 'BPMS.MASTER.MANAGE'),

    -- Organizational Hierarchy Roles: Read-only master lookup access
    ('OPS_QUALITY_HEAD', 'BPMS.MASTER.VIEW'),
    ('CBO', 'BPMS.MASTER.VIEW'),
    ('SBU_HEAD', 'BPMS.MASTER.VIEW'),
    ('ACCOUNT_HEAD', 'BPMS.MASTER.VIEW'),
    ('PROJECT_MANAGER', 'BPMS.MASTER.VIEW');

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

-- 3. Seed Baseline Verticals (Derived from DummyData.xlsx)
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

-- 4. Seed Baseline SBUs (Mapped to Verticals)
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

-- 5. Seed Baseline Clients (Domestic & International)
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

-- 6. Seed Baseline Locations (Delivery Centers)
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
