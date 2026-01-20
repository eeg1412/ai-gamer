import * as sdk from 'microsoft-cognitiveservices-speech-sdk'
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import { v4 as uuidv4 } from 'uuid'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/**
 * TTS语音合成服务
 * 使用 Azure Cognitive Services Speech SDK 将文字转换为语音
 */
export class TTSService {
  constructor(config) {
    this.config = config
    this.audioDir = path.join(__dirname, '../../audio')
    this.voices = []
    this.speechConfig = null
    this.init()
  }

  /**
   * 初始化TTS服务
   */
  async init() {
    try {
      // 确保音频目录存在
      await fs.mkdir(this.audioDir, { recursive: true })

      // 检查Azure配置
      if (!this.config.azureKey || !this.config.azureRegion) {
        console.warn(
          '⚠️ 未配置AZURE_SPEECH_KEY或AZURE_SPEECH_REGION，TTS功能将不可用'
        )
        return
      }

      // 初始化 Speech Config
      this.speechConfig = sdk.SpeechConfig.fromSubscription(
        this.config.azureKey,
        this.config.azureRegion
      )

      // 设置语音
      this.speechConfig.speechSynthesisVoiceName =
        this.config.voice || 'zh-CN-XiaoxiaoNeural'

      console.log('✅ TTS服务已初始化 (Azure Speech)')
    } catch (error) {
      console.error('❌ TTS初始化失败:', error.message)
    }
  }

  /**
   * 获取可用的语音列表
   */
  async getAvailableVoices() {
    if (this.voices.length > 0) {
      return this.voices
    }

    // 如果配置可用，尝试从Azure获取
    if (this.speechConfig) {
      try {
        const synthesizer = new sdk.SpeechSynthesizer(this.speechConfig, null)
        const result = await synthesizer.getVoicesAsync()

        if (result.voices && result.voices.length > 0) {
          this.voices = result.voices
            .filter(v => v.locale.startsWith('zh-'))
            .map(v => ({
              ShortName: v.shortName,
              FriendlyName: `${v.localName} (${v.locale})`
            }))
          synthesizer.close()
          return this.voices
        }
        synthesizer.close()
      } catch (error) {
        console.error('获取语音列表失败:', error.message)
      }
    }

    // 返回默认常用中文语音列表
    this.voices = [
      {
        ShortName: 'zh-CN-XiaoxiaoNeural',
        FriendlyName: '晓晓 (女声, 普通话)'
      },
      { ShortName: 'zh-CN-YunxiNeural', FriendlyName: '云希 (男声, 普通话)' },
      { ShortName: 'zh-CN-YunjianNeural', FriendlyName: '云健 (男声, 普通话)' },
      { ShortName: 'zh-CN-XiaoyiNeural', FriendlyName: '晓伊 (女声, 普通话)' },
      {
        ShortName: 'zh-CN-YunyangNeural',
        FriendlyName: '云扬 (男声, 新闻风格)'
      },
      {
        ShortName: 'zh-CN-XiaochenNeural',
        FriendlyName: '晓辰 (女声, 普通话)'
      },
      { ShortName: 'zh-CN-XiaohanNeural', FriendlyName: '晓涵 (女声, 普通话)' },
      {
        ShortName: 'zh-CN-XiaomengNeural',
        FriendlyName: '晓梦 (女声, 普通话)'
      },
      { ShortName: 'zh-CN-XiaomoNeural', FriendlyName: '晓墨 (女声, 普通话)' },
      { ShortName: 'zh-CN-XiaoruiNeural', FriendlyName: '晓睿 (女声, 普通话)' },
      {
        ShortName: 'zh-CN-XiaoshuangNeural',
        FriendlyName: '晓双 (女声, 儿童)'
      },
      {
        ShortName: 'zh-CN-XiaoxuanNeural',
        FriendlyName: '晓萱 (女声, 普通话)'
      },
      { ShortName: 'zh-CN-XiaoyanNeural', FriendlyName: '晓颜 (女声, 普通话)' },
      {
        ShortName: 'zh-CN-XiaozhenNeural',
        FriendlyName: '晓甄 (女声, 普通话)'
      },
      { ShortName: 'zh-TW-HsiaoChenNeural', FriendlyName: '曉臻 (女声, 台湾)' },
      { ShortName: 'zh-TW-YunJheNeural', FriendlyName: '雲哲 (男声, 台湾)' },
      { ShortName: 'zh-HK-HiuGaaiNeural', FriendlyName: '曉佳 (女声, 香港)' },
      { ShortName: 'zh-HK-WanLungNeural', FriendlyName: '雲龍 (男声, 香港)' }
    ]

    return this.voices
  }

  /**
   * 获取中文语音列表
   */
  async getChineseVoices() {
    return await this.getAvailableVoices()
  }

  /**
   * 将文字转换为语音
   * @param {string} text - 要转换的文字
   * @param {Object} options - TTS选项
   * @returns {Promise<{success: boolean, audioUrl: string, filename: string}>}
   */
  async textToSpeech(text, options = {}) {
    if (!text || text.trim().length === 0) {
      return { success: false, message: '文字内容为空' }
    }

    if (!this.speechConfig) {
      console.warn('TTS不可用，请配置Azure Speech服务')
      return { success: false, message: 'Azure Speech未配置' }
    }

    const voice = options.voice || this.config.voice
    const rate = options.rate || this.config.rate || '+0%'

    const filename = `${uuidv4()}.mp3`
    const filePath = path.join(this.audioDir, filename)

    try {
      // 创建临时配置
      const tempConfig = sdk.SpeechConfig.fromSubscription(
        this.config.azureKey,
        this.config.azureRegion
      )
      tempConfig.speechSynthesisVoiceName = voice
      tempConfig.speechSynthesisOutputFormat =
        sdk.SpeechSynthesisOutputFormat.Audio24Khz96KBitRateMonoMp3

      // 创建音频配置
      const audioConfig = sdk.AudioConfig.fromAudioFileOutput(filePath)

      // 创建合成器
      const synthesizer = new sdk.SpeechSynthesizer(tempConfig, audioConfig)

      // 构建SSML以支持语速调整
      const ssml = `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="zh-CN">
        <voice name="${voice}">
          <prosody rate="${rate}">
            ${text}
          </prosody>
        </voice>
      </speak>`

      // 执行合成
      const result = await new Promise((resolve, reject) => {
        synthesizer.speakSsmlAsync(
          ssml,
          result => {
            synthesizer.close()
            resolve(result)
          },
          error => {
            synthesizer.close()
            reject(error)
          }
        )
      })

      if (result.reason === sdk.ResultReason.SynthesizingAudioCompleted) {
        console.log(`🔊 TTS生成成功: ${filename}`)
        return {
          success: true,
          filename,
          audioUrl: `/audio/${filename}`,
          text
        }
      } else {
        throw new Error(`语音合成失败: ${result.errorDetails}`)
      }
    } catch (error) {
      console.error('TTS生成失败:', error.message)
      return {
        success: false,
        message: error.message
      }
    }
  }

  /**
   * 获取音频Buffer（不保存文件）
   * @param {string} text - 要转换的文字
   * @param {Object} options - TTS选项
   * @returns {Promise<Buffer>}
   */
  async getAudioBuffer(text, options = {}) {
    const result = await this.textToSpeech(text, options)
    if (result.success) {
      const filePath = path.join(this.audioDir, result.filename)
      const buffer = await fs.readFile(filePath)
      // 可选：读取后删除文件
      // await fs.unlink(filePath);
      return buffer
    }
    throw new Error(result.message)
  }

  /**
   * 清理旧的音频文件
   * @param {number} maxAge - 最大保留时间（毫秒）
   */
  async cleanupOldFiles(maxAge = 3600000) {
    // 默认1小时
    try {
      const files = await fs.readdir(this.audioDir)
      const now = Date.now()

      for (const file of files) {
        if (!file.endsWith('.mp3')) continue

        const filePath = path.join(this.audioDir, file)
        const stats = await fs.stat(filePath)

        if (now - stats.mtimeMs > maxAge) {
          await fs.unlink(filePath)
          console.log(`🗑️ 已清理旧音频: ${file}`)
        }
      }
    } catch (error) {
      console.error('清理音频文件失败:', error.message)
    }
  }

  /**
   * 更新TTS配置
   */
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig }
  }

  /**
   * 获取当前配置
   */
  getConfig() {
    return { ...this.config }
  }
}
