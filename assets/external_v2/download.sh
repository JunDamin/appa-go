#!/usr/bin/env bash
# Re-download the v2 art set (LPC, 32px) into assets/external_v2/_downloads and
# re-organize into tiles/ buildings/ characters/.
# Usage (Windows Git Bash):  bash download.sh
# Validate syntax without running:  bash -n download.sh
set -euo pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"
DL="$HERE/_downloads"
mkdir -p "$DL" "$HERE/tiles" "$HERE/buildings" "$HERE/characters"

# --- Direct download URLs (verified 2026-06-24) ---
URL_LPC_BASE="https://opengameart.org/sites/default/files/lpc_base_assets.zip"
URL_LPC_CITY="https://opengameart.org/sites/default/files/LPC_city_outside_1.zip"
# CC0 fallback (16px, not used by default; here for reference only):
URL_KENNEY_CITY="https://kenney.nl/media/pages/assets/roguelike-modern-city/0ff3dfff2b-1677694743/kenney_roguelike-modern-city.zip"

echo ">> Downloading LPC Base Assets (terrain + characters, 32px tiles / 64px sprites)"
curl -L -o "$DL/lpc_base_assets.zip" "$URL_LPC_BASE"
echo ">> Downloading LPC City Outside (building walls/roofs/doors atlas)"
curl -L -o "$DL/lpc_city_outside.zip" "$URL_LPC_CITY"
# Optional CC0 fallback:
# curl -L -o "$DL/kenney_modern_city.zip" "$URL_KENNEY_CITY"

echo ">> Extracting"
rm -rf "$DL/lpc_extract" "$DL/lpc_city_extract"
unzip -o -q "$DL/lpc_base_assets.zip" -d "$DL/lpc_extract"
unzip -o -q "$DL/lpc_city_outside.zip" -d "$DL/lpc_city_extract"

SRC="$DL/lpc_extract/LPC Base Assets"
CITY="$DL/lpc_city_extract/LPC_city_outside"

echo ">> Organizing tiles/"
cp "$SRC/tiles/"{grass,grassalt,water,watergrass,dirt,dirt2,cement,cementstair,bridges,signs,country,treetop,trunk,mountains,rock}.png "$HERE/tiles/"

echo ">> Organizing buildings/"
cp "$SRC/tiles/"{house,victoria}.png "$HERE/buildings/"
cp "$CITY/city_outside.png" "$CITY/preview1.png" "$CITY/preview2.png" "$CITY/preview3.png" "$HERE/buildings/"

echo ">> Organizing characters/"
cp "$SRC/sprites/people/"{male_walkcycle,female_walkcycle,soldier,soldier_altcolor,princess,hairmale,hairfemale,male_pants}.png "$HERE/characters/"
cp "$SRC/sprites/monsters/"{slime,bat}.png "$HERE/characters/"

echo ">> Copying credits"
cp "$SRC/CREDITS.TXT" "$HERE/CREDITS-lpc-base.txt"
cp "$CITY/credits.txt" "$HERE/CREDITS-lpc-city.txt"

echo ">> Done. See MANIFEST.md for slicing math and tile dictionary."
