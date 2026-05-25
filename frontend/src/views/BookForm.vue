<template>
  <div class="book-form-page">
    <div class="page-header">
      <h2 class="page-title">{{ isEdit ? '编辑图书' : '新增图书' }}</h2>
      <el-button @click="goBack">
        <el-icon><ArrowLeft /></el-icon>返回列表
      </el-button>
    </div>

    <el-row :gutter="24">
      <!-- Left: Form -->
      <el-col :span="16">
        <el-card shadow="never" class="form-card">
          <template #header>
            <div class="card-header">
              <el-icon color="#409eff"><Edit /></el-icon>
              <span>{{ isEdit ? '编辑图书信息' : '填写图书信息' }}</span>
            </div>
          </template>
          <el-form :model="form" :rules="rules" ref="formRef" label-width="90px" label-position="top">
            <el-row :gutter="24">
              <el-col :span="12">
                <el-form-item label="书名" prop="title">
                  <el-input v-model="form.title" placeholder="请输入书名" size="large" clearable />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="作者" prop="author">
                  <el-input v-model="form.author" placeholder="请输入作者" size="large" clearable />
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="24">
              <el-col :span="12">
                <el-form-item label="ISBN">
                  <el-input v-model="form.isbn" placeholder="请输入ISBN" clearable />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="出版社">
                  <el-input v-model="form.publisher" placeholder="请输入出版社" clearable />
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="24">
              <el-col :span="12">
                <el-form-item label="分类" prop="category">
                  <el-select v-model="form.category" placeholder="请选择分类" style="width:100%" size="large" clearable>
                    <el-option v-for="cat in categories" :key="cat.id" :label="cat.name" :value="cat" />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="总库存" prop="quantity">
                  <el-input-number v-model="form.quantity" :min="0" :max="9999" style="width:100%" @change="onQuantityChange" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="可借数量">
                  <el-input-number v-model="form.available" :min="0" :max="form.quantity" style="width:100%" />
                </el-form-item>
              </el-col>
            </el-row>
            <el-form-item label="简介">
              <el-input v-model="form.description" type="textarea" :rows="4" placeholder="请输入图书简介" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="submitForm" :loading="submitting" size="large">
                {{ isEdit ? '保存修改' : '确认新增' }}
              </el-button>
              <el-button @click="goBack" size="large">取消</el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </el-col>

      <!-- Right: Cover Upload -->
      <el-col :span="8">
        <el-card shadow="never" class="form-card">
          <template #header>
            <div class="card-header">
              <el-icon color="#409eff"><Picture /></el-icon>
              <span>图书封面</span>
            </div>
          </template>
          <div class="cover-upload-section">
            <div class="cover-preview" @click="triggerCoverUpload">
              <img v-if="coverPreview" :src="coverPreview" class="cover-img" />
              <div v-else class="cover-placeholder">
                <el-icon :size="48"><Plus /></el-icon>
                <span>点击上传封面</span>
              </div>
              <div class="cover-overlay">
                <el-icon :size="24"><Camera /></el-icon>
                <span>更换封面</span>
              </div>
            </div>
            <input ref="coverInput" type="file" accept="image/*" style="display:none" @change="handleCoverChange" />
            <p class="cover-tip">支持 JPG/PNG/WebP，不超过 5MB</p>
            <el-button v-if="isEdit && form.coverUrl" type="danger" size="small" plain @click="removeCover" style="margin-top:10px">
              <el-icon><Delete /></el-icon>移除封面
            </el-button>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getBook, createBook, updateBook, uploadCover } from '@/api/book'
import { getCategories } from '@/api/category'
import { ElMessage } from 'element-plus'

const route = useRoute()
const router = useRouter()
const formRef = ref(null)
const coverInput = ref(null)
const submitting = ref(false)
const uploading = ref(false)

const isEdit = computed(() => !!route.params.id)

const form = reactive({
  title: '',
  author: '',
  isbn: '',
  publisher: '',
  category: null,
  quantity: 1,
  available: 1,
  description: '',
  coverUrl: ''
})

const coverPreview = ref(null)
const categories = ref([])
const pendingCoverFile = ref(null)

const rules = {
  title: [{ required: true, message: '请输入书名', trigger: 'blur' }],
  author: [{ required: true, message: '请输入作者', trigger: 'blur' }],
  category: [{ required: true, message: '请选择分类', trigger: 'change' }],
  quantity: [{ required: true, message: '请输入库存数量', trigger: 'blur' }]
}

function onQuantityChange(newVal) {
  // When total stock increases, available also increases by the same delta
  // When total stock decreases, cap available to new total
  if (form.available > newVal) {
    form.available = newVal
  }
}

function goBack() {
  router.push('/books/manage')
}

function triggerCoverUpload() {
  coverInput.value?.click()
}

async function handleCoverChange(e) {
  const file = e.target.files?.[0]
  if (!file) return
  if (!file.type.startsWith('image/')) {
    ElMessage.error('请选择图片文件')
    return
  }
  if (file.size > 5 * 1024 * 1024) {
    ElMessage.error('文件大小不能超过5MB')
    return
  }
  // Show preview
  const reader = new FileReader()
  reader.onload = (ev) => {
    coverPreview.value = ev.target.result
  }
  reader.readAsDataURL(file)
  pendingCoverFile.value = file
}

async function uploadCoverFile(bookId) {
  if (!pendingCoverFile.value) return null
  uploading.value = true
  try {
    const res = await uploadCover(bookId, pendingCoverFile.value)
    if (res.code === 200) {
      return res.data
    }
  } catch (e) {
    console.error('Cover upload failed:', e)
  } finally {
    uploading.value = false
  }
  return null
}

async function submitForm() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  submitting.value = true
  try {
    let bookData = {
      title: form.title,
      author: form.author,
      isbn: form.isbn || null,
      publisher: form.publisher || null,
      category: form.category ? { id: form.category.id } : null,
      quantity: form.quantity,
      available: Math.min(form.available, form.quantity),
      description: form.description || null,
      coverUrl: form.coverUrl || null
    }

    let res
    if (isEdit.value) {
      res = await updateBook(route.params.id, bookData)
    } else {
      res = await createBook(bookData)
    }

    if (res.code === 200) {
      const bookId = isEdit.value ? route.params.id : res.data.id
      // Upload cover if selected
      if (pendingCoverFile.value) {
        const coverUrl = await uploadCoverFile(bookId)
        if (coverUrl) {
          ElMessage.success(isEdit.value ? '图书信息及封面更新成功' : '图书新增成功，封面上传成功')
        } else {
          ElMessage.success(isEdit.value ? '图书信息更新成功' : '图书新增成功')
        }
      } else {
        ElMessage.success(isEdit.value ? '图书信息更新成功' : '图书新增成功')
      }
      router.push('/books/manage')
    } else {
      ElMessage.error(res.message || '操作失败')
    }
  } catch (e) {
    ElMessage.error('操作失败: ' + (e.message || '未知错误'))
  } finally {
    submitting.value = false
  }
}

function removeCover() {
  form.coverUrl = ''
  coverPreview.value = null
  pendingCoverFile.value = null
}

onMounted(async () => {
  try {
    const res = await getCategories()
    if (res.code === 200) {
      categories.value = res.data
    }
  } catch (e) {}

  if (isEdit.value) {
    try {
      const res = await getBook(route.params.id)
      if (res.code === 200) {
        const book = res.data
        form.title = book.title || ''
        form.author = book.author || ''
        form.isbn = book.isbn || ''
        form.publisher = book.publisher || ''
        form.category = book.category || null
        form.quantity = book.quantity ?? 1
        form.available = book.available ?? book.quantity ?? 1
        form.description = book.description || ''
        form.coverUrl = book.coverUrl || ''
        if (book.coverUrl) {
          coverPreview.value = book.coverUrl
        }
      }
    } catch (e) {
      ElMessage.error('加载图书信息失败')
    }
  }
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

.form-card {
  border-radius: 12px;
  border: 1px solid var(--card-border);
  background: var(--card-bg);
}
.card-header {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 600;
}

.cover-upload-section {
  text-align: center;
}

.cover-preview {
  position: relative;
  width: 100%;
  min-height: 200px;
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  border: 2px dashed var(--card-border);
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-secondary);
  transition: border-color 0.3s;
}
.cover-preview:hover {
  border-color: #409eff;
}
.cover-preview:hover .cover-overlay {
  opacity: 1;
}

.cover-img {
  width: 100%;
  height: auto;
  max-height: 400px;
  object-fit: contain;
  display: block;
}

.cover-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  color: #909399;
}

.cover-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #fff;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.3s;
  pointer-events: none;
}

.cover-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 8px;
}
</style>