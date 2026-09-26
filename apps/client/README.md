# Detector Enterprise Platform

Detector is a modular internal enterprise platform that unifies identity governance, granular role-based access control (RBAC), and pluggable business operations modules under a single architecture.

## Project Structure

This repository is structured as a JavaScript monorepo:

- **Client (`detector-client`):** Unified enterprise frontend shell built with React, Vite, React Compiler, and Tailwind CSS v4.
- **Server (`detector-server`):** Modular backend REST API built with Node.js, Express, and Microsoft SQL Server.

## Platform Architecture

- **Core Platform:** Centralized corporate identity, capability-driven RBAC, user directory, system notifications, and immutable audit logs.
- **Pluggable Enterprise Modules:** Independent domain-specific operational engines (such as BPMS and future enterprise modules) that integrate directly with the Core Platform's authorization and data layers.

## Tech Stack Overview

- **Frontend:** React (JavaScript), Vite, Tailwind CSS v4, React Router, TanStack Query, AG Grid, React Hook Form, Zod, Lucide Icons.
- **Backend:** Node.js (ES Modules), Express, Microsoft SQL Server (raw parameterized T-SQL).
