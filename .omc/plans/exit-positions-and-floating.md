# 아빠, Go! — 퇴장 위치(건물 입구 앞 타일) + 플로팅 마무리

- 상태: **pending approval**
- 대상: `C:\Users\user\Documents\appa_go\game.js` (단일 파일)

## Context
장소에서 "동네로" 나가면 현재 모든 장소가 `fromWorld = { x: wl.x, y: wl.y + 180 }`(game.js:77, 102)로 복귀한다. 이건 (1) 건물 중심 아래 일률 오프셋이라 일부 장소는 **물/다른 건물/지도 밖**에 떨어질 수 있고, (2) 사용자 요구("들어간 건물 입구 타일 바로 전으로 나와야 한다")와 맞지 않는다. 또한 월드 부유 요소(새/동물)는 비활성화했으나 내부 NPC 스프라이트의 bob 트윈이 남아 "둥둥" 느낌을 준다.

## 요구사항
1. **퇴장 위치 = 들어간 건물의 입구 바로 앞 타일.** 원래(스폰) 위치가 아니라, 그 건물 입구 직전 지점으로 복귀. 7개 장소 전부 개별 지정.
2. 복귀 지점은 **진입 트리거 존(반경 ~140px) 밖 + 걷기 가능한 도로 위**(건물 solid·바다·호수 위 금지)여야 즉시 재진입(무한순환)·끼임이 없다.
3. **플로팅 마무리**: 월드 부유 요소 비활성 유지 + 내부 NPC의 떠다니는 bob 제거(서 있는 정적 캐릭터).

## 구현 (game.js)
### 1. 장소별 퇴장 좌표 맵 추가 (WORLD_LOC 옆, ~line 41)
```js
// 각 건물 "입구 앞" 복귀 지점(비율). 진입존 밖 + 도로 위가 되도록 일러스트 기준으로 지정.
const WORLD_EXIT = {
  school:     WL(0.43, 0.36),
  library:    WL(0.66, 0.36),
  playground: WL(0.60, 0.58),
  market:     WL(0.30, 0.60),
  mart:       WL(0.52, 0.60),
  lake:       WL(0.66, 0.74),
  beach:      WL(0.82, 0.52),
};
```
(초기값. 실행 시 렌더된 `sokcho_map.png` 위에서 각 점이 도로 위·존 밖인지 브라우저로 확인 후 미세조정.)

### 2. placeDef 복귀 스폰을 WORLD_EXIT 사용으로 교체 (game.js:76-77, 101-102 두 분기)
```js
const wl = WORLD_LOC[place.id] || WORLD_HOME;
const fromWorld = WORLD_EXIT[place.id] || { x: wl.x, y: wl.y + 180 }; // 입구 앞 타일(없으면 폴백)
```

### 3. 복귀 직후 재진입 방지 보강 (이미 있음, 확인)
- `portalArmed = !this.spawnOverride` + 400ms 잠금 유지(game.js createImageWorld).
- WORLD_EXIT가 존(반경~140) 밖이므로, armed 이후에도 자동 overlap 진입이 안 일어남.

### 4. 내부 NPC 플로팅 제거 (createInterior, NPC 렌더 ~line 374-386)
- 스프라이트 분기의 `this.tweens.add({ targets: em, y: ny-4, ... })` **제거** → NPC가 떠다니지 않고 바닥에 고정.
- 이모지 폴백은 이미 정적(트윈 없음) — 유지.

## Critical files
- `C:\Users\user\Documents\appa_go\game.js` — `WORLD_LOC`/신규 `WORLD_EXIT`(~33-42), `placeDef`(76-79, 101-103), `createInterior` NPC 렌더(~374-386). **이 파일만.**

## Acceptance Criteria
- [ ] 7개 장소 각각: 진입 → "동네로" → **그 건물 입구 앞 도로**로 복귀(원위치/물/건물 위 아님).
- [ ] 복귀 직후 가만히 있어도 **재진입 안 됨**(무한순환 0).
- [ ] 복귀 지점에서 사방 이동 가능(끼임 없음).
- [ ] 내부 NPC가 **떠다니지 않음**(정지), 월드맵에 떠다니는 새/동물 없음.
- [ ] `node --check game.js` 통과, 콘솔 에러 0.

## Verification
1. `node --check game.js`.
2. Playwright `http://localhost:5500` → 각 장소 탭 진입 → "동네로" → 복귀 좌표 스크린샷으로 도로 위·존 밖 확인. 가만히 1초 둬서 재진입 없음 확인.
3. 7개 순회 + 콘솔 에러 0.
4. 내부 진입 시 NPC 고정(스크린샷), 월드 부유 요소 없음.

## Risks & Mitigations
| 리스크 | 완화 |
|--------|------|
| WORLD_EXIT 초기값이 물/건물 위 | 렌더 위 좌표 검증 후 미세조정(브라우저) |
| 존 반경과 EXIT 거리 부족 | 존 280/2=140px보다 충분히 떨어뜨림(≥0.14 비율) |
| 장소별 입구 방향 상이(좌/우/위) | 일러스트 기준 개별 지정(위 표는 입구 방향 반영) |
