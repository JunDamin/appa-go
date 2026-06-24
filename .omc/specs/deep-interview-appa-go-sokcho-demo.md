# Deep Interview Spec: 아빠, Go! — 속초 데모

## Metadata
- Interview ID: appa-go-sokcho-demo
- Rounds: 3 (+ Round 0 topology)
- Final Ambiguity Score: 9%
- Type: greenfield
- Generated: 2026-06-24
- Threshold: 0.2
- Threshold Source: default
- Initial Context Summarized: no (user supplied detailed spec)
- Status: PASSED

## Clarity Breakdown
| Dimension | Score | Weight | Weighted |
|-----------|-------|--------|----------|
| Goal Clarity | 0.93 | 0.40 | 0.372 |
| Constraint Clarity | 0.90 | 0.30 | 0.270 |
| Success Criteria | 0.88 | 0.30 | 0.264 |
| **Total Clarity** | | | **0.906** |
| **Ambiguity** | | | **0.094 (9%)** |

## Topology
| Component | Status | Description | Coverage Note |
|-----------|--------|-------------|---------------|
| 2D 맵 & 캐릭터 이동 | active | 속초 타일맵, 장소 터치 이동, 캐릭터 도트 | 4개 장소 모두 진입 가능 |
| NPC 대사 시스템 | active | 하단 대사창, JSON 대사 데이터, [다음] 진행 | 장소별 NPC 대사 |
| 실제 사진 카드 & 찾기 미션 | active | "진짜 모습 보기", 사진 + 체크박스 관찰 미션 | 장소별 사진카드 + lookMission |
| 음성 읽어주기 | active | Web Speech API, 캐릭터별 pitch/rate | "목소리로 듣기" 버튼 |
| 보물지도 보상/진행 | active | 조각 획득, 결과 화면 | 4조각 수집 → 결과화면 |

(미루기/deferred: 없음 — 5개 전부 핵심)

## Goal
5~9세 아이와 보호자가 **모바일·태블릿 브라우저**에서 속초를 본뜬 2D RPG풍 맵을 탐험하는 **정적 웹 게임 데모**. 아이는 4개 장소(속초해수욕장·속초관광수산시장·속초시립도서관·청초호)를 돌며 NPC와 대화하고, "목소리로 듣기"로 대사를 듣고, "진짜 모습 보기"로 장소 사진을 보며 찾기 미션을 수행하고, 보물지도 조각을 모아 결과 화면에 도달한다.

## Constraints
- **스택: 순수 HTML/CSS/JS** (빌드 도구 없음, `index.html` 하나로 즉시 실행)
- 서버 없음, 로그인 없음, 실시간 위치/로드뷰 API 없음 (런타임은 정적·키없음)
- 장소 이동은 "터치 이동" 방식 (실시간 walking 물리엔진 불필요)
- **에셋: 플레이스홀더 우선 + 스왑 구조** — 사진/캐릭터 파일이 없어도 색상블록+이모지+라벨로 폴백, `assets/`에 파일을 떨궈 넣으면 자동 교체
- **에셋 생성: 빌드타임 Node 스크립트** (`generate-assets.mjs`)가 `.env`의 `OPENAI_API_KEY`로 OpenAI 이미지 API(gpt-image-1) 호출해 장소 일러스트/캐릭터/타일을 `assets/`에 1회 생성. **API 키는 브라우저에 절대 노출 금지** (빌드타임 전용)
- 캐릭터: 도트 PNG 없으면 큰 이모지/CSS 도형으로 즉시 표현
- 음성: 캐릭터별 pitch/rate 조절(아빠 0.9/0.9, 바다갈매기 1.4/1.15 등), 자동재생 아닌 버튼 방식
- 효과음: 선택(보물 획득음 1개 정도만), 음성과 겹치지 않게 기본 음소거

## Non-Goals
- 실제 로드뷰/지도 API 연동
- 실시간 GPS 위치
- 백엔드 서버 / DB / 로그인
- 복잡한 애니메이션, 실제 길찾기 알고리즘
- 문자 그대로의 실제 항공/관광 사진 확보(데모는 AI 생성 또는 플레이스홀더로 충분; 추후 공개자료 교체)

## Acceptance Criteria (합격선: 4개 장소 전체 플레이)
- [ ] 시작 화면 → 속초 2D 맵 진입
- [ ] 맵에서 4개 장소(해수욕장·시장·도서관·청초호) 모두 터치 이동 가능
- [ ] 각 장소 도착 시 해당 NPC 대사창 등장, [다음]으로 대사 진행
- [ ] "목소리로 듣기" 버튼으로 Web Speech 음성 재생 (캐릭터별 pitch/rate 반영)
- [ ] "진짜 모습 보기"로 사진카드 표시 + 사진 속 찾기 체크박스 미션
- [ ] 각 장소 완료 시 보물지도 조각 획득
- [ ] 4조각 모두 모으면 보물지도 결과 화면 표시
- [ ] 사진/캐릭터 에셋이 없어도 플레이스홀더로 전체 루프 동작 (스왑 시 자동 업그레이드)
- [ ] 모바일/태블릿 세로 화면에서 큰 버튼·짧은 문장으로 동작

## Technical Context
- greenfield, 빈 디렉터리 (`.env`에 `OPENAI_API_KEY` 존재, `.omc/` 상태 폴더만 있음)
- 권장 파일 구조:
  - `index.html`, `style.css`, `game.js`
  - `data/places.json` (장소+NPC+대사+사진경로+lookMission+choices+parentTip)
  - `assets/photos/`, `assets/characters/`, `assets/tiles/`
  - `generate-assets.mjs` (Node, OpenAI 이미지 생성, .env 사용)
- 데이터 구조: 사용자 제공 JSON 스키마(장소 이벤트 객체) 그대로 채택

## Ontology (Key Entities)
| Entity | Type | Fields | Relationships |
|--------|------|--------|---------------|
| Place | core domain | id, name, type, x, y | has one NPC, has Dialogue, has PhotoCards, has LookMission, has Choices, has parentTip |
| NPC | core domain | name, avatar, pitch, rate | belongs to Place |
| Dialogue | supporting | lines[] | belongs to Place/NPC |
| PhotoCard | core domain | src(경로), 폴백 | belongs to Place |
| LookMission | supporting | items[](찾기 항목), checked | belongs to PhotoCard |
| Choice/Reward | supporting | text, result(조각/스티커) | belongs to Place |
| Child(Player) | core domain | position, collectedPieces[] | moves on Map |
| Parent(아빠) | supporting | parentTip | accompanies Child |
| TreasureMap | core domain | pieces[], complete | aggregates Rewards |

## Ontology Convergence
| Round | Entity Count | New | Changed | Stable | Stability |
|-------|-------------|-----|---------|--------|-----------|
| 1 | 9 | 9 | - | - | N/A |
| 2 | 9 | 0 | 0 | 9 | 100% |
| 3 | 9 | 0 | 0 | 9 | 100% (수렴) |

## Interview Transcript
<details>
<summary>Full Q&A (Round 0 + 3 rounds)</summary>

**Round 0 (토폴로지):** 5개 구성요소(맵/NPC대사/사진·미션/음성/보상) 확정 → "5개 그대로 맞음"

**Round 1 (Constraints/스택):** 3시간 데모 기술 스택? → **순수 HTML/CSS/JS**

**Round 2 (Constraints/에셋):** 사진·캐릭터 출처? → 플레이스홀더 + 공개자료 검색 + 필요시 합성(이미지 생성). 이후 `.env`의 OPENAI_API_KEY로 빌드타임 생성 스크립트 채택.

**Round 3 (Success Criteria):** 완료=성공 합격선? → **4개 장소 전체 플레이** (전체 루프 완성)

</details>
