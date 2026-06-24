# External Asset Manifest

All assets here are **CC0 / public domain** — NO attribution required, safe for the demo.
Re-download with `bash download.sh`. The game uses `TILE = 48` (game.js), so scale these up
(player base 16->48 = 3x; tiles 16->48 = 3x). Use nearest-neighbor scaling to keep pixels crisp:
`ctx.imageSmoothingEnabled = false;`

---

## 1. PLAYER CHARACTER (priority #1) — 4-direction walk

**File:** `characters/player_base_16x16.png`
**Source:** OpenGameArt "Simple Character Base [16x16]" by zaphgames
**License:** CC0 (public domain) — no attribution required
**Image size:** 64 x 64 px. Indexed PNG with transparency (RGBA on draw).

### Frame layout — verified by pixel inspection
- Frame size: **16 x 16 px**
- Grid: **4 columns x 4 rows** = 16 frames total
- **Each ROW = one facing direction; each COLUMN = one walk-cycle frame (4 frames/direction).**

| Row | sy (top y) | Direction | Notes |
|-----|-----------|-----------|-------|
| 0   | 0         | **DOWN** (toward camera) | face visible, symmetric |
| 1   | 16        | **UP** (away) | back of head, no face |
| 2   | 32        | **RIGHT** | eyes drawn on right side |
| 3   | 48        | **LEFT**  | eyes drawn on left side (mirror of right) |

Columns: frame 0..3 at `sx = 0, 16, 32, 48`. A typical walk loop is frames `0,1,2,3`
(frame 0 = standing/contact pose works fine as the idle frame).

### drawImage recipe
```js
const FW = 16, FH = 16;
const DIR = { down:0, up:1, right:2, left:3 };   // = row index
// dir: "down"|"up"|"left"|"right";  frame: 0..3 (advance while moving)
const sx = frame * FW;
const sy = DIR[dir] * FH;
ctx.drawImage(playerSheet, sx, sy, FW, FH, screenX, screenY, TILE, TILE); // TILE=48 -> 3x
```
Idle = hold `frame = 0`. Animate by incrementing `frame = (frame+1)%4` every ~120-150ms while moving.

---

## 2. TOWN / OVERWORLD TILESET (priority #2)

**Files:**
- `tiles/kenney_tiny_town_packed.png` — **192 x 176 px, 12 cols x 11 rows, 16x16 tiles, NO spacing** (USE THIS — simplest math)
- `tiles/kenney_tiny_town_spaced.png` — 203 x 186, same tiles but 1px spacing + 1px margin (only if you prefer it)
- `tiles/kenney_tiny_town_LICENSE.txt` — Kenney's CC0 license text

**Source:** Kenney.nl "Tiny Town" (v1.1)
**License:** CC0 (public domain) — no attribution required (Kenney appreciated but not mandatory)

### Indexing the packed sheet (no spacing)
```js
const TS = 16, COLS = 12;
function tileSrc(index){ return { sx:(index%COLS)*TS, sy:Math.floor(index/COLS)*TS, sw:TS, sh:TS }; }
// draw: const s=tileSrc(i); ctx.drawImage(townSheet, s.sx,s.sy,TS,TS, dx,dy, TILE,TILE);
```
(For the *spaced* sheet instead use `sx = col*(16+1)+0`, `sy = row*(16+1)+0`.)

### Useful tile indices (verified by color sampling; index = row*12 + col)
| Purpose | Tile indices (good starters) |
|---------|------------------------------|
| Grass (base ground) | 0, 1, 2, 4, 5 |
| Path / sand / dirt road | 3, 12, 13, 14, 24, 25, 26, 27, 36, 37, 38, 39, 40, 41, 42 |
| Trees / bushes (foliage) | 6, 7, 8, 19 |
| Water / sea | 48, 49, 50, 51, 55, 60, 61, 62, 76, 77, 79, 96-102, 104, 108-114, 120-124, 126 |
| Houses / roofs / walls (red-brown) | 9, 10, 11, 21, 22, 23, 29, 33, 34, 35, 44-47, 52-59, 64-71, 80-95, 103, 106, 107, 127-131 |
| Wood / planks / dock-ish | 72, 73, 75 (and brown structural tiles around 84-95) |

Tip: open `kenney_tiny_town_packed.png` in an image viewer with a 16px grid overlay to eyeball
the exact house/dock/fence pieces you want — the table above is a verified starting point, not exhaustive.
The full pack (132 individual tile PNGs + Sample.png preview) is in `_tmp/tiny-town/` if you want to browse.

---

## 3. NPC CHARACTER (nice-to-have)

**File:** `characters/npc_knight_32x32.png`
**Source:** OpenGameArt "2D RPG character walk spritesheet" by arikel (offered under CC-BY 4.0 **and CC0**; we take the CC0 option)
**License:** CC0 (public domain) — no attribution required
**Image size:** 192 x 128 px.

### Frame layout — verified by pixel inspection
- Frame size: **32 x 32 px**
- Grid: **6 columns x 4 rows** = 24 frames; each row = one direction, 6 walk frames/direction.
- Row order follows the same top-down RPG convention as above (row0 down-ish ... visually confirm in viewer;
  it is an armored knight so face cues are subtle). Use:
```js
const FW=32, FH=32;                 // 6 frames per row
const sx = frame * FW;              // frame 0..5
const sy = rowForDirection * FH;    // 0..3
```
Recommended use: a stationary/animated NPC (vendor or guard). For more NPC variety you can recolor
`player_base_16x16.png` (it's a plain base) per-NPC via a tint, or grab additional CC0 Kenney character
tiles from Tiny Town / Tiny Dungeon.

---

## License summary (all CC0 — zero attribution obligation)
| Asset | Pack | Author | License |
|-------|------|--------|---------|
| player_base_16x16.png | Simple Character Base [16x16] | zaphgames (OpenGameArt) | CC0 |
| npc_knight_32x32.png | 2D RPG character walk spritesheet | arikel (OpenGameArt) | CC0 |
| kenney_tiny_town_*.png | Tiny Town | Kenney.nl | CC0 |

Direct download URLs (also in `download.sh`):
- Tiny Town: https://kenney.nl/media/pages/assets/tiny-town/a415fbeb49-1735736916/kenney_tiny-town.zip
- Player base: https://opengameart.org/sites/default/files/character_base_16x16_0.png
- NPC knight: https://opengameart.org/sites/default/files/rpg_sprite_walk.png
