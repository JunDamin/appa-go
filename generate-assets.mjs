#!/usr/bin/env node
/* ============================================================
   아빠, Go! — 에셋 생성 (빌드타임 전용, OpenAI gpt-image-1)
   A+B 현실성 방향:
     - WORLD: 위에서 본 속초 동네 일러스트 지도 1장 (월드맵 배경)
     - PHOTOS: 7개 일상 장소의 "진짜 모습 보기"용 일상컷 7장

   ⚠️ Node 전용. API 키(.env OPENAI_API_KEY)는 브라우저로 들어가지 않음.
   사용법:
     node generate-assets.mjs            # 월드 + 사진 전부
     node generate-assets.mjs world      # 월드맵만
     node generate-assets.mjs photos     # 사진만
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
  let jobs = mode === "world" ? WORLD_JOBS : mode === "photos" ? PHOTO_JOBS : [...WORLD_JOBS, ...PHOTO_JOBS];
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
