---
trigger: always_on
---

---

trigger: always_on
description: "Whenever making changes to this repository, analyze the resulting changes and provide a detailed Git commit command that documents what was implemented, why it was implemented, and any important architectural or dependency implications."
-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

# Git Commit Documentation Rule

Whenever you create, modify, delete, move, or restructure files in this repository, you must analyze the resulting changes before finishing the task.

Do not provide a generic commit message such as:

```text
update project
fix code
changes
setup
misc
```

The commit message must provide useful historical context for someone reading the Git history months or years later.

## Required process

After implementing the requested changes:

1. Inspect the actual changes.
2. Review the resulting diff.
3. Group related changes conceptually.
4. Determine what was actually implemented.
5. Determine why the change was necessary.
6. Identify important architectural, dependency, configuration, security, or behavioral implications.
7. Produce a Git commit command describing the change.

Do not describe changes that were not actually made.

Do not infer implementation details that cannot be verified from the diff.

## Required commit format

Prefer Conventional Commits:

```bash
git commit -m "<type>(<scope>): <clear implementation summary>" \
  -m "<detailed explanation of what was implemented and why>"
```

Use an appropriate `<type>`, such as:

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

Use a meaningful scope when appropriate, such as:

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

## Commit message requirements

The first message must answer:

> What changed?

The second message must answer:

> Why was it changed?

When useful, also explain:

* architectural decisions
* dependency placement
* new or removed workspace packages
* security-related changes
* configuration changes
* client/server boundary changes
* compatibility considerations
* build or tooling implications
* important behavior that was intentionally preserved

Do not make the commit message unnecessarily long.

The objective is:

```text
concise summary
+
useful historical context
```

## Monorepo-specific requirements

When changes affect the npm monorepo architecture, explicitly document relevant decisions.

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
.npmrc
```

If a package was deliberately kept inside a workspace rather than moved to the root, mention why when that decision matters.

If a shared package was created, explain:

* what it contains
* which workspaces consume it
* why it is a workspace instead of duplicated code

If no shared package was created because there is no genuine shared source code, do not claim that a shared package was added.

## Dependency changes

If dependencies were added, removed, moved, or upgraded:

* name the important dependencies
* state where they were added
* explain why
* mention security or compatibility reasons when relevant

Do not list every unchanged dependency.

## Security changes

If the change was motivated by a vulnerability, security advisory, dependency risk, secret-handling issue, or environment boundary, make that clear in the commit body.

Do not claim that a change makes the project completely secure.

## No automatic commit

Do NOT automatically run:

```bash
git commit
```

unless the user explicitly asks you to create the commit.

Normally provide the command for the user to review and execute.

## Exact output

At the end of every task that changed repository files, provide:

```text
Git commit:
<the exact git commit command>
```

The command must describe the actual changes made during the current task.

Do not provide a commit command if no repository files were changed.

## Important

The commit message is part of the engineering documentation.

A future developer should be able to read:

```bash
git log
```

and understand the implementation decision without having to reconstruct the entire reason from scratch.
