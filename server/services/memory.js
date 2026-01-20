import { v4 as uuidv4 } from 'uuid'

/**
 * AI记忆服务
 * 管理AI的记忆系统，替代传统的对话历史
 *
 * 记忆设计逻辑：
 * 1. 每次解说后，AI会生成一个简短的"记忆摘要"
 * 2. 记忆包含：关键事件、游戏状态、观众互动要点
 * 3. 下次解说时，可以选择加载特定记忆作为上下文
 * 4. 记忆按游戏/场景/类型分类管理
 * 5. 自动清理过期或低使用率的记忆
 */
export class MemoryService {
  constructor(aiService, dbService, config = {}) {
    this.ai = aiService
    this.db = dbService
    this.config = {
      maxMemoryLength: config.maxMemoryLength || 500, // 记忆最大字数
      autoSummarize: config.autoSummarize !== false, // 是否自动生成记忆
      summarizeThreshold: config.summarizeThreshold || 5, // 多少次对话后生成记忆
      ...config
    }

    // 当前会话
    this.currentSession = {
      id: uuidv4(),
      interactions: [], // 当前会话的交互记录
      startTime: new Date().toISOString()
    }

    // 当前使用的记忆
    this.activeMemories = []
  }

  /**
   * 获取记忆生成的系统提示词
   */
  getMemorySummarizePrompt() {
    return `你是一个记忆管理助手。你的任务是将游戏解说的对话历史总结成简洁的"记忆"。

记忆应该包含：
1. 关键游戏事件（击杀、胜利、失败等）
2. 当前游戏状态要点
3. 有趣的观众互动
4. 解说风格和氛围

要求：
- 使用第三人称描述
- 突出重要信息，忽略琐碎细节
- 控制在${this.config.maxMemoryLength}字以内
- 使用简洁的bullet point格式`
  }

  /**
   * 记录一次交互（用于后续生成记忆）
   */
  recordInteraction(data) {
    const interaction = {
      id: uuidv4(),
      type: data.type || 'commentary', // commentary, chat_reply, text_speak
      input: data.input, // 输入（画面描述/用户问题等）
      output: data.output, // AI输出
      hasImage: data.hasImage || false,
      timestamp: new Date().toISOString()
    }

    this.currentSession.interactions.push(interaction)

    // 保存到数据库
    this.db.addSessionMessage(
      this.currentSession.id,
      'interaction',
      JSON.stringify(interaction)
    )

    // 检查是否需要自动生成记忆
    if (
      this.config.autoSummarize &&
      this.currentSession.interactions.length >= this.config.summarizeThreshold
    ) {
      this.autoGenerateMemory()
    }

    return interaction
  }

  /**
   * 自动生成记忆
   */
  async autoGenerateMemory() {
    if (this.currentSession.interactions.length === 0) return null

    try {
      // 构建对话历史文本
      const historyText = this.currentSession.interactions
        .map(
          i =>
            `[${i.type}] ${i.input ? `输入: ${i.input.substring(0, 100)}... ` : ''}输出: ${i.output}`
        )
        .join('\n')

      // 让AI总结
      const summary = await this.ai.generateTextCommentary(
        `请将以下游戏解说历史总结成记忆：\n\n${historyText}`,
        this.getMemorySummarizePrompt(),
        { maxTokens: 300 }
      )

      // 创建记忆
      const memory = this.db.createMemory({
        title: `自动记忆 - ${new Date().toLocaleString('zh-CN')}`,
        content: summary,
        contextType: 'auto_generated',
        tokenCount: this.estimateTokens(summary)
      })

      // 清空当前交互记录（已生成记忆）
      this.currentSession.interactions = []

      console.log('📝 已自动生成记忆:', memory.id)
      return memory
    } catch (error) {
      console.error('自动生成记忆失败:', error.message)
      return null
    }
  }

  /**
   * 手动创建记忆
   */
  async createManualMemory(data) {
    const memory = this.db.createMemory({
      title: data.title || '手动记忆',
      content: data.content,
      contextType: data.contextType || 'manual',
      gameName: data.gameName,
      tags: data.tags,
      tokenCount: this.estimateTokens(data.content)
    })
    return memory
  }

  /**
   * 让AI根据当前会话生成记忆
   */
  async generateMemoryFromSession(options = {}) {
    if (this.currentSession.interactions.length === 0) {
      return { success: false, message: '当前会话无交互记录' }
    }

    try {
      const historyText = this.currentSession.interactions
        .map(i => `[${i.type}] ${i.output}`)
        .join('\n')

      const summary = await this.ai.generateTextCommentary(
        `请将以下内容总结成记忆：\n\n${historyText}`,
        this.getMemorySummarizePrompt(),
        { maxTokens: 300 }
      )

      const memory = this.db.createMemory({
        title:
          options.title || `会话记忆 - ${new Date().toLocaleString('zh-CN')}`,
        content: summary,
        contextType: 'session',
        gameName: options.gameName,
        tags: options.tags,
        tokenCount: this.estimateTokens(summary)
      })

      // 可选择是否清空当前会话
      if (options.clearSession) {
        this.currentSession.interactions = []
      }

      return { success: true, memory }
    } catch (error) {
      return { success: false, message: error.message }
    }
  }

  /**
   * 设置当前使用的记忆
   */
  setActiveMemories(memoryIds) {
    this.activeMemories = memoryIds
      .map(id => {
        const memory = this.db.getMemoryById(id)
        if (memory) {
          this.db.incrementMemoryUsage(id)
        }
        return memory
      })
      .filter(Boolean)

    return this.activeMemories
  }

  /**
   * 获取当前激活的记忆
   */
  getActiveMemories() {
    return this.activeMemories
  }

  /**
   * 清除激活的记忆
   */
  clearActiveMemories() {
    this.activeMemories = []
  }

  /**
   * 构建带记忆的系统提示词
   */
  buildPromptWithMemory(baseSystemPrompt) {
    if (this.activeMemories.length === 0) {
      return baseSystemPrompt
    }

    const memoryContext = this.activeMemories
      .map(m => `【记忆：${m.title}】\n${m.content}`)
      .join('\n\n')

    return `${baseSystemPrompt}

---
以下是你的记忆，请在解说时参考这些信息保持连贯性：

${memoryContext}
---`
  }

  /**
   * 获取所有记忆
   */
  getAllMemories(limit = 100) {
    return this.db.getAllMemories(limit)
  }

  /**
   * 按类型获取记忆
   */
  getMemoriesByType(type) {
    return this.db.getMemoriesByType(type)
  }

  /**
   * 按游戏获取记忆
   */
  getMemoriesByGame(gameName) {
    return this.db.getMemoriesByGame(gameName)
  }

  /**
   * 搜索记忆
   */
  searchMemories(keyword) {
    return this.db.searchMemories(keyword)
  }

  /**
   * 更新记忆
   */
  updateMemory(id, data) {
    return this.db.updateMemory(id, {
      ...data,
      tokenCount: this.estimateTokens(data.content)
    })
  }

  /**
   * 删除记忆
   */
  deleteMemory(id) {
    // 如果在激活列表中，移除
    this.activeMemories = this.activeMemories.filter(m => m.id !== id)
    return this.db.deleteMemory(id)
  }

  /**
   * 开始新会话
   */
  startNewSession() {
    // 保存当前会话的记忆（如果有交互）
    if (
      this.currentSession.interactions.length > 0 &&
      this.config.autoSummarize
    ) {
      this.autoGenerateMemory()
    }

    this.currentSession = {
      id: uuidv4(),
      interactions: [],
      startTime: new Date().toISOString()
    }

    return this.currentSession
  }

  /**
   * 获取当前会话信息
   */
  getCurrentSession() {
    return {
      ...this.currentSession,
      interactionCount: this.currentSession.interactions.length
    }
  }

  /**
   * 估算Token数量（简单估算，中文约1.5字符/token）
   */
  estimateTokens(text) {
    if (!text) return 0
    // 中文大约1.5字符一个token，英文大约4字符一个token
    const chineseChars = (text.match(/[\u4e00-\u9fff]/g) || []).length
    const otherChars = text.length - chineseChars
    return Math.ceil(chineseChars / 1.5 + otherChars / 4)
  }

  /**
   * 获取记忆统计
   */
  getMemoryStats() {
    const all = this.db.getAllMemories(1000)
    const byType = {}
    let totalTokens = 0

    all.forEach(m => {
      byType[m.context_type] = (byType[m.context_type] || 0) + 1
      totalTokens += m.token_count || 0
    })

    return {
      totalCount: all.length,
      byType,
      totalTokens,
      activeCount: this.activeMemories.length
    }
  }
}
