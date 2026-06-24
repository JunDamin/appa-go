# CLAUDE.md — appa_go 멀티 세션 협업 규약

> 이 파일은 여러 Claude Code 세션이 **동시에** 이 저장소를 작업할 때 충돌을 막기 위한 규칙이다.
> CLAUDE.md는 강제력이 없는 안내문이다. 실제 방어는 **git 격리 + 파일 소유권 분리**가 한다. 규칙을 지켜라.

## 0. 프로젝트 개요

브라우저 게임 (Phaser 3). 정적 파일로 동작하며 `node server.mjs` → http://localhost:5500 에서 확인.
스크립트 로드 순서(`index.html:108-112`): `phaser` → `data/places.js` → `audio.js` → `ui.js` → `game.js`.
모듈은 `window.*` 전역으로 통신한다 (아래 계약 참고).

## 0.1 세션 부팅 시 자기 역할 판별 (먼저 실행)

이 세션이 어떤 모듈 담당인지 **현재 worktree 브랜치로 스스로 판별**한다. 세션 시작 직후 한 번 실행:

```
git branch --show-current
```

결과 → 담당 (자세한 규칙은 §1):

| 브랜치 | 당신의 담당(수정 가능) | 그 외 파일 |
|---|---|---|
| `session/game` | `game.js` | 읽기 전용 |
| `session/ui` | `ui.js` | 읽기 전용 |
| `session/audio` | `audio.js` | 읽기 전용 |
| `session/data-assets` | `data/`, `assets/`, `generate-*.mjs` | 읽기 전용 |
| `main` | 공유 파일·머지(통합 세션) | — |

판별 후 사용자에게 "저는 `<브랜치>` = `<담당>` 세션입니다"라고 한 줄 알리고 시작한다.

## 1. 파일 소유권 (가장 중요)

**한 세션은 자기 모듈 파일만 수정한다. 다른 모듈은 읽기 전용.** 다른 모듈 기능이 필요하면 그 파일을 고치지 말고 §2의 `window.*` 계약만 호출한다.

| 세션(브랜치) | 소유(수정 가능) | 읽기 전용(수정 금지) |
|---|---|---|
| `session/game` | `game.js` | `ui.js`, `audio.js`, `data/` |
| `session/ui` | `ui.js` | `audio.js`, `data/` |
| `session/audio` | `audio.js` | — |
| `session/data-assets` | `data/`, `assets/`, `generate-*.mjs` | — |
| 통합(integrator) | 공유 파일(§3), 머지 | — |

## 2. `window.*` 계약 (모듈 간 인터페이스)

다른 모듈을 호출할 땐 아래 계약만 사용한다. **계약(시그니처)을 바꾸려면 먼저 이 표를 갱신하고 통합 세션에 통지**한 뒤, 직렬로 통합한다.

| 전역 | 제공 | 소비 | 비고 |
|---|---|---|---|
| `window.AUDIO` | `audio.js:5` | `ui.js:147`, `game.js` | 효과음. (예정) `AUDIO.speak(key)`로 사전생성 mp3 재생 |
| `window.UI` | `ui.js:6` | `game.js` | UI/말풍선/음성 |
| `window.GAMEINPUT` | `game.js:308` | `game.js:260` | 조이스틱 입력 `{x,y}` |

## 3. 공유 파일 락 규약

다음은 어느 모듈에도 속하지 않는 공유 파일이다: `index.html`, `style.css`, `README.md`, `DESIGN.md`, `.gitignore`, 이 `CLAUDE.md`.

- 원칙: **공유 파일 직접 수정은 통합 세션만** 한다.
- 작업 세션이 꼭 수정해야 하면 루트 `SHARED-LOCKS.md`에 한 줄(`파일 | 세션 | 시작시각 | 목적`)을 **커밋**한 뒤 단독 점유하고, 끝나면 해제 커밋한다. 커밋이 직렬화하므로 **먼저 커밋한 세션이 소유**한다.

## 4. 커밋 / 머지 프로토콜

1. **작은 단위로 자주 커밋** (충돌 표면 최소화).
2. 머지 전 동기화: `git fetch && git rebase main`.
3. **직렬 통합**: 통합 세션이 worktree 브랜치를 **하나씩 순서대로** `main`에 머지한다(동시 머지 금지).
4. 충돌이 나면 임의로 해소하지 말고 **통합 세션에 보고**한다.
5. 첫 통합은 사소한 변경으로 1회 리허설해 프로토콜이 도는지 확인한다.

## 5. 외부 API 키 규약 (빌드타임 전용)

생성은 **빌드타임 Node 스크립트에서만** 한다(런타임/브라우저 생성 금지 — 키 노출·세션 몰림 위험). 산출물(`data/`, `assets/`)을 커밋한다.

- 키 저장: 루트 `.env` (`.gitignore`됨). **절대 커밋·하드코딩·클라이언트 JS 노출 금지.**
  - `OPENAI_API_KEY` — 이미지/TTS (`generate-assets.mjs`, `generate-audio.mjs`)
  - `OPENROUTER_API_KEY` — 텍스트 (sk-or-v1- 로 시작, `generate-text.mjs`)
- 읽기: Node에서 `process.env.OPENROUTER_API_KEY` (기존 `.env` 파서 `generate-assets.mjs:25` 재사용).
- 엔드포인트:
  - OpenRouter: `https://openrouter.ai/api/v1/chat/completions` (OpenAI 호환). 헤더 `Authorization: Bearer ${key}`, 선택 `HTTP-Referer`/`X-Title`.
  - OpenAI TTS: `https://api.openai.com/v1/audio/speech` (예: model `gpt-4o-mini-tts`) → mp3.
- **worktree마다 `.env`가 따로 필요**하다(추적되지 않으므로 worktree에 복사되지 않음). 키 없으면 생성 스크립트가 즉시 종료된다(`generate-assets.mjs:69` 패턴).

## 5.1 통합·테스트 세션 책임 (루트 `main` = integrator)

루트(`main`) 세션이 **통합과 테스트를 전담**한다. 작업 세션은 자기 모듈만, 통합 세션은 합치고 검증한다.

**머지 게이트 (반드시 순서대로):**
1. `git merge session/<X>` — 한 번에 하나만.
2. 즉시 **스모크 테스트**(§5.2) 실행.
3. 통과 → 다음 브랜치 머지. 실패 → 머지 되돌리고(`git reset --hard ORIG_HEAD` 또는 `git merge --abort`) 담당 세션에 콘솔 로그와 함께 보고. **깨진 채로 다음 머지 금지.**
4. 모든 머지·테스트 통과 시 체크포인트 태그: `git tag green-<날짜>`.

### 5.2 스모크 테스트 절차 (Playwright MCP)

> **공유 자원 규칙 (실측으로 확인된 충돌):**
> - **포트**: `node server.mjs`의 5500은 1개 세션만 점유 가능(`EADDRINUSE`). 미리보기가 필요한 세션은 `$env:PORT=5501; node server.mjs` 식으로 **세션마다 다른 포트** 사용. 브라우저 스모크 테스트는 **통합 세션이 전담**한다.
> - **Playwright 브라우저**: MCP 브라우저 인스턴스는 전역 1개라 여러 세션이 동시에 쓰면 페이지가 닫힌다(`Target page has been closed`). **브라우저 테스트는 통합 세션만** 실행한다. 작업 세션은 브라우저 자동화를 쓰지 않는다.

1. 서버 기동: `node server.mjs` → http://localhost:5500 (background).
2. `browser_navigate` http://localhost:5500 → `browser_wait_for` 캔버스 렌더.
3. **콘솔 에러 0건**: `browser_console_messages` 에 error 레벨 없어야 함 (기존 `.playwright-mcp/console-*.log` 패턴).
4. **전역 계약 존재**: `browser_evaluate` 로 `!!window.AUDIO && !!window.UI && !!window.GAMEINPUT` === true.
5. **기본 동작**: 게임 씬 로드 확인(Phaser canvas), 조이스틱 입력 1회 → 캐릭터 반응, `window.UI` 말풍선/음성 1회 동작.
6. 결과를 `green` / `red(사유+로그)` 로 사용자에게 한 줄 보고.

## 6. 충돌·사고 시 행동

- 머지 충돌: 보고 후 통합 세션이 해소. 필요 시 `git revert` / `git reset`으로 초기 스냅샷까지 롤백 가능.
- 다른 세션의 파일을 실수로 수정함: 커밋 전이면 되돌리고, 커밋 후면 통합 세션에 알린다.
