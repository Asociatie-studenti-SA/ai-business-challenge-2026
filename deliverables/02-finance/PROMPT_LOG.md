# PROMPT_LOG - Model financiar (cfo)

**Instrument AI:** Kiro (agent `cfo`, model Claude Opus 5.5) + Python `openpyxl`. Verificare formule: biblioteca `formulas` (calcul independent al fiecărei celule) + `check_consistency.py`.

## Prompt cheie

> Act as `.kiro/agents/cfo.md`. Write a custom Python script `deliverables/02-finance/build_techcon_model.py` (`openpyxl`, `fullCalcOnLoad = True`) that generates `financial_model.xlsx` in Romanian with 3 formula-driven sheets: (1) the 7 promo allocations summing via `=SUM` to exactly 30,000 EUR with Q1-Q4 pacing 65% front-loaded and a 45-day stop rule; (2) the funnel 120 → 54 → 12 → 17 cells with all required metrics as live formulas; (3) the net-profit check with 16% tax, missing overhead data, +3 cell buffer and hub capacity split. Zero hardcoded totals.

## Eroare AI detectată și corectată de echipă

- **Rezultat inițial (AI):** Verificarea "Q1 + Q2 ≥ 65%" din foaia Buget afișa `Atenție: sub 65% în S1`, deși ritmul era 35% + 30% = 65%.
- **Cum am detectat:** Am recalculat toate cele 99 de formule cu un evaluator independent. Celula `C10` dădea `0,6499999…`, nu `0,65` (eroare de rotunjire în virgulă mobilă). Același risc exista la verificarea plafonului de 30.000 EUR.
- **Corecția echipei & impact:** Am pus `ROUND(...)` în ambele verificări. Acum afișează `OK: ≥65% în S1` și `OK: exact plafonul`. Fără corecție, un jurat BCR care deschide Excelul ar fi văzut un avertisment fals chiar în foaia de buget.

## Ipoteză rafinată

- În `brief/NUMBERS.json`, câmpul `net_profit` era 310.000 EUR. Acesta este rezultatul **înainte** de regie și impozit, nu profit net. Am păstrat valoarea pentru compatibilitate și am adăugat `net_profit_note` plus profitul net indicativ după impozit 16%: 260.400 EUR. Echipa nu trebuie să numească 310.000 EUR "profit net" în pitch.

## Evaluare cu juriu simulat și îmbunătățiri (runda 2)

- **Instrument:** 4 sub-agenți Kiro care joacă juriul (BCR, ISF, Mainfreight, comisia de preselecție), cu skill-ul `contest-jury`. Scoruri runda 1 pentru F2: 24 / 24,5 / 23 din 30; P2: 19,5 / 21 / 19 / 23 din 25.
- **Ce lipsea:** fluxul de numerar și cine finanțează pierderea de la început, calendarul pe luni cu termenul din august, un break-even real pe luni, regula de 45 de zile măsurabilă pe canale, sensibilitatea la regie și cost, o foaie de sumar.
- **Eroare AI corectată:** câmpurile `net_profit` (310.000) și `break_even_month: 2` din NUMBERS.json erau greșite: 310.000 EUR este rezultatul înainte de regie și impozit, iar 2 înseamnă celule, nu luni. Le-am scos. Break-even-ul real pe luni este **mai**.
- **Eroare la generarea foii:** antetul `= alocare hub` era citit de Excel ca formulă și dădea #NAME?. L-am găsit la recalcularea în Excel și l-am redenumit. Rezultat: 453 formule, 0 erori.
