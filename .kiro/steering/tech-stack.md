---
inclusion: fileMatch
fileMatchPattern: "{app,docs}/**"
---

# Technical & UX Standards — Live Web Prototype (`app/` or `docs/`)

The web prototype carries **35/100 pts in Preselection** (#1 tie-breaker) and **30/100 pts in Finals** (#1 tie-breaker). Target: a fast, real, visually credible prototype testable in **under 30 seconds** at a public URL.

## 1. Stack & Deploy Strategy (GitHub Pages via `docs/` — Locked)
- **Deploy Target (Locked):** **GitHub Pages** from `main` branch → `/docs` folder (works on a **PRIVATE repo** with GitHub Student Pro while serving the live site **publicly** to the jury!). Keep `docs/.nojekyll` present so Vite/underscore assets are never stripped.
- **Primary Stack:** **React + Vite + Tailwind CSS** in `app/` configured with `base: './'` and `build: { outDir: '../docs', emptyOutDir: false }` (preserve `docs/.nojekyll`!). Running `npm run build && git push` automatically publishes to `https://<owner>.github.io/<repo>/` within ~60 seconds.
- **Zero-Build Fallback (if campus Wi-Fi blocks `npm`):** Clean **vanilla HTML + CSS + ES6 JS** directly in `docs/` (`docs/index.html`, `docs/style.css`, `docs/app.js`) — instant GitHub Pages deploy with zero build step.
- **Deterministic Core Logic:** Keep core calculations/scoring/filtering in a pure client-side module so it works 100% offline/without API rate limits during live judging. Never hardcode secret API keys in frontend code.

## 2. Non-Negotiable UX & Anti-Slop Requirements (Integrated `frontend-craft`)
1. **Zero Login Wall:** Evaluator lands directly on the working tool. If roles exist (e.g. Client vs. Admin), provide a 1-click switcher in the header.
2. **Visible Demo Mode:** Include a subtle `Prototip Demo • Date fictive` badge + an obvious 1-click demo button (e.g. `Încarcă scenariu demo`) that populates realistic synthetic data (`.example` emails, zero real PII).
3. **3-Step Core Loop Above the Fold:** Input / selection → Real client-side processing → Clear visual output (formatted KPI cards, transparent explanation, export/save action).
4. **No Violet/Lavender AI Slop:** Choose an industry-appropriate palette (e.g. Slate + Cobalt/Deep Teal/Emerald/Amber on clean light surface). Zero emoji-as-icons (use `lucide-react` or crisp inline SVG).
5. **Accessibility & Mobile Rigor (360px True Viewport):**
   - Contrast ≥ 4.5:1, visible `<label>` on every input, focus rings preserved, interactive targets ≥ `44×44px` with ≥ `8px` gap.
   - Zero horizontal overflow at `1440px`, `1280×720` (finals projector), and **true `360px` mobile width**. When flex rows stack into a column on mobile, set `flex: 0 0 auto` on child fields (prevents 140px vertical empty gaps caught in field tests!).
6. **Zero Dead Buttons & Exact UI Contract:** Every visible button must execute real logic. After deploy, write the exact live URL, verbatim button labels, demo input, and expected output into `brief/SSOT.md` (Section 6) and `brief/NUMBERS.json` (`ui_contract`).

## 3. Mandatory Pre-Freeze Smoke Verification
- Build succeeds with exit code `0` and zero console errors in Incognito.
- Run `.venv/bin/python .kiro/skills/jury-evaluator/scripts/smoke_test_app.py <LIVE_URL>` to verify HTTP 200, live DOM render, `1280×720` screenshot, and **zero overflow at true 360px mobile viewport**.
