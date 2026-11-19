---
name: theme-intake
description: Decomposes brief/RAW_THEME.md and brief/data/* into a fail-fast validated Single Source of Truth (brief/SSOT.md + brief/NUMBERS.json) within the first 15 minutes.
triggers: [theme-intake, start, brief, ssot]
always: false
---

# Playbook: Theme Intake & Fail-Fast SSOT Lock (Min 0–15)

Eliminates ambiguity in the first 10 minutes so every downstream agent builds from identical facts, prices, audience, and scope.

## Execution Steps

### Step 1: Full Brief & Data Audit
1. Read `brief/RAW_THEME.md` completely.
2. Inspect every file inside `brief/data/` (CSV, XLSX, JSON, PDF, TXT).
3. Extract explicitly:
   - Core business problem & target audience required by organizers;
   - Mandatory constraints (e.g. required form, calculator, budget cap, language);
   - **Every number provided by organizers** (AI preselection checks whether official brief data was actually used!).

### Step 2: Select the Winning 3-Hour Product Angle
Compare 2 candidate angles against:
- **Business jury impact** (BCR: clear buyer & monetization; Orange: frictionless UX & GDPR hygiene; Alumil/Mainfreight/Tech-Con: real operational ROI);
- **100% live feasibility in 90 minutes** (one real, deterministic, testable core feature — zero fake/mocked claims).
Present a crisp 5-line recommendation if the team hasn't chosen yet, or lock the strongest angle directly when asked for autonomous execution.

### Step 3: Populate `brief/SSOT.md` (Romanian Content, Fail-Fast Validated)
Fill Sections 1–5 of `brief/SSOT.md` in **natural Romanian** (unless theme demands English):
- Memorable, pronounceable brand name + 1-sentence tagline;
- Clear ICP (separating daily user vs. paying buyer);
- Synthetic demo persona (`.example` email, zero real PII);
- **3-step Core Loop** for the web app (< 30s test);
- **Scope Guard** (explicit list of what we do NOT build);
- **Three Implementation Steps** (Month 1 Pilot → Months 2–3 Validation → Months 4–12 Scale).
Leave only `TBD_AFTER_DEPLOY` / `TBD_AFTER_APP` in Section 6 (updated by `app-builder` right after build/deploy).

### Step 4: Initialize `brief/NUMBERS.json` & Fail-Fast Check
- Populate realistic initial assumptions in `brief/NUMBERS.json` (`"status": "INITIAL_DRAFT"`), recording all brief figures in `brief_data_references`.
- **Fail-Fast Validation Gate:** Verify ZERO `<REQUIRED:` placeholders remain in Sections 1–5 of `brief/SSOT.md`. If any remain, halt with `Status: BASIS_VALIDATION_FAILED` and list the missing fields.
- If using `github-coord` mode, also fill `brief/operation-basis-<project>.txt`, create the 9 labels + Master Tracker Issue `#1` (`[COORD:INIT]`) + disjoint child Issues (`[COORD:ASSIGN]`).

### Step 5: Parallel Handoff Summary
Print a concise 10-line dispatch summary with product name, core testable feature, and the exact parallel commands for Teammate 1 (`app-builder`), Teammate 2 (`cfo` → `strategist`), and Teammate 3 (`pr-marketer` → `pitch-director`).
