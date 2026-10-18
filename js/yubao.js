// 站点动画指针。库必须先于本文件加载（ani-cursor.umd.min.js）。
// 原先 cursor/ani-cursor.bundle.js 存的是 GitHub 网页 HTML，脚本解析失败，指针不会出现。
(function () {
  var api = window.AniCursor;
  if (!api || typeof api.setANICursor !== "function") {
    console.error("找不到 AniCursor.setANICursor，检查 cursor/ani-cursor.umd.min.js 是否先于本文件加载");
    return;
  }
  api.setANICursor("html", "cursor/Normal.ani");
  api.setANICursor(
    "a, button, .nav-link, .carousel-btn, .submit-btn, label",
    "cursor/Link.ani"
  );
  api.setANICursor("input, textarea", "cursor/Text.ani");
})();
