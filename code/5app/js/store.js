/**
 * Simple State Management for User/Auth
 */

var Store = (function() {
  var user = null;
  var token = '';

  // Load from storage
  function init() {
    var saved = localStorage.getItem('library_user');
    var savedToken = localStorage.getItem('library_token');
    if (saved && savedToken) {
      try {
        user = JSON.parse(saved);
        token = savedToken;
      } catch (e) {
        clear();
      }
    }
  }

  function setUser(userData, userToken) {
    user = userData;
    token = userToken;
    localStorage.setItem('library_user', JSON.stringify(userData));
    localStorage.setItem('library_token', userToken);
  }

  function clear() {
    user = null;
    token = '';
    localStorage.removeItem('library_user');
    localStorage.removeItem('library_token');
  }

  function isLoggedIn() {
    return !!user && !!token;
  }

  function isAdmin() {
    return user && user.role === 'ADMIN';
  }

  function isLibrarian() {
    return user && user.role === 'LIBRARIAN';
  }

  function isReader() {
    return user && user.role === 'READER';
  }

  function isAdminOrLibrarian() {
    return isAdmin() || isLibrarian();
  }

  function getUser() {
    return user;
  }

  function getToken() {
    return token;
  }

  function getUserId() {
    return user ? user.id : null;
  }

  function getRoleLabel() {
    if (!user) return '';
    switch (user.role) {
      case 'ADMIN': return '管理员';
      case 'LIBRARIAN': return '图书管理员';
      case 'READER': return '读者';
      default: return '未知';
    }
  }

  function getDisplayName() {
    if (!user) return '';
    return user.displayName || user.username || '';
  }

  function setAvatar(avatarUrl) {
    if (user) {
      user.avatar = avatarUrl;
      localStorage.setItem('library_user', JSON.stringify(user));
    }
  }

  // Initialize on load
  init();

  return {
    init: init,
    setUser: setUser,
    clear: clear,
    isLoggedIn: isLoggedIn,
    isAdmin: isAdmin,
    isLibrarian: isLibrarian,
    isReader: isReader,
    isAdminOrLibrarian: isAdminOrLibrarian,
    getUser: getUser,
    getToken: getToken,
    getUserId: getUserId,
    getRoleLabel: getRoleLabel,
    getDisplayName: getDisplayName,
    setAvatar: setAvatar
  };
})();
