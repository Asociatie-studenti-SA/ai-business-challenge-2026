---
inclusion: always
---

# Multi-Agent Sync, Facts Sheet & Conflict-Free Git Protocol

This workspace supports **Dual-Mode Sync**:
- **Mode A (Lightweight Disjoint-Folder Git):** Each teammate works in their exclusive folder and syncs via `git pull --rebase && git push`.
- **Mode B (Full GitHub CLI Coordination — `github-coord` skill):** Uses GitHub Issues, 9 canonical labels, 15 protocol tags, `feat/issue-<N>-<slug>` PRs, Single-Account Mode, and atomic 7-step merges via `gh` CLI (100% compatible with `github-multi-agent-skill` v1.2).

## 1. Strict Folder Ownership (Single-Writer Discipline)
NEVER edit files outside your assigned scope:
- `brief/RAW_THEME.md`, `brief/data/*`: **READ-ONLY** after 11:00 intake.
- `brief/SSOT.md`: Written by `orchestrator` (min 0–15). After deploy, ONLY `app-builder` updates Section 6 (`Facts Sheet & Verbatim UI Words`).
- `brief/NUMBERS.json`: Initialized by `orchestrator` (min 15); financial numbers locked **exclusively by `cfo`** (min 60, `"status": "LOCKED"`); `live_app_url` + `ui_contract` updated **exclusively by `app-builder`** after deploy. All other agents treat it as **READ-ONLY**.
- `app/` (and `docs/` if GitHub Pages): Exclusively **Teammate 1 + `app-builder`**.
- `deliverables/01-strategy/`: Exclusively **Teammate 2 + `strategist`**.
- `deliverables/02-finance/`: Exclusively **Teammate 2 + `cfo`**.
- `deliverables/03-promo/`: Exclusively **Teammate 3 + `pr-marketer`**.
- `deliverables/05-pitch/`: Exclusively **Teammate 3 + `pitch-director`**.
- `deliverables/06-audit/`: Exclusively **`jury-auditor`** (run in a **fresh zero-history window**).
- `deliverables/04-ai-journal/`: Exclusively **`ai-journalist`**.

## 2. Facts Sheet & Verbatim UI-Words Rule (Field-Tested)
- All financial totals come **solely** from `deliverables/02-finance/financial_model.xlsx` → synced to `brief/NUMBERS.json`.
- All UI button labels and demo expected outputs come **solely** from the live app → synced to `brief/SSOT.md` (Section 6) & `brief/NUMBERS.json` (`ui_contract`).
- Strategy, Promo, Pitch, and `DEMO_INSTRUCTIONS.md` MUST quote those exact labels and figures verbatim.

## 3. Sync Checkpoints & Contest Clock (11:00–14:00)
- **STALE_CLAIM_TTL_MINUTES = 10** | **REVIEW_MAX_ROUNDS = 2**
- **11:15 (Sync 1 — SSOT Lock):** Fail-fast check passes (0 `<REQUIRED:` placeholders); commit & push `brief/SSOT.md` + `brief/NUMBERS.json`.
- **12:00 (Sync 2 — Numbers Lock):** `cfo` pushes `financial_model.xlsx` + locked `brief/NUMBERS.json`; Teammates 1 & 3 pull.
- **12:55 (Sync 3 — App Live + UI Contract Lock):** `app-builder` pushes live URL + `ui_contract`; all deliverables complete.
- **13:00 (Audit):** Fresh-context `jury-auditor` runs `check_consistency.py` + `smoke_test_app.py`.
- **13:40 (HARD MERGE FREEZE):** Only BLOCKER fixes after 13:40.
- **13:50 (Tag & Submit):** Run `./scripts/package_submission.sh --tag` (`git tag submission`) and upload before 14:00.

## 4. Shell & Git Hygiene Rules (Cross-Platform Linux + Windows)
- Scope diff check MUST use **three-dot diff**: `git diff --name-only origin/main...HEAD` (never two-dot `..`, which falsely flags merged `main` files).
- Write scratch logs/temp files **outside the git worktree** (e.g. `/tmp` or OS temp dir) so they are never committed accidentally.
- When posting GitHub Issues/PRs/comments via `gh`, ALWAYS write UTF-8 (no BOM) files and pass `--body-file <file>`. Never inline multi-line `--body` or complex `--jq` in PowerShell.
- On Windows PowerShell, capture command stdout/stderr with Python `subprocess.run(..., capture_output=True, text=True)`, never `> out.txt 2>&1` (avoids UTF-16 & `NativeCommandError` corruption).
- **Mandatory Prompt Logging:** Every builder agent MUST write a short `PROMPT_LOG.md` in its own folder (tool used, 1 key prompt, 1 real AI error caught & fixed) so `ai-journalist` compiles authentic evidence in 5 minutes.
