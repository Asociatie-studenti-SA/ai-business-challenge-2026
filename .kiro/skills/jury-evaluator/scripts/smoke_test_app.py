#!/usr/bin/env python3
"""
Headless Chrome live smoke test + true 360px mobile overflow verifier.
Works against either a live https:// URL or a local HTML file/directory.
Uses a 360x780 iframe wrapper to bypass headless Chrome's ~500px min window width floor.
"""

import argparse
import functools
import http.server
import os
import re
import shutil
import socketserver
import subprocess
import sys
import tempfile
import threading
import urllib.request
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
    raise RuntimeError("Google Chrome / Chromium not found.")


class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, format, *args):
        pass


def start_local_server(directory: Path):
    handler = functools.partial(QuietHandler, directory=str(directory))
    httpd = socketserver.TCPServer(("127.0.0.1", 0), handler)
    port = httpd.server_address[1]
    t = threading.Thread(target=httpd.serve_forever, daemon=True)
    t.start()
    return httpd, port


def run_chrome(chrome: str, extra_args: list[str], url: str, timeout: int = 30) -> subprocess.CompletedProcess:
    cmd = [
        chrome,
        "--headless=new",
        "--disable-gpu",
        "--no-sandbox",
        "--virtual-time-budget=4000",
        *extra_args,
        url,
    ]
    return subprocess.run(cmd, capture_output=True, text=True, timeout=timeout)


def check_true_360px_overflow(chrome: str, target_url: str, local_dir: Path | None) -> tuple[bool, str]:
    """
    Headless Chrome/Edge silently clamps --window-size widths below ~500px.
    Render inside a 360x780 iframe on a local HTTP wrapper so we get a true 360px layout check.
    """
    with tempfile.TemporaryDirectory(prefix="smoke360_") as tmp:
        tmp_path = Path(tmp)
        serve_dir = tmp_path
        iframe_src = target_url

        if local_dir is not None:
            # Copy local site into tmp/site so wrapper and iframe are same-origin on 127.0.0.1!
            site_dst = tmp_path / "site"
            shutil.copytree(local_dir, site_dst)
            rel_name = Path(target_url).name if not target_url.startswith("http") else "index.html"
            iframe_src = f"/site/{rel_name}"
        elif target_url.startswith(("http://", "https://")):
            # Fetch target HTML locally so we can measure same-origin scrollWidth without CORS blocks
            try:
                req = urllib.request.Request(target_url, headers={"User-Agent": "Mozilla/5.0"})
                html = urllib.request.urlopen(req, timeout=12).read().decode("utf-8", errors="ignore")
                # Inject <base href="..."> so relative CSS/JS assets still load cleanly
                base_tag = f'<base href="{target_url}">'
                if "<head>" in html:
                    html = html.replace("<head>", f"<head>{base_tag}", 1)
                else:
                    html = base_tag + html
                (tmp_path / "mirrored.html").write_text(html, encoding="utf-8")
                iframe_src = "/mirrored.html"
            except Exception as e:
                return False, f"Could not mirror remote URL for 360px check: {e}"

        wrapper_html = f"""<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>body{{margin:0;padding:0;}}</style></head>
<body>
<iframe id="f" src="{iframe_src}" style="width:360px;height:780px;border:0;display:block;"></iframe>
<pre id="PROBE">PENDING</pre>
<script>
const f = document.getElementById('f');
const out = document.getElementById('PROBE');
function measure() {{
  try {{
    const doc = f.contentDocument;
    if (!doc || !doc.documentElement) {{ out.textContent = 'ERR:NO_DOC'; return; }}
    const sw = doc.documentElement.scrollWidth;
    const cw = doc.documentElement.clientWidth;
    const bodySw = doc.body ? doc.body.scrollWidth : sw;
    const maxSw = Math.max(sw, bodySw);
    out.textContent = JSON.stringify({{scrollWidth: maxSw, clientWidth: cw, overflowPx: Math.max(0, maxSw - cw)}});
  }} catch (e) {{
    out.textContent = 'ERR:' + e.message;
  }}
}}
f.addEventListener('load', () => setTimeout(measure, 600));
setTimeout(() => {{ if (out.textContent === 'PENDING') measure(); }}, 2500);
</script>
</body></html>"""
        (tmp_path / "wrapper.html").write_text(wrapper_html, encoding="utf-8")

        httpd, port = start_local_server(serve_dir)
        try:
            res = run_chrome(
                chrome,
                ["--window-size=900,900", "--dump-dom"],
                f"http://127.0.0.1:{port}/wrapper.html",
            )
        finally:
            httpd.shutdown()

        m = re.search(r'<pre id="PROBE">(.*?)</pre>', res.stdout, flags=re.S)
        if not m:
            return False, "360px probe did not produce output"
        payload = m.group(1).strip()
        if payload.startswith("ERR:") or payload == "PENDING":
            return False, f"360px probe error: {payload}"
        import json
        data = json.loads(payload)
        ov = int(data.get("overflowPx", 0))
        sw = int(data.get("scrollWidth", 0))
        cw = int(data.get("clientWidth", 360))
        if ov > 2:
            return False, f"HORIZONTAL OVERFLOW at true 360px: scrollWidth={sw}px > clientWidth={cw}px (+{ov}px)"
        return True, f"True 360px OK (scrollWidth={sw}px <= clientWidth={cw}px)"


def main() -> int:
    parser = argparse.ArgumentParser(description="Live DOM smoke test + true 360px mobile overflow check.")
    parser.add_argument("target", help="Live https:// URL OR path to local index.html")
    parser.add_argument("--out-dir", type=Path, default=None, help="Optional directory to save 1280x720 screenshot")
    args = parser.parse_args()

    chrome = find_chrome()
    local_dir: Path | None = None
    httpd = None
    target_url = args.target

    if not target_url.startswith(("http://", "https://")):
        p = Path(target_url).resolve()
        if not p.exists():
            print(f"[FAIL] Local file not found: {p}", file=sys.stderr)
            return 1
        local_dir = p.parent
        httpd, port = start_local_server(local_dir)
        target_url = f"http://127.0.0.1:{port}/{p.name}"

    try:
        # 1. HTTP Reachability + DOM render check
        with urllib.request.urlopen(urllib.request.Request(target_url, headers={"User-Agent": "Mozilla/5.0"}), timeout=12) as r:
            status_code = r.getcode()
        if not (200 <= status_code < 400):
            print(f"[FAIL] HTTP {status_code} for {target_url}")
            return 1

        dom_res = run_chrome(chrome, ["--window-size=1280,720", "--dump-dom"], target_url)
        dom_len = len(dom_res.stdout.strip())
        if dom_res.returncode != 0 or dom_len < 200:
            print(f"[FAIL] DOM dump failed or empty ({dom_len} chars)")
            return 1
        print(f"[PASS] Live DOM Render: HTTP {status_code}, {dom_len} chars rendered at 1280x720")

        # 2. Optional projector screenshot (1280x720)
        if args.out_dir:
            args.out_dir.mkdir(parents=True, exist_ok=True)
            shot = args.out_dir / "smoke_desktop_1280x720.png"
            s_res = run_chrome(chrome, ["--window-size=1280,720", "--hide-scrollbars", f"--screenshot={shot}"], target_url)
            if s_res.returncode == 0 and shot.exists():
                print(f"[PASS] Desktop 1280x720 screenshot saved: {shot}")

        # 3. True 360px mobile overflow check
        ok_360, msg_360 = check_true_360px_overflow(chrome, args.target if local_dir else target_url, local_dir)
        print(f"[{'PASS' if ok_360 else 'FAIL'}] Mobile 360px Viewport: {msg_360}")
        return 0 if ok_360 else 2
    finally:
        if httpd:
            httpd.shutdown()


if __name__ == "__main__":
    sys.exit(main())
