---
name: web-prototype
description: Builds, smoke-tests, and deploys a live web prototype in app/ (or zero-build docs/ GitHub Pages fallback) aligned with brief/SSOT.md, optimized for 35p Preselection and 30p Finals.
triggers: [web-prototype, build-app, prototype, deploy]
always: false
---

# Playbook: Published Web Prototype (`app/` or `docs/` — 35p Preselection / 30p Finals)

The live prototype is **Tie-Breaker #1** in both Preselection and Finals. Goal: a crisp, genuine, zero-login web app testable end-to-end in **under 30 seconds** at a public URL.

## Execution Steps

### Step 1: Read SSOT & Constraints
Read `brief/SSOT.md`, `brief/NUMBERS.json`, `brief/RAW_THEME.md`, and `brief/data/*`. Lock down the exact core testable feature and any form/dataset required by the brief.

### Step 2: Choose Stack (Primary vs. Zero-Build Wi-Fi Backup)
- **Primary (Recommended):** React + Vite + Tailwind CSS in `app/` (`npm create vite@latest . -- --template react-ts` + `lucide-react`). Configure `base: './'` in `vite.config.ts` so it deploys cleanly anywhere (Vercel, Netlify, Cloudflare Pages, or copied into `docs/` for GitHub Pages).
- **Zero-Build Fallback (if campus Wi-Fi blocks `npm`/Vercel):** Build clean, modern vanilla HTML + CSS + ES6 JS directly in `docs/` (`docs/index.html`, `docs/style.css`, `docs/app.js`) and publish via **GitHub Pages** (`gh api -X POST repos/<owner>/<repo>/pages -f "source[branch]=main" -f "source[path]=/docs"` → live at `https://<owner>.github.io/<repo>/` in ~60s!).

### Step 3: Build the "10-Second Wow + 30-Second Test" Interface
Apply `.kiro/skills/frontend-craft/SKILL.md` and `.kiro/skills/copywriting-anti-slop/SKILL.md` (all visible UI text in **natural Romanian**):
1. **Clean Header:** Brand name + subtle `Prototip Demo • Date fictive` badge + obvious 1-click button (e.g. `Încarcă scenariu demo`) pre-populating synthetic data (`.example` emails, zero real PII).
2. **Compact Hero (<= 15% viewport height):** One sharp headline + concrete benefit + immediate entry into the interactive tool above the fold.
3. **Interactive Core Loop (<= 3 steps):**
   - Form / configurator / filter / simulator matching the brief, with visible `<label>` tags and inline field validation;
   - **Deterministic client-side logic** (real math, scoring, filtering, or recommendation engine — zero fragile backend/API key dependencies!);
   - **Actionable visual output:** formatted KPI cards (`RON`, `%`, `luni`), clear breakdown ("De ce acest rezultat"), simple chart/progress visual, and a real export/save button (`JSON`/`CSV` download or `localStorage`).
4. **Business & Pricing Strip (compact, below core tool):** Displays exact locked figures from `brief/NUMBERS.json` so app and Excel match 100%.
5. **Transparent Footer:** `Date fictive de test • AI-Powered Business Challenge 2026`.

### Step 4: Quality Gate, True 360px Mobile Check & Deploy
1. Zero dead buttons, zero `#` placeholder links, zero violet AI slop, zero emoji-as-icons, zero console errors.
2. Mobile CSS check: when flex rows stack to column on mobile (`<= 640px`), set `flex: 0 0 auto` on stacked inputs/fields to prevent empty vertical gaps.
3. Run build (`npm run build` if Vite) → deploy live (`npx vercel --prod` / `npx netlify deploy --prod --dir=dist` / GitHub Pages `docs/`).
4. Run headless smoke test on the live URL:
   ```bash
   .venv/bin/python .kiro/skills/jury-evaluator/scripts/smoke_test_app.py <LIVE_URL>
   ```
   Confirm HTTP 200, live DOM content, `1280×720` render, and **zero overflow at true 360px viewport**.

### Step 5: Lock Verbatim UI Words & Logs (CRITICAL!)
1. Update **Section 6 (`Facts Sheet & Verbatim UI Words`)** in `brief/SSOT.md` AND `live_app_url` + `ui_contract` in `brief/NUMBERS.json` with the **EXACT verbatim button labels** (`demo_button_label`, `primary_cta_label`), demo input, and expected output from the live app.
2. Write `app/TEST_FLOW.md` (3 exact steps quoting verbatim button text) and `app/PROMPT_LOG.md` (tool, 1 key prompt, 1 real AI bug/UX issue fixed by the team).
