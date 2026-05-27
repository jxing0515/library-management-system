<template>
  <div class="my-borrows">
    <div class="page-header">
      <h2 class="page-title">我的借阅</h2>
      <el-tag type="warning" size="large" effect="dark" v-if="activeCount > 0">
        当前借出 {{ activeCount }} 本
      </el-tag>
      <el-tag type="success" size="large" effect="plain" v-else>
        无在借图书
      </el-tag>
    </div>

    <!-- Overdue Warning -->
    <el-alert
      v-if="overdueCount > 0"
      :title="`您有 ${overdueCount} 本图书已逾期，请尽快归还！`"
      type="error"
      :closable="false"
      show-icon
      style="margin-bottom:20px;border-radius:10px"
    />

    <el-card shadow="never" style="border-radius:12px">
      <el-empty v-if="records.length === 0 && !loading" description="暂无借阅记录" :image-size="120">
        <el-button type="primary" @click="$router.push('/books')">去借书</el-button>
      </el-empty>

      <el-table v-else :data="pagedRecords" stripe style="width:100%" v-loading="loading">
        <el-table-column label="书名" min-width="200" show-overflow-tooltip>
          <template #default="{ row }">{{ row.book?.title }}</template>
        </el-table-column>
        <el-table-column label="作者" width="140">
          <template #default="{ row }">{{ row.book?.author }}</template>
        </el-table-column>
        <el-table-column label="借书日期" width="115">
          <template #default="{ row }">{{ row.borrowDate }}</template>
        </el-table-column>
        <el-table-column label="应还日期" width="120">
          <template #default="{ row }">
            <span :class="{ 'overdue-date': isOverdue(row) }">
              {{ row.dueDate }}
              <el-tag v-if="isOverdue(row)" type="danger" size="small" effect="dark" style="margin-left:4px">逾期</el-tag>
            </span>
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
        <el-table-column label="操作" width="80">
          <template #default="{ row }">
            <el-button v-if="row.status === 'BORROWED'" type="primary" link size="small" @click="handleRenew(row)">
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
import { useUserStore } from '@/stores/user'
import { getUserBorrowRecords, renewBook } from '@/api/borrow'
import { ElMessage, ElMessageBox } from 'element-plus'

const userStore = useUserStore()
const records = ref([])
const loading = ref(false)
const currentPage = ref(1)
const pageSize = ref(10)
const pagedRecords = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return records.value.slice(start, start + pageSize.value)
})

const activeCount = computed(() => records.value.filter(r => r.status === 'BORROWED').length)
const overdueCount = computed(() => records.value.filter(r => isOverdue(r)).length)

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

async function loadData() {
  loading.value = true
  currentPage.value = 1
  try {
    const res = await getUserBorrowRecords(userStore.user.id)
    if (res.code === 200) records.value = res.data
  } catch (e) {
    ElMessage.error('加载失败')
  } finally {
    loading.value = false
  }
}

async function handleRenew(record) {
  try {
    await ElMessageBox.confirm(`确认续借《${record.book?.title}》？将延长 14 天。`, '确认续借', { type: 'info' })
    const res = await renewBook(record.id)
    if (res.code === 200) {
      ElMessage.success('续借成功')
      loadData()
    } else {
      ElMessage.error(res.message)
    }
  } catch (e) {}
}

onMounted(loadData)
</script>

<style scoped>
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}
.page-title { font-size: 22px; font-weight: 600; color: var(--text-color); }

.overdue-date { color: #f56c6c; font-weight: 600; }
</style>