<template>
  <div class="rec-page">
    <div class="page-header">
      <h2 class="page-title">🤖 智能推荐</h2>
      <div class="header-actions">
        <el-button type="primary" @click="loadRecommendations" :loading="loading" icon="Refresh">
          {{ loading ? '推荐中...' : '换一批' }}
        </el-button>
      </div>
    </div>

    <!-- 推荐模式提示 -->
    <el-alert
      :title="modeTitle"
      :type="modeType"
      :closable="false"
      show-icon
      
      style="margin-bottom:20px;border-radius:10px" />

    <!-- 加载动画 -->
    <div v-if="loading" class="loading-grid">
      <div v-for="n in 6" :key="n" class="loading-card">
        <div class="loading-cover pulse"></div>
        <div class="loading-info">
          <div class="loading-line w-70 pulse"></div>
          <div class="loading-line w-50 pulse"></div>
          <div class="loading-line w-40 pulse"></div>
          <div class="loading-line w-90 pulse"></div>
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <el-empty v-else-if="books.length === 0" description="暂无推荐图书" :image-size="120">
      <el-button type="primary" @click="loadRecommendations">重新获取</el-button>
    </el-empty>

    <!-- 推荐卡片 -->
    <div v-else class="rec-grid">
      <div v-for="book in books" :key="book.id" class="rec-card">
        <div class="rec-card-cover" @click="showDetail(book)">
          <img v-if="book.coverUrl" :src="book.coverUrl" class="rec-cover-img" />
          <div v-else class="rec-cover-placeholder"><el-icon :size="36"><Reading /></el-icon></div>
          <div class="rec-badge">
            <el-tag size="small" :color="badgeColor" style="color:#fff;border:0">{{ badgeText }}</el-tag>
          </div>
        </div>
        <div class="rec-card-info">
          <div class="rec-card-title" @click="showDetail(book)">{{ book.title }}</div>
          <div class="rec-card-author">{{ book.author }}</div>
          <div class="rec-card-meta">
            <el-tag size="small" type="info" effect="plain">{{ book.category?.name || '未分类' }}</el-tag>
            <el-tag size="small" :type="book.available > 0 ? 'success' : 'danger'" effect="plain">
              余 {{ book.available }}
            </el-tag>
          </div>
          <div class="rec-card-desc" v-if="book.description">
            {{ book.description.length > 50 ? book.description.slice(0, 50) + '...' : book.description }}
          </div>
          <div class="rec-card-actions">
            <el-button size="small" type="primary" :disabled="book.available <= 0"
              :loading="borrowLoadingId === book.id" @click.stop="handleBorrow(book)">借阅</el-button>
            <el-button size="small"
              :type="favoriteMap[book.id] ? 'warning' : 'default'"
              @click.stop="handleToggleFavorite(book)">
              <el-icon><StarFilled v-if="favoriteMap[book.id]" /><Star v-else /></el-icon>
              {{ favoriteMap[book.id] ? '已收藏' : '收藏' }}
            </el-button>
          </div>
        </div>
      </div>
    </div>

    <!-- 图书详情弹窗 -->
    <el-dialog v-model="detailVisible" title="图书详情" width="650px" :close-on-click-modal="false" destroy-on-close>
      <el-row v-if="detailBook" :gutter="24">
        <el-col :span="8">
          <div class="detail-cover">
            <img v-if="detailBook.coverUrl" :src="detailBook.coverUrl" class="detail-cover-img" />
            <el-icon v-else :size="48" color="#c0c4cc"><Reading /></el-icon>
          </div>
        </el-col>
        <el-col :span="16">
          <div class="detail-info">
            <div class="detail-title">{{ detailBook.title }}</div>
            <div class="detail-author"><b>作者：</b>{{ detailBook.author }}</div>
            <div class="detail-isbn"><b>ISBN：</b>{{ detailBook.isbn || '无' }}</div>
            <div class="detail-publisher"><b>出版社：</b>{{ detailBook.publisher || '无' }}</div>
            <div class="detail-category"><b>分类：</b>{{ detailBook.category?.name || '未分类' }}</div>
            <div class="detail-stock"><b>库存：</b>{{ detailBook.available }} / {{ detailBook.quantity }}</div>
            <div class="detail-desc" v-if="detailBook.description"><b>简介：</b>{{ detailBook.description }}</div>
            <div style="margin-top:16px;display:flex;gap:10px">
              <el-button type="primary" :disabled="detailBook.available <= 0"
                :loading="borrowLoadingId === detailBook.id" @click="handleBorrow(detailBook)">借阅此书</el-button>
              <el-button :type="favoriteMap[detailBook.id] ? 'warning' : 'default'"
                @click="handleToggleFavorite(detailBook)">
                <el-icon><StarFilled v-if="favoriteMap[detailBook.id]" /><Star v-else /></el-icon>
                {{ favoriteMap[detailBook.id] ? '取消收藏' : '收藏此书' }}
              </el-button>
            </div>
          </div>
        </el-col>
      </el-row>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { getRecommendations } from '@/api/recommend'
import { checkFavorited, addFavorite, removeFavorite } from '@/api/favorite'
import { borrowBook } from '@/api/borrow'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Reading, Refresh, Star, StarFilled } from '@element-plus/icons-vue'

const router = useRouter()
const userStore = useUserStore()

const books = ref([])
const loading = ref(false)
const loadingStartTime = ref(0)
const detailVisible = ref(false)
const detailBook = ref(null)
const borrowLoadingId = ref(null)
const favoriteMap = reactive({})
const recMode = ref('ai') // 'ai' | 'category' | 'random'

const badgeText = computed(() => {
  const map = { ai: 'AI推荐', category: '偏好推荐', random: '随机推荐' }
  return map[recMode.value] || 'AI推荐'
})

const badgeColor = computed(() => {
  const map = { ai: '#409eff', category: '#67c23a', random: '#909399' }
  return map[recMode.value] || '#409eff'
})

const modeTitle = computed(() => {
  const titles = {
    ai: '基于您的借阅记录和AI智能分析，为您推荐以下图书',
    category: 'AI 无法调用，已切换为基于借阅偏好的推荐',
    random: '为您随机推荐以下图书（暂无足够借阅数据）'
  }
  return titles[recMode.value]
})

const modeType = computed(() => {
  const map = { ai: 'success', category: 'success', random: 'warning' }
  return map[recMode.value] || 'info'
})

// 确保加载动画至少显示 800ms，避免闪一下
async function minLoadingTime() {
  const elapsed = Date.now() - loadingStartTime.value
  if (elapsed < 800) {
    await new Promise(r => setTimeout(r, 800 - elapsed))
  }
}

async function loadRecommendations() {
  if (!userStore.isLoggedIn()) {
    router.push('/login')
    return
  }
  loadingStartTime.value = Date.now()
  loading.value = true
  try {
    const res = await getRecommendations(userStore.user.id, 6)
    if (res.code === 200) {
        books.value = res.data.books || []
        // 检查实际收到的 mode 值
        console.log('推荐模式:', res.data.mode, '完整响应:', res)
        recMode.value = res.data.mode === 'ai' ? 'ai' : 
                        (res.data.mode === 'category' ? 'category' : 'random')
      await loadFavoriteStatus()
    }
  } catch (e) {
    ElMessage.error('获取推荐失败')
  } finally {
    await minLoadingTime()
    loading.value = false
  }
}

async function loadFavoriteStatus() {
  if (!userStore.isLoggedIn()) return
  for (const book of books.value) {
    try {
      const res = await checkFavorited(userStore.user.id, book.id)
      if (res.code === 200) favoriteMap[book.id] = res.data
    } catch (e) {}
  }
}

function showDetail(book) {
  detailBook.value = book
  detailVisible.value = true
}

async function handleToggleFavorite(book) {
  if (!userStore.isLoggedIn()) {
    ElMessage.warning('请先登录')
    return
  }
  try {
    if (favoriteMap[book.id]) {
      const res = await removeFavorite(userStore.user.id, book.id)
      if (res.code === 200) {
        favoriteMap[book.id] = false
        ElMessage.success('已取消收藏')
      }
    } else {
      const res = await addFavorite(userStore.user.id, book.id)
      if (res.code === 200) {
        favoriteMap[book.id] = true
        ElMessage.success('收藏成功')
      } else {
        ElMessage.error(res.message || '收藏失败')
      }
    }
  } catch (e) { ElMessage.error('操作失败') }
}

async function handleBorrow(book) {
  try {
    await ElMessageBox.confirm('确认借阅《' + book.title + '》？', '确认借阅', { type: 'info' })
    borrowLoadingId.value = book.id
    const res = await borrowBook(userStore.user.id, book.id)
    if (res.code === 200) {
      ElMessage.success('借阅成功！')
      loadRecommendations()
    } else {
      ElMessage.error(res.message || '借阅失败')
    }
  } catch (e) {}
  finally { borrowLoadingId.value = null }
}

onMounted(loadRecommendations)
</script>

<style scoped>
.rec-page { max-width: 1000px; margin: 0 auto; }
.page-header {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 20px;
}
.page-title { font-size: 22px; font-weight: 600; color: var(--text-color); }
.header-actions { display: flex; align-items: center; gap: 12px; }

/* ===== 加载动画 ===== */
.loading-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}
.loading-card {
  background: var(--card-bg);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0,0,0,0.06);
  display: flex;
  height: 155px;
}
.loading-cover {
  width: 110px;
  height: 100%;
  background: #e8eaed;
  flex-shrink: 0;
}
.loading-info {
  padding: 14px;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.loading-line {
  height: 14px;
  background: #e8eaed;
  border-radius: 6px;
}
.w-70 { width: 70%; }
.w-50 { width: 50%; }
.w-40 { width: 40%; }
.w-90 { width: 90%; }

@keyframes pulse {
  0%, 100% { opacity: 0.4; }
  50% { opacity: 0.8; }
}
.pulse {
  animation: pulse 1.4s ease-in-out infinite;
}

/* ===== 推荐卡片 ===== */
.rec-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}
.rec-card {
  background: var(--card-bg);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0,0,0,0.06);
  transition: all 0.25s ease;
  display: flex;
}
.rec-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(64,158,255,0.15);
}
.rec-card-cover {
  width: 110px; min-height: 155px;
  background: linear-gradient(135deg, #f5f7fa, #ecf5ff);
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0; overflow: hidden; cursor: pointer;
  position: relative;
}
.rec-cover-img { width: 100%; height: 100%; object-fit: cover; }
.rec-cover-placeholder { color: #c0c4cc; }
.rec-badge { position: absolute; top: 4px; left: 4px; }
.rec-card-info {
  padding: 14px; flex: 1;
  display: flex; flex-direction: column; gap: 4px;
}
.rec-card-title {
  font-size: 15px; font-weight: 600; color: var(--text-color);
  cursor: pointer; line-height: 1.3;
}
.rec-card-title:hover { color: #409eff; }
.rec-card-author { font-size: 13px; color: var(--text-secondary); }
.rec-card-meta { display: flex; gap: 6px; flex-wrap: wrap; }
.rec-card-desc { font-size: 12px; color: #999; line-height: 1.4; margin-top: 2px; }
.rec-card-actions { margin-top: auto; display: flex; gap: 6px; padding-top: 8px; }

.detail-cover {
  width: 100%; aspect-ratio: 3/4; max-height: 260px;
  background: linear-gradient(135deg, #f5f7fa, #ecf5ff);
  border-radius: 12px;
  display: flex; align-items: center; justify-content: center;
  overflow: hidden;
}
.detail-cover-img { width: 100%; height: 100%; object-fit: cover; border-radius: 12px; }
.detail-info { line-height: 2; }
.detail-title { font-size: 20px; font-weight: 700; color: var(--text-color); margin-bottom: 12px; }
</style>
