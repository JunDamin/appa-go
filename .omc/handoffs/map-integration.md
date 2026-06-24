# 맵 트랙 핸드오프: 실제 OSM 데이터 → 월드맵 (game.js 통합 지침)

> 이 세션(맵 처리)이 만든 **재현 가능한 데이터 파이프라인 + 베이크 산출물**. game.js/index.html/places.js 통합은
> 동시 편집 충돌(다른 세션 + 내부맵 worker-1이 game.js/index.html/places.js를 편집 중)을 피하기 위해
> **이 문서의 지침대로 game.js 소유 세션이 적용**한다. 아래 코드/좌표는 그대로 붙여쓸 수 있게 확정돼 있음.

## 만들어진 것 (신규 파일, 충돌 없음)
- `build-map.mjs` — 빌드타임 OSM 수집기. 실행: `node build-map.mjs` (키 불필요). 산출:
  - `data/geo.json` — 검토/diff용 (해안선 4·호수 15·도로 218·숲 35, bbox 38.183~38.224 / 128.565~128.610)
  - `data/geo.js` — 동일 내용 브라우저 전역 `globalThis.GEO`
  - `data/worldmap.js` — **베이크된 44×38 타일맵** `globalThis.WORLDMAP` (런타임은 이것만 읽음)
- `data/worldgen.js` — geo→타일 래스터화기(빌드타임). `globalThis.buildWorldFromGeo` / node `require` 양용.
- 검증: ASCII 렌더로 방위 확인 완료 — 동=동해, 중앙=청초호(실제 형상, 바다와 연결까지 재현), 북=시장,
  남=조양동 생활권, 서=숲(설악 방면), 주요도로(primary/secondary)가 실제 줄기 형태로 표시.

## WORLDMAP 스키마 (data/worldmap.js)
```js
globalThis.WORLDMAP = {
  cols: 44, rows: 38,
  data: [[..tileIndex..], ...],   // 0=grass 1=water 2=sand 3=road (game.js 합성셋과 동일)
  trees: [{x,y}, ...],            // 숲(설악 방면) 나무 30개
  placesXY: { market:{x:23,y:17}, library:{x:24,y:34}, playground:{x:21,y:29},
              school:{x:19,y:32}, daycare:{x:21,y:34}, mart:{x:26,y:35} },
  spawn: { x:22, y:33 },          // 우리집(조양동 생활권 중심)
  T: { grass:0, water:1, sand:2, road:3 }
};
```

## 통합 1 — index.html (worker-1의 interiors 스크립트와 같은 위치, 추가만)
`places.js` 다음, `game.js` 이전에 한 줄 추가 (런타임은 worldmap.js만 필요; geo.js/worldgen.js는 빌드타임 전용):
```html
<script src="data/worldmap.js"></script>
```

## 통합 2 — game.js worldDef() 교체 (현 28-62라인 대체)
하드코딩 도형 생성 전체를 베이크 데이터 사용으로 교체:
```js
function worldDef() {
  const w = globalThis.WORLDMAP;
  const buildings = PLACES.map((p) => ({ x: w.placesXY[p.id].x, y: w.placesXY[p.id].y, placeId: p.id }));
  buildings.push({ x: w.spawn.x, y: w.spawn.y - 1, home: true });
  const portals = PLACES.map((p) => ({ x: w.placesXY[p.id].x, y: w.placesXY[p.id].y, to: "p_" + p.id, label: p.name }));
  // 배: 동해(동쪽 물) 위 적당한 두 곳
  const ships = [{ x: 40, y: 12 }, { x: 41, y: 26 }];
  return { id: "world", name: "속초 우리 동네", cols: w.cols, rows: w.rows,
    data: w.data, trees: w.trees, buildings, portals, ships,
    spawn: w.spawn, collide: [T.water] };
}
```
- 기존 `lakeC/yeongC/x>=40/road()/PLACES.forEach(road...)` 도형 로직은 제거.
- `T.waterAlt`는 합성셋에 water와 동일하므로 collide는 `[T.water]`로 충분(기존 `[T.water,T.waterAlt]` 유지해도 무방).
- Boot 씬의 합성 4타일/스프라이트/애니 설정은 **그대로 유지**(월드 렌더가 이 4타일을 씀).

## 통합 3 — data/places.js world{x,y} 동기화 (⚠️ 다른 세션이 편집 중)
내부맵 "동네로" 복귀 스폰이 새 건물 위치와 일치하도록, 각 장소 `world`를 아래로 맞춘다.
**주의: places.js를 다른 세션이 활발히 수정 중**(dayPhase/card 필드 추가됨) → 직접 덮어쓰지 말고 해당 세션이 반영하거나, 편집 정지 확인 후 적용.
| id | world{x,y} (실데이터 베이크값) |
|----|------------------------------|
| market | {23,17} |
| library | {24,34} |
| playground | {21,29} |
| school | {19,32} |
| daycare | {21,34} |
| mart | {26,35} |
(worldDef가 WORLDMAP.placesXY를 권위값으로 쓰면 placeDef back-portal만 place.world를 참조 — 두 값을 위 표로 일치시키면 됨.)

## 출처표기 (필수, ODbL)
README + 크레딧/결과 화면에 `지도 데이터 © OpenStreetMap contributors (ODbL)` 추가.

## 재생성 방법
```bash
node build-map.mjs   # OSM 재수집 + geo.json/geo.js/worldmap.js 재생성. bbox/앵커는 build-map.mjs 상단 상수.
```
