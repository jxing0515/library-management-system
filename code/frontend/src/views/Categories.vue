<template>
  <div class="categories-page">
    <div class="page-header">
      <h2 class="page-title">分类管理</h2>
      <el-button type="primary" @click="openCreate">
        <el-icon><Plus /></el-icon>新增分类
      </el-button>
    </div>

    <el-card shadow="never" style="border-radius:12px">
      <el-empty v-if="categories.length === 0 && !loading" description="暂无分类" :image-size="120" />

      <div v-else v-loading="loading" class="cat-grid">
        <div class="cat-card" v-for="cat in categories" :key="cat.id">
          <div class="cat-icon">
            <el-icon :size="28" color="#409eff"><Folder /></el-icon>
          </div>
          <div class="cat-info">
            <h4 class="cat-name">{{ cat.name }}</h4>
            <p class="cat-desc">{{ cat.description || '暂无描述' }}</p>
          </div>
          <div class="cat-actions">
            <el-button type="primary" link size="small" @click="openEdit(cat)">编辑</el-button>
            <el-button type="danger" link size="small" @click="handleDelete(cat)">删除</el-button>
          </div>
        </div>
      </div>
    </el-card>

    <!-- Create/Edit Dialog -->
    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑分类' : '新增分类'" width="480px" destroy-on-close>
      <el-form :model="form" :rules="rules" ref="formRef" label-width="80px" label-position="top">
        <el-form-item label="分类名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入分类名称" size="large" />
        </el-form-item>
        <el-form-item label="分类描述">
          <el-input v-model="form.description" type="textarea" :rows="3" placeholder="请输入分类描述（选填）" />
        </el-form-item>
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
import { ref, reactive, onMounted } from 'vue'
import { getCategories, createCategory, updateCategory, deleteCategory } from '@/api/category'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Folder } from '@element-plus/icons-vue'

const categories = ref([])
const loading = ref(false)
const submitting = ref(false)
const dialogVisible = ref(false)
const isEdit = ref(false)
const editId = ref(null)
const formRef = ref(null)

const form = reactive({ name: '', description: '' })

const rules = {
  name: [{ required: true, message: '请输入分类名称', trigger: 'blur' }],
}

async function loadData() {
  loading.value = true
  try {
    const res = await getCategories()
    if (res.code === 200) categories.value = res.data
  } catch (e) { ElMessage.error('加载失败') }
  finally { loading.value = false }
}

function openCreate() {
  isEdit.value = false
  editId.value = null
  form.name = ''
  form.description = ''
  dialogVisible.value = true
}

function openEdit(cat) {
  isEdit.value = true
  editId.value = cat.id
  form.name = cat.name
  form.description = cat.description || ''
  dialogVisible.value = true
}

async function handleSubmit() {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return
  submitting.value = true
  try {
    const res = isEdit.value
      ? await updateCategory(editId.value, { name: form.name, description: form.description })
      : await createCategory({ name: form.name, description: form.description || null })
    if (res.code === 200) {
      ElMessage.success(isEdit.value ? '更新成功' : '创建成功')
      dialogVisible.value = false
      loadData()
    } else {
      ElMessage.error(res.message)
    }
  } catch (e) { ElMessage.error('操作失败') }
  finally { submitting.value = false }
}

async function handleDelete(cat) {
  try {
    await ElMessageBox.confirm(`确认删除分类 "${cat.name}"？`, '删除确认', { type: 'warning' })
    const res = await deleteCategory(cat.id)
    if (res.code === 200) {
      ElMessage.success('删除成功')
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

.cat-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}

.cat-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 18px 20px;
  background: var(--card-bg);
  border-radius: 12px;
  border: 1px solid var(--card-border);
  transition: all 0.2s;
}
.cat-card:hover {
  background: #ecf5ff;
  border-color: #c6e2ff;
}

.cat-icon {
  width: 48px; height: 48px;
  background: #ecf5ff;
  border-radius: 12px;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.cat-info { flex: 1; min-width: 0; }
.cat-name { font-size: 15px; font-weight: 600; color: var(--text-color); margin-bottom: 4px; }
.cat-desc {
  font-size: 12px; color: var(--text-secondary);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.cat-actions { display: flex; gap: 4px; flex-shrink: 0; }

@media (max-width: 768px) {
  .cat-grid { grid-template-columns: 1fr; }
}
</style>