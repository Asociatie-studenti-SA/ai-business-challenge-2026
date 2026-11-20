# Apărare Q&A (răspunsuri 20s cu aritmetică)

**1. BCR / Tech-Con — De ce 17 celule vs. ~20 cu impozit 16%?**
Contribuția: `130.000 - 110.000 = 20.000 EUR/celulă`. Pentru 300k + 30k promovare: `330.000 / 20.000 = 16,5 → 17 celule` (`310.000 EUR` **înainte** de regie și impozit). Cu 16% impozit (fără regie): `310.000 × 0,84 = 260.400 EUR`. Pentru 300k net trebuie `300.000 / 0,84 = 357.143 EUR` brut → `(357.143 + 30.000) / 20.000 = 19,36 → 20 celule` (`+3` buffer). Regia reală intră în celulele roșii din Excel și recalculează pragul instant.

**2. BCR — De ce cut-off în august și 65% buget în S1?**
Livrarea durează ~4 luni; contăm doar celulele vândute **și livrate** în anul calendaristic. Comenzile după 31 august trec în anul 2. Alocăm `10.500 EUR` Q1 (35%) și `9.000 EUR` Q2 (30%); la 45 zile, canalele `>400 EUR/cerere` se taie cu 50%. Promovarea se acoperă din `ROUNDUP(30.000 / 20.000) = 2 celule`.

**3. Tech-Con / Alumil — Cum livrează 3 hub-uri 17 celule?**
**Dragomirești-Deal 9**, **Timișoara 4**, **Iași 4**. La `7 instalări/trimestru` (`3+2+2`), fereastra de 8 luni (12 − 4 luni livrare) acoperă **18 celule** (utilizare 94%, gestionată prin contractare S1).

**4. Tech-Con — De ce lipsesc MiR, înfolierea și garanțiile?**
Respectăm scopul PURATOS: paleții și separatoarele rămân manuale; MiR, înfolierea și expedierea nu intră în 130.000 EUR. Ritmul FAT (`7,4`/`8,6 găleți/min`) este reper de test, nu garanție fără opriri; aplicația calculează și blocajul aval (schimb manual palet).

**5. Orange — GDPR?**
Zero date reale: fără cont, doar domenii `.example`, salvare strict locală în browser.

**6. Juriu AI — 1 eroare AI reală per coleg:**
- **C1 (Tech):** AI bloca evaluarea pe email gol (4 erori vs. 3) și punea etichete 3D sub palet → validare CRM separată + strat superior (91/91 teste).
- **C2 (Finance):** Formula `Q1+Q2 ≥ 65%` dădea fals negativ (`0,64999`) și eticheta 310k ca profit net → `ROUND()` + impozit 16%.
- **C3 (PR):** Primul poster era generic dark-mode → refăcut cu `taste-skill` în schemă tehnică UR20 cu brațul peste europalet.
