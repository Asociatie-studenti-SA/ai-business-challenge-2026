# AI-Powered Business Challenge 2026 — Multi-Agent Repo (Kiro + GitHub Sync)

Kiro-native multi-agent operating system (English instructions for precision, Romanian contest deliverables by default) built for **3 teammates** competing in the 3-hour *AI-Powered Business Challenge 2026* (UPB / FAIMA, 20 Nov 2026, 11:00–14:00).

> **Contest Integrity (Sec. 3 & 7):** Zero pre-built project content exists in this repo (`app/` and `deliverables/` are empty). Only reusable skills, steering rules, and formatting/testing scripts are prepared in advance and declared transparently in the AI Journal.

---

## 1. One-Time Setup (Before 11:00 on All 3 Laptops)

```bash
chmod +x scripts/setup.sh scripts/package_submission.sh
./scripts/setup.sh
```

Pre-flight account checks:
- [ ] **Kiro** (Student plan active, repo open, `.kiro/` recognized)
- [ ] **Git + GitHub CLI (`gh`)**: run `gh auth status` → `Logged in` (if using GitHub Issues/PR coordination)
- [ ] **Deploy target ready**: Vercel (`npx vercel login`) / Netlify (`npx netlify login`) OR **GitHub Pages** (`docs/` on a public repo — zero-build backup if campus Wi-Fi blocks `npm`)
- [ ] **Google Chrome / Chromium** installed (used for PDF page-limit checks, 1080×1350 PNG poster export, and 360px mobile overflow smoke testing)

---

## 2. Three-Hour Battle Plan (11:00 – 14:00)

| Clock | Min | Phase | Who / Agent | Sync / Gate |
| :--- | :--- | :--- | :--- | :--- |
| **11:00–11:15** | 0–15 | **1. Intake & SSOT** | All 3 + `orchestrator` (`/theme-intake`) | Paste theme into `brief/RAW_THEME.md`, files into `brief/data/`. Lock `brief/SSOT.md` + `brief/NUMBERS.json` (and optional GitHub Issue #1 via `/github-coord`). **Commit & Push**. |
| **11:15–12:15** | 15–75 | **2A. Parallel Build** | • **C1** + `app-builder` → `app/` (or `docs/`)<br>• **C2** + `cfo` → `02-finance/` (locks `NUMBERS.json` at **12:00**!)<br>• **C2** + `strategist` → `01-strategy/`<br>• **C3** + `pr-marketer` → `03-promo/` | Disjoint folders = zero Git conflicts. At **12:00**, C2 pushes locked `brief/NUMBERS.json`; C1 & C3 pull. |
| **12:15–12:55** | 75–115 | **2B. Live Deploy + Pitch** | • **C1** deploys live URL + updates `ui_contract` (exact button labels & demo output) in `SSOT.md` & `NUMBERS.json`<br>• **C2** exports 1-page `strategy.pdf` + verifies Excel formulas<br>• **C3** + `pitch-director` → `05-pitch/` (max 5 slides + script + Q&A) | **12:55**: Full push/pull. Live URL verified in Incognito + mobile. |
| **12:55–13:20** | 115–140 | **3. Fresh-Context Audit** | **New zero-history window** → `jury-auditor` (`/jury-evaluator`) | Runs `check_consistency.py` + `smoke_test_app.py` (360px iframe + live DOM) + scores both rubrics (100p/100p). Logs real AI bugs caught! |
| **13:20–13:40** | 140–160 | **4. Fixes + AI Journal** | Fix BLOCKER/MAJOR findings; `ai-journalist` (`/ai-journal`) → `04-ai-journal/ai_journal.pdf` | **13:40 MERGE FREEZE** (only BLOCKER fixes after 13:40). |
| **13:40–14:00** | 160–180 | **5. Package & Submit** | `./scripts/package_submission.sh --tag` | Verifies all 6 deliverables, tags `submission`, uploads `submission/` before 14:00. |

---

## 3. Emergency Quota / Crash Recovery (`PROMPT C: RESUME`)

If any Kiro window hits a quota limit or crashes mid-sprint, open a **fresh window** and paste:

```text
Activating github-coord + local repo sync in Role <MAIN_COORDINATOR | SESSION_AGENT as agent=<AGENT_ID>>.
The previous session was interrupted.
Read brief/SSOT.md, brief/NUMBERS.json, git status, and (if using GitHub Issues/PRs) run `gh issue list --state all` + `gh pr list --state all`.
Run the Resume Protocol in .kiro/skills/github-coord/SKILL.md: reconcile any half-finished merges/labels/deliverables from repo + GitHub state alone, never redo closed work, and continue the sprint.
```

---

## 4. Mandatory 6 Deliverables Checklist (Regulament Sec. 5)
1. **Live Web App URL** — public, zero login wall, ≥1 testable core function, fictive demo data + 1-click demo button, passes 360px mobile overflow check.
2. **One-Page Strategy (`01_Strategie_1pag.pdf`)** — **strict max 1 A4 page** (Problem, Audience, Solution, Customer Acquisition, 3 Implementation Steps).
3. **Financial Model (`02_Model_Financiar.xlsx`)** — **editable Excel with live formulas** (`fullCalcOnLoad=1`), 1 base scenario, synced with `brief/NUMBERS.json`.
4. **Promotional Asset (`03_Material_Promovare.png` + `03_Text_Promovare.md`)** — message, visual element, CTA, zero AI tells.
5. **AI Journal (`04_Jurnal_AI_1pag.pdf`)** — **strict max 1 A4 page** (tools, 3 real prompts, ≥1 real AI mistake verified & fixed, Sec. 7 template/MIT attribution).
6. **Pitch & Demo (`05_Pitch_5slide.pptx` / `.pdf` + `06_Link_Prototip_si_Testare.md`)** — **strict max 5 slides** + live URL + verbatim UI test steps.
