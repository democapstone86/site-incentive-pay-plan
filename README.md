# Site Incentive Pay Plan (SIPP)

## Overview

**Site Incentive Pay Plan (SIPP)** is a prototype application for creating, managing, and previewing site-level incentive pay plans. The system allows users to configure incentive plans in a **draft state**, associate services and revenue attributes, and preview incentive behavior before plans are finalized.

This project is intended for **prototyping, validation, and iteration** prior to production implementation.

---

## Tech Stack

### Frontend

- React 18
- TypeScript
- Vite
- React Router
- Tailwind CSS
- Radix UI (Dialog)
- Recharts
- Lucide Icons

### Backend

- Node.js
- Express-style API routing
- Draft-based in-memory data model

---

## Project Structure

```
/
├── server/
│   ├── api/
│   │   └── incentive-pay-plan/
│   │       ├── incentive.controller.js
│   │       ├── incentive.routes.js
│   │       └── index.js
│   │
│   ├── db/
│   │   └── db.js
│   │
│   ├── models/
│   │   └── incentive-pay-plan-draft.js
│   │
│   ├── server.js
│   └── package.json
│
├── src/
│   ├── pages/
│   │   ├── ComingSoon.tsx
│   │   ├── CreateIncentive.tsx
│   │   ├── IncentivePayPlans.tsx
│   │   ├── SippCalculator.tsx
│   │   └── SippHomePage.tsx
│   │
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
│
├── public/
├── index.html
├── tailwind.config.js
├── postcss.config.js
├── tsconfig.json
├── vite.config.ts
├── package.json
└── README.md
```

---

## Core Concepts

### Incentive Pay Plan

An **Incentive Pay Plan** defines how incentive compensation is configured at a site level. Each plan includes:

- Selected services
- Revenue attributes
- Incentive rules and thresholds
- Calculated previews

All plans are managed as drafts.

---

### Draft-Based Model

Incentive plans are created and modified in a **draft state**:

- Drafts are isolated and editable
- Changes do not affect finalized plans
- Drafts support repeated preview and recalculation

Draft logic is implemented in:

```
server/models/incentive-pay-plan-draft.js
```

---

## Backend API

The backend exposes incentive-related endpoints under:

```
/api/incentive-pay-plan
```

Responsibilities:

- Create incentive plan drafts
- Update draft data
- Return draft state to the frontend
- Support calculation previews

API routing and controllers are located in:

```
server/api/incentive-pay-plan/
```

---

## Frontend Pages

| Page                    | Description                           |
| ----------------------- | ------------------------------------- |
| `SippHomePage.tsx`      | Application landing page              |
| `IncentivePayPlans.tsx` | View existing incentive plans         |
| `CreateIncentive.tsx`   | Create and configure incentive drafts |
| `SippCalculator.tsx`    | Preview incentive calculations        |
| `ComingSoon.tsx`        | Placeholder for future features       |

---

## Incentive Configuration Flow

1. Navigate to **Create Incentive**
2. A new incentive plan draft is created
3. Services and revenue attributes are selected
4. Incentive rules are configured
5. Calculated results are previewed
6. Draft can be iterated or discarded

> Approval workflows, persistence, and payroll execution are out of scope for this prototype.

---

## Development

### Prerequisites

- Node.js 18+
- npm

---

### Install Dependencies

```bash
npm install
```

---

### Run Client and Server

Runs the Vite frontend and Node backend concurrently.

```bash
npm run dev
```

---

### Run Client Only

```bash
npm run dev:client
```

---

### Run Server Only

```bash
npm run dev:server
```

---

### Build

```bash
npm run build
```

---

### Preview Production Build

```bash
npm run preview
```

---

## Design Principles

- Draft-first editing
- Clear separation of UI and business logic
- Config-driven incentive modeling
- Safe iteration without side effects
- Simple backend for rapid prototyping

---

## Known Limitations

- Prototype-only storage
- No authentication or authorization
- No audit history
- No payroll system integration

---

## Future Enhancements

- Persistent database storage
- Incentive plan versioning
- Approval workflows
- Role-based access control
- Rule validation engine

---

## Contributor Notes

- Avoid hardcoding incentive logic in UI components
- Keep calculation logic centralized
- Treat drafts as disposable state
- Extend functionality via configuration where possible
