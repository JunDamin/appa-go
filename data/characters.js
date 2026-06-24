/*
 * 아빠, Go! — 캐릭터 데이터 (캐릭터·인터랙션 세션 소유)
 *
 * 그림책·동화풍 일러스트 캐스트의 "데이터"만 정의한다(런타임 로직은 characters.js).
 * places.js 패턴을 따라 전역(globalThis)으로 노출하고, <script> 태그로 로드한다.
 *
 * 비주얼: 토큰/포트레이트는 gpt-image-2 + STORYBOOK 으로 생성(assets/characters/).
 * 파일이 없어도 게임은 emoji 폴백으로 동작한다.
 *
 * 인상(impression) 시스템: 대항해시대2式 — 대화를 거듭하면 인물 인상이
 *   0 낯섦 → 1 인사 → 2 대화 → 3 친해짐 으로 바뀐다. 마지막에 인상 카드 획득.
 */
globalThis.CHARACTERS_DATA = (function () {
  "use strict";

  // 4단계 인상 라벨 (공용)
  const STAGES = ["낯섦", "인사", "대화", "친해짐"];

  // 캐스트 9명. appearance = gpt-image-2 프롬프트용 외형 단서(영문).
  const CAST = [
    {
      id: "dad", name: "아빠", role: "동행자·기준점", emoji: "🧑",
      appearance: "a kind young Korean dad, tall, wearing a cap and a small backpack, gentle smile, warm eyes",
      expressions: ["smile", "talk", "worry"],
      realFact: "속초는 강원특별자치도 동해안의 항구 도시야. 바다도 호수도 가까워.",
      impression: {
        lines: [
          "오늘은 새 동네를 같이 걸어보자.",          // 0 낯섦(첫 만남이 아니라 늘 곁의 기준점)
          "어떤 표시를 기억하면 집에 올 때 안심될까?",  // 1
          "잘 찾아다니네. 아빠가 옆에 있어.",          // 2
          "이제 이 동네가 우리 동네 같지?",            // 3 친해짐
        ],
        card: { title: "든든한 아빠 카드", emoji: "🧑", line: "어디를 가도 아빠가 곁에 있어요." },
      },
    },
    {
      id: "kid", name: "나", role: "플레이어", emoji: "🧒",
      appearance: "a small curious Korean child, bright yellow shirt, big round eyes, cheerful",
      expressions: ["happy", "surprised", "talk"],
      realFact: null,
      impression: null, // 플레이어 자신
    },
    {
      id: "friend", name: "새 친구", role: "또래", emoji: "🧒", placeId: "playground",
      appearance: "a cheerful Korean kid the same age, colorful headband, friendly grin",
      expressions: ["smile", "laugh", "talk"],
      realFact: "청초호 호수공원 놀이터는 방과 후 친구 만나기 좋은 곳이야.",
      impression: {
        lines: [
          "어… 안녕? 너 새로 왔구나.",
          "나랑 같이 놀래? 여기 미끄럼틀 빠르다!",
          "내일 학교에서 또 보자!",
          "우리 이제 친구다! 방과 후에 또 놀자.",
        ],
        card: { title: "첫 친구 카드", emoji: "🧒", line: "이 동네에 친구가 생겼어요." },
      },
    },
    {
      id: "teacher", name: "담임 선생님", role: "학교 안내", emoji: "🧑‍🏫", placeId: "school",
      appearance: "a warm friendly Korean elementary school teacher, neat cardigan, kind smile",
      expressions: ["smile", "talk"],
      realFact: "학교 운동장·교문·보건실 위치를 미리 알아두면 첫 등교가 훨씬 덜 떨려.",
      impression: {
        lines: [
          "안녕! 네가 새로 올 친구구나. 만나서 반가워.",
          "여기가 우리 교실이야. 네 자리도 곧 생길 거야.",
          "오늘 학교 어땠어? 잘 적응하고 있어 기특하네.",
          "이제 학교가 편해졌지? 선생님은 늘 네 편이야.",
        ],
        card: { title: "새 학교 카드", emoji: "🏫", line: "매일 갈 학교가 생겼어요." },
      },
    },
    {
      id: "daycare_teacher", name: "어린이집 선생님", role: "어린이집 안내", emoji: "👩‍🏫", placeId: "daycare",
      appearance: "a cheerful Korean daycare teacher, apron, gentle warm face",
      expressions: ["smile", "laugh"],
      realFact: "어린이집엔 블록과 그림책이 많아. 좋아하는 장난감을 하나 정해두면 적응이 쉬워.",
      impression: {
        lines: [
          "어서 와! 여기는 친구들과 놀고 낮잠도 자는 곳이야.",
          "블록도 그림책도 많아. 뭐가 제일 궁금해?",
          "오늘 친구랑 잘 놀았네. 내일 또 보자!",
          "이제 여기가 익숙하지? 선생님이 늘 반겨줄게.",
        ],
        card: { title: "포근한 어린이집 카드", emoji: "🧸", line: "마음 편히 놀 곳이 생겼어요." },
      },
    },
    {
      id: "mart_keeper", name: "마트 아저씨", role: "가게·생활", emoji: "🧑‍💼", placeId: "mart",
      appearance: "a friendly Korean neighborhood grocery shopkeeper, apron, welcoming smile",
      expressions: ["smile", "talk"],
      realFact: "동네 마트에서 우유·과일 코너를 알아두면 엄마 심부름도 척척이야.",
      impression: {
        lines: [
          "어서 오세요! 우리 동네 마트에 온 걸 환영해.",
          "엄마 심부름 왔구나? 우유랑 과일은 저쪽이야.",
          "오늘도 왔네. 단골은 척척박사 다 됐네!",
          "필요한 거 있으면 언제든 와. 우리 동네 가게야.",
        ],
        card: { title: "심부름 척척 카드", emoji: "🛒", line: "가족 장보기를 도울 수 있어요." },
      },
    },
    {
      id: "librarian", name: "도서관 선생님", role: "방과후 안내", emoji: "🧑‍🏫", placeId: "library",
      appearance: "a calm warm Korean librarian, glasses, holding a picture book, soft cardigan",
      expressions: ["smile", "talk"],
      realFact: "속초시립도서관 1층은 어린이도서관이야. 가족 대출증을 만들면 책을 빌릴 수 있어.",
      impression: {
        lines: [
          "쉿, 여기는 조용한 책 놀이터란다.",
          "네 키에 딱 맞는 책이 저쪽에 많아.",
          "오늘 빌린 책, 집에서 천천히 봐.",
          "여기는 네 아지트야. 학교 끝나고 언제든 와.",
        ],
        card: { title: "조용한 아지트 카드", emoji: "📚", line: "쉬고 싶을 때 갈 곳이 생겼어요." },
      },
    },
    {
      id: "market_aunt", name: "시장 아주머니", role: "생활", emoji: "🧑‍🍳", placeId: "market",
      appearance: "a warm friendly Korean market vendor aunty, apron, rosy cheeks, welcoming",
      expressions: ["smile", "offer", "laugh"],
      realFact: "속초관광수산시장 닭강정 골목이 아주 유명해. 바삭바삭하단다.",
      impression: {
        lines: [
          "어서 와! 시장은 처음이니?",
          "오늘 저녁엔 뭘 먹을까? 골목마다 맛있는 냄새가 숨어 있어.",
          "이거 하나 맛보렴. 단골은 덤이야.",
          "또 왔구나! 우리 가게 단골 다 됐네.",
        ],
        card: { title: "간식·장보기 카드", emoji: "🛒", line: "아빠와 장보러 갈 곳이 생겼어요." },
      },
    },
    {
      id: "bus_driver", name: "버스 기사님", role: "이동", emoji: "🧑‍✈️",
      appearance: "a friendly Korean bus driver, uniform and cap, steady kind face",
      expressions: ["smile", "talk"],
      realFact: "버스정류장에서는 줄을 서서 기다리고, 버스가 멈춘 뒤에 타면 돼.",
      impression: {
        lines: [
          "어디까지 가니? 천천히 타렴.",
          "다음 정류장 이름을 같이 외워볼까?",
          "이 길은 이제 눈 감고도 알겠네.",
          "단골 손님! 늘 안전하게 모실게.",
        ],
        card: { title: "기다리는 법 카드", emoji: "🚏", line: "동네를 오가는 법을 배웠어요." },
      },
    },
    {
      id: "pharmacist", name: "약사님", role: "안심", emoji: "🧑‍⚕️", placeId: "pharmacy",
      appearance: "a gentle Korean pharmacist, white coat, soft reassuring smile",
      expressions: ["smile", "talk"],
      realFact: "동네 약국은 아플 때 도움받는 곳이야. 위치를 알아두면 안심돼.",
      impression: {
        lines: [
          "어디 아프니? 너무 걱정 마.",
          "이건 이렇게 먹는 거란다. 천천히.",
          "많이 좋아졌네, 다행이야.",
          "아플 땐 언제든 와. 여긴 안심해도 돼.",
        ],
        card: { title: "안심 카드", emoji: "💊", line: "아플 때 갈 곳을 알게 됐어요." },
      },
    },
    {
      id: "grandpa", name: "산책 할아버지", role: "동네 어른", emoji: "🧓",
      appearance: "a gentle elderly Korean grandpa, walking cane, slightly bent back, kind wrinkles",
      expressions: ["smile", "talk"],
      realFact: "청초호는 바다와 이어진 석호(潟湖)란다. 저녁에 호수길을 걸으면 마음이 편해져.",
      impression: {
        lines: [
          "허허, 처음 보는 얼굴이구나.",
          "저녁엔 이 호수길을 천천히 걸어보렴.",
          "오늘도 산책 나왔구나. 같이 걸을까?",
          "이 동네 좋지? 자네도 이제 우리 이웃일세.",
        ],
        card: { title: "마음 쉬는 길 카드", emoji: "🌅", line: "저녁에 걸을 산책길이 생겼어요." },
      },
      easterEgg: "tae-cho",
    },
    {
      id: "gull", name: "갈매기", role: "속초 상징(유일 판타지)", emoji: "🐦",
      appearance: "a cute cartoon seagull, big friendly eyes, round soft body, storybook mascot",
      expressions: ["happy", "talk"],
      realFact: "속초 바다는 매일 조금씩 다른 얼굴을 보여줘. 주말에 파도 소리 들으러 와!",
      impression: {
        lines: [
          "끼룩! 너 처음 보는 친구다!",
          "주말엔 바다에 놀러 와, 파도 소리 들려줄게.",
          "바다 위를 같이 날아볼래? 끼룩끼룩!",
          "넌 이제 속초 친구야. 바다가 늘 기다릴게!",
        ],
        card: { title: "주말 바다 카드", emoji: "🌊", line: "주말에 바다를 보러 갈 수 있어요." },
      },
      easterEgg: "tae-cho",
    },
  ];

  // 돌아다니는 동네 사람(앰비언트). 충돌 없음·대사 없음(탭 시 짧은 플레이버).
  // routine = 시간대별 이동 구역 키 시퀀스. 실제 좌표는 game.js가 region→{x,y}로 해석.
  const AMBIENT = [
    { id: "amb_student", emoji: "🧒", appearance: "a Korean kid with a school backpack walking",
      flavor: "학교 다녀오겠습니다!", routine: { morning: ["home", "school"], day: ["school"], evening: ["school", "home"] } },
    { id: "amb_shopper", emoji: "🧑", appearance: "a Korean adult carrying a shopping basket",
      flavor: "오늘 저녁 반찬 뭐 하지?", routine: { morning: ["home"], day: ["market", "mart"], evening: ["market", "home"] } },
    { id: "amb_dogwalker", emoji: "🧑", appearance: "a Korean person walking a small fluffy dog",
      flavor: "멍멍이랑 산책 중이에요.", routine: { morning: ["lake"], day: ["lake", "playground"], evening: ["lake"] } },
    { id: "amb_bikekid", emoji: "🧒", appearance: "a Korean kid riding a small bicycle",
      flavor: "자전거 빠르지?", routine: { morning: ["home", "school"], day: ["playground"], evening: ["playground", "home"] } },
    { id: "amb_keeper", emoji: "🧑‍🍳", appearance: "a Korean shopkeeper sweeping in front of a store",
      flavor: "어서 오세요~", routine: { morning: ["market"], day: ["market"], evening: ["market"] } },
  ];

  // 이스터에그
  const EASTER_EGGS = {
    "tae-cho": {
      once: true,
      line: "쉿… 옛날 옛적, 포켓몬 GO 초창기엔 여기가 바로 태초마을이었대. 😉",
      note: "부모·형아 세대를 위한 윙크. 친해짐 단계에서 희귀하게 1회.",
    },
  };

  // 선택지 대화(TOPICS): 아이가 질문(q)을 고르면 인물이 답(a)으로 속초 소개·생활을 안내.
  // ui.js 가 선택지 버튼으로 렌더 → 고르면 답 표시. 모두 물어보면 인상 +1 권장.
  const TOPICS = {
    friend: [
      { q: "여기서 뭐 해?", a: "여긴 청초호 옆 놀이터야! 학교 끝나면 친구들이 모여. 미끄럼틀 타자!" },
      { q: "속초엔 뭐가 있어?", a: "바다도 있고 큰 호수도 있어. 주말엔 바다, 평일엔 호수 산책!" },
      { q: "방과 후엔 어디 가?", a: "도서관 가서 책 보거나 여기서 놀아. 너도 같이 다니자!" },
    ],
    teacher: [
      { q: "학교는 어때요?", a: "운동장도 넓고 친구도 많아. 처음엔 떨려도 금방 익숙해질 거야." },
      { q: "통학길이 무서워요.", a: "횡단보도에서 멈추고, 손 들고 건너면 돼. 아빠랑 미리 걸어보자." },
      { q: "보건실이 어디예요?", a: "복도 끝에 있어. 아프면 언제든 가도 돼. 선생님이 알려줄게." },
    ],
    daycare_teacher: [
      { q: "여긴 뭐 하는 곳?", a: "친구들이랑 놀고 낮잠도 자는 어린이집이야. 블록이랑 그림책이 많아!" },
      { q: "친구를 못 사귀면요?", a: "좋아하는 장난감을 하나 정해봐. 같이 놀다 보면 금방 친해져." },
    ],
    librarian: [
      { q: "여긴 어떤 곳이에요?", a: "속초시립도서관 어린이실이야. 네 키에 맞는 그림책이 가득해." },
      { q: "책 어떻게 빌려요?", a: "가족 대출증을 만들면 빌릴 수 있어. 일주일에 한 번 와도 좋아." },
    ],
    mart_keeper: [
      { q: "여긴 뭐 사요?", a: "우유·과일·간식까지 다 있어. 엄마 심부름 코너를 알려줄게." },
      { q: "심부름 처음이에요.", a: "우유는 저쪽, 과일은 이쪽, 계산은 여기. 천천히 해도 돼." },
    ],
    market_aunt: [
      { q: "여긴 뭐 파는 곳이에요?", a: "속초관광수산시장이야. 생선도, 닭강정도 많지!" },
      { q: "속초에서 꼭 먹을 건?", a: "닭강정! 바삭하고 달콤해. 아바이순대도 유명하단다." },
      { q: "저녁엔 뭘 사요?", a: "오늘은 두부랑 콩나물 어때? 같이 골라보자." },
    ],
    grandpa: [
      { q: "청초호가 뭐예요?", a: "바다랑 이어진 큰 호수란다. 석호라고 불러. 둘레를 걸을 수 있어." },
      { q: "바다랑 호수 뭐가 달라요?", a: "바다는 파도가 치고 짭조름하고, 호수는 잔잔해. 둘 다 가까운 게 속초의 자랑이지." },
      { q: "산책은 언제 좋아요?", a: "저녁 노을 질 때. 마음이 차분해진단다." },
    ],
    bus_driver: [
      { q: "버스 어떻게 타요?", a: "정류장에서 줄 서서 기다리고, 멈추면 타. 내릴 곳은 미리 말해줄게." },
      { q: "어디까지 가요?", a: "바다도 시장도 이 버스로 가. 속초는 버스로 다 통한단다." },
    ],
    pharmacist: [
      { q: "약국은 언제 가요?", a: "아프거나 다쳤을 때. 위치를 알아두면 안심돼." },
      { q: "무서워요.", a: "괜찮아. 천천히 어디가 아픈지 말해줘. 도와줄게." },
    ],
    gull: [
      { q: "속초 바다는 어때?", a: "끼룩! 넓고 파래! 모래사장에서 조개도 주울 수 있어." },
      { q: "주말엔 뭐 해?", a: "바다 보러 와! 파도 소리 듣고 갈매기랑 놀자. 끼룩끼룩!" },
    ],
    dad: [
      { q: "오늘 어디 가요?", a: "학교 가는 길부터 익혀보자. 길을 알면 동네가 편해져." },
      { q: "속초는 어떤 곳이에요?", a: "서쪽엔 설악산, 동쪽엔 바다, 가운데엔 호수가 있는 동네야." },
    ],
  };

  // 군중(CROWD): 장소마다 여러 명을 배치해 "사람이 많은 동네" 느낌.
  // lead = 그 장소의 대표 인물(상호작용), extras = 주변에 서성이는 사람들(앰비언트/캐릭터).
  const CROWD = {
    playground: { lead: "friend", extras: ["amb_bikekid", "kid", "amb_dogwalker"] },
    school: { lead: "teacher", extras: ["amb_student", "amb_bikekid"] },
    daycare: { lead: "daycare_teacher", extras: ["friend"] },
    library: { lead: "librarian", extras: ["kid"] },
    mart: { lead: "mart_keeper", extras: ["amb_shopper"] },
    market: { lead: "market_aunt", extras: ["amb_shopper", "amb_keeper"] },
    lake: { lead: "grandpa", extras: ["amb_dogwalker"] },
    pharmacy: { lead: "pharmacist", extras: [] },
  };

  // 환영(WELCOME): 그 장소에 도착하면 사람들이 반겨주는 인사. 군중 각자가 하나씩 띄움.
  const WELCOME = {
    school: ["안녕! 새로 왔구나!", "우리 반이야? 환영해!", "같이 놀자!"],
    playground: ["어! 새 친구다!", "이리 와, 같이 놀자!", "안녕!"],
    daycare: ["어서 와!", "여기 재밌어!", "같이 블록 쌓자!"],
    library: ["쉿, 어서 와 :)", "여기 책 많아!"],
    market: ["어서 와요~", "구경하고 가요!", "맛있는 거 많아!"],
    mart: ["어서 오세요!", "뭐 찾아요?"],
    lake: ["어, 산책 왔구나.", "같이 걸을까?"],
    pharmacy: ["어서 와, 괜찮아."],
  };

  return { STAGES, CAST, AMBIENT, EASTER_EGGS, TOPICS, CROWD, WELCOME };
})();
