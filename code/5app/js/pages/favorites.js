/**
 * Favorites Page
 */
var PageFavorites = (function() {
  var favorites = [];

  function init() {
    render();
    loadFavorites();
  }

  function render() {
    var html =
      '<div class="page">' +
        '<div class="page-header">' +
          '<h2 class="page-title">我的收藏</h2>' +
        '</div>' +
        '<div id="favoritesList">' +
          '<div class="loading-overlay"><div class="loading-spinner"></div>加载中...</div>' +
        '</div>' +
      '</div>';

    document.getElementById('favorites-content').innerHTML = html;
  }

  function loadFavorites() {
    var userId = Store.getUserId();
    if (!userId) {
      Router.navigate('login');
      return;
    }

    API.getFavorites(userId)
      .then(function(res) {
        if (res.code === 200) {
          favorites = res.data;
          renderFavorites();
        }
      })
      .catch(function() {
        document.getElementById('favoritesList').innerHTML =
          '<div class="empty-state"><div class="empty-icon">📭</div><div class="empty-text">加载失败</div></div>';
      });
  }

  function renderFavorites() {
    var listEl = document.getElementById('favoritesList');
    if (!listEl) return;

    if (!favorites || favorites.length === 0) {
      listEl.innerHTML = '<div class="empty-state"><div class="empty-icon">❤️</div><div class="empty-text">暂无收藏</div><div class="mt-8"><button class="btn btn-primary btn-sm" onclick="Router.navigate(\'books\')">去浏览图书</button></div></div>';
      return;
    }

    var html = '';
    favorites.forEach(function(fav) {
      var book = fav.book || fav;
      var coverHtml = book.coverUrl
        ? '<img src="' + Utils.escapeHtml(Utils.resolveImageUrl(book.coverUrl)) + '" alt="封面" />'
        : '<div class="cover-placeholder" style="font-size:40px;color:#c0c4cc">📖</div>';

      html +=
        '<div class="rec-card">' +
          '<div class="rec-cover">' + coverHtml + '</div>' +
          '<div class="rec-info">' +
            '<h4>' + Utils.escapeHtml(book.title) + '</h4>' +
            '<p>' + Utils.escapeHtml(book.author) + '</p>' +
            '<p>' + (book.isbn ? 'ISBN: ' + book.isbn : '') + '</p>' +
            '<div style="margin-top:8px">' +
              '<button class="btn btn-sm btn-danger remove-fav-btn" data-favid="' + fav.id + '" data-bookid="' + book.id + '">取消收藏</button>' +
            '</div>' +
          '</div>' +
        '</div>';
    });

    listEl.innerHTML = html;

    // Bind remove
    listEl.querySelectorAll('.remove-fav-btn').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var favId = btn.getAttribute('data-favid');
        var bookId = btn.getAttribute('data-bookid');
        handleRemove(favId, bookId);
      });
    });
  }

  function handleRemove(favId, bookId) {
    Utils.showConfirm('确认取消收藏？', '取消收藏', function(confirmed) {
      if (!confirmed) return;
      var userId = Store.getUserId();
      (bookId ? API.removeFavorite(userId, bookId) : Promise.resolve({ code: 500 }))
        .then(function(res) {
          if (res.code === 200) {
            Utils.showToast('已取消收藏');
            loadFavorites();
          } else {
            Utils.showToast(res.message || '操作失败');
          }
        })
        .catch(function(err) {
          Utils.showToast(err.message || '操作失败');
        });
    });
  }

  return { init: init };
})();
