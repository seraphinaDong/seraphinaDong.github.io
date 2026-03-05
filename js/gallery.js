// 获取元素
const track = document.querySelector('.carousel-track');
const originalItems = Array.from(document.querySelectorAll('.carousel-item'));
const prevBtn = document.querySelector('.prev-btn');
const nextBtn = document.querySelector('.next-btn');

// 复制图片以实现无限循环
const cloneCount = 2; // 前后各复制2张，可根据需要调整
const items = [];

// 前复制
for (let i = originalItems.length - cloneCount; i < originalItems.length; i++) {
    const clone = originalItems[i].cloneNode(true);
    items.push(clone);
}
// 原图
originalItems.forEach(item => items.push(item.cloneNode(true)));
// 后复制
for (let i = 0; i < cloneCount+3; i++) {
    const clone = originalItems[i].cloneNode(true);
    items.push(clone);
}

// 清空轨道并重新添加所有图片
track.innerHTML = '';
items.forEach(item => track.appendChild(item));

// 配置
let currentIndex = cloneCount; // 初始显示第一张原图（位于扩展列表的 cloneCount 处）
const itemWidth = 250; // 必须与 CSS 中的 .carousel-item 宽度一致
const container = document.querySelector('.carousel-container');
let autoInterval;
let isAnimating = false;

function getContainerWidth() {
    return container.offsetWidth;
}

// 更新轮播位置，无动画跳转用 force = true
function updateCarousel(force = false) {
    // 移除所有 active 类
    items.forEach(item => item.classList.remove('active'));

    // 设置当前图片为 active
    if (items[currentIndex]) {
        items[currentIndex].classList.add('active');
    }

    // 计算偏移使当前图片居中
    const containerWidth = getContainerWidth();
    const targetCenter = currentIndex * itemWidth + itemWidth / 2;
    const offset = containerWidth / 2 - targetCenter;

    // 如果有 force 参数，临时禁用动画
    if (force) {
        track.style.transition = 'none';
        track.style.transform = `translateX(${offset}px)`;
        // 强制重绘后恢复动画
        track.offsetHeight; // 触发重绘
        track.style.transition = 'transform 0.5s ease';
    } else {
        track.style.transform = `translateX(${offset}px)`;
    }

    // 检查是否到达边界需要瞬间跳转
    handleBoundary();
}

function handleBoundary() {
    // 如果当前索引到了前复制区，瞬间跳转到对应的真实图片位置
    if (currentIndex < cloneCount) {
        currentIndex = currentIndex + originalItems.length;
        updateCarousel(true);
    }
    // 如果当前索引到了后复制区，瞬间跳转到对应的真实图片位置
    if (currentIndex >= cloneCount + originalItems.length) {
        currentIndex = currentIndex - originalItems.length;
        updateCarousel(true);
    }
}

function nextSlide() {
    if (isAnimating) return;
    isAnimating = true;
    currentIndex++;
    updateCarousel();
    setTimeout(() => { isAnimating = false; }, 500); // 与动画时长一致
}

function prevSlide() {
    if (isAnimating) return;
    isAnimating = true;
    currentIndex--;
    updateCarousel();
    setTimeout(() => { isAnimating = false; }, 500);
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

// 自动轮播
function startAutoPlay() {
    autoInterval = setInterval(nextSlide, 3000);
}
function resetAutoPlay() {
    clearInterval(autoInterval);
    startAutoPlay();
}

// 窗口尺寸变化时重新计算
window.addEventListener('resize', () => {
    updateCarousel(true); // 无动画调整
});

// 初始化
updateCarousel();
startAutoPlay();