/**
 * Utility functions
 */

var Utils = (function() {

  /**
   * Show toast message
   */
  function showToast(message, duration) {
    duration = duration || 2000;

    // Try plus API first
    if (typeof plus !== 'undefined' && plus.nativeUI) {
      plus.nativeUI.toast(message, { duration: duration < 3000 ? 'short' : 'long' });
      return;
    }

    // Fallback: DOM toast
    var existing = document.querySelector('.toast');
    if (existing) existing.remove();

    var toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(function() {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, duration);
  }

  /**
   * Show loading toast
   */
  function showLoading(message) {
    message = message || '加载中...';

    // Try plus API
    if (typeof plus !== 'undefined' && plus.nativeUI) {
      plus.nativeUI.showWaiting(message, { modal: true });
      return true;
    }

    // DOM fallback
    var existing = document.querySelector('.loading-toast');
    if (existing) return false;

    var overlay = document.createElement('div');
    overlay.className = 'loading-toast';
    overlay.innerHTML = '<div class="loading-spinner"></div><span>' + message + '</span>';
    overlay.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:rgba(0,0,0,0.75);color:#fff;padding:16px 24px;border-radius:10px;z-index:1000;display:flex;align-items:center;gap:10px;font-size:14px;';
    document.body.appendChild(overlay);
    return false;
  }

  /**
   * Hide loading
   */
  function hideLoading(isPlus) {
    if (isPlus && typeof plus !== 'undefined' && plus.nativeUI) {
      plus.nativeUI.closeWaiting();
      return;
    }
    var el = document.querySelector('.loading-toast');
    if (el) el.remove();
  }

  /**
   * Show confirm dialog
   */
  function showConfirm(message, title, callback) {
    title = title || '提示';

    // Try plus API
    if (typeof plus !== 'undefined' && plus.nativeUI) {
      plus.nativeUI.confirm(message, function(e) {
        callback(e.index === 0);
      }, title, ['确定', '取消']);
      return;
    }

    // DOM fallback modal
    var overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML =
      '<div class="modal-box">' +
      '<div class="modal-header">' + Utils.escapeHtml(title) + '</div>' +
      '<div class="modal-body">' + Utils.escapeHtml(message) + '</div>' +
      '<div class="modal-footer">' +
      '<div class="modal-btn" data-action="cancel">取消</div>' +
      '<div class="modal-btn primary" data-action="confirm">确定</div>' +
      '</div>' +
      '</div>';

    document.body.appendChild(overlay);

    overlay.querySelector('[data-action="confirm"]').addEventListener('click', function() {
      overlay.remove();
      callback(true);
    });
    overlay.querySelector('[data-action="cancel"]').addEventListener('click', function() {
      overlay.remove();
      callback(false);
    });
  }

  /**
   * Show alert dialog
   */
  function showAlert(message, title, callback) {
    title = title || '提示';
    callback = callback || function(){};

    if (typeof plus !== 'undefined' && plus.nativeUI) {
      plus.nativeUI.alert(message, function() { callback(); }, title);
      return;
    }

    var overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML =
      '<div class="modal-box">' +
      '<div class="modal-header">' + Utils.escapeHtml(title) + '</div>' +
      '<div class="modal-body">' + Utils.escapeHtml(message) + '</div>' +
      '<div class="modal-footer">' +
      '<div class="modal-btn primary" data-action="confirm">确定</div>' +
      '</div>' +
      '</div>';

    document.body.appendChild(overlay);
    overlay.querySelector('[data-action="confirm"]').addEventListener('click', function() {
      overlay.remove();
      callback();
    });
  }

  /**
   * Format date
   */
  function formatDate(dateStr) {
    if (!dateStr) return '-';
    var d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    var y = d.getFullYear();
    var m = ('0' + (d.getMonth() + 1)).slice(-2);
    var day = ('0' + d.getDate()).slice(-2);
    var h = ('0' + d.getHours()).slice(-2);
    var min = ('0' + d.getMinutes()).slice(-2);
    return y + '-' + m + '-' + day + ' ' + h + ':' + min;
  }

  /**
   * Format date (short - no time)
   */
  function formatDateShort(dateStr) {
    if (!dateStr) return '-';
    var d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    var y = d.getFullYear();
    var m = ('0' + (d.getMonth() + 1)).slice(-2);
    var day = ('0' + d.getDate()).slice(-2);
    return y + '-' + m + '-' + day;
  }

  /**
   * Format borrow status
   */
  function formatBorrowStatus(status) {
    var map = {
      'BORROWED': '借阅中',
      'RETURNED': '已归还',
      'OVERDUE': '逾期中',
      'RENEWED': '已续借'
    };
    return map[status] || status || '-';
  }

  /**
   * Get borrow status tag class
   */
  function borrowStatusClass(status) {
    var map = {
      'BORROWED': 'tag-primary',
      'RETURNED': 'tag-success',
      'OVERDUE': 'tag-danger',
      'RENEWED': 'tag-warning'
    };
    return map[status] || 'tag-info';
  }

  /**
   * Get role label
   */
  function roleLabel(role) {
    var map = {
      'ADMIN': '管理员',
      'LIBRARIAN': '图书管理员',
      'READER': '读者'
    };
    return map[role] || role || '-';
  }

  /**
   * Get role tag class
   */
  function roleClass(role) {
    var map = {
      'ADMIN': 'tag-danger',
      'LIBRARIAN': 'tag-warning',
      'READER': 'tag-primary'
    };
    return map[role] || 'tag-info';
  }

  /**
   * Escape HTML
   */
  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /**
   * Throttle function
   */
  function throttle(fn, delay) {
    var last = 0;
    return function() {
      var now = Date.now();
      if (now - last >= delay) {
        last = now;
        fn.apply(this, arguments);
      }
    };
  }

  /**
   * Resolve image URL - prefix relative paths with backend origin
   * URL 形如 /uploads/covers/xxx.jpg 需要拼上后端地址
   */
  function getBackendOrigin() {
    var base = (typeof API !== 'undefined' && API.getCurrentBaseUrl)
      ? API.getCurrentBaseUrl()
      : 'http://localhost:8081/api';
    return base.replace(/\/api\/?$/, '');
  }

  function resolveImageUrl(url) {
    if (!url) return '';
    if (url.indexOf('://') !== -1 || url.indexOf('data:') === 0) {
      return url; // Already absolute or data URI
    }
    if (url.indexOf('/') === 0) {
      return getBackendOrigin() + url; // Relative path → prefix origin
    }
    return url;
  }

  return {
    showToast: showToast,
    showLoading: showLoading,
    hideLoading: hideLoading,
    showConfirm: showConfirm,
    showAlert: showAlert,
    formatDate: formatDate,
    formatDateShort: formatDateShort,
    formatBorrowStatus: formatBorrowStatus,
    borrowStatusClass: borrowStatusClass,
    roleLabel: roleLabel,
    roleClass: roleClass,
    escapeHtml: escapeHtml,
    throttle: throttle,
    resolveImageUrl: resolveImageUrl
  };
})();
