#!/usr/bin/env node
/* ============================================================
   아빠, Go! — 추가 에셋 생성 (메인 세션 / 빌드타임 전용)
     - VOICE: OpenAI TTS(gpt-4o-mini-tts)로 자연스러운 음성 — 인트로 + 모든 장소 대사
              → assets/voice/intro_{i}.mp3, {placeId}_d{i}.mp3
     - INTRO: "이사하는 느낌" 일러스트 3컷 → assets/intro/intro_1..3.jpg
   ⚠️ Node 전용. .env OPENAI_API_KEY 사용(브라우저 노출 없음).
   사용법: node generate-extras.mjs        # 음성+이미지 전부
           node generate-extras.mjs voice  / images
   ============================================================ */
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
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

// 장소별 음성·톤
const VOICE = { school: "nova", library: "shimmer", playground: "nova", market: "coral", mart: "onyx", lake: "onyx", beach: "fable" };
const INSTR = {
  school: "다정하고 따뜻한 초등학교 담임 선생님이 어린아이에게 부드럽게 말하듯.",
  library: "조용하고 차분한 도서관 선생님이 아이에게 속삭이듯 부드럽게.",
  playground: "밝고 명랑한 또래 아이가 새 친구에게 신나게 말하듯.",
  market: "활기차고 정 많은 시장 아주머니가 따뜻하게.",
  mart: "친절한 동네 마트 아저씨가 차분하고 다정하게.",
  lake: "느리고 낮은 목소리의 자상한 할아버지가 아이를 다독이듯.",
  beach: "장난스럽고 밝은 갈매기 캐릭터가 신나게.",
};
const INTRO_LINES = [
  "오늘 우리 가족은 새 동네, 속초로 이사 왔어요.",
  "낯선 길, 낯선 학교, 낯선 가게들. 조금 떨리죠?",
  "걱정 마요. 아빠와 함께 속초에서의 하루를 미리 살아봐요!",
];
const INTRO_VOICE = "fable";
const INTRO_INSTR = "따뜻하고 안심시키는 아빠/내레이터가 새 동네로 이사 온 어린아이에게 부드럽게 이야기하듯.";

const STORYBOOK = "warm pastel storybook illustration, soft friendly colors, cozy, hopeful, child-friendly, no text, no words";
const INTRO_IMG = [
  { file: "assets/intro/intro_1.jpg", prompt: `A family on moving day: a small moving truck with cardboard boxes, a young child holding a backpack and a teddy bear, parents carrying boxes, leaving their old home, gentle hopeful mood. ${STORYBOOK}` },
  { file: "assets/intro/intro_2.jpg", prompt: `A young child looking out a car window at a small Korean seaside town (Sokcho) — the blue sea, mountains, and little houses coming into view, a sense of arrival and wonder. ${STORYBOOK}` },
  { file: "assets/intro/intro_3.jpg", prompt: `A child and their dad standing together at the start of their new neighborhood street in Sokcho, holding hands, looking at the houses and the sea in the distance, hopeful and warm. ${STORYBOOK}` },
];

async function tts(text, voice, instructions, apiKey) {
  const res = await fetch("https://api.openai.com/v1/audio/speech", {
    method: "POST", headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: "gpt-4o-mini-tts", voice, input: text, instructions, response_format: "mp3" }),
  });
  if (!res.ok) throw new Error(`TTS ${res.status}: ${(await res.text()).slice(0, 200)}`);
  return Buffer.from(await res.arrayBuffer());
}
async function img(prompt, apiKey) {
  const res = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST", headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: "gpt-image-1", prompt, size: "1024x1024", n: 1, quality: "medium" }),
  });
  if (!res.ok) throw new Error(`IMG ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = await res.json();
  return Buffer.from(data.data[0].b64_json, "base64");
}
async function save(file, buf) {
  const out = path.join(__dirname, file);
  await fs.mkdir(path.dirname(out), { recursive: true });
  await fs.writeFile(out, buf);
}

async function main() {
  await loadEnv();
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) { console.error("❌ OPENAI_API_KEY 없음"); process.exit(1); }
  const mode = (process.argv[2] || "all").toLowerCase();
  await import(pathToFileURL(path.join(__dirname, "data/places.js")).href);
  const PLACES = globalThis.PLACES || [];

  let ok = 0, fail = 0;
  const run = async (label, fn) => { process.stdout.write(`  • ${label} ... `); try { await fn(); console.log("✅"); ok++; } catch (e) { console.log("❌ " + e.message); fail++; } };

  if (mode === "all" || mode === "voice") {
    console.log("🎙️  음성 생성 (OpenAI TTS)");
    for (let i = 0; i < INTRO_LINES.length; i++)
      await run(`intro_${i}`, async () => save(`assets/voice/intro_${i}.mp3`, await tts(INTRO_LINES[i], INTRO_VOICE, INTRO_INSTR, apiKey)));
    for (const p of PLACES) {
      const voice = VOICE[p.id] || "nova", instr = INSTR[p.id] || "어린아이에게 다정하게.";
      for (let i = 0; i < (p.dialogue || []).length; i++)
        await run(`${p.id}_d${i}`, async () => save(`assets/voice/${p.id}_d${i}.mp3`, await tts(p.dialogue[i], voice, instr, apiKey)));
    }
  }
  if (mode === "all" || mode === "images") {
    console.log("🎨 인트로 이미지 생성 (gpt-image-1)");
    for (const j of INTRO_IMG) await run(j.file, async () => save(j.file, await img(j.prompt, apiKey)));
  }
  console.log(`\n완료: 성공 ${ok}, 실패 ${fail}`);
}
main().catch((e) => { console.error(e); process.exit(1); });
