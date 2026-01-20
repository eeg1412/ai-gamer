import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config({ path: path.resolve(__dirname, '../../.env') })

export default {
  // 服务器配置
  server: {
    port: parseInt(process.env.PORT || '3000', 10),
    host: process.env.HOST || 'localhost'
  },

  // Google Gemini AI配置
  gemini: {
    apiKey: process.env.GEMINI_API_KEY || '',
    model: process.env.GEMINI_MODEL || 'gemini-2.5-flash'
  },

  // TTS配置
  tts: {
    azureKey: process.env.AZURE_SPEECH_KEY || '',
    azureRegion: process.env.AZURE_SPEECH_REGION || 'eastasia'
  },

  // Twitch配置
  twitch: {
    defaultChannel: process.env.TWITCH_CHANNEL || '',
    username: process.env.TWITCH_USERNAME || '',
    token: process.env.TWITCH_TOKEN || '' // OAuth token
  },

  // 记忆配置
  memory: {
    maxMemoryLength: parseInt(process.env.MEMORY_MAX_LENGTH || '500', 10),
    autoSummarize: process.env.MEMORY_AUTO_SUMMARIZE !== 'false',
    summarizeThreshold: parseInt(
      process.env.MEMORY_SUMMARIZE_THRESHOLD || '5',
      10
    )
  },

  // 解说配置默认值
  commentary: {
    autoIntervalSeconds: 10,
    maxTokens: 200
  }
}
