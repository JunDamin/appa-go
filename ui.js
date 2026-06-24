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

  // 자연 음성(OpenAI TTS 사전생성 mp3) 우선, 없으면 Web Speech 폴백.
  let voiceEl = null;
  function playVoice(key, text, pitch, rate) {
    stopSpeak();
    try { if (voiceEl) { voiceEl.pause(); voiceEl.currentTime = 0; } } catch (e) {}
    let done = false;
    const fb = () => { if (done) return; done = true; speak(text, pitch == null ? 1 : pitch, rate == null ? 1 : rate); };
    voiceEl = new Audio("assets/voice/" + key + ".mp3");
    voiceEl.volume = 1.0;
    voiceEl.onerror = fb;
    voiceEl.play().then(() => { done = true; }).catch(fb);
  }
  function stopAllVoice() { stopSpeak(); try { if (voiceEl) voiceEl.pause(); } catch (e) {} }

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
    if (S.quest && !S.quest.done && place.id === S.quest.id) questComplete(); // 퀘스트 대상 NPC 만남
    $("d-place-emoji").textContent = place.emoji;
    $("d-place-name").textContent = place.name;
    $("d-speaker").textContent = place.npc.name;
    drawAvatar(place);
    showLine(); open("dialogue-overlay");
  }
  let typerId = null;
  function typeText(el, text) {
    clearInterval(typerId); el.textContent = "";
    let i = 0; typerId = setInterval(() => { el.textContent = text.slice(0, ++i); if (i >= text.length) clearInterval(typerId); }, 26);
  }
  function showLine() {
    const p = S.activePlace, last = S.dlgIdx >= p.dialogue.length - 1;
    typeText($("d-text"), p.dialogue[S.dlgIdx]); // 타이핑 연출
    $("btn-next").textContent = last ? "📷 진짜 모습 보기" : "다음 ▶";
    playVoice(p.id + "_d" + S.dlgIdx, p.dialogue[S.dlgIdx], p.npc.pitch, p.npc.rate); // 자동 자연 음성
  }
  function nextDialogue() {
    const p = S.activePlace;
    if (S.dlgIdx < p.dialogue.length - 1) { S.dlgIdx++; showLine(); }
    else { stopAllVoice(); close("dialogue-overlay"); openPhoto(p); }
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
  /* ---------- 제한시간 찾기 퀘스트 ---------- */
  let missionTimerId = null;
  function stopMissionTimer() { if (missionTimerId) { clearInterval(missionTimerId); missionTimerId = null; } }
  function ensureMissionUI() {
    const block = $("mission-list").parentElement;
    if (!$("mission-timer")) {
      const t = document.createElement("div"); t.id = "mission-timer"; t.className = "mission-timer";
      t.innerHTML = `<div class="mt-bar"><div id="mt-fill" class="mt-fill"></div></div><span id="mt-secs">30</span><small>초</small>`;
      block.insertBefore(t, $("mission-list"));
    }
    if (!$("mission-result")) {
      const r = document.createElement("div"); r.id = "mission-result"; r.className = "mission-result"; block.appendChild(r);
    }
  }
  function renderMission() {
    const place = S.activePlace;
    ensureMissionUI();
    S.missionDone = false;
    const r = $("mission-result"); r.textContent = ""; r.className = "mission-result";
    const head = $("mission-list").parentElement.querySelector(".mission-head");
    if (head) head.innerHTML = "🎯 30초 안에 사진 속에서 다 찾아볼까?";
    const ul = $("mission-list"); ul.innerHTML = "";
    const total = place.lookMission.length; let found = 0;
    place.lookMission.forEach((item) => {
      const li = document.createElement("li"); li.innerHTML = `<span class="chk"></span><span>${item}</span>`;
      li.addEventListener("click", () => {
        if (S.missionDone || li.classList.contains("checked")) return;
        li.classList.add("checked"); li.querySelector(".chk").textContent = "✓";
        try { if (window.AUDIO) AUDIO.play("pop"); } catch (e) {}
        if (++found >= total) missionSuccess();
      });
      ul.appendChild(li);
    });
    startMissionTimer(30);
  }
  function startMissionTimer(sec) {
    stopMissionTimer();
    const fill = $("mt-fill"), secs = $("mt-secs"), tEl = $("mission-timer");
    if (fill) fill.style.width = "100%"; if (secs) secs.textContent = sec; if (tEl) tEl.classList.remove("low");
    const t0 = Date.now();
    missionTimerId = setInterval(() => {
      const left = Math.max(0, sec - (Date.now() - t0) / 1000);
      if (fill) fill.style.width = (left / sec * 100) + "%";
      if (secs) secs.textContent = Math.ceil(left);
      if (tEl) tEl.classList.toggle("low", left <= 8);
      if (left <= 0) missionTimeout();
    }, 100);
  }
  function missionSuccess() {
    if (S.missionDone) return; S.missionDone = true; stopMissionTimer();
    const r = $("mission-result"); if (r) { r.textContent = "🎉 다 찾았어요! 멋져요!"; r.className = "mission-result ok"; }
    try { if (window.AUDIO) AUDIO.play("success"); } catch (e) {}
  }
  function missionTimeout() {
    if (S.missionDone) return; S.missionDone = true; stopMissionTimer();
    const r = $("mission-result"); if (r) { r.textContent = "괜찮아요! 천천히 또 찾아봐요 😊"; r.className = "mission-result soft"; }
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

    const ov = $("result-overlay");
    const t = ov.querySelector(".result-title"); if (t) t.textContent = "나의 속초 하루지도";
    const sub = ov.querySelector(".result-sub"); if (sub) sub.textContent = `하루 카드 ${got.length}장을 모았어요!`;

    // 카드 타임라인: 하루 순서대로 하나씩 등장 (클라이맥스)
    const wrap = $("result-pieces"); wrap.className = "result-day"; wrap.innerHTML = "";
    got.forEach((p, i) => {
      const row = document.createElement("div");
      row.className = "day-card";
      row.style.animationDelay = (0.3 + i * 0.5) + "s";
      const title = p.card ? p.card.title : p.name;
      const line = p.card ? p.card.line : "";
      row.innerHTML = `<span class="dc-emoji">${p.piece.emoji}</span><div class="dc-txt"><b>${title}</b><span>${line}</span></div>`;
      wrap.appendChild(row);
    });

    const msg = ov.querySelector(".result-msg");
    if (msg) {
      msg.innerHTML = "속초가 조금 <b>내 동네</b>처럼 느껴졌나요?<br/>다음엔 진짜로 함께 가봐요!";
      msg.style.animationDelay = (0.5 + got.length * 0.5) + "s";
      msg.classList.add("dc-fade");
    }

    open("result-overlay");
    // 카드마다 반짝 효과음 → 마지막에 성공음
    got.forEach((_, i) => setTimeout(() => { try { if (window.AUDIO) AUDIO.play("reward"); } catch (e) {} }, 300 + i * 500));
    setTimeout(() => { try { if (window.AUDIO) AUDIO.play("success"); } catch (e) {} }, 400 + got.length * 500);
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

  /* ---------- 메인 퀘스트: 제한시간 안에 OO 가서 만나기 ---------- */
  let questId = null;
  function questTarget() { return PLACES.find((p) => p.id === "beach") || PLACES[PLACES.length - 1]; }
  function ensureQuestBanner() {
    if ($("quest-banner")) return;
    const b = document.createElement("div"); b.id = "quest-banner"; b.className = "quest-banner";
    (document.getElementById("screen-map") || document.getElementById("app")).appendChild(b);
  }
  function fmt(ms) { const s = Math.max(0, Math.ceil(ms / 1000)); return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0"); }
  function startQuest() {
    stopQuest();
    const t = questTarget();
    S.quest = { id: t.id, name: t.name, npc: t.npc.name, t0: Date.now(), dur: 600000, done: false };
    ensureQuestBanner();
    const b = $("quest-banner"); b.className = "quest-banner show";
    updateQuest(); questId = setInterval(updateQuest, 500);
  }
  function updateQuest() {
    const q = S.quest, b = $("quest-banner"); if (!q || !b || q.done) return;
    const left = q.dur - (Date.now() - q.t0);
    b.innerHTML = `🧑‍🦱 아빠 미션 · <b>${fmt(left)}</b> · ${q.name}에서 ${q.npc} 만나기`;
    b.classList.toggle("low", left <= 60000);
    if (left <= 0) questFail();
  }
  function questComplete() {
    const q = S.quest; if (!q || q.done) return; q.done = true; stopQuest();
    const b = $("quest-banner"); if (b) { b.innerHTML = `🎉 ${q.npc}을(를) 만났어요! 퀘스트 성공!`; b.className = "quest-banner show done"; }
    try { if (window.AUDIO) AUDIO.play("success"); } catch (e) {}
    setTimeout(() => { const b2 = $("quest-banner"); if (b2) b2.classList.remove("show"); }, 4500);
  }
  function questFail() {
    const q = S.quest; if (!q || q.done) return; q.done = true; stopQuest();
    const b = $("quest-banner"); if (b) { b.innerHTML = `⏰ 시간이 다 됐어요! 그래도 천천히 둘러봐요 😊`; b.className = "quest-banner show fail"; }
    setTimeout(() => { const b2 = $("quest-banner"); if (b2) b2.classList.remove("show"); }, 4500);
  }
  function stopQuest() { if (questId) { clearInterval(questId); questId = null; } }

  function reset() { S.collected = {}; renderPiecesHud(); startQuest(); }
  function closeAll() {
    stopAllVoice(); stopMissionTimer(); stopQuest();
    const qb = $("quest-banner"); if (qb) qb.classList.remove("show");
    ["dialogue-overlay", "photo-overlay", "quest-overlay", "result-overlay"].forEach(close);
    S.isOpen = false;
  }

  /* ---------- 인트로 (이사 온 첫날 훅) ---------- */
  let introShown = false, introIdx = 0;
  // 실제 속초 사진(친근감) + 사전생성 자연 음성
  const INTRO = [
    { photo: "town_view.jpg", text: "오늘 우리 가족은 새 동네, 속초로 이사 왔어요." },
    { photo: "street.jpg", text: "낯선 길, 낯선 학교, 낯선 가게들… 조금 떨리죠?" },
    { photo: "sea.jpg", text: "걱정 마. 아빠가 첫 미션을 줄게 — 바다에 가서 바다갈매기랑 인사하고 오자! 10분이면 충분해." },
  ];
  function renderIntro() {
    const it = INTRO[introIdx];
    const ph = $("intro-photo");
    ph.style.backgroundImage = `url(assets/intro/${it.photo})`;
    ph.style.animation = "none"; void ph.offsetWidth; ph.style.animation = ""; // 전환 애니 재생
    $("intro-text").textContent = it.text;
    $("btn-intro-next").textContent = introIdx >= INTRO.length - 1 ? "출발! ▶" : "다음 ▶";
    playVoice("intro_" + introIdx, it.text, 0.95, 0.92);
  }
  function showIntro() { introIdx = 0; renderIntro(); $("intro-overlay").classList.add("active"); }
  function introNext() {
    if (introIdx < INTRO.length - 1) { introIdx++; renderIntro(); }
    else { stopAllVoice(); $("intro-overlay").classList.remove("active"); S.isOpen = false; introShown = true; $("btn-start").click(); }
  }

  /* ---------- 버튼 바인딩 ---------- */
  function bind() {
    // 시작 버튼 가로채기: 첫 클릭은 인트로, 이후 통과(game.js startGame)
    $("btn-start").addEventListener("click", (e) => { if (!introShown) { e.stopImmediatePropagation(); showIntro(); } });
    $("btn-intro-next").addEventListener("click", introNext);
    $("btn-next").addEventListener("click", nextDialogue);
    $("btn-speak").addEventListener("click", () => { const p = S.activePlace; playVoice(p.id + "_d" + S.dlgIdx, p.dialogue[S.dlgIdx], p.npc.pitch, p.npc.rate); });
    $("btn-photo-speak").addEventListener("click", () => { const p = S.activePlace; speak(`진짜 ${p.name}이에요! 사진 속에서 ${p.lookMission.join(", ")}를 찾아봐요.`, p.npc.pitch, p.npc.rate); });
    $("btn-photo-back").addEventListener("click", () => { stopAllVoice(); stopMissionTimer(); close("photo-overlay"); openQuest(S.activePlace); });
    $("btn-quest-done").addEventListener("click", finishPlace);
    $("btn-replay").addEventListener("click", () => { close("result-overlay"); reset(); if (typeof S.onReplay === "function") S.onReplay(); });
    bindKeys();
  }

  // 데스크톱 키보드 진행: Enter/Space=다음, 1/2=선택지, V=목소리, 시작화면 Enter=시작
  function bindKeys() {
    const active = (id) => $(id).classList.contains("active");
    window.addEventListener("keydown", (e) => {
      const k = e.key;
      if (active("intro-overlay")) { if (k === "Enter" || k === " ") { e.preventDefault(); $("btn-intro-next").click(); } return; }
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
