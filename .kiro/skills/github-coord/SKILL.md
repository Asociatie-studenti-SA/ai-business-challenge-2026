---
name: github-coord
description: Field-tested GitHub CLI multi-agent coordination, Single-Account Mode, Atomic 7-Step Merge Transaction, Shell-Safe posting, and Quota Resume Protocol (adapted from github-multi-agent-skill v1.2 for 3-hour hackathons).
triggers: [github-coord, coord, resume, gh-sync]
always: false
---

# Playbook: GitHub CLI Multi-Agent Coordination & Resume Protocol

> **Attribution (AI Journal Sec. 7):** Adapted from the field-tested `github-multi-agent-skill` v1.2 (2026-11-19) for 3-hour business challenges, interoperable with both Kiro agents and sibling terminal/chat agents sharing the same GitHub repository.

Use this skill when syncing multiple AI windows/teammates through GitHub Issues & PRs, OR whenever an interrupted session must resume after quota exhaustion or crash.

---

## 1. Channel Detection & Cross-Platform Safety
Detect the GitHub channel before mutating anything:
1. Run `gh auth status` → if logged in, use **`GH_CLI`** mode (preferred).
   - *Windows gotcha:* Right after `winget install GitHub.cli`, `gh` is not on PATH until a new shell opens; call `& "C:\Program Files\GitHub CLI\gh.exe"` if needed.
   - *Code hygiene:* NEVER display a GitHub device login code to a human before `gh auth login --web` actually prints it. NEVER read browser cookies/tokens.
2. If `gh` is unauthenticated, fall back to **Disjoint-Folder Git mode** (`git pull --rebase && git push` inside exclusive folders) or halt in 1 concise prompt asking the human to run `gh auth login --web --git-protocol https`.

---

## 2. Canonical Protocol Parity (9 Labels & 15 Tags)
Keep exact parity with `github-multi-agent-skill` v1.2 so every teammate's agent speaks the same language:

- **9 Labels:** `type:tracker`, `type:task`, `status:ready`, `status:in-progress`, `status:in-review`, `status:changes-requested`, `status:conflict`, `status:blocked`, `status:needs-human`.
- **7 Coordinator Tags:** `[COORD:INIT]`, `[COORD:ASSIGN]`, `[COORD:REVIEW]`, `[COORD:REBASE]`, `[COORD:RULING]`, `[COORD:PING]`, `[COORD:CLOSE]`.
- **7 Session Tags:** `[SESSION:ONLINE]`, `[SESSION:CLAIM]`, `[SESSION:PROGRESS]`, `[SESSION:PR_READY]`, `[SESSION:FIXED]`, `[SESSION:CLARIFY]`, `[SESSION:BLOCKED]`.
- **1 Subagent Tag:** `[SUBAGENT:REPORT]`.
- **Branch / PR Contract:** `feat/issue-<N>-<slug>`, PR body MUST contain `Closes #<N>`, `Summary`, `Files Touched`, `Verification Command`, and `Verbatim Output` (`exit=0`).
- **3-Hour Defaults:** `STALE_CLAIM_TTL_MINUTES = 10` | `REVIEW_MAX_ROUNDS = 2` | **Hard Merge Freeze = 13:40**.

---

## 3. Single-Account Mode (Hackathon Essential)
When all agents share ONE GitHub user account:
- Agent identity lives in the tag (`agent=<id>` on `[SESSION:*]`; `[COORD:*]` = Coordinator).
- **Review of record:** The `[COORD:REVIEW]` PR comment IS authoritative. GitHub rejects approving your own PR — NEVER retry formal self-approval and NEVER enable branch protection requiring approving reviews.
- **No self-merge:** Session Agents NEVER merge; only Coordinator turns execute merges.

---

## 4. Shell-Safe Posting & Diff Rules (Linux + Windows PowerShell)
1. **Always `--body-file`:** Write every multi-line Issue/PR/comment body to a UTF-8 (no BOM) scratch file **outside the git worktree** (`/tmp/...` or `%TEMP%\...`) and pass `--body-file <file>`. Never inline multi-line `--body "..."`.
2. **PowerShell quoting:** NEVER use complex `--jq` expressions in PowerShell (`gh ... --json ... | ConvertFrom-Json` instead). Match tags with `.StartsWith("[SESSION:CLAIM]")`, NEVER `-like "[SESSION:CLAIM]*"` (`[...]` is a wildcard class in PowerShell!).
3. **Clean test capture on Windows:** Never use `> out.txt 2>&1` in PowerShell 5 (writes UTF-16 + `NativeCommandError` noise). Use Python `subprocess.run(..., capture_output=True, text=True)` to capture UTF-8 verbatim output + exact exit code.
4. **Three-dot scope diff:** Verify changed files via `git diff --name-only origin/main...HEAD` (THREE dots — two-dot `..` falsely includes files merged from `main`).

---

## 5. Atomic 7-Step Merge Transaction (Coordinator — Single Turn!)
Execute steps 1–7 back-to-back in ONE turn (prevents stale labels & missing close tags):
1. Verify PR head SHA still equals the `APPROVED` `head_sha` (if moved, re-review!).
2. Strip `status:*` label from Issue `#N` and PR `#P`.
3. Merge via `gh pr merge <P> --squash --delete-branch --match-head-commit <APPROVED_head_sha>`.
4. Post `[COORD:CLOSE] issue=#<N> pr=#<P> merge_sha=<sha> unblocked=<none|#K>` on Issue `#N` and PR `#P`.
5. Update Master Tracker `#1` dashboard + **Facts Sheet** (numbers & verbatim UI words from merged files only).
6. Unlock any `status:blocked` Issues whose `Blocked-by` are now all closed (`status:blocked -> status:ready` + `[COORD:ASSIGN]`).
7. Re-check remaining open PRs against updated `main`; on conflict/HTTP 405, swap to `status:conflict` and post `[COORD:REBASE]`.

---

## 6. Quota / Crash Resume Protocol (`PROMPT C: RESUME`)
If a session dies mid-sprint, open a fresh window and reconcile **solely from GitHub + repo state**:

| Observed State on GitHub | Coordinator Action | Session Agent Action |
| :--- | :--- | :--- |
| Closed Issue / merged PR still has `status:*` label | Strip label, post missing `[COORD:CLOSE]`, update Tracker `#1` | Never reopen; claim next `status:ready` Issue |
| `status:blocked` whose `Blocked-by` are all closed | Swap `status:blocked -> status:ready` + `[COORD:ASSIGN]` | Wait until `status:ready` |
| Open PR, no `[COORD:REVIEW]` for current `head_sha` | Run Two-Stage SHA-pinned review + live test | Wait for `[COORD:REVIEW]` |
| `[SESSION:FIXED]` newer than last `[COORD:REVIEW]` | Ensure `status:in-review`; re-review new SHA | Wait for `[COORD:REVIEW]` |
| `status:changes-requested` | Relay findings to Session Agent | Merge `origin/main`, fix findings, re-test, push, swap `-> status:in-review`, `[SESSION:FIXED]` |
| `status:conflict` | Relay `[COORD:REBASE]` | Sync `origin/main`, resolve, re-test, push, swap `-> status:in-review`, `[SESSION:FIXED]` |
| `[COORD:REVIEW] APPROVED` on current SHA, PR open | Complete 7-Step Merge Transaction | Wait for merge |
| `status:in-progress`, no PR, heartbeat > 10m | Post `[COORD:PING]` → reclaim if silent | Resume on `feat/issue-<N>-<slug>`, post `[SESSION:PROGRESS]` |
