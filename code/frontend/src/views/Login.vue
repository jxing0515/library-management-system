<template>
  <div class="login-container">
    <div class="login-bg">
      <div class="bg-shape shape-1"></div>
      <div class="bg-shape shape-2"></div>
      <div class="bg-shape shape-3"></div>
    </div>
    <div class="login-card">
      <div class="login-header">
        <div class="login-icon">
          <el-icon :size="44" color="#409eff"><Reading /></el-icon>
        </div>
        <h1 class="login-title">智慧图书管理系统</h1>
        <p class="login-desc">Smart Library Management System</p>
      </div>

      <!-- Tab Switch -->
      <div class="tab-switch">
        <span class="tab-item" :class="{ active: tab === 'login' }" @click="switchTab('login')">
          登录
        </span>
        <span class="tab-item" :class="{ active: tab === 'register' }" @click="switchTab('register')">
          读者注册
        </span>
      </div>

      <!-- Login Form -->
      <transition name="fade-slide" mode="out-in">
        <el-form
          v-if="tab === 'login'"
          key="login"
          ref="loginFormRef"
          :model="loginForm"
          :rules="loginRules"
          class="login-form"
          @keyup.enter="handleLogin"
        >
          <el-form-item prop="username">
            <el-input
              v-model="loginForm.username"
              placeholder="请输入用户名"
              size="large"
              :prefix-icon="User"
              clearable
            />
          </el-form-item>
          <el-form-item prop="password">
            <el-input
              v-model="loginForm.password"
              type="password"
              placeholder="请输入密码"
              size="large"
              :prefix-icon="Lock"
              show-password
              @keyup.enter="handleLogin"
            />
          </el-form-item>
          <el-form-item>
            <el-button
              type="primary"
              size="large"
              class="submit-btn"
              :loading="loginLoading"
              @click="handleLogin"
            >
              {{ loginLoading ? '登录中...' : '登 录' }}
            </el-button>
          </el-form-item>
        </el-form>

        <!-- Register Form -->
        <el-form
          v-else
          key="register"
          ref="regFormRef"
          :model="regForm"
          :rules="regRules"
          class="login-form"
          @keyup.enter="handleRegister"
        >
          <el-form-item prop="username">
            <el-input
              v-model="regForm.username"
              placeholder="请输入用户名"
              size="large"
              :prefix-icon="User"
              clearable
              maxlength="50"
              show-word-limit
            />
          </el-form-item>
          <el-form-item prop="displayName">
            <el-input
              v-model="regForm.displayName"
              placeholder="请输入显示名称（选填）"
              size="large"
              :prefix-icon="UserFilled"
              clearable
            />
          </el-form-item>
          <el-form-item prop="password">
            <el-input
              v-model="regForm.password"
              type="password"
              placeholder="请输入密码"
              size="large"
              :prefix-icon="Lock"
              show-password
            />
          </el-form-item>
          <el-form-item prop="confirmPassword">
            <el-input
              v-model="regForm.confirmPassword"
              type="password"
              placeholder="请确认密码"
              size="large"
              :prefix-icon="Lock"
              show-password
            />
          </el-form-item>
          <el-form-item prop="email">
            <el-input
              v-model="regForm.email"
              placeholder="请输入邮箱（选填）"
              size="large"
              :prefix-icon="Message"
              clearable
            />
          </el-form-item>
          <el-form-item prop="phone">
            <el-input
              v-model="regForm.phone"
              placeholder="请输入手机号（选填）"
              size="large"
              :prefix-icon="Phone"
              clearable
            />
          </el-form-item>
          <div class="contact-hint">
            <el-icon><InfoFilled /></el-icon>
            <span>手机号或邮箱至少填写一项</span>
          </div>
          <el-form-item>
            <el-button
              type="primary"
              size="large"
              class="submit-btn"
              :loading="regLoading"
              @click="handleRegister"
            >
              {{ regLoading ? '注册中...' : '注 册' }}
            </el-button>
          </el-form-item>
        </el-form>
      </transition>

      <!-- Dev credentials (仅开发环境，上线删除) -->
      <div class="dev-creds">
        <el-button text size="small" @click="showCreds = true" class="dev-creds-btn">
          <el-icon><WarningFilled /></el-icon>
          查看管理员测试账号
        </el-button>
        <span class="dev-creds-tag">仅开发环境</span>

        <el-dialog v-model="showCreds" title="系统管理员测试账号" width="420px" :close-on-click-modal="true">
          <el-tag type="danger" size="small" effect="dark" style="margin-bottom:12px;display:block;width:fit-content">
            ⚠ 上线前请删除此功能
          </el-tag>
          <div class="creds-list">
            <div class="creds-item">
              <div class="creds-role"><el-tag>系统管理员</el-tag></div>
              <div class="creds-detail">
                <p><strong>账号：</strong><code>admin</code></p>
                <p><strong>密码：</strong><code>admin123</code></p>
              </div>
              <el-button size="small" type="primary" plain @click="fillCreds('admin','admin123')">自动填入</el-button>
            </div>
          </div>
          <template #footer>
            <el-button @click="showCreds = false">关闭</el-button>
          </template>
        </el-dialog>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { login, register } from '@/api/auth'
import { ElMessage } from 'element-plus'
import { User, Lock, UserFilled, Message, Phone, InfoFilled, WarningFilled, Reading } from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const showCreds = ref(false)

const tab = ref('login')
const loginLoading = ref(false)
const regLoading = ref(false)
const loginFormRef = ref(null)
const regFormRef = ref(null)

const loginForm = reactive({ username: '', password: '' })
const loginRules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
}

const regForm = reactive({
  username: '', displayName: '', password: '', confirmPassword: '', email: '', phone: ''
})

const validateConfirmPass = (rule, value, callback) => {
  if (value !== regForm.password) {
    callback(new Error('两次输入的密码不一致'))
  } else {
    callback()
  }
}

const validateContact = (rule, value, callback) => {
  if (!regForm.email && !regForm.phone) {
    callback(new Error('手机号或邮箱至少填写一项'))
  } else {
    callback()
  }
}

const regRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 50, message: '用户名长度 3-50 个字符', trigger: 'blur' },
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码至少 6 位', trigger: 'blur' },
  ],
  confirmPassword: [
    { required: true, message: '请确认密码', trigger: 'blur' },
    { validator: validateConfirmPass, trigger: 'blur' },
  ],
  email: [
    { validator: validateContact, trigger: 'blur' },
  ],
  phone: [
    { validator: validateContact, trigger: 'blur' },
  ],
}

// Watch route query for tab switch
watch(() => route.query.tab, (val) => {
  if (val === 'register') tab.value = 'register'
}, { immediate: true })

function switchTab(t) {
  tab.value = t
}

function fillCreds(username, password) {
  loginForm.username = username
  loginForm.password = password
  showCreds.value = false
  setTimeout(() => handleLogin(), 300)
}

function handleLogin() {
  loginFormRef.value?.validate(async (valid) => {
    if (!valid) return
    loginLoading.value = true
    try {
      const res = await login(loginForm)
      if (res.code === 200) {
        userStore.setUser(res.data, res.data.token)
        ElMessage.success('登录成功')
        router.push('/dashboard')
      } else {
        ElMessage.error(res.message || '登录失败')
      }
    } catch (e) {
      ElMessage.error('网络错误，请稍后重试')
    } finally {
      loginLoading.value = false
    }
  })
}

function handleRegister() {
  regFormRef.value?.validate(async (valid) => {
    if (!valid) return
    regLoading.value = true
    try {
      const data = { ...regForm }
      delete data.confirmPassword
      const res = await register(data)
      if (res.code === 200) {
        userStore.setUser(res.data, res.data.token)
        ElMessage.success('注册成功')
        router.push('/dashboard')
      } else {
        ElMessage.error(res.message || '注册失败')
      }
    } catch (e) {
      ElMessage.error('网络错误，请稍后重试')
    } finally {
      regLoading.value = false
    }
  })
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  background: #f0f2f5;
  padding: 40px 20px;
}

.login-bg {
  position: fixed;
  inset: 0;
  overflow: hidden;
  z-index: 0;
}
.bg-shape {
  position: absolute;
  border-radius: 50%;
  opacity: 0.06;
  background: #409eff;
}
.bg-shape.shape-1 { width: 600px; height: 600px; top: -200px; right: -200px; }
.bg-shape.shape-2 { width: 400px; height: 400px; bottom: -100px; left: -100px; }
.bg-shape.shape-3 { width: 200px; height: 200px; top: 40%; left: 60%; }

.login-card {
  position: relative;
  z-index: 1;
  width: 440px;
  max-width: 100%;
  background: var(--card-bg);
  border-radius: 20px;
  padding: 40px 36px;
  box-shadow: 0 8px 40px rgba(0,0,0,0.08);
  animation: cardIn 0.5s ease;
}

@keyframes cardIn {
  from { opacity: 0; transform: translateY(24px) scale(0.97); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

.login-header { text-align: center; margin-bottom: 28px; }
.login-icon {
  width: 72px; height: 72px;
  background: #ecf5ff;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  margin: 0 auto 16px;
}
.login-title {
  font-size: 22px;
  color: var(--text-color);
  margin-bottom: 6px;
  font-weight: 600;
}
.login-desc {
  color: var(--text-secondary);
  font-size: 13px;
}

/* Tab Switch */
.tab-switch {
  display: flex;
  margin-bottom: 28px;
  border-bottom: 2px solid #ebeef5;
}
.tab-item {
  flex: 1;
  text-align: center;
  padding: 12px 0;
  font-size: 15px;
  font-weight: 500;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.3s;
  position: relative;
}
.tab-item::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 2px;
  background: #409eff;
  transition: width 0.3s;
  border-radius: 1px;
}
.tab-item.active { color: #409eff; }
.tab-item.active::after { width: 60%; }
.tab-item:hover { color: var(--text-color); }

.contact-hint {
  display: flex; align-items: center; gap: 6px;
  font-size: 12px; color: #909399;
  margin: -8px 0 8px; padding-left: 4px;
}

.submit-btn {
  width: 100%;
  height: 44px;
  font-size: 16px;
  border-radius: 22px;
  background: linear-gradient(135deg, #409eff, #337ecc);
  border: none;
}

/* Form transition */
.fade-slide-enter-active { transition: all 0.3s ease; }
.fade-slide-leave-active { transition: all 0.2s ease; }
.fade-slide-enter-from { opacity: 0; transform: translateX(20px); }
.fade-slide-leave-to { opacity: 0; transform: translateX(-20px); }

.login-form :deep(.el-form-item) { margin-bottom: 20px; }

/* Dev Credentials */
.dev-creds {
  margin-top: 20px;
  text-align: center;
  padding-top: 16px;
  border-top: 1px dashed #ebeef5;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  flex-wrap: wrap;
}
.dev-creds-btn {
  font-size: 12px;
  color: #909399;
}
.dev-creds-btn:hover {
  color: #409eff;
}
.dev-creds-tag {
  font-size: 10px;
  color: #c0c4cc;
  background: #f5f7fa;
  padding: 1px 8px;
  border-radius: 4px;
}

.creds-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.creds-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #fafafa;
  border-radius: 10px;
}
.creds-role { flex-shrink: 0; }
.creds-detail { flex: 1; }
.creds-detail p {
  font-size: 13px;
  color: #606266;
  line-height: 1.8;
}
.creds-detail code {
  background: #f5f7fa;
  padding: 1px 6px;
  border-radius: 4px;
  font-size: 13px;
  color: #e6a23c;
  font-weight: 600;
}

.dark-mode .creds-item {
  background: var(--bg-secondary);
}
.dark-mode .creds-detail p {
  color: var(--text-color);
}
.dark-mode .creds-detail code {
  background: rgba(255,255,255,0.06);
  color: #e6a23c;
}
.dark-mode .dev-creds {
  border-top-color: var(--card-border);
}
.dark-mode .dev-creds-tag {
  background: var(--bg-secondary);
  color: var(--text-secondary);
}
</style>