import tmi from 'tmi.js'

/**
 * Twitch聊天服务
 * 连接Twitch IRC获取聊天消息
 */
export class TwitchService {
  constructor(config, io) {
    this.config = config
    this.io = io
    this.client = null
    this.connected = false
    this.channel = null
    this.messages = [] // 保存最近的消息
    this.maxMessages = 100 // 最多保存100条
  }

  /**
   * 连接到Twitch频道
   */
  async connect(channel, options = {}) {
    if (this.connected && this.channel === channel) {
      return { success: true, message: '已连接到该频道' }
    }

    // 如果已连接其他频道，先断开
    if (this.connected) {
      await this.disconnect()
    }

    try {
      const clientOptions = {
        options: { debug: false },
        connection: {
          secure: true,
          reconnect: true
        },
        channels: [channel]
      }

      // 如果提供了认证信息（用于发送消息）
      if (options.username && options.token) {
        clientOptions.identity = {
          username: options.username,
          password: options.token // OAuth token
        }
      }

      this.client = new tmi.Client(clientOptions)

      // 设置事件监听
      this.setupEventListeners()

      await this.client.connect()
      this.connected = true
      this.channel = channel
      this.messages = []

      console.log(`✅ 已连接到Twitch频道: ${channel}`)

      return {
        success: true,
        message: `已连接到频道: ${channel}`,
        channel
      }
    } catch (error) {
      console.error('❌ Twitch连接失败:', error.message)
      return {
        success: false,
        message: `连接失败: ${error.message}`
      }
    }
  }

  /**
   * 设置事件监听器
   */
  setupEventListeners() {
    // 收到消息
    this.client.on('message', (channel, tags, message, self) => {
      if (self) return // 忽略自己发送的消息

      const chatMessage = {
        id: tags.id || Date.now().toString(),
        channel: channel.replace('#', ''),
        username: tags['display-name'] || tags.username,
        userId: tags['user-id'],
        message: message,
        color: tags.color || '#9147ff',
        badges: tags.badges || {},
        emotes: tags.emotes || {},
        timestamp: new Date().toISOString(),
        isSubscriber: tags.subscriber,
        isMod: tags.mod,
        isVip: tags.vip,
        isBroadcaster: tags.badges?.broadcaster === '1'
      }

      // 添加到消息列表
      this.messages.unshift(chatMessage)
      if (this.messages.length > this.maxMessages) {
        this.messages.pop()
      }

      // 广播给前端
      this.io.emit('twitch:message', chatMessage)
    })

    // 连接成功
    this.client.on('connected', (addr, port) => {
      this.io.emit('twitch:connected', {
        channel: this.channel,
        address: addr,
        port
      })
    })

    // 断开连接
    this.client.on('disconnected', reason => {
      this.connected = false
      this.io.emit('twitch:disconnected', { reason })
    })

    // 订阅事件
    this.client.on(
      'subscription',
      (channel, username, method, message, userstate) => {
        this.io.emit('twitch:subscription', {
          channel: channel.replace('#', ''),
          username,
          method,
          message
        })
      }
    )

    // 赠送订阅
    this.client.on(
      'subgift',
      (channel, username, streakMonths, recipient, methods, userstate) => {
        this.io.emit('twitch:subgift', {
          channel: channel.replace('#', ''),
          gifter: username,
          recipient
        })
      }
    )

    // Raid事件
    this.client.on('raided', (channel, username, viewers) => {
      this.io.emit('twitch:raid', {
        channel: channel.replace('#', ''),
        from: username,
        viewers
      })
    })

    // Cheer (Bits)
    this.client.on('cheer', (channel, userstate, message) => {
      this.io.emit('twitch:cheer', {
        channel: channel.replace('#', ''),
        username: userstate['display-name'],
        bits: userstate.bits,
        message
      })
    })
  }

  /**
   * 断开连接
   */
  async disconnect() {
    if (this.client && this.connected) {
      await this.client.disconnect()
      this.connected = false
      this.channel = null
      this.messages = []
      console.log('已断开Twitch连接')
    }
    return { success: true, message: '已断开连接' }
  }

  /**
   * 获取连接状态
   */
  getStatus() {
    return {
      connected: this.connected,
      channel: this.channel,
      messageCount: this.messages.length
    }
  }

  /**
   * 获取最近的消息
   */
  getRecentMessages(limit = 50) {
    return this.messages.slice(0, limit)
  }

  /**
   * 获取指定消息
   */
  getMessageById(id) {
    return this.messages.find(m => m.id === id)
  }

  /**
   * 发送消息到频道（需要认证）
   */
  async sendMessage(message) {
    if (!this.connected || !this.channel) {
      return { success: false, message: '未连接到频道' }
    }

    try {
      await this.client.say(this.channel, message)
      return { success: true, message: '消息已发送' }
    } catch (error) {
      return { success: false, message: error.message }
    }
  }

  /**
   * 清空消息缓存
   */
  clearMessages() {
    this.messages = []
    this.io.emit('twitch:messagesCleared')
    return { success: true }
  }
}
