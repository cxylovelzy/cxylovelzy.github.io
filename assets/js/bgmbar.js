// 检测用户交互
function handleUserInteraction() {
    var audio = document.getElementById('bgMusic');
    audio.play().then(() => {
    // 移除隐藏样式，显示音乐控制栏
    document.getElementById('music-controls').classList.remove('hidden');
    }).catch(error => {
    console.error('Error playing audio:', error);
    });
    // 移除事件监听器，避免重复触发
    document.removeEventListener('click', handleUserInteraction);
    document.removeEventListener('scroll', handleUserInteraction);
}

// 监听点击和滚动事件
document.addEventListener('click', handleUserInteraction);
document.addEventListener('scroll', handleUserInteraction);

// 播放控制
document.getElementById('play-pause-btn').addEventListener('click', function() {
    var audio = document.getElementById('bgMusic');
    if (audio.paused) {
    audio.play();
    this.classList.remove('play');
    this.classList.add('pause');
    } else {
    audio.pause();
    this.classList.remove('pause');
    this.classList.add('play');
    }
});

// 静音控制
document.getElementById('mute-btn').addEventListener('click', function() {
    var audio = document.getElementById('bgMusic');
    if (audio.muted) {
    audio.muted = false;
    this.classList.remove('unmute');
    this.classList.add('mute');
    } else {
    audio.muted = true;
    this.classList.remove('mute');
    this.classList.add('unmute');
    }
});

// 音量控制
document.getElementById('volume-bar').addEventListener('input', function() {
    var audio = document.getElementById('bgMusic');
    var volume = 1 - this.value;
    audio.volume = volume;
    this.style.setProperty('--volume-percentage', `${(volume / this.max) * 100}%`);
});