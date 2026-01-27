<template>
  <div class="min-h-screen bg-gaming-darker flex flex-col">
    <!-- 顶部状态栏 -->
    <nav class="glass border-b border-gaming-purple/20 px-4 py-3">
      <div class="flex items-center justify-between relative">
        <div class="flex items-center space-x-3">
          <router-link
            to="/"
            class="text-gray-400 hover:text-white transition-colors"
          >
            <span class="material-icons">home</span>
          </router-link>
          <h1 class="text-lg font-semibold text-white flex items-center">
            <span class="material-icons mr-2 text-gaming-cyan"
              >sports_esports</span
            >
            控制端
          </h1>
        </div>

        <div class="flex items-center space-x-4">
          <button
            @click="showMobileMenu = !showMobileMenu"
            class="md:hidden p-2 rounded bg-gray-800 text-gray-200"
            aria-label="Toggle menu"
          >
            <span class="material-icons">menu</span>
          </button>
          <!-- 桌面状态组 -->
          <div class="hidden md:flex items-center space-x-4">
            <!-- Twitch连接状态 -->
            <button
              @click="showTwitchPanel = !showTwitchPanel"
              class="flex items-center px-3 py-1.5 rounded-lg text-sm transition-colors"
              :class="
                twitchStatus.connected
                  ? 'bg-purple-500/20 text-purple-400'
                  : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
              "
            >
              <span class="material-icons text-sm mr-1">{{
                twitchStatus.connected ? 'chat' : 'chat_bubble_outline'
              }}</span>
              {{
                twitchStatus.connected
                  ? `Twitch: ${twitchStatus.channel}`
                  : 'Twitch'
              }}
            </button>

            <!-- OBS连接状态 -->
            <button
              @click="toggleOBS"
              class="flex items-center px-3 py-1.5 rounded-lg text-sm transition-colors"
              :class="
                state.obsConnected
                  ? 'bg-gaming-green/20 text-gaming-green'
                  : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
              "
            >
              <span class="material-icons text-sm mr-1">{{
                state.obsConnected ? 'link' : 'link_off'
              }}</span>
              {{ state.obsConnected ? 'OBS已连接' : '连接OBS' }}
            </button>

            <!-- 运行状态 -->
            <div
              class="flex items-center px-3 py-1.5 rounded-lg text-sm"
              :class="
                state.isRunning
                  ? 'bg-gaming-green/20 text-gaming-green'
                  : 'bg-gray-700 text-gray-400'
              "
            >
              <span
                class="w-2 h-2 rounded-full mr-2"
                :class="
                  state.isRunning ? 'bg-gaming-green pulse-dot' : 'bg-gray-500'
                "
              ></span>
              {{ state.isRunning ? '运行中' : '已停止' }}
            </div>
          </div>

          <!-- 移动端抽屉：顶部滑出样式（teleport 到 body），带遮罩且支持点击外部关闭 -->
          <teleport to="body">
            <div v-if="showMobileMenu" class="fixed inset-0 z-[9999]">
              <div
                class="fixed top-0 left-0 right-0 z-[10001] bg-gray-800 p-4 shadow-2xl"
                @click.stop
              >
                <div class="flex items-center justify-between mb-2">
                  <div class="text-white font-semibold">菜单</div>
                  <button
                    @click="showMobileMenu = false"
                    class="p-1 rounded bg-gray-700 text-white"
                  >
                    <span class="material-icons">close</span>
                  </button>
                </div>
                <div class="space-y-2">
                  <button
                    @click="handleToggleTwitchFromMenu"
                    class="w-full text-left px-3 py-2 rounded text-gray-300"
                  >
                    <span class="material-icons align-middle mr-2 text-sm"
                      >chat</span
                    >
                    {{
                      twitchStatus.connected
                        ? `Twitch: ${twitchStatus.channel}`
                        : 'Twitch'
                    }}
                  </button>
                  <button
                    @click="handleToggleOBSFromMenu"
                    class="w-full text-left px-3 py-2 rounded text-gray-300"
                  >
                    <span class="material-icons align-middle mr-2 text-sm">{{
                      state.obsConnected ? 'link' : 'link_off'
                    }}</span>
                    {{ state.obsConnected ? 'OBS已连接' : '连接OBS' }}
                  </button>
                  <div class="px-3 py-2 text-gray-300">
                    {{ state.isRunning ? '运行中' : '已停止' }}
                  </div>
                </div>
              </div>

              <div
                class="absolute inset-0 bg-black/20 z-[10000]"
                @click="showMobileMenu = false"
              ></div>
            </div>
          </teleport>
        </div>
      </div>
    </nav>

    <!-- 主要控制区域 -->
    <div class="flex-1 p-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
      <!-- 左侧：模式和控制 -->
      <div class="space-y-4">
        <!-- 模式切换 -->
        <div class="gradient-border rounded-xl p-4">
          <h2 class="text-sm font-medium text-gray-400 mb-3">解说模式</h2>
          <div class="grid grid-cols-2 gap-3">
            <button
              @click="setMode('auto')"
              class="p-4 rounded-xl border-2 transition-all"
              :class="
                state.mode === 'auto'
                  ? 'border-gaming-purple bg-gaming-purple/20 text-white'
                  : 'border-gray-700 bg-gray-800/50 text-gray-400 hover:border-gray-600'
              "
            >
              <span class="material-icons text-3xl mb-2">autorenew</span>
              <div class="font-medium">自动模式</div>
              <div class="text-xs text-gray-500 mt-1">
                每 {{ state.autoIntervalSeconds }} 秒解说
              </div>
            </button>

            <button
              @click="setMode('manual')"
              class="p-4 rounded-xl border-2 transition-all"
              :class="
                state.mode === 'manual'
                  ? 'border-gaming-cyan bg-gaming-cyan/20 text-white'
                  : 'border-gray-700 bg-gray-800/50 text-gray-400 hover:border-gray-600'
              "
            >
              <span class="material-icons text-3xl mb-2">touch_app</span>
              <div class="font-medium">手动模式</div>
              <div class="text-xs text-gray-500 mt-1">点击触发解说</div>
            </button>
          </div>

          <!-- 自动模式间隔设置 -->
          <div
            v-if="state.mode === 'auto'"
            class="mt-4 pt-4 border-t border-gray-700"
          >
            <label class="text-sm text-gray-400 block mb-2"
              >解说间隔（秒）</label
            >
            <div class="flex items-center space-x-3">
              <input
                type="range"
                v-model.number="intervalSeconds"
                min="5"
                max="60"
                step="5"
                class="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-gaming-purple"
              />
              <span class="text-white font-mono w-12 text-center"
                >{{ intervalSeconds }}s</span
              >
            </div>
          </div>
        </div>

        <!-- 开始/停止控制 -->
        <div class="gradient-border rounded-xl p-4">
          <button
            @click="toggleRunning"
            :disabled="!state.obsConnected"
            class="w-full py-6 rounded-xl text-xl font-bold transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            :class="
              state.isRunning
                ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30 border-2 border-red-500'
                : 'bg-gaming-green/20 text-gaming-green hover:bg-gaming-green/30 border-2 border-gaming-green btn-glow'
            "
          >
            <span class="material-icons text-3xl mr-3">{{
              state.isRunning ? 'stop' : 'play_arrow'
            }}</span>
            {{ state.isRunning ? '停止解说' : '开始解说' }}
          </button>

          <p
            v-if="!state.obsConnected"
            class="text-center text-red-400 text-sm mt-3"
          >
            请先连接OBS
          </p>
        </div>

        <!-- 手动触发按钮（手动模式时显示） -->
        <div
          v-if="state.mode === 'manual' && state.isRunning"
          class="gradient-border rounded-xl p-4"
        >
          <button
            @click="triggerCommentary"
            :disabled="processing"
            class="w-full py-8 rounded-xl bg-gradient-to-r from-gaming-purple to-gaming-pink text-white text-xl font-bold transition-all hover:opacity-90 disabled:opacity-50 flex items-center justify-center"
          >
            <span
              v-if="processing"
              class="material-icons text-3xl mr-3 animate-spin"
              >refresh</span
            >
            <span v-else class="material-icons text-3xl mr-3">camera</span>
            {{ processing ? processingStatusText : '立即解说画面' }}
          </button>
        </div>
      </div>

      <!-- 中间：文字输入和预览 -->
      <div class="space-y-4">
        <!-- 文字输入解说 -->
        <div class="gradient-border rounded-xl p-4">
          <h2 class="text-sm font-medium text-gray-400 mb-3 flex items-center">
            <span class="material-icons mr-2 text-gaming-cyan">edit</span>
            文字解说
          </h2>

          <textarea
            v-model="inputText"
            rows="4"
            class="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-gaming-purple focus:outline-none resize-none"
            placeholder="输入文字让AI解说，或直接朗读..."
          ></textarea>

          <div class="flex space-x-3 mt-3">
            <button
              @click="commentOnText"
              :disabled="!inputText.trim() || processing"
              class="flex-1 py-2 rounded-lg bg-gaming-purple/20 text-gaming-purple hover:bg-gaming-purple/30 transition-colors disabled:opacity-50 flex items-center justify-center"
            >
              <span class="material-icons mr-2">psychology</span>
              AI解说
            </button>
            <button
              @click="speakDirectly"
              :disabled="!inputText.trim() || processing"
              class="flex-1 py-2 rounded-lg bg-gaming-cyan/20 text-gaming-cyan hover:bg-gaming-cyan/30 transition-colors disabled:opacity-50 flex items-center justify-center"
            >
              <span class="material-icons mr-2">volume_up</span>
              直接朗读
            </button>
          </div>
        </div>

        <!-- 快捷短语 -->
        <div class="gradient-border rounded-xl p-4">
          <h2 class="text-sm font-medium text-gray-400 mb-3 flex items-center">
            <span class="material-icons mr-2 text-gaming-green">flash_on</span>
            快捷短语
          </h2>

          <div class="grid grid-cols-2 gap-2">
            <button
              v-for="phrase in quickPhrases"
              :key="phrase"
              @click="speakQuickPhrase(phrase)"
              :disabled="processing"
              class="px-3 py-2 rounded-lg bg-gray-800/50 text-gray-300 hover:bg-gray-700 hover:text-white transition-colors text-sm disabled:opacity-50 truncate"
            >
              {{ phrase }}
            </button>
          </div>
        </div>

        <!-- 画面预览 -->
        <div class="gradient-border rounded-xl p-4">
          <h2 class="text-sm font-medium text-gray-400 mb-3 flex items-center">
            <span class="material-icons mr-2 text-gaming-cyan"
              >photo_camera</span
            >
            最新截图
          </h2>

          <div
            class="bg-gray-800/50 rounded-lg overflow-hidden aspect-video flex items-center justify-center border border-gray-700"
          >
            <img
              v-if="lastScreenshot"
              :src="lastScreenshot"
              class="w-full h-full object-contain"
              alt="OBS Screenshot"
            />
            <div v-else class="text-gray-500 flex flex-col items-center">
              <span class="material-icons text-4xl mb-2"
                >image_not_supported</span
              >
              <span class="text-sm">暂无截图</span>
            </div>
          </div>
        </div>

        <!-- 当前解说预览 -->
        <div class="gradient-border rounded-xl p-4">
          <h2 class="text-sm font-medium text-gray-400 mb-3 flex items-center">
            <span class="material-icons mr-2 text-gaming-pink">subtitles</span>
            最新解说
          </h2>

          <div class="bg-gray-800/50 rounded-lg p-4 min-h-24">
            <p v-if="lastCommentary.text" class="text-white">
              {{ lastCommentary.text }}
            </p>
            <p v-else class="text-gray-500 italic">等待解说内容...</p>
          </div>

          <div
            v-if="lastCommentary.timestamp"
            class="mt-2 text-xs text-gray-500 text-right"
          >
            {{ formatTime(lastCommentary.timestamp) }}
          </div>
        </div>
      </div>

      <!-- 右侧：Twitch 聊天 -->
      <div class="space-y-4" v-if="showTwitchPanel || twitchStatus.connected">
        <div class="gradient-border rounded-xl p-4 h-full flex flex-col">
          <div class="flex items-center justify-between mb-3">
            <h2 class="text-sm font-medium text-gray-400 flex items-center">
              <span class="material-icons mr-2 text-purple-400">chat</span>
              Twitch 聊天
            </h2>
            <div
              v-if="twitchStatus.connected"
              class="flex items-center text-xs text-green-400"
            >
              <span
                class="w-2 h-2 rounded-full bg-green-400 mr-1 pulse-dot"
              ></span>
              已连接
            </div>
          </div>

          <!-- Twitch 连接表单 -->
          <div v-if="!twitchStatus.connected" class="space-y-3 mb-4">
            <div>
              <label class="block text-xs text-gray-500 mb-1">频道名</label>
              <input
                v-model="twitchForm.channel"
                type="text"
                class="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:border-purple-500 focus:outline-none"
                placeholder="频道名称"
              />
            </div>
            <button
              @click="handleConnectTwitch"
              :disabled="!twitchForm.channel"
              class="w-full py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 flex items-center justify-center"
            >
              <span class="material-icons mr-2 text-sm">link</span>
              连接频道
            </button>
          </div>

          <!-- 断开连接按钮 -->
          <div v-else class="mb-3">
            <button
              @click="handleDisconnectTwitch"
              class="w-full py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors text-sm"
            >
              断开连接
            </button>
          </div>

          <!-- 聊天消息列表 -->
          <div class="flex-1 overflow-y-auto space-y-2 max-h-96">
            <div
              v-for="msg in twitchMessages"
              :key="msg.id"
              class="p-2 bg-gray-800/50 rounded-lg group hover:bg-gray-800 transition-colors"
            >
              <div class="flex items-start justify-between">
                <div class="flex-1 min-w-0">
                  <span class="text-purple-400 font-medium text-sm">{{
                    msg.username
                  }}</span>
                  <p class="text-white text-sm break-words">
                    {{ msg.message }}
                  </p>
                  <span class="text-xs text-gray-500">{{
                    formatTime(msg.timestamp)
                  }}</span>
                </div>
                <button
                  @click="replyToTwitchMessage(msg.id)"
                  :disabled="replying"
                  class="ml-2 p-1.5 bg-gaming-purple/20 text-gaming-purple rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gaming-purple/40 disabled:opacity-50"
                  title="AI回复"
                >
                  <span class="material-icons text-sm">reply</span>
                </button>
              </div>
            </div>

            <div
              v-if="twitchMessages.length === 0 && twitchStatus.connected"
              class="text-center py-8 text-gray-500"
            >
              <span class="material-icons text-3xl mb-2"
                >chat_bubble_outline</span
              >
              <p class="text-sm">等待聊天消息...</p>
            </div>
          </div>

          <!-- AI回复预览 -->
          <div
            v-if="twitchLastReply"
            class="mt-3 p-3 bg-gaming-purple/10 border border-gaming-purple/30 rounded-lg"
          >
            <div class="flex items-center justify-between mb-1">
              <span class="text-xs text-gaming-purple font-medium">AI回复</span>
              <span class="text-xs text-gray-500"
                >@{{ twitchLastReply.originalMessage?.username }}</span
              >
            </div>
            <p class="text-white text-sm">{{ twitchLastReply.reply }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- 底部状态 -->
    <div
      class="glass border-t border-gaming-purple/20 px-4 py-2 flex items-center justify-between text-sm"
    >
      <div class="flex items-center space-x-4">
        <span class="text-gray-500">处理状态:</span>
        <span :class="processing ? 'text-gaming-cyan' : 'text-gray-400'">
          {{ processing ? processingStatusText : '空闲' }}
        </span>
      </div>

      <div class="flex items-center space-x-4 text-gray-500">
        <span>模式: {{ state.mode === 'auto' ? '自动' : '手动' }}</span>
        <span v-if="state.mode === 'auto'"
          >| 间隔: {{ state.autoIntervalSeconds }}s</span
        >
      </div>
    </div>

    <!-- 音频播放器 -->
    <audio
      ref="audioPlayer"
      :src="lastAudio?.url"
      autoplay
      class="hidden"
    ></audio>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useSocket, useCommentary, useTwitch } from '../composables/useSocket'

const {
  state,
  processing,
  processingStatus,
  lastCommentary,
  lastAudio,
  lastScreenshot
} = useSocket()
const {
  connectOBS,
  disconnectOBS,
  setMode,
  start,
  stop,
  trigger,
  commentOnText: doCommentOnText,
  speakText,
  setInterval: setAutoInterval
} = useCommentary()
const {
  twitchStatus,
  twitchMessages,
  twitchLastReply,
  connectTwitch,
  disconnectTwitch,
  replyToMessage
} = useTwitch()

const inputText = ref('')
const intervalSeconds = ref(10)
const audioPlayer = ref(null)
const showTwitchPanel = ref(false)
const showMobileMenu = ref(false)
const replying = ref(false)

// 移动端菜单操作（避免在模板中写多语句）
const handleToggleTwitchFromMenu = () => {
  showTwitchPanel.value = !showTwitchPanel.value
  showMobileMenu.value = false
}

const handleToggleOBSFromMenu = () => {
  toggleOBS()
  showMobileMenu.value = false
}

// Twitch连接表单
const twitchForm = ref({
  channel: ''
})

// 快捷短语
const quickPhrases = [
  '精彩操作！',
  '这波稳了！',
  '有点危险...',
  '漂亮的配合！',
  '团战开始！',
  '节奏起来了！',
  '这是什么操作？',
  '太刺激了！'
]

// 处理状态文本
const processingStatusText = computed(() => {
  switch (processingStatus.value) {
    case 'capturing':
      return '截取画面中...'
    case 'analyzing':
      return 'AI分析中...'
    case 'synthesizing':
      return '生成语音中...'
    default:
      return '处理中...'
  }
})

// 切换OBS连接
const toggleOBS = () => {
  if (state.value.obsConnected) {
    disconnectOBS()
  } else {
    connectOBS()
  }
}

// 切换运行状态
const toggleRunning = () => {
  if (state.value.isRunning) {
    stop()
  } else {
    start()
  }
}

// 触发解说
const triggerCommentary = () => {
  trigger()
}

// 文字AI解说
const commentOnText = () => {
  if (inputText.value.trim()) {
    doCommentOnText(inputText.value.trim())
    inputText.value = ''
  }
}

// 直接朗读
const speakDirectly = () => {
  if (inputText.value.trim()) {
    speakText(inputText.value.trim())
    inputText.value = ''
  }
}

// 快捷短语朗读
const speakQuickPhrase = phrase => {
  speakText(phrase)
}

// 格式化时间
const formatTime = timestamp => {
  return new Date(timestamp).toLocaleTimeString('zh-CN')
}

// 连接Twitch
const handleConnectTwitch = () => {
  if (twitchForm.value.channel) {
    connectTwitch(twitchForm.value.channel)
  }
}

// 断开Twitch
const handleDisconnectTwitch = () => {
  disconnectTwitch()
}

// 回复Twitch消息
const replyToTwitchMessage = messageId => {
  replying.value = true
  replyToMessage(messageId)
  setTimeout(() => {
    replying.value = false
  }, 3000)
}

// 监听间隔变化
watch(intervalSeconds, val => {
  setAutoInterval(val)
})

// 初始化
onMounted(() => {
  intervalSeconds.value = state.value.autoIntervalSeconds
})

// 自动播放音频
watch(lastAudio, audio => {
  if (audio?.url && audioPlayer.value) {
    audioPlayer.value.src = audio.url
    audioPlayer.value.play().catch(() => {})
  }
})
</script>
