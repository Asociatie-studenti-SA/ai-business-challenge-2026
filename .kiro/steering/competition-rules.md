---
inclusion: always
---

# Official Competition Rules — AI-Powered Business Challenge 2026 (UPB / FAIMA)

All agents MUST strictly comply with the official Regulament v3 (2026).

## 1. Output Language Policy (CRITICAL)
- **Workspace instructions (steering, agents, skills, code comments):** English.
- **All 6 contest deliverables (App UI, Strategy, Excel labels, Promo, AI Journal, Pitch):** **Clear, natural, executive Romanian** by default. Switch deliverable output to English ONLY if `brief/RAW_THEME.md` explicitly requests English (`brief/NUMBERS.json -> output_language`).

## 2. Format, Clock & Scope
- **Build Window:** 3 hours (Students: 20 Nov 2026, 11:00–14:00). Hard merge freeze at **13:40**; only BLOCKER fixes after 13:40.
- **Brief & Working Data:** Revealed simultaneously at 11:00 (`brief/RAW_THEME.md` + `brief/data/`). Every deliverable MUST explicitly incorporate the theme and provided data.
- **Zero-Point Optionals:** Video recordings, multiple financial scenarios, and partner offers earn **0 extra points**. NEVER build them before all 6 mandatory deliverables pass audit > 90/100.

## 3. The 6 Mandatory Deliverables (Sec. 5)
1. **Published Web Prototype:** Publicly accessible live URL, ≥1 testable core function, simple end-to-end user flow (<= 3 steps). Demonstrates the idea cleanly; does NOT require a backend LLM. Fictive test data only.
2. **One-Page Strategy:** **STRICT MAX 1 A4 PAGE** covering all 5 mandatory headings: (1) Problem, (2) Target Audience, (3) Solution, (4) Customer/User Acquisition, (5) **Three Implementation Steps**.
3. **Financial Model:** **Editable spreadsheet with real formulas** (`.xlsx`, `fullCalcOnLoad=1`), main assumptions, costs, revenues, and estimated result in **one base scenario**.
4. **Promotional Asset:** One post or poster containing a clear **message**, **visual element**, and **call-to-action (CTA)** tailored to the target audience.
5. **AI Journal:** **STRICT MAX 1 A4 PAGE** containing: (a) AI tools used, (b) **3 relevant real prompts**, (c) **≥1 concrete AI output verified and corrected by the team**, (d) explicit declaration of prepared templates, scripts, and external MIT-licensed skills (Sec. 7).
6. **Pitch & Demo:** **STRICT MAX 5 SLIDES** + live prototype URL + short test instructions matching exact live UI button labels. (Finals: max 3 min pitch+demo + 2 min Q&A).

## 4. Dual Scoring Rubric & Tie-Breaker Order (Sec. 6)

### A. Preselection (AI-assisted on rubric + human verification; Top 10, min 60/100)
- **App & UX:** 35 pts *(Tie-breaker #1)*
- **Strategy & Financial Model:** 25 pts *(Tie-breaker #2)*
- **Critical Use of AI:** 15 pts *(Tie-breaker #3)*
- **Promotional Asset:** 15 pts
- **Submitted Pitch:** 10 pts

### B. Live Finals (5 Business Jurors; Preselection score does NOT carry over)
- **App & Live Demo:** 30 pts *(Tie-breaker #1)*
- **Strategy & Financial Model:** 30 pts *(Tie-breaker #2)*
- **AI Use & Understanding:** 20 pts *(Tie-breaker #3)*
- **Presentation & Q&A:** 20 pts

## 5. Integrity & Privacy (Sec. 7 & 9 — Automatic BLOCKER)
- **FORBIDDEN:** Plagiarism, claiming or demoing unbuilt/fake features, entering real personal data (GDPR: real names, phones, emails, CNP, CUI, IBAN, street numbers) into AI tools or the app.
- **REQUIRED:** 100% synthetic demo data (`.example` emails), transparent Sec. 7 declaration in AI Journal of our Kiro skill suite, `github-multi-agent-skill` v1.2, and MIT upstream skills (`coreyhaines31/marketingskills`, `Leonxlnx/taste-skill`, `nextlevelbuilder/ui-ux-pro-max-skill`).
