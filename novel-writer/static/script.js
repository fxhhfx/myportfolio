document.addEventListener('DOMContentLoaded', () => {
  const outlineEl = document.getElementById('outline');
  const novelTitleEl = document.getElementById('novelTitle');
  const generateBtn = document.getElementById('generateBtn');
  const saveBtn = document.getElementById('saveBtn');
  const loadBtn = document.getElementById('loadBtn');
  const contentDisplay = document.getElementById('contentDisplay');
  const contentTitle = document.getElementById('contentTitle');
  const loadingIndicator = document.getElementById('loadingIndicator');
  const copyBtn = document.getElementById('copyBtn');
  const exportBtn = document.getElementById('exportBtn');
  const clearBtn = document.getElementById('clearBtn');
  const novelListEl = document.getElementById('novelList');
  const chapterListEl = document.getElementById('chapterList');
  const chapterCountBadge = document.getElementById('chapterCountBadge');
  const nextChapterLabel = document.getElementById('nextChapterLabel');
  const statChapters = document.getElementById('statChapters');
  const statWords = document.getElementById('statWords');
  const styleSelect = document.getElementById('styleSelect');
  const loadModal = document.getElementById('loadModal');
  const modalNovelList = document.getElementById('modalNovelList');
  const cancelLoadBtn = document.getElementById('cancelLoad');
  const exportModal = document.getElementById('exportModal');
  const cancelExportBtn = document.getElementById('cancelExport');
  const logoutBtn = document.getElementById('logoutBtn');
  const displayUsername = document.getElementById('displayUsername');

  let currentChapters = [];
  let currentNovelId = null;
  let activeChapterIndex = -1;

  // 加载当前用户信息
  async function loadUserInfo() {
    try {
      const res = await fetch('/api/user');
      if (res.ok) {
        const data = await res.json();
        displayUsername.textContent = data.username;
      } else {
        window.location.href = '/login';
      }
    } catch (err) {
      window.location.href = '/login';
    }
  }

  // 退出登录
  logoutBtn.addEventListener('click', async () => {
    if (!confirm('确定要退出登录吗？')) return;
    try {
      await fetch('/api/logout', { method: 'POST' });
      window.location.href = '/login';
    } catch (err) {
      showToast('退出失败', 'error');
    }
  });

  // API 请求拦截：401 时跳转登录
  const originalFetch = window.fetch;
  window.fetch = async function(...args) {
    const res = await originalFetch.apply(this, args);
    if (res.status === 401 && args[0] && typeof args[0] === 'string' && args[0].startsWith('/api/')) {
      window.location.href = '/login';
    }
    return res;
  };

  // 更新界面状态
  function updateUI() {
    const count = currentChapters.length;
    const totalWords = currentChapters.reduce((sum, ch) => sum + ch.content.length, 0);

    statChapters.textContent = count;
    statWords.textContent = totalWords;
    chapterCountBadge.textContent = count + ' 章';
    nextChapterLabel.textContent = '第 ' + (count + 1) + ' 章';

    renderChapterList();
  }

  // 渲染章节列表
  function renderChapterList() {
    if (currentChapters.length === 0) {
      chapterListEl.innerHTML = `
        <div class="chapter-empty">
          <div class="chapter-empty-icon"></div>
          <p>还没有章节</p>
          <p class="chapter-empty-hint">输入大纲后点击生成</p>
        </div>`;
      return;
    }

    chapterListEl.innerHTML = currentChapters.map((ch, i) => `
      <div class="chapter-item ${i === activeChapterIndex ? 'active' : ''}" data-index="${i}">
        <div class="chapter-item-num">第 ${ch.chapter} 章</div>
        <div class="chapter-item-title">${ch.title || '第 ' + ch.chapter + ' 章'}</div>
        <div class="chapter-item-words">${ch.content.length} 字</div>
      </div>
    `).join('');

    chapterListEl.querySelectorAll('.chapter-item').forEach(item => {
      item.addEventListener('click', () => {
        const index = parseInt(item.dataset.index);
        showChapter(index);
      });
    });
  }

  // 显示指定章节
  function showChapter(index) {
    if (index < 0 || index >= currentChapters.length) return;
    activeChapterIndex = index;
    const ch = currentChapters[index];
    contentTitle.textContent = '第 ' + ch.chapter + ' 章' + (ch.title ? ' - ' + ch.title : '');
    contentDisplay.innerHTML = `<div class="content-text">${formatContent(ch.content, ch.chapter)}</div>`;
    renderChapterList();
  }

  // 生成章节
  generateBtn.addEventListener('click', async () => {
    const outline = outlineEl.value.trim();
    if (!outline) {
      showToast('请先输入小说大纲', 'error');
      outlineEl.focus();
      return;
    }

    const chapterNum = currentChapters.length + 1;
    const style = styleSelect.value;

    // 构建已有章节摘要（只取每章前200字作为上下文）
    const previousSummary = currentChapters.map(ch =>
      '第' + ch.chapter + '章：' + ch.content.substring(0, 300)
    ).join('\n\n');

    generateBtn.disabled = true;
    generateBtn.innerHTML = '<span class="btn-icon">⏳</span> 生成中...';
    loadingIndicator.classList.remove('hidden');

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          outline: outline,
          previous_content: previousSummary,
          chapter_num: chapterNum,
          style: style,
          all_chapter_titles: currentChapters.map(ch => ch.title || '').filter(Boolean)
        })
      });

      const data = await response.json();

      if (response.ok) {
        currentChapters.push({
          chapter: data.chapter,
          title: data.title || '',
          content: data.content,
          created_at: new Date().toISOString()
        });

        activeChapterIndex = currentChapters.length - 1;
        showChapter(activeChapterIndex);
        updateUI();
        showToast('第 ' + chapterNum + ' 章生成成功！', 'success');
      } else {
        showToast(data.error || '生成失败', 'error');
      }
    } catch (error) {
      showToast('网络错误：' + error.message, 'error');
    } finally {
      generateBtn.disabled = false;
      generateBtn.innerHTML = '<span class="btn-icon"></span> 生成章节';
      loadingIndicator.classList.add('hidden');
    }
  });

  // 格式化内容
  function formatContent(text, chapterNum) {
    const lines = text.split('\n').filter(p => p.trim());
    const paragraphs = lines.map(p => `<p>${p}</p>`).join('');
    return `<div class="chapter-heading">第 ${chapterNum} 章</div>` + paragraphs;
  }

  // 保存小说
  saveBtn.addEventListener('click', async () => {
    const title = novelTitleEl.value.trim() || '未命名小说';
    const outline = outlineEl.value.trim();

    if (!outline) {
      showToast('请先输入小说大纲', 'error');
      return;
    }

    if (currentChapters.length === 0) {
      showToast('请先生成章节内容', 'error');
      return;
    }

    try {
      const response = await fetch('/api/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title,
          outline: outline,
          chapters: currentChapters
        })
      });

      const data = await response.json();

      if (response.ok) {
        currentNovelId = data.id;
        showToast('保存成功！', 'success');
        loadNovelList();
      } else {
        showToast(data.error || '保存失败', 'error');
      }
    } catch (error) {
      showToast('网络错误：' + error.message, 'error');
    }
  });

  // 加载小说列表（侧边栏）
  async function loadNovelList() {
    try {
      const response = await fetch('/api/list');
      const novels = await response.json();

      if (novels.length === 0) {
        novelListEl.innerHTML = '<p class="empty-text">暂无保存的小说</p>';
        return;
      }

      novelListEl.innerHTML = novels.map(novel => `
        <div class="novel-item" data-id="${novel.id}">
          <div class="novel-item-title">${novel.title}</div>
          <div class="novel-item-meta">${novel.chapter_count} 章 · ${formatDate(novel.updated_at)}</div>
        </div>
      `).join('');

      novelListEl.querySelectorAll('.novel-item').forEach(item => {
        item.addEventListener('click', () => {
          loadNovelById(item.dataset.id);
        });
      });
    } catch (error) {
      console.error('加载小说列表失败:', error);
    }
  }

  // 加载对话框
  loadBtn.addEventListener('click', async () => {
    try {
      const response = await fetch('/api/list');
      const novels = await response.json();

      if (novels.length === 0) {
        modalNovelList.innerHTML = '<p class="empty-text">暂无保存的小说</p>';
      } else {
        modalNovelList.innerHTML = novels.map(novel => `
          <div class="modal-novel-item" data-id="${novel.id}">
            <div class="modal-novel-item-title">${novel.title}</div>
            <div class="modal-novel-item-meta">${novel.chapter_count} 章 · ${formatDate(novel.updated_at)}</div>
          </div>
        `).join('');

        modalNovelList.querySelectorAll('.modal-novel-item').forEach(item => {
          item.addEventListener('click', () => {
            loadNovelById(item.dataset.id);
            loadModal.classList.add('hidden');
          });
        });
      }
    } catch (error) {
      console.error('加载失败:', error);
    }

    loadModal.classList.remove('hidden');
  });

  cancelLoadBtn.addEventListener('click', () => {
    loadModal.classList.add('hidden');
  });

  // 通过 ID 加载小说
  async function loadNovelById(novelId) {
    try {
      const response = await fetch('/api/load/' + novelId);
      const novel = await response.json();

      if (response.ok) {
        novelTitleEl.value = novel.title;
        outlineEl.value = novel.outline;
        currentChapters = novel.chapters;
        currentNovelId = novel.id;
        activeChapterIndex = currentChapters.length - 1;

        if (currentChapters.length > 0) {
          showChapter(activeChapterIndex);
        }

        updateUI();
        showToast('小说加载成功！', 'success');
      } else {
        showToast(novel.error || '加载失败', 'error');
      }
    } catch (error) {
      showToast('网络错误：' + error.message, 'error');
    }
  }

  // 复制当前章节
  copyBtn.addEventListener('click', () => {
    if (activeChapterIndex < 0 || !currentChapters[activeChapterIndex]) {
      showToast('没有可复制的内容', 'error');
      return;
    }
    const contentEl = contentDisplay.querySelector('.content-text');
    if (contentEl) {
      navigator.clipboard.writeText(contentEl.innerText).then(() => {
        showToast('已复制到剪贴板', 'success');
      });
    }
  });

  // 导出全部章节
  exportBtn.addEventListener('click', () => {
    if (currentChapters.length === 0) {
      showToast('没有可导出的内容', 'error');
      return;
    }
    exportModal.classList.remove('hidden');
  });

  document.querySelectorAll('.export-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const format = btn.dataset.format;
      exportNovel(format);
      exportModal.classList.add('hidden');
    });
  });

  cancelExportBtn.addEventListener('click', () => {
    exportModal.classList.add('hidden');
  });

  function exportNovel(format) {
    const title = novelTitleEl.value.trim() || '未命名小说';
    let content = '';

    if (format === 'txt') {
      content = title + '\n' + '═'.repeat(40) + '\n\n';
      currentChapters.forEach(ch => {
        content += '第 ' + ch.chapter + ' 章' + (ch.title ? ' ' + ch.title : '') + '\n';
        content += '─'.repeat(30) + '\n\n';
        content += ch.content + '\n\n';
      });
      downloadFile(title + '.txt', content, 'text/plain');
    } else if (format === 'md') {
      content = '# ' + title + '\n\n';
      currentChapters.forEach(ch => {
        content += '## 第 ' + ch.chapter + ' 章' + (ch.title ? ' ' + ch.title : '') + '\n\n';
        content += ch.content + '\n\n';
      });
      downloadFile(title + '.md', content, 'text/markdown');
    }

    showToast('导出成功！', 'success');
  }

  function downloadFile(filename, content, type) {
    const blob = new Blob([content], { type: type + ';charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  // 清空
  clearBtn.addEventListener('click', () => {
    if (currentChapters.length === 0) return;
    if (!confirm('确定要清空所有章节吗？此操作不可恢复。')) return;

    currentChapters = [];
    currentNovelId = null;
    activeChapterIndex = -1;
    contentDisplay.innerHTML = `
      <div class="placeholder">
        <div class="placeholder-icon"></div>
        <p>输入大纲后点击"生成章节"</p>
        <p>AI 将为你创作精彩内容</p>
      </div>`;
    contentTitle.textContent = '章节内容';
    updateUI();
    showToast('已清空', 'success');
  });

  // 显示提示
  function showToast(message, type = 'success') {
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = 'toast ' + type;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => toast.remove(), 3000);
  }

  // 格式化日期
  function formatDate(dateStr) {
    const date = new Date(dateStr);
    const m = date.getMonth() + 1;
    const d = date.getDate();
    const h = String(date.getHours()).padStart(2, '0');
    const min = String(date.getMinutes()).padStart(2, '0');
    return m + '/' + d + ' ' + h + ':' + min;
  }

  // 点击 modal 外部关闭
  [loadModal, exportModal].forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.classList.add('hidden');
    });
  });

  // 初始化
  loadUserInfo();
  updateUI();
  loadNovelList();
});
