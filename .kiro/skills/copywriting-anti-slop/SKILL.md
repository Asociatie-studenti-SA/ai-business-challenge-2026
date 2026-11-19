---
name: copywriting-anti-slop
description: Conversion copywriting, social hooks, and strict RO + EN No-AI-Tells filter for UI, Strategy, Promo, and Pitch (adapted from coreyhaines31/marketingskills copywriting v2.3.6 + social v2.5.3, MIT).
triggers: [copywriting, anti-slop-copy, rewrite-copy, social-copy]
always: false
---

# Playbook: Conversion Copywriting & Anti-AI-Tells (RO + EN)

> **MIT Attribution (AI Journal Sec. 7):** Adapted from `coreyhaines31/marketingskills` (`copywriting` v2.3.6 & `social` v2.5.3, MIT), extended with a Romanian AI-tells blacklist and stripped of non-hackathon sections (podcasts, weekly calendars, MCP scheduling, short-form video).

Business jurors (BCR, Orange, Alumil) immediately discount copy that sounds AI-generated. Run every headline, UI label, promo post, and pitch slide through these gates.

---

## 1. Three-Question Gate & Decompose-and-Lock
Test every major headline, claim, and slide bullet:
1. **Can the reader picture it?** Concrete object, scene, or number beats abstraction.
2. **Is it falsifiable?** *"Reduce timpul de ofertare de la 2 ore la 10 minute"* = real claim. *"Soluție de top"* = decoration.
3. **Swap Test:** Could a competitor paste this exact sentence unchanged? If YES, rewrite from specific product facts.

**Decompose & Lock:** For the main headline and primary CTA, draft 3 candidates, cut the weakest, fix the best one's flaw, and lock it.

---

## 2. Supportable Claims Only (Zero Fabrication)
- Cite ONLY figures backed by `brief/RAW_THEME.md`, `brief/data/*`, `brief/NUMBERS.json`, or the live prototype.
- **NEVER** invent statistics (*"94% dintre companii..."*), fake testimonials, or unbuilt features. If a claim needs post-contest proof, frame it honestly as a financial-model estimate or pilot target (`[NEED: validare în pilot]`).

---

## 3. Strict "No AI Tells" Blacklist (Romanian + English)

### A. Banned Syntactic Tells
1. **Contrast reveals:**
   - ❌ RO: *"Nu este doar un tool, este un partener."* / *"Nu pentru că X. Ci pentru că Y."*
   - ❌ EN: *"It's not X, it's Y."* / *"Not just X, but Y."*
   - ✅ **Fix:** State Y directly with its concrete reason.
2. **Negation lists:**
   - ❌ RO: *"Fără tabele complicate, fără apeluri, fără stres, fără pierdere de timp."*
   - ❌ EN: *"No setup, no templates, no spreadsheets, no hassle."*
   - ✅ **Fix:** State what DOES happen (keep at most one concrete absence near CTA: *"Fără cont necesar pentru testare"*).
3. **Self-answered questions & colon reveals:**
   - ❌ *"Rezultatul? De 3 ori mai rapid."* / *"Cea mai bună parte: învață singur."*
   - ✅ **Fix:** State the result directly. (Reader-voice questions like *"Pierzi 4 ore/săptămână verificând facturi?"* are fine.)
4. **Stock AI clichés:**
   - ❌ RO: *"Într-o lume în continuă schimbare..."*, *"Într-o eră digitală..."*, *"Spune adio..."*, *"Deblochează potențialul..."*, *"Trece la nivelul următor..."*, *"Fie că ești X sau Y..."*, *"revoluționar / inovator / fără cusur / all-in-one"*.
   - ❌ EN: *"In today's fast-paced world..."*, *"Say goodbye to..."*, *"Unlock the power of..."*, *"seamless / robust / game-changer / streamline"*.
5. **Excessive em-dashes (`—`)** in short headlines, posters, and social posts.

### B. Banned Social / Promo Tells
- ❌ **Broetry:** One 4-word sentence per line for the whole post. Write crisp 2–3 line paragraphs.
- ❌ **Emoji bullets:** ❌ `🚀 Funcție 1` / `✅ Funcție 2` / `💡 Funcție 3`. Use plain bullets (`•` / `-`); 0 emojis for B2B!
- ❌ **Fake engagement bait:** ❌ *"De acord?"*, *"Ce părere ai? Scrie în comentarii!"*, *"Citește asta din nou."* End on the real CTA.

---

## 4. Proven Formulas (Romanian Deliverable Ready)
- **Headlines:** `[Rezultat concret] fără [durerea principală]` | `Transformă [input concret] în [output concret] în [timp/pași]`
- **Social Hooks (anchor in a real brief/Excel number):**
  - *Value:* `"Cum reduci [durere concretă] în [timp/pași], pornind de la [datele tale existente]."`
  - *Direct pain:* `"[Public țintă] pierde [cifră din brief] din cauza [cauză concretă]. Iată cum o rezolvăm."`
  - *Contrarian (B2B):* `"Majoritatea firmelor încearcă să rezolve [X] cu [metodă veche], dar blocajul real e [Y]."`
- **Strong CTAs (`[Action Verb] + [Specific Value]`):**
  - ❌ Avoid: *"Trimite"*, *"Află mai multe"*, *"Începe acum"*, *"Click aici"*.
  - ✅ Use: *"Testează prototipul live (date demo incluse)"*, *"Calculează economia în 30 secunde"*, *"Generează prima ofertă demo"*.
