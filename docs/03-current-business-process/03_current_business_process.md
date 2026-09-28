# 03 — Current-State Business Process & Failure Analysis

## 1. How the Organization Tracks Processes Today
Today, the Excel spreadsheet (`DummyData.xlsx`) is manually edited as the single source of truth:

    1. New Deal / Transition (6 Rows)
       └── Someone adds a row in Excel with Process_Status = Transition.
       └── If the PO isn't raised or the PM isn't known, they type "PO_NOT_RAISED" or 
           "INFORMATION_NOT_GIVEN" directly into the Process_Project_Manager cell.

    2. Active Delivery (250 Rows)
       └── Hierarchy columns (Ops_Quality_Head -> CBO -> SBU_Head -> Account_Head -> PM)
           are populated, and Process_Status is set to Live.
       └── Process details (Client_Customer_Name, Process_Project_Name, WPS_Code, Locations, Dates)
           remain blank until manually gathered offline.

    3. Ownership Changes (PM Handover)
       └── When a PM leaves a project or changes role, someone opens the Excel file and
           overwrites the Process_Project_Manager cell with the new PM's name.

    4. Project Closure (10 Rows)
       └── Process_Status is changed to Closed.
       └── On 4 rows (rows 53, 68, 78, 79), the editor deleted the SBU_Head and Account_Head
           names, typed "BUSINESS_CLOSED" in their place, and erased the PM cell completely.

---

## 2. Four Structural Failure Modes of the Spreadsheet

### Failure Mode 1: Unidentifiable Duplicate Rows
Because `Client_Customer_Name`, `Process_Project_Name`, and `WPS_Code` are blank, rows with identical leadership chains cannot be distinguished. For example, `SAMEER_C` (CBO) + `SAURABH_F` (SBU Head) + `POOJA_G` (Account Head) + `RARATA_H` (PM) appears 80 times in `DummyData.xlsx` with identical values across every column.

### Failure Mode 2: Destructive Overwrites (Zero Ownership History)
Overwriting `Process_Project_Manager` in place—or replacing `SBU_Head` and `Account_Head` with `BUSINESS_CLOSED`—destroys historical truth. The business cannot answer:
- *"Who was the Project Manager for this process in Q1 vs. Q2?"*
- *"When did the handover take place, why did it happen, and who approved it?"*

### Failure Mode 3: Conflating Workflow Notes with People
Typing `PO_NOT_RAISED`, `INFORMATION_NOT_GIVEN`, or `BUSINESS_CLOSED` into employee columns breaks referential integrity and prevents automated permission assignment.

### Failure Mode 4: Uncontrolled Access & Orphaned Ownership
- Anyone with file access can alter any vertical's rows without approval.
- When a PM leaves the company, there is no automated check to identify their active processes or revoke their system access once their projects are handed over.