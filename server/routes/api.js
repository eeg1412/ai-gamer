import { Router } from 'express'

const router = Router()

/**
 * 获取服务状态
 */
router.get('/status', (req, res) => {
  const services = req.app.get('services')

  res.json({
    success: true,
    data: {
      obs: services.obs.getStatus(),
      ai: services.ai.getStatus(),
      tts: services.tts.getConfig(),
      commentary: services.commentary.getState(),
      twitch: services.twitch.getStatus(),
      memory: services.memory.getMemoryStats()
    }
  })
})

/**
 * OBS相关API
 */
router.post('/obs/connect', async (req, res) => {
  const services = req.app.get('services')
  const result = await services.obs.connect()
  res.json(result)
})

router.post('/obs/disconnect', async (req, res) => {
  const services = req.app.get('services')
  await services.obs.disconnect()
  res.json({ success: true, message: '已断开OBS连接' })
})

router.get('/obs/scenes', async (req, res) => {
  const services = req.app.get('services')
  const result = await services.obs.getScenes()
  res.json(result)
})

router.post('/obs/screenshot', async (req, res) => {
  const services = req.app.get('services')
  const screenshot = await services.obs.captureScreenshot()

  if (screenshot) {
    res.json({ success: true, image: screenshot })
  } else {
    res.status(500).json({ success: false, message: '截图失败' })
  }
})

/**
 * 解说设置API
 */
router.get('/settings', (req, res) => {
  const services = req.app.get('services')
  res.json({
    success: true,
    data: services.commentary.getSettings()
  })
})

router.put('/settings', async (req, res) => {
  const services = req.app.get('services')
  const settings = await services.commentary.updateSettings(req.body)
  res.json({ success: true, data: settings })
})

/**
 * 解说控制API
 */
router.post('/commentary/start', async (req, res) => {
  const services = req.app.get('services')
  const result = await services.commentary.start()
  res.json(result)
})

router.post('/commentary/stop', (req, res) => {
  const services = req.app.get('services')
  const result = services.commentary.stop()
  res.json(result)
})

router.post('/commentary/trigger', async (req, res) => {
  const services = req.app.get('services')
  const result = await services.commentary.performCommentary()
  res.json(result)
})

router.post('/commentary/text', async (req, res) => {
  const services = req.app.get('services')
  const { text } = req.body

  if (!text) {
    return res.status(400).json({ success: false, message: '缺少文字内容' })
  }

  const result = await services.commentary.commentOnText(text)
  res.json(result)
})

router.post('/commentary/speak', async (req, res) => {
  const services = req.app.get('services')
  const { text } = req.body

  if (!text) {
    return res.status(400).json({ success: false, message: '缺少文字内容' })
  }

  const result = await services.commentary.speakText(text)
  res.json(result)
})

router.post('/commentary/mode', (req, res) => {
  const services = req.app.get('services')
  const { mode } = req.body

  try {
    const result = services.commentary.setMode(mode)
    res.json({ success: true, ...result })
  } catch (error) {
    res.status(400).json({ success: false, message: error.message })
  }
})

router.post('/commentary/interval', (req, res) => {
  const services = req.app.get('services')
  const { seconds } = req.body

  const result = services.commentary.setAutoInterval(seconds)
  res.json({ success: true, ...result })
})

/**
 * TTS相关API
 */
router.get('/tts/voices', async (req, res) => {
  const services = req.app.get('services')
  const voices = await services.tts.getChineseVoices()
  res.json({ success: true, data: voices })
})

router.post('/tts/preview', async (req, res) => {
  const services = req.app.get('services')
  const { text, voice, rate } = req.body

  const result = await services.tts.textToSpeech(text || '这是一段测试语音', {
    voice,
    rate
  })

  res.json(result)
})

// ==================== Token统计API ====================

/**
 * 获取Token使用统计
 */
router.get('/stats/tokens', (req, res) => {
  const services = req.app.get('services')
  const db = services.db

  res.json({
    success: true,
    data: {
      today: db.getTodayTokenUsage(),
      week: db.getWeekTokenUsage(),
      month: db.getMonthTokenUsage(),
      byType: db.getTokenUsageByType(),
      trend: db.getDailyTokenTrend(30)
    }
  })
})

// ==================== 记忆API ====================

/**
 * 获取所有记忆
 */
router.get('/memories', (req, res) => {
  const services = req.app.get('services')
  const { type, game, search, limit } = req.query

  let memories
  if (search) {
    memories = services.memory.searchMemories(search)
  } else if (type) {
    memories = services.memory.getMemoriesByType(type)
  } else if (game) {
    memories = services.memory.getMemoriesByGame(game)
  } else {
    memories = services.memory.getAllMemories(parseInt(limit) || 100)
  }

  res.json({ success: true, data: memories })
})

/**
 * 获取单个记忆
 */
router.get('/memories/:id', (req, res) => {
  const services = req.app.get('services')
  const memory = services.db.getMemoryById(parseInt(req.params.id))

  if (memory) {
    res.json({ success: true, data: memory })
  } else {
    res.status(404).json({ success: false, message: '记忆不存在' })
  }
})

/**
 * 创建记忆
 */
router.post('/memories', async (req, res) => {
  const services = req.app.get('services')
  const memory = await services.memory.createManualMemory(req.body)
  res.json({ success: true, data: memory })
})

/**
 * 更新记忆
 */
router.put('/memories/:id', (req, res) => {
  const services = req.app.get('services')
  const memory = services.memory.updateMemory(parseInt(req.params.id), req.body)
  res.json({ success: true, data: memory })
})

/**
 * 删除记忆
 */
router.delete('/memories/:id', (req, res) => {
  const services = req.app.get('services')
  services.memory.deleteMemory(parseInt(req.params.id))
  res.json({ success: true, message: '记忆已删除' })
})

/**
 * 设置激活的记忆
 */
router.post('/memories/active', (req, res) => {
  const services = req.app.get('services')
  const { memoryIds } = req.body
  const memories = services.memory.setActiveMemories(memoryIds || [])
  res.json({ success: true, data: memories })
})

/**
 * 获取激活的记忆
 */
router.get('/memories/active/list', (req, res) => {
  const services = req.app.get('services')
  const memories = services.memory.getActiveMemories()
  res.json({ success: true, data: memories })
})

/**
 * 从当前会话生成记忆
 */
router.post('/memories/generate', async (req, res) => {
  const services = req.app.get('services')
  const result = await services.memory.generateMemoryFromSession(req.body)
  res.json(result)
})

/**
 * 开始新会话
 */
router.post('/memories/session/new', (req, res) => {
  const services = req.app.get('services')
  const session = services.memory.startNewSession()
  res.json({ success: true, data: session })
})

/**
 * 获取当前会话信息
 */
router.get('/memories/session/current', (req, res) => {
  const services = req.app.get('services')
  const session = services.memory.getCurrentSession()
  res.json({ success: true, data: session })
})

// ==================== Twitch API ====================

/**
 * 连接Twitch频道
 */
router.post('/twitch/connect', async (req, res) => {
  const services = req.app.get('services')
  const { channel, username, token } = req.body

  if (!channel) {
    return res.status(400).json({ success: false, message: '请提供频道名' })
  }

  const result = await services.twitch.connect(channel, { username, token })
  res.json(result)
})

/**
 * 断开Twitch连接
 */
router.post('/twitch/disconnect', async (req, res) => {
  const services = req.app.get('services')
  const result = await services.twitch.disconnect()
  res.json(result)
})

/**
 * 获取Twitch状态
 */
router.get('/twitch/status', (req, res) => {
  const services = req.app.get('services')
  res.json({ success: true, data: services.twitch.getStatus() })
})

/**
 * 获取最近聊天消息
 */
router.get('/twitch/messages', (req, res) => {
  const services = req.app.get('services')
  const { limit } = req.query
  const messages = services.twitch.getRecentMessages(parseInt(limit) || 50)
  res.json({ success: true, data: messages })
})

/**
 * AI回复聊天消息
 */
router.post('/twitch/reply', async (req, res) => {
  const services = req.app.get('services')
  const { messageId, customPrompt } = req.body

  const message = services.twitch.getMessageById(messageId)
  if (!message) {
    return res.status(404).json({ success: false, message: '消息不存在' })
  }

  try {
    // 获取记忆上下文
    const memoryContext = services.memory
      .getActiveMemories()
      .map(m => m.content)
      .join('\n')

    // 生成AI回复
    const reply = await services.ai.replyToChat(
      message.message,
      message.username,
      customPrompt || services.commentary.getSettings().systemPrompt,
      memoryContext
    )

    // 记录交互
    services.memory.recordInteraction({
      type: 'chat_reply',
      input: `${message.username}: ${message.message}`,
      output: reply
    })

    // 生成TTS
    const ttsResult = await services.tts.textToSpeech(reply)

    res.json({
      success: true,
      data: {
        reply,
        originalMessage: message,
        audio: ttsResult.success ? ttsResult.audioUrl : null
      }
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

/**
 * 清空聊天消息缓存
 */
router.post('/twitch/messages/clear', (req, res) => {
  const services = req.app.get('services')
  services.twitch.clearMessages()
  res.json({ success: true, message: '消息已清空' })
})

export default router
