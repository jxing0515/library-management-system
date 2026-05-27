import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useUserStore = defineStore('user', () => {
  const user = ref(null)
  const token = ref('')

  function initFromStorage() {
    const saved = localStorage.getItem('library_user')
    const savedToken = localStorage.getItem('library_token')
    if (saved && savedToken) {
      try {
        user.value = JSON.parse(saved)
        token.value = savedToken
      } catch (e) {
        clearUser()
      }
    }
  }

  function setUser(userData, userToken) {
    user.value = userData
    token.value = userToken
    localStorage.setItem('library_user', JSON.stringify(userData))
    localStorage.setItem('library_token', userToken)
  }

  function clearUser() {
    user.value = null
    token.value = ''
    localStorage.removeItem('library_user')
    localStorage.removeItem('library_token')
  }

  function isLoggedIn() {
    return !!user.value && !!token.value
  }

  function isAdmin() {
    return user.value?.role === 'ADMIN'
  }

  function isLibrarian() {
    return user.value?.role === 'LIBRARIAN'
  }

  function isReader() {
    return user.value?.role === 'READER'
  }

  function setUserAvatar(avatarUrl) {
    if (user.value) {
      user.value.avatar = avatarUrl
      localStorage.setItem('library_user', JSON.stringify(user.value))
    }
  }

  return { user, token, initFromStorage, setUser, clearUser, setUserAvatar, isLoggedIn, isAdmin, isLibrarian, isReader }
})
