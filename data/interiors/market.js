/*
 * 아빠, Go! — 건물 내부맵: 시장 (market)  [STUB — 후속 워커가 본문 교체]
 * 스키마/사용법은 data/interiors/library.js 상단 주석 참고. 타일셋=Kenney RPG Urban(CC0).
 * lookMission = 닭강정 가게·간판·시장 골목·계산하는 곳 (좌판 stall, 간판 sign)
 */
globalThis.INTERIORS = globalThis.INTERIORS || {};
globalThis.INTERIORS.market = {
  cols: 18, rows: 14,
  floor: 440, wall: 117, wallTop: 36,   // 아스팔트 골목 + 베이지 파사드
  props: [
    { x: 3, y: 4, w: 3, h: 1, synth: "stall", collide: true, label: "닭강정 가게" },
    { x: 11, y: 4, w: 3, h: 1, synth: "stall", collide: true },
    { x: 11, y: 11, w: 3, h: 1, synth: "counter", collide: true, label: "계산하는 곳" },
  ],
  decor: [
    { x: 8, y: 0, tile: 171 },
  ],
  npcCell: { x: 9, y: 7 },
  spawn: { x: 9, y: 12 },
};
