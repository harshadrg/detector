# 01 — Current Data Inventory (DummyData.xlsx)

## 1. Source File Summary
- **File Path:** `docs/01-current-data/DummyData.xlsx`
- **Worksheet Name:** `Sheet1`
- **Dimensions:** 266 data rows by 17 columns
- **Current Role:** Legacy spreadsheet used by business operations to track organizational hierarchy and process ownership across verticals and Strategic Business Units (SBUs).

---

## 2. Quantitative Column Profile (266 Total Rows)

| # | Column Name | Non-Null Count | Null Count | Distinct Raw Values | Sample / Dominant Values |
| :- | :--- | :--- | :--- | :--- | :--- |
| 1 | `Ops_Quality_Head` | 185 | 81 | 8 | `AKASH_B` (72), `ALICE_B` (58), `EVA_B` (23), `CLARA_B` (15), `RAJ_B` (7), `VARUN_B` (5), `-` (4), `ISLA_B` (1) |
| 2 | `CBO` | 266 | 0 | 7 | `SAMEER_C` (82), `NIKHIL_C` (78), `ROHIT_C` (76), `LUCY_C` (20), `FREYA_C` (7), `-` (2), `SARAH_C` (1) |
| 3 | `Verticals` | 266 | 0 | 6 | `VERTICAL_2_MEU` (83), `TECH&DIGITAL` (82), `VERTICAL_1_BFSI` (78), `VERTICAL_3_EMERGING` (20), `-` (2), `TECH&_DIGITAL` (1) |
| 4 | `SBU_Name` | 263 | 3 | 4 | `MEU` (83), `TECH&DIGITAL` (82), `BFSI` (78), `EMERGING` (20), `NaN` (3) |
| 5 | `SBU_Head` | 266 | 0 | 9 | `SCARLETT_F` (83), `SAURABH_F` (81), `ABHINAV_F` (53), `HARSH_F` (21), `ELLIE_F` (20), `BUSINESS_CLOSED` (4), `-` (2), `AMIT_F` (1), `DAISY_F` (1) |
| 6 | `Account_Head` | 266 | 0 | 33 | `POOJA_G` (81), `VOILET_G` (47), `DANIEL_G` (23), `VARSHA_G` (17), `HANNAH_G` (16), `BUSINESS_CLOSED` (4), `-` (2), `INFORMATION_NOT_GIVEN` (1) |
| 7 | `Process_Project_Manager` | 262 | 4 | 54 | `RARATA_H` (81), `UMJALI_H` (21), `FIAN_H` (12), `TEMAAR_H` (11), `VARSHA_G` (10), `PO_NOT_RAISED` (2), `INFORMATION_NOT_GIVEN` (2), `NaN` (4) |
| 8 | `Client_Customer_Name` | 0 | 266 | 0 | 100% Empty (`NaN`) |
| 9 | `Process_Project_Name` | 0 | 266 | 0 | 100% Empty (`NaN`) |
| 10 | `WPS_Code` | 0 | 266 | 0 | 100% Empty (`NaN`) |
| 11 | `Process_Status` | 266 | 0 | 3 | `Live` (250), `Closed` (10), `Transition` (6) |
| 12 | `Client_Customer_Type` | 266 | 0 | 4 | `Domestic` (175), `Domestic_Client` (80), `International` (7), `-` (4) |
| 13 | `Process_Project_Location_State` | 0 | 266 | 0 | 100% Empty (`NaN`) |
| 14 | `Process_Project_Location_City` | 0 | 266 | 0 | 100% Empty (`NaN`) |
| 15 | `Process_Project_Location` | 0 | 266 | 0 | 100% Empty (`NaN`) |
| 16 | `Project_Started_on` | 0 | 266 | 0 | 100% Empty (`NaN`) |
| 17 | `Project_Ended_on` | 0 | 266 | 0 | 100% Empty (`NaN`) |

---

## 3. Key Empirical Findings
1. **81 Real Unique Employee Names + 4 Status Sentinel Strings:** Across all 5 hierarchy columns (`Ops_Quality_Head`, `CBO`, `SBU_Head`, `Account_Head`, `Process_Project_Manager`), there are 85 unique strings: 81 real people and 4 status notes (`-`, `BUSINESS_CLOSED`, `INFORMATION_NOT_GIVEN`, `PO_NOT_RAISED`).
2. **Multi-Role Overlap (Dual-Hatting):**
   - On 52 rows, the exact same person is assigned as both `Account_Head` and `Process_Project_Manager` (20 distinct people: `ALEXANDER_G`, `ANNA_G`, `BENJAMIN_G`, `DIYA_G`, `HENRY_G`, `ISHA_G`, `JAMES_G`, `JULIA_G`, `LEO_G`, `LUCAS_G`, `MEERA_G`, `MOHIT_G`, `NANDINI_G`, `PRANAV_G`, `RIYA_G`, `SNEHA_G`, `STELLA_G`, `VARSHA_G`, `VIVEK_G`, `WILLIAM_G`).
   - On row 110, `DAISY_F` is both `SBU_Head` and `Account_Head`.
3. **Missing Identity Data:** The sheet contains no `ecode`, `email`, or employee status, and all 8 process identity/location/date columns are completely unpopulated (`NaN`).