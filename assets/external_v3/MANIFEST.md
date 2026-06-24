# external_v3 — 도시·일상 에셋 (Kenney RPG Urban Pack)

속초 "하루지도" 맵 구성을 위해 실제로 내려받은 CC0 에셋. 기존 `external_v2`(LPC 자연/물/모래/산/나무)와
**합쳐서** 사용한다. external_v2 = 자연·지형, external_v3 = 건물·도로·소품·자동차·캐릭터.

## 출처 / 라이선스
- **Kenney RPG Urban Pack 1.0** — https://kenney.nl/assets/rpg-urban-pack
- 라이선스: **CC0 1.0 (퍼블릭 도메인)** — 상업/교육 무제한, 출처표기 권장(비필수)
- 다운로드 원본: `kenney_rpg-urban-pack.zip` (2023 빌드), 486 타일, 16×16px

## 파일
| 파일 | 용도 |
|------|------|
| `urban_tilemap_packed.png` | **무간격** 27열×18행(=486) 16px 시트. Phaser `spritesheet`로 바로 사용 권장 |
| `urban_tilemap_spaced.png` | 1px 간격 버전(Tiled용) |
| `urban_tiles/tile_0000.png ~ tile_0485.png` | 개별 타일(행우선: index = row*27 + col) |
| `urban_preview.png` | 전체 미리보기 |
| `CREDITS-kenney-rpg-urban.txt` | 원본 라이선스 |

## 시트에 포함된 것(육안 확인)
- 건물: 빨강/갈색/파랑 **지붕**, 벽, 창문, **문**, 2층/상점 파사드
- 도로/포장: 아스팔트, **횡단보도**, 주차선, 보도
- 소품: **가로등, 벤치, 울타리, 표지판, 화단, 우체통**
- 자연: 초록 나무, 가을(주황) 나무, 관목
- 탈것: **자동차(빨강/초록), 트럭**
- 캐릭터: 여러 색 **4방향 워크 프레임** NPC(주민)
- 실내: 침대, 가구(상세맵 인테리어용)

## 캐릭터 캐스트 — `urban_characters.png` (Urban 시트에서 추출)
원본 시트 우측 4열(=4방향)을 잘라낸 **64×288** 스프라이트. 16px 격자: **4열(방향) × 18행**.
6명이 각 **3행(걷기 프레임) × 4열(아래/왼/오/위 방향)** 블록으로 배치(육안 확인).

| 행 블록 | 캐릭터(외형) | 게임 NPC 매핑 후보 |
|------|------|------|
| 행 0–2 | 갈색머리·녹색옷 청년 | 아빠 / 새 친구 |
| 행 3–5 | 빨강(적갈)머리·빨강상의 여성 | 시장 아주머니 |
| 행 6–8 | 회색(라벤더)머리·녹색옷 | 도서관 선생님 / 할아버지 |
| 행 9–11 | 주황 안전모·작업복 | 버스 기사님 / 동네 일꾼 |
| 행 12–14 | 대머리·회색셔츠 어르신 | 약사님 / 산책 할아버지 |
| 행 15–17 | 검은머리·머리띠 청년 | 새 친구 / 또래 |

- 아빠·아이(플레이어)는 보유 **LPC**(`assets/external_v2/characters/male_walkcycle.png` 등)로 구분 권장.
- 갈매기(유일 판타지 NPC)는 이모지/별도 컷 유지.
- 포트레이트(대화창 얼굴)는 본 팩에 **없음** → `.omc/plans/sokcho-character-art-plan.md` 참조(AI 그림책풍 권장).

## 물결·자연 타일 / 놀이터 상태 (②)
- **물/물결/호수/바다/다리**: 추가 다운로드 불필요 — `assets/external_v2/tiles/`의 `water.png`·`watergrass.png`·`bridges.png`·`rock.png`로 충분.
- **놀이터 기구(미끄럼틀·그네)**: 쉬운 CC0 직링크 미발견(itch "Tiny Treats Playground" 등은 페이지 수동 다운로드 필요).
  → 권장: Urban 팩의 **벤치·울타리·나무 + dirt(모래밭)**으로 놀이터를 구성하고, 미끄럼틀/그네만 16px 1~2장 자작.

## 타일 인덱스 매핑 규칙
개별 `urban_tiles/tile_NNNN.png` 가 행우선 인덱스와 1:1 대응하므로, 구현 시
`tile_0000`부터 열어 grass/road/roof/crosswalk/lamp 등 **용도별 인덱스 표**를 만들어
`data/tilemap-sokcho.js` 의 타일 ID로 참조한다. (육안 + 파일명으로 확정 가능)
