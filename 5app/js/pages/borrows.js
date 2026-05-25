/**
 * Borrow Management Page (Admin/Librarian)
 */
var PageBorrows = (function() {
  var borrows = [];
  var selectedBorrow = null;

  function init() {
    render();
    loadBorrows();
  }

  function render() {
    var html =
      '<div class="page manage-page">' +
        '<div class="page-header">' +
          '<h2 class="page-title">借阅管理</h2>' +
        '</div>' +
        '<div class="search-bar">' +
          '<div class="search-input-wrap">' +
            '<span class="search-icon">🔍</span>' +
            '<input type="text" id="borrowSearchInput" placeholder="搜索书名/用户名" />' +
          '</div>' +
          '<button class="search-btn" id="borrowSearchBtn">搜索</button>' +
        '</div>' +
        '<div id="borrowList">' +
          '<div class="loading-overlay"><div class="loading-spinner"></div>加载中...</div>' +
        '</div>' +
      '</div>' +
      '<div class="modal-overlay" id="borrowDetailModal" style="display:none">' +
        '<div class="modal-box borrow-detail-modal">' +
          '<div class="modal-header">借阅详情</div>' +
          '<div class="modal-body" id="borrowDetailBody"></div>' +
          '<div class="modal-footer" id="borrowDetailFooter">' +
            '<div class="modal-btn" onclick="PageBorrows.closeDetail()">关闭</div>' +
          '</div>' +
        '</div>' +
      '</div>';

    document.getElementById('borrows-content').innerHTML = html;
    bindEvents();
  }

  function bindEvents() {
    document.getElementById('borrowSearchBtn').addEventListener('click', handleSearch);
    document.getElementById('borrowSearchInput').addEventListener('keydown', function(e) {
      if (e.key === 'Enter') handleSearch();
    });
  }

  function loadBorrows() {
    var listEl = document.getElementById('borrowList');
    listEl.innerHTML = '<div class="loading-overlay"><div class="loading-spinner"></div>加载中...</div>';

    API.getBorrowRecords()
      .then(function(res) {
        if (res.code === 200) {
          borrows = (res.data || []).sort(function(a, b) {
            var da = a.createdAt || a.borrowDate || '';
            var db = b.createdAt || b.borrowDate || '';
            return da > db ? -1 : da < db ? 1 : 0;
          });
          renderBorrows();
        }
      })
      .catch(function() {
        listEl.innerHTML = '<div class="empty-state"><div class="empty-icon">📭</div><div class="empty-text">加载失败</div></div>';
      });
  }

  function renderBorrows() {
    var listEl = document.getElementById('borrowList');
    if (!listEl) return;

    if (borrows.length === 0) {
      listEl.innerHTML = '<div class="empty-state"><div class="empty-icon">📭</div><div class="empty-text">暂无借阅记录</div></div>';
      return;
    }

    var html = '<div class="card">';
    borrows.forEach(function(b) {
      var statusCls = Utils.borrowStatusClass(b.status);
      var statusLabel = Utils.formatBorrowStatus(b.status);

      html +=
        '<div class="list-item" data-id="' + b.id + '" style="cursor:pointer">' +
          '<div class="item-content">' +
            '<div class="item-title">' + Utils.escapeHtml(b.book?.title || '未知图书') + '</div>' +
            '<div class="item-desc">' +
              '借阅人：' + Utils.escapeHtml(b.user?.displayName || b.user?.username || '未知') +
              ' · 借书：' + Utils.formatDateShort(b.borrowDate) +
            '</div>' +
          '</div>' +
          '<div class="item-right">' +
            '<span class="tag ' + statusCls + '">' + statusLabel + '</span>' +
            '<div class="item-desc mt-8">' +
              (b.dueDate ? '到期：' + Utils.formatDateShort(b.dueDate) : '') +
            '</div>' +
          '</div>' +
        '</div>';
    });
    html += '</div>';
    listEl.innerHTML = html;

    // Bind click to show detail
    listEl.querySelectorAll('.list-item[data-id]').forEach(function(item) {
      item.addEventListener('click', function() {
        var id = parseInt(item.getAttribute('data-id'));
        var borrow = borrows.find(function(b) { return b.id === id; });
        if (borrow) showDetail(borrow);
      });
    });
  }

  function handleSearch() {
    // Backend search only supports userId/status, so just reload
    loadBorrows();
  }

  function showDetail(borrow) {
    selectedBorrow = borrow;
    var modal = document.getElementById('borrowDetailModal');
    var body = document.getElementById('borrowDetailBody');
    var footer = document.getElementById('borrowDetailFooter');

    var statusCls = Utils.borrowStatusClass(borrow.status);
    var statusLabel = Utils.formatBorrowStatus(borrow.status);
    var isOverdue = borrow.status === 'OVERDUE';
    var isBorrowed = borrow.status === 'BORROWED' || borrow.status === 'OVERDUE';

    body.innerHTML =
      '<div class="detail-row"><span class="detail-label">图书</span><span class="detail-value">' + Utils.escapeHtml(borrow.book?.title || '-') + '</span></div>' +
      '<div class="detail-row"><span class="detail-label">借阅人</span><span class="detail-value">' + Utils.escapeHtml(borrow.user?.displayName || borrow.user?.username || '-') + '</span></div>' +
      '<div class="detail-row"><span class="detail-label">状态</span><span class="detail-value"><span class="tag ' + statusCls + '">' + statusLabel + '</span></span></div>' +
      '<div class="detail-row"><span class="detail-label">借书日期</span><span class="detail-value">' + Utils.formatDate(borrow.borrowDate) + '</span></div>' +
      '<div class="detail-row"><span class="detail-label">应还日期</span><span class="detail-value">' + Utils.formatDate(borrow.dueDate) + '</span></div>' +
      (borrow.returnDate ? '<div class="detail-row"><span class="detail-label">归还日期</span><span class="detail-value">' + Utils.formatDate(borrow.returnDate) + '</span></div>' : '') +
      (isOverdue ? '<div class="detail-row" style="color:#f56c6c"><span class="detail-label">⚠️</span><span class="detail-value">已逾期，请尽快处理</span></div>' : '');

    // Action buttons
    var actionsHtml = '<div class="modal-btn" onclick="PageBorrows.closeDetail()">关闭</div>';
    if (isBorrowed) {
      actionsHtml =
        '<div class="modal-btn" onclick="PageBorrows.handleReturn(' + borrow.id + ')">归还</div>' +
        '<div class="modal-btn primary" onclick="PageBorrows.handleRenew(' + borrow.id + ')">续借</div>' +
        '<div class="modal-btn" onclick="PageBorrows.closeDetail()">关闭</div>';
    }
    footer.innerHTML = actionsHtml;

    modal.style.display = 'flex';
    modal.addEventListener('click', function(e) {
      if (e.target === modal) modal.style.display = 'none';
    });
  }

  function closeDetail() {
    document.getElementById('borrowDetailModal').style.display = 'none';
  }

  function handleReturn(id) {
    Utils.showConfirm('确认归还此书？', '归还确认', function(confirmed) {
      if (!confirmed) return;
      API.returnBook(id)
        .then(function(res) {
          if (res.code === 200) {
            Utils.showToast('归还成功');
            closeDetail();
            loadBorrows();
          } else {
            Utils.showToast(res.message || '操作失败');
          }
        })
        .catch(function(err) {
          Utils.showToast(err.message || '操作失败');
        });
    });
  }

  function handleRenew(id) {
    Utils.showConfirm('确认续借此书？', '续借确认', function(confirmed) {
      if (!confirmed) return;
      API.renewBook(id)
        .then(function(res) {
          if (res.code === 200) {
            Utils.showToast('续借成功');
            closeDetail();
            loadBorrows();
          } else {
            Utils.showToast(res.message || '操作失败');
          }
        })
        .catch(function(err) {
          Utils.showToast(err.message || '操作失败');
        });
    });
  }

  return { init: init, closeDetail: closeDetail, handleReturn: handleReturn, handleRenew: handleRenew };
})();
