#!/usr/bin/env bash
# Re-download the external CC0 game assets for appa_go.
# All assets below are CC0 (public domain) -- NO attribution required.
# Run from anywhere; outputs land in this script's directory.
set -e
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
mkdir -p "$DIR/characters" "$DIR/tiles" "$DIR/_tmp"
cd "$DIR/_tmp"

echo ">> Kenney Tiny Town (CC0) -- town/overworld tileset, 16x16"
curl -L -o tiny-town.zip \
  "https://kenney.nl/media/pages/assets/tiny-town/a415fbeb49-1735736916/kenney_tiny-town.zip"
unzip -o -q tiny-town.zip -d tiny-town
cp tiny-town/Tilemap/tilemap_packed.png "$DIR/tiles/kenney_tiny_town_packed.png"   # 192x176, 12x11 @16px, NO spacing
cp tiny-town/Tilemap/tilemap.png        "$DIR/tiles/kenney_tiny_town_spaced.png"   # 203x186, 1px spacing+margin
cp tiny-town/License.txt                "$DIR/tiles/kenney_tiny_town_LICENSE.txt"

echo ">> Simple Character Base 16x16 by zaphgames (CC0) -- player walk sheet"
curl -L -o "$DIR/characters/player_base_16x16.png" \
  "https://opengameart.org/sites/default/files/character_base_16x16_0.png"          # 64x64, 4x4 @16px

echo ">> arikel 2D RPG character walk spritesheet (CC0 option) -- NPC knight"
curl -L -o "$DIR/characters/npc_knight_32x32.png" \
  "https://opengameart.org/sites/default/files/rpg_sprite_walk.png"                 # 192x128, 6x4 @32px

echo ">> Done. See MANIFEST.md for frame-slicing details."
