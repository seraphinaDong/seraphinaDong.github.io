window.addEventListener('load', function() {
            // 设置音量（0.5表示50%音量，避免太突兀）
music.volume = 0.5;
            
            // 尝试自动播放
const playPromise = music.play();
            
            if (playPromise !== undefined) {
                playPromise.then(() => {
                    // 自动播放成功
                    isPlaying = true;
                    musicBtn.innerHTML = '♫ 关闭背景音乐';
                    console.log('音乐自动播放成功');
                }).catch(error => {
                    // 自动播放被阻止，显示播放按钮
                    isPlaying = false;
                    musicBtn.innerHTML = '♫ 开启背景音乐';
                    console.log('自动播放被阻止，需要用户交互');
                });
            }
        });
    let isPlaying = false;
    const music = document.getElementById('bgMusic');
    
    function toggleMusic() {
    if (isPlaying) {
        music.pause();
        document.querySelector('button').textContent = '♫ 开启背景音乐';
    } else {
        music.play().then(() => {
        document.querySelector('button').textContent = '♫ 关闭背景音乐';
        }).catch(error => {
        alert('请点击按钮开启音乐哦~');
        });
    }
    isPlaying = !isPlaying;
    }