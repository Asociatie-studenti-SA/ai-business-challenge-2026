---
name: jury-evaluator
description: Fresh-context independent jury audit simulating Preselection (100p) + Finals (100p), running consistency, verbatim UI-word, Excel formula, AI-tells, live DOM smoke, and true 360px mobile overflow checks.
triggers: [jury-evaluator, audit, check, score]
always: false
---

# Playbook: Fresh-Context Independent Jury Audit (`deliverables/06-audit/`)

Run at **13:00 (min 120)** — ideally in a **brand-new Kiro window with ZERO prior build history** so the auditor has zero builder bias! Serves two purposes:
1. Catches every technical, numerical, UX, or copy defect before the **13:40 Merge Freeze** (securing Top-10 Preselection).
2. Produces **verified, real AI errors caught & fixed** that feed directly into `deliverables/04-ai-journal/`.

## Execution Steps

### Step 1: Run Automated Consistency & Live Smoke Scripts
Execute BOTH scripts yourself (never trust unverified claims!):
```bash
.venv/bin/python .kiro/skills/jury-evaluator/scripts/check_consistency.py
.venv/bin/python .kiro/skills/jury-evaluator/scripts/smoke_test_app.py <LIVE_URL> --out-dir deliverables/06-audit
```
Automated checks verify:
- All 6 mandatory deliverables present; zero `<REQUIRED:` / `TBD` placeholders;
- `brief/NUMBERS.json` is `LOCKED` and non-zero;
- `financial_model.xlsx` has `>= 10` live Excel formulas, `fullCalcOnLoad="1"`, and 0 formula errors;
- `strategy.pdf <= 1` page & `ai_journal.pdf <= 1` page (plus ~500-word density guard);
- `pitch_deck.pptx <= 5` slides + `DEMO_INSTRUCTIONS.md` exists;
- **Verbatim UI-Word Match:** button labels in `ui_contract` exist verbatim in `DEMO_INSTRUCTIONS.md` and `app/`/`docs/`;
- **Cross-File Numeric Sync:** key figures from `NUMBERS.json` match Strategy & Pitch;
- **Anti-AI-Tells Scan:** zero banned RO/EN clichés or emoji bullets;
- **Live App Smoke + True 360px Mobile Overflow:** HTTP 200, non-empty DOM, `1280×720` screenshot captured, and `scrollWidth <= 360` inside a true `360px` iframe wrapper!

### Step 2: Strict Dual-Rubric Qualitative Evaluation
Read `brief/RAW_THEME.md`, `brief/SSOT.md`, `brief/NUMBERS.json`, and all 6 deliverables. Write **`deliverables/06-audit/AUDIT_REPORT.md`** containing:
1. **Preselection Rubric Score (`/100`):** App & UX (`/35`), Strategy & Finance (`/25`), Critical AI Use (`/15`), Promo (`/15`), Pitch (`/10`).
2. **Finals Rubric Score (`/100`):** App & Live Demo (`/30`), Strategy & Finance (`/30`), AI Use & Understanding (`/20`), Presentation & Q&A (`/20`).
3. **Severity-Tagged Findings (`[SEVERITY: BLOCKER|MAJOR|MINOR]`):**
   - `BLOCKER`: real PII, claimed unbuilt feature, broken live URL, hardcoded Excel totals, page/slide limit breach.
   - `MAJOR`: any number/price/UI-word contradiction vs Excel or live app, 360px mobile overflow, violet AI-slop UI, AI-tells clichés.
4. **Top 5 Highest-ROI Fixes (< 15 minutes):** exact file, defect, points recovered, human owner.
5. **Authentic Candidates for AI Journal (Sec. 5):** 2–3 real AI defects caught right now so the team fixes them and documents them honestly in `04-ai-journal/`.
