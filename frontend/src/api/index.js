import axios from 'axios'

const request = axios.create({
  baseURL: '/api',
  timeout: 15000
})

// Request interceptor - add token
request.interceptors.request.use(
  config => {
    const token = localStorage.getItem('library_token')
    if (token) {
      config.headers['Authorization'] = token
    }
    // Remove Content-Type for FormData uploads - let browser set it with boundary
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type']
    }
    return config
  },
  error => {
    return Promise.reject(error)
  }
)

// Response interceptor
request.interceptors.response.use(
  response => {
    const res = response.data
    if (res.code === 401) {
      localStorage.removeItem('library_user')
      localStorage.removeItem('library_token')
      window.location.href = '/login'
      return Promise.reject(new Error(res.message || '未登录'))
    }
    return res
  },
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem('library_user')
      localStorage.removeItem('library_token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default request
