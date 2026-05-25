<template>
  <div class="profile-page">
    <h2 class="page-title">个人中心</h2>

    <el-row :gutter="24">
      <!-- Left: User Info Card -->
      <el-col :span="8">
        <el-card shadow="never" class="info-card">
          <div class="avatar-section">
            <div class="avatar-wrapper" @click="triggerUpload">
              <el-avatar :size="80" :src="avatarUrl" style="font-size:32px;cursor:pointer"
                :style="avatarUrl ? '' : 'background:linear-gradient(135deg,#409eff,#337ecc)'">
                <span v-if="!avatarUrl">{{ userStore.user?.displayName?.charAt(0) || 'U' }}</span>
              </el-avatar>
              <div class="avatar-overlay">
                <el-icon :size="20"><Camera /></el-icon>
                <span>更换头像</span>
              </div>
            </div>
            <input
              ref="fileInput"
              type="file"
              accept="image/*"
              style="display:none"
              @change="handleFileChange"
            />
            <h3>{{ userStore.user?.displayName || userStore.user?.username }}</h3>
            <el-tag :type="roleTagType" effect="dark" size="small" style="margin-top:8px">
              {{ roleLabel }}
            </el-tag>
          </div>
          <el-divider />
          <div class="info-list">
            <div class="info-item">
              <el-icon color="#909399"><User /></el-icon>
              <span class="info-label">用户名</span>
              <span class="info-value">{{ userStore.user?.username }}</span>
            </div>
            <div class="info-item">
              <el-icon color="#909399"><Message /></el-icon>
              <span class="info-label">邮箱</span>
              <span class="info-value">{{ userStore.user?.email || '未设置' }}</span>
            </div>
            <div class="info-item">
              <el-icon color="#909399"><Iphone /></el-icon>
              <span class="info-label">手机</span>
              <span class="info-value">{{ userStore.user?.phone || '未设置' }}</span>
            </div>
            <div class="info-item">
              <el-icon color="#909399"><Calendar /></el-icon>
              <span class="info-label">注册时间</span>
              <span class="info-value">{{ userStore.user?.createdAt ? formatDate(userStore.user.createdAt) : '-' }}</span>
            </div>
          </div>
        </el-card>
      </el-col>

      <!-- Right: Edit Form -->
      <el-col :span="16">
        <el-card shadow="never" class="form-card">
          <template #header>
            <div class="card-header">
              <el-icon color="#409eff"><Edit /></el-icon>
              <span>编辑个人信息</span>
            </div>
          </template>
          <el-form :model="form" label-width="80px" class="profile-form">
            <el-form-item label="显示名称">
              <el-input v-model="form.displayName" placeholder="请输入显示名称" />
            </el-form-item>
            <el-form-item label="邮箱">
              <el-input v-model="form.email" placeholder="请输入邮箱" />
            </el-form-item>
            <el-form-item label="手机号">
              <el-input v-model="form.phone" placeholder="请输入手机号" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="saveProfile" :loading="saving">
                保存修改
              </el-button>
            </el-form-item>
          </el-form>
        </el-card>

        <!-- Password Card -->
        <el-card shadow="never" class="form-card" style="margin-top:20px">
          <template #header>
            <div class="card-header">
              <el-icon color="#e6a23c"><Lock /></el-icon>
              <span>修改密码</span>
            </div>
          </template>
          <el-form :model="passwordForm" label-width="80px">
            <el-form-item label="新密码">
              <el-input v-model="passwordForm.newPassword" type="password" placeholder="请输入新密码" show-password />
            </el-form-item>
            <el-form-item label="确认密码">
              <el-input v-model="passwordForm.confirmPassword" type="password" placeholder="请再次输入新密码" show-password />
            </el-form-item>
            <el-form-item>
              <el-button type="warning" @click="changePassword" :loading="changingPwd">
                修改密码
              </el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useUserStore } from '@/stores/user'
import { getUser, updateUser, uploadAvatar } from '@/api/user'
import { ElMessage } from 'element-plus'

const userStore = useUserStore()
const fileInput = ref(null)
const saving = ref(false)
const changingPwd = ref(false)

const form = ref({
  displayName: '',
  email: '',
  phone: ''
})

const passwordForm = ref({
  newPassword: '',
  confirmPassword: ''
})

const avatarUrl = computed(() => {
  if (userStore.user?.avatar) {
    return userStore.user.avatar
  }
  return null
})

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

function formatDate(dateStr) {
  if (!dateStr) return '-'
  return dateStr.substring(0, 10)
}

function triggerUpload() {
  fileInput.value?.click()
}

async function handleFileChange(e) {
  const selectedFile = e.target.files?.[0]
  if (!selectedFile) return

  if (!selectedFile.type.startsWith('image/')) {
    ElMessage.error('请选择图片文件')
    return
  }

  if (selectedFile.size > 5 * 1024 * 1024) {
    ElMessage.error('文件大小不能超过5MB')
    return
  }

  try {
    const res = await uploadAvatar(userStore.user.id, selectedFile)
    if (res.code === 200) {
      ElMessage.success('头像上传成功')
      userStore.setUserAvatar(res.data)
    } else {
      ElMessage.error(res.message || '头像上传失败')
    }
  } catch (e) {
    ElMessage.error('头像上传失败: ' + (e.message || '未知错误'))
  } finally {
    if (fileInput.value) {
      fileInput.value.value = ''
    }
  }
}

async function saveProfile() {
  saving.value = true
  try {
    const res = await updateUser(userStore.user.id, form.value)
    if (res.code === 200) {
      ElMessage.success('保存成功')
      const updatedUser = { ...userStore.user, ...form.value }
      userStore.setUser(updatedUser, userStore.token)
    } else {
      ElMessage.error(res.message || '保存失败')
    }
  } catch (e) {
    ElMessage.error('保存失败: ' + (e.message || '未知错误'))
  } finally {
    saving.value = false
  }
}

async function changePassword() {
  if (!passwordForm.value.newPassword) {
    ElMessage.warning('请输入新密码')
    return
  }
  if (!passwordForm.value.confirmPassword) {
    ElMessage.warning('请再次输入新密码')
    return
  }
  if (passwordForm.value.newPassword !== passwordForm.value.confirmPassword) {
    ElMessage.error('两次输入的密码不一致')
    return
  }
  changingPwd.value = true
  try {
    const res = await updateUser(userStore.user.id, { password: passwordForm.value.newPassword })
    if (res.code === 200) {
      ElMessage.success('密码修改成功')
      passwordForm.value.newPassword = ''
      passwordForm.value.confirmPassword = ''
    } else {
      ElMessage.error(res.message || '密码修改失败')
    }
  } catch (e) {
    ElMessage.error('密码修改失败: ' + (e.message || '未知错误'))
  } finally {
    changingPwd.value = false
  }
}

onMounted(async () => {
  try {
    const res = await getUser(userStore.user.id)
    if (res.code === 200) {
      form.value.displayName = res.data.displayName || ''
      form.value.email = res.data.email || ''
      form.value.phone = res.data.phone || ''
    }
  } catch (e) {}
})
</script>

<style scoped>
.page-title {
  font-size: 22px; font-weight: 600;
  color: var(--text-color);
  margin-bottom: 20px;
}

.info-card, .form-card {
  border-radius: 14px;
  border: 1px solid var(--card-border);
  background: var(--card-bg);
}

.avatar-section {
  text-align: center;
  padding: 8px 0 16px;
}

.avatar-wrapper {
  position: relative;
  display: inline-block;
  cursor: pointer;
}

.avatar-wrapper:hover .avatar-overlay {
  opacity: 1;
}

.avatar-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 12px;
  gap: 2px;
  opacity: 0;
  transition: opacity 0.3s;
  pointer-events: none;
}

.avatar-section h3 {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-color);
  margin-top: 14px;
}

.info-list { display: flex; flex-direction: column; gap: 14px; }
.info-item {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
}
.info-label { color: #909399; width: 50px; flex-shrink: 0; }
.info-value { color: var(--text-color); font-weight: 500; }

.card-header {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 600;
}

@media (max-width: 992px) {
  .el-row { flex-direction: column; }
}
</style>