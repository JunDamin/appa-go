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
      id: "friend", name: "새 친구", role: "또래", emoji: "🧒",
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
      id: "librarian", name: "도서관 선생님", role: "방과후 안내", emoji: "🧑‍🏫",
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
      id: "market_aunt", name: "시장 아주머니", role: "생활", emoji: "🧑‍🍳",
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
      id: "pharmacist", name: "약사님", role: "안심", emoji: "🧑‍⚕️",
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

  return { STAGES, CAST, AMBIENT, EASTER_EGGS };
})();
