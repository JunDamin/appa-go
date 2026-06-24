/* ============================================================
   아빠, Go! — 오디오 (CC0, 출처표기 불필요)
   BGM 1곡 루프 + 상황별 SFX. DOM/Phaser 어느 쪽에서든 호출 가능.
   ============================================================ */
window.AUDIO = (function () {
  "use strict";
  const base = "assets/external/audio/";
  const SFX = {
    reward: "sfx/sparkle_item.ogg",
    success: "sfx/success_levelup.ogg",
    pop: "sfx/ui_pop.ogg",
    coin: "sfx/item_get_coin.ogg",
    seagull: "sfx/seagull.wav",
    page: "sfx/page_turn.ogg",
  };
  const cache = {};
  function el(path) { if (!cache[path]) cache[path] = new Audio(base + path); return cache[path]; }

  let bgmEl = null;
  return {
    play(name) {
      const p = SFX[name]; if (!p) return false;
      try { const a = el(p); a.currentTime = 0; a.volume = 0.55; a.play().catch(() => {}); } catch (e) {}
      return true;
    },
    bgm(file) {
      try {
        if (bgmEl) { bgmEl.pause(); }
        bgmEl = new Audio(base + "bgm/" + (file || "happy_adventure.mp3"));
        bgmEl.loop = true; bgmEl.volume = 0.3; bgmEl.play().catch(() => {});
      } catch (e) {}
    },
    stopBgm() { if (bgmEl) { bgmEl.pause(); bgmEl = null; } },
  };
})();
