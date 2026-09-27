---
trigger: always_on
---

---

trigger: always_on
description: "Whenever repository files are changed, inspect the actual diff, determine the logical change groups, and provide exact Git staging and commit commands using only the files changed by the current task. Commit messages must document what changed, why it changed, and important architectural, dependency, security, or behavioral implications."
------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

# Git Commit Documentation Rule

Whenever you create, modify, delete, move, rename, or restructure files in this repository, inspect the resulting Git state before finishing the task.

The goal is to leave behind Git history that explains the implementation decision clearly.

Do not provide generic commit messages such as:

```text
update project
fix code
changes
setup
misc
```

Do not describe changes that were not actually made.

Do not infer implementation details that cannot be verified from the repository diff.

---

# Required Process

After implementing the requested changes:

1. Run `git status --short`.
2. Inspect the actual diff.
3. Use `git diff` and, when necessary, `git diff -- <specific-file>`.
4. Identify which files were changed by the current task.
5. Separate unrelated pre-existing user changes from the current task.
6. Group the current changes conceptually.
7. Determine what was actually implemented.
8. Determine why it was implemented.
9. Identify important architectural, dependency, security, configuration, or behavioral implications.
10. Produce exact Git staging and commit commands.

Do not stage files that were changed for unrelated reasons.

Do not overwrite or discard user changes.

---

# Staging Rules

The staging command is part of the required output.

## Rule 1 — Never blindly use `git add .`

Do not normally recommend:

```bash
git add .
```

because it may stage unrelated user changes, generated files, secrets, temporary files, or work from another task.

Prefer explicit paths.

---

## Rule 2 — Audit, dependency, and repository-configuration changes

When the task consists of a coherent repository-level audit or configuration change, it is acceptable to stage the exact relevant files together.

Examples:

```bash
git add package.json package-lock.json
```

or:

```bash
git add package.json package-lock.json eslint.config.js oxlint.config.json
```

or:

```bash
git add apps/client/package.json apps/server/package.json package-lock.json
```

Only include files actually changed by the current task.

Typical audit/configuration files may include:

```text
package.json
package-lock.json
.npmrc
eslint.config.*
oxlint.config.*
tsconfig*.json
vite.config.*
.env.example
.github/*
```

Do not include these merely because they exist. Include only changed files relevant to the current task.

---

## Rule 3 — Application/source-code changes

For source-code changes, stage only the specific files changed by the task.

Example:

```bash
git add apps/client/src/components/Table.tsx
git add apps/client/src/lib/api.ts
```

or:

```bash
git add apps/server/src/routes/upload.js
git add apps/server/src/middleware/auth.js
```

Do not stage the whole application directory unless the task genuinely changed the whole directory.

---

## Rule 4 — Mixed changes

If the task contains logically separate changes, prefer separate staging groups and, when appropriate, separate commits.

Example:

```bash
git add package.json package-lock.json
git commit -m "build(deps): align workspace dependency versions" \
  -m "Align shared direct dependencies across client and server and update the lockfile after dependency normalization."

git add apps/server/src/routes/upload.js
git commit -m "fix(server): validate uploaded file constraints" \
  -m "Add server-side upload validation to enforce the application's file handling requirements."
```

Do not create multiple commits merely for the sake of splitting files. Split only when the changes represent genuinely different logical units.

---

# Commit Pathspecs

When useful, a commit may target specific paths directly:

```bash
git commit -m "..." -- apps/client/src/foo.ts apps/server/src/bar.ts
```

However, explicit `git add` followed by `git commit` is preferred when the repository may contain unrelated working-tree changes because it makes the staging boundary visible and reviewable.

---

# Required Commit Format

Prefer Conventional Commits:

```bash
git commit -m "<type>(<scope>): <clear implementation summary>" \
  -m "<detailed explanation of what was implemented and why>"
```

Use an appropriate type:

```text
feat
fix
refactor
build
chore
docs
test
perf
security
ci
```

Use a meaningful scope when appropriate:

```text
monorepo
client
server
shared
deps
lint
tooling
config
auth
api
database
```

---

# Commit Message Requirements

The first message must answer:

> What changed?

The second message must answer:

> Why was it changed?

When useful, also explain:

* architectural decisions
* dependency ownership
* dependency upgrades
* new or removed workspace packages
* security-related changes
* configuration changes
* client/server boundary changes
* compatibility considerations
* build/tooling implications
* important behavior intentionally preserved

Keep the message concise enough to remain useful in:

```bash
git log --oneline
```

but detailed enough to preserve important engineering context.

---

# Monorepo-Specific Documentation

When changes affect npm workspace architecture, explicitly document relevant decisions.

Examples:

```text
apps/client
apps/server
packages/*
root tooling
npm workspaces
dependency ownership
shared packages
ESLint
Oxlint
Vite
TypeScript
.npmrc
```

If a dependency was deliberately kept in a workspace rather than moved to the root, mention why when that decision matters.

Example:

```text
Keep runtime dependencies declared in their consuming workspace rather than relying on root hoisting, so each package has an explicit dependency contract.
```

If a shared package was created, explain:

* what it contains
* which workspaces consume it
* why it is a workspace
* why duplicating the code was undesirable

If no shared package was created because there is no genuine shared source code, do not claim one was added.

---

# Dependency Changes

If dependencies were added, removed, moved, or upgraded:

* name important dependencies
* state where they were changed
* explain why
* mention security or compatibility reasons when relevant

Do not list every unchanged dependency.

For example:

```text
Upgrade the client and server to the same compatible stable release of a shared dependency and regenerate package-lock.json.
```

rather than dumping the entire dependency list.

---

# Security Changes

If the change involved:

* a vulnerability
* security advisory
* malicious-package investigation
* dependency integrity
* package provenance
* secret handling
* environment-variable boundaries
* file-upload validation
* authentication or authorization

make that clear in the commit body.

Do not claim:

```text
fully secure
100% safe
hack-proof
```

Use precise language.

---

# Dependency Audit Commit Example

When a task audits and updates dependencies without application-source changes:

```bash
git add package.json package-lock.json
git commit -m "build(deps): refresh monorepo dependencies" \
  -m "Upgrade workspace dependencies to current compatible stable releases, align shared direct dependency versions where possible, and regenerate the root lockfile after validation and security checks."
```

Only use this exact file list when those are the actual changed files.

If ESLint/Oxlint configuration also changed:

```bash
git add package.json package-lock.json eslint.config.js oxlint.config.json
git commit -m "build(tooling): refresh monorepo dependencies and lint configuration" \
  -m "Update repository tooling alongside dependency upgrades and keep client, server, and shared workspace linting responsibilities explicit."
```

---

# Source-Code Commit Example

For a specific code fix:

```bash
git add apps/server/src/routes/upload.js
git add apps/server/src/middleware/upload.js

git commit -m "fix(server): enforce upload validation limits" \
  -m "Add explicit server-side file and upload constraints to preserve the existing upload flow while reducing unsafe input handling."
```

Only include the files actually changed.

---

# Configuration Commit Example

For a monorepo configuration change:

```bash
git add package.json package-lock.json tsconfig.base.json eslint.config.js

git commit -m "chore(monorepo): centralize repository tooling" \
  -m "Keep npm workspace configuration and repository-wide development tooling at the root while preserving explicit dependency ownership inside client and server workspaces."
```

Again, use only files actually changed.

---

# Do Not Automatically Commit

Do NOT automatically run:

```bash
git commit
```

Do NOT automatically run:

```bash
git add .
```

unless the user explicitly requests broad staging and there is no risk of including unrelated changes.

Normally provide the exact commands for the user to review and execute.

---

# Protect Existing User Changes

Before staging anything, inspect:

```bash
git status --short
git diff
```

If unrelated user changes already exist:

* do not include them
* do not reset them
* do not restore them
* do not overwrite them
* stage only files belonging to the current task

If a changed file contains both user work and current-task work, do not blindly stage the entire file if that would include unrelated edits.

Prefer a more precise staging strategy when needed.

---

# Generated Files

Treat generated files carefully.

Examples:

```text
package-lock.json
dist/
build/
coverage/
generated/
```

Include generated files only when they are expected repository artifacts and the current task intentionally changed them.

Do not commit generated build output merely because a build command created it unless the repository intentionally tracks that output.

---

# Secrets and Sensitive Files

Never include secrets in the staging or commit commands.

Do not stage:

```text
.env
.env.local
private keys
credentials
tokens
generated secret files
```

Unless the repository explicitly and safely tracks a particular example/template file such as:

```text
.env.example
```

---

# Exact Required Output

At the end of every task that changed repository files, provide:

```text
Git staging:
<exact git add command(s)>

Git commit:
<exact git commit command>
```

For example:

```text
Git staging:
git add package.json package-lock.json eslint.config.js

Git commit:
git commit -m "build(monorepo): align workspace tooling" \
  -m "Update repository tooling and lockfile after validating the client and server workspaces, while keeping runtime dependencies explicitly owned by their consuming workspaces."
```

The commands must describe the **actual current-task changes**.

Do not provide commands for files that were not changed.

Do not provide a generic commit message.

---

# No Changes

If no repository files were changed, do not provide a commit command.

---

# Final Quality Check

Before producing the Git commands, verify:

```bash
git status --short
git diff
```

The proposed staging paths must match the actual files changed by the current task.

The commit subject must accurately describe the implementation.

The commit body must explain why the change was made.

## The final Git history should allow a future developer to understand the engineering decision without reconstructing the entire task from scratch.
