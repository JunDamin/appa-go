/*
 * 아빠, Go! — 건물 내부맵: 마트 (mart)  [STUB — 후속 워커가 본문 교체]
 * 스키마/사용법은 data/interiors/library.js 상단 주석 참고. 타일셋=Kenney RPG Urban(CC0).
 * lookMission = 우유·과일·장바구니·계산대 (진열대 shelf, 계산대 counter)
 */
globalThis.INTERIORS = globalThis.INTERIORS || {};
globalThis.INTERIORS.mart = {
  cols: 18, rows: 14,
  floor: 405, wall: 117, wallTop: 36,
  props: [
    { x: 3, y: 4, w: 3, h: 1, synth: "shelf", collide: true, label: "진열대" },
    { x: 11, y: 11, w: 3, h: 1, synth: "counter", collide: true, label: "계산대" },
    { x: 8, y: 0, tile: 257 },
  ],
  decor: [],
  npcCell: { x: 12, y: 10 },
  spawn: { x: 9, y: 12 },
};
