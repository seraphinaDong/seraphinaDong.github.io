// 雪乃指针。ani-cursor 会把每一帧做成 blob 地址再写进 CSS cursor。
// 浏览器算出来的样式是对的，但 Windows 上的指针绘制吃不到 blob，于是画面上仍是系统箭头。
// 这里改成一枚跟着鼠标走的图片，并藏起系统箭头。
(function () {
  var api = window.AniCursor;
  if (!api || typeof api.LoadANICursorPromise !== "function") {
    console.error("找不到 AniCursor.LoadANICursorPromise，检查 cursor/ani-cursor.umd.min.js 是否先加载");
    return;
  }
  if (window.matchMedia && window.matchMedia("(pointer: coarse)").matches) return;

  var style = document.createElement("style");
  style.textContent = "html.yk-cursor, html.yk-cursor *{cursor:none !important;}";
  document.head.appendChild(style);

  var img = document.createElement("img");
  img.alt = "";
  img.setAttribute("aria-hidden", "true");
  img.draggable = false;
  img.style.cssText = [
    "position:fixed",
    "left:0",
    "top:0",
    "width:32px",
    "height:32px",
    "pointer-events:none",
    "z-index:2147483647",
    "display:none",
    "image-rendering:pixelated"
  ].join(";");
  document.body.appendChild(img);

  var packs = {};
  var hotspot = { normal: [0, 0], link: [4, 0], text: [4, 9] };
  var mode = "normal";
  var x = 0;
  var y = 0;
  var inside = false;
  var lastSrc = "";

  function place() {
    var pack = packs[mode] || packs.normal;
    if (!pack || !inside) {
      img.style.display = "none";
      document.documentElement.classList.remove("yk-cursor");
      return;
    }
    var time = performance.now() % pack.totalRoundTime;
    var elapsed = 0;
    var src = pack.frameURLs[0];
    var frames = pack.frameInfo;
    for (var i = 0; i < frames.length; i++) {
      elapsed += frames[i].framDuration;
      if (time < elapsed) {
        src = pack.frameURLs[frames[i].frameIndex] || src;
        break;
      }
    }
    if (src !== lastSrc) {
      img.src = src;
      lastSrc = src;
    }
    var hot = hotspot[mode] || hotspot.normal;
    img.style.transform = "translate(" + (x - hot[0]) + "px," + (y - hot[1]) + "px)";
    img.style.display = "block";
    document.documentElement.classList.add("yk-cursor");
  }

  function loop() {
    place();
    requestAnimationFrame(loop);
  }

  document.addEventListener("mousemove", function (e) {
    x = e.clientX;
    y = e.clientY;
    inside = true;
    var el = e.target;
    var next = "normal";
    if (el && el.closest) {
      if (el.closest("input, textarea")) next = "text";
      else if (el.closest("a, button, label, .nav-link")) next = "link";
    }
    mode = next;
  }, true);

  document.documentElement.addEventListener("mouseleave", function () {
    inside = false;
  });

  Promise.all([
    api.LoadANICursorPromise("cursor/Normal.ani").then(function (info) { packs.normal = info; }),
    api.LoadANICursorPromise("cursor/Link.ani").then(function (info) { packs.link = info; }),
    api.LoadANICursorPromise("cursor/Text.ani").then(function (info) { packs.text = info; })
  ]).then(function () {
    requestAnimationFrame(loop);
  }).catch(function (err) {
    console.error("雪乃指针加载失败", err);
  });
})();
