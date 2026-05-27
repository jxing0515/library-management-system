<template>
  <div class="borrows-page">
    <div class="page-header">
      <h2 class="page-title">借阅管理</h2>
      <div class="header-actions">
        <el-input
          v-model="filterKeyword"
          placeholder="搜索书名 / 借阅人"
          clearable
          style="width:200px"
          @keyup.enter="loadData"
        >
          <template #prefix><el-icon><Search /></el-icon></template>
        </el-input>
        <el-select v-model="filterStatus" placeholder="借阅状态" clearable style="width:130px" @change="loadData">
          <el-option label="借出中" value="BORROWED" />
          <el-option label="已归还" value="RETURNED" />
          <el-option label="已逾期" value="OVERDUE" />
        </el-select>
        <el-button type="primary" @click="loadData">
          <el-icon><Search /></el-icon>搜索
        </el-button>
      </div>
    </div>

    <el-card shadow="never" class="table-card">
      <!-- Quick stats -->
      <div class="quick-stats" v-if="records.length > 0">
        <span class="stat-item stat-borrowed"><span class="stat-dot"></span>借出中：{{ countByStatus('BORROWED') }}</span>
        <span class="stat-item stat-returned"><span class="stat-dot"></span>已归还：{{ countByStatus('RETURNED') }}</span>
        <span class="stat-item stat-overdue"><span class="stat-dot"></span>已逾期：{{ countByStatus('OVERDUE') }}</span>
      </div>

      <el-empty v-if="records.length === 0 && !loading" description="暂无借阅记录" :image-size="120" />

      <el-table v-else :data="pagedRecords" stripe style="width:100%" v-loading="loading">
        <el-table-column label="ID" prop="id" width="60" />
        <el-table-column label="借阅人" width="120">
          <template #default="{ row }">{{ row.user?.displayName || row.user?.username }}</template>
        </el-table-column>
        <el-table-column label="图书" min-width="180" show-overflow-tooltip>
          <template #default="{ row }">{{ row.book?.title }}</template>
        </el-table-column>
        <el-table-column label="借书日期" width="115">
          <template #default="{ row }">{{ row.borrowDate }}</template>
        </el-table-column>
        <el-table-column label="应还日期" width="115">
          <template #default="{ row }">
            <span :class="{ 'overdue-date': isOverdue(row) }">{{ row.dueDate }}</span>
          </template>
        </el-table-column>
        <el-table-column label="归还日期" width="115">
          <template #default="{ row }">{{ row.returnDate || '-' }}</template>
        </el-table-column>
        <el-table-column label="状态" width="90">
          <template #default="{ row }">
            <el-tag :type="statusType(row.status)" size="small" effect="dark">
              {{ statusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="160" fixed="right">
          <template #default="{ row }">
            <el-button v-if="row.status === 'BORROWED'" type="success" link size="small" @click="handleReturn(row)">
              归还
            </el-button>
            <el-button v-if="row.status === 'BORROWED'" type="warning" link size="small" @click="handleRenew(row)">
              续借
            </el-button>
            <span v-else style="color:#c0c4cc;font-size:13px">-</span>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-wrapper" v-if="records.length > pageSize">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :total="records.length"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next, jumper"
          background
        />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { searchBorrowRecords, returnBook, renewBook } from '@/api/borrow'
import { ElMessage, ElMessageBox } from 'element-plus'

const records = ref([])
const loading = ref(false)
const filterStatus = ref(null)
const filterKeyword = ref('')
const currentPage = ref(1)
const pageSize = ref(10)
const pagedRecords = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return records.value.slice(start, start + pageSize.value)
})

async function loadData() {
  loading.value = true
  currentPage.value = 1
  try {
    const params = {}
    if (filterStatus.value) params.status = filterStatus.value
    if (filterKeyword.value) params.keyword = filterKeyword.value
    const res = await searchBorrowRecords(params)
    if (res.code === 200) records.value = res.data
  } catch (e) {
    ElMessage.error('加载失败')
  } finally {
    loading.value = false
  }
}

function countByStatus(status) {
  return records.value.filter(r => r.status === status).length
}

function isOverdue(row) {
  if (row.status !== 'BORROWED') return false
  return new Date(row.dueDate) < new Date()
}

function statusType(status) {
  return { BORROWED: 'warning', RETURNED: 'success', OVERDUE: 'danger' }[status] || 'info'
}

function statusLabel(status) {
  return { BORROWED: '借出中', RETURNED: '已归还', OVERDUE: '已逾期' }[status] || status
}

async function handleReturn(record) {
  try {
    await ElMessageBox.confirm(`确认归还《${record.book?.title}》？`, '确认归还', { type: 'info' })
    const res = await returnBook(record.id)
    if (res.code === 200) {
      ElMessage.success('归还成功')
      loadData()
    } else {
      ElMessage.error(res.message)
    }
  } catch (e) {}
}

async function handleRenew(record) {
  try {
    await ElMessageBox.confirm(`确认续借《${record.book?.title}》？续借将延长 14 天。`, '确认续借', { type: 'info' })
    const res = await renewBook(record.id)
    if (res.code === 200) {
      ElMessage.success('续借成功')
      loadData()
    } else {
      ElMessage.error(res.message)
    }
  } catch (e) {}
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}
.page-title { font-size: 22px; font-weight: 600; color: var(--text-color); }
.header-actions { display: flex; gap: 12px; align-items: center; }

.table-card { border-radius: 12px; border: 1px solid var(--card-border); background: var(--card-bg); }

.quick-stats {
  display: flex;
  gap: 20px;
  padding: 12px 16px;
  margin-bottom: 12px;
  background: var(--bg-secondary);
  border-radius: 10px;
}
.stat-item { font-size: 13px; color: var(--text-color); display: flex; align-items: center; gap: 6px; }
.stat-dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; }
.stat-borrowed .stat-dot { background: #e6a23c; }
.stat-returned .stat-dot { background: #67c23a; }
.stat-overdue .stat-dot { background: #f56c6c; }

.overdue-date { color: #f56c6c; font-weight: 600; }
</style>