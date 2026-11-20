# PaletCheck UR20 – Instrucțiuni de test

URL live: https://paletcheck-ur20-techcon.netlify.app

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

## Caz 3 – Previzualizare 3D / Plan 2D celulă UR20

1. În secțiunea `Previzualizare 3D / Plan 2D celulă UR20`, verifică sincronizarea cu formularul (găleată `13 kg`, `44/palet`, `6,5 găleți/min`).
2. Comută între `1 celulă` și `2 celule` și testează un spațiu prea mic (ex. `2,5 m × 2,5 m`) pentru a verifica avertizarea de gabarit (`3,8 m × 3,4 m` pentru 1 celulă; `6,2 m × 3,8 m` pentru 2 celule).
3. Apasă `Vedere 3D izometrică / Vedere de sus (Plan 2D)` și comută zonele SICK (`Liber (Verde)`, `Reducere viteză (Galben)`, `Oprire protecție (Roșu)`) pentru a verifica reacția brațului UR20.
