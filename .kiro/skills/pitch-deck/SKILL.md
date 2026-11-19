---
name: pitch-deck
description: Builds the strict max-5-slide Pitch (.pptx + .pdf), verbatim UI demo steps, timed 3-minute script, and arithmetic-backed <=350-word Q&A defense in deliverables/05-pitch/.
triggers: [pitch-deck, pitch, slides, qa]
always: false
---

# Playbook: Pitch & Live Demo (`deliverables/05-pitch/` — 10p Preselection / 20p Finals)

## Hard Contest Constraints
- **Output Language:** Natural executive **Romanian** (zero AI tells).
- **Slide Limit:** **STRICT MAX 5 SLIDES** (never add a 6th "Thank you!" slide!).
- **Mandatory Demo Info:** Live prototype URL + short test instructions using the **EXACT verbatim UI button labels** from `brief/SSOT.md` (Section 6) & `brief/NUMBERS.json` (`ui_contract`).
- **Live Finals Clock:** Max **3:00 pitch + live demo** and **2:00 Q&A** before 5 business jurors.

## Exact 5-Slide Architecture (Timed for 3:00)
1. **Slide 1 — Problema & Oportunitatea (0:00–0:30):** Brand + 1-liner + official brief metrics + paying audience (ICP).
2. **Slide 2 — Soluția & Demo Live (0:30–1:30 — 60s live demo):** Large readable live URL + **3 exact test steps quoting verbatim UI buttons** + core differentiator.
3. **Slide 3 — Strategie, Promovare & Implementare (1:30–2:00):** GTM acquisition channel + embedded `deliverables/03-promo/promo_poster.png` preview + **3 implementation steps**.
4. **Slide 4 — Model Financiar & Unit Economics (2:00–2:30):** Exact locked figures from `brief/NUMBERS.json` (`financial_model.xlsx`): Price, Year-1 Revenue, Year-1 Net Result, **Break-Even (month & active units)**, LTV/CAC + 1 line on main risk & mitigation.
5. **Slide 5 — Utilizarea Critică a AI & Concluzie (2:30–3:00):** Multi-agent workflow + **1 concrete AI mistake caught & fixed by the team** (directly scores the 20p Finals AI criterion!) + final CTA & live URL.

## Execution Steps

### Step 1: Sync All Sources
Read `brief/SSOT.md` (verify Section 6 `Facts Sheet & Verbatim UI Words` is filled!), `brief/NUMBERS.json` (verify `"status": "LOCKED"`), `app/TEST_FLOW.md`, `deliverables/01-strategy/product_marketing.md`, `deliverables/01-strategy/strategy.md`, `deliverables/02-finance/finance_summary.md`, `deliverables/03-promo/promo_copy.md`, and `deliverables/06-audit/AUDIT_REPORT.md` (if available).

### Step 2: Build Editable `.pptx` + `.pdf` (Strict <= 5 Slides)
1. Write `deliverables/05-pitch/pitch_spec.json` matching `.kiro/skills/pitch-deck/references/pitch_spec_example.json` (max 35–45 words/slide, zero text walls, zero AI tells).
2. Generate editable PowerPoint (automatically embeds Slide 3 poster thumbnail):
   ```bash
   .venv/bin/python .kiro/skills/pitch-deck/scripts/build_pitch_pptx.py \
     deliverables/05-pitch/pitch_spec.json \
     deliverables/05-pitch/pitch_deck.pptx \
     --poster deliverables/03-promo/promo_poster.png
   ```
3. Also build `deliverables/05-pitch/pitch_deck.html` (5 clean 16:9 slides) and export verified `<= 5` page PDF:
   ```bash
   python3 .kiro/skills/strategy-onepager/scripts/render_pdf.py \
     deliverables/05-pitch/pitch_deck.html \
     deliverables/05-pitch/pitch_deck.pdf \
     --max-pages 5 --landscape
   ```

### Step 3: Author Stage & Submission Support Files
1. **`deliverables/05-pitch/DEMO_INSTRUCTIONS.md`:** Live URL + 3 steps quoting **exact verbatim button & input labels** from `ui_contract` + synthetic demo input & exact expected output.
2. **`deliverables/05-pitch/PITCH_SCRIPT_3MIN.md`:** Second-by-second script (<= 180s) split cleanly across the 3 teammates (e.g. C3 Hook & GTM, C1 Live Demo, C2 Financials & AI Critical Thinking).
3. **`deliverables/05-pitch/QA_DEFENSE.md` (Field-Tested Rule: <= 350 words!):**
   - Crisp, honest 20-second answers to top 8–10 jury questions (BCR: pricing/CAC/churn/Month-1 loss arithmetic; Orange: GDPR/privacy/scalability; Alumil/Mainfreight/Tech-Con: real-company adoption; AI Jury: 1 concrete AI mistake each teammate can explain aloud).
   - **Every number MUST include its arithmetic** (e.g. break-even calculation).
   - **NEVER answer with a feature the live app does not actually have!**
4. Write `deliverables/05-pitch/PROMPT_LOG.md`.
