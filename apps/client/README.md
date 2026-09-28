# Detector Client (`detector-client`)

The frontend application workspace for the **Detector Enterprise Platform**, serving as the unified host shell for Detector Core and its pluggable enterprise modules (starting with BPMS).

---

## Architectural Principles
- **Capability-Driven UI:** UI components render tabs, buttons, forms, and tables strictly from backend-resolved `capabilities`. Role strings are never hardcoded in component logic.
- **Unified Shell:** Navigation sidebar, topbar, notification center, and UI context switcher rendered from user permissions.
- **Air-Gapped Compliance:** Uses native browser `fetch` (no `axios`), modern standards, and pinned dependencies.

---

## Tech Stack
- **Framework:** React 19 with Vite 8 and React Compiler (`babel-plugin-react-compiler`)
- **Styling:** Tailwind CSS v4 (`@tailwindcss/vite` with `@import "tailwindcss";`)
- **Routing:** React Router (`react-router` v8)
- **State & Data Fetching:** TanStack Query (`@tanstack/react-query`)
- **Data Tables:** AG Grid Community (`ag-grid-community`, `ag-grid-react`)
- **Forms & Validation:** React Hook Form (`react-hook-form`) + Zod (`zod`)
- **Icons:** Lucide React (`lucide-react`)

---

## Governance & Roadmap
- See root [`AGENTS.md`](file:///f:/projects/detector/AGENTS.md) for platform operating rules.
- See [`docs/ROADMAP.md`](file:///f:/projects/detector/docs/ROADMAP.md) for the 14-phase implementation schedule.

---

## Development
```bash
# Run client in development mode
npm run dev --workspace=detector-client

# Build client for production
npm run build --workspace=detector-client

# Lint client code
npm run lint --workspace=detector-client
```
