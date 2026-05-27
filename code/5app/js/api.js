/**
 * API Client - HTTP request wrapper for backend communication
 * Uses XMLHttpRequest for 5+App compatibility
 */

const API = (function() {
  // Backend API base URLs (tried in order, auto-fallback on network error).
  // Priority: 1) localStorage 'api_base_url'  2) window.__API_BASE_URL  3) iterative fallback
  // Override via localStorage('api_base_url') or window.__API_BASE_URL for all environments
  var _baseUrls = ['http://10.0.2.2:8081/api', 'http://localhost:8081/api'];
  var _workingBaseUrl = null; // cached after first successful request

  function getCurrentBaseUrl() {
    if (_workingBaseUrl) return _workingBaseUrl;
    var override = localStorage.getItem('api_base_url') || window.__API_BASE_URL;
    if (override) return override;
    // 浏览器调试 → localhost ; 5+App (模拟器/真机) → 10.0.2.2
    return (typeof plus !== 'undefined') ? _baseUrls[0] : _baseUrls[1];
  }

  var TIMEOUT = 15000;

  /**
   * Core XHR request with a specific base URL (internal)
   */
  function doRequest(method, url, data, options, baseUrl) {
    return new Promise(function(resolve, reject) {
      var xhr = new XMLHttpRequest();
      var fullUrl = baseUrl + url;

      // Collect query params
      var queryParams = null;
      if ((method === 'GET' || method === 'DELETE') && data) {
        queryParams = data;
      }
      if (options && options.params) {
        queryParams = options.params;
      }

      if (queryParams) {
        var query = [];
        for (var key in queryParams) {
          if (queryParams[key] !== null && queryParams[key] !== undefined && queryParams[key] !== '') {
            query.push(encodeURIComponent(key) + '=' + encodeURIComponent(queryParams[key]));
          }
        }
        if (query.length > 0) {
          fullUrl += (url.indexOf('?') === -1 ? '?' : '&') + query.join('&');
        }
      }

      xhr.open(method, fullUrl, true);
      xhr.timeout = options && options.timeout ? options.timeout : TIMEOUT;

      // Set headers
      xhr.setRequestHeader('Accept', 'application/json');

      // Set auth token
      var token = localStorage.getItem('library_token');
      if (token) {
        xhr.setRequestHeader('Authorization', token);
      }

      // Handle body
      var body = null;
      if (method !== 'GET' && method !== 'DELETE') {
        if (data instanceof FormData) {
          body = data;
        } else if (data) {
          xhr.setRequestHeader('Content-Type', 'application/json');
          body = JSON.stringify(data);
        }
      }

      xhr.onload = function() {
        var res;
        try {
          res = JSON.parse(xhr.responseText);
        } catch (e) {
          res = { code: 500, message: '响应解析失败', data: null };
        }

        // Handle 401 unauthorized
        if (xhr.status === 401 || res.code === 401) {
          localStorage.removeItem('library_user');
          localStorage.removeItem('library_token');
          window.location.hash = '#/login';
          reject({ code: 401, message: res.message || '未登录', data: null });
          return;
        }

        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(res);
        } else {
          reject({
            code: res.code || xhr.status,
            message: res.message || '请求失败',
            data: res.data,
            _httpError: true
          });
        }
      };

      xhr.onerror = function() {
        reject({ code: 0, message: 'NETWORK_ERROR' });
      };

      xhr.ontimeout = function() {
        reject({ code: 0, message: '请求超时，请检查网络' });
      };

      xhr.send(body);
    });
  }

  /**
   * Send HTTP request with automatic URL fallback
   * Tries _baseUrls in order on network error, caches the working one
   */
  function request(method, url, data, options) {
    var urlsToTry = [];

    var override = localStorage.getItem('api_base_url') || window.__API_BASE_URL;
    if (override) {
      urlsToTry = [override];
    } else if (_workingBaseUrl) {
      urlsToTry = [_workingBaseUrl];
    } else {
      // Smart ordering: put the environment-appropriate URL first
      var preferred = getCurrentBaseUrl();
      if (preferred === _baseUrls[0]) {
        urlsToTry = _baseUrls.slice(); // [10.0.2.2, localhost]
      } else {
        urlsToTry = [_baseUrls[1], _baseUrls[0]]; // [localhost, 10.0.2.2]
      }
    }

    function tryUrl(index) {
      if (index >= urlsToTry.length) {
        return Promise.reject({
          code: 0,
          message: '无法连接到服务器，请检查后端是否启动或网络连接',
          data: null
        });
      }

      return doRequest(method, url, data, options, urlsToTry[index]).then(
        function(res) {
          // Cache the working URL for subsequent requests
          if (!_workingBaseUrl && !override) {
            _workingBaseUrl = urlsToTry[index];
          }
          return res;
        },
        function(err) {
          if (err && err.message === 'NETWORK_ERROR') {
            return tryUrl(index + 1); // network error → try next URL
          }
          throw err; // non-network error → don't fallback
        }
      );
    }

    return tryUrl(0);
  }

  // Convenience methods
  function get(url, params) { return request('GET', url, params); }
  function post(url, data, options) { return request('POST', url, data, options); }
  function put(url, data) { return request('PUT', url, data); }
  function del(url, params) { return request('DELETE', url, params); }

  // ============================================================
  // Auth APIs
  // ============================================================
  function login(data) { return post('/auth/login', data); }
  function register(data) { return post('/auth/register', data); }

  // ============================================================
  // Book APIs
  // ============================================================
  function getBooks() { return get('/books'); }
  function getBook(id) { return get('/books/' + id); }
  function searchBooks(params) { return get('/books/search', params); }
  function createBook(data) { return post('/books', data); }
  function updateBook(id, data) { return put('/books/' + id, data); }
  function deleteBook(id) { return del('/books/' + id); }
  function uploadCover(id, file) {
    var formData = new FormData();
    formData.append('file', file);
    return request('POST', '/books/' + id + '/cover', formData);
  }

  // ============================================================
  // Borrow APIs
  // ============================================================
  function getBorrowRecords() { return get('/borrow-records'); }
  function getBorrowRecord(id) { return get('/borrow-records/' + id); }
  function getUserBorrowRecords(userId) { return get('/borrow-records/user/' + userId); }
  function searchBorrowRecords(params) { return get('/borrow-records/search', params); }
  function borrowBook(userId, bookId) { return post('/borrow-records/borrow', null, { params: { userId: userId, bookId: bookId } }); }
  function returnBook(id) { return put('/borrow-records/return/' + id); }
  function renewBook(id) { return put('/borrow-records/renew/' + id); }

  // ============================================================
  // User APIs
  // ============================================================
  function getUsers() { return get('/users'); }
  function getUser(id) { return get('/users/' + id); }
  function createUser(data) { return post('/users', data); }
  function updateUser(id, data) { return put('/users/' + id, data); }
  function deleteUser(id) { return del('/users/' + id); }
  function uploadAvatar(id, file) {
    var formData = new FormData();
    formData.append('file', file);
    return request('POST', '/users/' + id + '/avatar', formData);
  }

  // ============================================================
  // Category APIs
  // ============================================================
  function getCategories() { return get('/categories'); }
  function getCategory(id) { return get('/categories/' + id); }
  function createCategory(data) { return post('/categories', data); }
  function updateCategory(id, data) { return put('/categories/' + id, data); }
  function deleteCategory(id) { return del('/categories/' + id); }

  // ============================================================
  // Favorite APIs
  // ============================================================
  function getFavorites(userId) { return get('/favorites/user/' + userId); }
  function checkFavorited(userId, bookId) { return get('/favorites/check', { userId: userId, bookId: bookId }); }
  function addFavorite(userId, bookId) { return post('/favorites/add', null, { params: { userId: userId, bookId: bookId } }); }
  function removeFavorite(userId, bookId) { return del('/favorites/remove', { userId: userId, bookId: bookId }); }
  function getFavoriteCount(bookId) { return get('/favorites/count/' + bookId); }

  // ============================================================
  // Recommendation APIs
  // ============================================================
  function getRecommendations(userId, limit) {
    return get('/recommendations/user/' + userId, { limit: limit || 6 });
  }

  // ============================================================
  // Dashboard APIs
  // ============================================================
  function getStats() { return get('/dashboard/stats'); }
  function getUserStats(userId) { return get('/dashboard/stats/user/' + userId); }

  // Public API
  return {
    // Core
    get: get,
    post: post,
    put: put,
    del: del,
    getCurrentBaseUrl: getCurrentBaseUrl,

    // Auth
    login: login,
    register: register,

    // Books
    getBooks: getBooks,
    getBook: getBook,
    searchBooks: searchBooks,
    createBook: createBook,
    updateBook: updateBook,
    deleteBook: deleteBook,
    uploadCover: uploadCover,

    // Borrows
    getBorrowRecords: getBorrowRecords,
    getBorrowRecord: getBorrowRecord,
    getUserBorrowRecords: getUserBorrowRecords,
    searchBorrowRecords: searchBorrowRecords,
    borrowBook: borrowBook,
    returnBook: returnBook,
    renewBook: renewBook,

    // Users
    getUsers: getUsers,
    getUser: getUser,
    createUser: createUser,
    updateUser: updateUser,
    deleteUser: deleteUser,
    uploadAvatar: uploadAvatar,

    // Categories
    getCategories: getCategories,
    getCategory: getCategory,
    createCategory: createCategory,
    updateCategory: updateCategory,
    deleteCategory: deleteCategory,

    // Favorites
    getFavorites: getFavorites,
    checkFavorited: checkFavorited,
    addFavorite: addFavorite,
    removeFavorite: removeFavorite,
    getFavoriteCount: getFavoriteCount,

    // Recommendations
    getRecommendations: getRecommendations,

    // Dashboard
    getStats: getStats,
    getUserStats: getUserStats
  };
})();
