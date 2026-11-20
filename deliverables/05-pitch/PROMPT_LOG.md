# Prompt Log — Deliverable 6: Pitch & Demo (`deliverables/05-pitch/`)

- **Rol agent:** `pitch-director` (Pitch Director & Stage Coach)
- **Instrumente utilizate:** Kiro / Antigravity multi-agent workspace + skill-urile `.kiro/skills/pitch-deck/SKILL.md` și `.kiro/skills/copywriting-anti-slop/SKILL.md` + scripturile `build_pitch_pptx.py` (`.venv/bin/python`, `python-pptx`) și `render_pdf.py` (Headless Chrome, `--max-pages 5 --landscape`).
- **Surse sincronizate verbatim:** `brief/SSOT.md` (Secțiunea 6), `brief/NUMBERS.json` (`status: "LOCKED"`), `app/TEST_FLOW.md`, `app/PROMPT_LOG.md`, `deliverables/02-finance/finance_summary.md`, `deliverables/02-finance/PROMPT_LOG.md`, `deliverables/03-promo/promo_copy.md` și `deliverables/03-promo/promo_poster.png`.

## Prompt cheie utilizat
> „Acționează ca `.kiro/agents/pitch-director.md`. Generează `pitch_spec.json` (strict max 5 slide-uri, română, zero clișee AI), construiește `pitch_deck.pptx` editabil cu posterul integrat pe Slide 3, exportă `pitch_deck.pdf` (<= 5 pagini) și scrie `DEMO_INSTRUCTIONS.md` (URL live + pași verbatim pentru caz normal și caz erori), `PITCH_SCRIPT_3MIN.md` (180s pe 3 colegi) și `QA_DEFENSE.md` (<= 350 cuvinte cu aritmetică exactă și 1 eroare AI reală per coleg).”

## Verificări & Corecții Aplicat de Echipă
1. **Sincronizare URL live și terminologie financiară:**
   - S-a verificat `brief/NUMBERS.json` blocat de CFO: URL-ul live a fost actualizat de la placeholder-ul GitHub Pages la adresa reală Netlify (`https://paletcheck-ur20-techcon.netlify.app`), iar suma de `310.000 EUR` a fost etichetată riguros drept „rezultat după promovare, înainte de regie și impozit” (niciodată „profit net”), alături de necesarul de 20 celule la impozit 16%.
2. **Corecție layout PPTX & PDF:**
   - La inspectarea scriptului `build_pitch_pptx.py`, s-a observat că adăugarea de KPI boxes pe Slide 3 ar fi împins posterul `promo_poster.png` (înălțime 4,06 in) peste subsolul slide-ului (`y=7.0"`). S-au păstrat două carduri concise lângă poster (fără KPI strip), asigurând încadrare curată în PPTX.
   - La inspecția vizuală a `pitch_deck.pdf`, titlurile de pe Slide 1 și Slide 4 aveau câte un cuvânt izolat pe rândul 2 (`alimentare.`, `impozit.`); s-a ajustat `h1` de la `36px` la `31px` pentru încadrare pe un singur rând pe toate cele 5 slide-uri.
3. **Control strict de lungime & anti-slop:**
   - S-a verificat prin script Python numărul de cuvinte din `QA_DEFENSE.md` (sub limita de 350 cuvinte) și s-a verificat că fiecare etichetă de buton (`Încarcă caz normal (Demo)`, `Testează date lipsă / erori`, `Evaluează compatibilitatea UR20`, `Generează cerere relevantă (CRM)`) corespunde verbatim cu `app/TEST_FLOW.md`.
