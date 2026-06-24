# 아빠, Go! — 속초 데모

5~9세 아이와 보호자가 모바일·태블릿에서 **속초를 본뜬 2D RPG풍 맵**을 탐험하는 정적 웹 게임 데모.
NPC와 대화하고, **음성으로 듣고**, **실제 사진 카드 + 찾기 미션**을 하며, **보물지도 조각**을 모읍니다.

> 핵심 메시지: *새 동네가 낯설기 전에, 먼저 재미있는 장소가 되게 합니다.*

## 빠른 실행

순수 HTML/CSS/JS라 빌드가 필요 없습니다. 단, `data/places.js`를 `file://`로 직접 열면 일부 브라우저에서 막힐 수 있어 **로컬 서버 권장**:

```bash
# 아무거나 하나
python -m http.server 5500
# 또는
npx serve .
```

브라우저에서 `http://localhost:5500` 접속 → **시작하기**.

## 구조

```
index.html            화면 골격 (시작/맵/대사/사진/퀘스트/결과)
style.css             모바일 우선 RPG풍 스타일 (Galmuri 픽셀폰트)
game.js               지형 생성·이동·대사·음성·사진미션·보상·결과
data/places.js        4개 장소 데이터(NPC·대사·사진경로·미션·팩트·출처)
generate-assets.mjs   (선택) OpenAI 이미지 생성 → assets/
assets/photos/        장소 사진 (없으면 플레이스홀더 자동 사용)
assets/characters/    NPC 스프라이트 (없으면 이모지 자동 사용)
```

## 에셋 전략 — "빈 채로도 완성형, 채우면 고급형"

- **기본:** 사진/캐릭터 파일이 없어도 색상+이모지 플레이스홀더로 전체 동작
- **업그레이드:** 아래 둘 중 무엇이든 `assets/`에 파일을 넣으면 자동 교체
  1. **공개 자료 사진** (저작권 안전): 한국관광공사 포토코리아(공공누리 1유형, 출처표기), 위키미디어 Category:Sokcho(CC) 등 → `assets/photos/beach_1.jpg` 식으로 저장
  2. **AI 생성 이미지**: `node generate-assets.mjs` (`.env`의 `OPENAI_API_KEY` 사용)

```bash
node generate-assets.mjs            # 장소+캐릭터 전부
node generate-assets.mjs places     # 장소만
node generate-assets.mjs characters # 캐릭터만
```

> ⚠️ `.env`(API 키)는 빌드타임 전용이며 게임 런타임/브라우저로 들어가지 않습니다. `.gitignore`에 포함돼 있습니다.
> ※ AI 생성 이미지는 "속초 느낌"의 일러스트이지 실제 사진이 아닙니다. 진짜 실사진이 필요한 장소는 공개자료로 교체하세요.

## 지도에 대하여

실제 지도를 캡처하지 않고, **속초의 실제 지리 구조**(동=동해, 가운데=청초호 석호, 서=설악산, 북=시내·시장, 남=조양동 도서관)를 16×16 타일맵으로 절차 생성합니다. 장소 마커는 실제 상대 좌표에 배치됩니다. 저작권 부담 없이 속초다움을 살립니다.

## 데모 장소 (4곳, 전체 루프)

| 장소 | NPC | 보물 조각 |
|------|-----|-----------|
| 속초해수욕장 | 바다갈매기 🐦 | 바다 조각 🐚 |
| 속초관광수산시장 | 시장 아주머니 🧑‍🍳 | 간식 조각 🍗 |
| 청초호 | 호수 친구 🦆 | 호수 조각 💧 |
| 속초시립도서관 | 도서관 선생님 🧑‍🏫 | 이야기 조각 📖 |

## 크레딧 / 에셋 라이선스

- **타일·캐릭터(32px):** Liberated Pixel Cup (LPC) — CC-BY-SA 3.0 / GPL 3.0 (또는 OGA-BY 3.0). 전체 기여자 목록은 `assets/external_v2/CREDITS-lpc-base.txt`, `CREDITS-lpc-city.txt` 참고. **출처표기 필수**(발표/배포 시 크레딧 화면 권장).
- **BGM·SFX:** OpenGameArt CC0 (출처표기 불필요). 목록 `assets/external/audio/MANIFEST.md`.
- **게임 로고:** 프로젝트 제공(`assets/logo.png`).
- 대체용 CC0(출처표기 불필요) 에셋 경로도 `assets/external*/download.sh`에 기록.

## 자료 출처 / 라이선스

- 사진: 한국관광공사 포토코리아(공공누리 1유형), 위키미디어 Category:Sokcho(CC), 국가유산포털(공공저작물)
- 효과음(확장 시): 공유마당, Freesound, Pixabay Sound Effects
- 사진 카드 하단에 `ⓒ출처` 표기가 들어갑니다.
