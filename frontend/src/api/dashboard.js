import request from './index'

export function getStats() {
  return request.get('/dashboard/stats')
}

export function getUserStats(userId) {
  return request.get(`/dashboard/stats/user/${userId}`)
}
