/**
 * Profile Page - Personal Center / Avatar / Settings / Logout
 */
var PageProfile = (function() {

  function init() {
    if (!Store.isLoggedIn()) {
      Router.navigate('login');
      return;
    }
    render();
    bindEvents();
  }

  function render() {
    var user = Store.getUser();
    if (!user) return;

    var avatarHtml = user.avatar
      ? '<img src="' + Utils.escapeHtml(Utils.resolveImageUrl(user.avatar)) + '" alt="头像" />'
      : '<div class="avatar-placeholder">' + (Store.getDisplayName().charAt(0) || 'U') + '</div>';

    var html =
      '<div class="page profile-page">' +
        '<div class="profile-header">' +
          '<div class="avatar-wrap" id="avatarWrap">' +
            avatarHtml +
          '</div>' +
          '<div class="profile-name">' + Utils.escapeHtml(Store.getDisplayName()) + '</div>' +
          '<div class="profile-role">' +
            '<span class="tag ' + Utils.roleClass(user.role) + '">' + Utils.roleLabel(user.role) + '</span>' +
          '</div>' +
        '</div>' +

        '<div class="card">' +
          '<div class="setting-item" onclick="PageProfile.showEditName()">' +
            '<span class="setting-label">显示名称</span>' +
            '<span class="setting-value">' + Utils.escapeHtml(user.displayName || '未设置') + '</span>' +
          '</div>' +
          '<div class="setting-item">' +
            '<span class="setting-label">用户名</span>' +
            '<span class="setting-value">' + Utils.escapeHtml(user.username) + '</span>' +
          '</div>' +
          '<div class="setting-item">' +
            '<span class="setting-label">邮箱</span>' +
            '<span class="setting-value">' + Utils.escapeHtml(user.email || '未设置') + '</span>' +
          '</div>' +
          '<div class="setting-item">' +
            '<span class="setting-label">手机号</span>' +
            '<span class="setting-value">' + Utils.escapeHtml(user.phone || '未设置') + '</span>' +
          '</div>' +
          '<div class="setting-item" onclick="Router.navigate(\'favorites\')">' +
            '<span class="setting-label">我的收藏</span>' +
            '<span class="setting-value">→</span>' +
          '</div>' +
          '<div class="setting-item" onclick="Router.navigate(\'recommendations\')">' +
            '<span class="setting-label">智能推荐</span>' +
            '<span class="setting-value">→</span>' +
          '</div>' +
        '</div>' +

        '<div class="card theme-section">' +
          '<div class="section-label">主题风格</div>' +
          '<div class="theme-grid" id="themeGrid">' +
            '<span class="theme-chip" data-theme="m3"><span class="theme-dot" style="background:#1976d2"></span>🎨 M3</span>' +
            '<span class="theme-chip" data-theme="element"><span class="theme-dot" style="background:#409eff"></span>🖥 Element</span>' +
            '<span class="theme-chip" data-theme="glass"><span class="theme-dot" style="background:#7c4dff"></span>💎 玻璃态</span>' +
            '<span class="theme-chip" data-theme="miui"><span class="theme-dot" style="background:#ff6900"></span>📱 MIUI X</span>' +
          '</div>' +
          '<div class="dark-toggle-row">' +
            '<span class="dark-toggle-label">深色模式</span>' +
            '<label class="m3-switch">' +
              '<input type="checkbox" id="darkModeSwitch"' + (localStorage.getItem('darkMode') === 'true' ? ' checked' : '') + ' />' +
              '<span class="track"><span class="thumb"></span></span>' +
            '</label>' +
          '</div>' +
        '</div>' +

        '<div class="logout-btn" id="logoutBtn">退出登录</div>' +
      '</div>' +

      // Action Sheet for avatar
      '<div class="action-sheet-overlay" id="avatarActionSheet" style="display:none"></div>' +
      '<div class="action-sheet" id="avatarActionSheetPanel" style="display:none">' +
        '<div class="sheet-item" id="avatarCamera">📷 拍照</div>' +
        '<div class="sheet-item" id="avatarGallery">🖼️ 从相册选择</div>' +
        '<div class="sheet-cancel" id="avatarCancel">取消</div>' +
      '</div>' +

      // Edit name modal
      '<div class="modal-overlay" id="editNameModal" style="display:none">' +
        '<div class="modal-box">' +
          '<div class="modal-header">修改显示名称</div>' +
          '<div class="modal-body">' +
            '<div class="form-group">' +
              '<input class="form-input" id="editNameInput" placeholder="请输入新的显示名称" value="' + Utils.escapeHtml(user.displayName || '') + '" />' +
            '</div>' +
          '</div>' +
          '<div class="modal-footer">' +
            '<div class="modal-btn" onclick="PageProfile.closeEditName()">取消</div>' +
            '<div class="modal-btn primary" id="editNameSaveBtn">保存</div>' +
          '</div>' +
        '</div>' +
      '</div>';

    document.getElementById('profile-content').innerHTML = html;
  }

  function bindEvents() {
    // Avatar click
    document.getElementById('avatarWrap').addEventListener('click', showAvatarSheet);

    // Logout
    document.getElementById('logoutBtn').addEventListener('click', function() {
      Utils.showConfirm('确认退出登录？', '退出确认', function(confirmed) {
        if (confirmed) {
          Store.clear();
          Utils.showToast('已退出');
          Router.clearHistory();
          Router.navigate('login');
        }
      });
    });

    // Edit name save
    document.getElementById('editNameSaveBtn').addEventListener('click', saveName);
    document.getElementById('editNameInput').addEventListener('keydown', function(e) {
      if (e.key === 'Enter') saveName();
    });

    // Theme selection
    var currentTheme = localStorage.getItem('theme') || 'm3';
    document.getElementById('themeGrid').querySelectorAll('.theme-chip').forEach(function(chip) {
      var t = chip.getAttribute('data-theme');
      if (t === currentTheme) chip.classList.add('active');
      chip.addEventListener('click', function() {
        var theme = chip.getAttribute('data-theme');
        document.getElementById('themeGrid').querySelectorAll('.theme-chip').forEach(function(c) { c.classList.remove('active'); });
        chip.classList.add('active');
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
      });
    });

    // Dark mode toggle
    var darkSwitch = document.getElementById('darkModeSwitch');
    if (darkSwitch) {
      darkSwitch.addEventListener('change', function() {
        if (darkSwitch.checked) {
          document.documentElement.classList.add('dark-mode');
          localStorage.setItem('darkMode', 'true');
        } else {
          document.documentElement.classList.remove('dark-mode');
          localStorage.setItem('darkMode', 'false');
        }
      });
    }
  }

  // ============================================================
  // Avatar
  // ============================================================
  function showAvatarSheet() {
    document.getElementById('avatarActionSheet').style.display = 'block';
    document.getElementById('avatarActionSheetPanel').style.display = 'block';

    var overlay = document.getElementById('avatarActionSheet');
    var panel = document.getElementById('avatarActionSheetPanel');

    // Camera
    document.getElementById('avatarCamera').addEventListener('click', function() {
      hideAvatarSheet();
      pickAvatar('camera');
    });

    // Gallery
    document.getElementById('avatarGallery').addEventListener('click', function() {
      hideAvatarSheet();
      pickAvatar('gallery');
    });

    // Cancel
    document.getElementById('avatarCancel').addEventListener('click', hideAvatarSheet);
    overlay.addEventListener('click', hideAvatarSheet);
  }

  function hideAvatarSheet() {
    document.getElementById('avatarActionSheet').style.display = 'none';
    document.getElementById('avatarActionSheetPanel').style.display = 'none';
  }

  function pickAvatar(source) {
    if (typeof plus !== 'undefined') {
      try {
        if (source === 'camera' && plus.camera) {
          plus.camera.getCamera().captureImage(function(path) {
            uploadAvatarFile(path);
          }, { filename: '_doc/upload/' });
        } else if (source === 'gallery' && plus.gallery) {
          plus.gallery.pick(function(e) {
            uploadAvatarFile(e);
          }, { filter: 'image' });
        } else {
          fallbackPick();
        }
      } catch (e) {
        Utils.showToast('无法调用相机/相册');
        fallbackPick();
      }
    } else {
      fallbackPick();
    }
  }

  function fallbackPick() {
    var input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = function(e) {
      if (input.files && input.files[0]) {
        uploadAvatarFile(input.files[0]);
      }
    };
    input.click();
  }

  function uploadAvatarFile(file) {
    var userId = Store.getUserId();
    if (!userId) return;

    Utils.showToast('上传中...');

    API.uploadAvatar(userId, file)
      .then(function(res) {
        if (res.code === 200) {
          var avatarUrl = res.data;
          if (typeof avatarUrl === 'object' && avatarUrl.url) avatarUrl = avatarUrl.url;
          Store.setAvatar(avatarUrl);
          Utils.showToast('头像更新成功');
          render(); // Re-render profile
          bindEvents();
        } else {
          Utils.showToast(res.message || '上传失败');
        }
      })
      .catch(function(err) {
        Utils.showToast(err.message || '上传失败');
      });
  }

  // ============================================================
  // Edit Name
  // ============================================================
  function showEditName() {
    document.getElementById('editNameModal').style.display = 'flex';
    document.getElementById('editNameModal').addEventListener('click', function(e) {
      if (e.target === this) closeEditName();
    });
  }

  function closeEditName() {
    document.getElementById('editNameModal').style.display = 'none';
  }

  function saveName() {
    var newName = document.getElementById('editNameInput').value.trim();
    if (!newName) { Utils.showToast('请输入显示名称'); return; }

    var user = Store.getUser();
    API.updateUser(user.id, { displayName: newName })
      .then(function(res) {
        if (res.code === 200) {
          user.displayName = newName;
          Store.setUser(user, Store.getToken());
          Utils.showToast('更新成功');
          closeEditName();
          render();
          bindEvents();
        } else {
          Utils.showToast(res.message || '更新失败');
        }
      })
      .catch(function(err) {
        Utils.showToast(err.message || '更新失败');
      });
  }

  return { init: init, showEditName: showEditName, closeEditName: closeEditName };
})();
