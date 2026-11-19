---
name: frontend-craft
description: Anti-slop frontend design & Top-10 UI/UX priority bar for app/ (distilled from Leonxlnx/taste-skill v2.5 MIT & nextlevelbuilder/ui-ux-pro-max-skill MIT, zero external script dependencies).
triggers: [frontend-craft, ui-ux, anti-slop, polish-ui]
always: false
---

# Playbook: Frontend Craft & UI/UX Anti-Slop (`app/` & `docs/`)

> **MIT Attribution (AI Journal Sec. 7):** Distilled from `Leonxlnx/taste-skill` (`design-taste-frontend` 2.5, MIT) and `nextlevelbuilder/ui-ux-pro-max-skill` (MIT), calibrated for 3-hour interactive web prototypes with zero missing external scripts.

Goal: Ship a prototype that looks built by a real product company (Linear / Stripe / Figma bar), NEVER like a generic "AI-generated template".

---

## 1. Anti-Slop Visual Rules (from `design-taste-frontend`)
1. **NO violet / purple / lavender AI-slop defaults** (`#6366f1`, `#7c3aed`, `#8b5cf6` glows on black). Pick a restrained, domain-fit palette:
   - *FinTech / B2B / SaaS:* Slate/Navy (`#0f172a`) + Cobalt (`#0369a1`) or Deep Teal (`#0f766e`) on crisp white (`#ffffff` / `#f8fafc`).
   - *Industrial / Logistics / Construction (Alumil, Mainfreight, Tech-Con):* Charcoal (`#18181b`) + Amber (`#d97706`) or Deep Teal (`#0f766e`).
   - *Health / Sustainability / Education:* Warm Paper (`#fafaf9`) + Forest Green (`#15803d`) or Teal (`#0f766e`).
   - *Local / Retail / Place:* Light warm surface, high contrast, flat grounds — never cyberpunk glow or dark-mode clichés.
2. **Real working UI on Screen 1:** Show the interactive product immediately above the fold, not an empty marketing hero.
3. **One strict visual system:**
   - 1 button pair (Primary solid + Secondary outline/tonal);
   - 1 card style, 1 radius scale (`rounded-lg` or `rounded-xl`);
   - **Max 2 levels of nested containers** (never card inside card inside card);
   - **Equal left/right edges** (`max-w-6xl mx-auto px-6` across all sections).
4. **Zero emoji-as-icons:** Use crisp SVG icons (`lucide-react` or inline SVG at uniform `16–20px`).
5. **Quiet micro-interactions only:** Hover lift `2px` (`-translate-y-0.5`), button press `active:scale-[0.98]`, `150–200ms` transitions, loading state on submit. **NEVER:** 3D card tilt, scroll-jacking, fade-in on every row, auto-carousels, or random pulsing. Respect `prefers-reduced-motion`.
6. **Zero explanatory captions under visuals** and **strictly synthetic contacts**: street + district only (no house number/postcode), `.example` emails, zero real phones/CNP/CUI.

---

## 2. Top-10 UI/UX Priority Gate (from `ui-ux-pro-max`)

| Priority | Category | Must Have | Avoid |
| :--- | :--- | :--- | :--- |
| **1. CRITICAL** | Accessibility | Contrast ≥ 4.5:1, visible `Tab` focus rings, `aria-label` on icon buttons, `alt` on images | Stripping `outline`, low-contrast gray-on-gray |
| **2. CRITICAL** | Touch & Feedback | Interactive targets ≥ `44×44px`, ≥ `8px` spacing, immediate state/loading feedback | Hover-only actions, silent clicks |
| **3. HIGH** | Responsive | Zero horizontal scroll at `1440px`, `1280×720` (projector), and **true `360px` mobile** (`flex: 0 0 auto` on stacked column fields!) | Fixed pixel widths, overflowing tables |
| **4. HIGH** | Forms | Visible `<label>` on every field, inline error right under the invalid input, 1-click demo button | Placeholder-only labels, browser `alert()` |
| **5. HIGH** | Typography & Density | Base `15–16px`, `line-height: 1.5`; dense spacing (`8–24px`) for B2B tools, airy (`24–48px`) for B2C | Body `< 12px`, walls of text |
| **6. MEDIUM** | Data & Charts | Formatted numbers (`12.500 RON`, `34,5%`), legends & tooltips, clear units | Raw unformatted floats (`12345.6789`) |
