#!/usr/bin/env python3
"""
Pre-submission automated consistency, Facts Sheet, UI-word, Excel formula,
and Anti-AI-Tells checker for AI-Powered Business Challenge 2026 (UPB / FAIMA).
"""

import json
import re
import shutil
import subprocess
import sys
import urllib.request
import zipfile
from pathlib import Path


ROOT = Path(__file__).resolve().parents[4]


def count_pdf_pages(pdf_path: Path) -> int:
    if shutil.which("pdfinfo"):
        out = subprocess.check_output(["pdfinfo", str(pdf_path)], text=True, errors="ignore")
        m = re.search(r"^Pages:\s+(\d+)", out, re.MULTILINE)
        if m:
            return int(m.group(1))
    data = pdf_path.read_bytes()
    pages = re.findall(rb"/Type\s*/Page\b(?!s)", data)
    return len(pages) if pages else 1


def count_words(md_path: Path) -> int:
    if not md_path.exists():
        return 0
    text = md_path.read_text(encoding="utf-8", errors="ignore")
    return len(re.findall(r"\b\w+\b", text))


def check_excel_formulas(xlsx_path: Path) -> tuple[bool, str]:
    try:
        from openpyxl import load_workbook
    except ImportError:
        return False, "openpyxl not installed (run with .venv/bin/python)"
    wb = load_workbook(xlsx_path, data_only=False)
    formulas = 0
    errors = []
    for name in wb.sheetnames:
        ws = wb[name]
        for row in ws.iter_rows():
            for cell in row:
                v = cell.value
                if isinstance(v, str):
                    if v.startswith("="):
                        formulas += 1
                    for err in ("#REF!", "#DIV/0!", "#VALUE!", "#NAME?", "#N/A"):
                        if err in v:
                            errors.append(f"{name}!{cell.coordinate}: {v}")
    # Verify fullCalcOnLoad="1" inside xl/workbook.xml so Excel/Sheets compute on open
    full_calc = False
    with zipfile.ZipFile(xlsx_path, "r") as zf:
        if "xl/workbook.xml" in zf.namelist():
            wb_xml = zf.read("xl/workbook.xml").decode("utf-8", errors="ignore")
            full_calc = 'fullCalcOnLoad="1"' in wb_xml or "fullCalcOnLoad='1'" in wb_xml

    if errors:
        return False, f"Excel errors detected: {', '.join(errors[:5])}"
    if formulas < 10:
        return False, f"Too few live Excel formulas ({formulas} < 10)!"
    if not full_calc:
        return False, f"{formulas} formulas found, but missing fullCalcOnLoad=\"1\" in workbook.xml"
    return True, f"{formulas} live Excel formulas, fullCalcOnLoad=1, 0 errors, {len(wb.sheetnames)} sheets"


def check_pptx_slides(pptx_path: Path) -> tuple[bool, str]:
    try:
        from pptx import Presentation
    except ImportError:
        return False, "python-pptx not installed (run with .venv/bin/python)"
    prs = Presentation(pptx_path)
    n = len(prs.slides)
    if n == 0 or n > 5:
        return False, f"Has {n} slides (contest hard limit is MAX 5 slides!)"
    return True, f"{n} slides (<= 5 OK)"


def check_url_live(url: str) -> tuple[bool, str]:
    if not url or not url.startswith(("http://", "https://")):
        return False, f"Invalid or missing URL: {url!r}"
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=10) as r:
            code = r.getcode()
            return (200 <= code < 400), f"HTTP {code} ({url})"
    except Exception as e:
        return False, f"Unreachable ({url}): {e}"


def check_ai_tells(root: Path) -> tuple[bool, str]:
    """Scan generated deliverables for banned RO/EN AI-slop tells and emoji bullets."""
    banned = [
        r"\bnu este doar\b",
        r"\bit'?s not just\b",
        r"\bin today'?s fast-paced\b",
        r"\bîntr-o lume în continuă schimbare\b",
        r"\bdeblochează potențialul\b",
        r"\bunlock the power of\b",
        r"\bspune adio\b",
        r"\bsay goodbye to\b",
        r"\bgame-changer\b",
        r"\brevoluționar(?:ă|e|i)?\b",
        r"\bfără cusur\b",
        r"(?:^|\n)\s*[-*]?\s*[🚀✅💡🔥]",
    ]
    targets = [
        root / "deliverables" / "01-strategy" / "strategy.md",
        root / "deliverables" / "03-promo" / "promo_copy.md",
        root / "deliverables" / "05-pitch" / "PITCH_SCRIPT_3MIN.md",
        root / "deliverables" / "05-pitch" / "pitch_spec.json",
    ]
    hits = []
    for p in targets:
        if not p.exists():
            continue
        text = p.read_text(encoding="utf-8", errors="ignore")
        for pat in banned:
            if re.search(pat, text, flags=re.IGNORECASE):
                hits.append(f"{p.name}: /{pat}/")
    if hits:
        return False, f"AI tells detected ({len(hits)}): {', '.join(hits[:4])}"
    return True, "0 banned RO/EN AI-tells or emoji-bullets detected"


def check_ui_words_and_facts(root: Path, numbers: dict) -> tuple[bool, str]:
    """Field-tested rule (Sec. 7.8): verify verbatim UI button labels appear in app/docs AND DEMO_INSTRUCTIONS.md."""
    ui = numbers.get("ui_contract", {})
    labels = [
        v.strip()
        for k, v in ui.items()
        if k in ("demo_button_label", "primary_cta_label") and isinstance(v, str) and v.strip() and not v.startswith("TBD")
    ]
    if not labels:
        return False, "ui_contract button labels still TBD in brief/NUMBERS.json"

    demo_md = root / "deliverables" / "05-pitch" / "DEMO_INSTRUCTIONS.md"
    demo_txt = demo_md.read_text(encoding="utf-8", errors="ignore") if demo_md.exists() else ""

    # Gather app/ or docs/ source text
    app_txt_parts = []
    for folder in (root / "app", root / "docs"):
        if folder.exists():
            for ext in ("*.html", "*.tsx", "*.jsx", "*.ts", "*.js"):
                for f in folder.rglob(ext):
                    if "node_modules" in f.parts or "dist" in f.parts:
                        continue
                    app_txt_parts.append(f.read_text(encoding="utf-8", errors="ignore"))
    app_txt = "\n".join(app_txt_parts)

    missing = []
    for lbl in labels:
        if app_txt and lbl not in app_txt:
            missing.append(f"'{lbl}' missing from app/docs source")
        if demo_txt and lbl not in demo_txt:
            missing.append(f"'{lbl}' missing from DEMO_INSTRUCTIONS.md")
    if missing:
        return False, "; ".join(missing)
    return True, f"Verbatim UI labels verified ({', '.join(labels)})"


def check_cross_file_numbers(root: Path, numbers: dict) -> tuple[bool, str]:
    """Verify unit_price from NUMBERS.json appears consistently in strategy.md and pitch_spec.json."""
    price = numbers.get("pricing", {}).get("unit_price", 0)
    if not price:
        return False, "pricing.unit_price is 0 in brief/NUMBERS.json"
    price_variants = {f"{int(price)}", f"{int(price):,}", f"{int(price):,}".replace(",", ".")}
    issues = []
    for rel in ("deliverables/01-strategy/strategy.md", "deliverables/05-pitch/pitch_spec.json"):
        p = root / rel
        if p.exists():
            txt = p.read_text(encoding="utf-8", errors="ignore")
            if not any(v in txt for v in price_variants):
                issues.append(f"{p.name} does not mention unit_price ({int(price)})")
    if issues:
        return False, "; ".join(issues)
    return True, f"Unit price ({int(price)} {numbers.get('currency', 'RON')}) synced across Strategy & Pitch"


def main() -> int:
    checks: list[tuple[str, bool, str]] = []

    # 1. Fail-Fast SSOT & NUMBERS.json check
    ssot_path = ROOT / "brief" / "SSOT.md"
    ssot_txt = ssot_path.read_text(encoding="utf-8", errors="ignore") if ssot_path.exists() else ""
    ssot_unresolved = re.findall(r"<REQUIRED:|TBD_AFTER_", ssot_txt)
    checks.append((
        "0. Fail-Fast SSOT Gate (brief/SSOT.md)",
        bool(ssot_txt) and len(ssot_unresolved) == 0,
        "Clean & locked" if (ssot_txt and not ssot_unresolved) else f"{len(ssot_unresolved)} unresolved placeholder(s) in SSOT.md",
    ))

    num_path = ROOT / "brief" / "NUMBERS.json"
    numbers = {}
    if not num_path.exists():
        checks.append(("1. SSOT Numbers (brief/NUMBERS.json)", False, "Missing brief/NUMBERS.json"))
    else:
        numbers = json.loads(num_path.read_text(encoding="utf-8"))
        locked = numbers.get("status") == "LOCKED"
        rev = numbers.get("summary_year_1", {}).get("total_revenue", 0)
        checks.append((
            "1. SSOT Numbers (brief/NUMBERS.json)",
            locked and rev > 0,
            f"status={numbers.get('status')}, year1_rev={rev}, currency={numbers.get('currency')}",
        ))

    # 2. Live App URL
    live_url = numbers.get("live_app_url", "")
    if not live_url or live_url == "TBD":
        m = re.search(r"https?://[^\s\)\]`]+", ssot_txt)
        if m:
            live_url = m.group(0)
    ok_url, msg_url = check_url_live(live_url)
    checks.append(("2. Live Web App URL (35p/30p)", ok_url, msg_url))

    # 3. Strategy PDF (<= 1 page + word guard)
    strat_pdf = ROOT / "deliverables" / "01-strategy" / "strategy.pdf"
    strat_words = count_words(ROOT / "deliverables" / "01-strategy" / "strategy.md")
    if strat_pdf.exists():
        pages = count_pdf_pages(strat_pdf)
        ok_s = pages <= 1 and (strat_words == 0 or strat_words <= 550)
        checks.append(("3. One-Page Strategy PDF", ok_s, f"{pages} page(s) (max 1), {strat_words} words"))
    else:
        checks.append(("3. One-Page Strategy PDF", False, f"Missing {strat_pdf.relative_to(ROOT)}"))

    # 4. Financial Model XLSX (real formulas + fullCalcOnLoad)
    fin_xlsx = ROOT / "deliverables" / "02-finance" / "financial_model.xlsx"
    if fin_xlsx.exists():
        ok_x, msg_x = check_excel_formulas(fin_xlsx)
        checks.append(("4. Financial Model (.xlsx)", ok_x, msg_x))
    else:
        checks.append(("4. Financial Model (.xlsx)", False, f"Missing {fin_xlsx.relative_to(ROOT)}"))

    # 5. Promo Asset (PNG + copy)
    promo_png = ROOT / "deliverables" / "03-promo" / "promo_poster.png"
    promo_copy = ROOT / "deliverables" / "03-promo" / "promo_copy.md"
    ok_promo = promo_png.exists() and promo_png.stat().st_size > 10_000 and promo_copy.exists()
    checks.append((
        "5. Promotional Asset (15p)",
        ok_promo,
        f"poster={promo_png.exists()} ({promo_png.stat().st_size if promo_png.exists() else 0}B), copy={promo_copy.exists()}",
    ))

    # 6. AI Journal PDF (<= 1 page + word guard)
    journal_pdf = ROOT / "deliverables" / "04-ai-journal" / "ai_journal.pdf"
    journal_words = count_words(ROOT / "deliverables" / "04-ai-journal" / "ai_journal.md")
    if journal_pdf.exists():
        pages = count_pdf_pages(journal_pdf)
        ok_j = pages <= 1 and (journal_words == 0 or journal_words <= 550)
        checks.append(("6. AI Journal PDF (15p/20p)", ok_j, f"{pages} page(s) (max 1), {journal_words} words"))
    else:
        checks.append(("6. AI Journal PDF (15p/20p)", False, f"Missing {journal_pdf.relative_to(ROOT)}"))

    # 7. Pitch Deck (<= 5 slides) + Demo Instructions
    pitch_pptx = ROOT / "deliverables" / "05-pitch" / "pitch_deck.pptx"
    demo_md = ROOT / "deliverables" / "05-pitch" / "DEMO_INSTRUCTIONS.md"
    if pitch_pptx.exists():
        ok_p, msg_p = check_pptx_slides(pitch_pptx)
        checks.append(("7. Pitch Deck (.pptx + DEMO)", ok_p and demo_md.exists(), f"{msg_p}, demo_md={demo_md.exists()}"))
    else:
        checks.append(("7. Pitch Deck (.pptx + DEMO)", False, f"Missing {pitch_pptx.relative_to(ROOT)}"))

    # 8. Verbatim UI-Words & Facts Sheet Sync
    ok_ui, msg_ui = check_ui_words_and_facts(ROOT, numbers)
    checks.append(("8. Verbatim UI-Words Parity", ok_ui, msg_ui))

    # 9. Cross-File Numeric Sync
    ok_num, msg_num = check_cross_file_numbers(ROOT, numbers)
    checks.append(("9. Cross-File Numeric Sync", ok_num, msg_num))

    # 10. Anti-AI-Tells Scan (RO + EN)
    ok_tells, msg_tells = check_ai_tells(ROOT)
    checks.append(("10. Anti-AI-Tells Copy Gate", ok_tells, msg_tells))

    print("\n=== PRE-SUBMISSION AUDIT — AI-POWERED BUSINESS CHALLENGE 2026 ===")
    failed = 0
    for name, ok, detail in checks:
        tag = "PASS" if ok else "FAIL"
        if not ok:
            failed += 1
        print(f" [{tag}] {name}: {detail}")

    print(f"\nSummary: {len(checks) - failed}/{len(checks)} checks passed.")
    return 0 if failed == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
