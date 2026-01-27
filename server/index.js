import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'
import config from './config/index.js'
import apiRoutes from './routes/api.js'
import { initSocketHandlers } from './socket/handlers.js'
import { OBSService } from './services/obs.js'
import { AIService } from './services/ai.js'
import { TTSService } from './services/tts.js'
import { CommentaryService } from './services/commentary.js'
import { DatabaseService } from './services/database.js'
import { MemoryService } from './services/memory.js'
import { TwitchService } from './services/twitch.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const httpServer = createServer(app)

// Socket.IO配置
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
})

// 中间件
app.use(cors())
app.use(express.json())
app.use(express.static(path.join(__dirname, '../client/dist')))
app.use('/audio', express.static(path.join(__dirname, '../audio')))

// 初始化服务
const dbService = new DatabaseService()

// 加载持久化的配置
const defaultObsConfig = { url: 'ws://127.0.0.1:4455', password: '' }
const savedObsConfig = dbService.getSetting('obs_config', defaultObsConfig)
const obsService = new OBSService(savedObsConfig)

const aiService = new AIService(config.gemini, dbService)

// TTS 服务基础配置从 env 读，发音人等从数据库/管理端读
const ttsService = new TTSService(config.tts)

const memoryService = new MemoryService(
  aiService,
  dbService,
  io,
  config.memory || {}
)
const twitchService = new TwitchService(config.twitch || {}, io)
const commentaryService = new CommentaryService(
  obsService,
  aiService,
  ttsService,
  io,
  memoryService,
  dbService
)

// 将服务挂载到app上，方便路由访问
app.set('services', {
  db: dbService,
  obs: obsService,
  ai: aiService,
  tts: ttsService,
  memory: memoryService,
  twitch: twitchService,
  commentary: commentaryService
})

// API路由
app.use('/api', apiRoutes)

// Socket.IO事件处理
initSocketHandlers(io, commentaryService, twitchService, memoryService)

// 前端路由回退
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist/index.html'))
})

// 启动服务器
httpServer.listen(config.server.port, () => {
  console.log(
    `🎮 AI Gamer 服务器运行在 http://${config.server.host}:${config.server.port}`
  )
  console.log(`📡 WebSocket 服务已启动`)
})

// 优雅关闭
process.on('SIGTERM', async () => {
  console.log('正在关闭服务...')
  await obsService.disconnect()
  await twitchService.disconnect()
  dbService.close()
  httpServer.close(() => {
    console.log('服务器已关闭')
    process.exit(0)
  })
})
