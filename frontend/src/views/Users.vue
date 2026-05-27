<template>
  <div class="users-page">
    <div class="page-header">
      <h2 class="page-title">用户管理</h2>
      <el-button type="primary" @click="openCreate">
        <el-icon><Plus /></el-icon>新增用户
      </el-button>
    </div>

    <el-card shadow="never" style="border-radius:12px">
      <el-empty v-if="users.length === 0 && !loading" description="暂无用户" :image-size="120" />

      <el-table v-else :data="pagedUsers" stripe style="width:100%" v-loading="loading">
        <el-table-column label="ID" prop="id" width="60" />
        <el-table-column label="用户名" prop="username" width="130" />
        <el-table-column label="显示名" prop="displayName" width="120">
          <template #default="{ row }">{{ row.displayName || '-' }}</template>
        </el-table-column>
        <el-table-column label="角色" width="110">
          <template #default="{ row }">
            <el-tag :type="roleType(row.role)" size="small" effect="dark">
              {{ roleLabel(row.role) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="邮箱" prop="email" min-width="160" show-overflow-tooltip>
          <template #default="{ row }">{{ row.email || '-' }}</template>
        </el-table-column>
        <el-table-column label="电话" prop="phone" width="130">
          <template #default="{ row }">{{ row.phone || '-' }}</template>
        </el-table-column>
        <el-table-column label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.status === 'ACTIVE' ? 'success' : 'danger'" size="small" effect="dark">
              {{ row.status === 'ACTIVE' ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="openEdit(row)">编辑</el-button>
            <el-button
              :type="row.status === 'ACTIVE' ? 'warning' : 'success'"
              link
              size="small"
              @click="toggleStatus(row)"
            >
              {{ row.status === 'ACTIVE' ? '禁用' : '启用' }}
            </el-button>
            <el-button type="danger" link size="small" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-wrapper" v-if="users.length > pageSize">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :total="users.length"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next, jumper"
          background
        />
      </div>
    </el-card>

    <!-- Create/Edit Dialog -->
    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑用户' : '新增用户'" width="520px" destroy-on-close>
      <el-form :model="form" :rules="rules" ref="formRef" label-width="80px" label-position="top">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="用户名" prop="username">
              <el-input v-model="form.username" placeholder="请输入用户名" :disabled="isEdit" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="显示名">
              <el-input v-model="form.displayName" placeholder="请输入显示名" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item v-if="!isEdit" label="密码" prop="password">
          <el-input v-model="form.password" type="password" show-password placeholder="请输入密码" />
        </el-form-item>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="角色" prop="role">
              <el-select v-model="form.role" placeholder="选择角色" style="width:100%">
                <el-option label="管理员" value="ADMIN" />
                <el-option label="图书管理员" value="LIBRARIAN" />
                <el-option label="读者" value="READER" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="状态">
              <el-select v-model="form.status" placeholder="选择状态" style="width:100%">
                <el-option label="启用" value="ACTIVE" />
                <el-option label="禁用" value="DISABLED" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="邮箱">
              <el-input v-model="form.email" placeholder="请输入邮箱" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="手机号">
              <el-input v-model="form.phone" placeholder="请输入手机号" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">
          {{ isEdit ? '更新' : '创建' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { getUsers, getUser, createUser, updateUser, deleteUser } from '@/api/user'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'

const users = ref([])
const loading = ref(false)
const submitting = ref(false)
const dialogVisible = ref(false)
const isEdit = ref(false)
const editId = ref(null)
const formRef = ref(null)
const currentPage = ref(1)
const pageSize = ref(10)
const pagedUsers = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return users.value.slice(start, start + pageSize.value)
})

const form = reactive({
  username: '', displayName: '', password: '', role: 'READER', status: 'ACTIVE', email: '', phone: ''
})

const rules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
  role: [{ required: true, message: '请选择角色', trigger: 'change' }],
}

function roleType(role) {
  return { ADMIN: '', LIBRARIAN: 'success', READER: 'info' }[role] || 'info'
}

function roleLabel(role) {
  return { ADMIN: '管理员', LIBRARIAN: '图书管理员', READER: '读者' }[role] || '未知'
}

async function loadUsers() {
  loading.value = true
  currentPage.value = 1
  try {
    const res = await getUsers()
    if (res.code === 200) users.value = res.data
  } catch (e) { ElMessage.error('加载失败') }
  finally { loading.value = false }
}

function openCreate() {
  isEdit.value = false
  editId.value = null
  Object.assign(form, { username: '', displayName: '', password: '', role: 'READER', status: 'ACTIVE', email: '', phone: '' })
  dialogVisible.value = true
}

async function openEdit(user) {
  isEdit.value = true
  editId.value = user.id
  try {
    const res = await getUser(user.id)
    if (res.code === 200) {
      const u = res.data
      Object.assign(form, {
        username: u.username, displayName: u.displayName || '', password: '',
        role: u.role, status: u.status, email: u.email || '', phone: u.phone || ''
      })
    }
  } catch (e) { ElMessage.error('获取用户信息失败') }
  dialogVisible.value = true
}

async function handleSubmit() {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return
  submitting.value = true
  try {
    const data = { ...form }
    const res = isEdit.value
      ? await updateUser(editId.value, data)
      : await createUser(data)
    if (res.code === 200) {
      ElMessage.success(isEdit.value ? '更新成功' : '创建成功')
      dialogVisible.value = false
      loadUsers()
    } else {
      ElMessage.error(res.message)
    }
  } catch (e) { ElMessage.error('操作失败') }
  finally { submitting.value = false }
}

async function toggleStatus(user) {
  const action = user.status === 'ACTIVE' ? '禁用' : '启用'
  try {
    await ElMessageBox.confirm(`确认${action}用户 "${user.username}"？`, '操作确认', { type: 'warning' })
    const newStatus = user.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE'
    const res = await updateUser(user.id, { status: newStatus })
    if (res.code === 200) {
      ElMessage.success(`${action}成功`)
      loadUsers()
    }
  } catch (e) {}
}

async function handleDelete(user) {
  try {
    await ElMessageBox.confirm(`确认删除用户 "${user.username}"？`, '删除确认', { type: 'warning' })
    const res = await deleteUser(user.id)
    if (res.code === 200) {
      ElMessage.success('删除成功')
      loadUsers()
    }
  } catch (e) {}
}

onMounted(loadUsers)
</script>

<style scoped>
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}
.page-title { font-size: 22px; font-weight: 600; color: #303133; }
</style>