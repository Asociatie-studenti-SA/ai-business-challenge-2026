#!/usr/bin/env python3
"""Render an HTML promotional poster/social post to a high-res PNG via headless Chrome."""

import argparse
import os
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
    raise RuntimeError("Google Chrome / Chromium nu a fost găsit.")


def main() -> int:
    parser = argparse.ArgumentParser(description="Render HTML poster to high-res PNG.")
    parser.add_argument("input_html", type=Path)
    parser.add_argument("output_png", type=Path)
    parser.add_argument("--width", type=int, default=1080)
    parser.add_argument("--height", type=int, default=1350)
    parser.add_argument("--scale", type=int, default=2)
    args = parser.parse_args()

    in_path = args.input_html.resolve()
    out_path = args.output_png.resolve()
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
        "--hide-scrollbars",
        f"--force-device-scale-factor={args.scale}",
        f"--window-size={args.width},{args.height}",
        f"--screenshot={out_path}",
        in_path.as_uri(),
    ]
    res = subprocess.run(cmd, capture_output=True, text=True)
    if res.returncode != 0 or not out_path.exists():
        print("EROARE Chrome screenshot:", res.stderr, file=sys.stderr)
        return 1

    print(f"[OK] Generat {out_path} ({args.width}x{args.height} @{args.scale}x)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
