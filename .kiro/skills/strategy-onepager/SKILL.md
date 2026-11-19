---
name: strategy-onepager
description: Writes the strict 1-page A4 Strategy (Markdown + HTML + verified 1-page PDF) in deliverables/01-strategy/, mapped 1-to-1 to Regulament Sec. 5.
triggers: [strategy-onepager, strategy, one-pager]
always: false
---

# Playbook: One-Page Strategy (`deliverables/01-strategy/`)

Mandatory deliverable (Sec. 5; combined with Financial Model = **25/100 pts Preselection, 30/100 pts Finals**, #2 tie-breaker).

## Hard Contest Constraints
- **Output Language:** Natural executive **Romanian** (unless brief specifies English).
- **Length:** **STRICT MAX 1 A4 PAGE** (~350–450 words; 2 pages loses points immediately!).
- **All 5 Mandatory Headings (explicitly labeled for AI + human evaluators):**
  1. **1. Problema** (anchored in `brief/RAW_THEME.md` & `brief/data/*`)
  2. **2. Publicul vizat** (ICP + paying buyer + initial reachable niche)
  3. **3. Soluția** (clear value prop, core live-testable feature, concrete differentiator)
  4. **4. Atragerea clienților / utilizatorilor (GTM)** (2–3 concrete channels, CAC from `brief/NUMBERS.json`, entry offer)
  5. **5. Trei pași de implementare** (3 timed milestones with measurable KPIs: Month 1 Pilot → Months 2–3 Validation → Months 4–12 Scale)

## Execution Steps

### Step 1: Sync with SSOT, Positioning & Locked Numbers
1. Run or read `deliverables/01-strategy/product_marketing.md` first (via `product-marketing` skill).
2. Read `brief/SSOT.md`, `brief/NUMBERS.json` (verify `"status": "LOCKED"` before final export!), and `deliverables/02-finance/finance_summary.md`.
3. Every price, revenue, CAC, and break-even number MUST match `brief/NUMBERS.json` verbatim. Never claim an unbuilt feature!

### Step 2: Draft Crisp, Zero-Slop Content
- Write `deliverables/01-strategy/strategy.md` (target **350–450 words**, zero AI tells per `copywriting-anti-slop`).
- Include a compact **4-KPI Financial Snapshot** (Price, Year-1 Revenue, Break-Even, LTV/CAC), the live app URL, and a 1-line **Main Risk & Mitigation** footer (scores high with BCR/Alumil jurors).

### Step 3: Render & Verify Exact 1-Page A4 PDF
1. Build `deliverables/01-strategy/strategy.html` from `.kiro/skills/strategy-onepager/references/onepager_template.html` (clean Teal/Cobalt executive layout, 11mm margins, zero violet AI slop).
2. Render and enforce `--max-pages 1`:
   ```bash
   python3 .kiro/skills/strategy-onepager/scripts/render_pdf.py \
     deliverables/01-strategy/strategy.html \
     deliverables/01-strategy/strategy.pdf \
     --max-pages 1
   ```
3. If the script exits with code `2` (>1 page), tighten copy/spacing and re-run until verified **exact 1 page**.

### Step 4: Log for AI Journal
Write `deliverables/01-strategy/PROMPT_LOG.md` (AI tool used, 1 strong prompt, 1 real AI error/over-optimistic assumption corrected by the team).
