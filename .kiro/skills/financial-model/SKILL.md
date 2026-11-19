---
name: financial-model
description: Builds the editable formula-driven Excel financial model (125+ formulas, fullCalcOnLoad=1) in deliverables/02-finance/ and locks canonical figures in brief/NUMBERS.json.
triggers: [financial-model, finance, excel, cfo]
always: false
---

# Playbook: Editable Formula-Driven Financial Model (`deliverables/02-finance/`)

Mandatory deliverable (Sec. 5; combined with Strategy = **25/100 pts Preselection, 30/100 pts Finals**, #2 tie-breaker). Audited by BCR directors and Alumil CEO — every number MUST be realistic, transparent, and backed by live Excel formulas.

## Hard Contest Constraints
- **Editable `.xlsx` with REAL EXCEL FORMULAS** (`fullCalcOnLoad=1`), NEVER hardcoded totals or static PDF!
- **Single Base Scenario** (12 months): main assumptions, costs (fixed + variable + Month-0 setup), revenues, estimated monthly & Year-1 result, break-even. Extra scenarios earn 0 points.
- **Output Labels:** Clear Romanian (`RON` or brief currency).

## Execution Steps

### Step 1: Extract Official Brief Financial Inputs
Read `brief/RAW_THEME.md`, `brief/data/*`, `brief/SSOT.md`, and `brief/NUMBERS.json`. If the brief provides prices, tariffs, volumes, commissions, or budgets, use them **verbatim** and cite the source in the Excel `Sursă / Justificare` column!

### Step 2: Author `deliverables/02-finance/model_input.json`
Follow the exact schema in `.kiro/skills/financial-model/references/model_input_example.json`. Apply the **BCR Sanity Gate**:
- `unit_price > variable_cost_per_unit` (positive unit contribution margin);
- Realistic ramp-up curve (`monthly_new_customers` L1–L12: slow pilot L1–L2, steady growth L3–L12) + realistic monthly churn (`3%–8%`);
- Realistic fixed costs (cloud/AI, base marketing, accounting/ops) + CAC > 0;
- Healthy `LTV / CAC >= 3.0x` and believable operational break-even (ideally Month 4–10, not Month 1 and not "never");
- **Consistency check with Business Model:** Never charge card/payment processing fees if Strategy says the partner collects cash (real defect caught in field tests!).

### Step 3: Build `.xlsx` & Lock `brief/NUMBERS.json`
Run the validated generator:
```bash
.venv/bin/python .kiro/skills/financial-model/scripts/build_financial_xlsx.py \
  deliverables/02-finance/model_input.json \
  deliverables/02-finance/financial_model.xlsx \
  --sync-numbers brief/NUMBERS.json \
  --summary-md deliverables/02-finance/finance_summary.md
```
This builds a 2-sheet styled workbook (`Ipoteze & Sumar` + `Proiectie 12 Luni`, **125 live Excel formulas**, `fullCalcOnLoad=1`), sets `brief/NUMBERS.json` to `"status": "LOCKED"` (preserving `ui_contract` & `live_app_url`), and outputs `finance_summary.md`.

### Step 4: Human Review & AI Journal Log
Review `finance_summary.md` with Teammate 2. If any figure is unrealistic or hard to defend in 20s Q&A, refine `model_input.json` and re-run. Write `deliverables/02-finance/PROMPT_LOG.md` logging at least one real assumption/formula error caught and fixed by the team.
