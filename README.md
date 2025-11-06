# SIPP Home UI (Vite + React + TypeScript + Tailwind)

This zip includes everything you need to run the SIPP Home UI locally.

## Prerequisites

- Node.js 18+ and npm

## Quickstart

```bash
npm install
npm run dev
# open the local URL printed by Vite
```

## Build for production

```bash
npm run build
npm run preview
```

## Notes

- Tailwind is already configured in `tailwind.config.js` and `src/index.css`.
- The page entry is `src/SIPPHomePage.tsx`, mounted from `src/main.tsx`.
- The header avatar opens an accessible menu with **User Profile** and **Log out**.
- Accordions meet WCAG with `aria-expanded`, `aria-controls`, and named `region`s.
- Layout shift is prevented by forcing a stable vertical scrollbar on `<html>`.
