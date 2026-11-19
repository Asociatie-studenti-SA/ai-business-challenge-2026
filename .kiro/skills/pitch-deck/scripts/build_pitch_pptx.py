#!/usr/bin/env python3
"""
Build an editable, executive-grade PowerPoint deck (.pptx) with STRICT max 5 slides
from a JSON specification for AI-Powered Business Challenge 2026.
"""

import argparse
import json
import sys
from pathlib import Path
from pptx import Presentation
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE
from pptx.enum.text import PP_ALIGN
from pptx.util import Inches, Pt


NAVY = RGBColor(0x0F, 0x17, 0x2A)
TEAL = RGBColor(0x0F, 0x76, 0x6E)
COBALT = RGBColor(0x03, 0x69, 0xA1)
SLATE = RGBColor(0x47, 0x55, 0x69)
LIGHT_BG = RGBColor(0xF8, 0xFA, 0xFC)
CARD_BG = RGBColor(0xFF, 0xFF, 0xFF)
BORDER = RGBColor(0xE2, 0xE8, 0xF0)
WHITE = RGBColor(0xFF, 0xFF, 0xFF)


def set_slide_bg(slide, color: RGBColor):
    fill = slide.background.fill
    fill.solid()
    fill.fore_color.rgb = color


def add_header(slide, badge: str, title: str, subtitle: str = "", dark: bool = False):
    # Top accent bar
    bar = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0), Inches(0), Inches(13.333), Inches(0.12))
    bar.fill.solid()
    bar.fill.fore_color.rgb = TEAL
    bar.line.fill.background()

    # Badge
    tb = slide.shapes.add_textbox(Inches(0.7), Inches(0.35), Inches(6), Inches(0.35))
    p = tb.text_frame.paragraphs[0]
    p.text = badge.upper()
    p.font.name = "Calibri"
    p.font.size = Pt(11)
    p.font.bold = True
    p.font.color.rgb = RGBColor(0x5E, 0xEA, 0xD4) if dark else TEAL

    # Title
    tt = slide.shapes.add_textbox(Inches(0.7), Inches(0.68), Inches(11.9), Inches(0.7))
    tp = tt.text_frame.paragraphs[0]
    tp.text = title
    tp.font.name = "Calibri"
    tp.font.size = Pt(30)
    tp.font.bold = True
    tp.font.color.rgb = WHITE if dark else NAVY

    if subtitle:
        st = slide.shapes.add_textbox(Inches(0.7), Inches(1.32), Inches(11.9), Inches(0.45))
        sp = st.text_frame.paragraphs[0]
        sp.text = subtitle
        sp.font.name = "Calibri"
        sp.font.size = Pt(15)
        sp.font.color.rgb = RGBColor(0xCB, 0xD5, 0xE1) if dark else SLATE


def add_footer(slide, project_name: str, slide_num: int, total: int, dark: bool = False):
    ft = slide.shapes.add_textbox(Inches(0.7), Inches(7.0), Inches(11.9), Inches(0.35))
    p = ft.text_frame.paragraphs[0]
    p.text = f"{project_name}  •  AI-Powered Business Challenge 2026  •  Slide {slide_num}/{total}"
    p.font.name = "Calibri"
    p.font.size = Pt(10)
    p.font.color.rgb = RGBColor(0x94, 0xA3, 0xB8) if dark else SLATE


def add_card(slide, left, top, width, height, title: str, bullets: list[str], accent: RGBColor = TEAL):
    shape = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(left), Inches(top), Inches(width), Inches(height))
    shape.fill.solid()
    shape.fill.fore_color.rgb = CARD_BG
    shape.line.color.rgb = BORDER
    shape.line.width = Pt(1)

    tf = shape.text_frame
    tf.word_wrap = True
    tf.margin_left = Inches(0.25)
    tf.margin_right = Inches(0.25)
    tf.margin_top = Inches(0.2)
    tf.margin_bottom = Inches(0.18)

    p0 = tf.paragraphs[0]
    p0.text = title
    p0.font.name = "Calibri"
    p0.font.size = Pt(16)
    p0.font.bold = True
    p0.font.color.rgb = accent
    p0.space_after = Pt(8)

    for b in bullets:
        p = tf.add_paragraph()
        p.text = f"• {b}"
        p.font.name = "Calibri"
        p.font.size = Pt(13.5)
        p.font.color.rgb = NAVY
        p.space_after = Pt(6)


def add_kpi_box(slide, left, top, width, height, value: str, label: str, accent: RGBColor = TEAL):
    shape = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(left), Inches(top), Inches(width), Inches(height))
    shape.fill.solid()
    shape.fill.fore_color.rgb = CARD_BG
    shape.line.color.rgb = BORDER

    tf = shape.text_frame
    tf.word_wrap = True
    tf.margin_top = Inches(0.2)
    tf.margin_left = Inches(0.2)
    tf.margin_right = Inches(0.2)

    p0 = tf.paragraphs[0]
    p0.text = str(value)
    p0.alignment = PP_ALIGN.CENTER
    p0.font.name = "Calibri"
    p0.font.size = Pt(26)
    p0.font.bold = True
    p0.font.color.rgb = accent

    p1 = tf.add_paragraph()
    p1.text = label
    p1.alignment = PP_ALIGN.CENTER
    p1.font.name = "Calibri"
    p1.font.size = Pt(12)
    p1.font.color.rgb = SLATE


def main() -> int:
    parser = argparse.ArgumentParser(description="Build max-5-slide PPTX deck from JSON spec.")
    parser.add_argument("spec_json", type=Path)
    parser.add_argument("output_pptx", type=Path)
    parser.add_argument("--poster", type=Path, default=None, help="Optional promo poster PNG for Slide 3")
    args = parser.parse_args()

    spec = json.loads(args.spec_json.read_text(encoding="utf-8"))
    slides_data = spec.get("slides", [])
    if not slides_data or len(slides_data) > 5:
        print(f"EROARE: Regulamentul permite 1–5 slide-uri (primit: {len(slides_data)}).", file=sys.stderr)
        return 1

    prs = Presentation()
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)
    blank = prs.slide_layouts[6]

    project_name = spec.get("project_name", "Startup Demo")
    total = len(slides_data)

    for idx, s in enumerate(slides_data, start=1):
        slide = prs.slides.add_slide(blank)
        is_dark = (idx == 1)
        set_slide_bg(slide, NAVY if is_dark else LIGHT_BG)

        add_header(
            slide,
            badge=s.get("badge", f"Slide {idx}"),
            title=s.get("title", ""),
            subtitle=s.get("subtitle", ""),
            dark=is_dark,
        )

        kpis = s.get("kpis", [])
        cards = s.get("cards", [])
        top_y = 2.0

        if kpis:
            n = min(len(kpis), 4)
            gap = 0.25
            total_w = 11.9
            w = (total_w - gap * (n - 1)) / n
            for i, k in enumerate(kpis[:n]):
                add_kpi_box(
                    slide,
                    left=0.7 + i * (w + gap),
                    top=top_y,
                    width=w,
                    height=1.35,
                    value=k.get("value", ""),
                    label=k.get("label", ""),
                    accent=COBALT if i % 2 == 1 else TEAL,
                )
            top_y += 1.6

        # If Slide 3 and poster exists, reserve right column for poster preview
        use_poster = (idx == 3 and args.poster and args.poster.exists())
        avail_w = 8.4 if use_poster else 11.9

        if cards:
            n = min(len(cards), 3)
            gap = 0.25
            w = (avail_w - gap * (n - 1)) / n
            h = 6.75 - top_y
            for i, c in enumerate(cards[:n]):
                add_card(
                    slide,
                    left=0.7 + i * (w + gap),
                    top=top_y,
                    width=w,
                    height=h,
                    title=c.get("title", ""),
                    bullets=c.get("bullets", []),
                    accent=COBALT if i == 1 else TEAL,
                )

        if use_poster:
            slide.shapes.add_picture(str(args.poster), Inches(9.35), Inches(top_y), width=Inches(3.25))

        add_footer(slide, project_name, idx, total, dark=is_dark)

    args.output_pptx.parent.mkdir(parents=True, exist_ok=True)
    prs.save(args.output_pptx)
    print(f"[OK] Generat prezentare editabilă: {args.output_pptx} ({total} slide-uri)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
