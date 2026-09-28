-- ============================================================================
-- Migration: 002_master_tables_schema.sql
-- Description: Organizational Master Data Tables (Verticals, SBUs, Clients, Locations)
-- Module: MASTER
-- ============================================================================

-- 1. Verticals (Business Verticals)
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

-- 2. SBUs (Strategic Business Units, mapped to Verticals)
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

-- 3. Clients (Enterprise Clients & Geography Classification)
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

-- 4. Locations (Delivery Facilities: State, City, Facility Name)
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
