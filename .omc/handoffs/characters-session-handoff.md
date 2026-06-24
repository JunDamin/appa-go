# Handoff: characters 세션 → game / ui / data-assets / 통합

**세션**: 캐릭터 디자인·인터랙션 (`session/characters`)
**소유(신규, 충돌 없음)**: `data/characters.js`, `characters.js`, `assets/characters/`
**상태**: 데이터·런타임 작성 완료. `node --check` 통과, 로직 하네스 **16/16 PASS**.
계획: `.omc/plans/sokcho-character-design-plan.md`.

## 제공한 것
- `data/characters.js` → `globalThis.CHARACTERS_DATA` (9 캐스트 + 5 앰비언트 + 인상 4단계 + 이스터에그).
- `characters.js` → `window.CHARACTERS` 런타임(아래 계약). 에셋 없으면 emoji 폴백.
- `assets/characters/CHARACTER_JOBS.md` → gpt-image-2 생성 잡 스펙(23장).

## `window.CHARACTERS` 계약 (소비자가 호출)
| API | 호출 세션 | 설명 |
|-----|----------|------|
| `CHARACTERS.preload(scene)` | game (Boot.preload) | 토큰 PNG 로드. 누락은 무시(폴백) |
| `CHARACTERS.makeNPC(scene,{id,x,y,height,flip})` | game | 일러스트 토큰 NPC 생성(그림자+bob+flip). `{node,shadow,setFlip,moveTo,destroy}` 반환 |
| `CHARACTERS.spawnAmbient(scene,{waypoints,timeOfDay,max,height})` | game | 배회 주민 루틴 이동. `waypoints`={regionKey:{x,y}} (game이 맵 좌표 제공), `timeOfDay`='morning'/'day'/'evening' |
| `CHARACTERS.spawnCrowd(scene,{placeId,center,radius,onLead,height})` | game | **장소마다 여러 명**(lead 1 + extras N) 배치. `onLead(tok,id)`로 대표 인물 상호작용 연결. "사람 많은 동네" 느낌 |
| `CHARACTERS.crowdFor(placeId)` | game | 군중 구성 {lead, extras[]} 조회 |
| `CHARACTERS.welcomeCrowd(scene,crowd,placeId)` | game | **도착 환영** — 스폰된 군중이 인사 말풍선 + 통통 튀며 반겨줌. spawnCrowd 직후 호출 |
| `CHARACTERS.spawnWorldLife(scene,{width,height,waypoints?})` | game | **월드맵 생활** — 나는 새(하늘) + 배회 강아지/고양이(땅) (+waypoints 주면 routine 사람도). 월드맵 진입 시 1회 |
| `CHARACTERS.spawnBirds/spawnRoamers(scene,{width,height,count})` | game | 새/동물만 개별 스폰 |
| `CHARACTERS.topics(id)` / `topicsForPlace(placeId)` | ui | **선택지 대화** [{q,a}] — 아이가 q를 버튼으로 고르면 a(속초 소개·생활 안내) 표시. 다 물어보면 `advanceImpression` 권장 |
| `CHARACTERS.portrait(id,expr)` | ui | `{src,emoji}` 반환. `<img src>` 시도 후 onerror→emoji 폴백 |
| `CHARACTERS.impressionLine(id)` / `advanceImpression(id)` | ui | 인상 단계 대사 / 단계 진행 |
| `CHARACTERS.impressionIcon(id)` / `impressionLabel(id)` | ui | 머리 위 ❓🙂😊💛 / 라벨 |
| `CHARACTERS.impressionCard(id)` | ui | 친해짐(3) 시 인상 카드 반환 |
| `CHARACTERS.onImpressionChange(cb)` | ui | 인상 변동 콜백 |
| `CHARACTERS.easterEgg(id)` | ui | 친해짐 단계에서 태초마을 1회 반환 |
| `CHARACTERS.realFact(id)` | ui | 인물별 실제 속초 사실 1줄 |
| `CHARACTERS.forPlace(placeId)` / `idForPlace(placeId)` | ui, game | places.js 장소 id → 그 장소 인물(또는 id). school/daycare/library/mart/market/playground/pharmacy 매핑 |
| `CHARACTERS.allFriends()` / `resetImpressions()` | ui | 정착 완료 판정 / 초기화(UI.reset에서 호출) |

## 연동 작업 (각 소유 세션이 수행)
1. **통합/공유** — `index.html`에 스크립트 2줄 추가(순서: `places.js` 뒤, `ui.js`/`game.js` 앞):
   ```html
   <script src="data/characters.js"></script>
   <script src="characters.js"></script>
   ```
   → SHARED-LOCKS.md 점유 후 통합 세션이 추가.
2. **session/game (`game.js`)** — Boot.preload에 `CHARACTERS.preload(this);` 1줄. NPC/플레이어 생성부를 `CHARACTERS.makeNPC(this,{id,x,y})`로. 월드 진입 시 `CHARACTERS.spawnAmbient(this,{waypoints,timeOfDay})` 호출 — `waypoints`는 home/school/library/market/mart/playground/lake 구역 중심 좌표 맵을 game이 제공.
3. **session/ui (`ui.js`)** — `drawAvatar()`를 `CHARACTERS.portrait(id,expr)` 이미지로(없으면 이모지). 대화 흐름에 인상 단계 적용: 대사=`impressionLine`, 종료 시 `advanceImpression`, 머리 위 `impressionIcon`, 친해짐 시 `impressionCard`/`easterEgg`. `realFact`를 사진 카드와 함께.
4. **session/data-assets (`generate-assets.mjs`)** — `assets/characters/CHARACTER_JOBS.md`의 배열을 추가, `generate()`가 `job.model`(="gpt-image-2") 적용하도록, `node generate-assets.mjs characters` 실행. 맵(`sokcho_map.png`)을 톤 레퍼런스로.

## ⚡ game.js 즉시 적용 스니펫 (소비측 연결 — game 세션이 붙여넣기)
캐릭터 토큰 20종은 `assets/characters/<id>_token.png`로 **생성·배경제거·커밋 완료**. 아래 3곳만 고치면 화면에 나타남:

1) **장소 NPC를 새 동화풍 토큰으로** (game.js:15 NPC_SPRITE 교체 + :145 로드 경로 `_token.png`):
```js
const NPC_SPRITE = { library:"librarian", playground:"friend", market:"market_aunt", lake:"grandpa", beach:"gull", school:"teacher", mart:"mart_keeper", daycare:"daycare_teacher" };
// Boot.preload:
Object.entries(NPC_SPRITE).forEach(([id,key]) => this.load.image("npc-"+id, "assets/characters/"+key+"_token.png"));
if (window.CHARACTERS) CHARACTERS.preload(this);   // 캐릭터 토큰 일괄 로드(누락은 무시)
```
2) **월드맵에 새·동물** (createImageWorld 끝부분, W/H 이미 정의됨):
```js
if (window.CHARACTERS) CHARACTERS.spawnWorldLife(this, { width: W, height: H });
```
3) (선택) **장소 도착 환영·군중**: createImageWorld portal 진입 또는 장소 씬에서
```js
const crowd = CHARACTERS.spawnCrowd(this, { placeId, center:{x,y} });
CHARACTERS.welcomeCrowd(this, crowd, placeId);
```
> 토큰 파일이 있으면 자동 사용, 없으면 이모지 폴백 — 안전. (모두 존재함)

## 통합 세션에 요청
- CLAUDE.md §1 소유표에 행 추가: `session/characters | characters.js, data/characters.js, assets/characters/`.
- CLAUDE.md §2 계약표에 `window.CHARACTERS` 등재(제공: characters.js / 소비: game.js, ui.js).
