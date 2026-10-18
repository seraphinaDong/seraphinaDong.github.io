(function () {
  var music = document.getElementById("bgMusic");
  var button = document.getElementById("musicToggle");
  var slider = document.getElementById("volumeSlider");
  if (!music || !button) return;

  music.volume = 0.5;

  function label() {
    button.textContent = music.paused ? "♫ 开启背景音乐" : "♫ 关闭背景音乐";
  }

  button.addEventListener("click", function () {
    if (!music.paused) {
      music.pause();
      return;
    }
    music.play().catch(function () {
      alert("浏览器没有允许播放，再点一次按钮试试");
    });
  });

  music.addEventListener("play", label);
  music.addEventListener("pause", label);

  if (slider) {
    slider.addEventListener("input", function () {
      var volume = Number(slider.value);
      if (volume >= 0 && volume <= 1) music.volume = volume;
    });
  }

  music.play().catch(function () {
    label();
  });
})();
