#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

python -m json.tool "$ROOT/data/config.json" > /dev/null
python -m json.tool "$ROOT/data/tilemaker/config.json" > /dev/null
python -m json.tool "$ROOT/data/styles/basic/style.json" > /dev/null

echo "JSON configs are valid."
