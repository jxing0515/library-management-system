<template>
  <div class="layout-container" :class="{ 'fullscreen-mode': isPublicDashboard }">
    <!-- Sidebar (hidden on public dashboard) -->
    <aside v-if="!isPublicDashboard" class="sidebar" :class="{ collapsed: sidebarCollapsed }">
      <div class="sidebar-brand">
        <div class="brand-icon">
          <el-icon :size="28" color="#409eff"><Reading /></el-icon>
        </div>
        <span v-show="!sidebarCollapsed" class="brand-text">智慧图书馆</span>
      </div>

      <el-menu
        :default-active="activeMenu"
        :collapse="sidebarCollapsed"
        :router="true"
        background-color="transparent"
        text-color="#a0a4b8"
        active-text-color="#409eff"
        class="sidebar-menu"
      >
        <el-menu-item index="/dashboard">
          <el-icon><HomeFilled /></el-icon>
          <template #title>首页</template>
        </el-menu-item>

        <el-menu-item v-if="userStore.isLoggedIn()" index="/books">
          <el-icon><Reading /></el-icon>
          <template #title>图书浏览</template>
        </el-menu-item>

        <el-menu-item v-if="userStore.isAdmin() || userStore.isLibrarian()" index="/books/manage">
          <el-icon><Edit /></el-icon>
          <template #title>图书管理</template>
        </el-menu-item>

        <el-menu-item v-if="userStore.isAdmin() || userStore.isLibrarian()" index="/borrows">
          <el-icon><Timer /></el-icon>
          <template #title>借阅管理</template>
        </el-menu-item>

        <el-menu-item index="/my-borrows">
          <el-icon><List /></el-icon>
          <template #title>我的借阅</template>
        </el-menu-item>

        <el-menu-item v-if="userStore.isLoggedIn()" index="/favorites">
          <el-icon><StarFilled /></el-icon>
          <template #title>我的收藏</template>
        </el-menu-item>

        <el-menu-item v-if="userStore.isLoggedIn()" index="/recommendations">
          <el-icon><DataBoard /></el-icon>
          <template #title>智能推荐</template>
        </el-menu-item>

        <el-menu-item v-if="userStore.isAdmin()" index="/users">
          <el-icon><UserFilled /></el-icon>
          <template #title>用户管理</template>
        </el-menu-item>

        <el-menu-item v-if="userStore.isAdmin()" index="/categories">
          <el-icon><Collection /></el-icon>
          <template #title>分类管理</template>
        </el-menu-item>
      </el-menu>

      <div class="sidebar-footer" v-show="!sidebarCollapsed">
        <span class="footer-text">v1.0.0</span>
      </div>
    </aside>

    <!-- Main -->
    <div class="main-area">
      <!-- Topbar (hidden on public dashboard) -->
      <header class="topbar" v-if="!isPublicDashboard">
        <div class="topbar-left">
          <el-button class="collapse-btn" :icon="Fold" text @click="sidebarCollapsed = !sidebarCollapsed" />
          <el-breadcrumb separator="/">
            <el-breadcrumb-item :to="{ path: '/dashboard' }">首页</el-breadcrumb-item>
            <el-breadcrumb-item v-if="currentPage">{{ currentPage }}</el-breadcrumb-item>
          </el-breadcrumb>
        </div>
        <div class="topbar-right">
          <theme-button value="dark" id="theme-btn" size="2.5" style="margin-right:12px"></theme-button>
          <template v-if="userStore.isLoggedIn()">
            <el-dropdown trigger="click" @command="handleCommand">
              <div class="user-info">
                <el-avatar :size="34" :src="userStore.user?.avatar || ''" style="background:#409eff;font-size:14px">
                  {{ userStore.user?.displayName?.charAt(0) || 'U' }}
                </el-avatar>
                <span class="username">{{ userStore.user?.displayName || userStore.user?.username }}</span>
                <el-icon><ArrowDown /></el-icon>
              </div>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="profile">
                    <el-icon><User /></el-icon>个人中心
                  </el-dropdown-item>
                  <el-dropdown-item command="myBorrows">
                    <el-icon><List /></el-icon>我的借阅
                  </el-dropdown-item>
                  <el-dropdown-item command="favorites">
                    <el-icon><StarFilled /></el-icon>我的收藏
                  </el-dropdown-item>
                  <el-dropdown-item command="recommendations">
                    <el-icon><DataBoard /></el-icon>智能推荐
                  </el-dropdown-item>
                  <el-dropdown-item divided command="logout">
                    <el-icon><SwitchButton /></el-icon>退出登录
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
          <template v-else>
            <el-button type="primary" size="small" @click="router.push('/login')">登录</el-button>
          </template>
        </div>
      </header>

      <!-- Content -->
      <main class="content" :class="{ 'content-full': isPublicDashboard }">
        <router-view v-slot="{ Component }">
          <transition name="page-fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { ElMessageBox } from 'element-plus'
import {
  HomeFilled, Reading, Edit, Timer, List, UserFilled, Collection,
  Fold, ArrowDown, User, SwitchButton
} from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const sidebarCollapsed = ref(false)

const isPublicDashboard = computed(() => {
  return route.path === '/dashboard' && !userStore.isLoggedIn()
})

const activeMenu = computed(() => {
  const p = route.path
  if (p.startsWith('/books/manage')) return '/books/manage'
  return p
})

const currentPage = computed(() => {
  return route.meta?.title || ''
})

// Listen for theme changes + initial sync
onMounted(() => {
  const btn = document.getElementById('theme-btn')
  if (!btn) return

  btn.addEventListener('change', (e) => {
    document.dispatchEvent(new CustomEvent('theme-change', { detail: e.detail }))
  })

  const saved = localStorage.getItem('library_theme')
  const current = btn.getAttribute('value')
  if (saved && saved !== current) {
    // 按钮状态与用户偏好不一致，模拟点击切换按钮视觉
    const comp = btn.shadowRoot?.querySelector('.components')
    if (comp) comp.click()
  } else if (saved) {
    // 一致则只同步 CSS
    document.dispatchEvent(new CustomEvent('theme-change', { detail: saved }))
  }
})

const handleCommand = async (cmd) => {
  if (cmd === 'profile') {
    router.push('/profile')
  } else if (cmd === 'myBorrows') {
    router.push('/my-borrows')
  } else if (cmd === 'favorites') {
    router.push('/favorites')
  } else if (cmd === 'recommendations') {
    router.push('/recommendations')
  } else if (cmd === 'logout') {
    try {
      await ElMessageBox.confirm('确定要退出登录吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      })
    } catch (e) {
      return
    }
    userStore.clearUser()
    window.location.href = '/'
  }
}
</script>

<style scoped>
.layout-container {
  display: flex;
  height: 100vh;
  overflow: hidden;
}

/* Sidebar */
.sidebar {
  width: 220px;
  min-width: 220px;
  background: var(--sidebar-bg, linear-gradient(180deg, #1d1e2c 0%, #171822 100%));
  display: flex;
  flex-direction: column;
  transition: width 0.3s, min-width 0.3s;
  overflow: hidden;
}
.sidebar.collapsed {
  width: 64px;
  min-width: 64px;
}

.sidebar-brand {
  height: 64px;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 20px;
  flex-shrink: 0;
  border-bottom: 1px solid rgba(255,255,255,0.06);
}
.brand-icon { flex-shrink: 0; }
.brand-text {
  font-size: 18px;
  font-weight: 600;
  color: #e0e0e0;
  white-space: nowrap;
}

.sidebar-menu {
  flex: 1;
  border-right: none !important;
  overflow-y: auto;
  padding: 8px 0;
}
.sidebar-menu :deep(.el-menu-item) {
  height: 48px;
  line-height: 48px;
  margin: 2px 8px;
  border-radius: 8px;
}
.sidebar-menu :deep(.el-menu-item.is-active) {
  background: rgba(64,158,255,0.12) !important;
}
.sidebar-menu :deep(.el-menu-item:hover) {
  background: rgba(255,255,255,0.04) !important;
}

.sidebar-footer {
  padding: 12px 20px;
  border-top: 1px solid rgba(255,255,255,0.06);
}
.footer-text {
  font-size: 11px;
  color: rgba(255,255,255,0.25);
}

/* Main */
.main-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.topbar {
  height: 60px;
  background: var(--topbar-bg);
  border-bottom: 1px solid #e4e7ed;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  flex-shrink: 0;
  box-shadow: 0 1px 4px rgba(0,0,0,0.04);
  z-index: 10;
}
.topbar-left { display: flex; align-items: center; gap: 14px; }
.collapse-btn { font-size: 20px; color: #606266; }
.topbar-right { display: flex; align-items: center; }

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 4px 10px;
  border-radius: 8px;
  transition: background 0.2s;
}
.user-info:hover { background: #f5f7fa; }
.username { font-size: 14px; color: var(--text-color); font-weight: 500; }

.content {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
  background: var(--bg-color);
}


/* Page transition */
.page-fade-enter-active { transition: all 0.25s ease; }
.page-fade-leave-active { transition: all 0.15s ease; }
.page-fade-enter-from { opacity: 0; transform: translateY(10px); }
.page-fade-leave-to { opacity: 0; transform: translateY(-10px); }

/* Fullscreen mode (public dashboard) */
.layout-container.fullscreen-mode {
  display: block;
  overflow-y: auto;
}
.layout-container.fullscreen-mode .sidebar {
  display: none;
}
.layout-container.fullscreen-mode .main-area {
  overflow: visible;
  display: block;
}
.layout-container.fullscreen-mode .topbar {
  display: none;
}
.layout-container.fullscreen-mode .content-full {
  padding: 32px 40px;
  overflow: visible;
  display: block;
}
</style>