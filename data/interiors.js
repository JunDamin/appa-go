/*
 * 아빠, Go! — 건물 내부 (이미지-백드롭 시스템)
 *
 * PIVOT: 타일 조립(tile-assembly) 방식을 폐기하고, 각 장소 내부를
 * "일러스트 배경 이미지 1장 + 걸어다닐 수 있는 바닥 영역 + NPC + 동네로 돌아가는 문"
 * 으로 구성한다. 이미지가 없으면 fallbackColor 플레이스홀더로 동작(오프라인 가능).
 *
 * 스키마 (모든 좌표는 게임 뷰포트 대비 "비율" 0~1 — 화면 크기에 맞춰 스케일됨):
 *  globalThis.INTERIORS[placeId] = {
 *    bg:            "assets/interiors/<id>.png"   // 배경 이미지(고각/탑다운 방 일러스트)
 *    fallbackColor: "#hex"                         // 이미지 없을 때 placeholder 배경색(place.color)
 *    floor: { x, y, w, h }   // 걸을 수 있는 바닥 영역(비율). 플레이어 이동을 여기로 clamp.
 *    npc:   { x, y }         // NPC 위치(비율). 근접 시 UI.startExperience(place) 트리거.
 *    door:  { x, y }         // 동네로 돌아가는 뒷문(비율, 보통 하단 중앙).
 *    spawn: { x, y }         // 플레이어 시작 위치(비율, 문 살짝 위).
 *  }
 *
 * 배경 이미지는 generate-assets.mjs 의 INTERIOR_JOBS (mode "interiors") 로 생성.
 * floor = 캐릭터가 걷는 하단 ~60% 영역. npc = 상단 중앙. door = 하단 중앙.
 */
globalThis.INTERIORS = {
  library: {
    bg: "assets/interiors/library.png",
    fallbackColor: "#5aa84f",
    floor: { x: 0.10, y: 0.32, w: 0.80, h: 0.58 },
    npc:   { x: 0.50, y: 0.42 },
    door:  { x: 0.50, y: 0.92 },
    spawn: { x: 0.50, y: 0.85 },
  },
  school: {
    bg: "assets/interiors/school.png",
    fallbackColor: "#5a7fd0",
    floor: { x: 0.10, y: 0.34, w: 0.80, h: 0.56 },
    npc:   { x: 0.50, y: 0.44 },
    door:  { x: 0.50, y: 0.92 },
    spawn: { x: 0.50, y: 0.85 },
  },
  mart: {
    bg: "assets/interiors/mart.png",
    fallbackColor: "#b06ad0",
    floor: { x: 0.10, y: 0.34, w: 0.80, h: 0.56 },
    npc:   { x: 0.52, y: 0.42 },
    door:  { x: 0.50, y: 0.92 },
    spawn: { x: 0.50, y: 0.85 },
  },
  daycare: {
    // 전방호환 스텁: 현재 PLACES 에 daycare 항목이 없어 게임에서 진입되지 않음.
    bg: "assets/interiors/daycare.png",
    fallbackColor: "#f2a93a",
    floor: { x: 0.10, y: 0.34, w: 0.80, h: 0.56 },
    npc:   { x: 0.50, y: 0.44 },
    door:  { x: 0.50, y: 0.92 },
    spawn: { x: 0.50, y: 0.85 },
  },
  playground: {
    bg: "assets/interiors/playground.png",
    fallbackColor: "#2bb3a3",
    floor: { x: 0.08, y: 0.30, w: 0.84, h: 0.60 },
    npc:   { x: 0.50, y: 0.40 },
    door:  { x: 0.50, y: 0.92 },
    spawn: { x: 0.50, y: 0.85 },
  },
  market: {
    bg: "assets/interiors/market.png",
    fallbackColor: "#e8893a",
    floor: { x: 0.10, y: 0.34, w: 0.80, h: 0.56 },
    npc:   { x: 0.50, y: 0.42 },
    door:  { x: 0.50, y: 0.92 },
    spawn: { x: 0.50, y: 0.85 },
  },
  lake: {
    bg: "assets/interiors/lake.png",
    fallbackColor: "#3aa0c0",
    floor: { x: 0.08, y: 0.34, w: 0.84, h: 0.56 },
    npc:   { x: 0.50, y: 0.44 },
    door:  { x: 0.50, y: 0.92 },
    spawn: { x: 0.50, y: 0.85 },
  },
  beach: {
    bg: "assets/interiors/beach.png",
    fallbackColor: "#3a9bd0",
    floor: { x: 0.08, y: 0.38, w: 0.84, h: 0.52 },
    npc:   { x: 0.50, y: 0.48 },
    door:  { x: 0.50, y: 0.92 },
    spawn: { x: 0.50, y: 0.85 },
  },
};
