<template>
  <div class="dashboard">
    <!-- Public Landing Page (not logged in) -->
    <template v-if="!userStore.isLoggedIn()">
      <!-- Hero Section -->
      <div class="hero-section">
        <div class="hero-bg-shapes">
          <div class="shape shape-1"></div>
          <div class="shape shape-2"></div>
          <div class="shape shape-3"></div>
        </div>
        <div class="hero-content">
          <div class="hero-icon">
            <el-icon :size="72" color="#409eff"><Reading /></el-icon>
          </div>
          <h1 class="hero-title">智慧图书管理系统</h1>
          <p class="hero-desc">便捷高效的图书管理平台，让阅读更简单</p>
          <div class="hero-actions">
            <el-button type="primary" size="large" round @click="router.push('/login')">
              立即登录
            </el-button>
            <el-button size="large" round class="btn-register" @click="router.push('/login?tab=register')">
              注册账号
            </el-button>
          </div>
        </div>
      </div>

      <!-- Stats (from real API) -->
      <div class="stats-grid">
        <div class="stat-card" v-for="stat in publicStats" :key="stat.label" :style="{ borderLeftColor: stat.color }">
          <div class="stat-icon" :style="{ background: stat.bg }">
            <el-icon :size="28" :color="stat.color"><component :is="stat.icon" /></el-icon>
          </div>
          <div class="stat-info">
            <span class="stat-value">{{ stat.value }}</span>
            <span class="stat-label">{{ stat.label }}</span>
          </div>
        </div>
      </div>

      <!-- Features -->
      <div class="features-section">
        <h2 class="section-title">平台特色</h2>
        <div class="features-grid">
          <div class="feature-card" v-for="f in features" :key="f.title">
            <el-icon :size="36" :color="f.color"><component :is="f.icon" /></el-icon>
            <h3>{{ f.title }}</h3>
            <p>{{ f.desc }}</p>
          </div>
        </div>
      </div>
    </template>

    <!-- Authenticated Dashboard (logged in) -->
    <template v-else>
      <div class="welcome-banner">
        <div class="welcome-content">
          <el-avatar :size="48" :src="userStore.user?.avatar || ''" style="font-size:20px;flex-shrink:0">
            {{ userStore.user?.displayName?.charAt(0) || 'U' }}
          </el-avatar>
          <div>
            <h3>欢迎回来，{{ userStore.user?.displayName || userStore.user?.username }}</h3>
            <p style="color:#909399;font-size:13px;margin-top:4px">
              {{ roleLabel }} ·
              {{ new Date().toLocaleDateString('zh-CN', { year:'numeric',month:'long',day:'numeric',weekday:'long' }) }}
            </p>
          </div>
        </div>
      </div>

      <div class="stats-grid">
        <div class="stat-card" v-for="stat in dashboardStats" :key="stat.label" :style="{ borderLeftColor: stat.color }">
          <div class="stat-icon" :style="{ background: stat.bg }">
            <el-icon :size="28" :color="stat.color"><component :is="stat.icon" /></el-icon>
          </div>
          <div class="stat-info">
            <span class="stat-value">{{ stat.value }}</span>
            <span class="stat-label">{{ stat.label }}</span>
          </div>
        </div>
      </div>

      <h2 class="section-title">快捷操作</h2>
      <div class="actions-grid">
        <div class="action-item" @click="router.push('/books')">
          <el-icon :size="32" color="#409eff"><Reading /></el-icon>
          <span>浏览图书</span>
        </div>
        <div class="action-item" @click="router.push('/my-borrows')">
          <el-icon :size="32" color="#67c23a"><List /></el-icon>
          <span>我的借阅</span>
        </div>
        <div class="action-item" v-if="userStore.isAdmin() || userStore.isLibrarian()" @click="router.push('/books/manage')">
          <el-icon :size="32" color="#e6a23c"><Edit /></el-icon>
          <span>图书管理</span>
        </div>
        <div class="action-item" v-if="userStore.isAdmin() || userStore.isLibrarian()" @click="router.push('/borrows')">
          <el-icon :size="32" color="#f56c6c"><Timer /></el-icon>
          <span>借阅管理</span>
        </div>
        <div class="action-item" v-if="userStore.isAdmin()" @click="router.push('/users')">
          <el-icon :size="32" color="#909399"><UserFilled /></el-icon>
          <span>用户管理</span>
        </div>
        <div class="action-item" v-if="userStore.isAdmin()" @click="router.push('/categories')">
          <el-icon :size="32" color="#b37feb"><Collection /></el-icon>
          <span>分类管理</span>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { useUserStore } from '@/stores/user'
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getStats } from '@/api/dashboard'
import { ElMessage } from 'element-plus'
import { ElMessageBox } from 'element-plus'

const userStore = useUserStore()
const router = useRouter()
const stats = ref(null)
const loading = ref(true)

const features = [
  { icon: 'Reading', title: '图书管理', desc: '轻松管理图书信息，支持分类检索', color: '#409eff' },
  { icon: 'TakeawayBox', title: '借阅管理', desc: '便捷的借书还书流程，自动化管理', color: '#67c23a' },
  { icon: 'TrendCharts', title: '数据统计', desc: '直观的数据看板，掌握运营状况', color: '#e6a23c' },
  { icon: 'UserFilled', title: '用户管理', desc: '完善的用户权限体系，安全保障', color: '#909399' },
  { icon: 'Timer', title: '到期提醒', desc: '智能逾期提醒，不再错过还书日期', color: '#f56c6c' },
  { icon: 'Reading', title: '在线续借', desc: '一键续借，延长阅读时光', color: '#b37feb' }
]

const publicStats = computed(() => [
  { icon: 'Reading', label: '图书总量', value: stats.value?.totalBooks ?? '-', color: '#409eff', bg: '#ecf5ff' },
  { icon: 'UserFilled', label: '注册用户', value: stats.value?.totalUsers ?? '-', color: '#67c23a', bg: '#f0f9eb' },
  { icon: 'TakeawayBox', label: '借阅次数', value: stats.value?.totalBorrows ?? '-', color: '#e6a23c', bg: '#fdf6ec' },
  { icon: 'Collection', label: '图书分类', value: stats.value?.totalCategories ?? '-', color: '#909399', bg: '#f4f4f5' }
])

const dashboardStats = computed(() => [
  { icon: 'Reading', label: '图书总量', value: stats.value?.totalBooks ?? '-', color: '#409eff', bg: '#ecf5ff' },
  { icon: 'UserFilled', label: '注册用户', value: stats.value?.totalUsers ?? '-', color: '#67c23a', bg: '#f0f9eb' },
  { icon: 'TakeawayBox', label: '总借阅次数', value: stats.value?.totalBorrows ?? '-', color: '#e6a23c', bg: '#fdf6ec' },
  { icon: 'Timer', label: '当前借出', value: stats.value?.activeBorrows ?? '-', color: '#f56c6c', bg: '#fef0f0' },
  { icon: 'WarningFilled', label: '逾期记录', value: stats.value?.overdueRecords ?? '-', color: '#f56c6c', bg: '#fef0f0' },
  { icon: 'Collection', label: '图书分类', value: stats.value?.totalCategories ?? '-', color: '#909399', bg: '#f4f4f5' }
])

const roleTagType = computed(() => {
  const role = userStore.user?.role
  if (role === 'ADMIN') return 'danger'
  if (role === 'LIBRARIAN') return 'warning'
  return 'primary'
})

const roleLabel = computed(() => {
  const role = userStore.user?.role
  if (role === 'ADMIN') return '管理员'
  if (role === 'LIBRARIAN') return '图书管理员'
  if (role === 'READER') return '读者'
  return '未知'
})

const actions = computed(() => {
  const isAdmin = userStore.isAdmin()
  const isLib = userStore.isLibrarian()
  const items = [
    { icon: 'Reading', label: '图书浏览', color: '#409eff', route: '/books', show: true },
    { icon: 'Edit', label: '图书管理', color: '#67c23a', route: '/books/manage', show: isAdmin || isLib },
    { icon: 'TakeawayBox', label: '借阅管理', color: '#e6a23c', route: '/borrows', show: isAdmin || isLib },
    { icon: 'Reading', label: '我的借阅', color: '#909399', route: '/my-borrows', show: true },
    { icon: 'User', label: '个人中心', color: '#409eff', route: '/profile', show: true },
    { icon: 'UserFilled', label: '用户管理', color: '#f56c6c', route: '/users', show: isAdmin },
    { icon: 'Collection', label: '分类管理', color: '#67c23a', route: '/categories', show: isAdmin }
  ]
  return items.filter(i => i.show)
})

function navigate(route) {
  router.push(route)
}

async function loadStats() {
  loading.value = true
  try {
    const res = await getStats()
    if (res.code === 200) {
      stats.value = res.data
    }
  } catch (e) {}
  finally { loading.value = false }
}

onMounted(loadStats)
</script>

<style scoped>
.dashboard { animation: fadeInUp 0.5s ease; }

@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Hero */
.hero-section {
  position: relative;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
  border-radius: 20px;
  padding: 64px 40px;
  text-align: center;
  overflow: hidden;
  margin-bottom: 32px;
}
.hero-bg-shapes .shape {
  position: absolute;
  border-radius: 50%;
  opacity: 0.06;
  background: #409eff;
}
.shape-1 { width: 300px; height: 300px; top: -60px; left: -60px; }
.shape-2 { width: 200px; height: 200px; bottom: -40px; right: -40px; }
.shape-3 { width: 140px; height: 140px; top: 50%; left: 60%; }
.hero-content { position: relative; z-index: 1; }
.hero-icon { margin-bottom: 20px; display: inline-block; }
.hero-title {
  font-size: 36px;
  font-weight: 700;
  color: #fff;
  margin-bottom: 12px;
  letter-spacing: 2px;
}
.hero-desc {
  font-size: 16px;
  color: rgba(255,255,255,0.65);
  margin-bottom: 32px;
}
.hero-actions { display: flex; gap: 16px; justify-content: center; }
.btn-register {
  background: rgba(255,255,255,0.1);
  border-color: rgba(255,255,255,0.25);
  color: #fff;
}
.btn-register:hover {
  background: rgba(255,255,255,0.18);
  border-color: rgba(255,255,255,0.4);
  color: #fff;
}

/* Stats */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 40px;
}
.stat-card {
  background: var(--card-bg);
  border-color: var(--card-border);
  border-radius: 14px;
  padding: 24px;
  display: flex;
  align-items: center;
  gap: 16px;
  border-left: 4px solid #409eff;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
  transition: transform 0.2s, box-shadow 0.2s;
}
.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0,0,0,0.08);
}
.stat-icon {
  width: 56px; height: 56px;
  border-radius: 14px;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
  background: var(--bg-secondary);
}
.stat-info { display: flex; flex-direction: column; }
.stat-value { font-size: 26px; font-weight: 700; color: var(--text-color); }
.stat-label { font-size: 13px; color: var(--text-secondary); margin-top: 2px; }

/* Features */
.section-title {
  font-size: 20px;
  font-weight: 600;
  color: var(--text-color);
  margin-bottom: 20px;
  padding-left: 14px;
  border-left: 4px solid #409eff;
}
.features-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
}
.feature-card {
  background: var(--card-bg);
  border-radius: 16px;
  padding: 36px 28px;
  text-align: center;
  box-shadow: 0 2px 12px rgba(0,0,0,0.04);
  transition: transform 0.25s, box-shadow 0.25s;
}
.feature-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 10px 30px rgba(0,0,0,0.1);
}
.feature-card h3 { font-size: 17px; font-weight: 600; color: var(--text-color); margin: 16px 0 8px; }
.feature-card p { font-size: 13px; color: var(--text-secondary); line-height: 1.7; }

/* Authenticated */
.welcome-banner {
  background: var(--card-bg);
  border-radius: 16px;
  padding: 28px 32px;
  margin-bottom: 24px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
}
.welcome-content { display: flex; align-items: center; gap: 20px; }
.welcome-content h3 { font-size: 20px; font-weight: 600; color: var(--text-color); }

.actions-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 16px;
}
.action-item {
  display: flex; flex-direction: column; align-items: center; gap: 10px;
  padding: 24px 16px;
  border-radius: 14px;
  cursor: pointer;
  transition: all 0.25s;
  background: var(--card-bg);
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
}

.action-item:hover {
  background: #ecf5ff;
  transform: translateY(-3px);
  box-shadow: 0 6px 16px rgba(0,0,0,0.08);
}
.action-item span { font-size: 13px; color: var(--text-color); font-weight: 500; }

@media (max-width: 1200px) {
  .stats-grid { grid-template-columns: repeat(2, 1fr); }
  .features-grid { grid-template-columns: repeat(2, 1fr); }
  .actions-grid { grid-template-columns: repeat(3, 1fr); }
}
@media (max-width: 768px) {
  .hero-title { font-size: 24px; }
  .hero-section { padding: 40px 20px; }
  .stats-grid { grid-template-columns: 1fr 1fr; }
  .features-grid { grid-template-columns: 1fr; }
  .actions-grid { grid-template-columns: 1fr 1fr; }
}
</style>