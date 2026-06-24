/*
 * 아빠, Go! — "속초 하루지도" 장소 데이터 (정착·일상 컨셉)
 *
 * 게임은 관광이 아니라 아이의 "하루"를 미리 살아보게 한다.
 * 동선: 집 → 학교 → [도서관|놀이터] → [시장|마트] → 청초호 산책 → 집 → (주말) 바다
 * 각 장소는 보물조각이 아니라 "일상 카드"를 주고, 결과 화면에서 카드들이
 * "나의 속초 하루지도" 내러티브 문장으로 조합된다.
 *
 * 필드:
 *  world{x,y} = 월드맵 타일 좌표(실제 속초 지리 반영: 남=조양동 신시가지 주거,
 *              북=시장, 중앙=청초호, 동=바다)
 *  theme      = 장소 상세맵 테마
 *  dayPhase   = morning|afterschool|evening|night|weekend (하루 진행 순서)
 *  card       = { title, line } 일상 카드(제목 + 하루지도 내러티브 문장)
 *  piece      = HUD 표시용(카드 아이콘)
 *  lookMission= 일상 관찰 항목(관광컷 아닌 "내가 어떻게 움직이나")
 *
 * 사진/캐릭터 파일이 없어도 플레이스홀더로 동작. 학교·아이 실제 사진은
 * 개인정보 보호로 일러스트/샘플 권장.
 */
globalThis.PLACES = [
  {
    id: "school",
    name: "우리 초등학교",
    type: "school", theme: "school", dayPhase: "morning",
    emoji: "🏫", color: "#5a7fd0",
    world: { x: 18, y: 30 },
    npc: { name: "담임 선생님", emoji: "🧑‍🏫", pitch: 1.0, rate: 0.95 },
    dialogue: [
      "안녕! 오늘은 학교까지 가는 길을 같이 걸어왔구나.",
      "어떤 표시를 기억하면 집에 돌아갈 때도 안심될까?",
      "넓은 운동장도 있고, 곧 새 친구도 사귈 거야."
    ],
    photos: ["assets/photos/school_1.jpg"],
    photoCredit: "ⓒ일러스트(개인정보 보호: 실제 학교 사진 대신)",
    lookMission: ["교문", "운동장", "횡단보도", "국기 게양대"],
    choices: [
      { text: "교문 앞 길을 기억해요", result: "길 기억 카드를 얻었어요!" },
      { text: "운동장을 둘러봐요", result: "새 학교 카드를 얻었어요!" }
    ],
    piece: { name: "새 학교 카드", emoji: "🏫" },
    card: { title: "새 학교 카드", line: "아침에는 학교에 가요." },
    fact: "전학 첫날은 누구나 떨려요. 통학로의 횡단보도·표지를 미리 익히면 훨씬 덜 무서워집니다.",
    parentTip: "첫 등교 전에 학교까지 가는 길을 함께 걸으며 멈추는 곳(횡단보도)을 짚어 주세요."
  },
  {
    id: "library",
    name: "속초시립도서관",
    type: "library", theme: "library", dayPhase: "afterschool",
    emoji: "📚", color: "#5aa84f",
    world: { x: 24, y: 28 },
    npc: { name: "도서관 선생님", emoji: "🧑‍🏫", pitch: 1.0, rate: 0.85 },
    dialogue: [
      "여기는 학교 끝나고 잠깐 쉬어갈 수 있는 곳이야.",
      "1층 어린이실에는 네 키에 딱 맞는 책이 많아.",
      "네가 좋아할 책을 하나 찾아볼까?"
    ],
    photos: ["assets/photos/library_1.jpg"],
    photoCredit: "ⓒ분위기 컷(포토코리아/Pixabay 'library')",
    lookMission: ["입구", "어린이실", "책장", "신발장"],
    choices: [
      { text: "그림책을 한 권 빌려요", result: "조용한 아지트 카드를 얻었어요!" },
      { text: "나만의 자리를 찾아요", result: "아지트 스티커를 얻었어요!" }
    ],
    piece: { name: "조용한 아지트 카드", emoji: "📖" },
    card: { title: "조용한 아지트 카드", line: "학교가 끝나면 도서관에서 책을 볼 수 있어요." },
    fact: "조양동 시립도서관 1층은 어린이도서관이에요. 가족 대출증을 만들면 책을 빌릴 수 있어요.",
    parentTip: "도서관 대출증을 함께 만들고 '책 빌리는 날'을 정해보세요."
  },
  {
    id: "playground",
    name: "동네 놀이터",
    type: "playground", theme: "playground", dayPhase: "afterschool",
    emoji: "🛝", color: "#2bb3a3",
    world: { x: 31, y: 26 },
    npc: { name: "새 친구", emoji: "🧒", pitch: 1.3, rate: 1.1 },
    dialogue: [
      "안녕! 나랑 같이 놀래? 여기는 학교 끝나고 오는 놀이터야.",
      "미끄럼틀도 있고 그네도 있어.",
      "학교 끝나고 여기서 또 만나자!"
    ],
    photos: ["assets/photos/playground_1.jpg"],
    photoCredit: "ⓒ분위기 컷",
    lookMission: ["미끄럼틀", "그네", "모래밭", "벤치"],
    choices: [
      { text: "미끄럼틀을 타요", result: "첫 친구 카드를 얻었어요!" },
      { text: "새 친구와 인사해요", result: "친구 스티커를 얻었어요!" }
    ],
    piece: { name: "첫 친구 카드", emoji: "🛝" },
    card: { title: "첫 친구 카드", line: "방과후엔 놀이터에서 친구를 만나요." },
    fact: "방과후 놀이터는 또래를 사귀기 좋은 곳이에요.",
    parentTip: "'같이 놀아도 될까?' 인사말을 미리 함께 연습해 보세요."
  },
  {
    id: "market",
    name: "속초관광수산시장",
    type: "market", theme: "market", dayPhase: "evening",
    emoji: "🍗", color: "#e8893a",
    world: { x: 22, y: 11 },
    npc: { name: "시장 아주머니", emoji: "🧑‍🍳", pitch: 1.1, rate: 1.1 },
    dialogue: [
      "어서 와! 오늘 저녁엔 뭘 먹을까?",
      "속초 시장에는 골목마다 맛있는 냄새가 숨어 있단다.",
      "여기 닭강정이 아주 바삭하고 유명해!"
    ],
    photos: ["assets/photos/market_1.jpg"],
    photoCredit: "ⓒ한국관광공사 포토코리아 / 게티이미지뱅크",
    lookMission: ["닭강정 가게", "간판", "시장 골목", "계산하는 곳"],
    choices: [
      { text: "닭강정 냄새를 맡아요", result: "간식 카드를 얻었어요!" },
      { text: "먹거리 가게를 찾아요", result: "시장 탐험 스티커를 얻었어요!" }
    ],
    piece: { name: "간식 카드", emoji: "🍗" },
    card: { title: "간식 카드", line: "저녁엔 시장에서 닭강정 간식을 살 수 있어요." },
    fact: "속초 대표 전통시장. 닭강정 골목이 명물이고 주말 가족 나들이로 좋아요.",
    parentTip: "먹거리 이름과 냄새를 함께 이야기하며 오감 놀이를 해보세요."
  },
  {
    id: "mart",
    name: "동네 마트",
    type: "mart", theme: "mart", dayPhase: "evening",
    emoji: "🛒", color: "#b06ad0",
    world: { x: 34, y: 30 },
    npc: { name: "마트 아저씨", emoji: "🧑‍💼", pitch: 1.05, rate: 1.05 },
    dialogue: [
      "어서 오세요! 엄마 심부름 왔구나?",
      "우유랑 과일은 저쪽에 있어요.",
      "물건을 잘 찾으면 계산대에서 계산하면 돼요."
    ],
    photos: ["assets/photos/mart_1.jpg"],
    photoCredit: "ⓒ분위기 컷(Pixabay 'grocery')",
    lookMission: ["우유", "과일", "장바구니", "계산대"],
    choices: [
      { text: "우유를 담아요", result: "장보기 카드를 얻었어요! (엄마 심부름 완료)" },
      { text: "좋아하는 간식을 골라요", result: "심부름 척척 스티커를 얻었어요!" }
    ],
    piece: { name: "장보기 카드", emoji: "🛒" },
    card: { title: "장보기 카드", line: "엄마 심부름으로 마트에서 장을 봐요." },
    fact: "엄마 심부름은 동네를 익히는 좋은 방법! 마트 위치와 코너를 알아두면 좋아요.",
    parentTip: "그림으로 그린 간단한 심부름 목록(우유 1개 등)을 들려 보내 보세요."
  },
  {
    id: "lake",
    name: "청초호 산책길",
    type: "lake", theme: "lake", dayPhase: "night",
    emoji: "💧", color: "#2bb3c2",
    world: { x: 28, y: 24 },
    npc: { name: "산책하는 할아버지", emoji: "🧓", pitch: 0.9, rate: 0.85 },
    dialogue: [
      "하루가 조금 낯설었지? 저녁엔 호수길을 천천히 걸어보렴.",
      "여기는 청초호라는 큰 호수란다. 바다였다가 호수가 됐대.",
      "벤치에 앉아 새도 보고, 마음을 쉬어 가렴."
    ],
    photos: ["assets/photos/lake_1.jpg"],
    photoCredit: "ⓒWikimedia(CC) / 청초호 호수공원",
    lookMission: ["벤치", "물", "산책길", "새"],
    choices: [
      { text: "산책길을 걸어요", result: "마음 쉬는 길 카드를 얻었어요!" },
      { text: "벤치에 앉아 새를 봐요", result: "저녁 산책 스티커를 얻었어요!" }
    ],
    piece: { name: "마음 쉬는 길 카드", emoji: "💧" },
    card: { title: "마음 쉬는 길 카드", line: "저녁에는 청초호 산책길을 걸으며 마음을 쉬어요." },
    fact: "청초호는 동해안 대표 석호. 데크 산책로가 있어 저녁·주말 산책에 좋아요.",
    parentTip: "하루를 마치며 '오늘 뭐가 제일 재밌었어?'를 호수길에서 물어보세요."
  },
  {
    id: "beach",
    name: "속초해수욕장",
    type: "beach", theme: "beach", dayPhase: "weekend",
    emoji: "🌊", color: "#3aa6e0",
    world: { x: 38, y: 16 },
    npc: { name: "바다갈매기", emoji: "🐦", pitch: 1.4, rate: 1.15 },
    dialogue: [
      "끼룩! 주말에는 파도 소리를 들으러 와!",
      "바다는 매일 조금씩 다른 얼굴을 보여준대.",
      "백사장이 길어서 가족이 산책하기 좋아."
    ],
    photos: ["assets/photos/beach_1.jpg"],
    photoCredit: "ⓒ한국관광공사 포토코리아 / Wikimedia(CC)",
    lookMission: ["해변 입구", "모래사장", "산책로", "파도"],
    choices: [
      { text: "파도 소리를 들어요", result: "주말 기대 카드를 얻었어요!" },
      { text: "모래 위 발자국을 찾아요", result: "주말 바다 스티커를 얻었어요!" }
    ],
    piece: { name: "주말 기대 카드", emoji: "🌊" },
    card: { title: "주말 기대 카드", line: "주말에는 가족과 바다를 보러 가요." },
    fact: "평일 일상 뒤의 '주말 특별 탐험지'. 가족 나들이로 기대감을 키워요.",
    parentTip: "주말에 실제로 바다에 가보기로 약속하면 새 동네에 대한 기대가 생깁니다."
  }
];
