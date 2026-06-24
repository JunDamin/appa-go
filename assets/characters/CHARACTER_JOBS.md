# 캐릭터 에셋 생성 스펙 (gpt-image-2)

> 캐릭터·인터랙션 세션이 제공하는 **생성 브리프**. 실제 생성은 `data-assets` 세션이
> `generate-assets.mjs`에 아래 `CHARACTER_JOBS`를 추가해 실행한다.
> 모델: **gpt-image-2** (기존 gpt-image-1보다 성능 우위, 사용자 지정).
> 스타일: 기존 `STORYBOOK` 상수 재사용 + `assets/world/sokcho_map.png` 톤 정합.

## 생성 규칙 (현재 파이프라인 기준 — 2026-06-24 확인)
- **엔드포인트**: OpenRouter `https://openrouter.ai/api/v1/images`, body `{model, prompt}`, 응답 `data[0].b64_json`.
- **모델**: 전역 `IMAGE_MODEL`(기본 `openai/gpt-5.4-image-2` = "gpt image2"). 현재 `generate()`는 **per-job `model`을 안 쓰고 전역값** 사용 → 아래 잡의 `model:` 필드는 무시돼도 무방(원하면 `body.model = job.model || IMAGE_MODEL`로 잡별 적용 가능).
- 모든 프롬프트에 기존 `STORYBOOK` 접두를 붙인다(맵과 동일 화풍).
- 실행: `node generate-assets.mjs characters` (CHARACTER_JOBS를 generate-assets.mjs에 추가 + mode 'characters' 분기).
- **맵 톤 정합(권장)**: 가능하면 `sokcho_map.png`를 레퍼런스 이미지로 입력(images edits/reference 경로). 텍스트만 쓸 경우 STORYBOOK + "same warm pastel storybook style as a children's map" 단서로 보강.
- **토큰**: 단일 인물, **정면 ¾뷰 전신**, 단색/투명 배경, 그림자 없음(런타임이 그림자 그림). 파일명 `<id>_token.png`.
- **포트레이트**: **가슴 위 정면 얼굴**, 부드러운 배경. 파일명 `<id>_portrait.png`, 표정 변형 `<id>_<expr>.png`.
- seed가 지원되면 9명 동일 seed로 상호 일관성 고정. 미지원 시 **한 배치 + 동일 프롬프트 골격**으로 생성 후, 어긋난 것만 재생성. 최종은 맵과 나란히 **컨택트시트 육안 검수**.

## 출력 규격
- 토큰: 정사각 생성 후 트림하여 투명 PNG(런타임은 `displayHeight≈30~38`로 축소).
- 포트레이트: 256×256 내외 PNG.

## CHARACTER_JOBS (generate-assets.mjs에 추가)
```js
const CHAR = "single character, front three-quarter view, full body, plain solid background, no shadow, centered";
const FACE = "head-and-shoulders front portrait, soft plain background, friendly face";
const CHARACTER_JOBS = [
  // 토큰(전신) — 9 캐스트
  { file: "assets/characters/dad_token.png",        model: "gpt-image-2", prompt: `A kind young Korean dad, tall, cap and small backpack, gentle smile. ${CHAR}. ${STORYBOOK}` },
  { file: "assets/characters/kid_token.png",        model: "gpt-image-2", prompt: `A small curious Korean child, bright yellow shirt, big round eyes, cheerful. ${CHAR}. ${STORYBOOK}` },
  { file: "assets/characters/friend_token.png",     model: "gpt-image-2", prompt: `A cheerful Korean kid, colorful headband, friendly grin. ${CHAR}. ${STORYBOOK}` },
  { file: "assets/characters/librarian_token.png",  model: "gpt-image-2", prompt: `A calm warm Korean librarian, glasses, holding a picture book, soft cardigan. ${CHAR}. ${STORYBOOK}` },
  { file: "assets/characters/market_aunt_token.png",model: "gpt-image-2", prompt: `A warm friendly Korean market vendor aunty, apron, rosy cheeks. ${CHAR}. ${STORYBOOK}` },
  { file: "assets/characters/bus_driver_token.png", model: "gpt-image-2", prompt: `A friendly Korean bus driver, uniform and cap, steady kind face. ${CHAR}. ${STORYBOOK}` },
  { file: "assets/characters/pharmacist_token.png", model: "gpt-image-2", prompt: `A gentle Korean pharmacist, white coat, reassuring smile. ${CHAR}. ${STORYBOOK}` },
  { file: "assets/characters/grandpa_token.png",    model: "gpt-image-2", prompt: `A gentle elderly Korean grandpa, walking cane, kind wrinkles. ${CHAR}. ${STORYBOOK}` },
  { file: "assets/characters/gull_token.png",       model: "gpt-image-2", prompt: `A cute cartoon seagull mascot, big friendly eyes, round soft body. ${CHAR}. ${STORYBOOK}` },
  // 포트레이트(얼굴) — 9 캐스트
  { file: "assets/characters/dad_portrait.png",        model: "gpt-image-2", prompt: `A kind young Korean dad, cap, warm eyes. ${FACE}. ${STORYBOOK}` },
  { file: "assets/characters/kid_portrait.png",        model: "gpt-image-2", prompt: `A small curious Korean child, big round eyes, cheerful. ${FACE}. ${STORYBOOK}` },
  { file: "assets/characters/friend_portrait.png",     model: "gpt-image-2", prompt: `A cheerful Korean kid, headband, friendly grin. ${FACE}. ${STORYBOOK}` },
  { file: "assets/characters/librarian_portrait.png",  model: "gpt-image-2", prompt: `A calm warm Korean librarian, glasses. ${FACE}. ${STORYBOOK}` },
  { file: "assets/characters/market_aunt_portrait.png",model: "gpt-image-2", prompt: `A warm Korean market aunty, apron, rosy cheeks. ${FACE}. ${STORYBOOK}` },
  { file: "assets/characters/bus_driver_portrait.png", model: "gpt-image-2", prompt: `A friendly Korean bus driver, cap. ${FACE}. ${STORYBOOK}` },
  { file: "assets/characters/pharmacist_portrait.png", model: "gpt-image-2", prompt: `A gentle Korean pharmacist, white coat. ${FACE}. ${STORYBOOK}` },
  { file: "assets/characters/grandpa_portrait.png",    model: "gpt-image-2", prompt: `A gentle elderly Korean grandpa, kind wrinkles. ${FACE}. ${STORYBOOK}` },
  { file: "assets/characters/gull_portrait.png",       model: "gpt-image-2", prompt: `A cute cartoon seagull mascot, big friendly eyes. ${FACE}. ${STORYBOOK}` },
  // 앰비언트(전신) — 5 주민
  { file: "assets/characters/amb_student_token.png",   model: "gpt-image-2", prompt: `A Korean kid with a school backpack, walking. ${CHAR}. ${STORYBOOK}` },
  { file: "assets/characters/amb_shopper_token.png",   model: "gpt-image-2", prompt: `A Korean adult carrying a shopping basket. ${CHAR}. ${STORYBOOK}` },
  { file: "assets/characters/amb_dogwalker_token.png", model: "gpt-image-2", prompt: `A Korean person walking a small fluffy dog. ${CHAR}. ${STORYBOOK}` },
  { file: "assets/characters/amb_bikekid_token.png",   model: "gpt-image-2", prompt: `A Korean kid riding a small bicycle. ${CHAR}. ${STORYBOOK}` },
  { file: "assets/characters/amb_keeper_token.png",    model: "gpt-image-2", prompt: `A Korean shopkeeper sweeping in front of a store. ${CHAR}. ${STORYBOOK}` },
  // 월드맵 생활 요소 — 나는 새(하늘) + 배회 동물(땅)
  { file: "assets/characters/amb_bird_token.png",      model: "gpt-image-2", prompt: `A small cute seagull flying, side view, wings spread. ${CHAR}. ${STORYBOOK}` },
  { file: "assets/characters/amb_dog_token.png",       model: "gpt-image-2", prompt: `A small fluffy dog walking, side view. ${CHAR}. ${STORYBOOK}` },
  { file: "assets/characters/amb_cat_token.png",       model: "gpt-image-2", prompt: `A cute cat strolling, side view. ${CHAR}. ${STORYBOOK}` },
];
// generate(job, key): body.model = job.model || "gpt-image-1" 로 잡별 모델 적용.
// 실행: node generate-assets.mjs characters
```

## 표정 변형(2차, 선택)
인상 시스템이 표정 교체를 쓰므로(`portrait(id, expr)`), 핵심 인물의 표정 변형을 추가 생성:
`dad_smile/talk/worry`, `kid_happy/surprised`, `market_aunt_offer`, `gull_happy` 등 — `data/characters.js`의 각 인물 `expressions` 목록과 일치시킨다.

## 배경 제거 (필수 후처리) — 검증됨 ✅
gpt-image-2는 이 엔드포인트에서 **단색 파스텔 배경**으로 나온다(투명 X). 토큰은 맵 위에 올리므로
**배경을 투명**으로 빼야 한다. 방법: **모서리에서 플러드필**(테두리 시작 → 배경색과 tol 이내 픽셀만
alpha=0, 캐릭터 안쪽은 보존). tol≈60에서 친구 81% / 강아지 75% 투명, 헤일로 없이 깨끗.
- 구현: PowerShell System.Drawing LockBits 플러드필(무의존) 또는 Node sharp/pngjs.
- 포트레이트는 배경 유지 가능(대화창 안에 들어가므로). **토큰만** 배경 제거 필수.
- 검증: 투명 토큰을 `sokcho_map.png` 크롭 위에 합성 → 자연스러우면 OK(2장 프루프로 확인 완료).

## 검수
생성 후 9명 토큰+포트레이트를 `sokcho_map.png`와 나란히 컨택트시트로 합쳐 육안 검수.
톤(팔레트·외곽선·붓터치)이 맵과 어긋난 인물만 프롬프트 조정해 재생성.
**프루프 결과(2026-06-24): friend_token / amb_dog_token 생성+배경제거 → 맵 합성 자연스러움 확인.**
