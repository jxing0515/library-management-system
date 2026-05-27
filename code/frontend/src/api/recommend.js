import request from './index'

export function getRecommendations(userId, limit = 6) {
  return request.get('/recommendations/user/' + userId, { params: { limit } })
}
