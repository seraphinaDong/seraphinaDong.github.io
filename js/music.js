(function () {
  var music = document.getElementById("bgMusic");
  var player = document.getElementById("musicPlayer");
  var button = document.getElementById("musicToggle");
  var slider = document.getElementById("volumeSlider");
  var title = document.getElementById("musicTitle");
  var playlist = document.getElementById("playlist");
  var playlistToggle = document.getElementById("playlistToggle");
  var playlistList = document.getElementById("playlistList");
  if (!music || !player || !button || !title || !playlist || !playlistToggle || !playlistList) return;

  // 新歌放进 music/ 目录，再在这里加一行。
  var songs = [
    { title: "小小恋歌", src: "music/小小恋歌.mp3" }
  ];
  var current = 0;

  music.volume = 0.5;

  function label() {
    button.textContent = music.paused ? "♫ 播放" : "♫ 暂停";
  }

  function showTitle() {
    title.textContent = songs[current].title;
  }

  function markCurrent() {
    var items = playlistList.querySelectorAll(".playlist-item");
    for (var i = 0; i < items.length; i++) {
      items[i].classList.toggle("is-current", i === current);
    }
  }

  function loadSong(index) {
    current = index;
    music.src = songs[current].src;
    showTitle();
    markCurrent();
  }

  function playCurrent() {
    music.play().catch(function () {
      alert("浏览器没有允许播放，再点一次按钮试试");
      label();
    });
  }

  function renderPlaylist() {
    playlistList.textContent = "";
    songs.forEach(function (song, index) {
      var item = document.createElement("li");
      var choice = document.createElement("button");
      choice.type = "button";
      choice.className = "playlist-item";
      choice.textContent = song.title;
      choice.addEventListener("click", function () {
        if (index !== current) loadSong(index);
        playCurrent();
      });
      item.appendChild(choice);
      playlistList.appendChild(item);
    });
    markCurrent();
  }

  function setOpen(open) {
    player.classList.toggle("is-open", open);
    playlistToggle.setAttribute("aria-expanded", open ? "true" : "false");
    playlist.inert = !open;
  }

  button.addEventListener("click", function () {
    if (!music.paused) {
      music.pause();
      return;
    }
    if (!music.getAttribute("src")) loadSong(current);
    playCurrent();
  });

  playlistToggle.addEventListener("click", function () {
    setOpen(!player.classList.contains("is-open"));
  });

  music.addEventListener("play", label);
  music.addEventListener("pause", label);
  music.addEventListener("ended", function () {
    var next = (current + 1) % songs.length;
    if (next === current) {
      music.currentTime = 0;
      playCurrent();
      return;
    }
    loadSong(next);
    playCurrent();
  });

  if (slider) {
    slider.addEventListener("input", function () {
      var volume = Number(slider.value);
      if (volume >= 0 && volume <= 1) music.volume = volume;
    });
  }

  renderPlaylist();
  loadSong(0);
  music.play().catch(function () {
    label();
  });
})();
