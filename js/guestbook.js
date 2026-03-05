
const API_BASE = 'http://60.13.54.44:5000/api';  // 你的服务器公网IP和端口

// 转义HTML，防止XSS攻击
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// 格式化时间（如果需要更友好的显示，可以调整）
function formatTime(isoString) {
    const date = new Date(isoString);
    return `${date.getFullYear()}年${date.getMonth()+1}月${date.getDate()}日 ${date.getHours().toString().padStart(2,'0')}:${date.getMinutes().toString().padStart(2,'0')}`;
}

// 加载所有留言并渲染
async function loadMessages() {
    try {
        const res = await fetch(API_BASE + '/messages');
        if (!res.ok) throw new Error('网络错误');
        const messages = await res.json();
        const list = document.getElementById('messageList');
        // 清空原有列表（包括静态示例）
        list.innerHTML = '';
        messages.forEach(msg => {
            const item = document.createElement('div');
            item.className = 'message-item';
            item.innerHTML = `
                <div class="message-author">${escapeHtml(msg.name)}</div>
                <div class="message-content">${escapeHtml(msg.content)}</div>
                <div class="message-time">${formatTime(msg.created_at)}</div>
            `;
            list.appendChild(item);
        });
    } catch (err) {
        console.error('加载留言失败', err);
    }
}

// 提交新留言
async function addMessage() {
    const author = document.getElementById('author').value.trim() || '匿名';
    const content = document.getElementById('content').value.trim();
    if (!content) {
        alert('请填写留言内容');
        return;
    }
    try {
        const res = await fetch(API_BASE + '/messages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: author, content: content })
        });
        if (res.ok) {
            // 清空输入框
            document.getElementById('author').value = '';
            document.getElementById('content').value = '';
            // 重新加载留言列表
            loadMessages();
        } else {
            alert('提交失败，请稍后重试');
        }
    } catch (err) {
        console.error('提交留言出错', err);
        alert('网络错误，请检查');
    }
}

// 页面加载时自动获取留言
document.addEventListener('DOMContentLoaded', loadMessages);