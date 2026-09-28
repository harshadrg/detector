# 02 — Detector Data Dictionary & Migration Mapping

## 1. Column-by-Column Specification

| Excel Column | Data Type | Nullable in Excel? | Nullable in Detector? | Detector Domain Concept | Target Table & Column | Cleaning & Validation Rule |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `Ops_Quality_Head` | String | Yes (81 nulls) | Yes | Operations & Quality Head overseeing the process | `Process_Ownership` (`role_type = 'OPS_QUALITY_HEAD'`) | Convert `-` and `NaN` to `NULL`. Resolve name against `Employees`. |
| `CBO` | String | No | Yes (in `TRANSITION`) | Chief Business Officer overseeing the vertical | `Process_Ownership` (`role_type = 'CBO'`) | Convert `-` to `NULL`. Resolve name against `Employees`. |
| `Verticals` | String | No | No | Business Vertical classification | `Verticals.vertical_code` | Normalize `TECH&_DIGITAL` to `TECH&DIGITAL`. Reject `-` unless status is `TRANSITION`. |
| `SBU_Name` | String | Yes (3 nulls) | No | Strategic Business Unit | `SBUs.sbu_code` | Backfill row 261 `NaN` to `TECH&DIGITAL` from `Verticals`. |
| `SBU_Head` | String | No | Yes (if `CLOSED`/`TRANSITION`) | Executive owner of the SBU | `Process_Ownership` (`role_type = 'SBU_HEAD'`) | Strip `BUSINESS_CLOSED` and `-` to `NULL`; store `BUSINESS_CLOSED` in `status_reason`. |
| `Account_Head` | String | No | Yes (if `TRANSITION`) | Account supervisor managing PMs | `Process_Ownership` (`role_type = 'ACCOUNT_HEAD'`) | Strip `BUSINESS_CLOSED`, `INFORMATION_NOT_GIVEN`, `-` to `NULL`. Resolve against `Employees`. |
| `Process_Project_Manager` | String | Yes (4 nulls) | Yes (in `TRANSITION`) | Operational Project Manager (PM) | `Process_Ownership` (`role_type = 'PM'`) | Strip `PO_NOT_RAISED`, `INFORMATION_NOT_GIVEN` to `status_reason`. Required when status is `ACTIVE`. |
| `Client_Customer_Name` | String | Yes (266 nulls) | Yes (in `DRAFT`/`TRANSITION`) | Client organization name | `Clients.client_name` / `Process_Registry.client_id` | Required before a process change request can be `APPROVED` as `ACTIVE`. |
| `Process_Project_Name` | String | Yes (266 nulls) | Yes (in `DRAFT`/`TRANSITION`) | Specific project or process name | `Process_Registry.process_name` | Required before a process change request can be `APPROVED` as `ACTIVE`. |
| `WPS_Code` | String | Yes (266 nulls) | Yes (in `DRAFT`/`TRANSITION`) | Unique business key per Process + Location | `Process_Registry.wps_code` | Must be unique across `Process_Registry` when non-null. |
| `Process_Status` | String | No | No | Operational lifecycle state | `Process_Registry.status` | Map `Live` to `ACTIVE`, `Closed` to `INACTIVE`, `Transition` to `TRANSITION`. |
| `Client_Customer_Type` | String | No | Yes | Commercial geography classification | `Process_Registry.client_type` | Normalize `Domestic` and `Domestic_Client` to `DOMESTIC`; `International` to `INTERNATIONAL`; `-` to `NULL`. |
| `Process_Project_Location_State` | String | Yes (266 nulls) | Yes (in `DRAFT`/`TRANSITION`) | Delivery facility state | `Locations.state` | Collected via PM Process Form / Change Request. |
| `Process_Project_Location_City` | String | Yes (266 nulls) | Yes (in `DRAFT`/`TRANSITION`) | Delivery facility city | `Locations.city` | Collected via PM Process Form / Change Request. |
| `Process_Project_Location` | String | Yes (266 nulls) | Yes (in `DRAFT`/`TRANSITION`) | Delivery center / facility name | `Locations.facility_name` | Collected via PM Process Form / Change Request. |
| `Project_Started_on` | Date | Yes (266 nulls) | Yes (in `DRAFT`/`TRANSITION`) | Operational start date | `Process_Registry.started_on` | ISO Date (`YYYY-MM-DD`). Required when `status = 'ACTIVE'`. |
| `Project_Ended_on` | Date | Yes (266 nulls) | Yes | Operational closure date | `Process_Registry.ended_on` | ISO Date (`YYYY-MM-DD`). Required when `status = 'INACTIVE'`. Must be `>= started_on`. |

---

## 2. Required Master Entities Missing from DummyData.xlsx

### A. Employee Master (`Employees`)
Because `DummyData.xlsx` only contains display tokens (`RARATA_H`, `POOJA_G`), Detector requires an Employee Master containing:
- `ecode` (`VARCHAR(20)` Primary Key, e.g., `E1001`)
- `name` (`NVARCHAR(100)`, e.g., `RARATA_H` or full legal name)
- `email` (`VARCHAR(150)` Unique corporate email)
- `status` (`ACTIVE` | `INACTIVE`)

### B. Canonical Process Identifier (`process_code` & `wps_code`)
- `registry_id`: Internal auto-increment surrogate primary key.
- `process_code`: Immutable system-generated identifier (`PRC-0001` through `PRC-0266`) assigned on initial migration so even rows with blank `WPS_Code` have a distinct, trackable identity.
- `wps_code`: Unique operational code once the PM completes the process form.