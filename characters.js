/* ============================================================
   아빠, Go! — 캐릭터 런타임 (캐릭터·인터랙션 세션 소유)
   window.CHARACTERS 계약 구현. game.js / ui.js 는 이 API만 호출한다.

   - 일러스트 토큰 NPC(¾뷰) + bob/flip/그림자 (4방향 걷기 시트 없음, 화풍 일치용)
   - 앰비언트 주민의 루틴 이동(대항해시대2式)
   - 인상(친근감) 시스템: 낯섦→인사→대화→친해짐 (localStorage 영속)
   - 포트레이트(대화창 DOM, ui.js 소비) + 이스터에그
   - 에셋(assets/characters/*.png)이 없어도 emoji 폴백으로 동작
   로드 순서(index.html): phaser → data/places.js → data/characters.js
                          → audio.js → characters.js → ui.js → game.js
   ============================================================ */
window.CHARACTERS = (function () {
  "use strict";

  const D = globalThis.CHARACTERS_DATA || { STAGES: [], CAST: [], AMBIENT: [], EASTER_EGGS: {} };
  const byId = {};
  D.CAST.forEach((c) => (byId[c.id] = c));
  const ambById = {};
  (D.AMBIENT || []).forEach((a) => (ambById[a.id] = a));
  const byPlace = {};
  D.CAST.forEach((c) => { if (c.placeId) byPlace[c.placeId] = c; });

  const TOKEN_DIR = "assets/characters/";
  const LS_IMP = "appago.impression.v1";
  const LS_EGG = "appago.easteregg.v1";

  /* ---------- 영속 상태 ---------- */
  function load(key) { try { return JSON.parse(localStorage.getItem(key) || "{}"); } catch { return {}; } }
  function save(key, v) { try { localStorage.setItem(key, JSON.stringify(v)); } catch {} }
  let impState = load(LS_IMP);   // { id: stage(0..3) }
  let eggState = load(LS_EGG);   // { eggId: true }
  const listeners = [];

  /* ---------- 에셋 경로 ---------- */
  function tokenKey(id) { return "char_" + id; }
  function tokenPath(id) { return TOKEN_DIR + id + "_token.png"; }
  function portraitPath(id, expr) {
    return expr ? TOKEN_DIR + id + "_" + expr + ".png" : TOKEN_DIR + id + "_portrait.png";
  }
  function emojiOf(id) { return (byId[id] && byId[id].emoji) || (ambById[id] && ambById[id].emoji) || "🙂"; }

  /* ---------- Phaser: 프리로드 ----------
     game.js Boot.preload 에서 CHARACTERS.preload(this) 1회 호출.
     파일이 없으면 Phaser loaderror 가 나도 무시하고 emoji 폴백. */
  function preload(scene) {
    if (!scene || !scene.load) return;
    scene.load.on("loaderror", () => {}); // 누락 토큰은 조용히 무시
    D.CAST.forEach((c) => scene.load.image(tokenKey(c.id), tokenPath(c.id)));
    (D.AMBIENT || []).forEach((a) => scene.load.image(tokenKey(a.id), tokenPath(a.id)));
  }

  function hasTexture(scene, id) {
    return !!(scene.textures && scene.textures.exists(tokenKey(id)));
  }

  /* ---------- Phaser: 토큰 스프라이트 생성 (그림자+bob+flip) ---------- */
  function makeToken(scene, id, x, y, opts) {
    opts = opts || {};
    const h = opts.height || 36;
    const shadow = scene.add.ellipse(x, y + h * 0.42, h * 0.7, h * 0.22, 0x000000, 0.18).setDepth(y - 1);
    let node;
    if (hasTexture(scene, id)) {
      node = scene.add.image(x, y, tokenKey(id)).setOrigin(0.5, 0.92);
      node.displayHeight = h; node.scaleX = node.scaleY; // 비율 유지
    } else {
      node = scene.add.text(x, y, emojiOf(id), { fontSize: Math.round(h * 0.7) + "px" }).setOrigin(0.5, 0.92);
    }
    node.setDepth(y);
    // 정지 토큰만 bob(위아래 흔들). 이동 토큰(walk/wander/roam)은 bob:false — y-트윈 충돌 방지.
    const bob = opts.bob === false ? null
      : scene.tweens.add({ targets: node, y: y - 3, duration: 680 + (x % 200), yoyo: true, repeat: -1, ease: "Sine.inOut" });
    return {
      node, shadow, baseY: y,
      setFlip(left) { if (node.setFlipX) node.setFlipX(!!left); },
      moveTo(nx, ny) { node.x = nx; shadow.x = nx; node.setDepth(ny); shadow.setDepth(ny - 1); if (bob) bob.updateTo("y", ny - 3, true); },
      destroy() { if (bob) bob.remove(); node.destroy(); shadow.destroy(); },
    };
  }

  /* ---------- 계약: 퀘스트 NPC ---------- */
  function makeNPC(scene, o) {
    o = o || {};
    const t = makeToken(scene, o.id, o.x, o.y, { height: o.height || 38 });
    if (o.flip != null) t.setFlip(o.flip);
    return t;
  }

  /* ---------- 계약: 앰비언트 루틴 이동 ----------
     opts.waypoints: { regionKey: {x,y} }  (game.js가 맵 좌표로 제공)
     opts.timeOfDay: "morning" | "day" | "evening"
     opts.max: 동시 인원 상한(기본 5). 충돌 없음·대사 없음(탭 시 flavor). */
  function spawnAmbient(scene, opts) {
    opts = opts || {};
    const wp = opts.waypoints || {};
    const tod = opts.timeOfDay || "day";
    const max = opts.max != null ? opts.max : 5;
    const speed = opts.speed || 28; // px/s
    const spawned = [];
    for (const a of (D.AMBIENT || [])) {
      if (spawned.length >= max) break;
      const route = (a.routine && a.routine[tod]) || [];
      const pts = route.map((k) => wp[k]).filter(Boolean);
      if (!pts.length) continue;
      const start = pts[0];
      const tok = makeToken(scene, a.id, start.x, start.y, { height: opts.height || 30, bob: false });
      if (a.flavor && tok.node.setInteractive) {
        tok.node.setInteractive({ useHandCursor: true });
        tok.node.on("pointerdown", () => showFlavor(scene, tok, a.flavor));
      }
      walkRoute(scene, tok, pts, speed);
      spawned.push(tok);
    }
    return spawned;
  }

  // 웨이포인트를 따라 왕복 이동(멈춤 포함), 끝나면 역순 반복. flip은 진행 방향.
  function walkRoute(scene, tok, pts, speed) {
    let i = 0, dir = 1;
    const step = () => {
      if (!tok.node || !tok.node.scene) return;
      const next = pts[i + dir];
      if (!next) { dir *= -1; scene.time.delayedCall(800, step); return; }
      const cur = { x: tok.node.x, y: tok.node.y };
      const dist = Math.hypot(next.x - cur.x, next.y - cur.y) || 1;
      tok.setFlip(next.x < cur.x);
      scene.tweens.add({
        targets: tok.node, x: next.x, y: next.y, duration: (dist / speed) * 1000, ease: "Linear",
        onUpdate: () => { tok.shadow.x = tok.node.x; tok.shadow.y = tok.node.y + 12; tok.node.setDepth(tok.node.y); },
        onComplete: () => { i += dir; scene.time.delayedCall(400 + (i * 90) % 600, step); },
      });
    };
    step();
  }

  function showFlavor(scene, tok, text) {
    const b = scene.add.text(tok.node.x, tok.node.y - 26, text,
      { fontFamily: "Galmuri11, sans-serif", fontSize: "8px", color: "#fff", backgroundColor: "#1b2a4a", padding: { x: 4, y: 2 } })
      .setOrigin(0.5, 1).setDepth(99999);
    scene.tweens.add({ targets: b, y: b.y - 6, alpha: 0, duration: 1600, ease: "Sine.inOut", onComplete: () => b.destroy() });
  }

  /* ---------- 계약: 군중 스폰 (장소마다 여러 명) ----------
     opts.placeId, opts.center={x,y}, opts.radius, opts.onLead(tok) (대표 인물 상호작용 연결).
     lead = 상호작용 인물(makeToken), extras = 주변에 서성이는 사람들(가벼운 idle wander). */
  function spawnCrowd(scene, opts) {
    opts = opts || {};
    const crowd = (D.CROWD || {})[opts.placeId];
    if (!crowd) return [];
    const c = opts.center || { x: 0, y: 0 };
    const R = opts.radius || 42;
    const out = [];
    const lead = makeToken(scene, crowd.lead, c.x, c.y, { height: opts.height || 38 });
    if (typeof opts.onLead === "function") opts.onLead(lead, crowd.lead);
    out.push({ id: crowd.lead, tok: lead, lead: true });
    (crowd.extras || []).forEach((id, i) => {
      const ang = (Math.PI * 2 * (i + 1)) / ((crowd.extras.length) + 1);
      const ex = c.x + Math.cos(ang) * R, ey = c.y + Math.sin(ang) * R * 0.55;
      const t = makeToken(scene, id, ex, ey, { height: opts.height || 30, bob: false });
      idleWander(scene, t, ex, ey, 14);
      const a = ambById[id];
      if (a && a.flavor && t.node.setInteractive) {
        t.node.setInteractive({ useHandCursor: true });
        t.node.on("pointerdown", () => showFlavor(scene, t, a.flavor));
      }
      out.push({ id, tok: t, lead: false });
    });
    return out;
  }

  // 제자리 근처에서 천천히 서성임(군중 생동감).
  function idleWander(scene, tok, cx, cy, r) {
    const hop = () => {
      if (!tok.node || !tok.node.scene) return;
      const nx = cx + (Math.random() * 2 - 1) * r, ny = cy + (Math.random() * 2 - 1) * r * 0.5;
      tok.setFlip(nx < tok.node.x);
      scene.tweens.add({
        targets: tok.node, x: nx, y: ny, duration: 1100 + Math.random() * 900, ease: "Sine.inOut",
        onUpdate: () => { tok.shadow.x = tok.node.x; tok.shadow.y = tok.node.y + 12; tok.node.setDepth(tok.node.y); },
        onComplete: () => scene.time.delayedCall(600 + Math.random() * 1200, hop),
      });
    };
    hop();
  }

  /* ---------- 계약: 도착 환영 ----------
     spawnCrowd 결과(crowd[])를 받아, 사람들이 인사 말풍선 + 통통 튀며 반겨준다.
     game.js가 장소 도착(또는 군중 스폰 직후) 시 호출:
       const crowd = CHARACTERS.spawnCrowd(scene,{placeId,center});
       CHARACTERS.welcomeCrowd(scene, crowd, placeId); */
  function welcomeLines(placeId) { return (D.WELCOME && D.WELCOME[placeId]) || []; }
  function welcomeCrowd(scene, crowd, placeId) {
    if (!crowd || !crowd.length) return;
    const lines = welcomeLines(placeId);
    crowd.forEach((m, i) => {
      scene.time.delayedCall(i * 240, () => {
        if (!m.tok || !m.tok.node || !m.tok.node.scene) return;
        bouncePop(scene, m.tok);
        showFlavor(scene, m.tok, lines.length ? lines[i % lines.length] : "환영해!");
      });
    });
  }
  // 환영 점프(스케일 펄스 — bob의 y트윈과 충돌하지 않고 flip 부호 보존)
  function bouncePop(scene, tok) {
    if (!tok || !tok.node) return;
    const sx = tok.node.scaleX, sy = tok.node.scaleY;
    scene.tweens.add({ targets: tok.node, scaleX: sx * 1.15, scaleY: sy * 1.15, duration: 150, yoyo: true, repeat: 1, ease: "Quad.out" });
  }

  /* ---------- 계약: 월드맵 생활 요소 ----------
     날아다니는 새(하늘) + 자유 배회 동물(땅). game.js가 월드맵 진입 시 호출:
       CHARACTERS.spawnWorldLife(scene, { width: W, height: H }); */
  function spawnBirds(scene, opts) {
    opts = opts || {};
    const W = opts.width || 800, H = opts.height || 600;
    const spec = (D.WILDLIFE && D.WILDLIFE.birds) || { id: "amb_bird", emoji: "🐦", count: 3 };
    const n = opts.count || spec.count || 3;
    const out = [];
    for (let i = 0; i < n; i++) {
      let node;
      if (hasTexture(scene, spec.id)) { node = scene.add.image(0, 0, tokenKey(spec.id)); node.displayHeight = 18; node.scaleX = Math.abs(node.scaleY); }
      else node = scene.add.text(0, 0, spec.emoji || "🐦", { fontSize: "16px" });
      node.setOrigin(0.5).setDepth(900000); // 항상 건물 위(하늘)
      flyAcross(scene, node, W, H, i);
      out.push(node);
    }
    return out;
  }
  function flyAcross(scene, node, W, H, seed) {
    if (!node || !node.scene) return;
    const dir = Math.random() < 0.5 ? 1 : -1;
    const y0 = 24 + Math.random() * H * 0.35;          // 화면 상단(하늘)
    node.x = dir > 0 ? -24 : W + 24; node.y = y0;
    if (node.setFlipX) node.setFlipX(dir < 0);
    scene.tweens.add({
      targets: node, x: dir > 0 ? W + 24 : -24, duration: 9000 + Math.random() * 7000, ease: "Linear",
      onUpdate: () => { node.y = y0 + Math.sin((node.x + seed * 50) / 55) * 8; }, // 물결치듯 비행
      onComplete: () => scene.time.delayedCall(400 + Math.random() * 3500, () => flyAcross(scene, node, W, H, seed)),
    });
  }
  function spawnRoamers(scene, opts) {
    opts = opts || {};
    const W = opts.width || 800, H = opts.height || 600;
    const list = (D.WILDLIFE && D.WILDLIFE.roamers) || [];
    const n = opts.count != null ? opts.count : Math.min(2, list.length || 0);
    const b = { minX: 40, maxX: W - 40, minY: H * 0.35, maxY: H - 40 };
    const out = [];
    for (let i = 0; i < n; i++) {
      const r = list[i % Math.max(1, list.length)] || { id: "amb_dog" };
      const x = b.minX + Math.random() * (b.maxX - b.minX), y = b.minY + Math.random() * (b.maxY - b.minY);
      const tok = makeToken(scene, r.id, x, y, { height: opts.height || 22, bob: false });
      freeRoam(scene, tok, b, opts.speed || 26);
      out.push(tok);
    }
    return out;
  }
  function freeRoam(scene, tok, b, speed) {
    const go = () => {
      if (!tok.node || !tok.node.scene) return;
      const nx = b.minX + Math.random() * (b.maxX - b.minX), ny = b.minY + Math.random() * (b.maxY - b.minY);
      const d = Math.hypot(nx - tok.node.x, ny - tok.node.y) || 1;
      tok.setFlip(nx < tok.node.x);
      scene.tweens.add({
        targets: tok.node, x: nx, y: ny, duration: (d / speed) * 1000, ease: "Sine.inOut",
        onUpdate: () => { tok.shadow.x = tok.node.x; tok.shadow.y = tok.node.y + 10; tok.node.setDepth(tok.node.y); },
        onComplete: () => scene.time.delayedCall(700 + Math.random() * 2200, go),
      });
    };
    go();
  }
  // 한 번에: 나는 새 + 배회 동물 (+ 옵션으로 routine 사람)
  function spawnWorldLife(scene, opts) {
    opts = opts || {};
    const birds = spawnBirds(scene, opts);
    const roamers = spawnRoamers(scene, opts);
    let people = [];
    if (opts.waypoints) people = spawnAmbient(scene, opts);
    return { birds, roamers, people };
  }

  /* ---------- 계약: 포트레이트 (ui.js DOM) ----------
     { src, emoji } 반환. ui.js 는 <img src> 로 시도하고 onerror 시 emoji 폴백. */
  function portrait(id, expr) {
    const ch = byId[id];
    const e = (expr && ch && ch.expressions && ch.expressions.indexOf(expr) >= 0) ? expr : null;
    return { src: portraitPath(id, e), emoji: emojiOf(id) };
  }

  /* ---------- 계약: 인상(친근감) 시스템 ---------- */
  function impressionStage(id) { return Math.max(0, Math.min(3, impState[id] || 0)); }
  function impressionLine(id) {
    const ch = byId[id]; if (!ch || !ch.impression) return null;
    return ch.impression.lines[impressionStage(id)] || null;
  }
  function impressionLabel(id) { return D.STAGES[impressionStage(id)] || ""; }
  function impressionIcon(id) { return ["❓", "🙂", "😊", "💛"][impressionStage(id)] || "🙂"; }
  function advanceImpression(id) {
    const ch = byId[id]; if (!ch || !ch.impression) return impressionStage(id);
    const next = Math.min(3, impressionStage(id) + 1);
    if (next !== impState[id]) {
      impState[id] = next; save(LS_IMP, impState);
      listeners.forEach((cb) => { try { cb(id, next); } catch {} });
    }
    return next;
  }
  function impressionCard(id) {
    const ch = byId[id];
    return (ch && ch.impression && impressionStage(id) >= 3) ? ch.impression.card : null;
  }
  function onImpressionChange(cb) { if (typeof cb === "function") listeners.push(cb); }
  function resetImpressions() { impState = {}; save(LS_IMP, impState); }

  // 모든 인물이 친해짐인가(정착 완료 메시지용)
  function allFriends() {
    return D.CAST.filter((c) => c.impression).every((c) => impressionStage(c.id) >= 3);
  }

  /* ---------- 계약: 이스터에그 ---------- */
  function easterEgg(id) {
    const ch = byId[id]; if (!ch || !ch.easterEgg) return null;
    const egg = D.EASTER_EGGS[ch.easterEgg]; if (!egg) return null;
    if (egg.once && eggState[ch.easterEgg]) return null;
    // 친해짐 단계에서만 노출
    if (ch.impression && impressionStage(id) < 3) return null;
    eggState[ch.easterEgg] = true; save(LS_EGG, eggState);
    return egg.line;
  }

  /* ---------- 조회 헬퍼 ---------- */
  function get(id) { return byId[id] || ambById[id] || null; }
  function realFact(id) { const c = byId[id]; return c ? c.realFact : null; }
  // 장소(places.js id) → 그 장소의 인물. ui.js가 장소 이벤트에서 대사/포트레이트/인상 연결에 사용.
  function forPlace(placeId) { return byPlace[placeId] || null; }
  function idForPlace(placeId) { const c = byPlace[placeId]; return c ? c.id : null; }
  // 선택지 대화(속초 소개·생활 안내). ui.js가 q를 버튼으로 렌더, 고르면 a 표시.
  function topics(id) { return (D.TOPICS && D.TOPICS[id]) || []; }
  function topicsForPlace(placeId) { return topics(idForPlace(placeId)); }
  function crowdFor(placeId) { return (D.CROWD && D.CROWD[placeId]) || null; }

  return {
    // 에셋
    preload, tokenKey, tokenPath, portrait, emojiOf,
    // 월드 토큰
    makeNPC, spawnAmbient, spawnCrowd, welcomeCrowd, welcomeLines,
    // 월드맵 생활(새·동물)
    spawnWorldLife, spawnBirds, spawnRoamers,
    // 선택지 대화
    topics, topicsForPlace, crowdFor,
    // 인상
    impressionStage, impressionLine, impressionLabel, impressionIcon,
    advanceImpression, impressionCard, onImpressionChange, resetImpressions, allFriends,
    // 장소 연결
    forPlace, idForPlace,
    // 기타
    easterEgg, realFact, get,
    data: D,
  };
})();
