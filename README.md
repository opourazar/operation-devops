# Operation DevOps — Learning Tool Prototype

A web-based conceptual prototype for exploring and teaching DevOps principles through project-based learning.
This project is part of my bachelor thesis:
“Teaching DevOps in Higher Education: Exploring Instructor Approaches, Student Perspectives, and the Role of Web-Based Learning Tools.”

## Current Status (Setup & Layout Structure)

- Project initialized with Vite + React
- Tailwind CSS v3 and shadcn/ui configured
- Basic routing and navigation established
- Git repository ready for future development

## Next Steps

- GitOps Workspace Mock (students simulate commits and observe pipeline triggers)

## Tech Stack

- **Frontend**: React (Vite)
- **Styling**: Tailwind CSS + shadcn/ui + Lucide Icons
- **Routing**: React Router DOM
- **Animations (soon)**: Framer Motion
- **Charts (soon)**: Recharts
- **Package Manager**: npm

## Project Structure

The relevant files can be found in `src` folder:
```
src/
 ├─ components/        → Reusable UI elements
 ├─ pages/             → App views (Student, Pipeline, Monitoring, Reflection, Instructor)
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
Visit http://localhost:5173 to view the app.