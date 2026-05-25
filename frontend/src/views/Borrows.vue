<template>
  <div class="borrows-page">
    <div class="page-header">
      <h2 class="page-title">借阅管理</h2>
      <div class="header-actions">
        <el-select v-model="filterUser" placeholder="选择用户" clearable style="width:170px" @change="loadData">
          <el-option v-for="u in users" :key="u.id" :label="u.displayName || u.username" :value="u.id" />
        </el-select>
        <el-select v-model="filterStatus" placeholder="借阅状态" clearable style="width:130px" @change="loadData">
          <el-option label="借出中" value="BORROWED" />
          <el-option label="已归还" value="RETURNED" />
          <el-option label="已逾期" value="OVERDUE" />
        </el-select>
        <el-button @click="loadData">
          <el-icon><Refresh /></el-icon>刷新
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

      <el-table v-else :data="records" stripe style="width:100%" v-loading="loading">
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
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { searchBorrowRecords, returnBook, renewBook } from '@/api/borrow'
import { getUsers } from '@/api/user'
import { ElMessage, ElMessageBox } from 'element-plus'

const records = ref([])
const users = ref([])
const loading = ref(false)
const filterUser = ref(null)
const filterStatus = ref(null)

async function loadData() {
  loading.value = true
  try {
    const params = {}
    if (filterUser.value) params.userId = filterUser.value
    if (filterStatus.value) params.status = filterStatus.value
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

onMounted(async () => {
  loadData()
  try {
    const res = await getUsers()
    if (res.code === 200) users.value = res.data
  } catch (e) {}
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