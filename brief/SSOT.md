# Single Source of Truth (SSOT) & Facts Sheet — PaletCheck UR20 (Tech-Con Industry)

> **Status:** `LOCKED`
> **Deliverable Output Language:** `Romanian`
> **Currency & Period:** `EUR (fără TVA)` | `1 an calendaristic (1 ianuarie – 31 decembrie)`

## 1. Identity & Positioning
- **Product / Business Name:** `PaletCheck UR20` (instrument digital de pre-evaluare & calificare tehnică pentru celulele de paletizare UR20 ale **Tech-Con Industry**)
- **One-Line Tagline:** `Verifici în 60 de secunde, de pe telefon, compatibilitatea liniei tale de găleți cu o celulă robotică UR20 și trimiți cererea tehnică spre cel mai apropiat sediu Tech-Con.`
- **Commercial Model:** `B2B Industrial CapEx — vânzare și integrare celule de paletizare UR20 la cheie (130.000 EUR/celulă, scenariu concurs)`

## 2. Problem & Mandatory Brief Data
- **Concrete Problem Solved:** Fabricile alimentare din România care ambalează în găleți (5–15 kg) se bazează pe paletizare manuală repetitivă (reper PURATOS: 2 operatori/schimb, 2–3 schimburi/zi), dar directorii de producție amână automatizarea deoarece nu știu rapid dacă greutatea ambalajului (cu gripper), ritmul liniei, poziția mânerului și spațiul din hală permit replicarea unei celule UR20 fără blocaje în amonte/aval. Pe partea Tech-Con, lipsa unei calificări tehnice inițiale consumă ore de inginerie pe cereri incomplete.
- **Official Brief Figures Incorporated (Fapte PURATOS vs. Date Scenariu):**
  - *Fapte test FAT PURATOS (NU garanții universale):* 2 celule UR20, găleți plastic 5 kg (100/europalet) și 13 kg (44/europalet), 2 operatori/schimb în 2–3 schimburi manual; țintă ≥6 găleți/min; testat **7,4 găleți/min (13 kg, +23%)** și **8,6 găleți/min (5 kg, +43%)**; 0 preluări nereușite la FAT; vedere **SICK 2D** pt. orientare mâner + gripper pneumatic + 2 poziții palet + 3 scanere protecție; livrare ~**4 luni**. Schimbarea paleților și amplasarea separatoarelor rămân **manuale**.
  - *Date scenariu concurs (EUR fără TVA, NU prețuri reale PURATOS):* Buget anual promovare **30.000 EUR**; Preț vânzare **130.000 EUR/celulă**; Cost direct **110.000 EUR/celulă**; Contribuție **20.000 EUR/celulă**; Țintă acționari **300.000 EUR profit net/an** (după alte costuri indirecte & impozit neprecizate încă).
  - *Sedii Tech-Con România:* **Dragomirești-Deal** (Sud/Centru), **Timișoara** (Vest), **Iași** (Est).
- **Why Now / Critical Insight:** Livrarea unei celule durează ~**4 luni** → pentru ca o celulă să fie vândută **și livrată** în același an calendaristic (1 ian – 31 dec), comenzile trebuie semnate până cel târziu la final de **august**. De aceea bugetul de 30.000 EUR este concentrat în Q1–Q2 (65% din buget) pentru calificare rapidă!

## 3. Target Audience (ICP)
- **Primary Segment:** Fabrici medii și mari din **industria alimentară din România (CAEN 10xx)** care ambalează produse vâscoase/granulate în **găleți din plastic de 5–15 kg** (panificație/patiserie/ingrediente, lactate/smântână/brânzeturi, sosuri/muștar/maioneză, creme/gemuri/miere), cu producție în 2–3 schimburi. *(Notă explicită: alte industrii precum vopsele/chimice necesită validare tehnică separată ATEX/chimică.)*
- **Buyer vs. Daily User (Decision Chain):**
  - *Inițiator & Evaluator tehnic (folosește PaletCheck UR20 pe telefon):* **Director de Producție / Inginer Mentenanță & Automatizări / Plant Manager**.
  - *Decident bugetar:* **Director General / Responsabil Investiții (CapEx) / Director Financiar**.
- **Fictive Demo Persona (Zero Real PII):** `SC LactoSud Demo SRL`, Județ Ilfov (rutat la Dragomirești-Deal), `Andrei Ionescu (Demo) — Director Producție`, `productie@lactosud-demo.example`, găleți plastic 13 kg cu mâner, 6,5 găleți/min, 2 schimburi/zi, 2 operatori/schimb.

## 4. Solution & Core Testable Feature (Core Loop)
- **Product Summary:** **`PaletCheck UR20`** — aplicație web mobile-first (PWA-ready, accesibilă instant din browserul telefonului lângă linia de producție, fără cont/login) care ghidează directorul de producție să evalueze fezabilitatea tehnică preliminară a unei celule UR20, detectează blocajele din amonte/aval și limita de sarcină (`găleată + gripper <= 20 kg`), și generează o **cerere relevantă gata calificată** rutată automat către sediul Tech-Con cel mai apropiat.
- **Core Testable Flow (<= 3 steps, < 30s test, acopera caz normal + caz erori/date lipsă):**
  1. **Pas 1:** Alege un scenariu rapid (`Încarcă caz normal (Demo)` sau `Testează date lipsă / erori`) ori completează parametrii liniei (segment, regiune, greutate găleată, gripper, ritm găleți/min, schimburi, confirmare intervenții manuale paleți/separatoare).
  2. **Pas 2:** Apasă butonul principal de evaluare → motorul determinist verifică sarcina totală (`<= 20 kg`), compară ritmul cu reperele FAT PURATOS (`7,4–8,6 găleți/min`), calculează **ritmul de schimb manual al paleților** (blocaj aval!) și alocă automat hub-ul Tech-Con (Dragomirești-Deal / Timișoara / Iași).
  3. **Concrete Output Displayed:** Verdict clar (`Compatibil pt. evaluare tehnică` / `Validare suplimentară` / `Eroare date`), 4 KPI cards (Sarcină totală vs. 20 kg, Ritm vs. reper FAT, Frecvență schimb manual palet, Hub Tech-Con & fereastră livrare ~4 luni), avertismente de scop (fără transport MiR / înfoliere) + buton `Generează cerere relevantă (CRM)` cu export `.json` & deduplicare locală.
- **Scope Guard (What We Explicitly DO NOT Build / Claim):**
  - NU simulăm/includem transport automat paleți (MiR), înfoliere sau expediere;
  - NU calculăm economii salariale garantate sau ROI financiar al clientului;
  - NU garantăm 0 opriri / 0 erori în orice fabrică (toate cifrele PURATOS sunt marcate explicit ca *rezultate de test FAT*);
  - NU construim mecanică robot, backend CRM extern sau conturi de login.

## 5. Go-To-Market, National Scaling (30.000 EUR) & 3 Implementation Steps
- **National Hub Strategy:** Pornim din **Dragomirești-Deal** (centru de referință + demonstrații fizice, acoperire Sud/Centru — cea mai mare densitate de fabrici alimentare), extindem simultan prin **Timișoara** (Vest/Banat-Crișana) și **Iași** (Moldova/Nord-Est) prin vizite tehnice locale și webinare regionale.
- **Locked 30.000 EUR Annual Promotion Allocation (100%, zero double-counting):**
  1. `Google Search (intenție activă B2B)`: **6.500 EUR** (21,7%)
  2. `LinkedIn Ads (Director Producție / CapEx)`: **5.500 EUR** (18,3%)
  3. `Conținut tehnic UR20 & Studiu de caz PURATOS (foto, video FAT, fișă)`: **4.500 EUR** (15,0%)
  4. `Marketing direct B2B & CRM (CAEN 10xx legitim, tracking deduplicat)`: **4.000 EUR** (13,3%)
  5. `Webinare tehnice live & Parteneriate asociații (ROMPAN, APRIL, Romalimenta)`: **3.500 EUR** (11,7%)
  6. `Pagină web, PaletCheck UR20 (PWA mobil) & SEO/AI`: **3.500 EUR** (11,7%)
  7. `Rezervă distinctă pentru ajustări trimestriale`: **2.500 EUR** (8,3%)
  - **Regulă de guvernanță buget:** Evaluare la 45 zile; orice canal cu cost/cerere relevantă > 400 EUR sau 0 cereri relevante se reduce cu 50% și se realocă din/spre canalele performante. Un client din mai multe canale se numără O SINGURĂ DATĂ.
- **Commercial Target Math (Base Scenario):**
  - **120 cereri relevante / an** (`250 EUR / cerere relevantă`, buget total) → **45% conversie** → **54 întâlniri tehnice / an** (`556 EUR / întâlnire`) → **22,2% conversie** → **12 clienți industriali câștigați** (`2.500 EUR / client`) × **1,42 celule/client** (reper PURATOS: 2 celule; ex. 5 fabrici × 2 celule + 7 fabrici × 1 celulă) = **17 celule vândute și livrate/an**.
  - **Rezultat după promovare:** `17 × 20.000 - 30.000 = 310.000 EUR` (pragul minim pentru 300.000 EUR înainte de alte costuri și impozit = **17 celule**; prag acoperire buget promovare = **2 celule**).
  - **Transparență Profit Net (întrebarea acționarilor):** Datele pentru regie indirectă (vânzări, service, garanție) și impozit pe profit (16% în RO) nu sunt precizate în brief → pentru 300.000 EUR *profit net real după impozit 16%* (fără regie suplimentară) ar fi necesare `357.143 EUR` brut (~**20 celule/an**); propunem colectarea costurilor indirecte alocate și o rezervă comercială de **10–15% pe marjă / +3 celule buffer**.
- **Core Promo Message + CTA:** `Elimină ridicarea manuală a găleților de 5–13 kg: testează în 60s compatibilitatea liniei tale cu celula UR20 (reper test FAT PURATOS: 7,4–8,6 găleți/min).` | CTA: `Evaluează linia în 60 secunde`
- **Three Implementation Steps:**
  1. **Pas 1 (Q1 — Ian–Mar | Fundație & Lansare Sud/Vest):** Lansare `PaletCheck UR20` + studiu de caz PURATOS + campanii Google Search, LinkedIn și outreach direct CAEN 10xx din Dragomirești-Deal & Timișoara (țintă: 40 cereri relevante, 18 întâlniri, primele 5 celule contractate).
  2. **Pas 2 (Q2 — Apr–Iun | Accelerare Națională & Cut-off Livrare An Curent):** Extindere Iași + 3 webinare cu asociații alimentare + realocare buget din rezerva de 2.500 EUR pe baza costului/cerere la 45 zile (țintă cumulată: 95 cereri, 42 întâlniri, 17 celule contractate până la final de august pt. livrare în ~4 luni).
  3. **Pas 3 (Q3–Q4 — Iul–Dec | Livrare, Instalare & Pipeline Anul 2):** Instalare și instruire celule pe cele 3 hub-uri (**capacitate 7 celule/trimestru**: Dragomirești-Deal 3, Timișoara 2, Iași 2 → **18 celule capacitate în fereastra de livrare de 8 luni**, acoperind ținta de 17 celule), audit financiar profit net (includere regie indirectă + impozit 16% → ~260.400 EUR indicativ fără regie; țintă comercială cu rezervă = **20 celule**, 17 + 3 buffer), construire pipeline Q1 Anul 2.

## 6. Facts Sheet & Verbatim UI Words (Updated Immediately After App Build)
> **CRITICAL:** Strategy, Promo, Pitch, and `DEMO_INSTRUCTIONS.md` MUST quote these exact strings and numbers.

- **Live App URL:** `https://paletcheck-ur20-techcon.netlify.app`
- **Exact Demo Button Label (Normal Case):** `Încarcă caz normal (Demo)`
- **Exact Demo Button Label (Error/Missing Case):** `Testează date lipsă / erori`
- **Exact Primary Submit/Action Button Label:** `Evaluează compatibilitatea UR20`
- **Exact Photo-Fit Calibration Button Label:** `Calibrează scara pe poză` *(2 atingeri pe latura de 1,2 m a unui europalet → scară reală + inel „Rază UR20 1,75 m”; cel mai îndepărtat punct de plasare a găleții este la 1,59 m ≤ 1,75 m; nu se afirmă că brațul atinge colțul exterior de 1,79 m al paletului, iar reconstrucția 3D AI din foto aparține roadmap-ului V2)*
- **Demo Input Summary:** `SC LactoSud Demo SRL | Ilfov | Industrie alimentară (Lactate) | Găleată 13 kg + gripper 3 kg = 16 kg | 6,5 găleți/min | 2 schimburi, 2 operatori | Paleți & separatoare manual`
- **Demo Expected Output (verbatim target):** `Compatibil pentru evaluare tehnică • 16 kg / 20 kg UR20 • 6,5 vs 7,4 găleți/min (reper FAT) • Schimb palet la ~6,8 min (44 găleți/palet) • Hub: Dragomirești-Deal`
- **App Stack & Deploy Target:** `React + Vite + Tailwind in app/ built to docs/ (base: './') -> deployed LIVE on Netlify (https://paletcheck-ur20-techcon.netlify.app, siteId: f705fe01-7c55-4d2f-9d5f-37c12c174dea)`
