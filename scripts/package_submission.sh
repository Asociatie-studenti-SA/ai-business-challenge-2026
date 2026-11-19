#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

CREATE_TAG=false
if [[ "${1:-}" == "--tag" ]]; then
  CREATE_TAG=true
fi

echo "=== Running automated pre-submission checks ==="
.venv/bin/python .kiro/skills/jury-evaluator/scripts/check_consistency.py || true

OUT_DIR="$ROOT_DIR/submission"
rm -rf "$OUT_DIR"
mkdir -p "$OUT_DIR"

copy_if_exists() {
  local src="$1"
  local dst="$2"
  if [ -f "$src" ]; then
    cp "$src" "$OUT_DIR/$dst"
    echo "  [COPIED] $dst"
  else
    echo "  [MISSING] $src"
  fi
}

echo ""
echo "=== Packaging deliverables into submission/ ==="
copy_if_exists "deliverables/01-strategy/strategy.pdf"           "01_Strategie_1pag.pdf"
copy_if_exists "deliverables/02-finance/financial_model.xlsx"    "02_Model_Financiar.xlsx"
copy_if_exists "deliverables/03-promo/promo_poster.png"          "03_Material_Promovare.png"
copy_if_exists "deliverables/03-promo/promo_copy.md"             "03_Text_Promovare.md"
copy_if_exists "deliverables/04-ai-journal/ai_journal.pdf"       "04_Jurnal_AI_1pag.pdf"
copy_if_exists "deliverables/05-pitch/pitch_deck.pptx"           "05_Pitch_5slide.pptx"
copy_if_exists "deliverables/05-pitch/pitch_deck.pdf"            "05_Pitch_5slide.pdf"
copy_if_exists "deliverables/05-pitch/DEMO_INSTRUCTIONS.md"      "06_Link_Prototip_si_Testare.md"

echo ""
echo "Ready to upload from: $OUT_DIR"
ls -lh "$OUT_DIR"

if [ "$CREATE_TAG" = true ] && [ -d "$ROOT_DIR/.git" ]; then
  git tag -f submission
  echo ""
  echo "[TAGGED] Created local git tag 'submission'. Push with: git push origin submission --force"
fi
