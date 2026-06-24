/*
 * 아빠, Go! — 건물 내부맵: 학교 (school)  [STUB — 후속 워커가 본문 교체]
 * 스키마/사용법은 data/interiors/library.js 상단 주석 참고. 타일셋=Kenney RPG Urban(CC0).
 * lookMission = 교문·운동장·횡단보도·국기게양대 (교실: 책상·칠판·교실창문)
 */
globalThis.INTERIORS = globalThis.INTERIORS || {};
globalThis.INTERIORS.school = {
  cols: 18, rows: 14,
  floor: 405, wall: 36, wallTop: 36,
  props: [
    { x: 2, y: 1, w: 4, h: 1, synth: "board", collide: true, label: "칠판" },
    { x: 7, y: 8, w: 2, h: 1, synth: "table", collide: true, label: "책상" },
    { x: 8, y: 0, tile: 359 },
  ],
  decor: [],
  npcCell: { x: 9, y: 5 },
  spawn: { x: 9, y: 12 },
};
