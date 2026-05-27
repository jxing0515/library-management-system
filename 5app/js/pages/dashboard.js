/**
 * Dashboard Page - Home / Stats / Quick Actions
 */
var PageDashboard = (function() {
  var stats = null;

  function init() {
    render();
    loadStats();
  }

  function render() {
    var container = document.getElementById('dashboard-content');

    if (!Store.isLoggedIn()) {
      // Public landing
      container.innerHTML =
        '<div class="page dashboard-page">' +
          '<div class="hero-section">' +
            '<div class="hero-icon">📚</div>' +
            '<h1>智慧图书管理系统</h1>' +
            '<p>便捷高效的图书管理平台，让阅读更简单</p>' +
            '<div class="hero-actions">' +
              '<button class="btn btn-primary btn-lg" onclick="Router.navigate(\'login\')">立即登录</button>' +
            '</div>' +
          '</div>' +
          '<div class="stats-grid" id="pubStatsGrid"></div>' +
          '<h3 class="section-title">平台特色</h3>' +
          '<div class="features-grid">' +
'<div class="feature-card"><div class="feat-icon" style="font-size:32px">📖</div><h4>图书管理</h4><p>轻松管理图书信息，支持分类检索</p></div>' +
'<div class="feature-card"><div class="feat-icon" style="font-size:32px">📦</div><h4>借阅管理</h4><p>便捷的借书还书流程，自动化管理</p></div>' +
'<div class="feature-card"><div class="feat-icon" style="font-size:32px">📊</div><h4>数据统计</h4><p>直观的数据看板，掌握运营状况</p></div>' +
'<div class="feature-card"><div class="feat-icon" style="font-size:32px">👥</div><h4>用户管理</h4><p>完善的用户权限体系，安全保障</p></div>' +
          '</div>' +
        '</div>';
      return;
    }

    // Authenticated dashboard
    var user = Store.getUser();
    var dateStr = new Date().toLocaleDateString('zh-CN', {
      year: 'numeric', month: 'long', day: 'numeric', weekday: 'long'
    });

    container.innerHTML =
      '<div class="page dashboard-page">' +
        '<div class="welcome-banner">' +
          '<div class="welcome-row">' +
            '<div class="welcome-avatar">' +
              (user.avatar ? '<img src="' + Utils.escapeHtml(Utils.resolveImageUrl(user.avatar)) + '" style="width:100%;height:100%;border-radius:50%;object-fit:cover;" />' :
              '<div class="avatar-placeholder" style="width:100%;height:100%;border-radius:50%;background:linear-gradient(135deg,#409eff,#337ecc);color:#fff;display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:600">' + (Store.getDisplayName().charAt(0) || 'U') + '</div>') +
            '</div>' +
            '<div class="welcome-text">' +
              '<h3>欢迎回来，' + Utils.escapeHtml(Store.getDisplayName()) + '</h3>' +
              '<p>' + Utils.escapeHtml(Store.getRoleLabel()) + ' · ' + dateStr + '</p>' +
            '</div>' +
          '</div>' +
        '</div>' +
        '<div class="stats-grid" id="dashStatsGrid">' +
          '<div class="loading-overlay"><div class="loading-spinner"></div>加载中...</div>' +
        '</div>' +
        '<h3 class="section-title">快捷操作</h3>' +
        '<div class="actions-grid" id="quickActions"></div>' +
      '</div>';

    renderQuickActions();
  }

  function renderQuickActions() {
    var actions = [];
    var isAdmin = Store.isAdmin();
    var isLib = Store.isAdminOrLibrarian();

    actions.push({ icon: '📖', label: '浏览图书', color: '#409eff', route: 'books', show: true });
    actions.push({ icon: '📋', label: '我的借阅', color: '#67c23a', route: 'my-borrows', show: true });

    if (isLib || isAdmin) {
      actions.push({ icon: '📦', label: '借阅管理', color: '#e6a23c', route: 'borrows', show: true });
    }
    if (isAdmin) {
      actions.push({ icon: '👥', label: '用户管理', color: '#909399', route: 'users', show: true });
      actions.push({ icon: '🏷️', label: '分类管理', color: '#b37feb', route: 'categories', show: true });
    }
    actions.push({ icon: '⭐', label: '智能推荐', color: '#f56c6c', route: 'recommendations', show: true });
    actions.push({ icon: '❤️', label: '我的收藏', color: '#e6a23c', route: 'favorites', show: true });
    actions.push({ icon: '👤', label: '个人中心', color: '#409eff', route: 'profile', show: true });

    var html = '';
    actions.filter(function(a) { return a.show; }).forEach(function(a) {
      html +=
        '<div class="action-item" onclick="Router.navigate(\'' + a.route + '\')">' +
          '<div class="action-icon">' + a.icon + '</div>' +
          '<span class="action-label">' + a.label + '</span>' +
        '</div>';
    });

    var el = document.getElementById('quickActions');
    if (el) el.innerHTML = html;
  }

  function loadStats() {
    // Always load public stats
    API.getStats()
      .then(function(res) {
        if (res.code === 200) {
          stats = res.data;
          renderStats();
        }
      })
      .catch(function() {});
  }

  function renderStats() {
    if (!stats) return;

    var items = Store.isLoggedIn() ? [
      { icon: '📖', label: '图书总量', value: stats.totalBooks ?? '-', color: '#409eff', bg: '#ecf5ff' },
      { icon: '👥', label: '注册用户', value: stats.totalUsers ?? '-', color: '#67c23a', bg: '#f0f9eb' },
      { icon: '📦', label: '总借阅次数', value: stats.totalBorrows ?? '-', color: '#e6a23c', bg: '#fdf6ec' },
      { icon: '⏰', label: '当前借出', value: stats.activeBorrows ?? '-', color: '#f56c6c', bg: '#fef0f0' },
      { icon: '⚠️', label: '逾期记录', value: stats.overdueRecords ?? '-', color: '#f56c6c', bg: '#fef0f0' },
      { icon: '🏷️', label: '图书分类', value: stats.totalCategories ?? '-', color: '#909399', bg: '#f4f4f5' }
    ] : [
      { icon: '📖', label: '图书总量', value: stats.totalBooks ?? '-', color: '#409eff', bg: '#ecf5ff' },
      { icon: '👥', label: '注册用户', value: stats.totalUsers ?? '-', color: '#67c23a', bg: '#f0f9eb' },
      { icon: '📦', label: '借阅次数', value: stats.totalBorrows ?? '-', color: '#e6a23c', bg: '#fdf6ec' },
      { icon: '🏷️', label: '图书分类', value: stats.totalCategories ?? '-', color: '#909399', bg: '#f4f4f5' }
    ];

    var html = '';
    items.forEach(function(item) {
      html +=
        '<div class="stat-card" style="border-left-color:' + item.color + '">' +
          '<div class="stat-icon" style="background:' + item.bg + ';color:' + item.color + '">' + item.icon + '</div>' +
          '<div>' +
            '<div class="stat-value">' + item.value + '</div>' +
            '<div class="stat-label">' + item.label + '</div>' +
          '</div>' +
        '</div>';
    });

    var el = Store.isLoggedIn()
      ? document.getElementById('dashStatsGrid')
      : document.getElementById('pubStatsGrid');

    if (el) el.innerHTML = html;
  }

  return { init: init };
})();
