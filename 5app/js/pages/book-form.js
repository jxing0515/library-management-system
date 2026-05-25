/**
 * Book Form Page - Add / Edit Book
 */
var PageBookForm = (function() {
  var editId = null;
  var categories = [];
  var selectedFile = null;
  var originalAvailable = null; // 编辑时加载的原始可借数，用于兜底

  function init(params) {
    editId = params ? (params.id ? parseInt(params.id) : null) : null;

    // Update header title
    document.getElementById('headerTitle').textContent = editId ? '编辑图书' : '新增图书';

    render();
    loadCategories();
    if (editId) loadBook();
  }

  function render() {
    var html =
      '<div class="page book-form-page">' +
        '<div class="card">' +
          '<div class="cover-upload">' +
            '<div class="cover-preview" id="coverPreview">' +
              '<div class="upload-icon">📷</div>' +
              '<span>点击上传封面</span>' +
            '</div>' +
          '</div>' +
          '<div class="form-group">' +
            '<label class="form-label">书名 *</label>' +
            '<input class="form-input" id="bookTitle" placeholder="请输入书名" />' +
          '</div>' +
          '<div class="form-group">' +
            '<label class="form-label">作者 *</label>' +
            '<input class="form-input" id="bookAuthor" placeholder="请输入作者" />' +
          '</div>' +
          '<div class="form-group">' +
            '<label class="form-label">ISBN</label>' +
            '<input class="form-input" id="bookIsbn" placeholder="请输入ISBN" />' +
          '</div>' +
          '<div class="form-group">' +
            '<label class="form-label">出版社</label>' +
            '<input class="form-input" id="bookPublisher" placeholder="请输入出版社" />' +
          '</div>' +
          '<div class="form-group">' +
            '<label class="form-label">分类</label>' +
            '<select class="form-select" id="bookCategory"><option value="">请选择分类</option></select>' +
          '</div>' +
          '<div class="form-group">' +
            '<label class="form-label">库存数量 *</label>' +
            '<input class="form-input" id="bookQuantity" type="number" placeholder="请输入库存数量" />' +
          '</div>' +
          '<div class="form-group">' +
            '<label class="form-label">可借数量</label>' +
            '<input class="form-input" id="bookAvailable" type="number" placeholder="新增时默认为库存数量" />' +
            '<div style="font-size:11px;color:var(--md-on-surface-variant);margin-top:4px">修改库存后，可借数量会自动调整，一般无需手动修改</div>' +
          '</div>' +
          '<div class="form-group">' +
            '<label class="form-label">简介</label>' +
            '<textarea class="form-input" id="bookDescription" placeholder="请输入图书简介" rows="4"></textarea>' +
          '</div>' +
          '<button class="btn btn-primary btn-block btn-lg" id="saveBookBtn">保存</button>' +
        '</div>' +
      '</div>';

    document.getElementById('book-form-content').innerHTML = html;
    bindEvents();
  }

  function bindEvents() {
    document.getElementById('saveBookBtn').addEventListener('click', handleSave);

    // Cover upload
    document.getElementById('coverPreview').addEventListener('click', function() {
      // Use plus API if available
      if (typeof plus !== 'undefined' && plus.gallery) {
        plus.gallery.pick(function(e) {
          selectedFile = e;
          showCoverPreview(e);
        }, { filter: 'image' });
      } else {
        // Fallback: create file input
        var input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = function(e) {
          if (input.files && input.files[0]) {
            selectedFile = input.files[0];
            var reader = new FileReader();
            reader.onload = function(ev) {
              showCoverPreview(ev.target.result);
            };
            reader.readAsDataURL(input.files[0]);
          }
        };
        input.click();
      }
    });
  }

  function showCoverPreview(src) {
    var preview = document.getElementById('coverPreview');
    if (typeof src === 'string') {
      preview.innerHTML = '<img src="' + src + '" alt="封面预览" />';
    } else {
      // plus gallery returns a file path
      preview.innerHTML = '<img src="' + src + '" alt="封面预览" />';
    }
  }

  function loadCategories() {
    API.getCategories()
      .then(function(res) {
        if (res.code === 200) {
          categories = res.data;
          var select = document.getElementById('bookCategory');
          if (select) {
            var html = '<option value="">请选择分类</option>';
            categories.forEach(function(c) {
              html += '<option value="' + c.id + '">' + Utils.escapeHtml(c.name) + '</option>';
            });
            select.innerHTML = html;
          }
        }
      })
      .catch(function() {});
  }

  function loadBook() {
    if (!editId) return;
    API.getBook(editId)
      .then(function(res) {
        if (res.code === 200) {
          fillForm(res.data);
        }
      })
      .catch(function() {
        Utils.showToast('加载图书信息失败');
      });
  }

  function fillForm(book) {
    originalAvailable = book.available;
    document.getElementById('bookTitle').value = book.title || '';
    document.getElementById('bookAuthor').value = book.author || '';
    document.getElementById('bookIsbn').value = book.isbn || '';
    document.getElementById('bookPublisher').value = book.publisher || '';
    document.getElementById('bookQuantity').value = book.quantity || '';
    document.getElementById('bookAvailable').value = book.available ?? '';
    document.getElementById('bookDescription').value = book.description || '';

    if (book.category && book.category.id) {
      document.getElementById('bookCategory').value = book.category.id;
    }

    if (book.coverUrl) {
      var preview = document.getElementById('coverPreview');
      preview.innerHTML = '<img src="' + Utils.escapeHtml(Utils.resolveImageUrl(book.coverUrl)) + '" alt="封面" />';
    }
  }

  function handleSave() {
    var title = document.getElementById('bookTitle').value.trim();
    var author = document.getElementById('bookAuthor').value.trim();
    var isbn = document.getElementById('bookIsbn').value.trim();
    var publisher = document.getElementById('bookPublisher').value.trim();
    var categoryId = document.getElementById('bookCategory').value;
    var quantity = parseInt(document.getElementById('bookQuantity').value);
    var availableInput = document.getElementById('bookAvailable').value;
    var description = document.getElementById('bookDescription').value.trim();

    if (!title) { Utils.showToast('请输入书名'); return; }
    if (!author) { Utils.showToast('请输入作者'); return; }
    if (!quantity || quantity < 0) { Utils.showToast('请输入有效的库存数量'); return; }

    var data = {
      title: title,
      author: author,
      isbn: isbn || null,
      publisher: publisher || null,
      category: categoryId ? { id: parseInt(categoryId) } : null,
      quantity: quantity,
      description: description || null
    };
    // 新增：可借 = 库存；编辑：用表单值，留空则保留原始加载值（防止 Jackson 反序列化为 0）
    if (!editId) {
      data.available = quantity;
    } else {
      data.available = availableInput !== '' ? parseInt(availableInput) : originalAvailable;
    }

    var btn = document.getElementById('saveBookBtn');
    btn.disabled = true;
    btn.textContent = '保存中...';

    var promise = editId
      ? API.updateBook(editId, data)
      : API.createBook(data);

    promise
      .then(function(res) {
        if (res.code === 200) {
          var bookId = editId || (res.data && res.data.id);
          Utils.showToast(editId ? '更新成功' : '创建成功');

          // Upload cover if selected
          if (selectedFile && bookId) {
            API.uploadCover(bookId, selectedFile)
              .then(function() {})
              .catch(function() {});
          }

          Router.navigate('books');
        } else {
          Utils.showToast(res.message || '保存失败');
        }
      })
      .catch(function(err) {
        Utils.showToast(err.message || '保存失败，请稍后重试');
      })
      .finally(function() {
        btn.disabled = false;
        btn.textContent = '保存';
      });
  }

  return { init: init };
})();
