/**
 * My Borrows Page
 */
var PageMyBorrows = (function() {
  var borrows = [];
  var filter = 'all'; // 'all' | 'BORROWED' | 'RETURNED' | 'OVERDUE'

  function init() {
    render();
    loadBorrows();
  }

  function render() {
    var html =
      '<div class="page">' +
        '<div class="filter-row" id="myBorrowFilters">' +
          '<span class="filter-tag active" data-filter="all">全部</span>' +
          '<span class="filter-tag" data-filter="BORROWED">借阅中</span>' +
          '<span class="filter-tag" data-filter="OVERDUE">逾期</span>' +
          '<span class="filter-tag" data-filter="RETURNED">已归还</span>' +
        '</div>' +
        '<div id="myBorrowList">' +
          '<div class="loading-overlay"><div class="loading-spinner"></div>加载中...</div>' +
        '</div>' +
      '</div>' +
      '<div class="modal-overlay" id="myBorrowDetailModal" style="display:none">' +
        '<div class="modal-box borrow-detail-modal">' +
          '<div class="modal-header">借阅详情</div>' +
          '<div class="modal-body" id="myBorrowDetailBody"></div>' +
          '<div class="modal-footer" id="myBorrowDetailFooter">' +
            '<div class="modal-btn" onclick="PageMyBorrows.closeDetail()">关闭</div>' +
          '</div>' +
        '</div>' +
      '</div>';

    document.getElementById('my-borrows-content').innerHTML = html;
    bindEvents();
  }

  function bindEvents() {
    // Filter clicks via delegation
    document.getElementById('my-borrows-content').addEventListener('click', function(e) {
      var filterEl = e.target.closest('[data-filter]');
      if (filterEl) {
        document.querySelectorAll('#myBorrowFilters .filter-tag').forEach(function(t) { t.classList.remove('active'); });
        filterEl.classList.add('active');
        filter = filterEl.getAttribute('data-filter');
        renderBorrows();
      }
    });
  }

  function loadBorrows() {
    var userId = Store.getUserId();
    if (!userId) {
      Router.navigate('login');
      return;
    }

    API.getUserBorrowRecords(userId)
      .then(function(res) {
        if (res.code === 200) {
          borrows = res.data;
          renderBorrows();
        }
      })
      .catch(function() {
        document.getElementById('myBorrowList').innerHTML =
          '<div class="empty-state"><div class="empty-icon">📭</div><div class="empty-text">加载失败</div></div>';
      });
  }

  function renderBorrows() {
    var listEl = document.getElementById('myBorrowList');
    if (!listEl) return;

    var filtered = borrows;
    if (filter !== 'all') {
      filtered = borrows.filter(function(b) { return b.status === filter; });
    }

    if (filtered.length === 0) {
      listEl.innerHTML = '<div class="empty-state"><div class="empty-icon">📭</div><div class="empty-text">暂无借阅记录</div></div>';
      return;
    }

    var html = '<div class="card">';
    filtered.forEach(function(b) {
      var statusCls = Utils.borrowStatusClass(b.status);
      var statusLabel = Utils.formatBorrowStatus(b.status);

      html +=
        '<div class="list-item" data-id="' + b.id + '" style="cursor:pointer">' +
          '<div class="item-content">' +
            '<div class="item-title">' + Utils.escapeHtml(b.book?.title || '未知图书') + '</div>' +
            '<div class="item-desc">' +
              '借书：' + Utils.formatDateShort(b.borrowDate) +
              (b.dueDate ? ' · 到期：' + Utils.formatDateShort(b.dueDate) : '') +
            '</div>' +
          '</div>' +
          '<div class="item-right">' +
            '<span class="tag ' + statusCls + '">' + statusLabel + '</span>' +
          '</div>' +
        '</div>';
    });
    html += '</div>';
    listEl.innerHTML = html;

    // Bind click to show detail
    listEl.querySelectorAll('.list-item[data-id]').forEach(function(item) {
      item.addEventListener('click', function() {
        var id = parseInt(item.getAttribute('data-id'));
        var borrow = filtered.find(function(b) { return b.id === id; });
        if (borrow) showDetail(borrow);
      });
    });
  }

  function showDetail(borrow) {
    var modal = document.getElementById('myBorrowDetailModal');
    var body = document.getElementById('myBorrowDetailBody');
    var footer = document.getElementById('myBorrowDetailFooter');

    var statusCls = Utils.borrowStatusClass(borrow.status);
    var statusLabel = Utils.formatBorrowStatus(borrow.status);
    var isActive = borrow.status === 'BORROWED' || borrow.status === 'OVERDUE';

    body.innerHTML =
      '<div class="detail-row"><span class="detail-label">图书</span><span class="detail-value">' + Utils.escapeHtml(borrow.book?.title || '-') + '</span></div>' +
      (borrow.book?.author ? '<div class="detail-row"><span class="detail-label">作者</span><span class="detail-value">' + Utils.escapeHtml(borrow.book.author) + '</span></div>' : '') +
      '<div class="detail-row"><span class="detail-label">状态</span><span class="detail-value"><span class="tag ' + statusCls + '">' + statusLabel + '</span></span></div>' +
      '<div class="detail-row"><span class="detail-label">借书日期</span><span class="detail-value">' + Utils.formatDate(borrow.borrowDate) + '</span></div>' +
      '<div class="detail-row"><span class="detail-label">应还日期</span><span class="detail-value">' + Utils.formatDate(borrow.dueDate) + '</span></div>' +
      (borrow.returnDate ? '<div class="detail-row"><span class="detail-label">归还日期</span><span class="detail-value">' + Utils.formatDate(borrow.returnDate) + '</span></div>' : '') +
      (borrow.status === 'OVERDUE' ? '<div class="detail-row" style="color:#f56c6c"><span class="detail-label">⚠️</span><span class="detail-value">已逾期，请尽快归还</span></div>' : '');

    // Action buttons
    var actionsHtml = '<div class="modal-btn" onclick="PageMyBorrows.closeDetail()">关闭</div>';
    if (isActive) {
      actionsHtml =
        '<div class="modal-btn primary" onclick="PageMyBorrows.handleRenew(' + borrow.id + ')">续借</div>' +
        '<div class="modal-btn" onclick="PageMyBorrows.closeDetail()">关闭</div>';
    }
    footer.innerHTML = actionsHtml;

    modal.style.display = 'flex';
    modal.addEventListener('click', function(e) {
      if (e.target === modal) modal.style.display = 'none';
    });
  }

  function closeDetail() {
    document.getElementById('myBorrowDetailModal').style.display = 'none';
  }

  function handleRenew(id) {
    Utils.showConfirm('确认续借此书？将延长 30 天。', '续借确认', function(confirmed) {
      if (!confirmed) return;
      API.renewBook(id)
        .then(function(res) {
          if (res.code === 200) {
            Utils.showToast('续借成功');
            closeDetail();
            loadBorrows();
          } else {
            Utils.showToast(res.message || '续借失败');
          }
        })
        .catch(function(err) {
          Utils.showToast(err.message || '续借失败');
        });
    });
  }

  return { init: init, closeDetail: closeDetail, handleRenew: handleRenew };
})();
