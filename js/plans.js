(function () {
  var dock = document.getElementById("planDock");
  var panel = document.getElementById("planPanel");
  var button = document.getElementById("planToggle");
  if (!dock || !panel || !button) return;

  function setOpen(open) {
    dock.classList.toggle("is-open", open);
    button.setAttribute("aria-expanded", open ? "true" : "false");
    panel.inert = !open;
  }

  button.addEventListener("click", function () {
    setOpen(!dock.classList.contains("is-open"));
  });
})();
