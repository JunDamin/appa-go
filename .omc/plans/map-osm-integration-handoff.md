# 구현 핸드오프: 맵 ↔ 실제 OSM 데이터 연계 (아빠, Go!)

> **이 문서의 용도:** 구현 세션이 이 파일 하나만 읽고 작업을 시작할 수 있도록 만든 자급식 핸드오프.
> 인터뷰 스펙 원본: `.omc/specs/deep-interview-appa-go-real-map-data.md` (모호도 16.6%, PASSED).
> 상태: **pending approval** — 실제 소스 수정/스크립트 실행은 사용자의 실행 승인 후 진행.

## 0. 한 줄 요약
`game.js`의 손코딩 `worldDef()`를, **빌드타임에 OSM에서 1회 수집한 정적 `data/geo.json`** 으로 구동되는 데이터 주도 맵으로 교체한다. 런타임은 100% 정적·키없음 유지. 정확도는 "실제 방위·비율 느낌"(약간 변형 허용).
**동시에 "맵이 엉망" 문제의 진짜 원인인 시각 품질(합성 4타일·하드엣지·graphics 건물)을 실제 타일셋+전이(autotile) 패스로 교체한다.** 원리: **데이터=어디에 무엇이(WHERE), 타일셋+autotile=어떻게 보이나(HOW).** 두 트랙은 직교하며 함께 간다.

## 0.1 토폴로지 (4개 트랙)
| # | 트랙 | 성격 | 비고 |
|---|------|------|------|
| ① | 실제 지형 형상 | OSM 데이터 | 해안선·호수·주요도로·숲 |
| ② | 실제 장소 좌표 | OSM 데이터 | 6장소 위경도→타일 |
| ③ | 데이터 파이프라인 | OSM 빌드타임 | Overpass→geo.json |
| ④ | **시각 품질 (신규)** | 렌더링/에셋 | 실타일셋·전이타일·건물타일·시각규칙·(선택)fog |

## 1. 키 / 소스 (사용자 질문 답)
- **필요한 API 키: 없음.** OSM Overpass·Nominatim 둘 다 무료·무인증.
- **유일한 요구사항:** HTTP 요청에 식별용 `User-Agent` 헤더 (예: `appa-go-dev/1.0 (gpt@koica.go.kr)`). Nominatim은 초당 1요청 제한.
- 소스 엔드포인트:
  - Nominatim 지오코딩: `https://nominatim.openstreetmap.org/search?q=<query>&format=json&limit=1`
  - Overpass(형상): `https://overpass-api.de/api/interpreter` (POST, Overpass QL)
- **라이선스:** ODbL. 결과물에 `© OpenStreetMap contributors` 출처표기 필수(README + 크레딧/결과 화면).

## 2. 이미 수집한 실제 데이터 (그대로 반영 가능)
2026-06-24 Nominatim 조회 결과 (원본 위경도):

| placeId | 이름 | OSM type | lat | lon | 비고 |
|---------|------|----------|-----|-----|------|
| library | 속초시립도서관 | node/amenity=library | 38.1867317 | 128.5906420 | 조양동(남) — 실제 POI |
| market | 속초관광수산시장 | way/amenity=marketplace | 38.2047700 | 128.5897997 | 중앙동(북) — 실제 POI |
| (지형) | 청초호 | way/water=lake | 38.1967493 | 128.5882465 | 호수면 중심. bbox 38.1916–38.2014 / 128.5821–128.5935 |
| (지형) | 영랑호 | relation/water=lagoon | 38.2174045 | 128.5805088 | 북(북서). bbox 38.2122–38.2226 / 128.5669–128.5907 |
| (생활권) | 조양동 신시가지 | landuse=residential | 38.1870858 | 128.5700205 | 남쪽 우리 동네 기준점 |

> `school / daycare / mart / playground / home`은 **실명 POI가 아니라 정착 서사용 일반 시설**이다 → 조양동 남쪽 생활권에 군집 배치(아래 §4 표).
> `playground`는 "청초호 놀이터"이므로 청초호 남안에 둔다.

## 3. 좌표 투영 (결정적, 런타임에서 사용)
### 3.1 게임권역 bbox (설계 결정)
6개 앵커 + 동해(동) + 설악 방면(서)을 감싸되 과밀하지 않게:
```js
const BBOX = { minLat: 38.183, maxLat: 38.224, minLon: 128.565, maxLon: 128.610 };
// 실측거리: N-S ≈ 4.55km, E-W ≈ 3.93km
```
> 구현 시 권장: 위 §2 앵커를 모두 포함하도록 bbox를 자동 산출(여백 ~10%)해도 됨. 위 값은 검증된 기본값.

### 3.2 투영 함수 (비율 "느낌" 보존 = aspect-preserving fit)
```js
const COLS = 44, ROWS = 38;
const mPerLat = 111000;
const mPerLon = 111000 * Math.cos(38.2 * Math.PI / 180); // ≈ 87268
function makeProjection(bbox) {
  const wM = (bbox.maxLon - bbox.minLon) * mPerLon; // 동서 거리(m)
  const hM = (bbox.maxLat - bbox.minLat) * mPerLat; // 남북 거리(m)
  const scale = Math.min((COLS - 1) / wM, (ROWS - 1) / hM); // 비율 보존(레터박스)
  const xOff = ((COLS - 1) - wM * scale) / 2;
  const yOff = ((ROWS - 1) - hM * scale) / 2;
  return function lonLatToTile(lon, lat) {
    const x = (lon - bbox.minLon) * mPerLon * scale + xOff;
    const y = (bbox.maxLat - lat) * mPerLat * scale + yOff; // lat↑ = 위(작은 y)
    return { x: Math.round(x), y: Math.round(y) };
  };
}
```

## 4. 계산된 타일 좌표 (위 bbox+투영 적용 결과 — `places.js` 갱신표)
| placeId | 현재 world{x,y} | **신규 world{x,y}** | 근거 |
|---------|----------------|---------------------|------|
| market | {22,11} | **{24,17}** | 실좌표(북) |
| library | {24,27} | **{24,34}** | 실좌표(남, 조양동) |
| playground(청초호 놀이터) | {28,25} | **{20,29}** | 청초호 남안 |
| school | {20,32} | **{16,34}** | 조양동 군집(서) |
| daycare | {30,32} | **{20,35}** | 조양동 군집(중) |
| mart | {33,28} | **{27,34}** | 조양동 군집(동) |
| home(spawn) | {27,34} | **{22,36}** | 조양동 생활권 중심 |

지형 앵커(타일): 청초호 중심 ≈ **{22,25}**, 반경 ≈ x11×y9 타원 / 영랑호 ≈ **{17,6}** / 동해 = x≳34 동쪽 / 설악 숲 = 서쪽 가장자리.
> school/daycare/mart는 일반 시설이므로 §4 값은 "조양동 군집 + 최소간격 보정" 권장값. 겹침 방지 후 최종 확정.

## 5. geo.json 스키마 (build-map.mjs 산출물, 런타임이 읽는 유일 파일)
```jsonc
{
  "meta": { "source": "OpenStreetMap", "license": "ODbL © OpenStreetMap contributors",
            "generatedAt": "<ISO>", "bbox": {"minLat":..,"maxLat":..,"minLon":..,"maxLon":..} },
  "sea":   { "minLonEdge": 128.605 },          // 또는 coastline 폴리라인 [[lon,lat],...]
  "lakes": [ { "name":"청초호", "polygon":[[lon,lat],...] },
             { "name":"영랑호", "polygon":[[lon,lat],...] } ],
  "roads": [ { "name":"동해대로", "line":[[lon,lat],...] }, ... ], // highway=primary|secondary|trunk
  "forest":[ { "polygon":[[lon,lat],...] } ],  // 서쪽 wood/forest (설악 방면)
  "places":[ { "id":"library","lon":128.5906420,"lat":38.1867317 }, ... ]
}
```

## 6. build-map.mjs 사양 (빌드타임 Node, generate-assets.mjs와 동일 패턴)
1. §1 엔드포인트로 §2 앵커 + 형상 수집. 핵심 Overpass QL(예시):
```overpassql
[out:json][timeout:60];
( way["natural"="coastline"](38.183,128.565,38.224,128.610);
  way["natural"="water"](38.183,128.565,38.224,128.610);
  relation["natural"="water"](38.183,128.565,38.224,128.610);
  way["highway"~"primary|secondary|trunk"](38.183,128.565,38.224,128.610);
  way["natural"="wood"](38.183,128.565,38.224,128.610);
  way["landuse"="forest"](38.183,128.565,38.224,128.610); );
out geom;
```
2. 폴리라인/폴리곤 좌표 **다운샘플**(타일 해상도에 맞춰 노이즈 제거).
3. `data/geo.json` 작성(메타·라이선스·타임스탬프 포함). 실패 시 마지막 커밋본 유지.

## 7. worldDef() 교체 계획 (game.js:28-62)
하드코딩 도형 → `geo.json` 래스터화로 대체:
- `lakeC/yeongC/x>=40` 제거. 대신: 바다=해안선 동쪽/`sea` → `T.water`, 해안 한 줄 → `T.sand`.
- 호수: `lakes[].polygon` → point-in-polygon으로 `T.water`.
- 도로: `roads[].line` → 타일 그리기(브레젠험). 기존 spawn→장소 직선 `road()`(game.js:44-50)는 보조/우리집 진입로로만 축소.
- 숲: `forest` 영역 + 서쪽 가장자리 → 나무 분포(기존 trees 로직 재사용).
- 장소/spawn: `places[]` → `lonLatToTile` → 최소간격 보정 → `buildings/portals/spawn`.
- 타일 인덱스(0 grass/1 water/2 sand/3 road)·`collide=[water]`·44×38·`addBuilding()` 전부 재사용.

## 8. 에셋 고려사항 (사용자 질문 답)
- **현 설계는 에셋 중립** — Boot 씬의 합성 4타일(grass/water/sand/road, game.js:120-131)과 기존 스프라이트로 그대로 동작. **신규 아트 불필요.** geo.json은 이미지가 아닌 데이터 에셋(`data/`)이다.
- **선택적 업그레이드(미필수, 나중에):**
  - 설악 방면 산 타일(현재는 나무로 표현) — `assets/external_v2/tiles/`에 mountain 타일 추가 시 worldDef의 forest 영역을 산 타일로 스왑.
  - 해안 전이 타일(모래↔물) 1종 추가하면 해안선이 더 자연스러움.
  - 주요 도로 교차 타일 variant.
- **파이프라인 분리:** `build-map.mjs`(지도 데이터)와 `generate-assets.mjs`(이미지)는 별도 스크립트로 유지. build-map은 `.env` 키 불필요(OSM 무인증).

## 9. 구현 세션 작업 순서 (체크리스트)
1. [ ] `build-map.mjs` 작성 → 실행 → `data/geo.json` 생성(§5,6).
2. [ ] `lonLatToTile` 투영 유틸 추가(§3) — game.js 또는 별도 모듈.
3. [ ] `worldDef()` 데이터 주도로 교체(§7), 하드코딩 도형 제거.
4. [ ] `data/places.js`의 `world{x,y}`를 geo.json 유래 값으로 갱신(§4) — 또는 런타임에 geo.json places로 주입.
5. [ ] 최소간격 보정으로 6장소 겹침 제거·전부 진입 가능 확인.
6. [ ] 주요 도로가 실제 줄기 형태로 보이는지 육안 검증.
7. [ ] `© OpenStreetMap contributors` 출처표기 추가(README + 화면).
8. [ ] 런타임 네트워크 0건 확인(정적 회귀): 플레이 중 외부 호출 없음.
9. [ ] 기존 루프(대사·음성·사진미션·보물조각·결과) 회귀 없음 확인.
--- 시각 품질 트랙 (§12) ---
10. [ ] 실 타일셋(Kenney CC0 권장) 선정·라이선스 확인 → Boot 씬 spritesheet 로드로 교체(합성 4타일 제거).
11. [ ] autotile 2차 패스 구현(잔디↔물·모래·길 경계 전이타일).
12. [ ] 건물 graphics(`addBuilding`) → 타일셋 건물 스프라이트로 교체.
13. [ ] 5개 구역 팔레트·장식 타일 적용.
14. [ ] (선택) fog/점진적 해금 — 채택 또는 명시적 미채택 결정.

## 10. 합격 기준 (스펙에서 승계)
- 방위 일치: 동=바다, 중앙=청초호, 북서=영랑호, 북=시장, 남=조양동/도서관, 서=숲(설악).
- 6장소 전부 도달·진입 가능, 걷기 동선 유지.
- 런타임 정적·키없음·오프라인 유지.
- 주요 도로 1~2줄기가 직선 L자가 아닌 실제 형태로 표시.
- 출처표기 존재.

## 11. 리스크 & 완화
| 리스크 | 완화 |
|--------|------|
| bbox 부적절 → 과밀/잘림 | 6앵커 자동포함 + 여백 10%, 위 검증 bbox 기본값 |
| OSM 좌표 과다 → 타일 노이즈 | 다운샘플 후 래스터화, 육안 검증 단계 |
| 실배치 vs 게임성 충돌 | 방위·비율 유지 + 최소간격 보정(게임성 우선) |
| Overpass 일시 장애 | 빌드타임 전용·마지막 geo.json 유지, 런타임 무관 |
| 타일셋 라이선스 위반 | CC0(Kenney) 우선 또는 LPC면 출처표기, 라이선스 파일 동봉 |
| autotile 규칙 누락 → 여전히 하드엣지 | 16-case 또는 47-case 룩업 테이블, 미스 시 기본 채움타일 폴백 |

## 12. 시각 품질 트랙 (신규 — "엉망" 해결의 핵심)
> 데이터 트랙(①②③)과 직교. OSM이 만든 `data[][]`에 **2차 패스로 전이타일을 입혀** 깔끔하게 만든다. Tiled 도입 없이 코드 생성 유지.

### 12.1 진짜 원인 (game.js 현 상태)
- **합성 4타일만 사용**: Boot 씬이 LPC PNG 중앙 채움타일 4개만 잘라 붙임(game.js:120-131). **전이/모서리 타일 없음** → 잔디↔물↔모래 경계가 픽셀 하드엣지로 끊김. (엉망 1순위)
- **건물이 graphics 도형**: `addBuilding`(game.js:101-113)이 삼각지붕+사각벽을 코드로 그림 → 타일과 톤 불일치.
- **장식 빈약**: 나무 graphics 1종, 벤치·표지판·간판 없음.

### 12.2 해결 방식
1. **실제 cohesive 타일셋 교체** (전이타일 포함):
   - 1순위 **Kenney**(CC0, 출처표기 불필요) — `Kenney "Tiny Town" / "Roguelike/RPG pack"` 32px top-down.
   - 또는 기존 **LPC 터레인 전이셋** 확장(이미 `assets/external_v2` 사용 중, CC-BY-SA → 출처표기). 일관성 위해 한 출처로 통일 권장.
2. **autotile 2차 패스** — 래스터화된 `data[][]`에서 각 타일의 4/8방향 이웃을 보고 모서리·전이 타일 인덱스 선택:
   - 잔디↔물(해안선·호수변), 잔디↔모래, 길 가장자리/교차, 숲 경계.
   - 16-case(4방향) 룩업으로 시작, 부족하면 47-case(Wang/blob)로 확장. 미스 시 기본 채움타일 폴백.
3. **건물 = 타일/스프라이트로 교체** — `addBuilding` graphics 제거, 타일셋의 건물 스프라이트(학교/도서관/시장/집) 배치. 장소 color는 라벨 배경에만 유지.
4. **구역별 시각 규칙(팔레트)** — 외부 분석 채택: 바다=파랑 / 호수=연파랑·초록 / 생활=베이지·회색 / 시장=따뜻한 색 / 산·숲=초록·갈색. OSM 영역에 매핑.
5. **장식 타일** — 나무(숲), 벤치·표지판(놀이터·길), 간판(시장)으로 생활감.
6. **(선택) fog + 점진적 해금** — 외부 분석의 좋은 신규 아이디어. 미발견 영역 흐림 + 미션 완료 시 다음 장소 해금(집·학교 → 도서관·청초호 → 시장 → 해변). 탐험감↑. MVP 범위 밖이면 후순위.

### 12.3 데이터 트랙과의 통합 지점
- `worldDef()`: ①②③로 `data[][]`(타일종류=grass/water/sand/road) 생성 → **그 위에 §12.2-2 autotile 패스**로 실제 타일 인덱스 확정.
- Boot 씬(game.js:118-144): 합성 4타일 생성 로직 → 실 타일셋 spritesheet 로드로 교체. 타일 인덱스 매핑 테이블 필요.
- 건물: `def.buildings` 순회 시 `addBuilding`(graphics) → 건물 스프라이트 배치로 교체.

## 12.5 건물 내부맵 (장소 상세) — 쯔꾸르(RPG Maker) 수준 목표
> 사용자 품질 기준: **공개된 RPG Maker 게임 수준의 내부.** 현재 `placeDef()`(game.js:64-91)는 6곳이 사실상 동일한 빈 상자(`buildings:[]`, 바닥+모래테두리+나무2개+NPC)라 디자인 부재. 이걸 교체한다.

**핵심 원칙 — 월드와 내부 모두 자동 생성(에이전트 제작):**
| | 월드맵 | 건물 내부 |
|---|---|---|
| 실데이터 | 있음(OSM) → 데이터 자동생성 | 없음(가상) → **에이전트가 레이아웃 생성** |
| 도구 | build-map.mjs+autotile | **에이전트 제작 prop-list/타일 레이아웃** (Tiled 수작업 아님) |
| 품질 기준 | 방위·비율 느낌 | **유명 2D RPG처럼 한눈에 알아보이는 수준**("쯔꾸르 수준"=인식 품질, 작업방식 아님) |

→ 사용자 명시: 손 수작업(Tiled) 아님. **에이전트가** 도서관=도서관, 학교=학교로 즉시 읽히도록 타일셋+배치 규칙으로 생성.

**품질(인식성) 요구사항:**
1. **RPG 타일셋 + 가구/소품 타일** — 책장·책상·의자·카운터·진열대·러그·창문·칠판. **LPC 권장**(JRPG 감성, 이미 `assets/external_v2`로 사용 중, 인테리어 타일 풍부, CC-BY-SA 출처표기).
2. **벽·바닥 autotile** — 방 가장자리 벽 타일·모서리 처리로 "빈 상자"를 "방"으로.
3. **장소별 인식 가능 레이아웃을 에이전트가 생성** — 유명 게임의 방 구성 관습(책장은 벽면, 계산대는 입구 근처 등)을 참고해 각 내부를 알아보이게 배치. 결정적 생성(좌표 고정) → diff/검토 가능.

**내부 사물 = lookMission 항목 재사용(일석이조):** 화면이 곧 "사진 속 찾기 미션"과 일치.
| 장소 | 내부에 놓을 사물(=lookMission) |
|------|------|
| 도서관 | 책장·어린이실 러그·의자·그림책·대출카운터 |
| 학교 | 교문·운동장·교실창문·국기게양대·책상 |
| 마트 | 우유·과일 진열대·장바구니·계산대 |
| 어린이집 | 미끄럼틀·블록·그림책·신발장·낮잠매트 |
| 놀이터 | 미끄럼틀·그네·모래밭·벤치·호수변 |
| 시장 | 닭강정 좌판·간판·골목 차양·장바구니 |

**저장/분리:** 각 내부맵은 독립 디자인 아티팩트로 분리 — `data/interiors/<placeId>.map.json`(Tiled 호환) 또는 `places.js`의 `interior` prop-list. `placeDef()` 절차생성 → 디자인 파일 로드로 교체. (사용자가 처음 제기한 "분리해야 안정"의 자연스러운 형태)

**승인된 범위:** 사용자 결정 = **6곳 전부 에이전트가 제작**(샘플-먼저 권장은 사용자가 명시적으로 기각). 6개 내부는 서로 독립이라 병렬 제작 적합. 단, 공통 선행작업(인테리어 타일셋 확보, 내부맵 포맷 정의, `placeDef`→로드/렌더 교체)은 먼저 1회.

### 12.4 시각 품질 합격 기준
- [ ] 잔디·물·모래·길 경계에 전이타일이 적용되어 하드엣지가 사라진다.
- [ ] 건물이 graphics 도형이 아니라 타일셋 스프라이트로 표시된다.
- [ ] 5개 구역 팔레트가 일관 적용된다.
- [ ] 타일셋 라이선스 준수(CC0이면 무표기, LPC면 출처표기 + 라이선스 파일).
- [ ] (선택) fog/해금이 동작하거나, 미채택 시 명시.
