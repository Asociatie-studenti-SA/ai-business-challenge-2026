# Sumar model financiar - PaletCheck UR20 (Tech-Con Industry)

Scenariu de bază, EUR fără TVA, 1 an calendaristic (1 ian - 31 dec). Se numără doar celulele vândute **și livrate** în an.
Sursă unică: `deliverables/02-finance/financial_model.xlsx` (7 foi, 471 formule Excel live, `fullCalcOnLoad=1`, 0 erori la recalcularea în Excel). Generat de `build_techcon_model.py`.

## 1. Buget promovare 30.000 EUR (foaia `Buget Promovare 30k EUR`)

| Canal | EUR | % |
| :--- | ---: | ---: |
| Google Search (intenție activă B2B) | 6.500 | 21,7% |
| LinkedIn Ads (Director Producție / CapEx) | 5.500 | 18,3% |
| Conținut tehnic UR20 & studiu de caz PURATOS | 4.500 | 15,0% |
| Marketing direct B2B & CRM (deduplicat) | 4.000 | 13,3% |
| Webinare tehnice & asociații | 3.500 | 11,7% |
| Pagină web, PaletCheck UR20 (PWA) & SEO/AI | 3.500 | 11,7% |
| Rezervă ajustări (distinctă) | 2.500 | 8,3% |
| **Total (=SUM)** | **30.000** | **100%** |

Ritm trimestrial: Q1 35% (10.500 EUR), Q2 30% (9.000 EUR), Q3 20% (6.000 EUR), Q4 15% (4.500 EUR). Q1+Q2 = 65%, pentru că o celulă se livrează în ~4 luni și comanda trebuie semnată până la final de august.

Regula de stop: la 45 de zile, un canal cu cost/cerere relevantă peste 400 EUR sau cu 0 cereri se reduce cu 50%. Suma eliberată și rezerva de 2.500 EUR merg spre canalul cu cel mai mic cost/cerere. Un client venit din mai multe canale se numără o singură dată.

## 2. Funnel și rezultate (foaia `Model Comercial & Funnel`)

120 cereri relevante → 45% → **54 întâlniri tehnice** → 22,22% (0,2222 × 54 = 11,99, rotunjit) → **12 clienți** × 1,42 celule/client → **17 celule**.

| Indicator | Valoare | Calcul |
| :--- | ---: | :--- |
| Total promovare | 30.000 EUR | suma alocărilor |
| Contribuție / celulă | 20.000 EUR | 130.000 - 110.000 |
| Venit anual | 2.210.000 EUR | 17 × 130.000 |
| Cost direct anual | 1.870.000 EUR | 17 × 110.000 |
| Rezultat după promovare, înainte de alte costuri și impozit | 310.000 EUR | 17 × 20.000 - 30.000 |
| Cost / cerere relevantă | 250 EUR | 30.000 / 120 |
| Cost / întâlnire tehnică | ≈556 EUR (555,56) | 30.000 / 54 |
| Cost / client câștigat | 2.500 EUR | 30.000 / 12 |
| Cost promovare / celulă | ≈1.765 EUR (1.764,71) | 30.000 / 17 |
| Marjă de contribuție | 15,4% | 20.000 / 130.000 |
| Prag acoperire promovare | 2 celule | ROUNDUP(30.000 / 20.000) |
| Prag țintă 300.000 EUR înainte de alte costuri | 17 celule | ROUNDUP(330.000 / 20.000) |

## 3. Profit net real: ce lipsește (foaia `Verificare Profit Net & Riscuri`)

**310.000 EUR nu este profit net.** Brief-ul nu dă regia indirectă (vânzări, service, garanție, alte costuri fixe) și nici impozitul.

- Cu impozit 16% și fără regie: profit net indicativ = 310.000 × 0,84 = **260.400 EUR**, adică 39.600 EUR sub țintă.
- Pentru 300.000 EUR net trebuie 300.000 / 0,84 = **357.143 EUR** profit înainte de impozit → ROUNDUP((357.143 + 30.000) / 20.000) = **20 celule** (fără regie).
- Rezervă recomandată: **+3 celule** (țintă comercială 20 celule; echivalent rezervă 15% pe volum). La 20 celule: (20 × 20.000 - 30.000) × 0,84 = **310.800 EUR net**, fără regie.
- Date de cerut de la Tech-Con: regie vânzări, service & garanție, alte costuri fixe alocate, confirmarea cotei de impozit. Celulele roșii din Excel recalculează pragul imediat.

## 4. Capacitate hub-uri

| Hub | Regiune | Celule | Instalări / trimestru |
| :--- | :--- | ---: | ---: |
| Dragomirești-Deal | Sud / Centru | 9 | 3 |
| Timișoara | Vest | 4 | 2 |
| Iași | Est | 4 | 2 |
| **Total** | | **17** | **7** |

Fereastra de livrare în an = 12 - 4 = 8 luni → capacitate 18 celule (utilizare 94%). Este strâns: orice întârziere la comenzi împinge celule în anul 2.

## 5. Răspunsuri de 20 de secunde pentru Q&A (BCR / Tech-Con)

- **Cine plătește și cât?** Fabrica alimentară, 130.000 EUR/celulă integrată. Tech-Con păstrează 20.000 EUR contribuție/celulă.
- **De ce 17 celule?** (300.000 + 30.000) / 20.000 = 16,5 → 17. Asta este înainte de regie și impozit.
- **Și profitul net?** Cu impozit 16% trebuie 20 de celule. De aceea ținta comercială are buffer de +3 celule.
- **Bugetul ajunge?** Promovarea se acoperă din 2 celule. Costul este 2.500 EUR pe client câștigat.

## 6. Foi noi (după evaluarea juriului simulat)

Fișierul se deschide pe foaia `Sumar`: toți indicatorii ceruți de brief, legați prin formule de foile de calcul.

**Calendar 12 luni & Cash.** Comenzi pe luni: 2, 2, 1, 2, 3, 3, 2, 2 (ian-aug), apoi 0. Livrarea vine după 4 luni, deci ultima comandă care se livrează în an este în **august**. Livrări pe trimestru: 0 / 4 / 6 / 7, toate sub capacitatea de 7 celule/trimestru (Dragomirești-Deal 9, Timișoara 4, Iași 4).
- Break-even pe luni (rezultat cumulat ≥ 0): **mai**, la primele 2 livrări.
- Necesar maxim de finanțare: **125.500 EUR în aprilie**, din ipotezele avans client 30% și plată furnizori 50% la comandă (de validat cu Tech-Con; vezi foaia Calendar, rândul 21).
- Caz prudent, fără avans de la client: **471.500 EUR în iulie** (rândul 22). Diferența arată cât contează negocierea avansului în contract.
- Capacitate: în trimestrul cel mai plin fiecare hub este exact la limită (rezervă 0). O singură comandă întârziată mută o celulă în anul 2.
- Numerar la 31 decembrie: 310.000 EUR, egal cu rezultatul anual.

**Canale & regula 45 zile.** Cereri relevante estimate pe canal (30 / 22 / 18 / 20 / 16 / 14 = 120), cost pe cerere între 200 și 250 EUR. Canalul peste 400 EUR sau fără cereri primește automat „Reduce 50%”. Banii eliberați și rezerva de 2.500 EUR merg la canalul cel mai ieftin.

**Sensibilitate (1 variabilă).** Scenariul oficial rămâne unul singur. Testăm o singură ipoteză pe rând:
- Pentru 300.000 EUR profit net (impozit 16%) sunt necesare 20 celule fără regie, **26** cu regie de 120.000 EUR și **29** cu regie de 180.000 EUR.
- Dacă costul direct urcă la 120.000 EUR, sunt necesare 39 celule.
- Dacă 3 celule alunecă în anul 2: 14 celule, rezultat 250.000 EUR.
- Concluzie: ținta netă depinde de regia pe care Tech-Con trebuie să o comunice.