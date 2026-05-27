import request from './index'

export function getFavorites(userId) {
  return request.get('/favorites/user/' + userId)
}

export function checkFavorited(userId, bookId) {
  return request.get('/favorites/check', { params: { userId, bookId } })
}

export function addFavorite(userId, bookId) {
  return request.post('/favorites/add', null, { params: { userId, bookId } })
}

export function removeFavorite(userId, bookId) {
  return request.delete('/favorites/remove', { params: { userId, bookId } })
}

export function getFavoriteCount(bookId) {
  return request.get('/favorites/count/' + bookId)
}
