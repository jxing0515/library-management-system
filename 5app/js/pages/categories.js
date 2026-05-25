/**
 * Categories Management Page (Admin only)
 */
var PageCategories = (function() {
  var categories = [];
  var editId = null;

  function init() {
    render();
    loadCategories();
  }

  function render() {
    var html =
      '<div class="page manage-page">' +
        '<div class="page-header">' +
          '<h2 class="page-title">分类管理</h2>' +
          '<button class="btn btn-primary btn-sm" id="addCategoryBtn">+ 新增</button>' +
        '</div>' +
        '<div id="categoryList">' +
          '<div class="loading-overlay"><div class="loading-spinner"></div>加载中...</div>' +
        '</div>' +
      '</div>' +
      '<div class="modal-overlay" id="categoryFormModal" style="display:none">' +
        '<div class="modal-box">' +
          '<div class="modal-header" id="categoryFormTitle">新增分类</div>' +
          '<div class="modal-body">' +
            '<div class="form-group">' +
              '<label class="form-label">分类名称 *</label>' +
              '<input class="form-input" id="categoryFormName" placeholder="请输入分类名称" />' +
            '</div>' +
            '<div class="form-group">' +
              '<label class="form-label">描述</label>' +
              '<input class="form-input" id="categoryFormDesc" placeholder="请输入描述（选填）" />' +
            '</div>' +
          '</div>' +
          '<div class="modal-footer">' +
            '<div class="modal-btn" onclick="PageCategories.closeForm()">取消</div>' +
            '<div class="modal-btn primary" id="categoryFormSaveBtn">保存</div>' +
          '</div>' +
        '</div>' +
      '</div>';

    document.getElementById('categories-content').innerHTML = html;
    bindEvents();
  }

  function bindEvents() {
    document.getElementById('addCategoryBtn').addEventListener('click', function() {
      editId = null;
      document.getElementById('categoryFormTitle').textContent = '新增分类';
      document.getElementById('categoryFormName').value = '';
      document.getElementById('categoryFormDesc').value = '';
      document.getElementById('categoryFormModal').style.display = 'flex';
    });

    document.getElementById('categoryFormSaveBtn').addEventListener('click', handleSave);
  }

  function loadCategories() {
    API.getCategories()
      .then(function(res) {
        if (res.code === 200) {
          categories = res.data;
          renderCategories();
        }
      })
      .catch(function() {
        document.getElementById('categoryList').innerHTML =
          '<div class="empty-state"><div class="empty-icon">📭</div><div class="empty-text">加载失败</div></div>';
      });
  }

  function renderCategories() {
    var listEl = document.getElementById('categoryList');
    if (!listEl) return;

    if (categories.length === 0) {
      listEl.innerHTML = '<div class="empty-state"><div class="empty-icon">📭</div><div class="empty-text">暂无分类</div></div>';
      return;
    }

    var html = '<div class="card">';
    categories.forEach(function(c) {
      html +=
        '<div class="list-item">' +
          '<div class="item-content">' +
            '<div class="item-title">' + Utils.escapeHtml(c.name) + '</div>' +
            '<div class="item-desc">' + Utils.escapeHtml(c.description || '无描述') + '</div>' +
          '</div>' +
          '<div class="item-actions">' +
            '<button class="btn-text edit-cat" data-id="' + c.id + '">编辑</button>' +
            '<button class="btn-text danger delete-cat" data-id="' + c.id + '">删除</button>' +
          '</div>' +
        '</div>';
    });
    html += '</div>';
    listEl.innerHTML = html;

    // Bind edit
    listEl.querySelectorAll('.edit-cat').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var id = parseInt(btn.getAttribute('data-id'));
        var cat = categories.find(function(c) { return c.id === id; });
        if (cat) {
          editId = cat.id;
          document.getElementById('categoryFormTitle').textContent = '编辑分类';
          document.getElementById('categoryFormName').value = cat.name || '';
          document.getElementById('categoryFormDesc').value = cat.description || '';
          document.getElementById('categoryFormModal').style.display = 'flex';
        }
      });
    });

    // Bind delete
    listEl.querySelectorAll('.delete-cat').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var id = parseInt(btn.getAttribute('data-id'));
        var cat = categories.find(function(c) { return c.id === id; });
        if (cat) handleDelete(cat);
      });
    });
  }

  function closeForm() {
    document.getElementById('categoryFormModal').style.display = 'none';
  }

  function handleSave() {
    var name = document.getElementById('categoryFormName').value.trim();
    var description = document.getElementById('categoryFormDesc').value.trim();

    if (!name) { Utils.showToast('请输入分类名称'); return; }

    var data = {
      name: name,
      description: description || undefined
    };

    var btn = document.getElementById('categoryFormSaveBtn');
    btn.textContent = '保存中...';
    btn.style.pointerEvents = 'none';

    var promise = editId
      ? API.updateCategory(editId, data)
      : API.createCategory(data);

    promise
      .then(function(res) {
        if (res.code === 200) {
          Utils.showToast(editId ? '更新成功' : '创建成功');
          closeForm();
          loadCategories();
        } else {
          Utils.showToast(res.message || '操作失败');
        }
      })
      .catch(function(err) {
        Utils.showToast(err.message || '操作失败');
      })
      .finally(function() {
        btn.textContent = '保存';
        btn.style.pointerEvents = '';
      });
  }

  function handleDelete(cat) {
    Utils.showConfirm('确认删除分类 "' + cat.name + '"？', '删除确认', function(confirmed) {
      if (!confirmed) return;
      API.deleteCategory(cat.id)
        .then(function(res) {
          if (res.code === 200) {
            Utils.showToast('删除成功');
            loadCategories();
          } else {
            Utils.showToast(res.message || '删除失败');
          }
        })
        .catch(function(err) {
          Utils.showToast(err.message || '删除失败');
        });
    });
  }

  return { init: init, closeForm: closeForm };
})();
