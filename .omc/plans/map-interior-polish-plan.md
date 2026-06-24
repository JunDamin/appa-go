# Work Plan: 맵/내부 폴리시 — 진입 검증 · 충돌 개선 · 실제 NPC

- 상태: **pending approval** (실행 승인 전까지 소스 수정/실행 없음)
- 대상: `C:\Users\user\Documents\appa_go` — 정적 Phaser3 키즈 게임 "아빠, Go!"
- 생성: 2026-06-24

## Requirements Summary
세 가지 폴리시 작업:
1. **7개 건물 내부 진입 맵이 모두 동작하는지 라이브 검증** (school·library·mart·playground·market·lake·beach).
2. **월드맵 건물 충돌 모형 개선** — 현재 손추정 사각형(`game.js` `WORLD_SOLIDS`)이 부정확.
3. **내부 NPC를 이모지(`def.npc.npc.emoji`)에서 실제 캐릭터 스프라이트로 교체** + 대화창 아바타도 실제 얼굴 PNG로, 각 방에 느낌있게 배치.

## 현재 사실 (코드/에셋 근거)
- 내부 렌더: `game.js` `createInterior()` (≈314-400). NPC를 이모지 텍스트로 그림 — `game.js:351` `this.add.text(nx,ny,def.npc.npc.emoji,...)`. 좌표 = `INTERIORS[id].npc` 비율 (`data/interiors.js`).
- 7개 내부 이미지 생성 완료: `assets/interiors/{school,library,mart,playground,market,lake,beach}.png` (OpenRouter `openai/gpt-5.4-image-2`, 2.5~3.2MB).
- 월드맵: 일러스트 `assets/world/sokcho_map.png` (1536×1024) + `WORLD_SOLIDS` 충돌 사각형 (`game.js:43-52`) + 포탈존 (`worldDef()` ≈54-63). 포탈존은 방금 280/300으로 확대(학교 진입 불가 수정).
- 캐릭터 에셋: `assets/characters/*.png` = **320×400 standee** (child/dad/duck/friend/grandpa/librarian/market_lady/seagull). `assets/avatars/*.png` = **160×160 얼굴**. 동일 8종.
- 대화창 아바타: `ui.js:54-59` 가 캔버스에 **이모지**를 그림(아바타 PNG 미사용).
- NPC↔에셋 매핑: library→librarian, playground→friend/child, market→market_lady, lake→grandpa, beach→seagull. **미보유: school(담임 선생님), mart(마트 아저씨)**.
- ⚠️ 동시성: 병렬 세션이 `game.js`/`places.js`를 편집 중 — 공유파일은 편집 전 재확인 필수.

## Acceptance Criteria (testable)
- [ ] 월드맵에서 7개 장소 모두 도로에서 접근→진입 가능(포탈 트리거됨), HUD 타이틀이 해당 장소명으로 바뀜.
- [ ] 각 내부가 해당 `assets/interiors/<id>.png` 배경으로 렌더되고, "동네로" 문으로 월드 복귀, 기존 대사→사진미션→퀘스트→보물조각 루프 회귀 없음.
- [ ] 월드맵에서 도로 위 임의 지점을 상/하/좌/우로 통과 가능(건물 외 도로에서 막히는 지점 0). 건물/물 위는 여전히 막힘.
- [ ] 내부 NPC가 이모지가 아니라 **캐릭터 스프라이트(320×400 스케일)**로 표시되고, 각 방 레이아웃의 적절한 위치(예: 도서관=카운터/책상 옆, 시장=좌판 앞)에 배치.
- [ ] 대화창 아바타가 `assets/avatars/<id>.png` 얼굴로 표시(없으면 이모지 폴백).
- [ ] school·mart NPC 스프라이트+아바타가 신규 생성되어 다른 장소와 화풍 일관.
- [ ] 에셋 누락 시 이모지/플레이스홀더로 폴백(오프라인·정적 유지). 런타임 네트워크 0.

## Implementation Steps

### WS1 — 진입 검증 (먼저)
1. 로컬 서버 + Playwright(경합 해제 후)로 `모험 시작` → 월드맵. `Phaser.GAMES[0].scene.getScene('Explore')`로 상태 점검.
2. 7개 장소 각각: 포탈 도달→진입→배경 렌더→대사 트리거→"동네로" 복귀 확인. 스크린샷 7장.
3. 콘솔 에러 수집(특히 이미지 404/로더 에러). 실패 장소 목록화.
4. 산출: `.omc/handoffs/interior-verify.md` (장소별 PASS/FAIL + 스크린샷 경로).

### WS2 — 월드 충돌 개선
- **권장(B): 코스 충돌 그리드** — 일러스트를 보고 `data/worldmask.js`에 `globalThis.WORLDMASK` = 24×16(또는 32×21) 셀의 walkable/blocked 배열을 손작성. `createImageWorld()`가 `WORLD_SOLIDS` 대신(또는 병행) 이 그리드로 정적 충돌 바디 생성. 도로/곡선 호수/해안을 사각형보다 정확히 반영, 튜닝 쉬움.
- **대안(A): 사각형 정밀화** — `WORLD_SOLIDS`를 일러스트 측정값으로 재조정(곡선은 사각형 2~3개로 근사). 신기술 없음, 정확도 한계.
- 단계: (a) 접근 택1, (b) `game.js` `createImageWorld()` 충돌 생성부(≈276-282) 수정, (c) 포탈존은 충돌과 분리 유지(이미 확대됨), (d) 도로 전 구간 통행 + 건물/물 차단 시각 검증.

### WS3 — 실제 NPC + 아바타
1. **Boot preload**: NPC 스프라이트/아바타 PNG를 필요 장소만 로드(또는 createInterior 온디맨드, 이미지 백드롭과 동일 패턴). 320×400은 `setDisplaySize`로 방 비례 축소(예: 화면 높이의 ~28%).
2. **createInterior NPC 교체** (`game.js:349-355`): 이모지 텍스트 → `this.add.image(nx,ny,'npc-'+id)` (스프라이트). 이름 라벨/근접 트리거/bob tween 유지. 에셋 없으면 이모지 폴백.
3. **NPC 위치 미세조정** (`data/interiors.js` 각 `npc{x,y}`): 생성된 방 그림에 맞춰(도서관 카운터, 교실 교탁, 시장 좌판, 마트 계산대, 놀이터 그네 옆, 호수 벤치, 해변 모래) 배치.
4. **대화창 아바타** (`ui.js:54-59`): 이모지 fillText → `assets/avatars/<placeId 또는 npcKey>.png` `drawImage` (없으면 이모지 폴백). 매핑 테이블.
5. **누락 에셋 생성**: `generate-assets.mjs`에 캐릭터 standee(320×400)+avatar(160×160) 잡 추가 — school(담임 선생님: 친근한 한국 초등 담임), mart(마트 아저씨: 앞치마 마트 직원). 기존 화풍(STORYBOOK) 일관. OpenRouter `openai/gpt-5.4-image-2`. (duck은 호수 앰비언트로 선택 사용)

## Risks & Mitigations
| 리스크 | 완화 |
|--------|------|
| 320×400 standee가 탑다운 방과 원근 불일치(서 있는 정면 vs 위에서 본 방) | 그림자 타원 + 하단 정렬 + 적당 축소로 "세워둔 캐릭터" 느낌 허용(키즈게임 관용). 부자연스러우면 standee를 탑다운용으로 재생성 |
| 공유파일(game.js/places.js/ui.js) 동시 편집 충돌 | 편집 직전 재읽기, 타깃 최소 edit, 한 세션이 game.js 소유하도록 조율 |
| 신규 생성 캐릭터 화풍 불일치 | 기존 standee 1장을 레퍼런스로 프롬프트에 스타일 기술, 1장 먼저 생성→육안 승인 후 진행 |
| Playwright 경합으로 검증 불가 | 병렬 세션 완전 종료 후 단독 점유, 또는 사용자가 직접 확인 |
| 충돌 그리드 수작업 부정확 | 그리드 위 디버그 오버레이(개발용)로 시각 확인 후 셀 조정 |

## Verification Steps
1. `node --check` (game.js, ui.js, data/*.js, generate-assets.mjs).
2. Playwright: 7개 장소 진입 + 스크린샷, 콘솔 에러 0(이미지 404 제외 폴백 정상).
3. 월드 도로 통행 walk-through(상/하/좌/우), 건물/물 차단 확인.
4. NPC 스프라이트 표시 + 대화창 아바타 표시 스크린샷.
5. 전체 루프 1회 완주(한 장소: 진입→대사→사진미션→조각→복귀) 회귀 확인.
6. 런타임 네트워크 0건(정적) 확인.

## 권장 실행 순서
WS1(검증) → WS3-5(누락 캐릭터 1장 생성·승인) → WS3(NPC/아바타 교체) → WS2(충돌 그리드) → 재검증.
