#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PBF="$ROOT/data/osm/madagascar-latest.osm.pbf"
OUT="$ROOT/data/antananarivo.mbtiles"
CONFIG="$ROOT/data/tilemaker/config.json"
PROCESS="$ROOT/data/tilemaker/process.lua"

if [[ ! -f "$PBF" ]]; then
  echo "Missing OSM extract. Run: scripts/download-data.sh"
  exit 1
fi

if command -v tilemaker >/dev/null 2>&1; then
  echo "Using local tilemaker binary..."
  tilemaker --input "$PBF" --output "$OUT" --config "$CONFIG" --process "$PROCESS"
  exit 0
fi

echo "Local tilemaker not found. Trying Docker image..."
docker run --rm \
  -v "$ROOT/data:/data" \
  -v "$ROOT/data/tilemaker:/cfg" \
  ghcr.io/systemed/tilemaker:latest \
  --input /data/osm/madagascar-latest.osm.pbf \
  --output /data/antananarivo.mbtiles \
  --config /cfg/config.json \
  --process /cfg/process.lua
