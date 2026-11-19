#!/usr/bin/env python3
"""Render an HTML file to a crisp PDF via headless Chrome and enforce max page count."""

import argparse
import os
import re
import shutil
import subprocess
import sys
from pathlib import Path


def find_chrome() -> str:
    candidates = [
        os.environ.get("CHROME_BIN", ""),
        "google-chrome",
        "google-chrome-stable",
        "chromium",
        "chromium-browser",
        "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    ]
    for c in candidates:
        if not c:
            continue
        found = shutil.which(c) or (c if os.path.exists(c) else None)
        if found:
            return found
    raise RuntimeError(
        "Google Chrome / Chromium nu a fost găsit. Instalează Chrome sau setează CHROME_BIN."
    )


def count_pdf_pages(pdf_path: Path) -> int:
    """Count pages using pdfinfo if available, otherwise scan PDF page objects."""
    if shutil.which("pdfinfo"):
        out = subprocess.check_output(["pdfinfo", str(pdf_path)], text=True, errors="ignore")
        m = re.search(r"^Pages:\s+(\d+)", out, re.MULTILINE)
        if m:
            return int(m.group(1))
    data = pdf_path.read_bytes()
    # Count /Type /Page (excluding /Type /Pages)
    pages = re.findall(rb"/Type\s*/Page\b(?!s)", data)
    return len(pages) if pages else 1


def main() -> int:
    parser = argparse.ArgumentParser(description="Render HTML to PDF with strict page limit.")
    parser.add_argument("input_html", type=Path)
    parser.add_argument("output_pdf", type=Path)
    parser.add_argument("--max-pages", type=int, default=1)
    parser.add_argument("--landscape", action="store_true", help="Hint only; prefer @page CSS in HTML.")
    args = parser.parse_args()

    in_path = args.input_html.resolve()
    out_path = args.output_pdf.resolve()
    if not in_path.exists():
        print(f"EROARE: Nu există fișierul {in_path}", file=sys.stderr)
        return 1
    out_path.parent.mkdir(parents=True, exist_ok=True)

    chrome = find_chrome()
    cmd = [
        chrome,
        "--headless=new",
        "--disable-gpu",
        "--no-sandbox",
        "--no-pdf-header-footer",
        f"--print-to-pdf={out_path}",
        in_path.as_uri(),
    ]
    res = subprocess.run(cmd, capture_output=True, text=True)
    if res.returncode != 0 or not out_path.exists():
        print("EROARE Chrome print-to-pdf:", res.stderr, file=sys.stderr)
        return 1

    pages = count_pdf_pages(out_path)
    print(f"[OK] Generat {out_path} ({pages} pagini, limită: {args.max_pages})")
    if pages > args.max_pages:
        print(
            f"[ATENTIE] PDF-ul are {pages} pagini, dar limita regulamentului este {args.max_pages}! "
            "Compactează CSS-ul/textul în HTML și re-rulează.",
            file=sys.stderr,
        )
        return 2
    return 0


if __name__ == "__main__":
    sys.exit(main())
