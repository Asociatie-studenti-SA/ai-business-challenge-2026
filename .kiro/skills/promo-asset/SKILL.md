---
name: promo-asset
description: Creates the Promotional Asset (1080x1350 @2x editorial PNG poster + anti-slop social post copy & CTA) in deliverables/03-promo/ (15p Preselection).
triggers: [promo-asset, promo, marketing, poster]
always: false
---

# Playbook: Promotional Asset (`deliverables/03-promo/` — 15p Preselection)

Mandatory deliverable (Sec. 5; **15/100 pts in Preselection**). High-leverage opportunity for a team with PR skills.

## Hard Contest Constraints
- **Output Language:** Natural Romanian (zero AI tells per `copywriting-anti-slop`).
- **Required Elements:** One poster/post with (1) clear **message**, (2) strong **visual element**, and (3) concrete **CTA** tailored to the chosen target audience.
- **Facts Sheet Parity (CRITICAL):** Every price, offer, or product capability mentioned MUST match `brief/NUMBERS.json` and the live app verbatim (NEVER promise "from 8 RON" if the live app starts at 10 RON!).
- Skip video & partner offers (0 extra points).

## Execution Steps

### Step 1: Sync with Positioning & Facts Sheet
Read `brief/SSOT.md` (Section 6 Facts Sheet), `brief/NUMBERS.json`, and `deliverables/01-strategy/product_marketing.md`. Pick the sharpest channel:
- **B2B / SME / Ops:** LinkedIn post + 1080×1350 (4:5) executive visual with concrete ROI/time metric.
- **B2C / Students / Local:** Instagram post + 1080×1350 (4:5) high-contrast visual with 3-second benefit hook.

### Step 2: Build Editorial Poster (`promo_poster.html` → `promo_poster.png`)
Start from `.kiro/skills/promo-asset/references/poster_template.html` (clean Deep Teal / Slate palette — zero violet AI slop!). Design rules:
- Fixed `1080×1350px` canvas, **>= 40% clean breathing room** (no dense paragraphs!).
- Top: Brand name + audience pill badge (verify zero overlap!).
- Headline: max 6–8 words, bold contrast; Subheadline: max 18 words with 1 real figure from `NUMBERS.json`/brief.
- Central visual: clean **Before → After** metric comparison or crisp inline SVG/CSS UI card mockup (cleaner than garbled AI-generated text images!).
- Bottom: High-contrast **CTA bar** with action verb + live app URL.
- Render retina PNG:
  ```bash
  python3 .kiro/skills/promo-asset/scripts/render_poster.py \
    deliverables/03-promo/promo_poster.html \
    deliverables/03-promo/promo_poster.png \
    --width 1080 --height 1350
  ```

### Step 3: Write Anti-Slop Post Copy (`deliverables/03-promo/promo_copy.md`)
Apply `copywriting-anti-slop` (120–180 words max):
- Line 1 metadata: Target channel & audience.
- Opening hook anchored in a real fact/number from the brief.
- 3 concise benefit bullets (zero `🚀✅💡` emoji bullets, zero broetry, zero engagement bait).
- Concrete CTA (`[Action Verb] + [What They Get]`) + live URL + 3–5 clean hashtags.

### Step 4: Log for AI Journal
Write `deliverables/03-promo/PROMPT_LOG.md` (tool, 1 key prompt, 1 concrete PR edit removing AI clichés or fixing a price/promise mismatch).
