# Deep Interview Spec: 아빠, Go! — 맵 실제 데이터(OSM) 연계

## Metadata
- Interview ID: appa-go-real-map-data
- Rounds: 2 (+ Round 0 topology)
- Final Ambiguity Score: 16.6%
- Type: brownfield (기존 정적 웹게임 "아빠, Go!")
- Generated: 2026-06-24
- Threshold: 0.2
- Threshold Source: default
- Initial Context Summarized: no
- Status: PASSED (ambiguity ≤ threshold)

## Clarity Breakdown
| Dimension | Score | Weight | Weighted |
|-----------|-------|--------|----------|
| Goal Clarity | 0.82 | 0.35 | 0.287 |
| Constraint Clarity | 0.88 | 0.25 | 0.220 |
| Success Criteria | 0.78 | 0.25 | 0.195 |
| Context Clarity | 0.88 | 0.15 | 0.132 |
| **Total Clarity** | | | **0.834** |
| **Ambiguity** | | | **0.166 (16.6%)** |

## Goal
현재 `game.js`의 `worldDef()`가 **손으로 흉내 낸** 속초 월드맵(하드코딩된 원/사각형 해안·호수·숲, spawn→장소 직선 도로)을, **OpenStreetMap 실제 지리 데이터를 빌드타임에 1회 수집**해 만든 정적 데이터로 구동하도록 재설계한다. 실제 속초의 **방위·비율 "느낌"**(동=동해, 중앙=청초호, 북동=영랑호, 서=설악산, 남=조양동 신시가지, 주요 도로망)을 반영하되, 5~9세 걷기 동선을 위해 **약간의 변형은 허용**한다. 런타임은 기존대로 100% 정적·키없음·오프라인을 유지한다.

## Topology
| Component | Status | Description | Coverage / 합격 기준 |
|-----------|--------|-------------|----------------------|
| ① 실제 지형 형상 | active | 해안선·청초호·영랑호·설악산 숲 + **주요 도로망**을 OSM 데이터로 래스터화 | 동/중앙/북동/서 방위가 실제와 일치, 주요도로 1~2개 줄기가 보임 |
| ② 실제 장소 좌표 | active | 6개 장소(학교·어린이집·도서관·마트·놀이터·시장)를 실제 위경도→타일 좌표로 배치 | 6장소 모두 진입 가능, 상대 방위 실제와 일치, 걷기 동선 유지 |
| ③ 데이터 파이프라인/소스 | active | OSM Overpass API를 **빌드타임 Node 스크립트**로 1회 fetch→정적 JSON 커밋 | 런타임 네트워크 0, 키 0, 결과 JSON이 repo에 커밋됨 |

(deferred: 없음 — 3개 전부 핵심)

## Constraints
- **런타임 정적 유지**: 서버·로그인·런타임 API·API키 없음, 오프라인 동작. (기존 spec 제약 보존)
- **데이터 수집은 빌드타임/개발시점 1회**: 기존 `generate-assets.mjs`와 동일한 Node 스크립트 패턴.
- **데이터 소스 = OpenStreetMap**(Overpass API). 키 불필요·무료. 라이선스 ODbL → 출처표기("© OpenStreetMap contributors") 필요.
- **정확도 합격선 = "느낌"**: 실데이터 기반이되 완전 일치 불필요, 게임성 위해 약간 변형 허용.
- **게임성 우선 충돌 해소**: 실좌표가 너무 뭉치거나 멀면 방위·비율은 유지한 채 재배치/간격 보정 허용.
- 기존 타일 시스템 보존: 44×38 그리드, 4종 합성 타일(0=grass,1=water,2=sand,3=road), `collide=[water]`.
- 기존 데이터 계약 보존: `data/places.js`의 장소 객체 스키마(특히 게임 로직이 읽는 필드)는 유지. `world{x,y}`는 실데이터 유래 값으로 **갱신**.

## Non-Goals
- 런타임 지도/로드뷰 API 연동, 실시간 GPS.
- 실제 위성/지도 타일 이미지를 배경으로 까는 것(토폴로지 4번 옵션 — 미채택).
- 픽셀 단위 측량 정확도(건물 footprint, 정밀 도로 차선 등).
- 설악산 전체를 스케일대로 담기(서쪽 가장자리 숲 띠로 암시).

## Acceptance Criteria (testable)
- [ ] 빌드타임 스크립트(`build-map.mjs` 가칭)가 OSM Overpass에서 속초 bbox 데이터를 fetch하여 `data/geo.json`(정적)을 생성·갱신한다. 런타임 코드는 이 파일만 읽는다.
- [ ] 생성된 `data/geo.json`이 다음을 포함: 해안선/바다 영역, 청초호·영랑호 폴리곤, 주요 도로 폴리라인(1~2개 줄기), 6개 장소의 위경도, 설악산/숲 영역 힌트, 사용한 bbox.
- [ ] `worldDef()`가 `data/geo.json`을 읽어 44×38 타일을 생성한다. 하드코딩된 `lakeC/yeongC/x>=40` 도형이 데이터 기반 래스터화로 대체된다.
- [ ] 위경도→타일 투영: bbox(6장소+동해 동쪽+설악 서쪽 가장자리를 감싸는 게임권역) 정규화 후 44×38 그리드에 매핑하는 결정적 함수가 존재.
- [ ] 방위 검증: 동쪽 가장자리=바다, 중앙=청초호, 북동=영랑호, 서쪽=숲(설악), 남쪽=조양동 주거(우리 집 spawn)가 실제 속초 방위와 일치.
- [ ] 6개 장소가 모두 맵 내 도달 가능 위치에 배치되고, 최소 간격 보정으로 겹치지 않으며, 기존 터치/조이스틱 이동으로 모두 진입 가능.
- [ ] 주요 도로가 spawn 직선 L자가 아니라, 실제 도로망 줄기를 따라가는 형태로 보인다(약간 변형 허용).
- [ ] OSM 출처표기("© OpenStreetMap contributors")가 크레딧/결과 화면 또는 README에 추가된다.
- [ ] 런타임에 네트워크 요청 0건(정적 검증): 게임 플레이 중 OSM/외부 호출 없음.
- [ ] 기존 게임 루프(대사·음성·사진미션·보물조각·결과)가 그대로 동작(회귀 없음).

## 권장 설계 (어떤 방식이 가능한가 — 핵심 답)
**빌드타임 OSM prebake → 정적 GeoJSON → 데이터 주도 worldDef()** 3단 파이프라인:

1. **수집 (빌드타임, 1회)** — `build-map.mjs`(Node):
   - 속초 bbox 결정(예: 대략 lat 38.17~38.23, lng 128.55~128.62 — 게임권역; 실행 시 6장소를 모두 포함하도록 확정).
   - Overpass QL 쿼리: `natural=coastline`, `natural=water`/`water=lake`(청초호·영랑호), `highway=primary|secondary|trunk`(주요도로), `natural=wood`/`landuse=forest` 및 `place`/`amenity`(설악 방면), 6개 장소 POI(`amenity=school|library|kindergarten`, `shop=supermarket`, `leisure=playground`, `amenity=marketplace` 또는 명시 좌표).
   - 결과를 단순화(좌표 다운샘플)하여 `data/geo.json`으로 저장 + 출처/타임스탬프 메타.
2. **투영 (결정적 함수)** — `lonLatToTile(lon,lat)`:
   - bbox를 [0,cols)×[0,rows)로 정규화(Web Mercator 불필요, 소규모 영역은 선형 근사로 충분).
   - 종횡비 보정으로 비율 "느낌" 유지.
3. **래스터화 (`worldDef()` 교체)**:
   - 바다: 해안선 동쪽/폴리곤 내부 → `T.water`, 해안 한 줄 → `T.sand`.
   - 호수: 청초호·영랑호 폴리곤 → `T.water`(point-in-polygon).
   - 도로: 주요 도로 폴리라인을 타일로 그리기(브레젠험), 기존 spawn→장소 직선 도로는 보조로만.
   - 숲: 서쪽 wood/forest 영역 → 나무 분포.
   - 장소: POI 위경도→타일, 최소 간격 보정 후 `places.js`의 `world{x,y}` 갱신(또는 런타임 주입).

> 대안(수동 1회 측정)도 가능하나 사용자가 "OSM으로 지금 조사" 선호 → OSM prebake 채택. 런타임 fetch는 정적 제약 위반으로 기각.

## Technical Context (기존 코드 연결점)
- `game.js:28-62` `worldDef()` — 교체 대상(하드코딩 도형 → 데이터 래스터화).
- `game.js:44-50` `road()` + `PLACES.forEach(road...)` — 직선 L자 도로, 주요도로 래스터화로 대체/보강.
- `game.js:17-20` 합성 tileset 인덱스(grass/water/sand/road) — 재사용.
- `data/places.js` `world{x,y}` (학교 20,32 / 시장 22,11 등) — 실데이터 유래 값으로 갱신.
- `generate-assets.mjs` — 빌드타임 Node+`.env` 패턴 선례(동일 패턴으로 `build-map.mjs` 추가).
- `DESIGN.md:10` 이미 "OSM/행정동 기준" 의도 명시 — 본 작업이 그 의도의 실제 구현.

## Ontology (Key Entities)
| Entity | Type | Fields | Relationships |
|--------|------|--------|---------------|
| GeoSource(OSM) | external system | overpassQuery, bbox, license | feeds GeoData |
| GeoData(geo.json) | core domain | coastline, lakes[], roads[], forest, places[], bbox, meta | prebaked from GeoSource, read by worldDef |
| BBox | supporting | minLon,minLat,maxLon,maxLat | normalizes Projection |
| Projection | core domain | lonLatToTile() | maps GeoData → TileGrid |
| TileGrid | core domain | cols=44, rows=38, data[][] | rendered by Explore scene |
| Coastline/Lake/Road/Forest | supporting | polyline/polygon points | rasterized into TileGrid |
| PlaceCoord | core domain | placeId, lon, lat → world{x,y} | replaces manual coords in places.js |

## Ontology Convergence
| Round | Entity Count | New | Changed | Stable | Stability |
|-------|-------------|-----|---------|--------|-----------|
| 0 (topology) | 3 comp | - | - | - | - |
| 1 | 6 | 6 | - | - | N/A |
| 2 | 7 | 1 (Projection) | 0 | 6 | 86% (수렴 중) |

## Interview Transcript
<details>
<summary>Full Q&A (Round 0 + 2 rounds)</summary>

**Round 0 (토폴로지):** 3개 구성요소(지형형상 / 장소좌표 / 데이터파이프라인) → "3개 모두 맞음" + 추가: "주요 도로도 실제 느낌으로".

**Round 1 (③ Constraint — 소스/타이밍):** 어디서·언제 데이터 조달? → "지금 한 번 조사해서, 속초 자료 받아 찾자" = 빌드타임 1회 수집, 런타임 정적 유지. 이후 "openstreetmap 안돼나?" → OSM 확정.

**Round 2 (①② Success Criteria — 정확도 vs 게임성):** 충돌 시 우선순위? → "실제 방위·비율 '느낌'만(권장)" + "완전 똑같진 않아도 실데이터 기반 약간 차이 OK" = 느낌-충실도 합격선.

</details>
