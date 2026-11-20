# Jurnal AI — PaletCheck UR20 (Tech-Con Industry)
**Competiție:** AI-Powered Business Challenge 2026 (UPB / FAIMA) | **Prototip:** `https://paletcheck-ur20-techcon.netlify.app`

## 1. Instrumente AI utilizate și verificare umană
- **Kiro (spațiu multi-agent pe ramuri Git):** orchestrare SSOT (`SSOT.md`, `NUMBERS.json`) și agenți dedicați pe toate livrabilele: `app-builder` (aplicația React/Vite cu `GuideChatbot` și 3D/2D), `cfo` (Excel `openpyxl` v3 — 471 formule, 7 foi), `strategist` (strategie 1 pagină), `pr-marketer` (afiș & LinkedIn), `pitch-director` (deck 5 slide-uri + script) și 4 sub-agenți de juriu simulat (BCR, ISF, Mainfreight, Preselecție).
- **Google Antigravity:** depanare vizuală 3D Canvas, deploy producție Netlify, smoke-test live și audit de consistență.
- **Verificare obligatorie:** 91/91 teste Vitest și `fast-check`, evaluator independent pe 471 formule Excel (0 erori), verificare 1280 px / 360 px și filtru anti-clișee AI.

## 2. Trei prompturi relevante
1. **Tech (`app-builder`):** *„Build PaletCheck UR20 — mobile-first Romanian web tool (Slate + Deep Teal/Amber, zero violet, zero emoji, zero login wall) for food factory managers evaluating a Tech-Con UR20 cell, with buttons «Încarcă caz normal (Demo)», «Testează date lipsă / erori», «Evaluează compatibilitatea UR20», «Generează cerere relevantă (CRM)».”*
2. **Finanțe (`cfo`):** *„Write build_techcon_model.py (`openpyxl`, `fullCalcOnLoad=True`) generating financial_model.xlsx in Romanian with formula-driven sheets: 7 promo lines summing to 30,000 EUR (65% Q1–Q2, 45-day stop rule); funnel 120→54→12→17 cells; cashflow 12 luni, sensibilitate și net-profit check cu 16% impozit și +3 buffer. Zero hardcoded totals.”*
3. **Promovare & Pitch (`pr-marketer` / `pitch-director`):** *„Construiește promo_poster.html (1080×1350, comparație FAT PURATOS, paleți/separatoare manual), promo_copy.md (zero clișee/emoji) și pitch_deck.pptx (max 5 slide-uri, cifre sincronizate cu NUMBERS.json).”*

## 3. Rezultate AI verificate și corectate de echipă
- **Model financiar — bug virgulă mobilă, `#NAME?` & clarificare profit/break-even:**
  - *Rezultat AI:* controlul `Q1+Q2 ≥ 65%` afișa fals „sub 65%” (`C10 = 0,6499999…`), antetul `= alocare hub` genera `#NAME?`, iar `NUMBERS.json` confunda `310.000 EUR` cu profit net și `break_even_month: 2` (celule, nu luni).
  - *Detectare:* recalculare independentă pe toate cele 471 formule și evaluare cu juriu simulat (4 agenți).
  - *Corecție:* am aplicat `ROUND(...)`, am redenumit antetul (0 erori), am stabilit break-even-ul lunar real (**mai**) și am separat rezultatul brut (310.000 EUR) de profitul net indicativ după impozit 16% (260.400 EUR), plus buffer de 20 celule.
- **Aplicație web, Promo & Pitch — validare, ergonomie și zero funcții fragile:**
  - *Rezultat AI:* emailul gol bloca evaluarea (stricând demo-ul cu 3 erori), etichetele 3D acopereau paletul P2, tabul experimental `Photo-Fit` distorsiona scara pe poze reale, primul afiș promitea „fără opriri”, iar Slide 3 risca tăierea posterului.
  - *Corecție:* am separat validarea de CRM, am mutat adnotările 3D pe strat superior, am eliminat `Photo-Fit` adăugând ghidul interactiv `GuideChatbot` (91/91 teste verzi), am refăcut afișul ca schemă SVG cu note FAT exacte și am recalibrat layout-ul PPTX/PDF.

## 4. Transparență și conformitate (Regulament Secț. 7 & 9)
Declarăm utilizarea skill-urilor Kiro și scripturilor utilitare (`openpyxl`, `python-pptx`, Headless Chrome) — zero conținut pre-generat pe tema Tech-Con. Workspace-ul adaptează `github-multi-agent-skill` v1.2 și resurse open-source: `anthropics/skills` (`frontend-design`), `coreyhaines31/marketingskills`, `Leonxlnx/taste-skill`, `nextlevelbuilder/ui-ux-pro-max-skill`. Datele sunt 100% fictive (`.example`, zero date personale reale / GDPR).
