---
name: ai-journal
description: Compiles real PROMPT_LOGs and jury-auditor findings into the strict max-1-page A4 AI Journal PDF in deliverables/04-ai-journal/, including mandatory Sec. 7 MIT & template declarations (15p Preselection / 20p Finals).
triggers: [ai-journal, journal, ai-log]
always: false
---

# Playbook: AI Journal (`deliverables/04-ai-journal/` — 15p Preselection / 20p Finals)

"Critical Use of AI" / "AI Use & Understanding" carries **15/100 pts in Preselection**, **20/100 pts in Finals**, and is **Tie-Breaker #3**. Authentic, concrete evidence here separates Top-3 winners from generic entries.

## Hard Contest Constraints (Sec. 5, 7 & 9)
- **Output Language:** Clear, executive **Romanian** (unless brief specifies English).
- **Length:** **STRICT MAX 1 A4 PAGE** (~350–450 words).
- **All 4 Mandatory Sections (explicitly labeled):**
  1. **Instrumente AI utilizate** — tool name, concrete role in our pipeline, and human verification step (note: tool count alone earns 0 pts; disciplined workflow & critical review earn max pts).
  2. **3 prompturi relevante** — real, structured prompts from today's run (showing context, constraints, and verification criteria — ideally across Tech, Finance/Strategy, and Audit/PR).
  3. **Exemplu concret de rezultat AI verificat și corectat de echipă** — the single highest-scoring section! Structure explicitly as:
     - *Rezultat inițial (AI):* exact defect/hallucination/UX bug/math error;
     - *Cum am detectat problema:* concrete test/audit step;
     - *Corecția echipei & impactul:* exact fix applied.
     *(Make sure every teammate memorizes 1 real mistake to explain aloud in the Finals Q&A!)*
  4. **Transparență & Conformitate (Secț. 7 & 9):** Explicit declaration of:
     - Pre-built Kiro workspace skills & formatting/verification scripts (`openpyxl`, `python-pptx`, headless Chrome PDF/PNG/360px checks) — zero pre-built theme content;
     - Field-tested multi-agent coordination protocol (`github-multi-agent-skill` v1.2);
     - Adapted open-source MIT frameworks: `coreyhaines31/marketingskills` (*product-marketing, copywriting, social*), `Leonxlnx/taste-skill` (*design-taste-frontend*), `nextlevelbuilder/ui-ux-pro-max-skill` (*ui-ux-pro-max*);
     - 100% synthetic/fictive demo data only (zero real personal data / GDPR compliant).

## Execution Steps
1. Read all real logs created during the sprint:
   - `app/PROMPT_LOG.md`
   - `deliverables/01-strategy/PROMPT_LOG.md`
   - `deliverables/02-finance/PROMPT_LOG.md`
   - `deliverables/03-promo/PROMPT_LOG.md`
   - `deliverables/05-pitch/PROMPT_LOG.md`
   - `deliverables/06-audit/AUDIT_REPORT.md`
2. Select the strongest 3 real prompts and the sharpest 1–2 verified AI corrections (concrete numbers or live UI fixes beat vague prose).
3. Write `deliverables/04-ai-journal/ai_journal.md` (~350–450 words) and styled 1-page `deliverables/04-ai-journal/ai_journal.html` (Deep Teal / Slate palette matching Strategy, zero violet slop).
4. Export and enforce strict 1-page A4 limit:
   ```bash
   python3 .kiro/skills/strategy-onepager/scripts/render_pdf.py \
     deliverables/04-ai-journal/ai_journal.html \
     deliverables/04-ai-journal/ai_journal.pdf \
     --max-pages 1
   ```
   If `> 1` page, compact spacing/copy and re-run until verified exact 1 page.
