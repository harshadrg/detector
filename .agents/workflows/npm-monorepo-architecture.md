---
description: For npm monorepos using npm workspaces. Covers setup, package linking, dependency install/update, scripts, publishing, versioning, troubleshooting, and dependency queries. Use official npm CLI v12 docs.
---

# npm Monorepo Architecture

Reference for building and scaling a monorepo on npm's native `workspaces` feature (CLI v12) — no Lerna, Nx, or Turborepo required, though everything here is also the substrate those tools sit on.

This file covers the essential setup path end to end. For depth on any one area, read the matching file in `references/`:

- `references/defining-and-configuring.md` — the `workspaces` field, folder layout, scaffolding, hoisting/`install-strategy`, `packageExtensions`, `.npm-extension`
- `references/dependency-management.md` — installing into one workspace vs. all, cross-workspace deps, dedupe, audit, outdated, explain, update, peer deps, supply-chain controls
- `references/scripts-and-execution.md` — `npm run` across workspaces, run order, the `prepare`-concurrency trap, `npm exec`/`npx`
- `references/publishing-and-versioning.md` — publishing selected or all workspaces, per-package versioning, scope, provenance, SBOMs
- `references/querying-and-tooling.md` — `npm query` dependency selectors, `npm pkg --ws`, `npm ls`, `npm ci` in CI

## Setting up a new monorepo

1. **Root `package.json`** — mark it private (it's not meant to be published) and declare workspaces:

   ```json
   {
     "name": "my-monorepo",
     "private": true,
     "workspaces": ["packages/*"]
   }
   ```

   A glob (`"packages/*"`) auto-picks up new packages; explicit paths (`["packages/core", "packages/cli"]`) give tighter control. Either way, every matched folder needs its own `package.json` — one that's missing is quietly not treated as a workspace, no error.

2. **Scaffold each package** with `npm init -w`, which creates the folder, a `package.json`, and registers the path in the root's `workspaces` array in one step:

   ```bash
   npm init -w ./packages/core
   npm init -w ./packages/cli
   ```

   This also composes with real scaffolding tools: `npm init -w packages/my-app react-app .` drops a fresh `create-react-app` output straight into a new workspace.

3. **Wire cross-workspace dependencies** through the installer, not by hand:

   ```bash
   npm install core -w cli
   ```

   npm recognizes `core` as a sibling workspace, symlinks it instead of hitting the registry, and still writes a normal semver range (e.g. `"core": "^1.0.0"`) into `cli`'s `package.json` — so the dependency behaves identically once `core` is actually published.

4. **Install once from the root**: `npm install`. This is what actually creates the `node_modules` symlinks for every workspace — scaffolding alone doesn't.

5. **Consume a workspace by its package name**, never a relative path — `require('core')`/`import 'core'`, matching the `name` field in `core`'s own `package.json`, not the folder name. This is also what makes the transition from local workspace to a real published dependency invisible to consuming code.

## Everyday commands

| Task | Command |
|---|---|
| Run a script in one workspace | `npm run build -w cli` |
| Run a script in several | `npm test -w a -w b` |
| Run a script everywhere, skipping packages that lack it | `npm run lint --workspaces --if-present` |
| Add a dependency to one workspace | `npm install lodash -w cli` |
| Install everything + link workspaces | `npm install` (root) |
| Clean, reproducible install (CI) | `npm ci` |
| Find/reduce duplicate installs | `npm dedupe` (or `npm find-dupes` for a dry run) |
| See what's outdated | `npm outdated` (shows root + workspace direct deps by default) |
| Security scan | `npm audit`, `npm audit fix` |
| Publish one or all workspaces | `npm publish -w cli` / `npm publish --workspaces` |
| Bump a version | `npm version patch -w cli` |
| Read/write package.json fields across workspaces | `npm pkg get name version --ws` |
| Query the dependency graph | `npm query ".workspace"` |

## Scaling considerations (the "architecture" part)

These are the decisions that matter more as a monorepo grows past a handful of packages — each is unpacked further in `references/`:

- **Install topology**: the default `hoisted` layout is fine at small scale, but `install-strategy=linked` (isolated, unhoisted) surfaces "phantom" dependencies — packages silently relying on something hoisted in by a sibling — before they become a production incident. Worth running in CI even if `hoisted` is used for local dev speed.
- **Build order across packages**: multi-workspace commands run in the order workspaces are *listed* in the root `workspaces` array, not alphabetically. `prepare` scripts specifically run **concurrently** across all workspaces — a real gotcha if package B needs package A built first. See `references/scripts-and-execution.md`.
- **Duplication control**: `npm dedupe`, `--prefer-dedupe`, and `npm query "#react:not(:deduped)" --expect-result-count=1` are how you keep a single copy of a hot dependency (React, TypeScript) from silently forking across the tree as packages evolve independently.
- **Manifest repairs at scale**: `packageExtensions` (declarative) and `.npm-extension.mjs`/`.cjs` (imperative) let the *root* patch a third-party package's broken `peerDependencies` without a fork — both are root-only, both show up in `npm ls`/`npm explain` for auditability.
- **Supply-chain posture**: `allow-scripts`/`allowScripts`, `min-release-age`, and SBOM generation (`npm sbom`) are the v12-era controls for a large org that can't manually vet every install script or accept a dependency the hour it's published.
- **Versioning strategy**: npm has no built-in "independent vs. fixed versioning" policy the way Lerna/Changesets do — `npm version <bump> --workspaces` bumps every workspace together; per-package release cadence is a convention you enforce with `-w`, not a built-in mode.

## Source

Official npm CLI v12 docs: [Workspaces](https://docs.npmjs.com/cli/v12/using-npm/workspaces), [Config](https://docs.npmjs.com/cli/v12/using-npm/config), [package.json](https://docs.npmjs.com/cli/v12/configuring-npm/package-json), [Dependency Selectors](https://docs.npmjs.com/cli/v12/using-npm/dependency-selectors), and the individual command references linked throughout `references/`.