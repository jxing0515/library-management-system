<template>
  <div class="books-page">
    <div class="page-header">
      <h2 class="page-title">图书浏览</h2>
      <div class="header-actions">
        <el-button v-if="userStore.isAdmin() || userStore.isLibrarian()" type="primary" @click="router.push('/books/manage')">
          <el-icon><Plus /></el-icon>新增图书
        </el-button>
      </div>
    </div>

    <!-- Search -->
    <el-card shadow="never" class="search-card">
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="关键词">
          <el-input v-model="searchForm.keyword" placeholder="书名 / 作者 / ISBN" clearable style="width:260px" @keyup.enter="handleSearch">
            <template #prefix><el-icon><Search /></el-icon></template>
          </el-input>
        </el-form-item>
        <el-form-item label="分类">
          <el-select v-model="searchForm.categoryId" placeholder="全部分类" clearable style="width:180px">
            <el-option v-for="c in categories" :key="c.id" :label="c.name" :value="c.id" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">
            <el-icon><Search /></el-icon> 搜索
          </el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- Book Grid -->
    <div v-if="books.length > 0" class="book-grid">
      <div v-for="book in pagedBooks" :key="book.id" class="book-card" @click="showDetail(book)">
        <div class="book-cover">
          <img v-if="book.coverUrl" :src="book.coverUrl" class="cover-img" />
          <div v-else class="cover-placeholder">
            <el-icon :size="40"><Reading /></el-icon>
          </div>
          <div class="book-badge" v-if="book.available <= 0" style="background:#f56c6c">已借完</div>
        </div>
        <div class="book-info">
          <div class="book-title">{{ book.title }}</div>
          <div class="book-author">{{ book.author }}</div>
          <div class="book-meta">
            <span class="meta-item">
              <el-icon><Coin /></el-icon>
              库存 {{ book.available }}/{{ book.quantity }}
            </span>
          </div>
          <div class="book-actions">
            <el-button v-if="userStore.isLoggedIn() && book.available > 0" size="small" type="primary"
              @click.stop="handleBorrow(book)">
              立即借阅
            </el-button>
            <el-button v-if="userStore.isLoggedIn()" size="small"
              :type="favoriteMap[book.id] ? 'warning' : 'default'"
              @click.stop="handleToggleFavorite(book)">
              <el-icon><StarFilled v-if="favoriteMap[book.id]" /><Star v-else /></el-icon>
              {{ favoriteMap[book.id] ? '已收藏' : '收藏' }}
            </el-button>
          </div>
        </div>
      </div>
    </div>

    <el-empty v-else description="暂无图书" :image-size="120" />

    <!-- Pagination -->
    <div class="pagination-wrapper" v-if="books.length > pageSize">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :total="books.length"
        :page-sizes="[12, 24, 48]"
        layout="total, sizes, prev, pager, next, jumper"
        background
      />
    </div>

    <!-- Detail Dialog -->
    <el-dialog v-model="detailVisible" :title="detailBook?.title" width="700px" destroy-on-close>
      <el-row v-if="detailBook" :gutter="24">
        <el-col :span="8">
          <div class="detail-cover">
            <img v-if="detailBook.coverUrl" :src="detailBook.coverUrl" class="detail-cover-img" />
            <el-icon v-else :size="60"><Reading /></el-icon>
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
              <el-button v-if="userStore.isLoggedIn() && detailBook.available > 0" type="primary"
                :loading="borrowLoading" @click="handleBorrow(detailBook)">
                借阅此书
              </el-button>
              <el-button v-if="userStore.isLoggedIn()"
                :type="favoriteMap[detailBook.id] ? 'warning' : 'default'"
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
import { ref, computed, onMounted, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { searchBooks, getBooks } from '@/api/book'
import { borrowBook } from '@/api/borrow'
import { checkFavorited, addFavorite, removeFavorite } from '@/api/favorite'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Reading, Coin, Star, StarFilled, Plus } from '@element-plus/icons-vue'

const router = useRouter()
const userStore = useUserStore()

const books = ref([])
const categories = ref([])
const loading = ref(false)
const borrowLoading = ref(false)
const detailVisible = ref(false)
const detailBook = ref(null)
const favoriteMap = reactive({})

const searchForm = reactive({
  keyword: '',
  categoryId: null
})
const currentPage = ref(1)
const pageSize = ref(12)
const pagedBooks = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return books.value.slice(start, start + pageSize.value)
})

// Load categories
async function loadCategories() {
  const { getCategories } = await import('@/api/category')
  const res = await getCategories()
  if (res.code === 200) categories.value = res.data
}

// Load books
async function loadBooks() {
  loading.value = true
  currentPage.value = 1
  try {
    const res = await getBooks()
    if (res.code === 200) {
      books.value = res.data
      await loadFavoriteStatus()
    }
  } catch (e) {
    ElMessage.error('加载图书失败')
  } finally {
    loading.value = false
  }
}

// Load favorite status for all books
async function loadFavoriteStatus() {
  if (!userStore.isLoggedIn()) return
  for (const book of books.value) {
    try {
      const res = await checkFavorited(userStore.user.id, book.id)
      if (res.code === 200) favoriteMap[book.id] = res.data
    } catch (e) {}
  }
}

// Toggle favorite
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
      }
    }
  } catch (e) {
    ElMessage.error('操作失败')
  }
}

// Search
async function handleSearch() {
  loading.value = true
  currentPage.value = 1
  try {
    const res = await searchBooks({
      keyword: searchForm.keyword || null,
      categoryId: searchForm.categoryId
    })
    if (res.code === 200) {
      books.value = res.data
      await loadFavoriteStatus()
    }
  } catch (e) {
    ElMessage.error('搜索失败')
  } finally {
    loading.value = false
  }
}

function resetSearch() {
  searchForm.keyword = ''
  searchForm.categoryId = null
  loadBooks()
}

// Detail
function showDetail(book) {
  detailBook.value = book
  detailVisible.value = true
}

// Borrow
async function handleBorrow(book) {
  if (!userStore.isLoggedIn()) {
    ElMessage.warning('请先登录')
    router.push('/login')
    return
  }
  try {
    await ElMessageBox.confirm(
      '确认借阅《' + book.title + '》？借阅期限为 30 天。',
      '确认借阅',
      { confirmButtonText: '确认借阅', cancelButtonText: '取消', type: 'info' }
    )
    borrowLoading.value = true
    const res = await borrowBook(userStore.user.id, book.id)
    if (res.code === 200) {
      ElMessage.success('借阅成功！请按时归还。')
      loadBooks()
    } else {
      ElMessage.error(res.message || '借阅失败')
    }
  } catch (e) {
    if (e !== 'cancel') {
      ElMessage.error('借阅失败，请稍后重试')
    }
  } finally {
    borrowLoading.value = false
  }
}

onMounted(() => {
  loadCategories()
  loadBooks()
})
</script>

<style scoped>
.books-page { max-width: 1200px; margin: 0 auto; }
.page-header {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 20px;
}
.page-title { font-size: 22px; font-weight: 600; color: var(--text-color); }

.search-card { margin-bottom: 24px; border-radius: 12px; }

.book-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 20px;
}

.book-card {
  background: var(--card-bg);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0,0,0,0.06);
  cursor: pointer;
  transition: all 0.25s ease;
}
.book-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(64,158,255,0.15);
}

.book-cover {
  height: 180px;
  background: linear-gradient(135deg, #f5f7fa, #ecf5ff);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}
.cover-img {
  width: 100%; height: 100%; object-fit: cover;
}
.cover-placeholder {
  display: flex; align-items: center; justify-content: center;
  width: 100%; height: 100%;
  color: #c0c4cc;
}
.book-badge {
  position: absolute; top: 10px; right: 10px;
  background: #409eff; color: #fff;
  padding: 2px 10px; border-radius: 10px;
  font-size: 12px; font-weight: 500;
}

.book-info { padding: 14px; }
.book-title {
  font-size: 15px; font-weight: 600; color: var(--text-color);
  margin-bottom: 4px;
  white-space: nowrap; overflow: hidden;
  text-overflow: ellipsis;
}
.book-title:hover { color: #409eff; }
.book-author {
  font-size: 13px; color: var(--text-secondary); margin-bottom: 8px;
}
.book-meta { display: flex; gap: 16px; margin-bottom: 4px; }
.meta-item {
  display: flex; align-items: center; gap: 4px;
  font-size: 12px; color: var(--text-secondary);
}
.book-actions { margin-top: 4px; display: flex; gap: 6px; flex-wrap: wrap; }

.detail-cover {
  width: 100%; aspect-ratio: 3/4; max-height: 260px;
  background: linear-gradient(135deg, #f5f7fa, #ecf5ff);
  border-radius: 12px;
  display: flex; align-items: center; justify-content: center;
  overflow: hidden;
}
.detail-cover-img {
  width: 100%; height: 100%; object-fit: cover; border-radius: 12px;
}
.detail-info { line-height: 2; }
.detail-title { font-size: 20px; font-weight: 700; color: var(--text-color); margin-bottom: 12px; }
.detail-author, .detail-isbn, .detail-publisher, .detail-category, .detail-stock, .detail-desc {
  font-size: 14px; color: var(--text-color);
}

@media (max-width: 768px) {
  .book-grid { grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); }
}
</style>