# AGENTS.md — AI-Powered Business Challenge 2026 (UPB / FAIMA)

This repository is a **Kiro-native multi-agent workspace** (open **AgentSkills** standard + **GitHub CLI coordination**) designed to turn a surprise business brief into **6 regulation-compliant deliverables in 3 hours** (*AI-Powered Business Challenge 2026*, 20 Nov 2026, 11:00–14:00).

## 1. Golden Rules
1. **Instruction vs. Output Language:** All instructions, steering docs, agents, and skills are in **English** for maximum precision and token efficiency. **All generated contest deliverables MUST be written in clear, executive Romanian** (switch to English ONLY if the official prompt explicitly requires English).
2. **Single Source of Truth (SSOT) & Facts Sheet:** Never invent prices, metrics, UI labels, or claims outside:
   - `brief/RAW_THEME.md` + `brief/data/` — official prompt & dataset received at 11:00 (read-only once pasted).
   - `brief/SSOT.md` — locked strategic decisions + **Facts Sheet & Verbatim UI Words**.
   - `brief/NUMBERS.json` — canonical numbers (`status: "LOCKED"` after CFO Excel run) + `ui_contract`.
   **Every deliverable (App, Strategy, Excel, Promo, Pitch) MUST match `brief/NUMBERS.json` and the live app verbatim.**
3. **Fail-Fast Gate:** Do NOT start parallel deliverable generation while `brief/SSOT.md` or `brief/NUMBERS.json` still contains unresolved `TBD` / `<REQUIRED:` placeholders (except `live_app_url` before first deploy).
4. **Hard Contest Clock:** `STALE_CLAIM_TTL_MINUTES = 10` | `REVIEW_MAX_ROUNDS = 2` | **13:40 Merge Freeze** (only BLOCKER fixes after 13:40) | `git tag submission` at 13:50.

## 2. Strict Folder Ownership (Dual-Mode: Zero Git Conflicts + Optional GitHub Issues/PRs)
Works seamlessly both with **GitHub CLI coordination** (`github-coord` skill: 15 tags, 9 labels, PRs, atomic merge, Resume Protocol) AND **direct disjoint-branch pushes**. Each agent writes **EXCLUSIVELY** in its owned folder:

| Agent (`.kiro/agents/`) | Primary Skills (`.kiro/skills/`) | Exclusive Write Scope | Human Owner |
| :--- | :--- | :--- | :--- |
| `orchestrator` | `theme-intake`, `github-coord` | `brief/SSOT.md`, `brief/NUMBERS.json` | All 3 (min 0–15) |
| `app-builder` | `web-prototype`, `frontend-craft`, `frontend-design`, `copywriting-anti-slop` | `app/` (or `docs/` Pages fallback) | Teammate 1 (Tech) |
| `cfo` | `financial-model` | `deliverables/02-finance/` (+ locks `brief/NUMBERS.json`) | Teammate 2 (Biz) |
| `strategist` | `product-marketing`, `strategy-onepager`, `copywriting-anti-slop` | `deliverables/01-strategy/` | Teammate 2 (Biz) |
| `pr-marketer` | `promo-asset`, `copywriting-anti-slop`, `product-marketing` | `deliverables/03-promo/` | Teammate 3 (PR) |
| `pitch-director` | `pitch-deck`, `copywriting-anti-slop`, `product-marketing` | `deliverables/05-pitch/` | Teammate 3 (PR) |
| `jury-auditor` | `jury-evaluator`, `frontend-craft`, `frontend-design`, `copywriting-anti-slop`, `github-coord` | `deliverables/06-audit/` | Fresh session (13:00) |
| `ai-journalist` | `ai-journal` | `deliverables/04-ai-journal/` | All 3 (13:20–13:40) |

## 3. Non-Negotiable Integrity Rules (Regulament Sec. 3, 7, 9)
1. **Zero fake features & zero real personal data (GDPR):** Every claimed feature must work live; use exclusively synthetic/fictive test data (`.example` emails, no real phone/CNP/CUI/addresses).
2. **Mandatory Transparency (Sec. 7):** Declare this Kiro skill setup, utility scripts, `github-multi-agent-skill` v1.2, `anthropics/skills` (`frontend-design`), and MIT frameworks (`marketingskills`, `taste-skill`, `ui-ux-pro-max`) in the AI Journal.
3. **Skip Zero-Point Optionals:** Do NOT build videos, extra financial scenarios, or partner offers before all 6 mandatory deliverables score `> 90/100` with `jury-auditor`.
