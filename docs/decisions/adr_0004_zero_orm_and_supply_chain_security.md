# ADR-0004: Zero-ORM Parameterized T-SQL, Staged Excel Ingestion, and Supply-Chain Rules

- **Status:** Accepted
- **Context:** Detector runs in a high-compliance, air-gapped enterprise environment with strict protection against SQL injection, path traversal, and third-party supply-chain vulnerabilities.
- **Decision:**
  1. Use raw parameterized T-SQL via `mssql` (`request.input()`) instead of an ORM.
  2. Ban `ExcelJS` and `axios`; use `read-excel-file`, `write-excel-file`, and native `fetch` with `save-exact=true` in `.npmrc`.
  3. Stage all Excel imports into `Import_Batches` and `Import_Staging_Rows` for validation and preview before committing to live tables.
- **Consequences:** Deterministic SQL execution, zero unreviewed spreadsheet writes into production tables, and minimal dependency attack surface.