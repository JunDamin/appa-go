# 실제 사진 ↔ 장소 이벤트 매핑 (메인 세션 통합)

각 장소의 "진짜 모습 보기"에 들어가는 사진. 실제 수집 사진(Wikimedia)은 `assets/external_v3/photos/`,
게임이 로드하는 경로는 `assets/photos/`. 사진 카드 하단에 `photoCredit`(출처)이 표시됨.
**CC BY-SA/CC BY는 출처표기 필수** — `places.js`의 `photoCredit`에 반영 완료.

| 장소 | 사진 종류 | 게임 파일 | 원본 | 라이선스 |
|------|----------|----------|------|---------|
| 학교 | **실제** | school_1/2.jpg | school_gate_1(춘천여고 교문)·school_exterior_1(대구대명초) | CC BY-SA 4.0 (샘플 학교) |
| 시장 | **실제** | market_1/2.jpg | 속초중앙시장(CC0)·속초관광수산시장 | CC0 + CC BY-SA 4.0 |
| 청초호 | **실제** | lake_1/2.jpg | Cheongchoho 2019·아바이 갯배(CC0) | CC BY-SA 4.0 + CC0 |
| 해수욕장 | **실제** | beach_1/2.jpg | Sokcho Beach 008·014 (Mobius6) | CC BY-SA 4.0 |
| 도서관 | 생성 | library_1.jpg | OpenAI gpt-image-1 일상컷 | — |
| 놀이터 | 생성 | playground_1.jpg | OpenAI gpt-image-1 | — |
| 마트 | 생성 | mart_1.jpg | OpenAI gpt-image-1 | — |

> 실제 사진은 4개 핵심 장소(학교·시장·청초호·해수욕장)를 커버 → **심사위원 어필: "진짜 속초/실제 학교 모습"**.
> 도서관·놀이터·마트는 실사 미수집 → 생성 일상컷 유지(개인정보·수집 한계).

## 아직 안 쓴 실제 사진 (확장 이벤트용 — `assets/external_v3/photos/`)
- `busstop_1/2.jpg` (CC BY) → **버스정류장 이벤트**("기다리는 법", 등하교 이동)
- `pharmacy_1.jpg` (CC0) → **약국 장소**("아플 때 안심")
- `street_sign_1.jpg` (CC0, 속초 거리 표지판) → **길찾기/통학로 미션**
- `town_view_1.jpg` (CC0, 속초 전경) → **인트로/마무리 배경**
- `eastsea_1.jpg` (CC BY-SA) → 해변 추가 컷

상세 저작자/원본 URL: `assets/external_v3/photos/credits.json`.
표기 형식: `ⓒ Wikimedia Commons / <author> / <license>`.
