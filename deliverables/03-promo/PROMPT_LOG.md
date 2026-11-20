# Prompt Log — Deliverable 4: Material de Promovare (`deliverables/03-promo/`)

- **Rol agent:** `pr-marketer` (Brand & PR Creative Director)
- **Instrumente utilizate:** Kiro / Antigravity multi-agent workspace + skill-urile `.kiro/skills/promo-asset/SKILL.md` și `.kiro/skills/copywriting-anti-slop/SKILL.md` (adaptare MIT după `coreyhaines31/marketingskills`) + scriptul `render_poster.py` (Headless Chrome `1080×1350 @2x`).
- **Surse de adevăr verificate:** `brief/RAW_THEME.md`, `brief/SSOT.md`, `brief/NUMBERS.json`.

## Prompt cheie utilizat
> „Construiește o campanie B2B LinkedIn pentru Directori de Producție și Plant Managers din fabrici alimentare din România (găleți 5–15 kg): (1) `promo_poster.html` randat în `promo_poster.png` (`1080×1350 @2x`) cu paletă industrială Navy/Slate + Deep Teal/Amber, comparație Înainte/După bazată pe reperul FAT PURATOS, notă de transparență (rezultate FAT ≠ garanții universale, paleți/separatoare manual) și bară CTA spre `PaletCheck UR20`; (2) `promo_copy.md` în română (130–170 cuvinte), zero clișee AI, zero broetry, zero emoji bullets, ancorat în cifrele PURATOS și cu CTA spre prototipul live (rutare Dragomirești-Deal / Timișoara / Iași).”

## Verificări & Corecții Umane / PR Aplicat (Anti-Slop & Conformitate Brief)
1. **Corecție de conformitate tehnică și scop (eliminare supra-promisiune):**
   - *Draft inițial evitat:* formulări generice de tipul „Automatizează paletizarea fără opriri” care ar fi sugerat garanții universale sau automatizarea completă a capătului de linie.
   - *Corecție aplicată:* s-a ancorat titlul în durerea concretă (*„Elimină ridicarea manuală a găleților de 5–15 kg”*), iar atât în poster (notă de subsol dedicată), cât și în al 3-lea bullet din `promo_copy.md`, s-a precizat explicit că **7,4–8,6 găleți/min** sunt **rezultate de test FAT ale aplicației PURATOS** (nu garanții universale), iar **schimbarea paleților și amplasarea separatoarelor rămân manuale** (fără transport MiR sau înfoliere).
2. **Corecție majoră de design grafic (aplicare `taste-skill` / `frontend-craft` & `frontend-design`):**
   - *Prima versiune respinsă:* fundal dark-mode cu glow radial, două carduri rotunjite identice și jumătate din titlu colorat diferit — estetică generică de tip „template SaaS generat de AI”.
   - *Redesign aplicat:* trecere la o compoziție editorială de inginerie industrială (fundal light steel-paper `#F3F5F7`, tipografie monumentală Space Grotesk + IBM Plex Sans într-o singură culoare `#0F1D30`, eliminarea etichetelor ALL-CAPS cu puncte mediane și a săgeților `→` din buton). S-a introdus o **schemă tehnică SVG top-down a celulei UR20** (transportor, con de scanare SICK 2D pe mâner, braț articulat UR20 cu gripper pneumatic deasupra poziției 1, poziția 2 pentru schimb manual, 3 scanere de protecție) și o comparație asimetrică cu bare de ritm FAT față de ținta de 6,0 găleți/min. După inspecția PNG-ului randat, s-a corectat ordinea straturilor SVG astfel încât brațul UR20 și gripperul să treacă deasupra europaletului 1 și s-au aliniat toate titlurile pe un singur rând.
3. **Filtru Anti-AI-Tells (`copywriting-anti-slop`):**
   - S-au eliminat toate construcțiile de tip contrast AI, listele de negații, întrebările retorice auto-răspunse, em-dash-urile excesive, stilul „broetry” și orice emoji din postarea B2B LinkedIn.
