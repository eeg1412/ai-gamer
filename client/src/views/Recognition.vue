<template>
  <div class="min-h-screen bg-gaming-dark">
    <!-- 顶部导航 -->
    <nav class="glass border-b border-gaming-purple/20 px-6 py-4">
      <div class="max-w-7xl mx-auto flex items-center justify-between">
        <div class="flex items-center space-x-4">
          <router-link
            to="/"
            class="flex items-center text-white hover:text-gaming-purple transition-colors"
          >
            <span class="material-icons mr-2">arrow_back</span>
            <span>返回</span>
          </router-link>
          <div class="h-6 w-px bg-gray-700"></div>
          <h1 class="text-xl font-semibold text-white flex items-center">
            <span class="material-icons mr-2 text-gaming-purple">mic</span>
            导演语音识别
          </h1>
        </div>

        <!-- 连接状态 -->
        <div class="flex items-center space-x-4">
          <div
            v-if="isRecording"
            class="flex items-center space-x-2 text-gaming-cyan animate-pulse"
          >
            <span class="w-2 h-2 rounded-full bg-gaming-cyan"></span>
            <span class="text-sm font-medium">正在监听语音...</span>
          </div>
          <div class="flex items-center space-x-2 text-sm">
            <span
              class="w-2 h-2 rounded-full"
              :class="connected ? 'bg-gaming-green pulse-dot' : 'bg-red-500'"
            ></span>
            <span class="text-gray-400 hidden sm:inline">
              服务 {{ connected ? '已连接' : '未连接' }}
            </span>
            <span class="sm:hidden text-gray-300 text-sm">{{
              connected ? '已' : '未'
            }}</span>
          </div>
        </div>
      </div>
    </nav>

    <div class="max-w-4xl mx-auto p-6 space-y-6">
      <!-- 核心控制面板 -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- 音量监控 -->
        <div class="gradient-border rounded-xl p-6 space-y-6">
          <h3 class="text-lg font-semibold text-white flex items-center">
            <span class="material-icons mr-2 text-gaming-cyan">graphic_eq</span>
            声音监控
          </h3>

          <div class="space-y-4">
            <!-- 音量条 -->
            <div class="relative h-8 bg-gray-800 rounded-full overflow-hidden">
              <div
                class="absolute inset-y-0 left-0 bg-gradient-to-r from-gaming-purple to-gaming-cyan transition-all duration-75"
                :style="{ width: `${currentVolume}%` }"
              ></div>
              <!-- 阈值标记 -->
              <div
                class="absolute inset-y-0 border-l-2 border-white/50 z-10"
                :style="{ left: `${config.threshold}%` }"
              >
                <span
                  class="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] text-white whitespace-nowrap"
                  >阈值: {{ config.threshold }}</span
                >
              </div>
            </div>

            <div class="flex justify-between text-xs text-gray-400 px-1">
              <span>0</span>
              <span>当前音量: {{ Math.round(currentVolume) }}</span>
              <span>100</span>
            </div>
          </div>

          <div class="flex justify-center">
            <button
              @click="toggleMonitor"
              :class="[
                'px-8 py-3 rounded-full font-bold transition-all flex items-center space-x-2',
                isMonitoring
                  ? 'bg-red-500/20 text-red-400 border border-red-500/50 hover:bg-red-500/30'
                  : 'bg-gaming-purple text-white shadow-lg shadow-gaming-purple/20 hover:scale-105'
              ]"
            >
              <span class="material-icons">{{
                isMonitoring ? 'stop' : 'play_arrow'
              }}</span>
              <span>{{ isMonitoring ? '停止监控' : '开启监控' }}</span>
            </button>
          </div>
        </div>

        <!-- 参数配置 -->
        <div class="glass rounded-xl p-6 space-y-4">
          <h3 class="text-lg font-semibold text-white flex items-center">
            <span class="material-icons mr-2 text-gaming-purple">tune</span>
            识别配置
          </h3>

          <div class="space-y-4">
            <div>
              <label class="flex justify-between text-sm text-gray-400 mb-2">
                <span>触发阈值</span>
                <span class="text-gaming-purple">{{ config.threshold }}</span>
              </label>
              <input
                v-model.number="config.threshold"
                type="range"
                min="0"
                max="100"
                class="w-full accent-gaming-purple"
              />
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm text-gray-400 mb-2"
                  >启动延迟 (ms)</label
                >
                <input
                  v-model.number="config.startDelay"
                  type="number"
                  class="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-gaming-purple"
                />
              </div>
              <div>
                <label class="block text-sm text-gray-400 mb-2"
                  >截止延迟 (ms)</label
                >
                <input
                  v-model.number="config.endDelay"
                  type="number"
                  class="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-gaming-purple"
                />
              </div>
            </div>

            <p class="text-[11px] text-gray-500 italic">
              * 持续高于阈值 <b>{{ config.startDelay }}ms</b> 开始识别<br />
              * 持续低于阈值 <b>{{ config.endDelay }}ms</b> 结束并发送
            </p>

            <div class="pt-2 border-t border-white/5">
              <label class="block text-sm text-gray-400 mb-2">识别语言</label>
              <div class="grid grid-cols-2 gap-2">
                <button
                  v-for="lang in languages"
                  :key="lang.code"
                  @click="setLanguage(lang.code)"
                  :disabled="isMonitoring || isRecording"
                  :class="[baseLangBtn, langButtonClass(lang.code)]"
                >
                  {{ lang.name }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 识别结果 -->
      <div class="glass rounded-xl p-6">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold text-white flex items-center">
            <span class="material-icons mr-2 text-gaming-green">notes</span>
            识别记录 (导演指令)
          </h3>
          <button
            @click="logs = []"
            class="text-xs text-gray-500 hover:text-gray-300 transition-colors"
          >
            清空记录
          </button>
        </div>

        <div class="space-y-3 max-h-[400px] overflow-y-auto pr-2">
          <div
            v-for="(log, index) in logs"
            :key="index"
            class="p-4 rounded-lg bg-white/5 border border-white/10 animate-slide-in"
          >
            <div class="flex justify-between items-start mb-2">
              <span class="text-xs text-gray-500">{{ log.time }}</span>
              <span
                v-if="log.status === 'processing'"
                class="text-[10px] bg-gaming-purple/20 text-gaming-purple px-2 py-0.5 rounded"
                >正在执行AI解说...</span
              >
              <span
                v-else-if="log.status === 'success'"
                class="text-[10px] bg-gaming-green/20 text-gaming-green px-2 py-0.5 rounded"
                >已发送</span
              >
              <button
                @click="resend(log)"
                class="ml-2 text-[10px] text-gaming-cyan hover:underline flex items-center"
              >
                <span class="material-icons text-xs mr-0.5">replay</span>
                重发
              </button>
            </div>
            <p class="text-white">{{ log.text }}</p>
          </div>

          <div
            v-if="logs.length === 0"
            class="h-32 flex flex-col items-center justify-center text-gray-600"
          >
            <span class="material-icons text-4xl mb-2">history</span>
            <p>暂无识别记录</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onUnmounted, watch } from 'vue'
import { useSocket, useCommentary } from '../composables/useSocket'

// 基础状态
const { connected } = useSocket()
const { trigger, processing, lastCommentary } = useCommentary()

const isMonitoring = ref(false)
const isRecording = ref(false)
const currentVolume = ref(0)
const logs = ref(
  JSON.parse(localStorage.getItem('ai-gamer-recognition-logs') || '[]')
)

// 配置项
const config = reactive(
  JSON.parse(localStorage.getItem('ai-gamer-recognition-config')) || {
    threshold: 20,
    startDelay: 300,
    endDelay: 1000,
    lang: 'zh-CN'
  }
)

// 持续化保存配置
watch(
  config,
  newVal => {
    localStorage.setItem('ai-gamer-recognition-config', JSON.stringify(newVal))
  },
  { deep: true }
)

// 持续化保存记录（限制100条）
watch(
  logs,
  newVal => {
    if (newVal.length > 100) {
      logs.value = newVal.slice(0, 100)
    }
    localStorage.setItem(
      'ai-gamer-recognition-logs',
      JSON.stringify(logs.value)
    )
  },
  { deep: true }
)

const languages = [
  { name: '中文', code: 'zh-CN' },
  { name: '英语', code: 'en-US' },
  { name: '日语', code: 'ja-JP' },
  { name: '韩语', code: 'ko-KR' }
]

// 语言按钮样式辅助（提高可读性）
const baseLangBtn = 'px-3 py-2 rounded-lg text-xs transition-all border'
function langButtonClass(code) {
  const selected = config.lang === code
  const disabled = isMonitoring.value || isRecording.value

  const selectedClasses =
    'bg-gaming-purple text-white border-gaming-purple shadow-sm shadow-gaming-purple/20'
  const normalClasses =
    'bg-gray-800 text-gray-400 border-gray-700 hover:border-gray-500'

  return [
    selected ? selectedClasses : normalClasses,
    disabled ? 'opacity-50 cursor-not-allowed' : ''
  ]
}

// 音效逻辑变量
let audioContext = null
let analyser = null
let microphone = null
let animationId = null
let aboveThresholdStart = null
let belowThresholdStart = null
let streamRef = null
let recognitionStarting = false
let recognitionStopping = false
let pendingRestart = false

// 语音识别变量
const SpeechRecognition =
  window.SpeechRecognition || window.webkitSpeechRecognition
let recognition = null

// 安全启动/停止识别，放在模块作用域以便其它函数调用
function safeStartRecognition() {
  if (!recognition || isRecording.value || recognitionStarting) return
  recognitionStarting = true
  try {
    recognition.start()
  } catch (e) {
    recognitionStarting = false
    console.warn('启动识别异常：', e)
  }
}

function safeStopRecognition() {
  if (!recognition || recognitionStopping || !isRecording.value) return
  recognitionStopping = true
  try {
    recognition.stop()
  } catch (e) {
    recognitionStopping = false
    console.warn('停止识别异常：', e)
  }
}

if (SpeechRecognition) {
  recognition = new SpeechRecognition()
  recognition.lang = config.lang
  recognition.continuous = true
  recognition.interimResults = true

  console.log('语音识别初始化完成，当前语言：', recognition.lang)

  // 监听语言变化（同步到 recognition）
  watch(
    () => config.lang,
    newLang => {
      recognition.lang = newLang
      if (isRecording.value) {
        pendingRestart = true
        safeStopRecognition()
      }
    }
  )

  recognition.onresult = event => {
    let interim = ''
    let finalText = ''

    for (let i = event.resultIndex; i < event.results.length; ++i) {
      if (event.results[i].isFinal) {
        finalText += event.results[i][0].transcript
      } else {
        interim += event.results[i][0].transcript
      }
      console.log('onresult item:', event.results[i])
    }

    if (finalText) {
      currentTranscript.value = finalText
      interimTranscriptRef.value = ''
      console.log('识别到最终结果:', finalText)
    } else {
      interimTranscriptRef.value = interim
      console.log('临时识别结果:', interim)
    }
  }

  recognition.onstart = () => {
    recognitionStarting = false
    recognitionStopping = false
    isRecording.value = true
  }

  recognition.onend = () => {
    recognitionStarting = false
    recognitionStopping = false
    isRecording.value = false
    if (pendingRestart) {
      pendingRestart = false
      safeStartRecognition()
    }
  }

  recognition.onerror = event => {
    console.error('语音识别错误:', event.error)
    recognitionStarting = false
    recognitionStopping = false
    isRecording.value = false
  }
} else {
  alert('浏览器不支持 Web Speech API，请尝试使用 Chrome 浏览器。')
}

const currentTranscript = ref('')
const interimTranscriptRef = ref('')

// 开启/关闭音频监控
async function toggleMonitor() {
  if (isMonitoring.value) {
    stopMonitor()
  } else {
    await startMonitor()
  }
}

async function startMonitor() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    // 保存流引用以便安全停止
    streamRef = stream
    audioContext = new (window.AudioContext || window.webkitAudioContext)()
    analyser = audioContext.createAnalyser()
    microphone = audioContext.createMediaStreamSource(stream)

    analyser.fftSize = 256
    microphone.connect(analyser)

    isMonitoring.value = true
    monitorVolume()
  } catch (err) {
    console.error('无法访问麦克风:', err)
    alert('请求麦 microphone 权限失败，请检查设置。')
  }
}

function stopMonitor() {
  isMonitoring.value = false
  if (animationId) cancelAnimationFrame(animationId)
  try {
    if (animationId) cancelAnimationFrame(animationId)

    // 关闭 AudioContext 之前检查状态，避免重复关闭
    if (audioContext && audioContext.state !== 'closed') {
      audioContext.close().catch(() => {})
    }

    // 停止获取的媒体流（更可靠）
    if (streamRef && streamRef.getTracks) {
      streamRef.getTracks().forEach(track => track.stop())
    }

    // 断开音频节点引用
    try {
      if (microphone && typeof microphone.disconnect === 'function') {
        microphone.disconnect()
      }
    } catch (e) {
      // ignore
    }

    // 清理引用
    audioContext = null
    analyser = null
    microphone = null
    streamRef = null
    animationId = null
  } catch (err) {
    console.warn('停止监控时发生错误：', err)
  }
  stopRecording()
}

function monitorVolume() {
  if (!isMonitoring.value) return

  const dataArray = new Uint8Array(analyser.frequencyBinCount)
  analyser.getByteFrequencyData(dataArray)

  let sum = 0
  for (let i = 0; i < dataArray.length; i++) {
    sum += dataArray[i]
  }
  const average = sum / dataArray.length
  // 转换成 0-100 的值
  currentVolume.value = (average / 128) * 100

  const now = Date.now()

  // 触发逻辑
  if (currentVolume.value >= config.threshold) {
    belowThresholdStart = null
    if (!isRecording.value) {
      if (!aboveThresholdStart) aboveThresholdStart = now
      if (now - aboveThresholdStart >= config.startDelay) {
        startRecording()
      }
    }
  } else {
    aboveThresholdStart = null
    if (isRecording.value) {
      if (!belowThresholdStart) belowThresholdStart = now
      if (now - belowThresholdStart >= config.endDelay) {
        stopAndSend()
      }
    }
  }

  animationId = requestAnimationFrame(monitorVolume)
}

function startRecording() {
  if (!recognition || isRecording.value) return

  currentTranscript.value = ''
  // 使用安全启动函数，等待 onstart 事件确认
  safeStartRecognition()
}

function stopRecording() {
  if (!recognition || !isRecording.value) return
  // 使用安全停止，等待 onend 事件确认
  safeStopRecognition()
  currentVolume.value = 0
}

function stopAndSend() {
  stopRecording()

  // 延迟一小会确保获取到最后的识别文本
  setTimeout(() => {
    const text = (
      currentTranscript.value ||
      interimTranscriptRef.value ||
      ''
    ).trim()
    if (text) {
      const newLog = {
        time: new Date().toLocaleTimeString(),
        text: text,
        status: 'processing'
      }
      logs.value.unshift(newLog)

      // 发送给服务器触发AI解说
      trigger(text)

      // 监听处理状态
      // Watch both `processing` and `lastCommentary` as fallback.
      let stopWatchProcessing = null
      let stopWatchCommentary = null

      stopWatchProcessing = watch(
        () => processing.value,
        newVal => {
          if (!newVal) {
            newLog.status = 'success'
            if (stopWatchProcessing) stopWatchProcessing()
            if (stopWatchCommentary) stopWatchCommentary()
          }
        }
      )

      stopWatchCommentary = watch(
        () => lastCommentary.value?.timestamp,
        newVal => {
          if (newVal) {
            newLog.status = 'success'
            if (stopWatchProcessing) stopWatchProcessing()
            if (stopWatchCommentary) stopWatchCommentary()
          }
        }
      )

      currentTranscript.value = ''
      interimTranscriptRef.value = ''
    }
  }, 300)
}

function resend(log) {
  log.status = 'processing'
  log.time = new Date().toLocaleTimeString()

  // 重新触发
  trigger(log.text)

  // Watch both `processing` and `lastCommentary` as fallback for resend.
  let stopWatchProcessing = null
  let stopWatchCommentary = null

  stopWatchProcessing = watch(
    () => processing.value,
    newVal => {
      if (!newVal) {
        log.status = 'success'
        if (stopWatchProcessing) stopWatchProcessing()
        if (stopWatchCommentary) stopWatchCommentary()
      }
    }
  )

  stopWatchCommentary = watch(
    () => lastCommentary.value?.timestamp,
    newVal => {
      if (newVal) {
        log.status = 'success'
        if (stopWatchProcessing) stopWatchProcessing()
        if (stopWatchCommentary) stopWatchCommentary()
      }
    }
  )
}

function setLanguage(code) {
  if (isMonitoring.value || isRecording.value) {
    // 在监控或录音期间禁止修改语言
    alert('请先停止音频监控或录音，再切换识别语言。')
    return
  }
  config.lang = code
}

onUnmounted(() => {
  stopMonitor()
})
</script>

<style scoped>
@keyframes pulse-dot {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.5);
    opacity: 0.5;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

.pulse-dot {
  animation: pulse-dot 2s infinite;
}

.bg-gaming-dark {
  background-color: #0f0f23;
}

.text-gaming-purple {
  color: #6366f1;
}

.bg-gaming-purple {
  background-color: #6366f1;
}

.text-gaming-cyan {
  color: #06b6d4;
}

.text-gaming-green {
  color: #10b981;
}

.bg-gaming-green {
  background-color: #10b981;
}

.animate-slide-in {
  animation: slide-in 0.3s ease-out forwards;
}

@keyframes slide-in {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
