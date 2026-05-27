import request from './index'

export function getBooks() {
  return request.get('/books')
}

export function getBook(id) {
  return request.get(`/books/${id}`)
}

export function searchBooks(params) {
  return request.get('/books/search', { params })
}

export function createBook(data) {
  return request.post('/books', data)
}

export function updateBook(id, data) {
  return request.put(`/books/${id}`, data)
}

export function deleteBook(id) {
  return request.delete(`/books/${id}`)
}

export function uploadCover(id, file) {
  const formData = new FormData()
  formData.append('file', file)
  return request.post(`/books/${id}/cover`, formData)
}

export function deleteCover(id) {
  return request.delete(`/books/${id}/cover`)
}
