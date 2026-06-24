/*
 * 아빠, Go! — 건물 내부맵: 놀이터 (playground)  [STUB — 후속 워커가 본문 교체]
 * 스키마/사용법은 data/interiors/library.js 상단 주석 참고. 타일셋=Kenney RPG Urban(CC0).
 * lookMission = 미끄럼틀·그네·모래밭·벤치 (놀이터는 야외이나 동일 내부맵 형식 사용)
 */
globalThis.INTERIORS = globalThis.INTERIORS || {};
globalThis.INTERIORS.playground = {
  cols: 18, rows: 14,
  floor: 1, wall: 382, wallTop: 382,   // 잔디 바닥 + 나무 울타리 테두리
  props: [
    { x: 4, y: 6, synth: "slide", collide: true, label: "미끄럼틀" },
    { x: 9, y: 6, synth: "swing", collide: true, label: "그네" },
    { x: 3, y: 10, tile: 270, collide: true, label: "벤치" },
  ],
  decor: [
    { x: 11, y: 9, w: 3, h: 2, synth: "sandbox" },
  ],
  npcCell: { x: 9, y: 9 },
  spawn: { x: 9, y: 12 },
};
