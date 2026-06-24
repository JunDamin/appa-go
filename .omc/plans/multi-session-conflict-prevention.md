# 멀티 세션 충돌 방지 플랜 (appa_go)

> 상태: **pending approval** (실행 승인 전)
> 작성일: 2026-06-24
> 대상: 4개 Claude Code 세션 동시 작업, 같은 파일 동시 수정 위험, git 미도입

---

## 1. Requirements Summary (요구사항 요약)

- 4개 세션이 동시에 작동하며 **현재 같은 파일을 여러 세션이 수정** 중 → lost update / 덮어쓰기 위험.
- git 저장소가 아님 → 충돌 시 머지·롤백 등 **복구 수단이 전무**.
- 목표: (1) 변경 유실 0건, (2) 세션 간 충돌을 구조적으로 제거, (3) 충돌 발생 시 복구 가능.
- 사용자 선택: **git init + worktree로 세션별 물리 격리**, 협업 규칙을 CLAUDE.md로 문서화.

### 핵심 통찰 (아키텍처 사실)

코드는 이미 `window.*` 전역 네임스페이스로 모듈이 분리되어 있다. 이것이 그대로 **파일 소유권(ownership) 경계**가 된다.

| 파일 | 노출 계약 | 의존(읽기 전용) | 근거 |
|---|---|---|---|
| `audio.js` | `window.AUDIO` (IIFE) | 없음 | `audio.js:5` |
| `ui.js` | `window.UI` (IIFE) | `window.AUDIO` | `ui.js:6`, `ui.js:147` |
| `game.js` | `window.GAMEINPUT` | `window.UI`, `window.AUDIO`, `window.GAMEINPUT` | `game.js:260,308`; UI/AUDIO 호출 |
| `data/places.js` | 데이터 전역 | 없음 | `index.html:109` 로드 |
| `generate-*.mjs` (빌드타임) | 산출물(`data/`,`assets/`) | `.env` 키 | `generate-assets.mjs` |

> 결론: "같은 파일 동시 수정"은 **습관**이지 **필연**이 아니다. 모듈을 세션에 1:1로 배정하면 동시 수정 자체가 사라진다. 다른 모듈이 필요하면 코드를 고치지 말고 `window.*` 계약만 읽는다.

### CLAUDE.md만으로 충분한가? → 아니오

CLAUDE.md는 **규칙 안내문**일 뿐 강제력이 없다. 두 세션이 같은 파일을 같은 시점에 쓰면 나중에 저장한 쪽이 앞선 변경을 덮어쓴다(파일시스템에는 락이 없음). 따라서 방어막은 3겹으로 구성한다:

1. **구조(가장 강함)**: 파일 소유권 분리 → 동시 수정 발생 자체를 제거
2. **격리**: git worktree → 세션별 독립 작업 트리, 머지 시점까지 서로 안 보임
3. **규칙/복구**: CLAUDE.md 협업 규약 + git 히스토리 → 불가피한 공유 파일 조율 및 사고 시 롤백

---

## 2. Acceptance Criteria (검증 가능한 완료 기준)

- [ ] `git status`가 동작한다 (저장소 초기화 완료, `git rev-parse --is-inside-work-tree` → `true`).
- [ ] `git worktree list`가 **세션 수만큼(최대 4)의 worktree**를 보여준다.
- [ ] 루트에 `CLAUDE.md`가 존재하고 다음을 포함한다: ① 파일 소유권 표, ② `window.*` 계약 명세, ③ 공유 파일 락 규약, ④ 커밋/머지 프로토콜.
- [ ] 각 세션의 worktree 브랜치명이 담당 모듈과 일치한다 (예: `session/game`, `session/ui`, `session/audio`, `session/data-assets`).
- [ ] `index.html`, `style.css` 등 **공유 파일은 단일 통합 세션(integrator)만** 직접 수정하거나, 락 파일로 1회 1소유 보장.
- [ ] 첫 통합(merge) 리허설에서 충돌 0건 또는 충돌 발생 시 `git` 으로 해소·롤백됨이 확인된다.
- [ ] `.gitignore`에 빌드 산출물/대용량 에셋 정책이 반영된다 (현재 `.env`, `node_modules/`, `.DS_Store` 존재 — 생성 에셋 정책 추가 검토).

---

## 3. Implementation Steps (구현 단계, 파일 참조 포함)

### Phase 0 — 토대: git 도입 (실행 승인 후 1회, **메인 세션에서만**)
1. 다른 3개 세션을 잠시 멈추거나 저장 완료 상태로 만든다 (초기 커밋 스냅샷의 일관성 확보).
2. `git init` (루트 `C:\Users\user\Documents\appa_go`).
3. `.gitignore` 검토/보강: 현재 `.env`, `node_modules/`, `.DS_Store`. 추가 후보 — `.playwright-mcp/`, 생성 에셋(`generate-assets.mjs` 산출물)을 추적할지 결정.
4. `git add -A && git commit -m "chore: initial snapshot before multi-session work"` — **이 시점이 모든 복구의 기준점**.

### Phase 1 — 격리: worktree 세팅 (세션별)
5. 메인(통합)은 기본 브랜치(`main`)에 둔다.
6. 각 작업 세션용 worktree 생성:
   - `git worktree add ../appa_go-game   session/game`
   - `git worktree add ../appa_go-ui     session/ui`
   - `git worktree add ../appa_go-audio  session/audio`
   - `git worktree add ../appa_go-data   session/data-assets`
7. 각 세션은 **자기 worktree 디렉토리에서만** Claude Code를 실행한다 (작업 디렉토리 격리).

### Phase 2 — 규칙: CLAUDE.md 작성 (루트, main 브랜치)
8. 루트에 `CLAUDE.md` 생성. 포함 내용:
   - **(A) 파일 소유권 표** — 위 1절 표를 그대로. "당신은 한 모듈만 수정한다. 다른 모듈 파일은 읽기 전용."
   - **(B) `window.*` 계약 명세** — 각 모듈이 노출/소비하는 전역 API를 명시해, 다른 모듈을 고치지 않고 계약만 보고 호출하도록 유도:
     - `window.AUDIO` 제공: `audio.js`. 소비: `ui.js`, `game.js`.
     - `window.UI` 제공: `ui.js`. 소비: `game.js`.
     - `window.GAMEINPUT` 제공/소비: `game.js`.
     - 규칙: **계약(시그니처)을 바꾸려면 먼저 CLAUDE.md를 갱신하고 통합 세션에 알린다.**
   - **(C) 공유 파일 락 규약** — `index.html`(스크립트 로드 순서 `index.html:108-112`), `style.css`, `README.md`, `DESIGN.md`는 공유. 규칙: 직접 수정은 **통합 세션만**. 작업 세션이 꼭 필요하면 루트 `SHARED-LOCKS.md`에 `파일 / 세션 / 시작시각 / 목적` 한 줄을 커밋한 뒤 단독 점유, 완료 후 해제. (락은 커밋이 직렬화하므로 "먼저 커밋한 세션이 소유".)
   - **(D) 커밋/머지 프로토콜** — 아래 Phase 3.
   - **(E) 충돌 시 행동** — "충돌 나면 임의로 해소하지 말고 통합 세션에 보고."

### Phase 3 — 통합 워크플로우 (반복)
9. **작은 커밋 자주**: 각 세션은 의미 단위로 잦게 커밋(충돌 표면 최소화).
10. **머지 전 동기화**: 통합 전 `git fetch && git rebase main` (또는 통합 세션이 `main`으로 머지).
11. **직렬 통합**: 통합 세션이 worktree 브랜치를 **하나씩 순서대로** `main`에 머지(동시 머지 금지). 공유 파일 변경은 여기서 일괄 반영.
12. **머지 리허설**: 첫 통합은 작은 변경으로 1회 리허설하여 프로토콜이 도는지 확인.

---

## 4. Risks & Mitigations (위험과 완화)

| 위험 | 영향 | 완화 |
|---|---|---|
| worktree여도 **같은 파일** 수정 시 머지 충돌 | 통합 지연 | 파일 소유권 분리로 동시 수정 제거(1차). 불가피하면 락 규약 + 작은 커밋(2차) |
| 공유 파일(`index.html`/`style.css`) 경합 | 로드 순서/스타일 깨짐 | 통합 세션 단독 수정 또는 `SHARED-LOCKS.md` 1회1소유 |
| `window.*` **계약 변경**이 다른 모듈을 깨뜨림 | 런타임 오류 | 계약 변경 시 CLAUDE.md 선갱신 + 통합 세션 통지 + 통합 시 스모크 테스트 |
| git init 시점에 미저장 변경 존재 | 스냅샷 불일치 | Phase 0에서 전 세션 저장/정지 후 초기 커밋 |
| CLAUDE.md 규칙을 세션이 안 지킴 | 규칙 무력화 | git 격리가 안전망. 규칙 위반해도 worktree 덕에 main은 보호됨 |
| 대용량 에셋(`*.png`, `cover.png` 236KB) 잦은 커밋 | 저장소 비대 | `.gitignore`로 생성 에셋 제외 또는 통합 세션만 에셋 커밋 |
| Windows worktree 경로/락 이슈 | worktree 생성 실패 | 형제 디렉토리(`../appa_go-*`) 사용, 경로 공백 회피 |

---

## 5. Verification Steps (검증 절차)

1. `git rev-parse --is-inside-work-tree` → `true` 확인.
2. `git log --oneline -1` → 초기 스냅샷 커밋 존재 확인.
3. `git worktree list` → 세션별 worktree·브랜치 매핑 확인.
4. `CLAUDE.md` 존재 + A~E 섹션 포함 확인 (`grep -n "소유권\|window\.\|락\|머지" CLAUDE.md`).
5. **머지 리허설**: 한 세션에서 사소한 변경 커밋 → 통합 세션이 `main`에 머지 → 충돌 0건 또는 `git`으로 해소·`git reset`/`git revert` 롤백 가능 확인.
6. **스모크 테스트**: 통합 후 `node server.mjs`로 띄워 게임 로드/`window.AUDIO`·`window.UI` 동작 확인.

---

## 6. 권장안 요약 (TL;DR)

> **CLAUDE.md만으로는 못 막는다.** 순서는 (1) `git init`+초기 커밋, (2) 세션별 worktree 격리, (3) `window.*` 계약 경계대로 **모듈 1개 = 세션 1개** 소유권 분리, (4) 공유 파일은 통합 세션 단독/락, (5) 작은 커밋 + 직렬 통합. CLAUDE.md는 이 규칙을 적는 곳이고, 실제 방어는 git 격리와 소유권 분리가 한다.

---

## 7. 빌드타임 생성 파이프라인 (OpenRouter 텍스트 + OpenAI TTS) — 결정됨

> 결정: **사전생성(build-time)** 채택. 런타임 생성은 세션/플레이어 몰림 시 다운·키 노출·비용 위험이 있고, 사전생성이면 게임은 정적 파일만 읽으므로 멀티세션과 무충돌. 소유: `data-assets` 세션.

### 7.1 API 키 규약 (CLAUDE.md에 그대로 넣을 블록)

```markdown
## 외부 API 키 규약 (빌드타임 전용)

- 키 저장: 루트 `.env` (gitignore됨). 절대 커밋·하드코딩·브라우저 노출 금지.
  - `OPENAI_API_KEY`     — 이미지/TTS 생성 (generate-assets.mjs, generate-audio.mjs)
  - `OPENROUTER_API_KEY` — 텍스트 생성 (sk-or-v1- 로 시작, generate-text.mjs)
- 읽는 법: Node 스크립트에서 `process.env.OPENROUTER_API_KEY`.
- OpenRouter: `https://openrouter.ai/api/v1/chat/completions` (OpenAI 호환).
  헤더 `Authorization: Bearer ${key}`, 선택 `HTTP-Referer`/`X-Title`.
- OpenAI TTS: `https://api.openai.com/v1/audio/speech` (model `gpt-4o-mini-tts` 등) → mp3.
- 사용 규칙: 생성은 *_*.mjs 빌드타임에서만. 산출물(data/, assets/)을 커밋. 클라이언트 JS에 키 금지.
- worktree마다 `.env`가 따로 필요(추적 안 됨). 새 키/이름 변경은 통합 세션에 통지 후 이 표 갱신.
```

### 7.2 스크립트 (data-assets 세션 소유, 신규 추가)

- `generate-text.mjs` — OpenRouter 호출, 인사말/대사/장소 설명 생성 → `data/places.js` 또는 `data/content.json`.
  기존 `.env` 파서(`generate-assets.mjs:25`) 재사용.
- `generate-audio.mjs` — `data/content.json`의 문구를 OpenAI TTS로 mp3 변환 → `assets/audio/*.mp3` + `assets/audio/manifest.json`(문구→파일 매핑).

### 7.3 자연스러운 음성 적용 (계약 변경 — 통합 세션 통지 필요)

- 현재 `ui.js`는 `speechSynthesis`(기계음, `ui.js:24-33`). 사전생성 mp3 재생으로 교체하되 **실패 시 speechSynthesis 폴백**.
- 모듈 경계 영향: `audio.js`(audio 세션)에 `window.AUDIO.speak(key)` 추가 → `assets/audio/manifest.json` 조회해 mp3 재생. `ui.js`(ui 세션)는 그 계약만 호출.
- 즉 3개 세션(data-assets/audio/ui)이 얽히므로 **`window.AUDIO` 계약을 먼저 CLAUDE.md에 정의하고 직렬로 통합**.

### 7.4 검증

- `OPENROUTER_API_KEY` 누락 시 스크립트가 명확히 종료(기존 `generate-assets.mjs:69` 패턴).
- 생성 후 `git status`로 `data/`·`assets/audio/` 산출물만 변경되었는지 확인.
- `node server.mjs` → 인사 시 mp3 재생, 파일 없으면 speechSynthesis 폴백 동작 확인.

---

## 다음 단계 (실행 승인 필요)

이 플랜은 **pending approval** 상태입니다. 실행 시 Phase 0(`git init`+커밋)은 되돌리기 까다로운 1회성 작업이라 명시적 승인 후 진행합니다. 승인하시면:
- (a) Phase 0~2를 메인 세션에서 수행하고 CLAUDE.md·SHARED-LOCKS.md 초안을 생성하거나,
- (b) CLAUDE.md / CLAUDE.md+SHARED-LOCKS.md 초안만 먼저 보여드린 뒤 git 작업은 사용자가 직접 수행하도록 안내할 수 있습니다.
