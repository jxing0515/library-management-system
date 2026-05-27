/**
 * Recommendations Page - AI Powered Book Recommendations
 */
var PageRecommendations = (function() {
  var recommendations = [];
  var currentMode = '';
  var loading = false;

  function init() {
    render();
    loadRecommendations();
  }

  function render() {
    var html =
      '<div class="page recommend-page">' +
        '<div class="page-header">' +
          '<h2 class="page-title">智能推荐</h2>' +
          '<button class="btn btn-primary btn-sm" id="refreshRecBtn">🔄 刷新</button>' +
        '</div>' +
        '<div class="mode-chip" id="modeBadge" style="display:none"></div>' +
        '<div id="recommendationsList">' +
          '<div class="loading-overlay"><div class="loading-spinner"></div>正在分析您的阅读偏好...</div>' +
        '</div>' +
      '</div>';

    document.getElementById('recommendations-content').innerHTML = html;

    document.getElementById('refreshRecBtn').addEventListener('click', function() {
      if (loading) return;
      loadRecommendations();
    });
  }

  function loadRecommendations() {
    var userId = Store.getUserId();
    if (!userId) {
      Router.navigate('login');
      return;
    }

    loading = true;
    var listEl = document.getElementById('recommendationsList');
    listEl.innerHTML = '<div class="loading-overlay"><div class="loading-spinner"></div>正在分析您的阅读偏好...</div>';

    API.getRecommendations(userId, 10)
      .then(function(res) {
        if (res.code === 200) {
          // 后端返回 { books: [...], mode: "ai"|"category"|"random" }
          recommendations = (res.data && res.data.books) || [];
          currentMode = (res.data && res.data.mode) || '';
          renderRecommendations();
        } else {
          listEl.innerHTML = '<div class="empty-state"><div class="empty-icon">📭</div><div class="empty-text">暂无推荐</div></div>';
        }
      })
      .catch(function() {
        listEl.innerHTML = '<div class="empty-state"><div class="empty-icon">😅</div><div class="empty-text">推荐服务暂不可用，请稍后再试</div></div>';
      })
      .finally(function() {
        loading = false;
      });
  }

  var modeNames = {
    ai: { label: 'AI 智能推荐', icon: '🤖', color: '#1976d2', bg: '#d1e4ff' },
    category: { label: '偏好推荐', icon: '📊', color: '#2e7d32', bg: '#e8f5e9' },
    random: { label: '随机推荐', icon: '🎲', color: '#535f70', bg: '#e0e2ec' }
  };

  function renderRecommendations() {
    var listEl = document.getElementById('recommendationsList');
    var badgeEl = document.getElementById('modeBadge');
    if (!listEl) return;

    // Show mode indicator as M3 chip
    if (badgeEl && currentMode && modeNames[currentMode]) {
      var m = modeNames[currentMode];
      badgeEl.style.display = 'inline-flex';
      badgeEl.style.background = m.bg;
      badgeEl.style.color = m.color;
      badgeEl.innerHTML = m.icon + ' ' + m.label;
    } else if (badgeEl) {
      badgeEl.style.display = 'none';
    }

    if (!recommendations || recommendations.length === 0) {
      listEl.innerHTML =
        '<div class="empty-state">' +
          '<div class="empty-icon">📚</div>' +
          '<div class="empty-text">暂无推荐图书</div>' +
          '<div class="mt-8" style="font-size:13px;color:var(--md-on-surface-variant)">多借阅一些图书，我们会为您提供更精准的推荐</div>' +
          '<div class="mt-12"><button class="btn btn-primary btn-sm" onclick="Router.navigate(\'books\')">去浏览图书</button></div>' +
        '</div>';
      return;
    }

    var html = '';
    recommendations.forEach(function(book) {
      var coverHtml = book.coverUrl
        ? '<img src="' + Utils.escapeHtml(Utils.resolveImageUrl(book.coverUrl)) + '" alt="封面" />'
        : '📖';

      var catHtml = book.category && book.category.name
        ? '<span class="rec-category">' + Utils.escapeHtml(book.category.name) + '</span>'
        : '';

      var descHtml = book.description
        ? '<div class="rec-desc">' + Utils.escapeHtml(book.description.substring(0, 60)) + (book.description.length > 60 ? '...' : '') + '</div>'
        : '';

      html +=
        '<div class="rec-card">' +
          '<div class="rec-cover">' + coverHtml + '</div>' +
          '<div class="rec-info">' +
            '<div class="rec-title">' + Utils.escapeHtml(book.title) + '</div>' +
            '<div class="rec-author">' + Utils.escapeHtml(book.author) + '</div>' +
            '<div class="rec-meta">' + catHtml + '</div>' +
            descHtml +
            '<div class="rec-actions">' +
              '<button class="btn btn-primary borrow-rec-btn" data-bookid="' + book.id + '">借阅</button>' +
            '</div>' +
          '</div>' +
        '</div>';
    });

    listEl.innerHTML = html;

    // Bind borrow buttons
    listEl.querySelectorAll('.borrow-rec-btn').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var bookId = parseInt(btn.getAttribute('data-bookid'));
        var book = recommendations.find(function(b) { return b.id === bookId; });
        if (book) handleBorrow(book);
      });
    });
  }

  function handleBorrow(book) {
    Utils.showConfirm('确认借阅《' + book.title + '》？借阅期限为 30 天。', '确认借阅', function(confirmed) {
      if (!confirmed) return;
      API.borrowBook(Store.getUserId(), book.id)
        .then(function(res) {
          if (res.code === 200) {
            Utils.showToast('借阅成功！');
            loadRecommendations();
          } else {
            Utils.showToast(res.message || '借阅失败');
          }
        })
        .catch(function(err) {
          Utils.showToast(err.message || '借阅失败');
        });
    });
  }

  return { init: init };
})();
