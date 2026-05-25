/**
 * App Initialization
 */

(function() {
  // Initialize store
  Store.init();

  // ============================================================
  // Apply saved theme & dark mode
  // ============================================================
  (function applyTheme() {
    var theme = localStorage.getItem('theme') || 'm3';
    document.documentElement.setAttribute('data-theme', theme);
    var isDark = localStorage.getItem('darkMode') === 'true';
    if (isDark) document.documentElement.classList.add('dark-mode');
  })();

  // ============================================================
  // Register Routes
  // ============================================================

  // Login (no tabbar, no header)
  Router.register('login', {
    pageId: 'page-login',
    title: '登录',
    init: PageLogin.init,
    hideTabbar: true,
    hideHeader: true
  });

  // Dashboard
  Router.register('dashboard', {
    pageId: 'page-dashboard',
    title: '首页',
    init: PageDashboard.init
  });

  // Books
  Router.register('books', {
    pageId: 'page-books',
    title: '图书浏览',
    init: PageBooks.init
  });

  // Book Form (add/edit)
  Router.register('book-form', {
    pageId: 'page-book-form',
    title: '图书编辑',
    init: PageBookForm.init,
    authRequired: true,
    roles: ['ADMIN', 'LIBRARIAN']
  });

  // Borrows Management (admin)
  Router.register('borrows', {
    pageId: 'page-borrows',
    title: '借阅管理',
    init: PageBorrows.init,
    authRequired: true,
    roles: ['ADMIN', 'LIBRARIAN']
  });

  // Users Management (admin only)
  Router.register('users', {
    pageId: 'page-users',
    title: '用户管理',
    init: PageUsers.init,
    authRequired: true,
    roles: ['ADMIN']
  });

  // Categories Management (admin only)
  Router.register('categories', {
    pageId: 'page-categories',
    title: '分类管理',
    init: PageCategories.init,
    authRequired: true,
    roles: ['ADMIN']
  });

  // My Borrows
  Router.register('my-borrows', {
    pageId: 'page-my-borrows',
    title: '我的借阅',
    init: PageMyBorrows.init,
    authRequired: true
  });

  // Favorites
  Router.register('favorites', {
    pageId: 'page-favorites',
    title: '我的收藏',
    init: PageFavorites.init,
    authRequired: true
  });

  // Recommendations
  Router.register('recommendations', {
    pageId: 'page-recommendations',
    title: '智能推荐',
    init: PageRecommendations.init,
    authRequired: true
  });

  // Profile
  Router.register('profile', {
    pageId: 'page-profile',
    title: '个人中心',
    init: PageProfile.init,
    authRequired: true
  });

  // Set route change handler for header back button visibility
  Router.setOnRouteChange(function(path) {
    var backBtn = document.getElementById('headerBack');
    var hideBack = ['dashboard', 'login'].indexOf(path) !== -1;
    backBtn.style.display = hideBack ? 'none' : 'flex';
  });

  // Initialize router
  Router.init();

  // ============================================================
  // Android Hardware Back Button
  // ============================================================
  var _exitTimer = null;

  function isLoginPageActive() {
    var el = document.getElementById('page-login');
    return el && el.classList.contains('active');
  }

  function handleBackButton() {
    // 1. Close any open modal/dialog first
    var openModal = document.querySelector('.modal-overlay[style*="display: flex"], .modal-overlay[style*="display:flex"]');
    if (openModal) {
      openModal.style.display = 'none';
      // Also remove any dynamically created modal overlays (from Utils.showConfirm/Alert)
      var dynamicModals = document.querySelectorAll('body > .modal-overlay');
      for (var i = 0; i < dynamicModals.length; i++) {
        dynamicModals[i].remove();
      }
      return;
    }

    // 2. Close action sheet if open
    var sheet = document.querySelector('.action-sheet');
    var sheetOverlay = document.querySelector('.action-sheet-overlay');
    if (sheet || sheetOverlay) {
      if (sheet) sheet.remove();
      if (sheetOverlay) sheetOverlay.remove();
      return;
    }

    // 3. Try router back
    if (Router.back()) return;

    // 4. On login page — exit directly (no double-tap)
    if (isLoginPageActive()) {
      if (typeof plus !== 'undefined' && plus.runtime) {
        plus.runtime.quit();
      }
      return;
    }

    // 5. At root (dashboard) — double-tap to exit
    if (_exitTimer) {
      clearTimeout(_exitTimer);
      _exitTimer = null;
      if (typeof plus !== 'undefined' && plus.runtime) {
        plus.runtime.quit();
      }
      return;
    }

    Utils.showToast('再按一次退出应用');
    _exitTimer = setTimeout(function() {
      _exitTimer = null;
    }, 2000);
  }

  // Update header back button to use Router.back() instead of hard navigate to dashboard
  var headerBack = document.getElementById('headerBack');
  if (headerBack) {
    headerBack.onclick = function() {
      if (Router.canGoBack()) {
        Router.back();
      } else {
        Router.navigate('dashboard');
      }
    };
  }

  // Register Android back button handler
  // Must handle both: plusready already fired, or not yet fired
  function registerBackButton() {
    if (typeof plus !== 'undefined' && plus.key) {
      plus.key.addEventListener('backbutton', handleBackButton);
    }
  }

  // If plus is already available, register immediately
  if (typeof plus !== 'undefined') {
    registerBackButton();
  }
  // Also listen for plusready (in case plus isn't ready yet)
  document.addEventListener('plusready', registerBackButton);

  // Also intercept popstate for browser testing fallback
})();
