/**
 * Users Management Page (Admin only)
 */
var PageUsers = (function() {
  var users = [];
  var selectedUser = null;
  var showForm = false;
  var editUserId = null;

  function init() {
    render();
    loadUsers();
  }

  function render() {
    var html =
      '<div class="page manage-page">' +
        '<div class="page-header">' +
          '<h2 class="page-title">用户管理</h2>' +
          '<button class="btn btn-primary btn-sm" id="addUserBtn">+ 新增</button>' +
        '</div>' +
        '<div id="userList">' +
          '<div class="loading-overlay"><div class="loading-spinner"></div>加载中...</div>' +
        '</div>' +
      '</div>' +
      // User Form Modal
      '<div class="modal-overlay" id="userFormModal" style="display:none">' +
        '<div class="modal-box">' +
          '<div class="modal-header" id="userFormTitle">新增用户</div>' +
          '<div class="modal-body">' +
            '<div class="form-group">' +
              '<label class="form-label">用户名 *</label>' +
              '<input class="form-input" id="userFormUsername" placeholder="请输入用户名" />' +
            '</div>' +
            '<div class="form-group">' +
              '<label class="form-label">显示名称</label>' +
              '<input class="form-input" id="userFormDisplayName" placeholder="请输入显示名称" />' +
            '</div>' +
            '<div class="form-group">' +
              '<label class="form-label">密码' + (editUserId ? '（留空不修改）' : ' *') + '</label>' +
              '<input class="form-input" id="userFormPassword" type="password" placeholder="请输入密码" />' +
            '</div>' +
            '<div class="form-group">' +
              '<label class="form-label">角色</label>' +
              '<select class="form-select" id="userFormRole">' +
                '<option value="READER">读者</option>' +
                '<option value="LIBRARIAN">图书管理员</option>' +
                '<option value="ADMIN">系统管理员</option>' +
              '</select>' +
            '</div>' +
            '<div class="form-group">' +
              '<label class="form-label">邮箱</label>' +
              '<input class="form-input" id="userFormEmail" type="email" placeholder="请输入邮箱" />' +
            '</div>' +
            '<div class="form-group">' +
              '<label class="form-label">手机号</label>' +
              '<input class="form-input" id="userFormPhone" type="tel" placeholder="请输入手机号" />' +
            '</div>' +
          '</div>' +
          '<div class="modal-footer">' +
            '<div class="modal-btn" onclick="PageUsers.closeForm()">取消</div>' +
            '<div class="modal-btn primary" id="userFormSaveBtn">保存</div>' +
          '</div>' +
        '</div>' +
      '</div>' +
      // User Detail Modal
      '<div class="modal-overlay" id="userDetailModal" style="display:none">' +
        '<div class="modal-box user-detail-modal">' +
          '<div class="modal-header">用户详情</div>' +
          '<div class="modal-body" id="userDetailBody"></div>' +
          '<div class="modal-footer">' +
            '<div class="modal-btn" onclick="PageUsers.closeDetail()">关闭</div>' +
          '</div>' +
        '</div>' +
      '</div>';

    document.getElementById('users-content').innerHTML = html;
    bindEvents();
  }

  function bindEvents() {
    document.getElementById('addUserBtn').addEventListener('click', function() {
      editUserId = null;
      showUserForm(null);
    });

    document.getElementById('userFormSaveBtn').addEventListener('click', handleSaveUser);
  }

  function loadUsers() {
    API.getUsers()
      .then(function(res) {
        if (res.code === 200) {
          users = res.data;
          renderUsers();
        }
      })
      .catch(function() {
        document.getElementById('userList').innerHTML =
          '<div class="empty-state"><div class="empty-icon">📭</div><div class="empty-text">加载失败</div></div>';
      });
  }

  function renderUsers() {
    var listEl = document.getElementById('userList');
    if (!listEl) return;

    if (users.length === 0) {
      listEl.innerHTML = '<div class="empty-state"><div class="empty-icon">📭</div><div class="empty-text">暂无用户</div></div>';
      return;
    }

    var html = '<div class="card">';
    users.forEach(function(u) {
      var roleCls = Utils.roleClass(u.role);
      var roleLabel = Utils.roleLabel(u.role);

      html +=
        '<div class="list-item" data-id="' + u.id + '" style="cursor:pointer">' +
          '<div class="item-content">' +
            '<div class="item-title">' + Utils.escapeHtml(u.displayName || u.username) + '</div>' +
            '<div class="item-desc">@' + Utils.escapeHtml(u.username) + '</div>' +
          '</div>' +
          '<div class="item-right">' +
            '<span class="tag ' + roleCls + '">' + roleLabel + '</span>' +
          '</div>' +
        '</div>';
    });
    html += '</div>';
    listEl.innerHTML = html;

    // Bind click
    listEl.querySelectorAll('.list-item[data-id]').forEach(function(item) {
      item.addEventListener('click', function() {
        var id = parseInt(item.getAttribute('data-id'));
        var user = users.find(function(u) { return u.id === id; });
        if (user) showUserDetail(user);
      });
    });
  }

  function showUserDetail(user) {
    selectedUser = user;
    var modal = document.getElementById('userDetailModal');
    var body = document.getElementById('userDetailBody');

    var roleCls = Utils.roleClass(user.role);
    var roleLabel = Utils.roleLabel(user.role);

    body.innerHTML =
      '<div class="detail-row"><span class="detail-label">用户名</span><span class="detail-value">' + Utils.escapeHtml(user.username) + '</span></div>' +
      '<div class="detail-row"><span class="detail-label">显示名称</span><span class="detail-value">' + Utils.escapeHtml(user.displayName || '-') + '</span></div>' +
      '<div class="detail-row"><span class="detail-label">角色</span><span class="detail-value"><span class="tag ' + roleCls + '">' + roleLabel + '</span></span></div>' +
      '<div class="detail-row"><span class="detail-label">邮箱</span><span class="detail-value">' + Utils.escapeHtml(user.email || '-') + '</span></div>' +
      '<div class="detail-row"><span class="detail-label">手机</span><span class="detail-value">' + Utils.escapeHtml(user.phone || '-') + '</span></div>' +
      (user.createdAt ? '<div class="detail-row"><span class="detail-label">注册时间</span><span class="detail-value">' + Utils.formatDate(user.createdAt) + '</span></div>' : '') +
      '<div style="display:flex;gap:8px;margin-top:12px">' +
        '<button class="btn btn-primary btn-sm" id="userEditFromDetailBtn">编辑</button>' +
        '<button class="btn btn-danger btn-sm" id="userDeleteFromDetailBtn">删除</button>' +
      '</div>';

    modal.style.display = 'flex';

    document.getElementById('userEditFromDetailBtn').addEventListener('click', function() {
      modal.style.display = 'none';
      editUserId = user.id;
      showUserForm(user);
    });

    document.getElementById('userDeleteFromDetailBtn').addEventListener('click', function() {
      modal.style.display = 'none';
      handleDeleteUser(user);
    });

    modal.addEventListener('click', function(e) {
      if (e.target === modal) modal.style.display = 'none';
    });
  }

  function closeDetail() {
    document.getElementById('userDetailModal').style.display = 'none';
  }

  function showUserForm(user) {
    var modal = document.getElementById('userFormModal');
    var title = document.getElementById('userFormTitle');

    if (user) {
      title.textContent = '编辑用户';
      document.getElementById('userFormUsername').value = user.username || '';
      document.getElementById('userFormDisplayName').value = user.displayName || '';
      document.getElementById('userFormPassword').value = '';
      document.getElementById('userFormRole').value = user.role || 'READER';
      document.getElementById('userFormEmail').value = user.email || '';
      document.getElementById('userFormPhone').value = user.phone || '';
    } else {
      title.textContent = '新增用户';
      document.getElementById('userFormUsername').value = '';
      document.getElementById('userFormDisplayName').value = '';
      document.getElementById('userFormPassword').value = '';
      document.getElementById('userFormRole').value = 'READER';
      document.getElementById('userFormEmail').value = '';
      document.getElementById('userFormPhone').value = '';
    }

    modal.style.display = 'flex';
    modal.addEventListener('click', function(e) {
      if (e.target === modal) closeForm();
    });
  }

  function closeForm() {
    document.getElementById('userFormModal').style.display = 'none';
  }

  function handleSaveUser() {
    var username = document.getElementById('userFormUsername').value.trim();
    var displayName = document.getElementById('userFormDisplayName').value.trim();
    var password = document.getElementById('userFormPassword').value;
    var role = document.getElementById('userFormRole').value;
    var email = document.getElementById('userFormEmail').value.trim();
    var phone = document.getElementById('userFormPhone').value.trim();

    if (!username) { Utils.showToast('请输入用户名'); return; }
    if (!editUserId && !password) { Utils.showToast('请输入密码'); return; }

    var data = {
      username: username,
      displayName: displayName || undefined,
      role: role,
      email: email || undefined,
      phone: phone || undefined
    };
    if (password) data.password = password;

    var btn = document.getElementById('userFormSaveBtn');
    btn.textContent = '保存中...';
    btn.style.pointerEvents = 'none';

    var promise = editUserId
      ? API.updateUser(editUserId, data)
      : API.createUser(data);

    promise
      .then(function(res) {
        if (res.code === 200) {
          Utils.showToast(editUserId ? '更新成功' : '创建成功');
          closeForm();
          loadUsers();
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

  function handleDeleteUser(user) {
    Utils.showConfirm('确认删除用户 "' + (user.displayName || user.username) + '"？此操作不可恢复。', '删除确认', function(confirmed) {
      if (!confirmed) return;
      API.deleteUser(user.id)
        .then(function(res) {
          if (res.code === 200) {
            Utils.showToast('删除成功');
            loadUsers();
          } else {
            Utils.showToast(res.message || '删除失败');
          }
        })
        .catch(function(err) {
          Utils.showToast(err.message || '删除失败');
        });
    });
  }

  return { init: init, closeDetail: closeDetail, closeForm: closeForm };
})();
