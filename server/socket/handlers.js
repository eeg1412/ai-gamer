/**
 * Socket.IO事件处理器
 * 处理实时通信事件
 */
export function initSocketHandlers(
  io,
  commentaryService,
  twitchService,
  memoryService
) {
  io.on('connection', socket => {
    console.log(`🔌 客户端连接: ${socket.id}`)

    // 发送当前状态
    socket.emit('state:sync', {
      state: commentaryService.getState(),
      settings: commentaryService.getSettings(),
      twitch: twitchService.getStatus(),
      activeMemories: memoryService.getActiveMemories()
    })

    // 连接OBS
    socket.on('obs:connect', async () => {
      const result = await commentaryService.obs.connect()
      socket.emit('obs:status', result)
      io.emit('state:sync', { state: commentaryService.getState() })
    })

    // 断开OBS
    socket.on('obs:disconnect', async () => {
      await commentaryService.obs.disconnect()
      io.emit('obs:status', { connected: false })
      io.emit('state:sync', { state: commentaryService.getState() })
    })

    // 获取OBS场景列表
    socket.on('obs:getScenes', async () => {
      const result = await commentaryService.obs.getScenes()
      socket.emit('obs:scenes', result)
    })

    // 切换解说模式
    socket.on('mode:set', data => {
      try {
        const result = commentaryService.setMode(data.mode)
        io.emit('mode:changed', result)
      } catch (error) {
        socket.emit('error', { message: error.message })
      }
    })

    // 开始解说
    socket.on('commentary:start', async () => {
      const result = await commentaryService.start()
      socket.emit('commentary:startResult', result)
    })

    // 停止解说
    socket.on('commentary:stop', () => {
      const result = commentaryService.stop()
      socket.emit('commentary:stopResult', result)
    })

    // 手动触发解说（画面解说）
    socket.on('commentary:trigger', async () => {
      const result = await commentaryService.performCommentary()
      socket.emit('commentary:result', result)
    })

    // 文字解说
    socket.on('commentary:text', async data => {
      const result = await commentaryService.commentOnText(data.text)
      socket.emit('commentary:result', result)
    })

    // 直接朗读
    socket.on('commentary:speak', async data => {
      const result = await commentaryService.speakText(data.text)
      socket.emit('commentary:result', result)
    })

    // 更新设置
    socket.on('settings:update', data => {
      const settings = commentaryService.updateSettings(data)
      io.emit('settings:updated', settings)
    })

    // 设置自动解说间隔
    socket.on('interval:set', data => {
      const result = commentaryService.setAutoInterval(data.seconds)
      io.emit('interval:changed', result)
    })

    // 获取状态
    socket.on('state:get', () => {
      socket.emit('state:sync', {
        state: commentaryService.getState(),
        settings: commentaryService.getSettings(),
        twitch: twitchService.getStatus(),
        activeMemories: memoryService.getActiveMemories()
      })
    })

    // ==================== Twitch相关事件 ====================

    // 连接Twitch
    socket.on('twitch:connect', async data => {
      const result = await twitchService.connect(data.channel, {
        username: data.username,
        token: data.token
      })
      socket.emit('twitch:connectResult', result)
      io.emit('twitch:status', twitchService.getStatus())
    })

    // 断开Twitch
    socket.on('twitch:disconnect', async () => {
      await twitchService.disconnect()
      io.emit('twitch:status', twitchService.getStatus())
    })

    // 获取聊天消息
    socket.on('twitch:getMessages', data => {
      const messages = twitchService.getRecentMessages(data?.limit || 50)
      socket.emit('twitch:messages', messages)
    })

    // AI回复聊天
    socket.on('twitch:reply', async data => {
      const message = twitchService.getMessageById(data.messageId)
      if (!message) {
        socket.emit('twitch:replyResult', {
          success: false,
          message: '消息不存在'
        })
        return
      }

      try {
        const memoryContext = memoryService
          .getActiveMemories()
          .map(m => m.content)
          .join('\n')

        const reply = await commentaryService.ai.replyToChat(
          message.message,
          message.username,
          data.customPrompt || commentaryService.getSettings().systemPrompt,
          memoryContext
        )

        // 记录交互
        memoryService.recordInteraction({
          type: 'chat_reply',
          input: `${message.username}: ${message.message}`,
          output: reply
        })

        // 生成TTS并广播
        const ttsResult = await commentaryService.tts.textToSpeech(reply)

        const result = {
          success: true,
          reply,
          originalMessage: message,
          audio: ttsResult.success ? ttsResult.audioUrl : null
        }

        // 广播回复
        io.emit('twitch:aiReply', result)
        socket.emit('twitch:replyResult', result)
      } catch (error) {
        socket.emit('twitch:replyResult', {
          success: false,
          message: error.message
        })
      }
    })

    // ==================== 记忆相关事件 ====================

    // 获取所有记忆
    socket.on('memory:getAll', () => {
      const memories = memoryService.getAllMemories()
      socket.emit('memory:list', memories)
    })

    // 设置激活的记忆
    socket.on('memory:setActive', data => {
      const memories = memoryService.setActiveMemories(data.memoryIds || [])
      io.emit('memory:activeUpdated', memories)
    })

    // 清除激活的记忆
    socket.on('memory:clearActive', () => {
      memoryService.clearActiveMemories()
      io.emit('memory:activeUpdated', [])
    })

    // 获取激活的记忆
    socket.on('memory:getActive', () => {
      const memories = memoryService.getActiveMemories()
      socket.emit('memory:activeList', memories)
    })

    // 创建记忆
    socket.on('memory:create', async data => {
      const memory = await memoryService.createManualMemory(data)
      io.emit('memory:created', memory)
    })

    // 删除记忆
    socket.on('memory:delete', data => {
      memoryService.deleteMemory(data.id)
      io.emit('memory:deleted', { id: data.id })
    })

    // 从会话生成记忆
    socket.on('memory:generateFromSession', async data => {
      const result = await memoryService.generateMemoryFromSession(data)
      socket.emit('memory:generateResult', result)
      if (result.success) {
        io.emit('memory:created', result.memory)
      }
    })

    // 开始新会话
    socket.on('memory:newSession', () => {
      const session = memoryService.startNewSession()
      socket.emit('memory:sessionStarted', session)
    })

    // 断开连接
    socket.on('disconnect', () => {
      console.log(`🔌 客户端断开: ${socket.id}`)
    })
  })
}
