<template>
  <div
    class="w-full h-[100dvh] flex items-end justify-center overflow-hidden"
    style="background: transparent"
  >
    <div class="w-full h-[100dvh] flex items-end justify-center">
      <p
        v-if="displayVisible"
        :style="textStyle"
        class="m-0 text-center break-words p-8"
      >
        {{ displayText }}
      </p>
    </div>
    <audio ref="audioPlayer" autoplay style="display: none"></audio>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useSocket } from '../composables/useSocket'

const { lastCommentary, lastAudio } = useSocket()

const displayText = ref('')
const displayVisible = ref(false)
const audioPlayer = ref(null)

// 显示样式（简洁）
const displaySettings = ref({
  fontSize: 32,
  textColor: '#FFFFFF',
  enableStroke: true,
  strokeColor: '#000000',
  enableShadow: true
})

const textStyle = computed(() => {
  const style = {
    fontSize: `${displaySettings.value.fontSize}px`,
    color: displaySettings.value.textColor,
    fontWeight: '600',
    margin: 0
  }

  if (displaySettings.value.enableStroke) {
    const s = displaySettings.value.strokeColor
    style.textShadow = `-2px -2px 0 ${s}, 2px -2px 0 ${s}, -2px 2px 0 ${s}, 2px 2px 0 ${s}`
  }
  if (displaySettings.value.enableShadow) {
    style.textShadow =
      (style.textShadow ? style.textShadow + ', ' : '') +
      '4px 4px 8px rgba(0,0,0,0.5)'
  }

  return style
})

let displayTimeout = null

const clearTimers = () => {
  if (displayTimeout) {
    clearTimeout(displayTimeout)
    displayTimeout = null
  }
}

// 显示整条字幕，时长为 字数 * 500ms，新的内容到来立即替换当前显示
watch(
  lastCommentary,
  newVal => {
    const text = newVal?.text ? String(newVal.text).trim() : ''
    clearTimers()

    if (!text) {
      displayText.value = ''
      displayVisible.value = false
      return
    }

    displayText.value = text
    displayVisible.value = true
    const len = Array.from(text).length
    const duration = Math.max(1000, len * 200)
    displayTimeout = setTimeout(() => {
      displayText.value = ''
      displayVisible.value = false
      displayTimeout = null
    }, duration)
  },
  { deep: true }
)

// 音频播放（隐藏播放器）
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

onUnmounted(() => {
  clearTimers()
})
</script>

<style scoped>
/* 确保透明背景在OBS中正常工作 */
:deep(body) {
  background: transparent !important;
}
</style>
