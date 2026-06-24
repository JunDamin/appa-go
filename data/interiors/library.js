/*
 * 아빠, Go! — 건물 내부맵 데이터: 도서관 (library)  ★ 캐논 템플릿 ★
 * ============================================================================
 * 이 파일은 6개 내부맵의 표준 형식(SCHEMA) 정의 파일입니다.
 * 다른 5개 워커는 이 형식을 그대로 복사해 자기 장소 1개만 채웁니다.
 *
 * 타일셋: Kenney "RPG Urban Pack" — assets/external_v3/urban_tilemap_packed.png
 *   16x16px, 27열x18행=486, index = row*27+col. Boot에서 spritesheet "urban" 로드.
 *   라이선스: CC0 1.0 (퍼블릭 도메인). 출처표기 권장(비필수).
 * 좌표계: 셀(타일) 단위. 1셀 = 화면상 32px(16px 원본 x2 스케일). 월드맵은 그대로 32px 유지.
 *
 * ── INTERIORS 스키마 ───────────────────────────────────────────────────────
 *   globalThis.INTERIORS.<placeId> = {
 *     cols, rows,                       // 방 크기(셀). 권장 16~20 x 12~16.
 *     floor: <urbanIndex>,              // 바닥 채움 타일 인덱스
 *     wall:  <urbanIndex>,              // 벽(테두리) 타일 인덱스
 *     wallTop?: <urbanIndex>,           // (선택) 상단 벽 줄 전용 타일(없으면 wall 사용)
 *     props: [                          // 가구/소품. 충돌 가능.
 *       {
 *         x, y,                         // 좌상단 셀 좌표
 *         w?, h?,                       // 차지 셀 크기(기본 1x1). w/h>1이면 타일/텍스처 반복.
 *         tile?:  <urbanIndex|null>,    // urban 시트 프레임으로 그릴 때
 *         synth?: "<furnName>"|null,    // 자작 가구 텍스처로 그릴 때 (아래 목록)
 *         collide?: true,               // 플레이어 충돌 발생 여부(기본 false)
 *         label?: "책장"                // (선택) 머리 위 작은 한글 라벨
 *       }, ...
 *     ],
 *     decor: [ ... ],                   // props 와 동일 구조이나 충돌 없음(러그/포스터/표지판)
 *     npcCell: { x, y },                // NPC 가 서 있는 셀
 *     spawn:   { x, y }                 // 플레이어 등장 셀(하단 문 근처 권장)
 *   };
 *
 * ── 사용 가능한 자작(synth) 가구 텍스처 (game.js Boot 에서 생성) ──────────────
 *   "bookshelf"  책장(갈색 책장+알록달록 책등)        기본 1x1, w>1로 가로 책장 벽
 *   "counter"    카운터/계산대(나무 상판+전면 패널)    대출/계산대
 *   "rug"        러그/매트(둥근 모서리 카펫) — decor용
 *   "chair"      낮은 의자(아동용)
 *   "table"      낮은 책상/테이블
 *   "shelf"      진열대(마트 선반, 3칸)
 *   "mat"        낮잠매트/방석
 *   "block"      장난감 블록 더미
 *   "slide"      미끄럼틀
 *   "swing"      그네
 *   "stall"      좌판(시장 음식 좌판)
 *   "board"      칠판/게시판
 *   "shoecubby"  신발장(격자)
 *   "pictstand"  그림책 스탠드(경사 진열대)
 *   "sandbox"    모래밭
 *   (urban 시트 인덱스는 props.tile 로 직접 사용: 창문=359, 문=311/310/257, 벤치=270 등)
 *
 * 충돌/이동: 테두리 벽은 자동 충돌. props 중 collide:true 만 추가 충돌.
 * spawn 은 하단 문(복귀 포탈) 바로 위 셀이어야 자연스럽습니다.
 * lookMission 항목을 내부 사물로 재현 → 화면이 곧 "사진 속 찾기 미션"과 일치.
 * ============================================================================
 */
globalThis.INTERIORS = globalThis.INTERIORS || {};

// 도서관: lookMission = 입구·어린이실·책장·신발장 (+ 그림책·의자·대출카운터)
globalThis.INTERIORS.library = {
  cols: 18, rows: 14,
  floor: 405,   // 보도블럭(밝은 회색) — 차분한 도서관 바닥
  wall: 117,    // 베이지 파사드 벽
  wallTop: 36,  // 상단 줄은 회색 콘크리트 벽으로 마감

  props: [
    // ── 벽면 책장 (좌/우/상단 벽을 따라) ──
    { x: 1, y: 1, w: 5, h: 1, synth: "bookshelf", collide: true, label: "책장" },
    { x: 12, y: 1, w: 5, h: 1, synth: "bookshelf", collide: true },
    { x: 1, y: 2, w: 1, h: 4, synth: "bookshelf", collide: true },
    { x: 16, y: 2, w: 1, h: 4, synth: "bookshelf", collide: true },
    // ── 어린이실: 낮은 책상 + 의자 ──
    { x: 7, y: 8, w: 2, h: 1, synth: "table", collide: true },
    { x: 7, y: 9, synth: "chair", collide: true, label: "의자" },
    { x: 8, y: 9, synth: "chair", collide: true },
    { x: 7, y: 7, synth: "chair", collide: true },
    { x: 8, y: 7, synth: "chair", collide: true },
    // ── 그림책 스탠드 ──
    { x: 13, y: 8, synth: "pictstand", collide: true, label: "그림책" },
    { x: 13, y: 9, synth: "pictstand", collide: true },
    // ── 신발장 (입구 옆) ──
    { x: 2, y: 11, w: 2, h: 1, synth: "shoecubby", collide: true, label: "신발장" },
    // ── 대출 카운터 (입구 근처) ──
    { x: 11, y: 11, w: 3, h: 1, synth: "counter", collide: true, label: "대출 카운터" },
    // ── 창문(상단 벽에 박기) ──
    { x: 8, y: 0, tile: 359 },
    { x: 9, y: 0, tile: 359 },
  ],

  decor: [
    // 어린이실 러그(충돌 없음)
    { x: 6, y: 6, w: 4, h: 4, synth: "rug" },
    // 입구 안내 표지
    { x: 9, y: 12, tile: 171 },
  ],

  npcCell: { x: 12, y: 10 },  // 대출 카운터 뒤 사서 선생님
  spawn: { x: 9, y: 12 },     // 하단 문 위
};
