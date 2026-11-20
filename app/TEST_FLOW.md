# PaletCheck UR20 – Instrucțiuni de test

URL live: <se completează după deploy>

Toate datele de test sunt fictive (firme demo, adrese email cu domeniul `.example`). Nu este nevoie de cont sau autentificare.

## Caz 1 – Caz normal (prima rulare, cu stocarea locală goală)

1. Apasă `Încarcă caz normal (Demo)`.
   Rezultat: formularul se completează cu `SC LactoSud Demo SRL`, `Andrei Ionescu (Demo)`, `productie@lactosud-demo.example`, județ Ilfov, segment Lactate, găleată 13 kg, gripper 3 kg, ritm 6,5 găleți/min, 44 găleți/palet.
2. Apasă `Evaluează compatibilitatea UR20`.
   Rezultat: verdictul `Compatibil pentru evaluare tehnică`, patru carduri KPI și linia de sumar:
   `Compatibil pentru evaluare tehnică • 16 kg / 20 kg UR20 • 6,5 vs 7,4 găleți/min (reper FAT) • Schimb palet la ~6,8 min (44 găleți/palet) • Hub: Dragomirești-Deal`
3. Apasă `Generează cerere relevantă (CRM)`.
   Rezultat: apare cardul cererii cu Firmă `SC LactoSud Demo SRL`, Contact `Andrei Ionescu (Demo)`, Hub `Dragomirești-Deal`, Verdict `Compatibil pentru evaluare tehnică` și data/ora creării. Sub card: `Cereri salvate local: 1`.

Verificări opționale:
- Apasă din nou `Generează cerere relevantă (CRM)`: apare mesajul `Cerere existentă – aceeași firmă și același email au fost deja înregistrate.`, iar contorul rămâne `Cereri salvate local: 1`.
- Apasă `Descarcă cererea (.json)`: browserul descarcă cererea salvată ca fișier .json.

## Caz 2 – Date lipsă / erori

1. Apasă `Testează date lipsă / erori`.
   Rezultat: formularul se completează cu date greșite, iar validarea rulează imediat. Erorile apar deja sub câmpuri.
2. Apasă `Evaluează compatibilitatea UR20`.
   Rezultat: verdictul `Eroare date` și mesajul `Corectează câmpurile care au mesaj de eroare, apoi rulează din nou evaluarea.` Cardurile KPI nu sunt afișate. Butonul `Generează cerere relevantă (CRM)` rămâne dezactivat, cu indicația `Rulează mai întâi o evaluare fără erori.`
3. Verifică cele trei mesaje de eroare afișate sub câmpuri:
   - sub Ritm linie: `Câmp obligatoriu – introdu o valoare numerică.`
   - sub Greutate găleată: `Sarcina totală 21 kg (găleată + gripper) depășește limita UR20 de 20 kg.`
   - sub bifa de confirmare manuală: `Confirmă că schimbarea paleților și amplasarea separatoarelor rămân manuale.`
