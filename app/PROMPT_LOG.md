# PROMPT_LOG — PaletCheck UR20 (app/)

## 1. Instrumente AI folosite
Kiro: agentul `app-builder` și sub-agenți pentru specificație, design și task-uri, cu skill-urile din workspace `web-prototype`, `frontend-craft` și `copywriting-anti-slop`. Agenții au scris logica și testele. Echipa le-a verificat cu Vitest și fast-check (teste property-based).

## 2. Prompt-cheie (citat exact, trimis în engleză)
> "Build `PaletCheck UR20` — a mobile-first, PWA-ready Romanian web tool (industrial Slate + Deep Teal/Amber palette, ZERO violet AI slop, ZERO emoji icons, ZERO login wall) for Romanian food factory production managers evaluating a Tech-Con UR20 bucket-palletizing cell"

Același prompt fixa etichetele exacte ale butoanelor: `Încarcă caz normal (Demo)`, `Testează date lipsă / erori`, `Evaluează compatibilitatea UR20`, `Generează cerere relevantă (CRM)`.

## 3. Eroare AI reală, prinsă și corectată
- **Ce a generat AI-ul:** la prima rafinare a cerințelor, Req 8.3 trata un email gol sau fără domeniu `.example` ca eroare la evaluare.
- **Ce a încălcat:** Req 1.3/1.4. Demo-ul `Testează date lipsă / erori` lasă emailul gol și trebuie să afișeze exact trei erori inline: ritm necompletat, 21 kg peste limita UR20 de 20 kg și confirmarea manuală a paleților nebifată. Aplicat literal, textul AI ar fi adăugat o a patra eroare sub câmpul de email și ar fi stricat contractul demo.
- **Corecția echipei:** am separat regula. La evaluare, emailul este semnalat doar dacă e completat și nu se termină în `.example`. Un email gol sau fără `.example` blochează doar apăsarea `Generează cerere relevantă (CRM)`.
- **Verificare:** testul unitar din `app/src/logic/__tests__/validator.test.ts` („Demo fixtures validation”) confirmă că `validate(DEMO_ERRORS)` întoarce exact cheile `ratePerMin`, `bucketKg`, `manualConfirmed`.

## 4. A doua corecție AI reală — Randare 3D & Photo-Fit (inspecție vizuală umană)
- **Ce a generat AI-ul inițial:** în prima versiune a modulului 3D izometric (`cellRenderer.ts`), eticheta coridorului operatorului era desenată în planul podelei înaintea paleților (fiind acoperită/tăiată de paletul P2), markerul operatorului apărea ca un cilindru verde lipit sub P1, iar fundalul demo Photo-Fit era o schiță vectorială gri nerealistă.
- **Corecția echipei:** am mutat toate adnotările pe un strat superior (`drawTopmostAnnotations`) cu bare/etichete fără suprapuneri, am detaliat geometria industrială (europaleți din lemn cu șipci, transportor inox cu role și portal SICK 2D, braț UR20 cu articulații albastre, siluetă operator poziționată corect) și am înlocuit fundalul demo cu o fotografie sintetică realistă de hală alimentară integrată local (`demo-factory-hall.jpg`, zero apeluri externe).
- **Verificare:** 88/88 teste Vitest, `npm run check` (0 constatări), `npm run build` + `verify-dist.mjs`, inspecție vizuală pe screenshot-uri Tab 1 & Tab 2 și verificare overflow mobil real la 360px (`scrollWidth=345px <= 345px`).

## 5. A treia corecție AI reală — Calibrare la scară reală & rază UR20 (PR #3)
- **Ce lipsea inițial:** în Tab 2 (`Photo-Fit`), slider-ul liber de scară permitea redimensionarea arbitrară a robotului pe poză (fără scară fizică reală), iar verificarea inițială la colțul exterior al paletului dădea `1,79 m > 1,75 m` (raza maximă a UR20).
- **Corecția echipei:** am adăugat calibrarea deterministă în 2 atingeri pe un europalet cunoscut (`1,2 m`) prin butonul `Calibrează scara pe poză`, desenarea inelului punctat `Rază UR20 1,75 m` și măsurarea corectă la punctul real de plasare a găleții (`15 cm` în interiorul marginii paletului → `1,59 m <= 1,75 m`). Nu pretindem reconstrucție 3D AI din poză (rămâne transparent pe roadmap V2).
- **Verificare:** 91/91 teste Vitest verzi, build în `docs/` și smoke-test live pe `https://paletcheck-ur20-techcon.netlify.app`.

Toate datele din aplicație și din acest jurnal sunt fictive (emailuri `.example`).
