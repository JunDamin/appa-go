#!/usr/bin/env node
/* ============================================================
   아빠, Go! — 에셋 생성 (빌드타임 전용, OpenAI gpt-image-1)
   A+B 현실성 방향:
     - WORLD: 위에서 본 속초 동네 일러스트 지도 1장 (월드맵 배경)
     - PHOTOS: 7개 일상 장소의 "진짜 모습 보기"용 일상컷 7장

   ⚠️ Node 전용. API 키(.env OPENAI_API_KEY)는 브라우저로 들어가지 않음.
   사용법:
     node generate-assets.mjs               # 월드 + 사진 전부
     node generate-assets.mjs world         # 월드맵만
     node generate-assets.mjs photos        # 사진만
     node generate-assets.mjs interiors         # 건물 내부 6장 전부
     node generate-assets.mjs interiors library # 특정 내부 1장만 (id 필터)
   필요: Node 18+, .env 에 OPENAI_API_KEY
   ============================================================ */
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function loadEnv() {
  try {
    const raw = await fs.readFile(path.join(__dirname, ".env"), "utf8");
    for (const line of raw.split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  } catch {}
}

const STORYBOOK = "warm pastel storybook illustration, soft friendly colors, cozy, child-friendly, no text, no words, no letters, no labels";

const WORLD_JOBS = [
  {
    file: "assets/world/sokcho_map.png", size: "1536x1024", quality: "high",
    prompt: `A charming top-down bird's-eye illustrated MAP of a small Korean seaside neighborhood in Sokcho. ` +
      `Winding streets with crosswalks connect: a cozy little house (home), an elementary school with a playground, ` +
      `a small library, a neighborhood playground with a slide, a small grocery mart, a traditional market street with food stalls, ` +
      `a calm lake with a wooden walking path, and the blue sea with a sandy beach along the right edge. ` +
      `Green hills and pine trees on the left side. Clear roads, tidy town blocks, gentle daytime light. ` +
      `Cute travel-map / game-map look from straight above. ${STORYBOOK}`
  },
];

const PHOTO_JOBS = [
  { file: "assets/photos/school_1.jpg", prompt: `Child's eye-level view walking up to a small elementary school: a school gate, a crosswalk on a quiet street, a school building and an open playground behind, a flagpole, sunny morning. ${STORYBOOK}` },
  { file: "assets/photos/library_1.jpg", prompt: `Inside a cozy children's library reading room: low bookshelves at a child's height, small chairs, a soft rug, picture books, a shoe rack at the entrance, warm light. ${STORYBOOK}` },
  { file: "assets/photos/playground_1.jpg", prompt: `A neighborhood playground: a slide, swings, a sandbox, a bench, a few trees, sunny afternoon, seen from a child's eye level. ${STORYBOOK}` },
  { file: "assets/photos/mart_1.jpg", prompt: `Inside a small neighborhood grocery mart: aisles with milk and fresh fruit, a shopping basket, a checkout counter, friendly and bright. ${STORYBOOK}` },
  { file: "assets/photos/market_1.jpg", prompt: `A lively Korean traditional market alley: food stalls with hanging signboards, a famous crispy fried chicken (dakgangjeong) stand, a covered roof, people-friendly cozy lane seen at eye level. ${STORYBOOK}` },
  { file: "assets/photos/lake_1.jpg", prompt: `A calm lakeside walking path of Cheongchoho lagoon in Sokcho: a wooden deck path, benches, a few ducks on the water, mountains in the distance, gentle evening light, eye level. ${STORYBOOK}` },
  { file: "assets/photos/beach_1.jpg", prompt: `A sandy beach entrance: a walking path onto the sand, gentle waves, a few seagulls, pine trees beside the path, seen at a child's eye level (not aerial). ${STORYBOOK}` },
];

// 건물 내부 = 고각/탑다운 "플레이 가능한 방" 일러스트 (눈높이 사진 PHOTO_JOBS 와 다름).
// 캐릭터가 바닥 위를 걸어다닐 수 있도록 위에서 내려다본 2D RPG 방 지도 느낌. 세로형(모바일).
const INTERIOR_SIZE = "1024x1536";
const INTERIOR_JOBS = [
  { id: "library", file: "assets/interiors/library.png", size: INTERIOR_SIZE, quality: "high",
    prompt: `High-angle top-down view of a cozy children's library room, like a 2D RPG room map seen from above. ` +
      `Bookshelves along the walls, a big soft reading rug in the open center floor, low chairs, a picture-book stand, ` +
      `a shoe rack and a checkout counter near the bottom entrance. The lower-center floor is open and walkable. ${STORYBOOK}` },
  { id: "school", file: "assets/interiors/school.png", size: INTERIOR_SIZE, quality: "high",
    prompt: `High-angle top-down view of a friendly elementary-school classroom, like a 2D RPG room map seen from above. ` +
      `A teacher's desk and chalkboard near the top wall, rows of small desks along the sides, a flag and a clock on the wall, ` +
      `a wide open walkable floor in the lower-center, a door at the bottom entrance. ${STORYBOOK}` },
  { id: "mart", file: "assets/interiors/mart.png", size: INTERIOR_SIZE, quality: "high",
    prompt: `High-angle top-down view of a small neighborhood grocery mart, like a 2D RPG room map seen from above. ` +
      `Shelf aisles with milk and fresh fruit along the walls, shopping baskets, a checkout counter near the bottom, ` +
      `a wide open walkable aisle floor in the center-bottom, an entrance door at the bottom. ${STORYBOOK}` },
  { id: "daycare", file: "assets/interiors/daycare.png", size: INTERIOR_SIZE, quality: "high",
    prompt: `High-angle top-down view of a warm daycare playroom, like a 2D RPG room map seen from above. ` +
      `A small indoor slide and building blocks along one side, a soft nap mat, a picture-book stand, a shoe cubby near the bottom entrance, ` +
      `a big open soft-floor play area in the lower-center, a door at the bottom. ${STORYBOOK}` },
  { id: "playground", file: "assets/interiors/playground.png", size: INTERIOR_SIZE, quality: "high",
    prompt: `High-angle top-down view of a neighborhood playground, like a 2D RPG outdoor map seen from above. ` +
      `A slide and swings along the top, a sandbox, a bench, a few trees around the edges, ` +
      `a wide open walkable ground in the center-bottom, an entry gate at the bottom. ${STORYBOOK}` },
  { id: "market", file: "assets/interiors/market.png", size: INTERIOR_SIZE, quality: "high",
    prompt: `High-angle top-down view of a lively Korean traditional market alley, like a 2D RPG street map seen from above. ` +
      `Food stalls with hanging signboards along both sides, a famous crispy fried-chicken (dakgangjeong) stand, a covered roof edge, ` +
      `a checkout/pay spot, a wide open walkable lane down the center, an entrance at the bottom. ${STORYBOOK}` },
];

async function generate(job, apiKey) {
  const body = { model: "gpt-image-1", prompt: job.prompt, size: job.size || "1024x1024", n: 1, quality: job.quality || "medium" };
  const res = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` }, body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const data = await res.json();
  const b64 = data?.data?.[0]?.b64_json;
  if (!b64) throw new Error("응답에 b64_json 없음");
  return Buffer.from(b64, "base64");
}

async function main() {
  await loadEnv();
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) { console.error("❌ OPENAI_API_KEY 없음 (.env)"); process.exit(1); }
  const mode = (process.argv[2] || "all").toLowerCase();
  const idFilter = (process.argv[3] || "").toLowerCase(); // interiors 모드 선택적 id 필터
  let jobs;
  if (mode === "world") jobs = WORLD_JOBS;
  else if (mode === "photos") jobs = PHOTO_JOBS;
  else if (mode === "interiors") jobs = idFilter ? INTERIOR_JOBS.filter((j) => j.id === idFilter) : INTERIOR_JOBS;
  else jobs = [...WORLD_JOBS, ...PHOTO_JOBS];
  if (mode === "interiors" && idFilter && !jobs.length) { console.error(`❌ interiors id '${idFilter}' 없음 (library/school/mart/daycare/playground/market)`); process.exit(1); }
  console.log(`🎨 ${jobs.length}개 생성 시작 (mode: ${mode})\n`);
  let ok = 0, fail = 0;
  for (const job of jobs) {
    const out = path.join(__dirname, job.file);
    process.stdout.write(`  • ${job.file} ... `);
    try {
      const buf = await generate(job, apiKey);
      await fs.mkdir(path.dirname(out), { recursive: true });
      await fs.writeFile(out, buf);
      console.log(`✅ (${(buf.length / 1024).toFixed(0)} KB)`); ok++;
    } catch (e) { console.log(`❌ ${e.message}`); fail++; }
  }
  console.log(`\n완료: 성공 ${ok}, 실패 ${fail}`);
}
main().catch((e) => { console.error(e); process.exit(1); });
