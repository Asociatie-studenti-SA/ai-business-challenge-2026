# PaletCheck UR20

2nd place out of 140 registered teams at the AI-Powered Business Challenge 2026 (UPB / FAIMA).

Live application: https://paletcheck-ur20-techcon.netlify.app

## Overview

PaletCheck UR20 is a mobile-first web application built for **Tech-Con Industry** to pre-qualify industrial palletizing lines for **Universal Robots UR20** robotic cells. Designed for production managers and automation engineers in the Romanian food industry (5-15 kg plastic buckets), it enables a 60-second on-floor technical feasibility check directly from a browser, with no login required, and routes qualified requests to the nearest Tech-Con hub.

All calculations run deterministically on the client side with zero external API dependencies.

## Key Features

- **Deterministic Feasibility Engine**: Validates total payload (`bucket + gripper <= 20 kg`), compares target line rate against PURATOS FAT reference benchmarks (`7.4 buckets/min` at 13 kg, `8.6 buckets/min` at 5 kg), and computes manual pallet changeover frequency to surface downstream bottlenecks.
- **Explicit Scope Checks**: Verifies manual pallet and separator handling requirements and flags out-of-scope operations (automated pallet transport / MiR, stretch wrapping, shipping) upfront.
- **Automatic Regional Hub Routing**: Maps the user's county to the closest Tech-Con Industry hub in Romania (**Dragomiresti-Deal**, **Timisoara**, or **Iasi**) and displays the estimated ~4-month delivery window.
- **Interactive Cell Visualizer**: Visualizes the UR20 palletizing cell layout (2D/3D views) based on the configured line parameters.
- **Built-In Guide Assistant**: Context-aware client-side assistant that helps users navigate the form, interpret verdicts, and jump directly to relevant sections.
- **One-Click Demo Modes**: Pre-filled normal scenario (`SC LactoSud Demo SRL`) and error/missing-data scenario using synthetic data (no real personal data).
- **Qualified Request Export**: Generates structured, CRM-ready technical requests with local deduplication and `.json` export.

## Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS 4, Lucide React
- **Build Tool**: Vite 6 (static output built to `docs/` and deployed on Netlify)
- **Testing**: Vitest, fast-check

## Local Development

```bash
cd app
npm install
npm run dev
```

Build and verify the production bundle:

```bash
cd app
npm run build
npm test
```

## Repository Structure

- `app/` — React + TypeScript + Vite source code and unit/property tests
- `docs/` — Production build output
- `brief/` — Contest brief, Single Source of Truth (`SSOT.md`), and canonical metrics (`NUMBERS.json`)
- `deliverables/` — Competition deliverables (strategy, financial model, promotional assets, AI journal, pitch deck, and audit report)
