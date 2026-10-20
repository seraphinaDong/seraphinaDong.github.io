const YUJI_API = "https://103.218.241.251";

const YUJI_FACE = {
  neutral: {
    ParamEyeLOpen: 0.95, ParamEyeROpen: 0.95,
    ParamEyeLSmile: 1, ParamEyeRSmile: 1,
    ParamMouthForm: 0.95, ParamCheek: 0.4,
    ParamBrowLY: 0.08, ParamBrowRY: 0.08,
    ParamBrowLAngle: 0, ParamBrowRAngle: 0,
    ParamBrowLForm: 0.2, ParamBrowRForm: 0.2,
    Param2: 0, mouthOpen: 0.5,
  },
  happy: {
    ParamEyeLOpen: 0.82, ParamEyeROpen: 0.82,
    ParamEyeLSmile: 1, ParamEyeRSmile: 1,
    ParamMouthForm: 0.9, ParamCheek: 0.6,
    ParamBrowLY: 0.2, ParamBrowRY: 0.2,
    ParamBrowLAngle: 0, ParamBrowRAngle: 0,
    ParamBrowLForm: 0.15, ParamBrowRForm: 0.15,
    Param2: 0.85, mouthOpen: 0.35,
  },
  sad: {
    ParamEyeLOpen: 0.72, ParamEyeROpen: 0.72,
    ParamEyeLSmile: 0, ParamEyeRSmile: 0,
    ParamMouthForm: -0.55, ParamCheek: 0,
    ParamBrowLY: -0.4, ParamBrowRY: -0.4,
    ParamBrowLAngle: 0.3, ParamBrowRAngle: 0.3,
    ParamBrowLForm: -0.2, ParamBrowRForm: -0.2,
    Param2: 0, mouthOpen: 0.15,
  },
  tired: {
    ParamEyeLOpen: 0, ParamEyeROpen: 0,
    ParamEyeLSmile: 0, ParamEyeRSmile: 0,
    ParamMouthForm: -0.2, ParamCheek: 0,
    ParamBrowLY: -0.15, ParamBrowRY: -0.15,
    ParamBrowLAngle: 0.1, ParamBrowRAngle: 0.1,
    ParamBrowLForm: 0, ParamBrowRForm: 0,
    Param2: 0, mouthOpen: 0.1,
  },
};

const YUJI_FACE_KEYS = [
  "ParamEyeLOpen", "ParamEyeROpen", "ParamEyeLSmile", "ParamEyeRSmile",
  "ParamMouthForm", "ParamCheek", "ParamBrowLY", "ParamBrowRY",
  "ParamBrowLAngle", "ParamBrowRAngle", "ParamBrowLForm", "ParamBrowRForm",
  "Param2",
];

(function () {
  const stage = document.getElementById("yujiStage");
  const canvas = document.getElementById("yujiCanvas");
  const statusEl = document.getElementById("yujiStatus");
  const logEl = document.getElementById("yujiLog");
  const form = document.getElementById("yujiForm");
  const input = document.getElementById("yujiInput");
  const sendBtn = form ? form.querySelector(".yuji-send") : null;
  if (!stage || !canvas || !statusEl || !logEl || !form || !input || !sendBtn) return;

  const pageBase = new URL(".", window.location.href);
  let model = null;
  let faceNow = Object.assign({}, YUJI_FACE.neutral);
  let faceTarget = YUJI_FACE.neutral;
  let speakUntil = 0;
  let emotionTimer = 0;
  let blink = 1;
  let blinkPhase = "idle";
  let blinkUntil = 0;
  let nextBlink = performance.now() + 2500;
  let sending = false;

  function setStatus(text) {
    statusEl.textContent = text || "";
    statusEl.hidden = !text;
  }

  function addLine(kind, text) {
    const line = document.createElement("p");
    line.className = "yuji-line " + (kind === "you" ? "yuji-line-you" : "yuji-line-her");
    line.textContent = (kind === "you" ? "主人：" : "瑜姬：") + text;
    logEl.appendChild(line);
    while (logEl.children.length > 20) logEl.removeChild(logEl.firstChild);
    logEl.scrollTop = logEl.scrollHeight;
  }

  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      const script = document.createElement("script");
      script.src = src;
      script.onload = function () { resolve(); };
      script.onerror = function () { reject(new Error(src)); };
      document.head.appendChild(script);
    });
  }

  function setEmotion(name) {
    faceTarget = YUJI_FACE[name] || YUJI_FACE.neutral;
    window.clearTimeout(emotionTimer);
    if (name && name !== "neutral" && YUJI_FACE[name]) {
      emotionTimer = window.setTimeout(function () { setEmotion("neutral"); }, 6000);
    }
  }

  function updateBlink(now) {
    if (faceTarget === YUJI_FACE.tired) {
      blink = 1;
      return;
    }
    if (blinkPhase === "idle" && now >= nextBlink) {
      blinkPhase = "shut";
      blinkUntil = now + 130;
    }
    if (blinkPhase === "shut") {
      blink = 0;
      if (now >= blinkUntil) {
        blinkPhase = "open";
        blinkUntil = now + 140;
      }
      return;
    }
    if (blinkPhase === "open") {
      blink = Math.min(1, (now - (blinkUntil - 140)) / 140);
      if (now >= blinkUntil) {
        blink = 1;
        blinkPhase = "idle";
        nextBlink = now + 2800 + Math.random() * 2800;
      }
    }
  }

  function applyFace() {
    if (!model || !model.internalModel || !model.internalModel.coreModel) return;
    const core = model.internalModel.coreModel;
    const now = performance.now();
    updateBlink(now);
    YUJI_FACE_KEYS.forEach(function (key) {
      const dest = faceTarget[key] || 0;
      faceNow[key] = faceNow[key] + (dest - faceNow[key]) * 0.18;
      let value = faceNow[key];
      if (key === "ParamEyeLOpen" || key === "ParamEyeROpen") value *= blink;
      try { core.setParameterValueById(key, value); } catch (err) { /* 这套模型没有的参数就跳过 */ }
    });
    let mouth = faceTarget.mouthOpen == null ? 0.4 : faceTarget.mouthOpen;
    if (now < speakUntil) mouth = 0.15 + Math.abs(Math.sin(now / 90)) * 0.7;
    try { core.setParameterValueById("ParamMouthOpenY", mouth); } catch (err) { /* 同上 */ }
    try { core.setParameterValueById("Param8", 1); } catch (err) { /* 去面具 */ }
  }

  function fitModel(app) {
    if (!model) return;
    const width = stage.clientWidth || 280;
    const height = stage.clientHeight || 420;
    app.renderer.resize(width, height);
    model.scale.set(1);
    const crop = 0.4;
    const zoom = 2;
    const scale = Math.min(width * 0.92 / model.width, height / (model.height * (1 - crop))) * zoom;
    model.scale.set(scale);
    model.x = (width - model.width) / 2;
    model.y = height - model.height * (1 - crop) + 12;
    const highest = -model.height * 0.08;
    if (model.y < highest) model.y = highest;
  }

  async function showModel(ticket) {
    if (!ticket.ready) {
      setStatus("模型还在服务器上归位，对话可以先用。");
      return;
    }
    await loadScript(new URL("vendor/pixi.min.js", pageBase).href);
    await loadScript(ticket.core_url);
    if (!window.Live2DCubismCore) throw new Error("core");
    await loadScript(new URL("vendor/pixi-live2d-display.cubism4.min.js", pageBase).href);
    if (!window.PIXI || !window.PIXI.live2d) throw new Error("pixi");

    const app = new window.PIXI.Application({
      view: canvas,
      transparent: true,
      autoStart: true,
      antialias: true,
      autoDensity: true,
      resolution: Math.min(window.devicePixelRatio || 1, 2),
      width: stage.clientWidth,
      height: stage.clientHeight,
    });
    model = await window.PIXI.live2d.Live2DModel.from(ticket.model_url, {
      autoInteract: false,
      crossOrigin: "anonymous",
    });
    app.stage.addChild(model);
    fitModel(app);
    app.ticker.add(applyFace);
    window.addEventListener("resize", function () { fitModel(app); });
    if (window.ResizeObserver) {
      new window.ResizeObserver(function () { fitModel(app); }).observe(stage);
    }
    window.addEventListener("pointermove", function (ev) {
      if (!model) return;
      const rect = canvas.getBoundingClientRect();
      try { model.focus(ev.clientX - rect.left, ev.clientY - rect.top); } catch (err) { /* 模型还没就绪 */ }
    });
    setStatus("");
  }

  async function boot() {
    addLine("her", "瑜姬在呢。主人想说什么呀？");
    try {
      const res = await fetch(YUJI_API + "/api/live2d/ticket", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      });
      const data = await res.json().catch(function () { return {}; });
      if (!res.ok) throw new Error(data.error || "ticket");
      await showModel(data);
    } catch (err) {
      setStatus("瑜姬暂时过不来。话还可以说。");
    }
  }

  form.addEventListener("submit", async function (ev) {
    ev.preventDefault();
    const message = input.value.trim();
    if (!message || sending) return;
    sending = true;
    sendBtn.disabled = true;
    input.value = "";
    addLine("you", message);
    try {
      const res = await fetch(YUJI_API + "/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: message,
          session: (function () { try { return sessionStorage.getItem("yuji-session") || ""; } catch (err) { return ""; } })(),
        }),
      });
      const data = await res.json().catch(function () { return {}; });
      if (!res.ok) throw new Error(data.error || "chat");
      if (data.session) {
        try { sessionStorage.setItem("yuji-session", data.session); } catch (err) { /* 浏览器关掉了会话存储 */ }
      }
      addLine("her", data.reply || "瑜姬在呢。");
      setEmotion(data.emotion || "neutral");
      speakUntil = performance.now() + Math.min(4000, Math.max(800, String(data.reply || "").length * 80));
    } catch (err) {
      const told = err && err.message && !/fetch|network|ticket|chat/i.test(err.message) ? err.message : "";
      addLine("her", told || "瑜姬这会儿没接上话。");
      setEmotion("sad");
    } finally {
      sending = false;
      sendBtn.disabled = false;
      input.focus();
    }
  });

  boot();
})();
