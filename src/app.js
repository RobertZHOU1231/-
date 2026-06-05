// ============================================
// 全局接口函数 - 供其他功能模块调用
// ============================================

// 展示原文
window.displayTranscript = function(text) {
    const content = document.getElementById('transcriptContent');
    const placeholder = content.querySelector('.placeholder');
    if (placeholder) {
        placeholder.remove();
    }
    content.textContent = text;
};

// 展示翻译
window.displayTranslation = function(text) {
    const content = document.getElementById('translationContent');
    const placeholder = content.querySelector('.placeholder');
    if (placeholder) {
        placeholder.remove();
    }
    content.textContent = text;
};

// 展示笔记
window.displayNotes = function(markdownText) {
    const content = document.getElementById('notesContent');
    const placeholder = content.querySelector('.placeholder');
    if (placeholder) {
        placeholder.remove();
    }
    content.textContent = markdownText;
};

// 更新状态消息
window.updateStatus = function(msg, isError = false) {
    const statusMessage = document.getElementById('statusMessage');
    statusMessage.textContent = msg;
    statusMessage.className = 'status-message' + (isError ? ' error' : '');
};

// 更新WebSocket连接状态
window.updateWSStatus = function(connected) {
    const dot = document.getElementById('wsStatusDot');
    const text = document.getElementById('wsStatus');
    if (connected) {
        dot.className = 'status-dot connected';
        text.textContent = '已连接';
    } else {
        dot.className = 'status-dot disconnected';
        text.textContent = '未连接';
    }
};

// 更新API调用状态
window.updateAPIStatus = function(status) {
    const dot = document.getElementById('apiStatusDot');
    const text = document.getElementById('apiStatus');
    if (status === 'processing') {
        dot.className = 'status-dot processing';
        text.textContent = '处理中';
    } else if (status === 'idle') {
        dot.className = 'status-dot disconnected';
        text.textContent = '空闲';
    } else if (status === 'success') {
        dot.className = 'status-dot connected';
        text.textContent = '成功';
    } else if (status === 'error') {
        dot.className = 'status-dot disconnected';
        text.textContent = '错误';
    }
};

// ============================================
// UI状态切换函数 - 供录音控制调用
// ============================================

// 开始录音时的UI状态
window.setRecordingUI = function() {
    const startBtn = document.getElementById('startBtn');
    const stopBtn = document.getElementById('stopBtn');
    const status = document.getElementById('recordingStatus');

    startBtn.disabled = true;
    stopBtn.disabled = false;
    status.textContent = '录音中...';
    status.className = 'recording-status active';
};

// 停止录音时的UI状态
window.setStoppedUI = function() {
    const startBtn = document.getElementById('startBtn');
    const stopBtn = document.getElementById('stopBtn');
    const status = document.getElementById('recordingStatus');

    startBtn.disabled = false;
    stopBtn.disabled = true;
    status.textContent = '等待开始';
    status.className = 'recording-status';
};

// 处理中的UI状态
window.setProcessingUI = function() {
    const status = document.getElementById('recordingStatus');
    status.textContent = '处理中...';
    status.className = 'recording-status processing';
};

// ============================================
// 按钮事件监听
// ============================================

document.getElementById('startBtn').addEventListener('click', function() {
    // 触发全局事件，供其他模块监听
    const event = new CustomEvent('recordingStart');
    window.dispatchEvent(event);

    // 切换UI状态
    window.setRecordingUI();
    window.updateStatus('正在录音...');
});

document.getElementById('stopBtn').addEventListener('click', function() {
    // 触发全局事件，供其他模块监听
    const event = new CustomEvent('recordingStop');
    window.dispatchEvent(event);

    // 切换UI状态
    window.setProcessingUI();
    window.updateStatus('正在处理音频...');
});

// 复制笔记按钮
document.getElementById('copyBtn').addEventListener('click', function() {
    const notesContent = document.getElementById('notesContent');
    const text = notesContent.textContent;

    navigator.clipboard.writeText(text).then(function() {
        window.updateStatus('笔记已复制到剪贴板', false);
    }).catch(function(err) {
        window.updateStatus('复制失败: ' + err.message, true);
    });
});

// ============================================
// 示例：监听录音事件（供其他模块参考）
// ============================================

window.addEventListener('recordingStart', function(e) {
    console.log('录音开始事件触发');
    // 其他模块可以在这里添加处理逻辑
});

window.addEventListener('recordingStop', function(e) {
    console.log('录音停止事件触发');
    // 其他模块可以在这里添加处理逻辑
});
