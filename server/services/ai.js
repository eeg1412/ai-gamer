import { GoogleGenAI } from '@google/genai'

/**
 * AI解说服务
 * 使用Google Gemini进行游戏画面分析和解说生成
 */
export class AIService {
  constructor(config, dbService = null) {
    this.config = config
    this.db = dbService
    this.ai = null
    this.initialized = false
    this.init()
  }

  /**
   * 设置数据库服务（用于Token统计）
   */
  setDatabase(dbService) {
    this.db = dbService
  }

  /**
   * 初始化AI客户端
   */
  init() {
    if (!this.config.apiKey) {
      console.warn('⚠️ 未配置GEMINI_API_KEY，AI功能将不可用')
      return
    }

    try {
      this.ai = new GoogleGenAI({ apiKey: this.config.apiKey })
      this.initialized = true
      console.log('✅ Gemini AI服务已初始化')
    } catch (error) {
      console.error('❌ Gemini AI初始化失败:', error.message)
    }
  }

  /**
   * 更新配置
   */
  updateConfig(newConfig) {
    const needReinit =
      newConfig.apiKey !== this.config.apiKey ||
      newConfig.model !== this.config.model

    this.config = { ...this.config, ...newConfig }

    if (needReinit) {
      console.log('🔄 AI配置已更改，正在重新初始化...')
      this.init()
    }
  }

  /**
   * 获取服务状态
   */
  getStatus() {
    return {
      initialized: this.initialized,
      model: this.config.model
    }
  }

  /**
   * 分析游戏画面并生成解说
   * @param {string} imageBase64 - Base64编码的图片
   * @param {string} systemPrompt - 系统提示词（角色设定）
   * @param {string} userPrompt - 用户提示词（解说要求）
   * @param {Object} options - 额外选项
   * @returns {Promise<string>} 解说文本
   */
  async generateCommentary(
    imageBase64,
    systemPrompt,
    userPrompt,
    options = {}
  ) {
    if (!this.initialized) {
      throw new Error('AI服务未初始化')
    }

    try {
      const contents = [
        {
          role: 'user',
          parts: [
            {
              inlineData: {
                mimeType: 'image/jpeg',
                data: imageBase64
              }
            },
            {
              text: userPrompt || '请根据这个游戏画面进行解说'
            }
          ]
        }
      ]

      const response = await this.ai.models.generateContent({
        model: this.config.model,
        contents: contents,
        config: {
          systemInstruction:
            systemPrompt ||
            '你是一位专业的游戏解说员，风格幽默风趣，善于分析游戏局势。',
          maxOutputTokens: options.maxTokens || 200,
          temperature: options.temperature || 0.8
        }
      })

      // 记录Token使用
      const text = response.text || '（无法生成解说）'
      this.recordTokenUsage('commentary', response, text)

      return text
    } catch (error) {
      console.error('AI解说生成失败:', error.message)
      throw error
    }
  }

  /**
   * 生成文字解说（不需要图片）
   * @param {string} text - 要解说的文字内容
   * @param {string} systemPrompt - 系统提示词
   * @param {Object} options - 额外选项
   * @returns {Promise<string>} 解说文本
   */
  async generateTextCommentary(text, systemPrompt, options = {}) {
    if (!this.initialized) {
      throw new Error('AI服务未初始化')
    }

    try {
      const response = await this.ai.models.generateContent({
        model: this.config.model,
        contents: text,
        config: {
          systemInstruction:
            systemPrompt || '你是一位专业的游戏解说员，风格幽默风趣。',
          maxOutputTokens: options.maxTokens || 200,
          temperature: options.temperature || 0.8
        }
      })

      // 记录Token使用
      const resultText = response.text || '（无法生成解说）'
      this.recordTokenUsage('text_commentary', response, resultText)

      return resultText
    } catch (error) {
      console.error('AI文字解说生成失败:', error.message)
      throw error
    }
  }

  /**
   * 流式生成解说（用于长解说）
   * @param {string} imageBase64 - Base64编码的图片
   * @param {string} systemPrompt - 系统提示词
   * @param {string} userPrompt - 用户提示词
   * @param {Function} onChunk - 每个chunk的回调
   */
  async generateCommentaryStream(
    imageBase64,
    systemPrompt,
    userPrompt,
    onChunk
  ) {
    if (!this.initialized) {
      throw new Error('AI服务未初始化')
    }

    try {
      const contents = [
        {
          role: 'user',
          parts: [
            {
              inlineData: {
                mimeType: 'image/jpeg',
                data: imageBase64
              }
            },
            {
              text: userPrompt || '请根据这个游戏画面进行解说'
            }
          ]
        }
      ]

      const response = await this.ai.models.generateContentStream({
        model: this.config.model,
        contents: contents,
        config: {
          systemInstruction: systemPrompt || '你是一位专业的游戏解说员。',
          temperature: 0.8
        }
      })

      let fullText = ''
      for await (const chunk of response) {
        const text = chunk.text || ''
        fullText += text
        if (onChunk) {
          onChunk(text, fullText)
        }
      }

      return fullText
    } catch (error) {
      console.error('AI流式解说生成失败:', error.message)
      throw error
    }
  }

  /**
   * 回复Twitch聊天消息
   * @param {string} chatMessage - 聊天消息内容
   * @param {string} username - 用户名
   * @param {string} systemPrompt - 系统提示词
   * @param {string} memoryContext - 记忆上下文
   * @param {Object} options - 额外选项
   * @returns {Promise<string>} 回复文本
   */
  async replyToChat(
    chatMessage,
    username,
    systemPrompt,
    memoryContext = '',
    options = {}
  ) {
    if (!this.initialized) {
      throw new Error('AI服务未初始化')
    }

    try {
      let fullPrompt =
        systemPrompt ||
        '你是一位友好的游戏主播，正在与观众互动。请用简短有趣的方式回复观众的消息。'

      if (memoryContext) {
        fullPrompt += `\n\n当前记忆上下文：\n${memoryContext}`
      }

      const userMessage = `观众 "${username}" 说: "${chatMessage}"\n\n请用简短有趣的方式回复这条消息（控制在50字以内）：`

      const response = await this.ai.models.generateContent({
        model: this.config.model,
        contents: userMessage,
        config: {
          systemInstruction: fullPrompt,
          maxOutputTokens: options.maxTokens || 100,
          temperature: options.temperature || 0.9
        }
      })

      const text = response.text || '谢谢你的消息！'
      this.recordTokenUsage('chat_reply', response, text)

      return text
    } catch (error) {
      console.error('AI回复聊天失败:', error.message)
      throw error
    }
  }

  /**
   * 记录Token使用情况
   */
  recordTokenUsage(type, response, outputText) {
    if (!this.db) return

    try {
      // 兼容不同版本的 SDK 响应结构
      const usageMetadata =
        response.usageMetadata ||
        (response.response && response.response.usageMetadata) ||
        (response.metadata && response.metadata.usage) ||
        {}

      const inputTokens =
        usageMetadata.promptTokenCount ||
        usageMetadata.prompt_token_count ||
        (type === 'commentary' ? 800 : this.estimateTokens(type)) // Gemini 1.5/2.0 vision typically ~768 tokens per image

      const outputTokens =
        usageMetadata.candidatesTokenCount ||
        usageMetadata.candidates_token_count ||
        usageMetadata.output_token_count ||
        (outputText ? this.estimateTokens(outputText) : 50)

      this.db.recordTokenUsage(
        type,
        inputTokens,
        outputTokens,
        this.config.model
      )
    } catch (error) {
      console.error('记录Token使用失败:', error.message)
    }
  }

  /**
   * 估算Token数量
   */
  estimateTokens(text) {
    if (!text) return 0
    const chineseChars = (text.match(/[\u4e00-\u9fff]/g) || []).length
    const otherChars = text.length - chineseChars
    return Math.ceil(chineseChars / 1.5 + otherChars / 4)
  }
}
