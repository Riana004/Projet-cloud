#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FONTS_DIR="$ROOT/data/fonts"

mkdir -p "$FONTS_DIR"

if [[ -d "$FONTS_DIR/Noto Sans Regular" ]]; then
  echo "Fonts already present in $FONTS_DIR"
  exit 0
fi

echo "Downloading OpenMapTiles fonts (Noto Sans)..."
TMP="$FONTS_DIR/noto-sans.zip"

curl -L -o "$TMP" "https://github.com/openmaptiles/fonts/releases/download/v2.0/noto-sans.zip"
unzip -q "$TMP" -d "$FONTS_DIR"
rm -f "$TMP"

echo "Fonts installed in $FONTS_DIR"
