import request from './index'

export function getUsers() {
  return request.get('/users')
}

export function getUser(id) {
  return request.get(`/users/${id}`)
}

export function createUser(data) {
  return request.post('/users', data)
}

export function updateUser(id, data) {
  return request.put(`/users/${id}`, data)
}

export function deleteUser(id) {
  return request.delete(`/users/${id}`)
}

export function uploadAvatar(id, file) {
  const formData = new FormData()
  formData.append('file', file)
  return request.post(`/users/${id}/avatar`, formData)
}
