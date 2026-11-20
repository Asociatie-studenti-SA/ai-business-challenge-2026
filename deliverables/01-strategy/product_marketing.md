# Context de Product Marketing — PaletCheck UR20 (Tech-Con Industry)

## 1. Poziționare & Categorie
- **One-liner:** `PaletCheck UR20` ajută directorii de producție din fabricile alimentare din România (găleți 5–15 kg) să verifice în 60 de secunde, de pe telefon, fezabilitatea unei celule robotice UR20 și să trimită o cerere tehnică calificată către cel mai apropiat sediu Tech-Con.
- **Categorie:** Instrument digital B2B de pre-evaluare tehnică și calificare CapEx pentru automatizare industrială (paletizare robotică la capăt de linie).
- **Model comercial (scenariu concurs, EUR fără TVA):** Vânzare și integrare celulă UR20 la cheie — **130.000 EUR/celulă** (cost direct 110.000 EUR, contribuție 20.000 EUR/celulă, marjă 15,4%), buget anual de promovare **30.000 EUR**.

## 2. ICP, Decident & Anti-Persona
- **Segment primar (ICP):** Fabrici alimentare medii și mari din România (**CAEN 10xx**: panificație/ingrediente, lactate, sosuri, creme/gemuri) care ambalează în găleți din plastic de **5–15 kg** pe **2–3 schimburi/zi**.
- **Utilizator zilnic vs. Decident financiar:**
  - *Evaluator tehnic (utilizator mobil):* Director de Producție, Plant Manager, Inginer Mentenanță & Automatizări — caută eliminarea ridicării repetitive și claritate pe sarcină/ritm/spațiu.
  - *Decident bugetar (plătește CapEx):* Director General / Director Financiar / Responsabil Investiții — aprobă 130.000 EUR/celulă când riscul tehnic și fereastra de livrare (~4 luni) sunt documentate.
- **Jobs to be Done:** (1) Verificarea rapidă lângă linie a limitei UR20 (`găleată + gripper <= 20 kg`); (2) Depistarea blocajului aval (frecvența schimbului manual de europaleți); (3) Trimiterea unui pachet complet de parametri către echipa de inginerie locală.
- **Anti-persona (pentru cine NU este):**
  - Ateliere mici cu 1 schimb și volume reduse (sub 2 găleți/min);
  - Fabrici non-alimentare cu medii explozive sau corozive (chimice/vopsele — necesită validare tehnică separată ATEX/chimică);
  - Clienți care așteaptă transport automat spre logistică (MiR) sau înfoliere incluse în cei 130.000 EUR.

## 3. Problema & Costul Inacțiunii
- Pe o linie de găleți de 5 kg (100/europalet) și 13 kg (44/europalet), paletizarea manuală consumă **2 operatori/schimb în 2–3 schimburi/zi** (reper real PURATOS).
- Directorii amână proiectul luni întregi pentru că nu au o pre-calificare rapidă a orientării mânerului (vedere SICK 2D), a sarcinii totale cu gripper și a schimbului manual de paleți.
- Din cauza livrării de **~4 luni**, orice întârziere peste **31 august** mută livrarea și încasarea în anul calendaristic următor.

## 4. Peisaj Competitiv (3 niveluri)
- **Direct (alți integratori de celule robotice/coboți):** Oferă ofertare clasică prin email/vizite lungi; lipsesc pre-evaluarea mobilă fără cont și reperul FAT local verificat pe găleți alimentare (PURATOS).
- **Secundar (fișe PDF / tabele Excel trimise prin email):** Nu validează determinist limita de 20 kg cu gripper, nu semnalează blocajele aval și generează cereri incomplete care consumă ore de inginerie.
- **Indirect (status quo — paletizare manuală în 2–3 schimburi):** Zero CapEx inițial, dar efort fizic repetitiv constant și expunere ridicată la fluctuația personalului pe schimburi.

## 5. Diferențiator Real (Testul Swap)
1. **Validare deterministă mobilă pe parametri reali UR20 + reper PURATOS:** blochează automat sarcinile >20 kg (cu gripper) și calculează intervalul de schimb manual al paletului (`~6,8 min` în cazul demo) — fără login.
2. **Transparență tehnică integrată în produs:** separă explicit testul FAT PURATOS (`7,4–8,6 găleți/min`, 0 erori la test) de garanții universale și exclude explicit MiR/înfolierea.
3. **Rutare geografică instantanee pe 3 hub-uri din România:** Dragomirești-Deal, Timișoara și Iași, cu export `.json` deduplicat.

## 6. Dinamica Schimbării (JTBD Four Forces)
- **Push (împinge spre schimbare):** Deficitul de operatori dispuși să ridice găleți de 5–13 kg în 2–3 schimburi.
- **Pull (atrage spre Tech-Con):** Aplicație referință reală la PURATOS (+23% / +43% peste ținta de 6 găleți/min la FAT) și verificabilitate în 60s pe telefon.
- **Habit (inerție):** „Am paletizat manual de 15 ani; ofertarea durează luni.”
- **Anxiety (teamă):** „Dacă robotul nu prinde mânerul, dacă depășim 20 kg sau dacă blocăm linia la schimbarea paletului?” — adresate direct în `PaletCheck UR20`.

## 7. Top 5 Obiecții & Răspunsuri (Bază pentru Q&A)
1. **Preț & țintă profit (BCR):** La 130.000 EUR preț și 110.000 EUR cost direct, contribuția este 20.000 EUR/celulă; promovarea (30.000 EUR) se acoperă din 2 celule. 17 celule aduc 310.000 EUR înainte de regie/impozit; cu 16% impozit (fără regie) recomandăm o țintă comercială cu buffer de 20 celule (+3).
2. **Integrare & adopție reală (Tech-Con / Alumil):** Nu promitem autonomie completă a capătului de linie: paleții și separatoarele rămân manuale, iar cele 3 hub-uri (Dragomirești-Deal 9, Timișoara 4, Iași 4) asigură instalare locală și instruire (capacitate 18 celule în 8 luni).
3. **GDPR & încredere date (Orange):** Aplicația funcționează fără cont, nu trimite date pe servere terțe, folosește exclusiv domenii fictive `.example` în demo și salvează cererile local în browser.
4. **„De ce nu folosesc ChatGPT direct?”** Un chat generic poate inventa capacități sau poate promite eronat MiR/zero opriri; `PaletCheck UR20` rulează reguli deterministe verificate (88/88 teste automate) pe limitele exacte UR20 și exportă structurat `.json` către hub-ul corect.
5. **Scalare & blocaj calendaristic (BCR / Tech-Con):** Livrarea de ~4 luni impune cut-off la 31 august; concentrarea a 65% din buget în Q1–Q2 plus regula de stop la 45 zile (>400 EUR/cerere → -50%) protejează pipeline-ul și capacitatea.

## 8. Voce, Limbaj & Dovezi
- **Vocea brandului:** *Inginerească* (cifre verificabile, nu sloganuri) · *Directă* (limite și scop declarate deschis, nu promisiuni universale) · *Pragmatică* (concentrată pe fluxul din hală, nu pe jargon AI).
- **Termeni interziși:** *revoluționar, inovator, fără cusur, all-in-one, garantat 0 opriri*.
- **Dovezi disponibile vs. pilot:** Disponibile — datele FAT PURATOS (`7,4`/`8,6 găleți/min`, vedere SICK 2D, 3 scanere, livrare ~4 luni) și prototipul live (`https://paletcheck-ur20-techcon.netlify.app`). `[NEED: validare în pilot]` — ratele reale de conversie din Google/LinkedIn în primele 45 de zile și regia indirectă alocată de Tech-Con.
