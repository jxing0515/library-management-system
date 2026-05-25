/**
 * Hash-based SPA Router with history stack for back navigation
 */

var Router = (function() {
  var routes = {};
  var currentRoute = null;
  var onRouteChange = null;
  /** @type {string[]} Stack of previous routes for back navigation */
  var _history = [];
  /** Pages that should not be added to history when navigating TO them */
  var _skipHistory = { login: true };

  /**
   * Register a route
   * @param {string} path - Hash path (e.g. 'dashboard')
   * @param {object} config - { pageId, init, authRequired, roles }
   */
  function register(path, config) {
    routes[path] = config;
  }

  /**
   * Navigate to a route
   * @param {string} path - Target route
   * @param {object|undefined} params - Optional params passed to page init
   * @param {object} [opts] - Options
   * @param {boolean} [opts.replace] - Replace current history entry instead of pushing
   */
  function navigate(path, params, opts) {
    if (!path) path = 'dashboard';
    opts = opts || {};

    // Check auth
    var route = routes[path];
    if (!route) {
      navigate('dashboard');
      return;
    }

    if (route.authRequired && !Store.isLoggedIn()) {
      navigate('login');
      return;
    }

    if (route.roles && route.roles.length > 0) {
      var user = Store.getUser();
      if (!user || route.roles.indexOf(user.role) === -1) {
        Utils.showToast('无权访问此页面');
        navigate('dashboard');
        return;
      }
    }

    // Push current route to history before changing
    // (skip login page, skip same-page nav, skip consecutive duplicates, skip replace)
    if (currentRoute && path !== currentRoute && !_skipHistory[path] && !opts.replace) {
      var last = _history[_history.length - 1];
      if (last !== currentRoute) {
        _history.push(currentRoute);
      }
    }

    currentRoute = path;
    window.location.hash = '#' + path;

    // Update UI
    updateUI(path);

    // Call page init
    if (route.init) {
      route.init(params);
    }

    if (onRouteChange) {
      onRouteChange(path);
    }
  }

  /**
   * Update UI elements based on current route
   */
  function updateUI(path) {
    // Hide all pages
    var pages = document.querySelectorAll('.page-container');
    for (var i = 0; i < pages.length; i++) {
      pages[i].classList.remove('active');
    }

    // Show current page
    var route = routes[path];
    if (route && route.pageId) {
      var page = document.getElementById(route.pageId);
      if (page) page.classList.add('active');
    }

    // Update tab bar
    var tabs = document.querySelectorAll('.tab-item');
    for (var i = 0; i < tabs.length; i++) {
      tabs[i].classList.remove('active');
    }
    var activeTab = document.querySelector('.tab-item[data-page="' + path + '"]');
    if (activeTab) activeTab.classList.add('active');

    // Show/hide tab bar
    var tabbar = document.querySelector('.app-tabbar');
    var header = document.querySelector('.app-header');
    var content = document.querySelector('.app-content');

    if (route && route.hideTabbar) {
      if (tabbar) tabbar.style.display = 'none';
    } else {
      if (tabbar) tabbar.style.display = 'flex';
    }

    if (route && route.hideHeader) {
      if (header) header.style.display = 'none';
      if (content) content.style.paddingTop = '0';
    } else {
      if (header) header.style.display = 'flex';
      if (content) content.style.paddingTop = '';
    }

    // Update header title
    if (route && route.title) {
      var titleEl = document.querySelector('.header-title');
      if (titleEl) titleEl.textContent = route.title;
    }
  }

  /**
   * Handle hash change
   */
  function handleHashChange() {
    var hash = window.location.hash.replace('#', '') || 'dashboard';
    if (hash !== currentRoute) {
      navigate(hash);
    }
  }

  /**
   * Set route change callback
   */
  function setOnRouteChange(callback) {
    onRouteChange = callback;
  }

  /**
   * Initialize router
   */
  function init() {
    window.addEventListener('hashchange', handleHashChange);

    // Initial route from hash or default
    var hash = window.location.hash.replace('#', '') || 'dashboard';
    navigate(hash);
  }

  // ============================================================
  // Back Navigation
  // ============================================================

  /** @returns {boolean} True if there is a previous page to go back to */
  function canGoBack() {
    return _history.length > 0;
  }

  /** @returns {number} Depth of navigation history */
  function getHistoryDepth() {
    return _history.length;
  }

  /** Clear the entire history stack */
  function clearHistory() {
    _history = [];
  }

  /**
   * Navigate back to the previous page.
   * @returns {boolean} True if navigated back, false if already at root
   */
  function back() {
    if (_history.length === 0) return false;
    var prev = _history.pop();
    if (!prev || !routes[prev]) {
      // Fallback: if previous route no longer valid, go to dashboard
      prev = 'dashboard';
    }
    navigate(prev, null, { replace: true });
    return true;
  }

  return {
    register: register,
    navigate: navigate,
    init: init,
    setOnRouteChange: setOnRouteChange,
    getCurrentRoute: function() { return currentRoute; },
    canGoBack: canGoBack,
    getHistoryDepth: getHistoryDepth,
    clearHistory: clearHistory,
    back: back
  };
})();
