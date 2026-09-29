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
