#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

echo "=== Setup mediu AI-Powered Business Challenge 2026 ==="

if [ ! -d ".venv" ]; then
  echo "[1/3] Creez virtual environment Python (.venv)..."
  python3 -m venv .venv
fi

echo "[2/3] Instalez openpyxl și python-pptx..."
.venv/bin/pip install --quiet --upgrade pip
.venv/bin/pip install --quiet -r requirements.txt

echo "[3/3] Verific uneltele de sistem..."
.venv/bin/python -c "import openpyxl, pptx; print('  [OK] Python openpyxl + python-pptx')"

if command -v node >/dev/null 2>&1; then
  echo "  [OK] Node $(node -v) / npm $(npm -v)"
else
  echo "  [ATENTIE] Node.js nu este instalat!"
fi

if command -v google-chrome >/dev/null 2>&1 || command -v chromium >/dev/null 2>&1 || command -v chromium-browser >/dev/null 2>&1; then
  echo "  [OK] Chrome/Chromium găsit pentru export PDF/PNG"
else
  echo "  [ATENTIE] Chrome/Chromium nu a fost găsit în PATH!"
fi

echo ""
echo "Setup finalizat! Mâine la 11:00 lipiți tema în brief/RAW_THEME.md și porniți agentul orchestrator."
