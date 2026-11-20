# Instrucțiuni de testare — PaletCheck UR20 (Tech-Con Industry)

- **Link aplicație live (mobil & desktop, fără cont):** https://paletcheck-ur20-techcon.netlify.app
- **Timp estimat de testare:** 30–45 secunde
- **Regulă GDPR:** Toate datele preîncărcate sunt fictive (domeniu `.example`, fără date personale reale).

---

## Test 1 — Caz normal (linie compatibilă UR20)

1. Deschide https://paletcheck-ur20-techcon.netlify.app și apasă butonul **`Încarcă caz normal (Demo)`**.
   - **Date preîncărcate:** `SC LactoSud Demo SRL`, contact `Andrei Ionescu (Demo)`, email `productie@lactosud-demo.example`, județ `Ilfov`, segment `Industrie alimentară (Lactate)`, găleată `13 kg`, gripper `3 kg`, ritm `6,5 găleți/min`, `44 găleți/palet`, `2 schimburi`, `2 operatori/schimb`, confirmare manuală paleți & separatoare bifată.
2. Apasă butonul principal **`Evaluează compatibilitatea UR20`**.
   - **Rezultat așteptat (verbatim):**
     `Compatibil pentru evaluare tehnică • 16 kg / 20 kg UR20 • 6,5 vs 7,4 găleți/min (reper FAT) • Schimb palet la ~6,8 min (44 găleți/palet) • Hub: Dragomirești-Deal`
   - Verifică cele 4 carduri KPI și nota de scop (schimbarea paleților și separatoarele rămân manuale; MiR, înfolierea și expedierea sunt excluse).
3. Apasă **`Generează cerere relevantă (CRM)`**.
   - **Rezultat așteptat:** apare cardul cererii salvate local (`Cereri salvate local: 1`) cu firmă, contact, hub `Dragomirești-Deal` și butonul **`Descarcă cererea (.json)`**.
   - *Verificare deduplicare (opțional):* apasă încă o dată **`Generează cerere relevantă (CRM)`** → mesaj `Cerere existentă – aceeași firmă și același email au fost deja înregistrate.` (contorul rămâne `1`).

---

## Test 2 — Caz cu date lipsă / erori (validare limite UR20)

1. Apasă butonul **`Testează date lipsă / erori`**.
   - Formularul încarcă valori invalide și rulează validarea inline imediat.
2. Apasă **`Evaluează compatibilitatea UR20`**.
   - **Rezultat așteptat:** verdict **`Eroare date`**, mesaj `Corectează câmpurile care au mesaj de eroare, apoi rulează din nou evaluarea.`, cardurile KPI nu se afișează, iar butonul **`Generează cerere relevantă (CRM)`** rămâne dezactivat (`Rulează mai întâi o evaluare fără erori.`).
3. Verifică exact cele **3 erori inline** afișate sub câmpuri:
   - sub *Ritm linie*: `Câmp obligatoriu – introdu o valoare numerică.`
   - sub *Greutate găleată*: `Sarcina totală 21 kg (găleată + gripper) depășește limita UR20 de 20 kg.`
   - sub *confirmarea manuală*: `Confirmă că schimbarea paleților și amplasarea separatoarelor rămân manuale.`
