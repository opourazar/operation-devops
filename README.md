# Operation DevOps — Learning Tool Prototype

A web-based conceptual prototype for exploring and teaching DevOps principles through project-based learning.
This project is part of my bachelor thesis:
“Teaching DevOps in Higher Education: Exploring Instructor Approaches, Student Perspectives, and the Role of Web-Based Learning Tools.”

## Current Status

- Vite + React app with Tailwind CSS and shadcn/ui
- Routing for Student and Instructor dashboards plus module workspaces
- GitOps/Kube/IaC workspaces with Monaco-based editors and guided scenarios
- Local-only storage (no backend): progress, reflections, and telemetry stored in `localStorage`
- Instructor analytics: validation outcomes, help usage, quiz failures, phase (prelab vs lab) timing

## Requirements

- Node.js 20+ (recommended LTS). Install from https://nodejs.org if not already available.
- npm (bundled with Node).

## Tech Stack

- **Frontend**: Vite + React
- **Styling**: Tailwind CSS + shadcn/ui
- **Routing**: React Router DOM
- **State / Storage**: React hooks + Local Storage
- **Editors**: Monaco (`@monaco-editor/react`)
- **Animations**: Framer Motion
- **Charts**: Recharts
- **Package Manager**: npm

## Project Structure

The relevant files can be found in `src` folder:
```
src/
 ├─ components/        → Reusable UI elements (Module editors and their components, GitTerminal, telemetry components, ui components)
 ├─ data/              → Predefined data used by the application (module definition, scenario scripts, mock files)
 ├─ lib/               → Helper logic (code analyzation, module loading, telemetry)
 ├─ pages/             → App views (Student, ModuleWorkspace, Reflection, Instructor)
 ├─ App.jsx            → Main component with routing
 ├─ main.jsx           → Entry point
 └─ index.css          → Tailwind directives
```

## Setup

```
# Install dependencies
npm install

# Run development server
npm run dev
```

## Telemetry (Instructor Dashboard)

- Events are stored locally in the browser’s `localStorage` (no network calls).
- Key events: module start/stage changes/completion, validation/lint attempts, help requests, solution usage, editor changes, quiz answers, structure toggles.
- Phase timing is derived from `module_start`, `module_stage_change` (prelab→lab), and `module_complete`.
- Clear telemetry via the Instructor dashboard button if you want a clean run.

## Data & Progress Persistence

- Module progress, cheat sheets, reflections, and editor drafts are stored in `localStorage`.
- To restart cleanly, clear browser storage for the site. 
- Note!: Depending on browser settings, localStorage may be cleared automatically after closing it, so progress, reflections, and telemetry will reset.
