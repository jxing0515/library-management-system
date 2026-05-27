/**
 * Login / Register Page
 */
var PageLogin = (function() {
  var tab = 'login'; // 'login' | 'register'

  function init() {
    render();
    bindEvents();
  }

  function render() {
    var html =
      '<div class="login-page">' +
        '<div class="login-header">' +
          '<div class="login-icon">📚</div>' +
          '<h1>智慧图书管理系统</h1>' +
          '<p>Smart Library Management System</p>' +
        '</div>' +
        '<div class="login-card">' +
          '<div class="tab-switch">' +
            '<span class="tab-item active" data-tab="login">登录</span>' +
            '<span class="tab-item" data-tab="register">读者注册</span>' +
          '</div>' +
          '<div id="loginFormWrap"></div>' +
          '<div class="dev-creds">' +
            '<button class="dev-btn" id="showCredsBtn">查看管理员测试账号</button>' +
          '</div>' +
        '</div>' +
      '</div>';

    document.getElementById('login-content').innerHTML = html;
    renderForm();
  }

  function renderForm() {
    if (tab === 'login') {
      document.getElementById('loginFormWrap').innerHTML =
        '<div class="login-form">' +
          '<div class="form-group">' +
            '<input class="form-input" id="loginUsername" type="text" placeholder="请输入用户名" autocomplete="username" />' +
          '</div>' +
          '<div class="form-group">' +
            '<input class="form-input" id="loginPassword" type="password" placeholder="请输入密码" autocomplete="current-password" />' +
          '</div>' +
          '<button class="btn btn-primary btn-block btn-lg submit-btn" id="loginBtn">登 录</button>' +
        '</div>';
    } else {
      document.getElementById('loginFormWrap').innerHTML =
        '<div class="login-form">' +
          '<div class="form-group">' +
            '<input class="form-input" id="regUsername" type="text" placeholder="请输入用户名" maxlength="50" />' +
          '</div>' +
          '<div class="form-group">' +
            '<input class="form-input" id="regDisplayName" type="text" placeholder="请输入显示名称（选填）" />' +
          '</div>' +
          '<div class="form-group">' +
            '<input class="form-input" id="regPassword" type="password" placeholder="请输入密码" />' +
          '</div>' +
          '<div class="form-group">' +
            '<input class="form-input" id="regConfirm" type="password" placeholder="请确认密码" />' +
          '</div>' +
          '<div class="form-group">' +
            '<input class="form-input" id="regEmail" type="email" placeholder="请输入邮箱（选填）" />' +
          '</div>' +
          '<div class="form-group">' +
            '<input class="form-input" id="regPhone" type="tel" placeholder="请输入手机号（选填）" />' +
          '</div>' +
          '<div class="contact-hint">📌 手机号或邮箱至少填写一项</div>' +
          '<button class="btn btn-primary btn-block btn-lg submit-btn" id="registerBtn">注 册</button>' +
        '</div>';
    }
    // Re-bind form events
    bindFormEvents();
  }

  function bindEvents() {
    var container = document.getElementById('login-content');

    // Tab switching via delegation
    container.addEventListener('click', function(e) {
      var tabEl = e.target.closest('[data-tab]');
      if (tabEl) {
        tab = tabEl.getAttribute('data-tab');
        document.querySelectorAll('[data-tab]').forEach(function(el) {
          el.classList.toggle('active', el.getAttribute('data-tab') === tab);
        });
        renderForm();
      }
    });

    // Show dev credentials
    document.getElementById('showCredsBtn').addEventListener('click', function() {
      Utils.showConfirm(
        '系统管理员测试账号\n\n账号：admin\n密码：admin123\n\n点击"确定"自动填入登录信息？',
        '管理员测试账号',
        function(confirmed) {
          if (confirmed) {
            document.getElementById('loginUsername').value = 'admin';
            document.getElementById('loginPassword').value = 'admin123';
            // Auto login after brief delay
            setTimeout(handleLogin, 300);
          }
        }
      );
    });

    bindFormEvents();
  }

  function bindFormEvents() {
    if (tab === 'login') {
      document.getElementById('loginBtn').addEventListener('click', handleLogin);
      // Enter key to submit
      document.getElementById('loginPassword').addEventListener('keydown', function(e) {
        if (e.key === 'Enter') handleLogin();
      });
    } else {
      document.getElementById('registerBtn').addEventListener('click', handleRegister);
    }
  }

  function handleLogin() {
    var username = document.getElementById('loginUsername').value.trim();
    var password = document.getElementById('loginPassword').value;

    if (!username) { Utils.showToast('请输入用户名'); return; }
    if (!password) { Utils.showToast('请输入密码'); return; }

    var btn = document.getElementById('loginBtn');
    btn.disabled = true;
    btn.textContent = '登录中...';

    API.login({ username: username, password: password })
      .then(function(res) {
        if (res.code === 200) {
          Store.setUser(res.data, res.data.token);
          Utils.showToast('登录成功');
          Router.navigate('dashboard');
        } else {
          Utils.showToast(res.message || '登录失败');
        }
      })
      .catch(function(err) {
        Utils.showToast(err.message || '网络错误，请稍后重试');
      })
      .finally(function() {
        btn.disabled = false;
        btn.textContent = '登 录';
      });
  }

  function handleRegister() {
    var username = document.getElementById('regUsername').value.trim();
    var displayName = document.getElementById('regDisplayName').value.trim();
    var password = document.getElementById('regPassword').value;
    var confirm = document.getElementById('regConfirm').value;
    var email = document.getElementById('regEmail').value.trim();
    var phone = document.getElementById('regPhone').value.trim();

    if (!username || username.length < 3) { Utils.showToast('用户名至少 3 个字符'); return; }
    if (!password || password.length < 6) { Utils.showToast('密码至少 6 位'); return; }
    if (password !== confirm) { Utils.showToast('两次输入的密码不一致'); return; }
    if (!email && !phone) { Utils.showToast('手机号或邮箱至少填写一项'); return; }
    if (email && email.indexOf('@') === -1) { Utils.showToast('请输入有效的邮箱地址'); return; }
    if (phone && !/^1\d{10}$/.test(phone)) { Utils.showToast('请输入有效的手机号（11位，以1开头）'); return; }

    var btn = document.getElementById('registerBtn');
    btn.disabled = true;
    btn.textContent = '注册中...';

    API.register({
      username: username,
      displayName: displayName || undefined,
      password: password,
      email: email || undefined,
      phone: phone || undefined
    })
      .then(function(res) {
        if (res.code === 200) {
          Store.setUser(res.data, res.data.token);
          Utils.showToast('注册成功');
          Router.navigate('dashboard');
        } else {
          Utils.showToast(res.message || '注册失败');
        }
      })
      .catch(function(err) {
        Utils.showToast(err.message || '网络错误，请稍后重试');
      })
      .finally(function() {
        btn.disabled = false;
        btn.textContent = '注 册';
      });
  }

  return { init: init };
})();
