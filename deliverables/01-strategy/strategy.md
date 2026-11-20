# Strategie pe o Pagină — PaletCheck UR20 (Tech-Con Industry)

**Prototip live:** https://paletcheck-ur20-techcon.netlify.app | **Model:** Celulă UR20 la cheie (`130.000 EUR`, EUR fără TVA, 1 an calendaristic)

**Indicatori (`financial_model.xlsx`):** Venit An 1 (17 celule): **2.210.000 EUR** | Rezultat după promovare (înainte regie/impozit): **310.000 EUR** | Prag acoperire promovare: **2 celule** | Cost/client: **2.500 EUR** (`20 celule` cu buffer pt. impozit 16%).

---

## 1. Problema
Fabricile alimentare cu găleți de **5 kg (100/palet)** și **13 kg (44/palet)** folosesc paletizare manuală repetitivă: **2 operatori/schimb, 2–3 schimburi/zi** (reper PURATOS). Directorii amână decizia deoarece nu verifică rapid limita `găleată + gripper <= 20 kg`, orientarea mânerului și blocajul aval (schimbul manual al paleților). Inginerii Tech-Con pierd ore pe cereri incomplete, iar livrarea de **~4 luni** impune semnarea comenzilor livrabile în an până la **31 august**.

## 2. Publicul vizat
- **Segment primar:** Fabrici alimentare medii/mari din România (**CAEN 10xx**: panificație, lactate, sosuri, creme) cu găleți **5–15 kg** în 2–3 schimburi. *(Alte industrii precum vopsele/chimice necesită validare tehnică separată.)*
- **Lanț de decizie:** Evaluator pe telefon — **Director Producție / Plant Manager / Inginer Mentenanță**; Decident CapEx — **Director General / CFO** (`130.000 EUR/celulă`, scenariu).

## 3. Soluția
**PaletCheck UR20** (aplicație web mobilă, fără cont, date fictive `.example`) verifică în 60s fezabilitatea preliminară a celulei UR20 (vedere **SICK 2D**, gripper pneumatic, 2 poziții europalet, 3 scanere protecție) și generează o cerere tehnică deduplicată (`.json`) rutată către **Dragomirești-Deal**, **Timișoara** sau **Iași**.
- **Flux testabil:** **`Încarcă caz normal (Demo)`** și **`Testează date lipsă / erori`** + **`Evaluează compatibilitatea UR20`** verifică limita de 20 kg, compară ritmul cu testul FAT PURATOS (`7,4–8,6 găleți/min`, *rezultat de test, nu garanție universală*) și calculează intervalul de schimb palet (`~6,8 min`).
- **Scop transparent:** paleții și separatoarele rămân **manuale**; MiR, înfolierea și expedierea sunt excluse.

## 4. Atragerea clienților și scalarea națională (30.000 EUR)
Concentrăm **65% din buget în Q1–Q2**: **Google Search** (6.500 EUR), **LinkedIn Ads** (5.500 EUR), **studiu PURATOS** (4.500 EUR), **marketing direct CAEN 10xx** (4.000 EUR), **webinare ROMPAN/APRIL** (3.500 EUR), **PaletCheck/SEO** (3.500 EUR) și **rezervă distinctă** (2.500 EUR). La 45 zile, canalele >**400 EUR/cerere** se taie cu 50%; clienții sunt deduplicați. Funnel: **120 cereri** (250 EUR) → **54 întâlniri** (45%) → **12 clienți** (2.500 EUR) × 1,42 celule = **17 celule**.

## 5. Trei pași de implementare
1. **Pas 1 (Q1 — 10.500 EUR):** Lansare `PaletCheck UR20`, studiu PURATOS și campanii **Dragomirești-Deal & Timișoara** (40 cereri, 5 celule).
2. **Pas 2 (Q2–Aug — 9.000 EUR):** Extindere **Iași**, 3 webinare ROMPAN/APRIL, realocare rezervă la 45 zile (17 celule semnate până la 31 august).
3. **Pas 3 (Q3–Q4 — 10.500 EUR):** Instalare pe 3 hub-uri (**Dragomirești-Deal 9, Timișoara 4, Iași 4**; capacitate 18 în 8 luni), audit profit net cu regia reală + 16% impozit (buffer **20 celule**) și pipeline Anul 2.

---
**Risc principal & mitigare:** Utilizare capacitate 94% (17/18) și regie/impozit lipsă în brief; mitigăm prin 65% buget în S1 (cut-off august) și buffer de **+3 celule (20 celule)**.
