import request from './index'

export function getBorrowRecords() {
  return request.get('/borrow-records')
}

export function getBorrowRecord(id) {
  return request.get(`/borrow-records/${id}`)
}

export function getUserBorrowRecords(userId) {
  return request.get(`/borrow-records/user/${userId}`)
}

export function searchBorrowRecords(params) {
  return request.get('/borrow-records/search', { params })
}

export function borrowBook(userId, bookId) {
  return request.post('/borrow-records/borrow', null, { params: { userId, bookId } })
}

export function returnBook(id) {
  return request.put(`/borrow-records/return/${id}`)
}

export function renewBook(id) {
  return request.put(`/borrow-records/renew/${id}`)
}
