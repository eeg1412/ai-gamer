<template>
  <div
    class="min-h-screen flex items-center justify-center p-8 overflow-hidden"
    :style="{ backgroundColor: displaySettings.bgColor }"
  >
    <!-- 解说文字容器 -->
    <div
      class="max-w-4xl w-full text-center transition-all duration-500"
      :class="{ 'opacity-0 translate-y-4': isTransitioning }"
    >
      <!-- 解说文字 -->
      <div v-if="displayText" class="relative">
        <!-- 文字阴影/描边效果 -->
        <p
          class="leading-relaxed transition-all duration-300"
          :style="textStyle"
        >
          {{ displayText }}
        </p>
      </div>

      <!-- 等待状态 -->
      <div v-else-if="!connected" class="text-white/50 text-xl">
        <span class="material-icons text-4xl animate-pulse">wifi_off</span>
        <p class="mt-4">等待连接服务器...</p>
      </div>

      <!-- 已连接但无内容 -->
      <div v-else class="text-white/30 text-lg">
        <span class="material-icons text-3xl animate-pulse">mic</span>
        <p class="mt-2">等待解说内容...</p>
      </div>
    </div>

    <!-- 设置按钮（仅在hover时显示） -->
    <button
      @click="showSettings = !showSettings"
      class="fixed top-4 right-4 p-2 rounded-lg bg-white/10 text-white/50 hover:bg-white/20 hover:text-white opacity-0 hover:opacity-100 transition-all"
    >
      <span class="material-icons">settings</span>
    </button>

    <!-- 设置面板 -->
    <div
      v-if="showSettings"
      class="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
      @click.self="showSettings = false"
    >
      <div class="glass rounded-xl p-6 max-w-md w-full mx-4 space-y-4">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold text-white">展示设置</h3>
          <button
            @click="showSettings = false"
            class="text-gray-400 hover:text-white"
          >
            <span class="material-icons">close</span>
          </button>
        </div>

        <!-- 字体大小 -->
        <div>
          <label class="text-sm text-gray-400 block mb-2">字体大小</label>
          <div class="flex items-center space-x-3">
            <input
              type="range"
              v-model.number="displaySettings.fontSize"
              min="24"
              max="72"
              class="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-gaming-purple"
            />
            <span class="text-white font-mono w-16"
              >{{ displaySettings.fontSize }}px</span
            >
          </div>
        </div>

        <!-- 文字颜色 -->
        <div>
          <label class="text-sm text-gray-400 block mb-2">文字颜色</label>
          <div class="flex items-center space-x-3">
            <input
              type="color"
              v-model="displaySettings.textColor"
              class="w-10 h-10 rounded cursor-pointer"
            />
            <input
              type="text"
              v-model="displaySettings.textColor"
              class="flex-1 bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white"
            />
          </div>
        </div>

        <!-- 背景颜色 -->
        <div>
          <label class="text-sm text-gray-400 block mb-2">背景颜色</label>
          <div class="flex items-center space-x-3">
            <input
              type="color"
              v-model="displaySettings.bgColor"
              class="w-10 h-10 rounded cursor-pointer"
            />
            <input
              type="text"
              v-model="displaySettings.bgColor"
              class="flex-1 bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white"
            />
            <button
              @click="displaySettings.bgColor = 'transparent'"
              class="px-3 py-2 bg-gray-700 rounded text-sm text-white hover:bg-gray-600"
            >
              透明
            </button>
          </div>
        </div>

        <!-- 文字描边 -->
        <div>
          <label class="text-sm text-gray-400 block mb-2">描边效果</label>
          <div class="flex items-center space-x-3">
            <label class="flex items-center cursor-pointer">
              <input
                type="checkbox"
                v-model="displaySettings.enableStroke"
                class="mr-2"
              />
              <span class="text-white">启用描边</span>
            </label>
            <input
              v-if="displaySettings.enableStroke"
              type="color"
              v-model="displaySettings.strokeColor"
              class="w-8 h-8 rounded cursor-pointer"
            />
          </div>
        </div>

        <!-- 阴影效果 -->
        <div class="flex items-center">
          <label class="flex items-center cursor-pointer">
            <input
              type="checkbox"
              v-model="displaySettings.enableShadow"
              class="mr-2"
            />
            <span class="text-white">启用阴影</span>
          </label>
        </div>

        <!-- 动画效果 -->
        <div>
          <label class="text-sm text-gray-400 block mb-2">入场动画</label>
          <select
            v-model="displaySettings.animation"
            class="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white"
          >
            <option value="none">无</option>
            <option value="fade">淡入</option>
            <option value="slide">滑入</option>
            <option value="scale">缩放</option>
          </select>
        </div>

        <!-- 保存按钮 -->
        <button
          @click="saveDisplaySettings"
          class="w-full py-2 bg-gaming-purple text-white rounded-lg hover:bg-gaming-purple/80"
        >
          保存设置
        </button>
      </div>
    </div>

    <!-- 隐藏的音频播放器 -->
    <audio ref="audioPlayer" autoplay class="hidden"></audio>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useSocket } from '../composables/useSocket'

const { connected, lastCommentary, lastAudio } = useSocket()

const showSettings = ref(false)
const isTransitioning = ref(false)
const displayText = ref('')
const audioPlayer = ref(null)

// 显示设置
const displaySettings = ref({
  fontSize: 36,
  textColor: '#ffffff',
  bgColor: 'transparent',
  enableStroke: true,
  strokeColor: '#000000',
  enableShadow: true,
  animation: 'fade'
})

// 文字样式计算
const textStyle = computed(() => {
  const style = {
    fontSize: `${displaySettings.value.fontSize}px`,
    color: displaySettings.value.textColor,
    fontWeight: '600'
  }

  // 描边效果
  if (displaySettings.value.enableStroke) {
    const stroke = displaySettings.value.strokeColor
    style.textShadow = `
      -2px -2px 0 ${stroke},
      2px -2px 0 ${stroke},
      -2px 2px 0 ${stroke},
      2px 2px 0 ${stroke}
    `
  }

  // 阴影效果
  if (displaySettings.value.enableShadow) {
    const existingShadow = style.textShadow || ''
    style.textShadow =
      existingShadow +
      (existingShadow ? ',' : '') +
      '4px 4px 8px rgba(0,0,0,0.5)'
  }

  return style
})

// 监听解说文字变化
watch(
  lastCommentary,
  newVal => {
    if (newVal?.text) {
      // 触发动画
      isTransitioning.value = true

      setTimeout(() => {
        displayText.value = newVal.text
        isTransitioning.value = false
      }, 300)
    }
  },
  { deep: true }
)

// 监听音频变化
watch(
  lastAudio,
  audio => {
    if (audio?.url && audioPlayer.value) {
      audioPlayer.value.src = audio.url
      audioPlayer.value.play().catch(() => {})
    }
  },
  { deep: true }
)

// 保存设置到localStorage
const saveDisplaySettings = () => {
  localStorage.setItem(
    'ai-gamer-display-settings',
    JSON.stringify(displaySettings.value)
  )
  showSettings.value = false
}

// 加载设置
const loadDisplaySettings = () => {
  const saved = localStorage.getItem('ai-gamer-display-settings')
  if (saved) {
    try {
      const parsed = JSON.parse(saved)
      displaySettings.value = { ...displaySettings.value, ...parsed }
    } catch (e) {
      console.error('加载显示设置失败:', e)
    }
  }
}

onMounted(() => {
  loadDisplaySettings()
})
</script>

<style scoped>
/* 确保透明背景在OBS中正常工作 */
:deep(body) {
  background: transparent !important;
}
</style>
