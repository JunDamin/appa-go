#!/usr/bin/env node
/* ============================================================
   아빠, Go! — 월드맵 OSM 데이터 수집기 (빌드타임 전용)
   OpenStreetMap(Overpass + 검증된 Nominatim 앵커) → data/geo.json

   런타임은 이 결과(data/geo.json)만 읽는다. 런타임에 OSM 호출 없음.
   OSM은 키 불필요(무료·무인증). ODbL → © OpenStreetMap contributors.

   사용법:
     node build-map.mjs           # bbox 내 해안선·호수·주요도로·숲 + 장소앵커 → data/geo.json
   필요: Node 18+ (전역 fetch)
   ============================================================ */
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const UA = "appa-go-dev/1.0 (educational kids game; contact gpt@koica.go.kr)";

// 게임권역 bbox (handoff §3.1: 6장소 + 동해 동쪽 + 설악 서쪽 가장자리를 감싸되 과밀하지 않게)
const BBOX = { minLat: 38.183, maxLat: 38.224, minLon: 128.565, maxLon: 128.610 };

// 실제 장소 앵커 (library/market = Nominatim 검증 실좌표, 나머지는 조양동 신시가지/청초호 남안 유도좌표)
// real:true = Nominatim 검증 실좌표(정확 유지). 나머지는 조양동 신시가지/청초호 남안의
// 유도좌표 — 실제 방위는 유지하되 5~9세 걷기·라벨 가독을 위해 약간 벌려 배치(약간 변형 허용).
const PLACE_ANCHORS = [
  { id: "market",     lon: 128.5897997, lat: 38.2047700, real: true  }, // 속초관광수산시장 (북)
  { id: "library",    lon: 128.5906420, lat: 38.1867317, real: true  }, // 속초시립도서관 (남/조양동)
  { id: "playground", lon: 128.5875000, lat: 38.1935000, real: false }, // 청초호 남안 놀이터
  { id: "school",     lon: 128.5840000, lat: 38.1890000, real: false }, // 조양동 서쪽
  { id: "daycare",    lon: 128.5862000, lat: 38.1858000, real: false }, // 조양동 남서
  { id: "mart",       lon: 128.5940000, lat: 38.1855000, real: false }, // 조양동 남동
];
const HOME = { lon: 128.5885, lat: 38.1875 }; // 우리집 spawn (조양동 중심)

const OVERPASS = "https://overpass-api.de/api/interpreter";
const bboxStr = `${BBOX.minLat},${BBOX.minLon},${BBOX.maxLat},${BBOX.maxLon}`;
const QL = `[out:json][timeout:90];
(
  way["natural"="coastline"](${bboxStr});
  way["natural"="water"](${bboxStr});
  relation["natural"="water"](${bboxStr});
  way["water"="lake"](${bboxStr});
  way["highway"~"^(primary|secondary|trunk|tertiary)$"](${bboxStr});
  way["natural"="wood"](${bboxStr});
  way["landuse"="forest"](${bboxStr});
);
out geom;`;

// 좌표 다운샘플 (타일 해상도에 맞춰 노이즈 제거): 매 n번째 점만 + 시작/끝 보존
function downsample(points, step) {
  if (!points || points.length <= 2) return points || [];
  const out = [];
  for (let i = 0; i < points.length; i += step) out.push(points[i]);
  const last = points[points.length - 1];
  if (out[out.length - 1] !== last) out.push(last);
  return out;
}

async function fetchOverpass() {
  const res = await fetch(OVERPASS, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", "User-Agent": UA },
    body: "data=" + encodeURIComponent(QL),
  });
  if (!res.ok) throw new Error(`Overpass HTTP ${res.status}: ${(await res.text()).slice(0, 300)}`);
  return res.json();
}

function classify(els) {
  const coastline = [], lakes = [], roads = [], forest = [];
  for (const el of els) {
    if (!el.geometry || !el.geometry.length) continue;
    const pts = el.geometry.map((g) => [+g.lon.toFixed(6), +g.lat.toFixed(6)]);
    const t = el.tags || {};
    if (t.natural === "coastline") coastline.push(downsample(pts, 3));
    else if (t.natural === "water" || t.water === "lake") lakes.push({ name: t.name || null, polygon: downsample(pts, 2) });
    else if (t.highway) roads.push({ name: t.name || null, kind: t.highway, line: downsample(pts, 2) });
    else if (t.natural === "wood" || t.landuse === "forest") forest.push({ polygon: downsample(pts, 3) });
  }
  return { coastline, lakes, roads, forest };
}

async function main() {
  console.log(`🗺  OSM 수집 시작 — bbox ${bboxStr}`);
  let geo;
  try {
    const data = await fetchOverpass();
    const c = classify(data.elements || []);
    console.log(`   해안선 ${c.coastline.length} · 호수 ${c.lakes.length} · 도로 ${c.roads.length} · 숲 ${c.forest.length}`);
    geo = c;
  } catch (e) {
    console.error(`❌ Overpass 실패: ${e.message}`);
    console.error("   네트워크/Overpass 일시 장애일 수 있음. 기존 data/geo.json 유지하고 종료합니다 (덮어쓰지 않음).");
    process.exit(1); // 빈 결과로 덮어쓰지 않는다 (slop 방지: 무성의 폴백 금지)
  }

  const out = {
    meta: {
      source: "OpenStreetMap",
      license: "ODbL © OpenStreetMap contributors",
      generatedAt: new Date().toISOString(),
      bbox: BBOX,
      note: "빌드타임 수집물. 런타임은 이 파일만 읽음(네트워크 0).",
    },
    bbox: BBOX,
    coastline: geo.coastline,
    lakes: geo.lakes,
    roads: geo.roads,
    forest: geo.forest,
    places: PLACE_ANCHORS,
    home: HOME,
    seaEdgeLon: 128.602, // 이 경도 동쪽은 동해로 간주 (해안선 데이터 보강용 힌트)
  };

  const dataDir = path.join(__dirname, "data");
  await fs.mkdir(dataDir, { recursive: true });
  // geo.json: 검토·diff용 canonical 산출물
  await fs.writeFile(path.join(dataDir, "geo.json"), JSON.stringify(out, null, 2));
  // geo.js: 런타임 브라우저 전역 (places.js 패턴과 동일, file:// fetch 회피)
  await fs.writeFile(path.join(dataDir, "geo.js"),
    "/* 자동생성(build-map.mjs) — 직접 편집 금지. ODbL © OpenStreetMap contributors */\n" +
    "globalThis.GEO = " + JSON.stringify(out) + ";\n");
  console.log(`✅ data/geo.json + data/geo.js 작성 (${(JSON.stringify(out).length / 1024).toFixed(1)} KB)`);

  // ── 베이크: geo → 44×38 타일맵을 정적 data/worldmap.js 로 굽기 (런타임은 이것만 읽음) ──
  const { buildWorldFromGeo } = require("./data/worldgen.js");
  const wm = buildWorldFromGeo(out);
  await fs.writeFile(path.join(dataDir, "worldmap.js"),
    "/* 자동생성(build-map.mjs → worldgen.js) — 직접 편집 금지.\n" +
    "   실제 OSM 데이터 기반 속초 월드맵 타일. ODbL © OpenStreetMap contributors */\n" +
    "globalThis.WORLDMAP = " + JSON.stringify(wm) + ";\n");
  console.log(`✅ data/worldmap.js 베이크 — places ${JSON.stringify(wm.placesXY)} spawn ${JSON.stringify(wm.spawn)} trees ${wm.trees.length}`);
}
main().catch((e) => { console.error(e); process.exit(1); });
