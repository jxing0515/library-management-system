import '@/utils/theme-button.js'
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import App from './App.vue'
import router from './router'
import './styles/index.css'

// =====================================================
// Edge 浏览器最小化 bug 修复
// Edge 在 visibilitychange(hidden) 时调用 history.replaceState
// 会导致最小化后窗口立刻弹回（vue-router 内部 beforeUnloadListener 触发）
// 参考: https://blog.csdn.net/xxx/article/details/...
// =====================================================
;(function fixEdgeMinimizeBug() {
  var ua = navigator.userAgent.toLowerCase()
  if (ua.indexOf('edg/') !== -1 || ua.indexOf('edge/') !== -1) {
    var origReplaceState = window.history.replaceState
    window.history.replaceState = function () {
      // visibilityState === 'hidden' 时拦截，跳过 Edge 的 bug 触发路径
      if (document.visibilityState === 'hidden') {
        return
      }
      return origReplaceState.apply(this, arguments)
    }
  }
})()

const app = createApp(App)

// Register all Element Plus icons
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

app.use(createPinia())
app.use(router)
app.use(ElementPlus, { locale: zhCn })
app.mount('#app')


// 白天/黑夜切换监听
function applyTheme(theme) {
  if (theme === 'dark') {
    document.documentElement.classList.add('dark-mode')
    document.documentElement.classList.remove('light-mode')
  } else {
    document.documentElement.classList.add('light-mode')
    document.documentElement.classList.remove('dark-mode')
  }
}

document.addEventListener('theme-change', (e) => {
  applyTheme(e.detail)
  localStorage.setItem('library_theme', e.detail)
})

// 初始化主题同步
function initTheme() {
  const saved = localStorage.getItem('library_theme')
  if (saved) {
    applyTheme(saved)
  } else {
    const btn = document.getElementById('theme-btn')
    if (btn) {
      applyTheme(btn.getAttribute('value') || 'dark')
    }
  }
}
// 等 DOM 渲染完成后执行
if (document.readyState === 'complete') {
  initTheme()
} else {
  window.addEventListener('load', initTheme)
}
