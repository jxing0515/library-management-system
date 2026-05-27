<template>
  <div class="favorites-page">
    <div class="page-header">
      <h2 class="page-title">📖 我的收藏</h2>
      <div class="header-actions">
        <el-tag type="warning" size="large" effect="plain" v-if="favoriteList.length > 0">
          共收藏 {{ favoriteList.length }} 本
        </el-tag>
        <el-button-group class="view-toggle">
          <el-button :type="viewMode === 'card' ? 'primary' : 'default'" size="small" @click="viewMode = 'card'">
            <el-icon><Grid /></el-icon>
          </el-button>
          <el-button :type="viewMode === 'table' ? 'primary' : 'default'" size="small" @click="viewMode = 'table'">
            <el-icon><List /></el-icon>
          </el-button>
        </el-button-group>
      </div>
    </div>
    <div v-if="loading" class="loading-container">
      <el-skeleton :rows="3" animated />
    </div>
    <el-empty v-else-if="favoriteList.length === 0" description="暂无收藏图书" :image-size="120">
      <el-button type="primary" @click="router.push('/books')">去浏览图书</el-button>
    </el-empty>
    <template v-else-if="viewMode === 'card'">
      <div class="fav-grid">
        <div v-for="item in pagedFavorites" :key="item.id" class="fav-card">
          <div class="fav-card-cover" @click="showDetail(item.book)">
            <img v-if="item.book.coverUrl" :src="item.book.coverUrl" class="fav-cover-img" />
            <div v-else class="fav-cover-placeholder">
              <el-icon :size="36"><Reading /></el-icon>
            </div>
          </div>
          <div class="fav-card-info">
            <div class="fav-card-title" @click="showDetail(item.book)">{{ item.book.title }}</div>
            <div class="fav-card-author">{{ item.book.author }}</div>
            <div class="fav-card-meta">
              <el-tag size="small" :type="item.book.available > 0 ? 'success' : 'danger'" effect="plain">
                库存 {{ item.book.available }}/{{ item.book.quantity }}
              </el-tag>
              <el-tag size="small" type="info" effect="plain" v-if="item.book.category">
                {{ item.book.category.name }}
              </el-tag>
            </div>
            <div class="fav-card-time" v-if="item.createdAt">
              <el-icon><Clock /></el-icon>
              <span>收藏于 {{ formatDate(item.createdAt) }}</span>
            </div>
            <div class="fav-card-actions">
              <el-button size="small" type="primary" :disabled="item.book.available <= 0"
                :loading="borrowLoadingId === item.book.id" @click="handleBorrow(item.book)">借阅</el-button>
              <el-button size="small" type="danger" plain @click="handleRemoveFavorite(item.book)">取消收藏</el-button>
            </div>
          </div>
        </div>
      </div>
    </template>
    <el-card v-else shadow="never" style="border-radius:12px">
      <el-table :data="pagedFavorites" stripe style="width:100%" empty-text="暂无收藏图书">
        <el-table-column label="书名" min-width="180" show-overflow-tooltip>
          <template #default="{ row }">
            <div class="book-title-cell" @click="showDetail(row.book)">
              <img v-if="row.book.coverUrl" :src="row.book.coverUrl" class="table-cover" />
              <span class="book-title-link">{{ row.book.title }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="作者" width="140" prop="book.author" />
        <el-table-column label="ISBN" width="130" prop="book.isbn" />
        <el-table-column label="分类" width="100">
          <template #default="{ row }">
            <span>{{ row.book.category?.name || '未分类' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="库存" width="90">
          <template #default="{ row }">
            <el-tag :type="row.book.available > 0 ? 'success' : 'danger'" size="small" effect="plain">
              {{ row.book.available }}/{{ row.book.quantity }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="收藏时间" width="170">
          <template #default="{ row }">
            <span style="font-size:13px;color:var(--text-secondary)">
              <el-icon style="vertical-align:-2px"><Clock /></el-icon>
              {{ formatDate(row.createdAt) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button size="small" type="primary" :disabled="row.book.available <= 0"
              :loading="borrowLoadingId === row.book.id" @click="handleBorrow(row.book)">借阅</el-button>
            <el-button size="small" type="danger" plain @click="handleRemoveFavorite(row.book)">取消</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <div class="pagination-wrapper" v-if="favoriteList.length > pageSize">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :total="favoriteList.length"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next, jumper"
        background
      />
    </div>

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
            </div>
          </div>
        </el-col>
      </el-row>
    </el-dialog>
  </div>
</template>
<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { getFavorites, removeFavorite } from '@/api/favorite'
import { borrowBook } from '@/api/borrow'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Clock, Grid, List, Reading } from '@element-plus/icons-vue'
import dayjs from 'dayjs'
const router = useRouter()
const userStore = useUserStore()
const favoriteList = ref([])
const loading = ref(false)
const detailVisible = ref(false)
const detailBook = ref(null)
const viewMode = ref('card')
const borrowLoadingId = ref(null)
const currentPage = ref(1)
const pageSize = ref(10)
const pagedFavorites = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return favoriteList.value.slice(start, start + pageSize.value)
})
function formatDate(dateStr) {
  if (!dateStr) return '未知'
  return dayjs(dateStr).format('YYYY-MM-DD HH:mm')
}
async function loadFavorites() {
  if (!userStore.isLoggedIn()) {
    router.push('/login')
    return
  }
  loading.value = true
  currentPage.value = 1
  try {
    const res = await getFavorites(userStore.user.id)
    if (res.code === 200) favoriteList.value = res.data
  } catch (e) {
    ElMessage.error('加载收藏失败')
  } finally {
    loading.value = false
  }
}
function showDetail(book) {
  detailBook.value = book
  detailVisible.value = true
}
async function handleRemoveFavorite(book) {
  try {
    await ElMessageBox.confirm('确认取消收藏《' + book.title + '》？', '确认取消')
    const res = await removeFavorite(userStore.user.id, book.id)
    if (res.code === 200) {
      ElMessage.success('已取消收藏')
      loadFavorites()
    }
  } catch (e) {}
}
async function handleBorrow(book) {
  try {
    await ElMessageBox.confirm('确认借阅《' + book.title + '》？', '确认借阅', { type: 'info' })
    borrowLoadingId.value = book.id
    const res = await borrowBook(userStore.user.id, book.id)
    if (res.code === 200) {
      ElMessage.success('借阅成功！')
      loadFavorites()
    } else {
      ElMessage.error(res.message || '借阅失败')
    }
  } catch (e) {}
  finally {
    borrowLoadingId.value = null
  }
}
onMounted(loadFavorites)
</script>
<style scoped>
.favorites-page { max-width: 1100px; margin: 0 auto; }
.page-header {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 20px; flex-wrap: wrap; gap: 12px;
}
.page-title { font-size: 22px; font-weight: 600; color: var(--text-color); margin: 0; }
.header-actions { display: flex; align-items: center; gap: 12px; }
.view-toggle { flex-shrink: 0; }
.loading-container { padding: 40px; }
.fav-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}
.fav-card {
  display: flex;
  background: var(--card-bg);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0,0,0,0.06);
  transition: all 0.25s ease;
}
.fav-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(64,158,255,0.12);
}
.fav-card-cover {
  width: 110px; min-height: 155px;
  background: var(--cover-gradient);
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0; overflow: hidden; cursor: pointer;
}
.fav-cover-img { width: 100%; height: 100%; object-fit: cover; }
.fav-cover-placeholder { color: #c0c4cc; }
.fav-card-info {
  padding: 12px; flex: 1;
  display: flex; flex-direction: column; gap: 4px;
}
.fav-card-title {
  font-size: 15px; font-weight: 600; color: var(--text-color);
  cursor: pointer; line-height: 1.3;
}
.fav-card-title:hover { color: #409eff; }
.fav-card-author { font-size: 13px; color: var(--text-secondary); }
.fav-card-meta { display: flex; gap: 6px; flex-wrap: wrap; }
.fav-card-time { font-size: 12px; color: var(--text-secondary); display: flex; align-items: center; gap: 3px; }
.fav-card-actions { margin-top: auto; display: flex; gap: 6px; padding-top: 6px; }
.book-title-cell { display: flex; align-items: center; gap: 8px; cursor: pointer; }
.table-cover { width: 36px; height: 48px; object-fit: cover; border-radius: 4px; background: #f0f0f0; }
.book-title-link { color: #409eff; cursor: pointer; font-weight: 500; }
.book-title-link:hover { text-decoration: underline; }
.detail-cover {
  width: 100%; aspect-ratio: 3/4; max-height: 260px;
  background: var(--cover-gradient);
  border-radius: 12px;
  display: flex; align-items: center; justify-content: center;
  overflow: hidden;
}
.detail-cover-img { width: 100%; height: 100%; object-fit: cover; border-radius: 12px; }
.detail-info { line-height: 2; }
.detail-title { font-size: 20px; font-weight: 700; color: var(--text-color); margin-bottom: 12px; }
</style>