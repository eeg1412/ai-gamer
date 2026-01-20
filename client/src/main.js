import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import App from './App.vue'
import './style.css'

// 路由配置
const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('./views/Home.vue')
  },
  {
    path: '/admin',
    name: 'Admin',
    component: () => import('./views/Admin.vue'),
    meta: { title: '管理端' }
  },
  {
    path: '/control',
    name: 'Control',
    component: () => import('./views/Control.vue'),
    meta: { title: '控制端' }
  },
  {
    path: '/display',
    name: 'Display',
    component: () => import('./views/Display.vue'),
    meta: { title: '解说展示' }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 更新页面标题
router.beforeEach((to, from, next) => {
  document.title = to.meta.title
    ? `${to.meta.title} - AI Gamer`
    : 'AI Gamer - 游戏解说系统'
  next()
})

const app = createApp(App)
app.use(router)
app.mount('#app')
