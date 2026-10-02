# Frontend Rebuild Tracker

This document tracks the phased execution of the capability-driven frontend rebuild for the Detector Enterprise Platform.

## Execution Rules
- Execute exactly one incomplete step per iteration.
- Run validations (`npm run lint`, `npm run build`) before completion.
- Provide Git commands for the exact scope of the step.
- Wait for explicit user approval before proceeding to the next step.
- Update this tracker after successful validation of each step.

---

## Roadmap

### Layer 1: Discovery and Foundation
- [x] **Step 1.1: System Discovery & Roadmap Generation**
  - **Objective:** Discover Stitch artifacts, inspect existing codebase, and create this roadmap.
  - **Prerequisites:** None.
  - **Scope:** Complete Phase 1 and 2 requirements, generate `frontend_rebuild_tracker.md`.
  - **Status:** Complete.

### Layer 2: Design Tokens and Styling Foundation
- [x] **Step 2.1: Implement Design System Tokens**
  - **Objective:** Configure Tailwind v4 `@theme` with Stitch design system colors, typography, spacing, and radii.
  - **Prerequisites:** Step 1.1.
  - **Scope:** Update `apps/client/src/index.css` and `tailwind` configurations based on Stitch project metadata.
  - **Stitch Dependencies:** Project `1783953047780622398` metadata and `DESIGN_SYSTEM_INSTANCE` (`assets_8981359102164565870`).
  - **Status:** Complete.

### Layer 3: API and Data Layer
- [x] **Step 3.1: Centralized API Client**
  - **Objective:** Implement a native `fetch` wrapper handling base URLs, JSON parsing, CSRF, and global error handling.
  - **Prerequisites:** Step 1.1.
  - **Scope:** Create `apps/client/src/lib/api.ts` (or `.js`) for HTTP requests.
  - **Backend Dependencies:** Server error contracts, CORS configuration.
  - **Status:** Complete.

- [x] **Step 3.2: TanStack Query Provider Setup**
  - **Objective:** Integrate TanStack Query for server state management.
  - **Prerequisites:** Step 3.1.
  - **Scope:** Wrap application with `QueryClientProvider` and set up default query configurations.
  - **Status:** Complete.

### Layer 4: Authentication, Session, and Capabilities
- [x] **Step 4.1: Auth State & Session Integration**
  - **Objective:** Implement authentication store/context and fetch current user session (`/api/core/auth/me`).
  - **Prerequisites:** Step 3.2.
  - **Scope:** Create auth context, handle loading states, and integrate logout behavior.
  - **Backend Dependencies:** `/api/core/auth/*` endpoints.
  - **Status:** Complete.

- [x] **Step 4.2: Capability-Driven Authorization Engine**
  - **Objective:** Build the frontend capability resolver to gate UI elements based on backend-provided capabilities.
  - **Prerequisites:** Step 4.1.
  - **Scope:** Create `useCapabilities` hook and `<RequireCapability>` wrapper component.
  - **Status:** Complete.

### Layer 5: Atomic UI Component System
- [x] **Step 5.1: Core Primitives (Buttons, Inputs, Badges)**
  - **Objective:** Implement base UI components matching Stitch designs.
  - **Prerequisites:** Step 2.1.
  - **Scope:** Build Button, Input, Badge components in `apps/client/src/components/ui/`.
  - **Stitch Dependencies:** Sign In screen (`52bc3d8132ba4ea9b690b8688d6d6d6c`) and Design System instance.
  - **Status:** Complete.

- [ ] **Step 5.2: Layout Components (Modals, Cards, Tables)**
  - **Objective:** Implement layout primitives (Cards, Modals) and setup base AG Grid configuration.
  - **Prerequisites:** Step 5.1.
  - **Scope:** Build Modal, Card, and Table wrapper components.
  - **Stitch Dependencies:** Audit Ledger, Modal states screens.

### Layer 6: Routing and Application Shell
- [ ] **Step 6.1: React Router Integration & App Shell**
  - **Objective:** Setup React Router v8 and build the global application layout (Sidebar, Header).
  - **Prerequisites:** Step 4.2, Step 5.2.
  - **Scope:** Implement `react-router` configuration, public/private route wrappers, and the main AppShell.
  - **Stitch Dependencies:** Any main dashboard screen (e.g., `192a1c56c2f045199e83ec3cfa92f9a0` Super Admin Operational Overview).

### Layer 7: Feature and Page Assembly
- [ ] **Step 7.1: Sign In Page**
  - **Objective:** Build the authentication interface.
  - **Prerequisites:** Step 6.1.
  - **Scope:** Create Sign In view with form validation, connecting to Auth API.
  - **Stitch Dependencies:** `52bc3d8132ba4ea9b690b8688d6d6d6c`.

- [ ] **Step 7.2: Employee Directory**
  - **Objective:** Implement the Employee Directory view and Modal.
  - **Prerequisites:** Step 6.1.
  - **Scope:** Build Employee list and "Add New Employee" modal.
  - **Stitch Dependencies:** `d3ea902a4f2f453d81f975a7271d8fa8`, `98f454db9c574cf3a85714a3e06cc589`.

- [ ] **Step 7.3: BPMS Process Registry**
  - **Objective:** Implement the server-side AG Grid Process Registry.
  - **Prerequisites:** Step 6.1.
  - **Scope:** Process Registry page, connecting to `/api/modules/bpms/processes`.
  - **Stitch Dependencies:** `5f329f1982fc4c71a6264ddaee398958`.

- [ ] **Step 7.4: BPMS Process Detail & Review**
  - **Objective:** Build the tabbed Process Detail view and Side-by-Side Review.
  - **Prerequisites:** Step 7.3.
  - **Scope:** Process Detail page components, Change Request handling.
  - **Stitch Dependencies:** `4e5b3bb832aa48c0a8e0e15167f616f1`, `2ae6f391c057443c952ffdf2481bae9e`.

### Layer 8: Validation and Production
- [ ] **Step 8.1: E2E Validation & Hardening**
  - **Objective:** Validate all workflows, perform security/XSS/capability checks.
  - **Prerequisites:** Step 7.4.
  - **Scope:** Final testing, removing debug logs, validating responsive states.
