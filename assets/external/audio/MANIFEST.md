# Audio Assets Manifest — Appa Go (Sokcho kids JRPG)

All files below are **downloaded and present** in this folder.
Every asset is **CC0 / Public Domain — no attribution required**.
(Attribution courtesy-credits are noted where the author appreciates them, but none are legally required.)

Base path: `assets/external/audio/`

---

## BGM (background music)

| File | Use in game | Source page | License |
|------|-------------|-------------|---------|
| `bgm/happy_adventure.mp3` | Light, cheerful loopable town/adventure theme. Good default exploration BGM for young kids. (624 KB) | https://opengameart.org/content/happy-adventure-loop (author: TinyWorlds) | **CC0** — no attribution required ("No need to credit me") |
| `bgm/town_theme.mp3` | Gentle seaside/town theme, loops. Calmer alternate BGM (e.g. library/lake area). (1.3 MB) | https://opengameart.org/content/town-theme-rpg (author: cynicmusic) | **CC0** — no attribution required (author courtesy credit: "cynicmusic.com pixelsphere.org") |

---

## SFX (sound effects)

| File | Use in game | Source page | License |
|------|-------------|-------------|---------|
| `sfx/waves_ocean.flac` | Waves / ocean ambience (beach). FLAC — see note below. (612 KB) | https://opengameart.org/content/beach-ocean-waves (author: jasinski, via qubodup; from freesound.org) | **CC0** |
| `sfx/seagull.wav` | Seagull call (beach). (672 KB) | https://opengameart.org/content/solo-seagull-sound-effects (author: Rango Mango) | **CC0** — "No credit required" |
| `sfx/market_crowd.ogg` | Market / crowd ambience (traditional market scene). (328 KB) | https://opengameart.org/content/crowd-shoutingspeaking-ambience (author: StarNinjas) | **CC0** |
| `sfx/page_turn.ogg` | Page turn / quiet paper sound (library). (25 KB) | https://opengameart.org/content/100-cc0-sfx (file `paper_01.ogg`, author: rubberduck) | **CC0** |
| `sfx/water_lake.ogg` | Water / lake ambience (small splash). (27 KB) | https://opengameart.org/content/100-cc0-sfx (file `splash_01.ogg`, author: rubberduck) | **CC0** |
| `sfx/sparkle_item.ogg` | Item-get / sparkle for treasure-piece reward (gem chime). (14 KB) | https://opengameart.org/content/80-cc0-rpg-sfx (file `item_gem_01.ogg`, author: rubberduck) | **CC0** |
| `sfx/item_get_coin.ogg` | Alternate item-get (coin pickup). (19 KB) | https://opengameart.org/content/80-cc0-rpg-sfx (file `item_coins_01.ogg`, author: rubberduck) | **CC0** |
| `sfx/success_levelup.ogg` | Success / level-up jingle (quest complete). (36 KB) | https://opengameart.org/content/win-jingle (file `winfretless.ogg`, author: Fupi) | **CC0** |
| `sfx/ui_pop.ogg` | Soft UI "pop" / notification (NPC appears). (14 KB) | https://opengameart.org/content/100-cc0-sfx (file `plop_01.ogg`, author: rubberduck) | **CC0** |

---

## Notes for integration

- **Format mix:** Browsers (HTML5 `<audio>`) play `.mp3`, `.ogg`, and `.wav` natively. All chosen files are web-playable as-is.
- **`waves_ocean.flac`:** FLAC has good but not universal browser support (Chrome/Firefox/Edge: yes; older Safari: limited). If you want maximum compatibility, transcode to ogg/mp3 with `ffmpeg -i waves_ocean.flac waves_ocean.ogg`. It was the best CC0 beach-waves source available.
- **Looping:** `happy_adventure.mp3` and `town_theme.mp3` are designed to loop. For ambiences (`waves_ocean`, `market_crowd`, `water_lake`) use `loop` on the audio element; they loop acceptably though not click-perfectly.
- **`market_crowd.ogg`** is a general human-crowd chatter/shout ambience — keep its volume low under the BGM so it reads as a gentle market murmur for young kids.
- No file requires attribution. If you wish to add a courtesy credits screen anyway, suggested lines: TinyWorlds, cynicmusic (pixelsphere.org), jasinski, Rango Mango, StarNinjas, rubberduck, Fupi — all via OpenGameArt.org (CC0).

## Optional / not downloaded (alternates available via download.sh)

- A gentler, non-shouting **market ambience** from Pixabay could replace `market_crowd.ogg` if desired; Pixabay direct CDN URLs require resolving through the site/login, so it was not auto-downloaded. See `download.sh` header for guidance.
- Source SFX packs (`100-cc0-sfx`, `80-cc0-rpg-sfx`, WobbleBoxx `SoundPack01`) contain many more CC0 variants if you want different coin/sparkle/level-up flavors.
