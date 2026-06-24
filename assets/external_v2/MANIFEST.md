# appa_go — Art Set v2 (LPC, 32px) — Integration Manifest

Top-down JRPG art for a child settling into a new neighborhood in Sokcho, Korea.
Chosen style: **Liberated Pixel Cup (LPC)** — coherent, high-readability, fully libre,
32px terrain tiles + 64px 4-direction walk characters. Replaces the rejected 16px
Kenney Tiny Town set.

Project root: `C:\Users\user\Documents\appa_go`
This set lives ONLY under: `assets/external_v2/`

---

## 0. Packs chosen & LICENSE / ATTRIBUTION

| Pack | Source URL | License | Used for |
|------|-----------|---------|----------|
| **LPC Base Assets (sprites & map tiles)** | https://opengameart.org/content/liberated-pixel-cup-lpc-base-assets-sprites-map-tiles | CC-BY-SA 3.0 **OR** GPL 3.0. Sharm's tiles + Redshrike's character templates are ALSO available under **OGA-BY 3.0** (per CREDITS.TXT note, Medicine Storm 2022). | grass / water / dirt / cement / trees / fences / signs terrain, and the 4-direction walk characters + NPC sprites |
| **[LPC] City outside** | https://opengameart.org/content/lpc-city-outside | CC-BY-SA 3.0 / GPL 3.0 / GPL 2.0 | modern-ish building walls, roofs, doors, windows, stone/brick pavement, market booth, well, statues — used to assemble distinct civic buildings |
| _(reference only, NOT used)_ Kenney Roguelike Modern City | https://kenney.nl/assets/roguelike-modern-city | **CC0** (no attribution) | CC0 fallback if a no-credit set is ever required. 16px — rejected for low readability. Direct zip in `download.sh`. |

### Required attribution string (use this in game credits / README)

> Art: **Liberated Pixel Cup (LPC)** assets.
> Terrain & character templates by **Lanea Zimmerman (Sharm)** and **Stephen Challener (Redshrike)**; NPC sprites by **Manuel Riecke (MrBeast)**; monsters by **Charles Sanchez (CharlesGabriel)**.
> "[LPC] City outside" by **Reemax (Tuomo Untinen)** with Sharm, daneeklu, Hyptosis, Johann C, Johannes Sjölund, Guido Bos, Xenodora, caeles, William.Thompsonj, wulax.
> Licensed **CC-BY-SA 3.0 / GPL 3.0**. Source: opengameart.org. Full credits: `CREDITS-lpc-base.txt`, `CREDITS-lpc-city.txt`.

NOTE on CC-BY-SA: ShareAlike applies to the *art assets themselves* (and derivatives of
them), not to your game code. Keep the credit strings and the two CREDITS files shipped
with the build. Full per-artist breakdown is in `CREDITS-lpc-base.txt` and
`CREDITS-lpc-city.txt` in this folder.

---

## 1. Directory layout

```
assets/external_v2/
  tiles/         terrain tilesets (32px tiles)
  buildings/     building atlases (32px tiles) + city_outside previews
  characters/    walk-cycle spritesheets (64x64 frames) + NPCs/monsters
  _downloads/    raw zips + extracted originals (can be git-ignored)
  download.sh    re-download + re-organize script (bash -n validated)
  MANIFEST.md    this file
  CREDITS-lpc-base.txt / CREDITS-lpc-city.txt
```

---

## 2. GLOBAL slicing constants

- **Terrain & building tiles:** TILE = **32 x 32 px**, zero margin, zero spacing.
  - For any tile sheet: `cols = imageWidth / 32`, `rows = imageHeight / 32`,
    `tileIndex = row * cols + col` (row-major, 0-based).
- **Character walk sheets:** FRAME = **64 x 64 px**, zero margin/spacing.
  - Sprite art is drawn small inside a 64px box (feet near bottom). When placing on a
    32px tile map, draw the 64px frame centered over the tile and offset up so the feet
    sit on the tile (typical: `drawX = tileX - 16`, `drawY = tileY - 32`).

---

## 3. TILES — `assets/external_v2/tiles/`

All are 32px tilesheets. Dimensions and the readable contents:

| File | px (WxH) | cols x rows | Contents / how to use |
|------|----------|-------------|-----------------------|
| `grass.png`    | 96x192  | 3 x 6 | GRASS autotile block — center fill tile + edge/corner transitions to dirt. Use the solid interior tile as base ground. |
| `grassalt.png` | 96x192  | 3 x 6 | Alternate grass palette (same layout as grass.png). |
| `dirt.png`     | 96x192  | 3 x 6 | DIRT/earth autotile (paths, bare ground). 3x3 transition block + variants. |
| `dirt2.png`    | 96x192  | 3 x 6 | Alternate dirt palette. |
| `cement.png`   | 96x192  | 3 x 6 | CEMENT / PAVEMENT / SIDEWALK autotile — use for roads & sidewalks. 3x3 edge block. |
| `cementstair.png` | (sheet) | n/a | Cement steps for level edges. |
| `water.png`    | 96x192  | 3 x 6 | WATER autotile (animated-style frames + shore edges). |
| `watergrass.png`| 96x192 | 3 x 6 | Water↔grass shoreline transition. |
| `bridges.png`  | (sheet) | n/a | Wooden bridge pieces over water. |
| `country.png`  | 160x128 | 5 x 4 | FENCES (wood post-and-rail), small country props. Use for yard fences. |
| `signs.png`    | 96x64   | 3 x 2 | SIGN posts (6 signs) — repurpose as shop/place signage. |
| `treetop.png`  | 192x224 | 6 x 7 | TREE canopies (multiple tree tops, 2x2-ish each). Pair with trunk.png. |
| `trunk.png`    | 192x96  | 6 x 3 | TREE trunks (align under a treetop canopy). |
| `mountains.png`| (sheet) | n/a | Rocky cliff / mountain edges (map borders). |
| `rock.png`     | (sheet) | n/a | Boulders / rock props. |

### Named tile dictionary (what to wire up first)

| Name | File | Pick |
|------|------|------|
| `GROUND_GRASS`     | grass.png    | center fill tile (col 1, row 1 → index 4) |
| `GROUND_DIRT`      | dirt.png     | center fill tile (index 4) |
| `ROAD` / `SIDEWALK`| cement.png   | center fill tile (index 4) |
| `WATER`            | water.png    | center fill tile (index 4) |
| `SHORE`            | watergrass.png | edge tiles |
| `TREE` (2-tile)    | treetop.png + trunk.png | canopy tile over trunk tile |
| `FENCE`            | country.png  | rail/post tiles (top rows) |
| `SIGN`             | signs.png    | any of 6 sign tiles |

(“center fill tile = index 4” because every LPC 3x3 autotile block puts the solid
interior at col 1,row 1 of the first 3x3 group → `1*3 + 1 = 4`.)

---

## 4. BUILDINGS — `assets/external_v2/buildings/`

LPC buildings are **modular** (walls + roofs + doors + windows assembled on a grid),
NOT pre-rendered single images. Below is exactly what each atlas holds and how to
assemble each civic place the kid visits. All tiles 32px.

### 4a. Atlas files

| File | px (WxH) | cols x rows | Contents |
|------|----------|-------------|----------|
| `house.png`        | 288x224 | 9 x 7  | Generic cottage kit: wood/stone walls, doors, windows, thatch/tile roof pieces. Good for the kid's HOME. |
| `victoria.png`     | 352x160 | 11 x 5 | Larger 2-storey "Victorian" wall+roof set (taller facades). Good for SCHOOL / LIBRARY (bigger civic look). |
| `city_outside.png` | 768x576 | 24 x 18 | The main civic kit. Multiple recolored roofs (red, blue, white/blue with a CLOCK tower top), brick walls (red, gray, yellow, white), windows (brown/gray), DOORS, stone/brick pavement, MARKET BOOTH (mart stall), WELL, statues, obelisk, lamp posts, banners, flowerbeds. |
| `preview1/2/3.png` | varies  | n/a | Reference renders showing how city_outside pieces assemble into buildings. Open these in an image viewer before laying tiles. |

### 4b. city_outside.png region map (32px tile coords, col,row 0-based; index = row*24 + col)

Approximate functional regions (confirm visually against `preview*.png`):

- **Roofs** (top ~rows 0–6): red roof, blue/gray roof, white-and-blue roof, and a roof
  with a **clock tower top** — the clock makes a great SCHOOL or civic-hall marker.
- **Walls**: red brick, gray brick, yellow brick, white wall blocks (mid rows). A wall
  facade = a 2-wide x 2–3-tall block of wall tiles topped by a roof block.
- **Windows & doors**: window tiles and door tiles inserted into wall facades (mid rows).
- **Pavement**: blue-gray brick floor + stone floor bricks (some with water edge) — use
  as plaza / courtyard ground in front of civic buildings.
- **Props**: market booth (stall with goods), well, monk statues, obelisk, sun clock,
  lamp posts, banners, flowerbeds, boats.

### 4c. How to ASSEMBLE each required civic building

Each building = a footprint of WALL tiles (front facade) + ROOF tiles on top + a DOOR
tile centered + WINDOW tiles + a SIGN. Differentiate places by **roof color + sign +
prop**. Recommended minimum footprints (W x H in 32px tiles):

| Place | Footprint | Recipe |
|-------|-----------|--------|
| **HOME (house)** | 3 x 3 | `house.png` walls (rows 2–4) + thatch/tile roof (top rows) + door center-bottom. Cozy small cottage. |
| **SCHOOL** | 5 x 4 | `victoria.png` tall facade OR `city_outside` yellow/white brick walls + **clock-tower roof** from city_outside. Add a `signs.png` sign reading "School". Wide, symmetric, 2 storeys. |
| **HOSPITAL / CLINIC** | 4 x 4 | `city_outside` **white wall** + **white/blue roof** (clinical look) + door + a red-cross banner (recolor a `city_outside` banner red on white). Sign "Clinic". |
| **KINDERGARTEN / DAYCARE** | 4 x 3 | `house.png` walls + **red roof** (bright/friendly) + flowerbeds (city_outside) out front + playground props (see §6). Sign "Kindergarten". |
| **LIBRARY** | 4 x 4 | `victoria.png` tall facade + **blue/gray roof** + obelisk or statue (city_outside) beside entrance for a civic feel. Sign "Library". |
| **SHOP / MART** | 3 x 3 + booth | `city_outside` **MARKET BOOTH** as the storefront, OR a brick wall + door + the booth/awning in front. Sign "Mart". |

> Tip: build each building once in Tiled (or as a baked PNG) and reuse as a prefab.
> Distinctness comes from **roof color** (red=daycare, white/blue=clinic,
> clock=school, blue=library) + **sign text** + a signature **prop** (flowerbeds,
> red cross, statue, market booth).

### 4d. PLAYGROUND equipment (slide / swing)

NOT present as dedicated sprites in these two packs. Two options:
1. Improvise from `city_outside` + `country.png` props (a frame + ladder shape for a
   slide; posts + seat for a swing) — low fidelity.
2. **Recommended add-on** (CC-BY-SA, LPC-style, drop into `buildings/`):
   "[LPC] Playground" / "LPC park" assets on OpenGameArt
   — https://opengameart.org/art-search-advanced?keys=lpc+playground
   Record its credits if added. (Left out of the default download to avoid guessing a
   stale URL; add via the same `curl -L -o` pattern in `download.sh`.)

---

## 5. CHARACTERS — `assets/external_v2/characters/`

### 5a. Files

| File | px (WxH) | grid | Role |
|------|----------|------|------|
| `male_walkcycle.png`   | 576x256 | 9 cols x 4 rows, **64x64** frames | PLAYER (boy) base — 4-dir walk |
| `female_walkcycle.png` | 576x256 | 9 cols x 4 rows, 64x64 | PLAYER (girl) base / NPC kid |
| `soldier.png`          | 576x256 | 9 cols x 4 rows, 64x64 | NPC (dressed) — repurpose as DOCTOR/SHOPKEEPER/TEACHER via tint |
| `soldier_altcolor.png` | 576x256 | 9 cols x 4 rows, 64x64 | NPC alt color |
| `princess.png`         | 576x256 | 9 cols x 4 rows, 64x64 | NPC (dressed female) — teacher/mom |
| `male_pants.png`       | 576x256 | 9 cols x 4 rows, 64x64 | clothing overlay (layer ON TOP of male_walkcycle for a clothed boy) |
| `hairmale.png` / `hairfemale.png` | (sheet) | 64x64 frames | hair overlays (layer on top) |
| `slime.png`            | 96x128  | 3 cols x 4 rows, **32x32** | small creature (pet/decoration) — RPG-Maker 3-frame layout |
| `bat.png`              | (sheet) | 3 x 4, 32x32 | small creature |

> The base walkcycle sprites are **nude templates** — they are meant to be composited
> with `male_pants.png` + `hairmale.png` (draw pants, then hair, over the body frame).
> For a quick demo you can use `soldier.png` / `princess.png` which are already clothed.

### 5b. Walk-cycle frame spec (CONFIRMED by visual inspection)

`male_walkcycle.png` (and all 576x256 sheets):
- frameWidth = **64**, frameHeight = **64**
- **9 columns** (frame 0..8), **4 rows**
- **Row order (top→bottom): 0 = UP (north), 1 = LEFT (west), 2 = DOWN (south), 3 = RIGHT (east)**
- Column 0 = standing/contact pose; columns 0–8 form the walk cycle.
  - Common usage: idle = frame at `row*9 + 0`; walk loop = columns 1..8 (8 frames).
- Global frame index for (row, col): `index = row*9 + col`.
  - DOWN walk = indices 18..26 ; UP walk = 0..8 ; LEFT = 9..17 ; RIGHT = 27..35.

#### Phaser 3 config
```js
// preload
this.load.spritesheet('player', 'assets/external_v2/characters/male_walkcycle.png',
  { frameWidth: 64, frameHeight: 64 });

// create — directional walk anims (skip column 0 as idle, use 1..8)
const dir = { up: 0, left: 1, down: 2, right: 3 };       // row index
for (const [name, row] of Object.entries(dir)) {
  this.anims.create({
    key: 'walk_' + name,
    frames: this.anims.generateFrameNumbers('player',
      { start: row*9 + 1, end: row*9 + 8 }),
    frameRate: 8,
    repeat: -1
  });
  // idle = single frame row*9 + 0
}
// Tilemap is 32px but sprite frame is 64px: set origin so feet sit on the tile.
sprite.setOrigin(0.5, 0.75); // feet ~3/4 down the 64px box
```

#### Raw canvas drawImage (if not using Phaser tilemaps)
```js
// draw frame (col,row) of a 64px sheet at world (wx,wy) where (wx,wy)=top-left of a 32px tile
const FW = 64, FH = 64, COLS = 9;
ctx.drawImage(sheet, col*FW, row*FH, FW, FH, wx - 16, wy - 32, FW, FH);
// (-16,-32) centers the 64px frame over the 32px tile with feet on the tile.
```

### 5c. NPC roster suggestion (matches game's civic theme)

| NPC | Sheet | Note |
|-----|-------|------|
| Player kid | male_walkcycle (+ pants + hair) or female_walkcycle | |
| Teacher | princess.png | tint/recolor optional |
| Doctor | soldier_altcolor.png | white tint = clinic staff |
| Shopkeeper | soldier.png | apron tint |
| Other kids | female_walkcycle.png, scaled down | |

---

## 6. Quick-start wiring checklist for Phaser

1. Load terrain sheets from `tiles/` as 32px tilesets (`tileWidth/Height: 32`).
2. Load `buildings/house.png`, `buildings/victoria.png`, `buildings/city_outside.png`
   as 32px tilesets; build each civic building per §4c (bake to a prefab/PNG).
3. Load character sheets from `characters/` with `frameWidth: 64, frameHeight: 64`;
   create 4 directional anims per §5b.
4. Ship `CREDITS-lpc-base.txt` + `CREDITS-lpc-city.txt` and the attribution string (§0)
   in the game's credits screen.

---

## 7. Verified facts log (so the next dev doesn't re-guess)

- All terrain/building tiles measured: 32px grid, 0 margin/spacing (PNG IHDR widths all
  divisible by 32; e.g. grass 96x192, city_outside 768x576, house 288x224).
- All four 576x256 people sheets = 9x4 @ 64px (576/9=64, 256/4=64). Visually confirmed
  row order UP/LEFT/DOWN/RIGHT and col0 = idle pose.
- slime.png 96x128 = 3x4 @ 32px (RPG-Maker 3-frame-per-direction layout: middle col idle).
- Licenses read from shipped CREDITS files; LPC base terrain+characters additionally
  offered under OGA-BY 3.0 (simpler attribution) per Medicine Storm's 2022 note.
