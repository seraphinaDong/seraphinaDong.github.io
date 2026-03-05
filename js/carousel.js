// 获取元素
const track = document.querySelector('.carousel-track');
const items = Array.from(document.querySelectorAll('.carousel-item'));
const prevBtn = document.querySelector('.prev-btn');
const nextBtn = document.querySelector('.next-btn');

// 配置参数
let currentIndex = 0;           // 当前中心图片的索引（从0开始）
const itemWidth = 200;           // 每张图片的固定宽度（应与CSS一致，建议改为200-300px）
const container = document.querySelector('.carousel-container');
let autoInterval;                // 自动轮播定时器

// 获取容器宽度（考虑可能有padding）
function getContainerWidth() {
    return container.offsetWidth;
}

// 更新轮播位置和active类
function updateCarousel() {
    // 1. 先移除所有active类
    items.forEach(item => item.classList.remove('active'));

    // 2. 给当前中心图片添加active类（实现放大效果）
    if (items[currentIndex]) {
        items[currentIndex].classList.add('active');
    }

    // 3. 计算轨道偏移量，使当前图片位于容器正中央
    const containerWidth = getContainerWidth();
    // 当前图片中心相对于轨道起点的距离 = currentIndex * itemWidth + itemWidth/2
    const targetCenter = currentIndex * itemWidth + itemWidth / 2;
    // 容器中心位置 = containerWidth / 2
    const offset = containerWidth / 2 - targetCenter;

    // 应用偏移（注意：轨道向左移动为负值，所以直接用offset）
    track.style.transform = `translateX(${offset}px)`;
}

// 初始化：立即执行一次
updateCarousel();

// 下一张
function nextSlide() {
    currentIndex = (currentIndex + 1) % items.length; // 循环到第一张
    updateCarousel();
}

// 上一张
function prevSlide() {
    currentIndex = (currentIndex - 1 + items.length) % items.length; // 循环到最后一张
    updateCarousel();
}

// 绑定按钮事件
nextBtn.addEventListener('click', () => {
    nextSlide();
    resetAutoPlay();
});

prevBtn.addEventListener('click', () => {
    prevSlide();
    resetAutoPlay();
});

// 自动轮播（每3秒）
function startAutoPlay() {
    autoInterval = setInterval(nextSlide, 3000);
}

// 重置自动轮播（用于手动点击后重新计时）
function resetAutoPlay() {
    clearInterval(autoInterval);
    startAutoPlay();
}

// 启动自动轮播
startAutoPlay();

// 窗口大小改变时重新计算位置（例如手机旋转）
window.addEventListener('resize', () => {
    updateCarousel();
});