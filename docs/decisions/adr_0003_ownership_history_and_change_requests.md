# ADR-0003: Dedicated Process Ownership History & Non-Destructive Change Requests

- **Status:** Accepted
- **Context:** Storing only current `pm_ecode` and `approval_status` columns inside `Process_Registry` makes quarterly ownership reporting ("Who managed this process in Q1 vs Q2?") difficult and risks overwriting approved data during rejected edits.
- **Decision:**
  1. Store all hierarchy assignments in `Process_Ownership` with `effective_from`, `effective_to`, and `is_current`.
  2. Store proposed edits and closures in `Process_Change_Requests` and handovers in `Process_Handover_Requests`. Only approved requests mutate `Process_Registry` or `Process_Ownership`.
- **Consequences:** `Process_Registry` always reflects clean, approved truth, and point-in-time historical ownership queries execute with simple indexed SQL predicates.