/* ============================================================
   아빠, Go! — 월드맵 래스터화 (실제 OSM geo → 44×38 타일)
   입력: globalThis.GEO (data/geo.js, build-map.mjs 산출)
   출력: { cols, rows, data[][], trees[], placesXY{id:{x,y}}, spawn{x,y} }
   타일 인덱스(game.js 합성셋): grass=0, water=1, sand=2, road=3

   원리: 데이터=어디에 무엇이(WHERE). 비율 "느낌" 보존(aspect-fit), 약간 변형 허용.
   ODbL © OpenStreetMap contributors.
   ============================================================ */
(function () {
  "use strict";
  const COLS = 44, ROWS = 38;
  const T = { grass: 0, water: 1, sand: 2, road: 3 };
  const mPerLat = 111000, mPerLon = 111000 * Math.cos(38.2 * Math.PI / 180);

  function makeProj(b) {
    const wM = (b.maxLon - b.minLon) * mPerLon, hM = (b.maxLat - b.minLat) * mPerLat;
    const scale = Math.min((COLS - 1) / wM, (ROWS - 1) / hM);
    const xOff = ((COLS - 1) - wM * scale) / 2, yOff = ((ROWS - 1) - hM * scale) / 2;
    return {
      toTile: (lon, lat) => ({
        x: Math.round((lon - b.minLon) * mPerLon * scale + xOff),
        y: Math.round((b.maxLat - lat) * mPerLat * scale + yOff),
      }),
      // 타일 중심 → 위경도 (역투영)
      toLonLat: (x, y) => ({
        lon: b.minLon + (x - xOff) / (mPerLon * scale),
        lat: b.maxLat - (y - yOff) / (mPerLat * scale),
      }),
    };
  }

  // ray-casting point-in-polygon (poly = [[lon,lat],...])
  function inPoly(lon, lat, poly) {
    let inside = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const xi = poly[i][0], yi = poly[i][1], xj = poly[j][0], yj = poly[j][1];
      if ((yi > lat) !== (yj > lat) && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) inside = !inside;
    }
    return inside;
  }

  function line(data, x0, y0, x1, y1, val, blockedSet) {
    // bresenham, 물 위에는 안 그림
    let dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0);
    let sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1, err = dx + dy;
    for (;;) {
      if (x0 >= 0 && x0 < COLS && y0 >= 0 && y0 < ROWS && !(blockedSet && blockedSet.has(y0 * COLS + x0)))
        data[y0][x0] = val;
      if (x0 === x1 && y0 === y1) break;
      const e2 = 2 * err;
      if (e2 >= dy) { err += dy; x0 += sx; }
      if (e2 <= dx) { err += dx; y0 += sy; }
    }
  }

  function build(GEO) {
    const b = GEO.bbox, proj = makeProj(b);
    const data = Array.from({ length: ROWS }, () => Array(COLS).fill(T.grass));
    const seaSet = new Set();

    // 동해 해안선 lat→경계lon 함수 (해안선 점들에서 가장 가까운 lat의 lon)
    const coastPts = [].concat(...(GEO.coastline || []));
    function coastLonAt(lat) {
      let best = null, bd = Infinity;
      for (const p of coastPts) { const d = Math.abs(p[1] - lat); if (d < bd) { bd = d; best = p[0]; } }
      return best != null ? best : GEO.seaEdgeLon; // 해안선 점이 없으면 동쪽 경계 힌트
    }

    // 1) 바다: 타일 경도가 해당 위도의 해안선 경도보다 동쪽이면 물
    for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
      const c = proj.toLonLat(x, y);
      if (c.lon >= coastLonAt(c.lat)) { data[y][x] = T.water; seaSet.add(y * COLS + x); }
    }
    // 2) 호수(청초호 등): 폴리곤 내부 → 물
    for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
      if (data[y][x] === T.water) continue;
      const c = proj.toLonLat(x, y);
      for (const lk of GEO.lakes || []) if (lk.polygon.length >= 3 && inPoly(c.lon, c.lat, lk.polygon)) { data[y][x] = T.water; break; }
    }
    // 3) 해안 모래: 바다 타일의 서쪽 육지 한 줄
    for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS - 1; x++) {
      if (data[y][x] === T.grass && seaSet.has(y * COLS + (x + 1))) data[y][x] = T.sand;
    }
    // 4) 주요 도로(primary/secondary): 폴리라인 래스터화 (물 위 제외)
    const water = new Set();
    for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) if (data[y][x] === T.water) water.add(y * COLS + x);
    for (const r of GEO.roads || []) {
      if (r.kind !== "primary" && r.kind !== "secondary") continue;
      const tp = r.line.map((p) => proj.toTile(p[0], p[1]));
      for (let i = 1; i < tp.length; i++) line(data, tp[i - 1].x, tp[i - 1].y, tp[i].x, tp[i].y, T.road, water);
    }
    // 5) 숲(설악 방면): 폴리곤 내부 grass 타일에 나무 분포(결정적 샘플)
    const trees = [];
    for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
      if (data[y][x] !== T.grass) continue;
      const c = proj.toLonLat(x, y);
      let inForest = false;
      for (const f of GEO.forest || []) if (f.polygon.length >= 3 && inPoly(c.lon, c.lat, f.polygon)) { inForest = true; break; }
      if (inForest && (x * 7 + y * 13) % 3 === 0) trees.push({ x, y });
    }

    // 6) 장소 좌표: 실위경도 → 타일, 물이면 인근 육지로, 최소간격 보정
    function nearestLand(x, y) {
      if (data[y] && data[y][x] !== undefined && data[y][x] !== T.water) return { x, y };
      for (let r = 1; r <= 6; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
        const nx = x + dx, ny = y + dy;
        if (nx >= 0 && nx < COLS && ny >= 0 && ny < ROWS && data[ny][nx] !== T.water) return { x: nx, y: ny };
      }
      return { x: Math.max(0, Math.min(COLS - 1, x)), y: Math.max(0, Math.min(ROWS - 1, y)) };
    }
    const used = new Set(), placesXY = {};
    for (const p of GEO.places || []) {
      let t = proj.toTile(p.lon, p.lat);
      t = nearestLand(t.x, t.y);
      let guard = 0;
      while (used.has(t.y * COLS + t.x) && guard++ < 12) { t = nearestLand(t.x + 1, t.y); }
      used.add(t.y * COLS + t.x);
      placesXY[p.id] = { x: t.x, y: t.y };
    }
    let spawn = proj.toTile(GEO.home.lon, GEO.home.lat);
    spawn = nearestLand(spawn.x, spawn.y);

    return { cols: COLS, rows: ROWS, data, trees, placesXY, spawn, T };
  }

  globalThis.buildWorldFromGeo = build;
  if (typeof module !== "undefined" && module.exports) module.exports = { buildWorldFromGeo: build, COLS, ROWS };
})();
