# RAW THEME — AI-Powered Business Challenge 2026 (Secțiunea Studenți, 20 nov. 2026)

## Provocarea Tech-Con Industry: Implementarea unei celule robotice în industria alimentară

### 1. Misiunea echipei
Construiți în 3 ore, cu ajutorul AI, un **prototip web** (accesibil din browserul telefonului) și o **propunere de business + promovare digitală** pentru extinderea în România a soluțiilor de **paletizare cu UR20** de tipul celei implementate de **Tech-Con Industry** la **PURATOS**.
- Soluția trebuie să ajute un client industrial să **înțeleagă, să evalueze sau să solicite** o aplicație și să susțină un plan comercial realist.
- NU proiectăm mecanica robotului, NU programăm un robot real, NU construim un produs software complet.

### 2. Repere tehnice reale — Aplicația PURATOS (Fapte verificate vs. Limite!)
- **Client de referință:** PURATOS (ingrediente & soluții pentru panificație, patiserie, ciocolaterie).
- **Înainte de automatizare:** Paletizare manuală — **2 operatori / schimb**, **2–3 schimburi / zi**.
- **Produse manipulate:** Găleți din plastic de **5 kg** (100 găleți / europalet) și **13 kg** (44 găleți / europalet).
- **Soluția Tech-Con la PURATOS:** **2 celule UR20** cu transportoare de alimentare, **dispozitive pneumatice de prindere personalizate (gripper)**, **vedere SICK 2D** pentru identificarea orientării mânerului înainte de preluare, **2 poziții de paletizare per celulă**, **3 scanere de protecție** (reducere viteză / oprire de protecție). Livrare indicată: **~4 luni**.
- **Rezultate test FAT:** Țintă minim **6 găleți/minut**. Testat: **7,4 găleți/min (13 kg, +23% peste țintă)** și **8,6 găleți/min (5 kg, +43% peste țintă)**. Zero preluări nereușite la FAT.
- **Ce rămâne MANUAL:** Schimbarea paleților și amplasarea separatoarelor.
- **STRICT ÎN AFARA SCOPULUI (NU atribuiți economii, costuri sau funcții automate!):** Transportul paleților către logistică (MiR este doar o etapă viitoare propusă), înfolierea și expedierea.
- **Atenționări critice din brief:**
  - Rezultatele FAT PURATOS sunt rezultate de test ale acelei aplicații, NU garanții fără opriri/erori în orice fabrică!
  - Un robot mai rapid NU crește automat debitul întregii fabrici — verificați blocajul din amonte sau din aval.
  - Sarcina totală include gripperul (`greutate găleată + gripper <= capacitate UR20 de 20 kg`).
  - Nu este necesar să calculăm economii salariale sau ROI/payback pentru client.
  - Pentru industrii non-alimentare, cerințele tehnice trebuie validate separat.

### 3. Date comerciale & financiare de scenariu (EUR fără TVA, 1 an calendaristic: 1 ian – 31 dec)
*(Date de exercițiu pentru concurs — NU reprezintă prețurile reale ale proiectului PURATOS!)*
- **Sedii operaționale Tech-Con în România:** **Dragomirești-Deal** (Ilfov/București), **Iași**, **Timișoara**.
- **Buget anual de promovare:** **30.000 EUR / an** (plafon fix; suma alocărilor + rezerva distinctă = exact 30.000 EUR; niciun cost numărat de două ori).
- **Preț de vânzare celulă UR20 (integrată, instalare, instruire):** **130.000 EUR**.
- **Cost direct celulă UR20 (echipamente, realizare, instalare, instruire):** **110.000 EUR**.
- **Contribuție pe celulă:** **20.000 EUR** (nu este automat profit net!).
- **Ținta solicitată de acționari:** **300.000 EUR profit net / an** (după toate costurile și impozitul; datele pt. celelalte costuri indirecte și impozit nu sunt încă precizate în brief — echipa trebuie să arate ce lipsește și ce rezervă comercială propune!).
- **Regulă contabilă an calendaristic:** Se consideră celule **vândute și livrate** în anul analizat (1 ian – 31 dec).

### 4. Cerințe specifice livrabile
1. **Aplicație web:** Simplă, accesibilă din browserul telefonului (PWA-friendly), link public, funcție principală testabilă cu date fictive care demonstrează **atât un caz normal, cât și un caz cu date lipsă sau greșite** (Anexa 1, Q8).
2. **Strategie (max. 1 pagină):** Problemă, segment/decident, soluție, atragere clienți, scalare națională din Dragomirești-Deal / Iași / Timișoara, 3 pași.
3. **Model financiar (.xlsx editabil cu formule):** Date comune, total promovare (= 30.000 EUR), contribuție/celulă, venit anual, cost direct anual, rezultat după promovare (înainte de alte costuri & impozit), cost pe cerere / client; argumentare nr. celule pt. ținta acționarilor + date financiare lipsă & rezervă.
4. **Material de promovare:** O postare sau un afiș cu public clar, mesaj (distingând faptele PURATOS de ipoteze!), vizual și CTA conectat la parcursul digital.
5. **Jurnal AI (max. 1 pagină):** Instrumente, 3 prompturi reale, ≥1 rezultat AI verificat și corectat, declarație șabloane/resurse externe.
6. **Pitch & Demo (max. 5 slide-uri):** Problema, funcția, valoarea, finanțele, pașii + link & instrucțiuni de testare.
