// 这是 拿来加载鼠标 的内容
    const script = document.createElement("script");
    script.src = "cursor/ani-cursor.bundle.js";
    script.onload = () => {
      // 在这里执行调用逻辑，使用 window["ani-cursor.js"] 来引用库函数，例如： / Execute the invocation logic here, using window["ani-cursor.js"] to reference the library functions, for example:
      if (window["ani-cursor.bundle.js"] && typeof window["ani-cursor.bundle.js"].setANICursor === "function") {
        window["ani-cursor.bundle.js"].setANICursor("body", "cursor/Link.ani");
      } else {
        console.error("找不到 setANICursor，检查 ani-cursor.bundle.js 是否被正确引用");
      }
    };
    document.head.appendChild(script);
