#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OSM_DIR="$ROOT/data/osm"
PBF="$OSM_DIR/madagascar-latest.osm.pbf"

mkdir -p "$OSM_DIR"

if [[ -f "$PBF" ]]; then
  echo "OSM extract already present: $PBF"
  exit 0
fi

echo "Downloading Madagascar OSM extract..."
curl -L -o "$PBF" "https://download.geofabrik.de/africa/madagascar-latest.osm.pbf"

echo "Download complete: $PBF"
