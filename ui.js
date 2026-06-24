/* ============================================================
   아빠, Go! — UI 레이어 (DOM 오버레이 + 음성)
   Phaser 씬과 분리. 씬은 NPC 근접 시 UI.startExperience(place, onDone) 호출.
   흐름: 대사 → 사진+찾기미션 → 퀘스트 선택 → 보물조각 → (전부 모으면) 결과
   ============================================================ */
window.UI = (function () {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const PLACES = globalThis.PLACES || [];

  const S = {
    collected: {},
    activePlace: null,
    dlgIdx: 0,
    photoIdx: 0,
    isOpen: false,
    onDone: null,     // (place) => void  — 한 장소 완료(보상까지)
    onReplay: null,   // () => void
  };

  /* ---------- 음성 ---------- */
  let koVoice = null;
  function loadVoice() {
    const v = window.speechSynthesis ? speechSynthesis.getVoices() : [];
    koVoice = v.find((x) => /ko(-|_)?KR/i.test(x.lang)) || v.find((x) => /korean|한국/i.test(x.name)) || null;
  }
  if (window.speechSynthesis) { loadVoice(); speechSynthesis.onvoiceschanged = loadVoice; }
  function speak(text, pitch = 1, rate = 1) {
    if (!window.speechSynthesis) return; speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text); u.lang = "ko-KR"; u.pitch = pitch; u.rate = rate;
    if (koVoice) u.voice = koVoice; speechSynthesis.speak(u);
  }
  function stopSpeak() { if (window.speechSynthesis) speechSynthesis.cancel(); }

  /* ---------- 오버레이 ---------- */
  function open(id) { S.isOpen = true; $(id).classList.add("active"); }
  function close(id) { $(id).classList.remove("active"); $(id).querySelectorAll(".photo-dots").forEach((d) => d.remove()); }

  function drawAvatar(place) {
    const cv = $("d-npc-avatar"); if (!cv || !cv.getContext) return;
    const g = cv.getContext("2d");
    g.clearRect(0, 0, cv.width, cv.height);
    g.fillStyle = "#fff8e6"; g.fillRect(0, 0, cv.width, cv.height);
    g.font = "60px serif"; g.textAlign = "center"; g.textBaseline = "middle";
    g.fillText(place.npc.emoji || place.emoji, cv.width / 2, cv.height / 2 + 4);
  }

  /* ---------- 흐름 ---------- */
  function startExperience(place) {
    S.activePlace = place; S.dlgIdx = 0;
    $("d-place-emoji").textContent = place.emoji;
    $("d-place-name").textContent = place.name;
    $("d-speaker").textContent = place.npc.name;
    drawAvatar(place);
    showLine(); open("dialogue-overlay");
  }
  function showLine() {
    const p = S.activePlace, last = S.dlgIdx >= p.dialogue.length - 1;
    $("d-text").textContent = p.dialogue[S.dlgIdx];
    $("btn-next").textContent = last ? "📷 진짜 모습 보기" : "다음 ▶";
  }
  function nextDialogue() {
    const p = S.activePlace;
    if (S.dlgIdx < p.dialogue.length - 1) { S.dlgIdx++; showLine(); }
    else { stopSpeak(); close("dialogue-overlay"); openPhoto(p); }
  }

  function openPhoto(place) {
    S.activePlace = place; S.photoIdx = 0;
    $("p-place-name").textContent = place.name;
    $("photo-credit").textContent = place.photoCredit || "";
    renderPhoto(); renderMission(); open("photo-overlay");
  }
  function renderPhoto() {
    const place = S.activePlace, frame = $("photo-frame"); frame.innerHTML = "";
    const photos = place.photos && place.photos.length ? place.photos : [null];
    const src = photos[S.photoIdx % photos.length];
    const ph = () => {
      const div = document.createElement("div"); div.className = "ph";
      div.style.background = `linear-gradient(160deg, ${place.color}, ${shade(place.color, -30)})`;
      div.innerHTML = `<div class="ph-emoji">${place.emoji}</div><div class="ph-name">${place.name}</div><div class="ph-note">실제 사진을 넣으면 여기에 표시돼요</div>`;
      frame.appendChild(div);
    };
    if (src) { const img = new Image(); img.onload = () => { frame.innerHTML = ""; frame.appendChild(img); }; img.onerror = ph; img.src = src; } else ph();
  }
  function renderMission() {
    const ul = $("mission-list"); ul.innerHTML = "";
    S.activePlace.lookMission.forEach((item) => {
      const li = document.createElement("li"); li.innerHTML = `<span class="chk"></span><span>${item}</span>`;
      li.addEventListener("click", () => { li.classList.toggle("checked"); li.querySelector(".chk").textContent = li.classList.contains("checked") ? "✓" : ""; });
      ul.appendChild(li);
    });
  }

  function openQuest(place) {
    S.activePlace = place; $("quest-result").textContent = ""; $("btn-quest-done").classList.add("hidden");
    const wrap = $("quest-choices"); wrap.innerHTML = ""; wrap.classList.remove("hidden");
    place.choices.forEach((c) => {
      const b = document.createElement("button"); b.className = "choice"; b.textContent = c.text;
      b.addEventListener("click", () => { wrap.classList.add("hidden"); $("quest-result").textContent = "🎉 " + c.result; ding(); $("btn-quest-done").classList.remove("hidden"); });
      wrap.appendChild(b);
    });
    open("quest-overlay");
  }

  function finishPlace() {
    const place = S.activePlace;
    S.collected[place.id] = place.piece;
    close("quest-overlay");
    renderPiecesHud(); showParentTip(place);
    const all = Object.keys(S.collected).length >= PLACES.length;
    S.isOpen = all; // 결과창이면 계속 열림
    if (all) { setTimeout(showResult, 600); }
    if (typeof S.onDone === "function") S.onDone(place, all);
  }

  function renderPiecesHud() {
    const hud = $("pieces-hud"); if (!hud) return; hud.innerHTML = "";
    PLACES.forEach((p) => { const s = document.createElement("span"); const g = S.collected[p.id]; s.className = "slot" + (g ? " filled" : ""); s.textContent = g ? g.emoji : "◇"; hud.appendChild(s); });
  }
  function showParentTip(place) {
    const tip = $("parent-tip"); tip.innerHTML = `<b>👨‍👧 부모님 팁</b><br/>${place.parentTip}`;
    tip.classList.add("show"); clearTimeout(showParentTip._t); showParentTip._t = setTimeout(() => tip.classList.remove("show"), 5000);
  }
  function showResult() {
    const byId = {}; PLACES.forEach((p) => (byId[p.id] = p));
    const order = { morning: 0, afterschool: 1, evening: 2, night: 3, weekend: 4 };
    const got = PLACES.filter((p) => S.collected[p.id]).sort((a, b) => (order[a.dayPhase] || 9) - (order[b.dayPhase] || 9));

    const wrap = $("result-pieces"); wrap.innerHTML = "";
    got.forEach((p, i) => { const s = document.createElement("span"); s.textContent = (p.card && p.card.title) ? p.piece.emoji : p.piece.emoji; s.title = p.card ? p.card.title : ""; s.style.animationDelay = i * 0.15 + "s"; wrap.appendChild(s); });

    // "나의 속초 하루지도" 내러티브
    const lines = got.map((p) => (p.card && p.card.line) ? p.card.line : null).filter(Boolean);
    const ov = $("result-overlay");
    const t = ov.querySelector(".result-title"); if (t) t.textContent = "나의 속초 하루지도";
    const sub = ov.querySelector(".result-sub"); if (sub) sub.textContent = "속초에서의 하루를 미리 살아봤어요!";
    const msg = ov.querySelector(".result-msg");
    if (msg) msg.innerHTML = lines.join("<br/>") + "<br/><br/>속초가 조금 내 동네처럼 느껴졌나요?";

    open("result-overlay"); ding();
  }

  /* ---------- 작은 효과음 (실제 SFX 도착 전 폴백) ---------- */
  let actx = null;
  function ding() {
    if (window.AUDIO && AUDIO.play && AUDIO.play("reward")) return;
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      [880, 1320].forEach((f, i) => {
        const o = actx.createOscillator(), g = actx.createGain(); o.type = "triangle"; o.frequency.value = f;
        o.connect(g); g.connect(actx.destination); const t0 = actx.currentTime + i * 0.12;
        g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(0.25, t0 + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.25);
        o.start(t0); o.stop(t0 + 0.26);
      });
    } catch (e) {}
  }

  function shade(hex, amt) {
    const c = hex.replace("#", ""); const n = parseInt(c.length === 3 ? c.split("").map((x) => x + x).join("") : c, 16);
    let R = (n >> 16) + amt, G = ((n >> 8) & 255) + amt, B = (n & 255) + amt;
    R = Math.max(0, Math.min(255, R)); G = Math.max(0, Math.min(255, G)); B = Math.max(0, Math.min(255, B));
    return `rgb(${R},${G},${B})`;
  }

  function reset() { S.collected = {}; renderPiecesHud(); }
  function closeAll() {
    stopSpeak();
    ["dialogue-overlay", "photo-overlay", "quest-overlay", "result-overlay"].forEach(close);
    S.isOpen = false;
  }

  /* ---------- 버튼 바인딩 ---------- */
  function bind() {
    $("btn-next").addEventListener("click", nextDialogue);
    $("btn-speak").addEventListener("click", () => { const p = S.activePlace; speak(p.dialogue[S.dlgIdx], p.npc.pitch, p.npc.rate); });
    $("btn-photo-speak").addEventListener("click", () => { const p = S.activePlace; speak(`진짜 ${p.name}이에요! 사진 속에서 ${p.lookMission.join(", ")}를 찾아봐요.`, p.npc.pitch, p.npc.rate); });
    $("btn-photo-back").addEventListener("click", () => { stopSpeak(); close("photo-overlay"); openQuest(S.activePlace); });
    $("btn-quest-done").addEventListener("click", finishPlace);
    $("btn-replay").addEventListener("click", () => { close("result-overlay"); reset(); if (typeof S.onReplay === "function") S.onReplay(); });
    bindKeys();
  }

  // 데스크톱 키보드 진행: Enter/Space=다음, 1/2=선택지, V=목소리, 시작화면 Enter=시작
  function bindKeys() {
    const active = (id) => $(id).classList.contains("active");
    window.addEventListener("keydown", (e) => {
      const k = e.key;
      if (active("result-overlay")) {
        if (k === "Enter" || k === " ") { e.preventDefault(); $("btn-replay").click(); }
        return;
      }
      if (active("quest-overlay")) {
        const choices = $("quest-choices").querySelectorAll(".choice");
        if (k === "1" && choices[0]) { e.preventDefault(); choices[0].click(); }
        else if (k === "2" && choices[1]) { e.preventDefault(); choices[1].click(); }
        else if (k === "Enter" || k === " ") { const d = $("btn-quest-done"); if (!d.classList.contains("hidden")) { e.preventDefault(); d.click(); } }
        return;
      }
      if (active("photo-overlay")) {
        if (k === "Enter" || k === " ") { e.preventDefault(); $("btn-photo-back").click(); }
        else if (k === "v" || k === "V") { e.preventDefault(); $("btn-photo-speak").click(); }
        return;
      }
      if (active("dialogue-overlay")) {
        if (k === "Enter" || k === " ") { e.preventDefault(); $("btn-next").click(); }
        else if (k === "v" || k === "V") { e.preventDefault(); $("btn-speak").click(); }
        return;
      }
      const start = document.getElementById("screen-start");
      if (start && start.classList.contains("active") && (k === "Enter" || k === " ")) { e.preventDefault(); $("btn-start").click(); }
    });
  }
  if (document.readyState !== "loading") bind(); else document.addEventListener("DOMContentLoaded", bind);

  return {
    get isOpen() { return S.isOpen; },
    set onDone(fn) { S.onDone = fn; },
    set onReplay(fn) { S.onReplay = fn; },
    startExperience, reset, closeAll, renderPiecesHud,
    isCollected: (id) => !!S.collected[id],
    collectedCount: () => Object.keys(S.collected).length,
    speak, stopSpeak,
  };
})();
