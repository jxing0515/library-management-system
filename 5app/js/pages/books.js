/**
 * Books Page - Browse / Search / Borrow / Favorite
 */
var PageBooks = (function() {
  var books = [];
  var categories = [];
  var favoriteMap = {};
  var searchKeyword = '';
  var searchCategoryId = null;
  var selectedBook = null;

  function init() {
    render();
    loadCategories();
    loadBooks();
  }

  function render() {
    var html =
      '<div class="page books-page">' +
        '<div class="search-bar">' +
          '<div class="search-input-wrap">' +
            '<span class="search-icon">🔍</span>' +
            '<input type="text" id="bookSearchInput" placeholder="搜索书名/作者/ISBN" value="' + Utils.escapeHtml(searchKeyword) + '" />' +
          '</div>' +
          '<button class="search-btn" id="bookSearchBtn">搜索</button>' +
        '</div>' +
        (Store.isAdminOrLibrarian()
          ? '<div style="display:flex;justify-content:flex-end;margin-bottom:var(--md-space-3)"><button class="btn btn-primary btn-sm" id="addBookBtn">＋ 新增图书</button></div>'
          : '') +
        '<div class="filter-row" id="categoryFilters">' +
          '<span class="filter-tag active" data-cid="">全部分类</span>' +
        '</div>' +
        '<div id="bookList"></div>' +
        '<div class="loading-overlay" id="bookLoading"><div class="loading-spinner"></div>加载中...</div>' +
      '</div>' +
      // Detail Modal
      '<div class="modal-overlay" id="bookDetailModal" style="display:none">' +
        '<div class="modal-box book-detail-modal">' +
          '<div class="modal-header">图书详情</div>' +
          '<div class="modal-body" id="bookDetailBody"></div>' +
          '<div class="modal-footer">' +
            '<div class="modal-btn" onclick="PageBooks.closeDetail()">关闭</div>' +
          '</div>' +
        '</div>' +
      '</div>';

    document.getElementById('books-content').innerHTML = html;
    bindEvents();
  }

  function bindEvents() {
    document.getElementById('bookSearchBtn').addEventListener('click', handleSearch);
    document.getElementById('bookSearchInput').addEventListener('keydown', function(e) {
      if (e.key === 'Enter') handleSearch();
    });
    var addBtn = document.getElementById('addBookBtn');
    if (addBtn) {
      addBtn.addEventListener('click', function() {
        Router.navigate('book-form');
      });
    }
  }

  function loadCategories() {
    API.getCategories()
      .then(function(res) {
        if (res.code === 200) {
          categories = res.data;
          renderCategoryFilters();
        }
      })
      .catch(function() {});
  }

  function renderCategoryFilters() {
    var filterEl = document.getElementById('categoryFilters');
    if (!filterEl) return;

    var html = '<span class="filter-tag active" data-cid="">全部分类</span>';
    categories.forEach(function(c) {
      html += '<span class="filter-tag" data-cid="' + c.id + '">' + Utils.escapeHtml(c.name) + '</span>';
    });
    filterEl.innerHTML = html;

    // Bind filter clicks
    filterEl.querySelectorAll('.filter-tag').forEach(function(el) {
      el.addEventListener('click', function() {
        filterEl.querySelectorAll('.filter-tag').forEach(function(t) { t.classList.remove('active'); });
        el.classList.add('active');
        searchCategoryId = el.getAttribute('data-cid') || null;
        loadBooks();
      });
    });
  }

  function loadBooks() {
    var loadingEl = document.getElementById('bookLoading');
    if (loadingEl) loadingEl.style.display = 'flex';

    var promise;
    if (searchKeyword || searchCategoryId) {
      promise = API.searchBooks({
        keyword: searchKeyword || null,
        categoryId: searchCategoryId
      });
    } else {
      promise = API.getBooks();
    }

    promise
      .then(function(res) {
        if (res.code === 200) {
          books = res.data;
          renderBooks();
          loadFavoriteStatus();
        }
      })
      .catch(function() {
        document.getElementById('bookList').innerHTML =
          '<div class="empty-state"><div class="empty-icon">📭</div><div class="empty-text">加载失败，请下拉刷新</div></div>';
      })
      .finally(function() {
        if (loadingEl) loadingEl.style.display = 'none';
      });
  }

  function renderBooks() {
    var listEl = document.getElementById('bookList');
    if (!listEl) return;

    if (books.length === 0) {
      listEl.innerHTML = '<div class="empty-state"><div class="empty-icon">📭</div><div class="empty-text">暂无图书</div></div>';
      return;
    }

    var html = '<div class="book-grid">';
    books.forEach(function(book) {
      var isFav = favoriteMap[book.id];
      var coverHtml = book.coverUrl
        ? '<img src="' + Utils.escapeHtml(Utils.resolveImageUrl(book.coverUrl)) + '" alt="封面" />'
        : '<div class="cover-placeholder">📖</div>';
      var badgeHtml = book.available <= 0
        ? '<span class="book-badge" style="background:#f56c6c">已借完</span>'
        : '';

      html +=
        '<div class="book-card" data-book-id="' + book.id + '">' +
          '<div class="book-cover">' + coverHtml + badgeHtml + '</div>' +
          '<div class="book-info">' +
            '<div class="book-title">' + Utils.escapeHtml(book.title) + '</div>' +
            '<div class="book-author">' + Utils.escapeHtml(book.author) + '</div>' +
            '<div class="book-stock">库存 ' + (book.available ?? '-') + '/' + (book.quantity ?? '-') + '</div>' +
            '<div class="book-actions">' +
              (Store.isLoggedIn() && book.available > 0
                ? '<button class="btn btn-primary btn-sm borrow-btn" data-book-id="' + book.id + '">借阅</button>'
                : '') +
              (Store.isAdminOrLibrarian()
                ? '<button class="btn btn-outlined btn-sm edit-btn" data-book-id="' + book.id + '" style="margin-left:4px">编辑</button>'
                : '') +
              (Store.isLoggedIn()
                ? '<button class="btn btn-sm ' + (isFav ? 'btn-warning' : 'btn-outlined') + ' fav-btn" data-book-id="' + book.id + '">' +
                  (isFav ? '❤️' : '♡') + '</button>'
                : '') +
            '</div>' +
          '</div>' +
        '</div>';
    });
    html += '</div>';
    listEl.innerHTML = html;

    // Bind card click - show detail
    listEl.querySelectorAll('.book-card').forEach(function(card) {
      card.addEventListener('click', function(e) {
        // Don't trigger if clicking buttons
        if (e.target.closest('.borrow-btn') || e.target.closest('.fav-btn')) return;
        var id = parseInt(card.getAttribute('data-book-id'));
        var book = books.find(function(b) { return b.id === id; });
        if (book) showDetail(book);
      });
    });

    // Bind borrow buttons
    listEl.querySelectorAll('.borrow-btn').forEach(function(btn) {
      btn.addEventListener('click', function(e) {
        e.stopPropagation();
        var id = parseInt(btn.getAttribute('data-book-id'));
        var book = books.find(function(b) { return b.id === id; });
        if (book) handleBorrow(book);
      });
    });

    // Bind fav buttons
    listEl.querySelectorAll('.fav-btn').forEach(function(btn) {
      btn.addEventListener('click', function(e) {
        e.stopPropagation();
        var id = parseInt(btn.getAttribute('data-book-id'));
        var book = books.find(function(b) { return b.id === id; });
        if (book) handleToggleFav(book);
      });
    });

    // Bind edit buttons
    listEl.querySelectorAll('.edit-btn').forEach(function(btn) {
      btn.addEventListener('click', function(e) {
        e.stopPropagation();
        var id = parseInt(btn.getAttribute('data-book-id'));
        Router.navigate('book-form', { id: id });
      });
    });
  }

  function loadFavoriteStatus() {
    if (!Store.isLoggedIn()) return;
    var userId = Store.getUserId();
    books.forEach(function(book) {
      API.checkFavorited(userId, book.id)
        .then(function(res) {
          if (res.code === 200) {
            favoriteMap[book.id] = res.data;
          }
        })
        .catch(function() {});
    });
  }

  function handleSearch() {
    searchKeyword = document.getElementById('bookSearchInput').value.trim();
    loadBooks();
  }

  function handleBorrow(book) {
    if (!Store.isLoggedIn()) {
      Utils.showToast('请先登录');
      Router.navigate('login');
      return;
    }
    Utils.showConfirm('确认借阅《' + book.title + '》？借阅期限为 30 天。', '确认借阅', function(confirmed) {
      if (!confirmed) return;
      API.borrowBook(Store.getUserId(), book.id)
        .then(function(res) {
          if (res.code === 200) {
            Utils.showToast('借阅成功！请按时归还。');
            loadBooks();
          } else {
            Utils.showToast(res.message || '借阅失败');
          }
        })
        .catch(function(err) {
          Utils.showToast(err.message || '借阅失败');
        });
    });
  }

  function handleToggleFav(book) {
    if (!Store.isLoggedIn()) {
      Utils.showToast('请先登录');
      Router.navigate('login');
      return;
    }
    var userId = Store.getUserId();
    var isFav = favoriteMap[book.id];

    if (isFav) {
      API.removeFavorite(userId, book.id)
        .then(function(res) {
          if (res.code === 200) {
            favoriteMap[book.id] = false;
            renderBooks();
            Utils.showToast('已取消收藏');
          }
        })
        .catch(function() { Utils.showToast('操作失败'); });
    } else {
      API.addFavorite(userId, book.id)
        .then(function(res) {
          if (res.code === 200) {
            favoriteMap[book.id] = true;
            renderBooks();
            Utils.showToast('收藏成功');
          }
        })
        .catch(function() { Utils.showToast('操作失败'); });
    }
  }

  function showDetail(book) {
    selectedBook = book;
    var modal = document.getElementById('bookDetailModal');
    var body = document.getElementById('bookDetailBody');

    var coverHtml = book.coverUrl
      ? '<img src="' + Utils.escapeHtml(Utils.resolveImageUrl(book.coverUrl)) + '" alt="封面" />'
      : '<div class="placeholder">📖</div>';
    var isFav = favoriteMap[book.id];

    body.innerHTML =
      '<div class="detail-cover-wrap">' +
        '<div class="detail-cover">' + coverHtml + '</div>' +
      '</div>' +
      '<div class="detail-info">' +
        '<div class="detail-row"><b>书名：</b>' + Utils.escapeHtml(book.title) + '</div>' +
        '<div class="detail-row"><b>作者：</b>' + Utils.escapeHtml(book.author) + '</div>' +
        '<div class="detail-row"><b>ISBN：</b>' + Utils.escapeHtml(book.isbn || '无') + '</div>' +
        '<div class="detail-row"><b>出版社：</b>' + Utils.escapeHtml(book.publisher || '无') + '</div>' +
        '<div class="detail-row"><b>分类：</b>' + Utils.escapeHtml(book.category?.name || '未分类') + '</div>' +
        '<div class="detail-row"><b>库存：</b>' + (book.available ?? '-') + ' / ' + (book.quantity ?? '-') + '</div>' +
        (book.description ? '<div class="detail-row"><b>简介：</b>' + Utils.escapeHtml(book.description) + '</div>' : '') +
        '<div class="detail-actions">' +
          (Store.isLoggedIn() && book.available > 0
            ? '<button class="btn btn-primary" id="detailBorrowBtn">借阅此书</button>'
            : '') +
          (Store.isAdminOrLibrarian()
            ? '<button class="btn btn-outlined" id="detailEditBtn">编辑图书</button>'
            : '') +
          (Store.isLoggedIn()
            ? '<button class="btn ' + (isFav ? 'btn-warning' : 'btn-outlined') + '" id="detailFavBtn">' +
              (isFav ? '❤️ 取消收藏' : '♡ 收藏此书') + '</button>'
            : '') +
        '</div>' +
      '</div>';

    modal.style.display = 'flex';

    // Bind detail buttons
    var borrowBtn = document.getElementById('detailBorrowBtn');
    if (borrowBtn) {
      borrowBtn.addEventListener('click', function() {
        modal.style.display = 'none';
        handleBorrow(book);
      });
    }
    var editBtn = document.getElementById('detailEditBtn');
    if (editBtn) {
      editBtn.addEventListener('click', function() {
        modal.style.display = 'none';
        Router.navigate('book-form', { id: book.id });
      });
    }
    var favBtn = document.getElementById('detailFavBtn');
    if (favBtn) {
      favBtn.addEventListener('click', function() {
        handleToggleFav(book);
        modal.style.display = 'none';
      });
    }

    // Close on overlay click
    modal.addEventListener('click', function(e) {
      if (e.target === modal) modal.style.display = 'none';
    });
  }

  function closeDetail() {
    var modal = document.getElementById('bookDetailModal');
    if (modal) modal.style.display = 'none';
  }

  return { init: init, closeDetail: closeDetail };
})();
