/**
 * 解说服务 - 核心业务逻辑
 * 负责协调OBS、AI、TTS服务，实现自动/手动解说功能
 */
export class CommentaryService {
  constructor(obsService, aiService, ttsService, io, memoryService = null) {
    this.obs = obsService
    this.ai = aiService
    this.tts = ttsService
    this.io = io
    this.memory = memoryService

    // 解说状态
    this.state = {
      mode: 'manual', // 'auto' | 'manual'
      isRunning: false,
      autoIntervalSeconds: 10,
      currentCommentary: '',
      lastCommentaryTime: null
    }

    // 解说配置
    this.settings = {
      systemPrompt:
        '你是一位专业的游戏解说员，风格幽默风趣，善于分析游戏局势。解说要简洁有力，每次解说控制在50字以内。',
      userPrompt:
        '请根据当前游戏画面进行精彩解说，注意分析玩家的操作和当前局势。',
      ttsEnabled: true,
      ttsVoice: 'zh-CN-XiaoxiaoNeural',
      ttsRate: '+0%',
      maxTokens: 150
    }

    // 自动解说定时器
    this.autoTimer = null

    // 定期清理音频文件
    setInterval(() => {
      this.tts.cleanupOldFiles(3600000)
    }, 1800000) // 每30分钟清理一次
  }

  /**
   * 获取当前状态
   */
  getState() {
    return {
      ...this.state,
      obsConnected: this.obs.connected,
      aiInitialized: this.ai.initialized
    }
  }

  /**
   * 获取解说设置
   */
  getSettings() {
    return { ...this.settings }
  }

  /**
   * 更新解说设置
   */
  updateSettings(newSettings) {
    this.settings = { ...this.settings, ...newSettings }

    // 如果TTS设置改变，更新TTS服务配置
    if (newSettings.ttsVoice || newSettings.ttsRate) {
      this.tts.updateConfig({
        voice: this.settings.ttsVoice,
        rate: this.settings.ttsRate
      })
    }

    // 广播设置更新
    this.io.emit('settings:updated', this.settings)

    return this.settings
  }

  /**
   * 设置解说模式
   */
  setMode(mode) {
    if (mode !== 'auto' && mode !== 'manual') {
      throw new Error('无效的解说模式')
    }

    const wasRunning = this.state.isRunning

    // 停止当前运行
    if (wasRunning) {
      this.stop()
    }

    this.state.mode = mode
    this.io.emit('mode:changed', { mode })

    return { mode, wasRunning }
  }

  /**
   * 开始解说
   */
  async start() {
    if (this.state.isRunning) {
      return { success: false, message: '解说已在运行中' }
    }

    // 检查OBS连接
    if (!this.obs.connected) {
      const connectResult = await this.obs.connect()
      if (!connectResult.success) {
        return {
          success: false,
          message: 'OBS未连接: ' + connectResult.message
        }
      }
    }

    this.state.isRunning = true
    this.io.emit('commentary:started', { mode: this.state.mode })

    if (this.state.mode === 'auto') {
      this.startAutoCommentary()
    }

    return { success: true, message: '解说已开始', mode: this.state.mode }
  }

  /**
   * 停止解说
   */
  stop() {
    if (this.autoTimer) {
      clearInterval(this.autoTimer)
      this.autoTimer = null
    }

    this.state.isRunning = false
    this.io.emit('commentary:stopped')

    return { success: true, message: '解说已停止' }
  }

  /**
   * 开始自动解说
   */
  startAutoCommentary() {
    if (this.autoTimer) {
      clearInterval(this.autoTimer)
    }

    // 立即执行一次
    this.performCommentary()

    // 设置定时器
    this.autoTimer = setInterval(() => {
      if (this.state.isRunning && this.state.mode === 'auto') {
        this.performCommentary()
      }
    }, this.state.autoIntervalSeconds * 1000)
  }

  /**
   * 设置自动解说间隔
   */
  setAutoInterval(seconds) {
    this.state.autoIntervalSeconds = Math.max(5, Math.min(60, seconds))

    // 如果正在运行自动模式，重启定时器
    if (this.state.isRunning && this.state.mode === 'auto') {
      this.startAutoCommentary()
    }

    this.io.emit('interval:changed', {
      seconds: this.state.autoIntervalSeconds
    })
    return { seconds: this.state.autoIntervalSeconds }
  }

  /**
   * 执行一次解说（截图 -> AI分析 -> TTS）
   */
  async performCommentary() {
    try {
      this.io.emit('commentary:processing', { status: 'capturing' })

      // 1. 截取画面
      const screenshot = await this.obs.captureScreenshot()
      if (!screenshot) {
        throw new Error('无法截取画面')
      }

      this.io.emit('commentary:processing', { status: 'analyzing' })

      // 2. 构建带记忆的提示词
      let systemPrompt = this.settings.systemPrompt
      if (this.memory) {
        systemPrompt = this.memory.buildPromptWithMemory(systemPrompt)
      }

      // 3. AI生成解说
      const commentary = await this.ai.generateCommentary(
        screenshot,
        systemPrompt,
        this.settings.userPrompt,
        { maxTokens: this.settings.maxTokens }
      )

      this.state.currentCommentary = commentary
      this.state.lastCommentaryTime = new Date().toISOString()

      // 4. 记录交互（用于生成记忆）
      if (this.memory) {
        this.memory.recordInteraction({
          type: 'commentary',
          input: '[游戏画面截图]',
          output: commentary,
          hasImage: true
        })
      }

      // 3. 广播解说文字
      this.io.emit('commentary:text', {
        text: commentary,
        timestamp: this.state.lastCommentaryTime
      })

      // 4. 生成语音（如果启用）
      if (this.settings.ttsEnabled) {
        this.io.emit('commentary:processing', { status: 'synthesizing' })

        const ttsResult = await this.tts.textToSpeech(commentary, {
          voice: this.settings.ttsVoice,
          rate: this.settings.ttsRate
        })

        if (ttsResult.success) {
          this.io.emit('commentary:audio', {
            audioUrl: ttsResult.audioUrl,
            text: commentary,
            timestamp: this.state.lastCommentaryTime
          })
        }
      }

      this.io.emit('commentary:processing', { status: 'complete' })

      return {
        success: true,
        commentary,
        timestamp: this.state.lastCommentaryTime
      }
    } catch (error) {
      console.error('解说执行失败:', error.message)
      this.io.emit('commentary:error', { message: error.message })
      return { success: false, message: error.message }
    }
  }

  /**
   * 手动触发一次解说
   */
  async triggerManualCommentary() {
    if (this.state.mode !== 'manual') {
      return { success: false, message: '当前不是手动模式' }
    }

    return await this.performCommentary()
  }

  /**
   * 手动输入文字进行解说
   */
  async commentOnText(inputText) {
    try {
      this.io.emit('commentary:processing', { status: 'analyzing' })

      // 构建带记忆的提示词
      let systemPrompt = this.settings.systemPrompt
      if (this.memory) {
        systemPrompt = this.memory.buildPromptWithMemory(systemPrompt)
      }

      // AI处理输入文字
      const commentary = await this.ai.generateTextCommentary(
        inputText,
        systemPrompt,
        { maxTokens: this.settings.maxTokens }
      )

      this.state.currentCommentary = commentary
      this.state.lastCommentaryTime = new Date().toISOString()

      // 记录交互
      if (this.memory) {
        this.memory.recordInteraction({
          type: 'text_commentary',
          input: inputText,
          output: commentary
        })
      }

      // 广播解说文字
      this.io.emit('commentary:text', {
        text: commentary,
        timestamp: this.state.lastCommentaryTime,
        inputText
      })

      // 生成语音
      if (this.settings.ttsEnabled) {
        this.io.emit('commentary:processing', { status: 'synthesizing' })

        const ttsResult = await this.tts.textToSpeech(commentary, {
          voice: this.settings.ttsVoice,
          rate: this.settings.ttsRate
        })

        if (ttsResult.success) {
          this.io.emit('commentary:audio', {
            audioUrl: ttsResult.audioUrl,
            text: commentary,
            timestamp: this.state.lastCommentaryTime
          })
        }
      }

      this.io.emit('commentary:processing', { status: 'complete' })

      return {
        success: true,
        commentary,
        timestamp: this.state.lastCommentaryTime
      }
    } catch (error) {
      console.error('文字解说失败:', error.message)
      this.io.emit('commentary:error', { message: error.message })
      return { success: false, message: error.message }
    }
  }

  /**
   * 直接朗读文字（不经过AI处理）
   */
  async speakText(text) {
    try {
      this.state.currentCommentary = text
      this.state.lastCommentaryTime = new Date().toISOString()

      // 广播文字
      this.io.emit('commentary:text', {
        text,
        timestamp: this.state.lastCommentaryTime,
        direct: true
      })

      // 生成语音
      const ttsResult = await this.tts.textToSpeech(text, {
        voice: this.settings.ttsVoice,
        rate: this.settings.ttsRate
      })

      if (ttsResult.success) {
        this.io.emit('commentary:audio', {
          audioUrl: ttsResult.audioUrl,
          text,
          timestamp: this.state.lastCommentaryTime
        })
      }

      return { success: true, text }
    } catch (error) {
      console.error('朗读文字失败:', error.message)
      return { success: false, message: error.message }
    }
  }
}
