import { io } from 'socket.io-client'
import { ref, readonly } from 'vue'

// 单例Socket实例
let socket = null

// 响应式状态
const connected = ref(false)
const state = ref({
  mode: 'manual',
  isRunning: false,
  autoIntervalSeconds: 10,
  currentCommentary: '',
  lastCommentaryTime: null,
  obsConnected: false,
  aiInitialized: false
})
const settings = ref({
  systemPrompt: '',
  userPrompt: '',
  ttsEnabled: true,
  ttsVoice: 'zh-CN-XiaoxiaoNeural',
  ttsRate: '+0%',
  maxTokens: 150
})
const processing = ref(false)
const processingStatus = ref('')
const lastAudio = ref(null)
const lastScreenshot = ref(null)
const lastCommentary = ref({ text: '', timestamp: null })
const error = ref(null)

// Twitch 相关状态
const twitchStatus = ref({
  connected: false,
  channel: '',
  username: ''
})
const twitchMessages = ref([])
const twitchLastReply = ref(null)

// 记忆相关状态
const memories = ref([])
const activeMemories = ref([])

// 事件监听器存储
const listeners = new Map()

/**
 * Socket.IO连接管理
 */
export function useSocket() {
  const connect = () => {
    if (socket && socket.connected) return

    const wsUrl = import.meta.env.PROD
      ? window.location.origin
      : 'http://localhost:3000'

    socket = io(wsUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    })

    // 连接事件
    socket.on('connect', () => {
      connected.value = true
      error.value = null
      console.log('🔌 Socket已连接')
    })

    socket.on('disconnect', () => {
      connected.value = false
      console.log('🔌 Socket已断开')
    })

    socket.on('connect_error', err => {
      error.value = `连接错误: ${err.message}`
      console.error('Socket连接错误:', err)
    })

    // 状态同步
    socket.on('state:sync', data => {
      if (data.state) {
        state.value = { ...state.value, ...data.state }
      }
      if (data.settings) {
        settings.value = { ...settings.value, ...data.settings }
      }
      if (data.twitch) {
        twitchStatus.value = { ...twitchStatus.value, ...data.twitch }
      }
      if (data.activeMemories) {
        activeMemories.value = data.activeMemories
      }
    })

    // OBS状态
    socket.on('obs:status', data => {
      state.value.obsConnected = data.connected || data.success
    })

    // 模式变更
    socket.on('mode:changed', data => {
      state.value.mode = data.mode
    })

    // 解说开始/停止
    socket.on('commentary:started', data => {
      state.value.isRunning = true
      state.value.mode = data.mode
    })

    socket.on('commentary:stopped', () => {
      state.value.isRunning = false
    })

    // 解说处理状态
    socket.on('commentary:processing', data => {
      processing.value = data.status !== 'complete'
      processingStatus.value = data.status
    })

    // 解说文字
    socket.on('commentary:text', data => {
      lastCommentary.value = {
        text: data.text,
        timestamp: data.timestamp,
        inputText: data.inputText,
        direct: data.direct
      }
      state.value.currentCommentary = data.text
      state.value.lastCommentaryTime = data.timestamp
    })

    // 解说截图
    socket.on('commentary:screenshot', data => {
      lastScreenshot.value = data.screenshot
    })

    // 解说音频
    socket.on('commentary:audio', data => {
      lastAudio.value = {
        url: data.audioUrl,
        text: data.text,
        timestamp: data.timestamp
      }
    })

    // 设置更新
    socket.on('settings:updated', data => {
      settings.value = { ...settings.value, ...data }
    })

    // 间隔变更
    socket.on('interval:changed', data => {
      state.value.autoIntervalSeconds = data.seconds
    })

    // 错误处理
    socket.on('commentary:error', data => {
      error.value = data.message
      processing.value = false
    })

    socket.on('error', data => {
      error.value = data.message
    })

    // ========== Twitch 事件 ==========
    socket.on('twitch:status', data => {
      twitchStatus.value = data
    })

    socket.on('twitch:message', data => {
      twitchMessages.value.unshift(data)
      // 保留最新100条消息
      if (twitchMessages.value.length > 100) {
        twitchMessages.value = twitchMessages.value.slice(0, 100)
      }
    })

    socket.on('twitch:messages', data => {
      twitchMessages.value = data
    })

    socket.on('twitch:aiReply', data => {
      twitchLastReply.value = data
    })

    socket.on('twitch:connectResult', data => {
      if (data.success) {
        twitchStatus.value.connected = true
      }
    })

    // ========== 记忆事件 ==========
    socket.on('memory:list', data => {
      memories.value = data
    })

    socket.on('memory:activeUpdated', data => {
      activeMemories.value = data
    })

    socket.on('memory:activeList', data => {
      activeMemories.value = data
    })

    socket.on('memory:created', data => {
      memories.value.unshift(data)
    })

    socket.on('memory:deleted', data => {
      memories.value = memories.value.filter(m => m.id !== data.id)
      activeMemories.value = activeMemories.value.filter(m => m.id !== data.id)
    })
  }

  const disconnect = () => {
    if (socket) {
      socket.disconnect()
      socket = null
    }
  }

  const emit = (event, data) => {
    if (socket && socket.connected) {
      socket.emit(event, data)
    } else {
      console.warn('Socket未连接，无法发送事件:', event)
    }
  }

  const on = (event, callback) => {
    if (socket) {
      socket.on(event, callback)
      if (!listeners.has(event)) {
        listeners.set(event, [])
      }
      listeners.get(event).push(callback)
    }
  }

  const off = (event, callback) => {
    if (socket) {
      socket.off(event, callback)
    }
  }

  return {
    // 状态
    connected: readonly(connected),
    state: readonly(state),
    settings: readonly(settings),
    processing: readonly(processing),
    processingStatus: readonly(processingStatus),
    lastAudio: readonly(lastAudio),
    lastScreenshot: readonly(lastScreenshot),
    lastCommentary: readonly(lastCommentary),
    error: readonly(error),

    // Twitch 状态
    twitchStatus: readonly(twitchStatus),
    twitchMessages: readonly(twitchMessages),
    twitchLastReply: readonly(twitchLastReply),

    // 记忆状态
    memories: readonly(memories),
    activeMemories: readonly(activeMemories),

    // 方法
    connect,
    disconnect,
    emit,
    on,
    off
  }
}

/**
 * 解说控制
 */
export function useCommentary() {
  const { emit, state, settings, processing, lastCommentary, lastAudio } =
    useSocket()

  const connectOBS = () => emit('obs:connect')
  const disconnectOBS = () => emit('obs:disconnect')
  const getScenes = () => emit('obs:getScenes')

  const setMode = mode => emit('mode:set', { mode })
  const start = () => emit('commentary:start')
  const stop = () => emit('commentary:stop')
  const trigger = directorPrompt =>
    emit('commentary:trigger', { directorPrompt })
  const commentOnText = text => emit('commentary:text', { text })
  const speakText = text => emit('commentary:speak', { text })
  const setInterval = seconds => emit('interval:set', { seconds })
  const updateSettings = newSettings => emit('settings:update', newSettings)

  const clearError = () => {
    error.value = null
  }

  return {
    // 状态
    state,
    settings,
    processing,
    lastCommentary,
    lastAudio,

    // OBS控制
    connectOBS,
    disconnectOBS,
    getScenes,

    // 解说控制
    setMode,
    start,
    stop,
    trigger,
    commentOnText,
    speakText,
    setInterval,
    updateSettings,
    clearError
  }
}

/**
 * Twitch 聊天控制
 */
export function useTwitch() {
  const { emit, twitchStatus, twitchMessages, twitchLastReply } = useSocket()

  const connectTwitch = (channel, username, token) => {
    emit('twitch:connect', { channel, username, token })
  }

  const disconnectTwitch = () => {
    emit('twitch:disconnect')
  }

  const getMessages = (limit = 50) => {
    emit('twitch:getMessages', { limit })
  }

  const replyToMessage = (messageId, customPrompt = '') => {
    emit('twitch:reply', { messageId, customPrompt })
  }

  return {
    twitchStatus,
    twitchMessages,
    twitchLastReply,
    connectTwitch,
    disconnectTwitch,
    getMessages,
    replyToMessage
  }
}

/**
 * 记忆管理
 */
export function useMemory() {
  const { emit, memories, activeMemories } = useSocket()

  const getAllMemories = () => {
    emit('memory:getAll')
  }

  const setActiveMemories = memoryIds => {
    emit('memory:setActive', { memoryIds })
  }

  const clearActiveMemories = () => {
    emit('memory:clearActive')
  }

  const createMemory = data => {
    emit('memory:create', data)
  }

  const deleteMemory = id => {
    emit('memory:delete', { id })
  }

  const generateFromSession = data => {
    emit('memory:generateFromSession', data)
  }

  const startNewSession = () => {
    emit('memory:newSession')
  }

  return {
    memories,
    activeMemories,
    getAllMemories,
    setActiveMemories,
    clearActiveMemories,
    createMemory,
    deleteMemory,
    generateFromSession,
    startNewSession
  }
}
