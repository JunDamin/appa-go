#!/usr/bin/env bash
#
# Re-download all audio assets for Appa Go (Sokcho kids JRPG).
# All sources are CC0 / public domain (no attribution required).
# Run from anywhere; files land under bgm/ and sfx/ next to this script.
#
# Usage:  bash download.sh
#
set -euo pipefail
cd "$(dirname "$0")"
mkdir -p bgm sfx

dl() { # dl <out> <url>
  echo ">> $1"
  curl -L --fail -o "$1" "$2"
}

# ---------- BGM (CC0) ----------
dl bgm/happy_adventure.mp3 "https://opengameart.org/sites/default/files/happy_adveture.mp3"   # TinyWorlds
dl bgm/town_theme.mp3      "https://opengameart.org/sites/default/files/TownTheme.mp3"         # cynicmusic

# ---------- SFX downloaded directly (CC0) ----------
dl sfx/waves_ocean.flac "https://opengameart.org/sites/default/files/wave_01_cc0-18363__jasinski__alkaibeach.flac"  # jasinski
dl sfx/seagull.wav      "https://opengameart.org/sites/default/files/Seagull%20Ambient%201.wav"                     # Rango Mango
dl sfx/market_crowd.ogg "https://opengameart.org/sites/default/files/crowd_shouting_0.ogg"                          # StarNinjas
dl sfx/success_levelup.ogg "https://opengameart.org/sites/default/files/winfretless_0.ogg"                          # Fupi

# ---------- SFX extracted from CC0 packs ----------
# These come from zip packs; we download the zip, unzip, and copy the chosen file.
tmp="$(mktemp -d)"

# rubberduck "100 CC0 SFX" -> page turn, lake splash, UI pop
dl "$tmp/100sfx.zip" "https://opengameart.org/sites/default/files/100-CC0-SFX_0.zip"
unzip -o -q "$tmp/100sfx.zip" -d "$tmp/100sfx"
cp "$tmp/100sfx/paper_01.ogg"  sfx/page_turn.ogg
cp "$tmp/100sfx/splash_01.ogg" sfx/water_lake.ogg
cp "$tmp/100sfx/plop_01.ogg"   sfx/ui_pop.ogg

# rubberduck "80 CC0 RPG SFX" -> sparkle (gem), item-get (coin)
dl "$tmp/80rpg.zip" "https://opengameart.org/sites/default/files/80-CC0-RPG-SFX_0.zip"
unzip -o -q "$tmp/80rpg.zip" -d "$tmp/80rpg"
cp "$tmp/80rpg/item_gem_01.ogg"   sfx/sparkle_item.ogg
cp "$tmp/80rpg/item_coins_01.ogg" sfx/item_get_coin.ogg

rm -rf "$tmp"
echo "Done. See MANIFEST.md for descriptions and licenses."

# ---------- OPTIONAL: gentler market ambience from Pixabay (no attribution) ----------
# Pixabay audio is royalty-free / no-attribution but direct CDN URLs are not stable and
# may require resolving via the page. To use one:
#   1. Open e.g. https://pixabay.com/sound-effects/search/market%20ambience/
#   2. Pick a track, click Download; the resolved URL looks like
#      https://cdn.pixabay.com/audio/<yyyy>/<mm>/<dd>/audio_<hash>.mp3
#   3. curl -L -o sfx/market_pixabay.mp3 "<that-cdn-url>"
