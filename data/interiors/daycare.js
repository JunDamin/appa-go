/*
 * 아빠, Go! — 건물 내부맵: 어린이집 (daycare)  [STUB — 후속 워커가 본문 교체]
 * 스키마/사용법은 data/interiors/library.js 상단 주석 참고. 타일셋=Kenney RPG Urban(CC0).
 * lookMission = 미끄럼틀·블록·그림책·신발장·낮잠매트
 * 참고: 현재 PLACES 에 daycare 항목이 없어 게임에서 진입되지 않을 수 있음(전방호환 스텁).
 */
globalThis.INTERIORS = globalThis.INTERIORS || {};
globalThis.INTERIORS.daycare = {
  cols: 18, rows: 14,
  floor: 405, wall: 117, wallTop: 36,
  props: [
    { x: 3, y: 8, synth: "slide", collide: true, label: "미끄럼틀" },
    { x: 6, y: 9, synth: "block", collide: true, label: "블록" },
    { x: 2, y: 11, w: 2, h: 1, synth: "shoecubby", collide: true, label: "신발장" },
  ],
  decor: [
    { x: 10, y: 8, w: 3, h: 2, synth: "mat" },
  ],
  npcCell: { x: 12, y: 6 },
  spawn: { x: 9, y: 12 },
};
