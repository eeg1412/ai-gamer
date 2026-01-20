import { OBSWebSocket } from 'obs-websocket-js'

/**
 * OBS WebSocket服务
 * 负责与OBS Studio通信，获取直播画面截图
 */
export class OBSService {
  constructor(config) {
    this.config = config
    this.obs = new OBSWebSocket()
    this.connected = false
    this.currentScene = null
  }

  /**
   * 连接到OBS WebSocket
   */
  async connect() {
    if (this.connected) {
      return { success: true, message: '已连接到OBS' }
    }

    try {
      const url = this.config.url || 'ws://127.0.0.1:4455'
      const password = this.config.password

      console.log(
        `📡 正在尝试连接到 OBS: ${url} (密码: ${password ? '***' : '未提供'})`
      )

      const { obsWebSocketVersion, negotiatedRpcVersion } =
        await this.obs.connect(url, password, {
          rpcVersion: 1
        })

      this.connected = true
      console.log(
        `✅ 已连接到OBS WebSocket v${obsWebSocketVersion} (RPC ${negotiatedRpcVersion})`
      )

      // 监听连接关闭事件
      this.obs.on('ConnectionClosed', () => {
        this.connected = false
        console.log('⚠️ OBS WebSocket连接已断开')
      })

      // 获取当前场景
      await this.updateCurrentScene()

      return {
        success: true,
        message: `已连接到OBS WebSocket v${obsWebSocketVersion}`,
        version: obsWebSocketVersion
      }
    } catch (error) {
      this.connected = false
      console.error('❌ OBS连接失败:', error.message)
      return {
        success: false,
        message: `连接失败: ${error.message}`
      }
    }
  }

  /**
   * 断开OBS连接
   */
  async disconnect() {
    if (this.connected) {
      await this.obs.disconnect()
      this.connected = false
      console.log('已断开OBS连接')
    }
  }

  /**
   * 更新配置
   */
  async updateConfig(newConfig) {
    if (!newConfig) return { success: false, message: '配置不能为空' }

    const oldUrl = this.config.url
    const oldPassword = this.config.password

    // 只有当有新值且不为 undefined 时才更新
    if (typeof newConfig.url === 'string') {
      this.config.url = newConfig.url
    }

    // 如果新密码是 undefined，保留旧密码
    // 如果新密码是空字符串，可能是用户想清空密码，但也可能是 UI 没填
    // 为了防止 UI 没填导致覆盖，我们只有在密码确实发生变化时才记录新密码
    if (typeof newConfig.password === 'string' && newConfig.password !== '') {
      this.config.password = newConfig.password
    } else if (newConfig.password === '') {
      // 允许清空密码，但如果原来有密码且这次是空，我们先打印个警告
      console.log(
        '⚠️ 收到空密码配置，如果要取消 OBS 密码请确保 OBS 端也已同步取消'
      )
      this.config.password = ''
    }

    const needReconnect =
      this.config.url !== oldUrl || this.config.password !== oldPassword

    if (needReconnect && this.connected) {
      console.log('🔄 OBS配置已更改，正在重新连接...')
      await this.disconnect()
      return await this.connect()
    }

    return { success: true, message: '配置已更新' }
  }

  /**
   * 获取连接状态
   */
  getStatus() {
    return {
      connected: this.connected,
      currentScene: this.currentScene
    }
  }

  /**
   * 更新当前场景
   */
  async updateCurrentScene() {
    if (!this.connected) return null

    try {
      const { currentProgramSceneName } = await this.obs.call(
        'GetCurrentProgramScene'
      )
      this.currentScene = currentProgramSceneName
      return currentProgramSceneName
    } catch (error) {
      console.error('获取场景失败:', error.message)
      return null
    }
  }

  /**
   * 获取场景列表
   */
  async getScenes() {
    if (!this.connected) {
      return { success: false, scenes: [], message: '未连接到OBS' }
    }

    try {
      const { scenes, currentProgramSceneName } =
        await this.obs.call('GetSceneList')
      this.currentScene = currentProgramSceneName
      return {
        success: true,
        scenes: scenes.map(s => s.sceneName),
        currentScene: currentProgramSceneName
      }
    } catch (error) {
      return { success: false, scenes: [], message: error.message }
    }
  }

  /**
   * 截取当前画面
   * @returns {Promise<string|null>} Base64编码的图片数据
   */
  async captureScreenshot() {
    if (!this.connected) {
      console.error('未连接到OBS，无法截图')
      return null
    }

    try {
      // 获取当前场景
      const { currentProgramSceneName } = await this.obs.call(
        'GetCurrentProgramScene'
      )

      // 截取场景画面
      const { imageData } = await this.obs.call('GetSourceScreenshot', {
        sourceName: currentProgramSceneName,
        imageFormat: 'jpg',
        imageWidth: 854,
        imageHeight: 480,
        imageCompressionQuality: 80
      })

      // 返回Base64数据（移除前缀）
      return imageData.replace(/^data:image\/\w+;base64,/, '')
    } catch (error) {
      console.error('截图失败:', error.message)
      return null
    }
  }

  /**
   * 切换场景
   */
  async switchScene(sceneName) {
    if (!this.connected) {
      return { success: false, message: '未连接到OBS' }
    }

    try {
      await this.obs.call('SetCurrentProgramScene', { sceneName })
      this.currentScene = sceneName
      return { success: true, message: `已切换到场景: ${sceneName}` }
    } catch (error) {
      return { success: false, message: error.message }
    }
  }
}
