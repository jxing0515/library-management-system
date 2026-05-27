<template>
  <div class="book-manage">
    <div class="page-header">
      <h2 class="page-title">图书管理</h2>
      <div class="header-actions">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索书名 / 作者 / ISBN"
          clearable
          style="width:220px"
          @keyup.enter="handleSearch"
        >
          <template #prefix><el-icon><Search /></el-icon></template>
        </el-input>
        <el-select v-model="searchCategoryId" placeholder="全部分类" clearable style="width:160px" @change="handleSearch">
          <el-option v-for="c in categories" :key="c.id" :label="c.name" :value="c.id" />
        </el-select>
        <el-button type="primary" @click="handleSearch">
          <el-icon><Search /></el-icon>搜索
        </el-button>
        <el-button @click="resetSearch">重置</el-button>
        <el-button type="primary" @click="goAdd">
          <el-icon><Plus /></el-icon>新增图书
        </el-button>
      </div>
    </div>

    <el-card shadow="never" class="table-card">
      <el-empty v-if="books.length === 0 && !loading" description="暂无图书" :image-size="120" />

      <el-table v-else :data="pagedBooks" stripe style="width:100%" v-loading="loading" @row-click="showDetail">
        <el-table-column label="封面" width="80">
          <template #default="{ row }">
<div class="table-cover">
              <img v-if="row.coverUrl" :src="row.coverUrl" class="table-cover-img" />
              <el-icon v-else :size="24" color="#c0c4cc"><Picture /></el-icon>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="书名" prop="title" min-width="180" show-overflow-tooltip />
        <el-table-column label="作者" prop="author" width="150" show-overflow-tooltip />
        <el-table-column label="ISBN" prop="isbn" width="140" />
        <el-table-column label="分类" width="100">
          <template #default="{ row }">{{ row.category?.name || '-' }}</template>
        </el-table-column>
        <el-table-column label="库存" width="100">
          <template #default="{ row }">
            <span :class="{ 'text-danger': row.available === 0 }">
              {{ row.available }} / {{ row.quantity }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="140" fixed="right">
          <template #default="{ row, $index }">
            <el-button type="primary" size="small" @click.stop="goEdit(row)">编辑</el-button>
            <el-button type="danger" size="small" @click.stop="handleDelete(row, $index)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <div class="pagination-wrapper" v-if="books.length > pageSize">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :total="books.length"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next, jumper"
        background
      />
    </div>

    <!-- Detail Dialog -->
    <el-dialog v-model="detailVisible" title="图书详情" width="600px" destroy-on-close>
      <template v-if="detailBook">
        <el-row :gutter="20">
          <el-col :span="8">
            <div class="detail-cover">
              <img v-if="detailBook.coverUrl" :src="detailBook.coverUrl" style="width:100%;height:100%;object-fit:cover;border-radius:8px" />
              <el-icon v-else :size="64" color="#c0c4cc"><Picture /></el-icon>
            </div>
          </el-col>
          <el-col :span="16">
            <div class="detail-info">
              <div class="detail-title">{{ detailBook.title }}</div>
              <div class="detail-author">作者：{{ detailBook.author }}</div>
              <div class="detail-isbn">ISBN：{{ detailBook.isbn || '-' }}</div>
              <div class="detail-publisher">出版社：{{ detailBook.publisher || '-' }}</div>
              <div class="detail-category">分类：{{ detailBook.category?.name || '-' }}</div>
              <div class="detail-stock">
                库存：<span :class="{ 'text-danger': detailBook.available === 0 }">
                  {{ detailBook.available }} / {{ detailBook.quantity }}
                </span>
              </div>
              <div v-if="detailBook.description" class="detail-desc" style="margin-top:8px">
                简介：{{ detailBook.description }}
              </div>
            </div>
          </el-col>
        </el-row>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getBooks, searchBooks, deleteBook } from '@/api/book'
import { getCategories } from '@/api/category'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Plus } from '@element-plus/icons-vue'

const router = useRouter()
const books = ref([])
const categories = ref([])
const loading = ref(false)
const detailVisible = ref(false)
const detailBook = ref(null)
const searchKeyword = ref('')
const searchCategoryId = ref(null)
const currentPage = ref(1)
const pageSize = ref(10)
const pagedBooks = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return books.value.slice(start, start + pageSize.value)
})

function goAdd() {
  router.push('/books/manage/add')
}

function goEdit(book) {
  router.push('/books/manage/edit/' + book.id)
}

async function loadBooks() {
  loading.value = true
  currentPage.value = 1
  try {
    const res = await getBooks()
    if (res.code === 200) {
      books.value = res.data
    }
  } catch (e) {}
  finally { loading.value = false }
}

async function handleSearch() {
  currentPage.value = 1
  loading.value = true
  try {
    const params = {}
    if (searchKeyword.value) params.keyword = searchKeyword.value
    if (searchCategoryId.value) params.categoryId = searchCategoryId.value
    const res = await searchBooks(params)
    if (res.code === 200) {
      books.value = res.data
    }
  } catch (e) {
    ElMessage.error('搜索失败')
  } finally {
    loading.value = false
  }
}

function resetSearch() {
  searchKeyword.value = ''
  searchCategoryId.value = null
  loadBooks()
}

function showDetail(row) {
  detailBook.value = row
  detailVisible.value = true
}

async function handleDelete(row) {
  try {
    await ElMessageBox.confirm(`确认删除图书 "${row.title}"？`, '删除确认', { type: 'warning' })
    const res = await deleteBook(row.id)
    if (res.code === 200) {
      ElMessage.success('删除成功')
      loadBooks()
    } else {
      ElMessage.error(res.message)
    }
  } catch (e) {}
}

onMounted(async () => {
  loadBooks()
  try {
    const res = await getCategories()
    if (res.code === 200) categories.value = res.data
  } catch (e) {}
})
</script>

<style scoped>
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 20px;
}
.page-title { font-size: 22px; font-weight: 600; color: var(--text-color); }
.header-actions { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }

.table-card {
  border-radius: 12px;
  border: 1px solid var(--card-border);
  background: var(--card-bg);
}

.text-danger { color: #f56c6c; font-weight: 600; }

.table-cover {
  width: 50px;
  aspect-ratio: 3/4;
  border-radius: 6px;
  overflow: hidden;
  background: linear-gradient(135deg,#f5f7fa,#ecf5ff);
  display: flex;
  align-items: center;
  justify-content: center;
}
.table-cover-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.detail-cover {
  width: 100%;
  aspect-ratio: 3/4;
  max-height: 260px;
  background: linear-gradient(135deg, #f5f7fa, #ecf5ff);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}
.detail-info { line-height: 2; }
.detail-title { font-size: 20px; font-weight: 700; color: var(--text-color); margin-bottom: 12px; }
.detail-author, .detail-isbn, .detail-publisher, .detail-category, .detail-stock, .detail-desc {
  font-size: 14px; color: var(--text-color);
}
</style>