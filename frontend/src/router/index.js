import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/stores/user'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/',
    component: () => import('@/views/Layout.vue'),
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/Dashboard.vue'),
        meta: { title: '首页', icon: 'HomeFilled' }
      },
      {
        path: 'books',
        name: 'Books',
        component: () => import('@/views/Books.vue'),
        meta: { title: '图书浏览', icon: 'Reading', requiresAuth: true }
      },
      {
        path: 'books/manage',
        name: 'BookManage',
        component: () => import('@/views/BookManage.vue'),
        meta: { title: '图书管理', icon: 'Edit', requiresAuth: true }
      },
      {
        path: 'books/manage/add',
        name: 'BookAdd',
        component: () => import('@/views/BookForm.vue'),
        meta: { title: '新增图书', requiresAuth: true }
      },
      {
        path: 'books/manage/edit/:id',
        name: 'BookEdit',
        component: () => import('@/views/BookForm.vue'),
        meta: { title: '编辑图书', requiresAuth: true }
      },
      {
        path: 'users',
        name: 'Users',
        component: () => import('@/views/Users.vue'),
        meta: { title: '用户管理', icon: 'UserFilled', requiresAuth: true }
      },
      {
        path: 'categories',
        name: 'Categories',
        component: () => import('@/views/Categories.vue'),
        meta: { title: '分类管理', icon: 'Collection', requiresAuth: true }
      },
      {
        path: 'borrows',
        name: 'Borrows',
        component: () => import('@/views/Borrows.vue'),
        meta: { title: '借阅管理', icon: 'TakeawayBox', requiresAuth: true }
      },
      {
        path: 'my-borrows',
        name: 'MyBorrows',
        component: () => import('@/views/MyBorrows.vue'),
        meta: { title: '我的借阅', icon: 'Reading', requiresAuth: true }
      },
      {
        path: 'favorites',
        name: 'Favorites',
        component: () => import('@/views/Favorites.vue'),
        meta: { title: '我的收藏', icon: 'StarFilled', requiresAuth: true }
      },
      {
        path: 'recommendations',
        name: 'Recommendations',
        component: () => import('@/views/Recommendations.vue'),
        meta: { title: '智能推荐', icon: 'DataBoard', requiresAuth: true }
      },
      {
        path: 'profile',
        name: 'Profile',
        component: () => import('@/views/Profile.vue'),
        meta: { title: '个人中心', icon: 'User', requiresAuth: true }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const userStore = useUserStore()
  userStore.initFromStorage()

  if (to.path === '/login') {
    if (userStore.isLoggedIn()) {
      next('/dashboard')
    } else {
      next()
    }
    return
  }

  if (to.matched.some(record => record.meta.requiresAuth) && !userStore.isLoggedIn()) {
    next('/login')
    return
  }

  if (to.meta.roles && !to.meta.roles.includes(userStore.user?.role)) {
    next('/dashboard')
    return
  }

  next()
})

export default router
