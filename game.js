/* ============================================================
   아빠, Go! — 속초 데모 (Phaser 3)
   - Kenney Tiny Town 타일셋 + CC0 4방향 걷기 스프라이트 (실제 에셋)
   - 카메라 줌 추적, 월드(항해)↔장소(항구) 씬 페이드 전환
   - DOM 조이스틱 + 키보드, 타일 충돌, 흔들리는 나무, BGM/SFX
   - NPC 근접 → UI.startExperience (대사→사진미션→퀘스트→보물조각)
   ============================================================ */
(function () {
  "use strict";
  const PLACES = globalThis.PLACES || [];
  const byId = {}; PLACES.forEach((p) => (byId[p.id] = p));
  const INTERIORS = globalThis.INTERIORS || {};
  // 내부 NPC = 실제 캐릭터 스프라이트(투명 standee, assets/characters/<key>.png). 이모지 폴백.
  // school/mart는 전용 에셋이 없어 가까운 인물 재사용(담임=librarian, 마트=dad). 추후 전용 생성 가능.
  const NPC_SPRITE = { library: "librarian", playground: "friend", market: "market_aunt", lake: "grandpa", beach: "gull", school: "teacher", mart: "mart_keeper", daycare: "daycare_teacher" };

  const TS = 32;          // LPC 타일 크기
  const ZOOM = 2.2;       // 카메라 줌
  const SPEED = 112;

  // 합성 tileset 인덱스: 0=grass,1=water,2=dirt(sand),3=cement(road)
  const T = {
    grass: [0], sand: 2, road: 3, water: 1, waterAlt: 1, tree: 0, house: 9,
  };
  const pick = (arr, x, y) => arr[Math.abs((x * 7 + y * 13)) % arr.length];

  /* ============================================================
     맵 정의
     ============================================================ */
  // 월드맵 = OpenAI 생성 일러스트 지도(이미지). 장소 좌표는 지도에서 눈으로 확정(픽셀 비율).
  const WORLD_W = 1536, WORLD_H = 1024;
  const WL = (fx, fy) => ({ x: Math.round(fx * WORLD_W), y: Math.round(fy * WORLD_H) });
  const WORLD_LOC = {
    school: WL(0.43, 0.20),      // 시계탑 학교
    library: WL(0.69, 0.21),     // 우상단 집(도서관)
    playground: WL(0.66, 0.45),  // 미끄럼틀 놀이터
    market: WL(0.25, 0.72),      // 좌하단 2층 상가(시장)
    mart: WL(0.52, 0.73),        // 중하단 초록차양 가게(마트)
    lake: WL(0.75, 0.78),        // 우하단 연못(청초호)
    beach: WL(0.93, 0.50),       // 우측 바다
  };
  const WORLD_HOME = WL(0.20, 0.22); // 좌상단 우리 집

  // 충돌 박스(이동 불가): 건물·물. 비율(cx,cy,w,h)→픽셀. 지도를 보고 footprint 추정.
  const SB = (cxf, cyf, wf, hf) => ({ x: Math.round((cxf - wf / 2) * WORLD_W), y: Math.round((cyf - hf / 2) * WORLD_H), w: Math.round(wf * WORLD_W), h: Math.round(hf * WORLD_H) });
  // 충돌 박스는 일러스트의 실제 건물 footprint에만 맞춰 타이트하게 — 주변 도로는 통행 가능해야 함.
  // (박스를 줄이면 충돌만 줄어드므로 "도로 막힘" 버그를 안전하게 해소. 건물 가장자리 살짝 밟힘은 무해)
  const WORLD_SOLIDS = [
    SB(0.145, 0.185, 0.095, 0.11), // 우리 집
    SB(0.44, 0.175, 0.15, 0.15),   // 학교(시계탑)
    SB(0.68, 0.175, 0.10, 0.12),   // 도서관(우상단 집)
    SB(0.105, 0.565, 0.10, 0.09),  // 좌측 창고
    SB(0.242, 0.715, 0.10, 0.15),  // 시장 상가
    SB(0.512, 0.715, 0.11, 0.14),  // 마트
    SB(0.745, 0.795, 0.14, 0.12),  // 연못(청초호)
    SB(0.965, 0.5, 0.06, 1.0),     // 동해 바다(우측 띠)
  ];

  function worldDef() {
    // 트리거 존은 건물 충돌박스보다 확실히 커야 함 — 안 그러면 플레이어가 존에 닿으려면
    // 건물(solid) 안에 들어가야 해서 진입 불가(학교 등이 안 열리던 원인). 도로에서 트리거되게 넉넉히.
    const portals = PLACES.filter((p) => WORLD_LOC[p.id]).map((p) => {
      const big = (p.id === "lake" || p.id === "beach") ? 300 : 280;
      return { px: WORLD_LOC[p.id].x, py: WORLD_LOC[p.id].y, to: "p_" + p.id, label: p.name, placeId: p.id, zone: big };
    });
    return {
      id: "world", name: "속초 우리 동네", image: "worldmap", imgW: WORLD_W, imgH: WORLD_H,
      spawn: { x: WORLD_HOME.x, y: WORLD_HOME.y + 150 }, home: WORLD_HOME, portals, solids: WORLD_SOLIDS,
    };
  }

  function placeDef(place) {
    // ===== 이미지-백드롭 내부 분기 =====
    const ic = INTERIORS[place.id];
    if (ic) {
      const wl = WORLD_LOC[place.id] || WORLD_HOME;
      const fromWorld = { x: wl.x, y: wl.y + 85 }; // 월드 복귀 위치(픽셀)
      const portals = [{ to: "world", spawn: fromWorld, back: true, label: "동네로" }];
      return { id: "p_" + place.id, name: place.name, interior: true, ic, npc: place, portals };
    }

    const cols = 18, rows = 16, theme = place.theme;
    const paved = theme === "market" || theme === "mart";
    const data = [];
    for (let y = 0; y < rows; y++) {
      const row = [];
      for (let x = 0; x < cols; x++) {
        let t = paved ? T.road : pick(T.grass, x, y);
        if (theme === "playground" && x >= 12 && y <= 3) t = T.water; // 청초호 한켠
        if (x === 0 || y === 0 || x === cols - 1 || y === rows - 1) t = T.sand; // 테두리 길
        row.push(t);
      }
      data.push(row);
    }
    const trees = [];
    if (theme === "school" || theme === "library" || theme === "daycare") { trees.push({ x: 2, y: 2 }, { x: 15, y: 2 }); }
    if (theme === "playground") { trees.push({ x: 2, y: 13 }, { x: 15, y: 13 }); }
    if (theme === "market" || theme === "mart") { trees.push({ x: 1, y: 1 }, { x: 16, y: 1 }); }

    const spawn = { x: 9, y: 13 }, npcCell = { x: 9, y: 5 };
    const wl = WORLD_LOC[place.id] || WORLD_HOME;
    const fromWorld = { x: wl.x, y: wl.y + 85 }; // 월드 복귀 위치(픽셀)
    const portals = [{ x: 9, y: rows - 1, to: "world", spawn: fromWorld, back: true, label: "동네로" }];
    return {
      id: "p_" + place.id, name: place.name, cols, rows, data, trees,
      buildings: [], portals, ships: theme === "playground" ? [{ x: 14, y: 1 }] : [],
      spawn, npc: place, npcCell, collide: [T.water, T.waterAlt],
    };
  }

  const defs = {};
  function getDef(id) {
    if (defs[id]) return defs[id];
    let d = id === "world" ? worldDef() : placeDef(byId[id.slice(2)]);
    defs[id] = d; return d;
  }

  // 건물 그리기 (지붕+벽+문). color = 장소 색상 hex
  function addBuilding(scene, cx, cy, colorHex) {
    const roof = Phaser.Display.Color.HexStringToColor(colorHex).color;
    const g = scene.add.graphics().setDepth(cy);
    const w = 50, h = 38, x = cx - w / 2, top = cy - h / 2 - 8;
    g.fillStyle(0x000000, 0.18); g.fillEllipse(cx, cy + h / 2, w, 12);
    g.fillStyle(0xf3ead2, 1); g.fillRect(x, top + 16, w, h);                 // 벽
    g.lineStyle(2, 0x000000, 0.08); g.strokeRect(x, top + 16, w, h);
    g.fillStyle(roof, 1);                                                    // 지붕
    g.fillTriangle(x - 5, top + 18, x + w + 5, top + 18, cx, top - 6);
    g.fillStyle(0x6b4a2a, 1); g.fillRect(cx - 8, top + 16 + h - 16, 16, 16); // 문
    g.fillStyle(0xffe08a, 1); g.fillRect(cx + 3, top + 16 + h - 9, 2, 2);    // 손잡이
    g.fillStyle(0x9fd0e6, 1); g.fillRect(x + 6, top + 22, 9, 9); g.fillRect(x + w - 15, top + 22, 9, 9); // 창문
  }

  /* ============================================================
     Boot Scene
     ============================================================ */
  class Boot extends Phaser.Scene {
    constructor() { super("Boot"); }
    preload() {
      ["grass", "water", "dirt", "cement", "treetop"].forEach((k) =>
        this.load.spritesheet(k, `assets/external_v2/tiles/${k}.png`, { frameWidth: 32, frameHeight: 32 }));
      this.load.spritesheet("player", "assets/external_v2/characters/princess.png", { frameWidth: 64, frameHeight: 64 });
      this.load.image("worldmap", "assets/world/sokcho_map.png");
      // 건물 내부 = 이미지 백드롭(데이터 INTERIORS) 온디맨드 로드. 타일 조립 폐기로 urban 시트 불필요.
      // 내부 NPC 캐릭터 standee (장소별). 누락 시 createInterior가 이모지로 폴백.
      Object.entries(NPC_SPRITE).forEach(([id, key]) => this.load.image("npc-" + id, "assets/characters/" + key + "_token.png"));
      if (window.CHARACTERS && CHARACTERS.preload) CHARACTERS.preload(this); // 캐릭터 토큰 일괄 로드(누락은 무시)
    }
    create() {
      // LPC 지형 PNG의 중앙 채움 타일(인덱스4)을 모아 합성 tileset 생성
      const cv = this.textures.createCanvas("tileset", 32 * 4, 32);
      const c = cv.getContext();
      const blit = (key, dx) => { const img = this.textures.get(key).getSourceImage(); c.drawImage(img, 32, 32, 32, 32, dx, 0, 32, 32); };
      blit("grass", 0); blit("water", 32); blit("dirt", 64); blit("cement", 96);
      cv.refresh();
      // LPC 4방향 걷기 애니메이션 (9열×4행, 행순서 0=Up,1=Left,2=Down,3=Right, col0=idle)
      const A = (key, row) => this.anims.create({ key, frames: this.anims.generateFrameNumbers("player", { start: row * 9 + 1, end: row * 9 + 8 }), frameRate: 10, repeat: -1 });
      A("walk-up", 0); A("walk-left", 1); A("walk-down", 2); A("walk-right", 3);
      // 나무 텍스처 생성 (흔들림용)
      const tg = this.add.graphics();
      tg.fillStyle(0x000000, 0.15); tg.fillEllipse(18, 38, 22, 7);
      tg.fillStyle(0x6b4a2a, 1); tg.fillRect(15, 22, 6, 14);
      tg.fillStyle(0x2f7d44, 1); tg.fillCircle(18, 15, 15);
      tg.fillStyle(0x49a85f, 1); tg.fillCircle(13, 11, 9);
      tg.generateTexture("tree", 40, 42); tg.destroy();
      this.scene.start("Explore", { mapId: "world", spawn: null });
    }
  }

  /* ============================================================
     Explore Scene (월드 + 장소 공용)
     ============================================================ */
  class Explore extends Phaser.Scene {
    constructor() { super("Explore"); }
    init(data) { this.mapId = data.mapId || "world"; this.spawnOverride = data.spawn; }

    create() {
      // 씬 재시작(scene.restart) 시 같은 인스턴스가 재사용되므로, 이전 맵의 파괴된
      // player/cursors/floorBounds 참조를 반드시 초기화한다. (내부맵은 비동기로 player를
      // 만들기 때문에, 리셋하지 않으면 update()가 파괴된 스프라이트를 건드려 크래시→검은화면.)
      this.player = null; this.cursors = null; this.floorBounds = null; this.npcXY = null; this.portals = [];
      const def = getDef(this.mapId);
      this.def = def;
      this.busy = false; this.npcTriggered = false;
      $("hud-title").textContent = def.name;

      // ===== 이미지 월드(생성 일러스트 지도) 분기 =====
      if (def.image) { this.createImageWorld(def); return; }

      // ===== 이미지-백드롭 내부 분기 =====
      if (def.interior) { this.createInterior(def); return; }

      this.speed = SPEED;
      // 타일맵
      const map = this.make.tilemap({ data: def.data, tileWidth: TS, tileHeight: TS });
      const tileset = map.addTilesetImage("tileset");
      const layer = map.createLayer(0, tileset, 0, 0);
      layer.setCollision(def.collide || []);
      this.layer = layer;

      const W = def.cols * TS, H = def.rows * TS;

      // 건물(월드 장소 표시) — 집 타일 + 라벨
      this.labels = [];
      (def.buildings || []).forEach((b) => {
        const cx = b.x * TS + TS / 2, cy = b.y * TS + TS / 2;
        const col = b.home ? "#caa15a" : byId[b.placeId].color;
        addBuilding(this, cx, cy, col);
        let label, bg;
        if (b.home) { label = "우리 집 🏠"; bg = "#7a55aa"; }
        else { const done = UI.isCollected(b.placeId); label = (done ? "✓ " : "") + byId[b.placeId].name + " " + byId[b.placeId].emoji; bg = done ? "#4ca77d" : "#1b2a4a"; }
        const txt = this.add.text(cx, b.y * TS - 14, label,
          { fontFamily: "Galmuri11, sans-serif", fontSize: "9px", color: "#fff", backgroundColor: bg, padding: { x: 4, y: 2 } }).setOrigin(0.5, 1).setDepth(99999);
        this.labels.push(txt);
      });

      // 나무 (흔들림)
      (def.trees || []).forEach((t) => {
        const tr = this.add.image(t.x * TS + TS / 2, t.y * TS + TS, "tree").setOrigin(0.5, 1).setDepth(t.y * TS + 10);
        this.tweens.add({ targets: tr, angle: { from: -4, to: 4 }, duration: 1400 + (t.x * 53) % 700, yoyo: true, repeat: -1, ease: "Sine.inOut" });
      });

      // 배 (출렁)
      (def.ships || []).forEach((s) => {
        const sh = this.add.text(s.x * TS + TS / 2, s.y * TS + TS / 2, "⛵", { fontSize: "14px" }).setOrigin(0.5).setDepth(5);
        this.tweens.add({ targets: sh, y: sh.y + 4, duration: 1200, yoyo: true, repeat: -1, ease: "Sine.inOut" });
      });

      // NPC (장소 맵)
      if (def.npc) {
        const nx = def.npcCell.x * TS + TS / 2, ny = def.npcCell.y * TS + TS / 2;
        const em = this.add.text(nx, ny, def.npc.npc.emoji, { fontSize: "16px" }).setOrigin(0.5).setDepth(ny + 100);
        this.add.text(nx, ny - 14, def.npc.npc.name, { fontFamily: "Galmuri11, sans-serif", fontSize: "7px", color: "#fff", backgroundColor: "#1b2a4a", padding: { x: 3, y: 1 } }).setOrigin(0.5, 1).setDepth(99999);
        this.tweens.add({ targets: em, y: ny - 3, duration: 700, yoyo: true, repeat: -1, ease: "Sine.inOut" });
        this.npcXY = { x: nx, y: ny };
      }

      // 플레이어
      const sp = this.spawnOverride || def.spawn;
      this.player = this.physics.add.sprite(sp.x * TS + TS / 2, sp.y * TS + TS / 2, "player", 18).setDepth(5000);
      this.player.setOrigin(0.5, 0.78);
      this.player.body.setSize(18, 14); this.player.body.setOffset(23, 42);
      this.physics.add.collider(this.player, layer);
      this.physics.world.setBounds(0, 0, W, H);
      this.player.setCollideWorldBounds(true);
      this.player.setDepth(5000);

      // 깊이정렬: 플레이어는 y 기반
      this.events.on("update", () => { this.player.setDepth(this.player.y); });

      // 포탈 존
      this.portals = (def.portals || []).map((pt) => {
        const z = this.add.zone(pt.x * TS + TS / 2, pt.y * TS + TS / 2, TS, TS);
        this.physics.add.existing(z, true);
        z.portal = pt; return z;
      });
      this.portalArmed = !this.spawnOverride; // 복귀 직후엔 잠금
      this.portals.forEach((z) => this.physics.add.overlap(this.player, z, () => this.tryPortal(z.portal)));

      // 카메라
      const cam = this.cameras.main;
      cam.setBounds(0, 0, W, H);
      cam.setZoom(ZOOM);
      cam.startFollow(this.player, true, 0.12, 0.12);
      cam.roundPixels = true;
      cam.fadeIn(280);

      // 입력
      this.cursors = this.input.keyboard.createCursorKeys();
      this.wasd = this.input.keyboard.addKeys({ w: "W", a: "A", s: "S", d: "D" });

      // 복귀 직후 포탈 잠금 해제: 플레이어가 존에서 벗어나면
      this.time.delayedCall(400, () => { this.portalArmed = true; });
    }

    createImageWorld(def) {
      const W = def.imgW, H = def.imgH;
      this.speed = 230; // 큰 지도라 빠르게
      this.add.image(0, 0, def.image).setOrigin(0, 0).setDepth(0);
      this.labels = [];

      // 플레이어
      const sp = this.spawnOverride || def.spawn;
      this.player = this.physics.add.sprite(sp.x, sp.y, "player", 18);
      this.player.setOrigin(0.5, 0.82);
      this.player.body.setSize(18, 14); this.player.body.setOffset(23, 44);
      this.physics.world.setBounds(0, 0, W, H);
      this.player.setCollideWorldBounds(true);

      // 충돌(이동 불가): 건물·물
      const solids = this.physics.add.staticGroup();
      (def.solids || []).forEach((s) => {
        const r = this.add.rectangle(s.x + s.w / 2, s.y + s.h / 2, s.w, s.h, 0x000000, 0).setDepth(1);
        this.physics.add.existing(r, true);
        solids.add(r);
      });
      this.physics.add.collider(this.player, solids);

      // 우리 집 라벨
      if (def.home) this.add.text(def.home.x, def.home.y - 38, "우리 집 🏠",
        { fontFamily: "Galmuri11, sans-serif", fontSize: "18px", color: "#fff", backgroundColor: "#7a55aa", padding: { x: 6, y: 3 } }).setOrigin(0.5, 1).setResolution(3).setDepth(99999);

      // 장소 라벨 + 포탈존 — 걸어서 진입 + 탭(클릭)하면 바로 진입(정확한 이동 불필요).
      this.portals = (def.portals || []).map((pt) => {
        const done = UI.isCollected(pt.placeId);
        const lbl = this.add.text(pt.px, pt.py - 44, (done ? "✓ " : "") + pt.label + " " + byId[pt.placeId].emoji,
          { fontFamily: "Galmuri11, sans-serif", fontSize: "18px", color: "#fff", backgroundColor: done ? "#4ca77d" : "rgba(27,42,74,.92)", padding: { x: 6, y: 3 } })
          .setOrigin(0.5, 1).setResolution(3).setDepth(99999);
        const zs = pt.zone || 130;
        const z = this.add.zone(pt.px, pt.py, zs, zs); this.physics.add.existing(z, true);
        z.portal = { to: pt.to, label: pt.label, spawn: null, back: false };
        // 탭/클릭 진입: 건물 영역(존) + 이름표 둘 다 클릭 가능
        z.setInteractive(); z.on("pointerdown", () => this.tapPortal(z.portal));
        lbl.setInteractive({ useHandCursor: true }); lbl.on("pointerdown", () => this.tapPortal(z.portal));
        return z;
      });
      this.portalArmed = !this.spawnOverride;
      this.portals.forEach((z) => this.physics.add.overlap(this.player, z, () => this.tryPortal(z.portal)));

      // 카메라
      const cam = this.cameras.main;
      cam.setBounds(0, 0, W, H);
      cam.setZoom(1.15);
      cam.startFollow(this.player, true, 0.1, 0.1);
      cam.roundPixels = true; cam.fadeIn(280);

      this.cursors = this.input.keyboard.createCursorKeys();
      this.wasd = this.input.keyboard.addKeys({ w: "W", a: "A", s: "S", d: "D" });
      this.events.on("update", () => { if (this.player) this.player.setDepth(this.player.y); });
      // 월드맵 생활: 나는 새 + 배회 강아지/고양이 (characters 세션)
      if (window.CHARACTERS && CHARACTERS.spawnWorldLife) CHARACTERS.spawnWorldLife(this, { width: W, height: H });
      this.time.delayedCall(400, () => { this.portalArmed = true; });
    }

    createInterior(def) {
      const ic = def.ic;
      const cam = this.cameras.main;
      // 내부는 한 화면: 뷰포트 = 카메라 표시 크기(RESIZE 스케일). 줌=1, 추적 없음.
      const W = cam.width, H = cam.height;
      this.viewW = W; this.viewH = H;
      this.speed = Math.max(120, Math.round(Math.min(W, H) * 0.45)); // 화면 크기 비례 속도
      this.labels = [];
      this.portalArmed = false; // 진입 직후 잠금(스폰이 문 근처라 즉시 복귀 방지)

      const FX = (f) => f * W, FY = (f) => f * H; // 비율→픽셀

      const buildScene = () => {
        // --- 배경: 이미지 있으면 채우기, 없으면 플레이스홀더 ---
        const texKey = "interior-" + def.id;
        if (this.textures.exists(texKey)) {
          const img = this.add.image(W / 2, H / 2, texKey).setDepth(0);
          const src = this.textures.get(texKey).getSourceImage();
          const scale = Math.max(W / src.width, H / src.height); // cover
          img.setScale(scale);
        } else {
          // 플레이스홀더: fallbackColor 배경 + 큰 이모지 + 장소명
          const colNum = Phaser.Display.Color.HexStringToColor(ic.fallbackColor || "#5aa84f").color;
          this.add.rectangle(W / 2, H / 2, W, H, colNum).setDepth(0);
          // 바닥 영역 강조(밝은 사각)
          const fr = ic.floor;
          this.add.rectangle(FX(fr.x + fr.w / 2), FY(fr.y + fr.h / 2), FX(fr.w), FY(fr.h), 0xffffff, 0.18)
            .setStrokeStyle(2, 0xffffff, 0.35).setDepth(1);
          this.add.text(W / 2, FY(0.18), def.npc.emoji, { fontSize: Math.round(Math.min(W, H) * 0.18) + "px" })
            .setOrigin(0.5).setDepth(2);
          this.add.text(W / 2, FY(0.30), def.name,
            { fontFamily: "Galmuri11, sans-serif", fontSize: Math.round(Math.min(W, H) * 0.05) + "px", color: "#fff", backgroundColor: "rgba(0,0,0,.30)", padding: { x: 8, y: 4 } })
            .setOrigin(0.5).setDepth(2);
        }

        // --- NPC (실제 캐릭터 스프라이트, 없으면 이모지 폴백) ---
        const nx = FX(ic.npc.x), ny = FY(ic.npc.y);
        const npcKey = "npc-" + def.npc.id;
        const spriteH = Math.round(H * 0.30); // 방 높이의 ~30%
        let labelY = ny - spriteH - 6;
        if (this.textures.exists(npcKey)) {
          // 캐릭터 스프라이트(서 있는 사람) — 살짝 bob만. 떠다니는 이모지 폴백은 쓰지 않음.
          const em = this.add.image(nx, ny, npcKey).setOrigin(0.5, 1).setDepth(ny + 100);
          const src = this.textures.get(npcKey).getSourceImage();
          em.setScale(spriteH / src.height);
          this.tweens.add({ targets: em, y: ny - 4, duration: 900, yoyo: true, repeat: -1, ease: "Sine.inOut" });
        } else {
          // 스프라이트 없으면: 떠다니는 이모지 대신 바닥에 붙은 정적 표시(둥둥 안 뜨게).
          const em = this.add.text(nx, ny, def.npc.npc.emoji, { fontSize: Math.round(Math.min(W, H) * 0.09) + "px" }).setOrigin(0.5, 1).setDepth(ny + 100);
          labelY = ny - em.height - 6;
        }
        this.add.text(nx, labelY, def.npc.npc.name,
          { fontFamily: "Galmuri11, sans-serif", fontSize: "13px", color: "#fff", backgroundColor: "#1b2a4a", padding: { x: 4, y: 2 } }).setOrigin(0.5, 1).setResolution(3).setDepth(99999);
        this.npcXY = { x: nx, y: ny };

        // --- 동네로 돌아가는 문 ---
        const dx = FX(ic.door.x), dy = FY(ic.door.y);
        this.add.text(dx, dy, "🚪", { fontSize: Math.round(Math.min(W, H) * 0.07) + "px" }).setOrigin(0.5).setDepth(3);
        this.add.text(dx, dy - Math.round(H * 0.05), "동네로",
          { fontFamily: "Galmuri11, sans-serif", fontSize: "12px", color: "#fff", backgroundColor: "rgba(27,42,74,.92)", padding: { x: 5, y: 2 } }).setOrigin(0.5, 1).setDepth(99999);
        const dsz = Math.round(Math.min(W, H) * 0.12);
        const dz = this.add.zone(dx, dy, dsz, dsz); this.physics.add.existing(dz, true);
        dz.portal = def.portals[0];
        this.portals = [dz];

        // --- 플레이어 (스폰 = 비율) ---
        const sp = FX(ic.spawn.x), spy = FY(ic.spawn.y);
        this.player = this.physics.add.sprite(sp, spy, "player", 18).setDepth(5000);
        this.player.setOrigin(0.5, 0.78);
        this.player.body.setSize(18, 14); this.player.body.setOffset(23, 42);
        // 바닥 영역으로 이동 clamp 용 경계(픽셀)
        this.floorBounds = { x1: FX(ic.floor.x), y1: FY(ic.floor.y), x2: FX(ic.floor.x + ic.floor.w), y2: FY(ic.floor.y + ic.floor.h) };

        this.portals.forEach((z) => this.physics.add.overlap(this.player, z, () => this.tryPortal(z.portal)));

        // --- 카메라: 줌 1, 추적 없음(한 화면) ---
        cam.setBounds(0, 0, W, H);
        cam.setZoom(1);
        cam.stopFollow();
        cam.centerOn(W / 2, H / 2);
        cam.roundPixels = true;
        cam.fadeIn(280);

        this.cursors = this.input.keyboard.createCursorKeys();
        this.wasd = this.input.keyboard.addKeys({ w: "W", a: "A", s: "S", d: "D" });
        this.events.on("update", () => { if (this.player) this.player.setDepth(this.player.y); });
        this.time.delayedCall(500, () => { this.portalArmed = true; });
      };

      // 이미지 온디맨드 로드 + 실패 시 플레이스홀더 폴백
      const texKey = "interior-" + def.id;
      if (this.textures.exists(texKey)) { buildScene(); return; }
      let settled = false;
      const done = () => { if (settled) return; settled = true; buildScene(); };
      this.load.once("complete", done);
      this.load.once("loaderror", done); // 이미지 없으면 플레이스홀더로
      this.load.image(texKey, ic.bg);
      this.load.start();
    }

    // 탭/클릭 진입: 정확한 이동 없이 바로 진입(아이용). portalArmed 무시, 올바른 카드 표시.
    tapPortal(pt) {
      if (this.busy || UI.isOpen) return;
      this.busy = true;
      const cam = this.cameras.main; const fade = $("fade");
      fade.innerHTML = `<div class="map-card">${pt.back ? "🏘️ 속초 월드맵" : "📍 " + pt.label}</div>`;
      fade.classList.add("show");
      cam.fadeOut(260);
      this.time.delayedCall(300, () => {
        this.scene.restart({ mapId: pt.to, spawn: pt.spawn || null });
        setTimeout(() => fade.classList.remove("show"), 320);
      });
    }

    tryPortal(pt) {
      if (this.busy || !this.portalArmed || UI.isOpen) return;
      this.busy = true;
      const cam = this.cameras.main;
      const fade = $("fade");
      fade.innerHTML = `<div class="map-card">${pt.back ? "🏘️ 속초 월드맵" : "📍 " + pt.label}</div>`;
      fade.classList.add("show");
      cam.fadeOut(260);
      this.time.delayedCall(300, () => {
        this.scene.restart({ mapId: pt.to, spawn: pt.spawn || null });
        setTimeout(() => fade.classList.remove("show"), 320);
      });
    }

    update() {
      if (!this.player || !this.player.body || !this.cursors) return; // 비동기 로드/파괴된 스프라이트 가드
      const stop = UI.isOpen || this.busy;
      let vx = 0, vy = 0;
      if (!stop) {
        const gi = window.GAMEINPUT || { x: 0, y: 0 };
        vx = gi.x; vy = gi.y;
        if (this.cursors.left.isDown || this.wasd.a.isDown) vx = -1;
        else if (this.cursors.right.isDown || this.wasd.d.isDown) vx = 1;
        if (this.cursors.up.isDown || this.wasd.w.isDown) vy = -1;
        else if (this.cursors.down.isDown || this.wasd.s.isDown) vy = 1;
        const m = Math.hypot(vx, vy);
        if (m > 1) { vx /= m; vy /= m; }
      }
      const spd = this.speed || SPEED;
      this.player.setVelocity(vx * spd, vy * spd);

      // 내부맵: 플레이어를 바닥 영역으로 clamp
      if (this.floorBounds) {
        const fb = this.floorBounds;
        if (this.player.x < fb.x1) { this.player.x = fb.x1; if (vx < 0) this.player.body.velocity.x = 0; }
        else if (this.player.x > fb.x2) { this.player.x = fb.x2; if (vx > 0) this.player.body.velocity.x = 0; }
        if (this.player.y < fb.y1) { this.player.y = fb.y1; if (vy < 0) this.player.body.velocity.y = 0; }
        else if (this.player.y > fb.y2) { this.player.y = fb.y2; if (vy > 0) this.player.body.velocity.y = 0; }
      }

      const moving = Math.hypot(vx, vy) > 0.1;
      if (moving) {
        let dir = Math.abs(vx) > Math.abs(vy) ? (vx > 0 ? "right" : "left") : (vy > 0 ? "down" : "up");
        this.player.anims.play("walk-" + dir, true); this.lastDir = dir;
      } else {
        this.player.anims.stop();
        this.player.setFrame({ down: 18, up: 0, left: 9, right: 27 }[this.lastDir || "down"]);
      }

      // NPC 근접
      if (this.def.npc && this.npcXY && !this.npcTriggered && !UI.isOpen && !this.busy) {
        if (Phaser.Math.Distance.Between(this.player.x, this.player.y, this.npcXY.x, this.npcXY.y) < 26) {
          this.npcTriggered = true;
          AUDIO.play("pop");
          UI.startExperience(this.def.npc);
        }
      }

      // 근접 안내(월드 포탈)
      updateNearHint(this);
    }
  }

  function updateNearHint(scene) {
    const hint = $("near-hint");
    if (UI.isOpen || scene.busy) { hint.classList.remove("show"); return; }
    let near = null;
    (scene.portals || []).forEach((z) => {
      if (!z.portal.back && Phaser.Math.Distance.Between(scene.player.x, scene.player.y, z.x, z.y) < 24) near = z.portal;
    });
    if (near) { hint.textContent = "📍 " + near.label + " 들어가기"; hint.classList.add("show"); }
    else hint.classList.remove("show");
  }

  /* ============================================================
     조이스틱 (DOM) → window.GAMEINPUT
     ============================================================ */
  window.GAMEINPUT = { x: 0, y: 0 };
  function setupJoystick() {
    const base = $("joy-base"), thumb = $("joy-thumb");
    let active = false, id = null, cx = 0, cy = 0; const R = 45;
    const start = (e) => { active = true; const t = e.changedTouches ? e.changedTouches[0] : e; id = e.changedTouches ? t.identifier : "m"; const r = base.getBoundingClientRect(); cx = r.left + r.width / 2; cy = r.top + r.height / 2; move(e); };
    const move = (e) => {
      if (!active) return;
      const t = e.changedTouches ? [...e.changedTouches].find((x) => x.identifier === id) || e.changedTouches[0] : e;
      let dx = t.clientX - cx, dy = t.clientY - cy; const d = Math.hypot(dx, dy) || 1, cl = Math.min(d, R);
      dx = dx / d * cl; dy = dy / d * cl; thumb.style.transform = `translate(${dx}px,${dy}px)`;
      window.GAMEINPUT.x = dx / R; window.GAMEINPUT.y = dy / R;
    };
    const end = () => { active = false; thumb.style.transform = "translate(0,0)"; window.GAMEINPUT.x = 0; window.GAMEINPUT.y = 0; };
    base.addEventListener("touchstart", (e) => { e.preventDefault(); start(e); }, { passive: false });
    base.addEventListener("touchmove", (e) => { e.preventDefault(); move(e); }, { passive: false });
    base.addEventListener("touchend", end); base.addEventListener("touchcancel", end);
    base.addEventListener("mousedown", start); window.addEventListener("mousemove", move); window.addEventListener("mouseup", end);
  }

  /* ============================================================
     부트 / 화면
     ============================================================ */
  const $ = (id) => document.getElementById(id);
  const screens = { start: $("screen-start"), map: $("screen-map") };
  function showScreen(n) { Object.values(screens).forEach((s) => s.classList.remove("active")); screens[n].classList.add("active"); }

  let game = null;
  function startGame() {
    UI.reset();
    showScreen("map");
    AUDIO.bgm();
    if (!game) {
      game = new Phaser.Game({
        type: Phaser.AUTO, parent: "game-root", backgroundColor: "#3a7d3a",
        pixelArt: true, roundPixels: true,
        scale: { mode: Phaser.Scale.RESIZE, width: "100%", height: "100%" },
        physics: { default: "arcade", arcade: { debug: false } },
        scene: [Boot, Explore],
      });
    } else {
      game.scene.getScene("Explore").scene.restart({ mapId: "world", spawn: null });
    }
  }

  function resetHome() { UI.closeAll(); AUDIO.stopBgm(); showScreen("start"); }

  // UI 콜백
  UI.onDone = (place, all) => {
    if (all) return; // 결과창 표시됨
    const scene = game && game.scene.getScene("Explore");
    if (scene && scene.scene.isActive()) {
      const back = scene.def.portals.find((p) => p.back);
      setTimeout(() => { if (back) scene.tryPortalForce(back); }, 500);
    }
  };
  UI.onReplay = () => { startGame(); };

  // 강제 복귀 (UI 완료 후 — portalArmed 무시)
  Explore.prototype.tryPortalForce = function (pt) {
    this.busy = true;
    const cam = this.cameras.main; const fade = $("fade");
    fade.innerHTML = `<div class="map-card">🏘️ 속초 월드맵</div>`; fade.classList.add("show");
    cam.fadeOut(260);
    this.time.delayedCall(300, () => { this.scene.restart({ mapId: pt.to, spawn: pt.spawn || null }); setTimeout(() => fade.classList.remove("show"), 320); });
  };

  function bind() {
    $("btn-start").addEventListener("click", startGame);
    $("btn-home").addEventListener("click", resetHome);
  }
  if (!PLACES.length) console.error("PLACES 없음");
  if (document.readyState !== "loading") { bind(); setupJoystick(); }
  else document.addEventListener("DOMContentLoaded", () => { bind(); setupJoystick(); });
})();
