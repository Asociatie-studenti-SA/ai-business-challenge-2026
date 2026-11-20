# Jurnal AI — PaletCheck UR20 (Tech-Con Industry)
**Competiție:** AI-Powered Business Challenge 2026 (UPB / FAIMA) | **Prototip:** `https://paletcheck-ur20-techcon.netlify.app`

## 1. Instrumente AI utilizate și verificare umană
- **Kiro (spațiu multi-agent pe ramuri Git):** orchestrare SSOT (`SSOT.md`, `NUMBERS.json`) și agenți dedicați pe livrabile (`app-builder` pentru aplicația React/Vite, `cfo` pentru Excel `openpyxl`, `pr-marketer` pentru afiș și text LinkedIn).
- **Google Antigravity:** depanare vizuală 3D Canvas, deploy Netlify, smoke-test automat pe DOM live și audit de consistență.
- **Verificare obligatorie:** 83/83 teste Vitest și `fast-check`, evaluator independent pe 99 formule Excel (0 erori), verificare vizuală 1280 px și 360 px, filtru anti-clișee AI.

## 2. Trei prompturi relevante
1. **Tech (`app-builder`):** *„Build PaletCheck UR20 — mobile-first Romanian web tool (Slate + Deep Teal/Amber, zero violet, zero emoji, zero login wall) for food factory managers evaluating a Tech-Con UR20 cell, with buttons «Încarcă caz normal (Demo)», «Testează date lipsă / erori», «Evaluează compatibilitatea UR20», «Generează cerere relevantă (CRM)».”*
2. **Finanțe (`cfo`):** *„Write build_techcon_model.py (`openpyxl`, `fullCalcOnLoad=True`) generating financial_model.xlsx in Romanian with 3 sheets: 7 promo lines summing to 30,000 EUR (65% Q1–Q2, 45-day stop rule); funnel 120→54→12→17 cells; net-profit check with 16% tax, missing overhead note, +3 cell buffer and hub split. Zero hardcoded totals.”*
3. **Promovare (`pr-marketer`):** *„Construiește promo_poster.html (1080×1350, comparație pe reperul FAT PURATOS, notă că paleții și separatoarele rămân manuale) și promo_copy.md LinkedIn (130–170 cuvinte, zero clișee AI/emoji, CTA spre PaletCheck UR20).”*

## 3. Rezultate AI verificate și corectate de echipă
- **Model financiar — virgulă mobilă & profit net:**
  - *Rezultat AI:* controlul `Q1+Q2 ≥ 65%` afișa fals „Atenție: sub 65% în S1” la 35% + 30%, iar `310.000 EUR` risca etichetarea drept profit net.
  - *Detectare:* evaluatorul independent pe 99 formule a arătat `C10 = 0,6499999…`; analiza brief-ului a confirmat lipsa regiei și impozitului.
  - *Corecție:* am adăugat `ROUND(...)` în verificările 65% și 30.000 EUR (`OK`) și am separat rezultatul brut (310.000 EUR) de profitul net indicativ după impozit 16% (260.400 EUR), plus buffer de 20 celule.
- **Aplicație web & Promo — validare, 3D și zero funcții fragile:**
  - *Rezultat AI:* emailul gol bloca evaluarea (stricând demo-ul cu 3 erori), etichetele 3D acopereau paletul P2, tabul experimental `Photo-Fit` distorsiona scara pe poze reale, iar primul afiș promitea „fără opriri”.
  - *Detectare:* teste Vitest, inspecție vizuală și verificare față de brief.
  - *Corecție:* am separat validarea evaluării de CRM, am mutat adnotările 3D pe strat superior, am eliminat `Photo-Fit` păstrând previzualizarea deterministă 3D/2D și am refăcut afișul cu mențiuni FAT PURATOS exacte.

## 4. Transparență și conformitate (Regulament Secț. 7 & 9)
Declarăm utilizarea skill-urilor Kiro și scripturilor utilitare (`openpyxl`, `python-pptx`, Headless Chrome) — zero conținut pre-generat pe tema Tech-Con. Workspace-ul adaptează protocolul `github-multi-agent-skill` v1.2 și resurse open-source: `anthropics/skills` (`frontend-design`), `coreyhaines31/marketingskills`, `Leonxlnx/taste-skill`, `nextlevelbuilder/ui-ux-pro-max-skill`. Datele sunt 100% fictive (`.example`, zero date personale reale / GDPR).
