import Database from 'better-sqlite3'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/**
 * 数据库服务
 * 使用 better-sqlite3 管理 Token 统计和 AI 记忆
 */
export class DatabaseService {
  constructor() {
    this.dbPath = path.join(__dirname, '../../data/ai-gamer.db')
    this.db = null
    this.init()
  }

  /**
   * 初始化数据库
   */
  init() {
    try {
      // 确保目录存在
      const dir = path.dirname(this.dbPath)
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true })
      }

      this.db = new Database(this.dbPath)
      this.db.pragma('journal_mode = WAL')

      this.createTables()
      console.log('✅ 数据库已初始化')
    } catch (error) {
      console.error('❌ 数据库初始化失败:', error.message)
    }
  }

  /**
   * 创建数据表
   */
  createTables() {
    // Token使用记录表
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS token_usage (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT NOT NULL,
        input_tokens INTEGER DEFAULT 0,
        output_tokens INTEGER DEFAULT 0,
        total_tokens INTEGER DEFAULT 0,
        model TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // AI记忆表
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS memories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        context_type TEXT DEFAULT 'general',
        game_name TEXT,
        tags TEXT,
        token_count INTEGER DEFAULT 0,
        usage_count INTEGER DEFAULT 0,
        last_used_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // 会话历史表（用于生成记忆）
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS session_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT NOT NULL,
        role TEXT NOT NULL,
        content TEXT NOT NULL,
        image_hash TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // 创建索引
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_token_usage_created_at ON token_usage(created_at);
      CREATE INDEX IF NOT EXISTS idx_memories_context_type ON memories(context_type);
      CREATE INDEX IF NOT EXISTS idx_session_history_session_id ON session_history(session_id);
    `)

    // 系统设置表
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `)
  }

  // ==================== 设置相关 ====================

  /**
   * 保存设置
   */
  saveSetting(key, value) {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO settings (key, value, updated_at)
      VALUES (?, ?, CURRENT_TIMESTAMP)
    `)
    return stmt.run(
      key,
      typeof value === 'object' ? JSON.stringify(value) : String(value)
    )
  }

  /**
   * 获取设置
   */
  getSetting(key, defaultValue = null) {
    const stmt = this.db.prepare('SELECT value FROM settings WHERE key = ?')
    const result = stmt.get(key)
    if (!result) return defaultValue

    try {
      return JSON.parse(result.value)
    } catch {
      return result.value
    }
  }

  /**
   * 获取所有设置
   */
  getAllSettings() {
    const stmt = this.db.prepare('SELECT key, value FROM settings')
    const rows = stmt.all()
    const settings = {}
    rows.forEach(row => {
      try {
        settings[row.key] = JSON.parse(row.value)
      } catch {
        settings[row.key] = row.value
      }
    })
    return settings
  }

  // ==================== Token 统计相关 ====================

  /**
   * 记录Token使用
   */
  recordTokenUsage(type, inputTokens, outputTokens, model) {
    const stmt = this.db.prepare(`
      INSERT INTO token_usage (type, input_tokens, output_tokens, total_tokens, model)
      VALUES (?, ?, ?, ?, ?)
    `)

    const totalTokens = inputTokens + outputTokens
    return stmt.run(type, inputTokens, outputTokens, totalTokens, model)
  }

  /**
   * 获取今日Token使用统计
   */
  getTodayTokenUsage() {
    const stmt = this.db.prepare(`
      SELECT 
        COUNT(*) as count,
        COALESCE(SUM(input_tokens), 0) as input_tokens,
        COALESCE(SUM(output_tokens), 0) as output_tokens,
        COALESCE(SUM(total_tokens), 0) as total_tokens
      FROM token_usage 
      WHERE date(created_at) = date('now', 'localtime')
    `)
    return stmt.get()
  }

  /**
   * 获取本周Token使用统计
   */
  getWeekTokenUsage() {
    const stmt = this.db.prepare(`
      SELECT 
        COUNT(*) as count,
        COALESCE(SUM(input_tokens), 0) as input_tokens,
        COALESCE(SUM(output_tokens), 0) as output_tokens,
        COALESCE(SUM(total_tokens), 0) as total_tokens
      FROM token_usage 
      WHERE created_at >= datetime('now', '-7 days', 'localtime')
    `)
    return stmt.get()
  }

  /**
   * 获取本月Token使用统计
   */
  getMonthTokenUsage() {
    const stmt = this.db.prepare(`
      SELECT 
        COUNT(*) as count,
        COALESCE(SUM(input_tokens), 0) as input_tokens,
        COALESCE(SUM(output_tokens), 0) as output_tokens,
        COALESCE(SUM(total_tokens), 0) as total_tokens
      FROM token_usage 
      WHERE strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now', 'localtime')
    `)
    return stmt.get()
  }

  /**
   * 获取每日Token使用趋势（最近30天）
   */
  getDailyTokenTrend(days = 30) {
    const stmt = this.db.prepare(`
      SELECT 
        date(created_at) as date,
        COUNT(*) as count,
        SUM(total_tokens) as total_tokens
      FROM token_usage 
      WHERE created_at >= datetime('now', '-${days} days', 'localtime')
      GROUP BY date(created_at)
      ORDER BY date ASC
    `)
    return stmt.all()
  }

  /**
   * 获取按类型分组的Token统计
   */
  getTokenUsageByType() {
    const stmt = this.db.prepare(`
      SELECT 
        type,
        COUNT(*) as count,
        SUM(total_tokens) as total_tokens
      FROM token_usage 
      WHERE strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now', 'localtime')
      GROUP BY type
    `)
    return stmt.all()
  }

  // ==================== AI记忆相关 ====================

  /**
   * 创建新记忆
   */
  createMemory(data) {
    const stmt = this.db.prepare(`
      INSERT INTO memories (title, content, context_type, game_name, tags, token_count)
      VALUES (?, ?, ?, ?, ?, ?)
    `)

    const result = stmt.run(
      data.title,
      data.content,
      data.contextType || 'general',
      data.gameName || null,
      data.tags ? JSON.stringify(data.tags) : null,
      data.tokenCount || 0
    )

    return this.getMemoryById(result.lastInsertRowid)
  }

  /**
   * 更新记忆
   */
  updateMemory(id, data) {
    const stmt = this.db.prepare(`
      UPDATE memories 
      SET title = ?, content = ?, context_type = ?, game_name = ?, tags = ?, 
          token_count = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `)

    stmt.run(
      data.title,
      data.content,
      data.contextType || 'general',
      data.gameName || null,
      data.tags ? JSON.stringify(data.tags) : null,
      data.tokenCount || 0,
      id
    )

    return this.getMemoryById(id)
  }

  /**
   * 获取记忆详情
   */
  getMemoryById(id) {
    const stmt = this.db.prepare('SELECT * FROM memories WHERE id = ?')
    const memory = stmt.get(id)
    if (memory && memory.tags) {
      memory.tags = JSON.parse(memory.tags)
    }
    return memory
  }

  /**
   * 获取所有记忆列表
   */
  getAllMemories(limit = 100) {
    const stmt = this.db.prepare(`
      SELECT * FROM memories 
      ORDER BY updated_at DESC 
      LIMIT ?
    `)
    const memories = stmt.all(limit)
    return memories.map(m => {
      if (m.tags) m.tags = JSON.parse(m.tags)
      return m
    })
  }

  /**
   * 按类型获取记忆
   */
  getMemoriesByType(contextType) {
    const stmt = this.db.prepare(`
      SELECT * FROM memories 
      WHERE context_type = ?
      ORDER BY usage_count DESC, updated_at DESC
    `)
    const memories = stmt.all(contextType)
    return memories.map(m => {
      if (m.tags) m.tags = JSON.parse(m.tags)
      return m
    })
  }

  /**
   * 按游戏获取记忆
   */
  getMemoriesByGame(gameName) {
    const stmt = this.db.prepare(`
      SELECT * FROM memories 
      WHERE game_name = ?
      ORDER BY usage_count DESC, updated_at DESC
    `)
    const memories = stmt.all(gameName)
    return memories.map(m => {
      if (m.tags) m.tags = JSON.parse(m.tags)
      return m
    })
  }

  /**
   * 增加记忆使用次数
   */
  incrementMemoryUsage(id) {
    const stmt = this.db.prepare(`
      UPDATE memories 
      SET usage_count = usage_count + 1, last_used_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `)
    return stmt.run(id)
  }

  /**
   * 删除记忆
   */
  deleteMemory(id) {
    const stmt = this.db.prepare('DELETE FROM memories WHERE id = ?')
    return stmt.run(id)
  }

  /**
   * 搜索记忆
   */
  searchMemories(keyword) {
    const stmt = this.db.prepare(`
      SELECT * FROM memories 
      WHERE title LIKE ? OR content LIKE ? OR tags LIKE ?
      ORDER BY usage_count DESC
      LIMIT 50
    `)
    const searchTerm = `%${keyword}%`
    const memories = stmt.all(searchTerm, searchTerm, searchTerm)
    return memories.map(m => {
      if (m.tags) m.tags = JSON.parse(m.tags)
      return m
    })
  }

  // ==================== 会话历史相关 ====================

  /**
   * 添加会话消息
   */
  addSessionMessage(sessionId, role, content, imageHash = null) {
    const stmt = this.db.prepare(`
      INSERT INTO session_history (session_id, role, content, image_hash)
      VALUES (?, ?, ?, ?)
    `)
    return stmt.run(sessionId, role, content, imageHash)
  }

  /**
   * 获取会话历史
   */
  getSessionHistory(sessionId, limit = 20) {
    const stmt = this.db.prepare(`
      SELECT * FROM session_history 
      WHERE session_id = ?
      ORDER BY created_at DESC
      LIMIT ?
    `)
    return stmt.all(sessionId, limit).reverse()
  }

  /**
   * 清除会话历史
   */
  clearSessionHistory(sessionId) {
    const stmt = this.db.prepare(
      'DELETE FROM session_history WHERE session_id = ?'
    )
    return stmt.run(sessionId)
  }

  /**
   * 清除旧会话（保留最近7天）
   */
  cleanOldSessions() {
    const stmt = this.db.prepare(`
      DELETE FROM session_history 
      WHERE created_at < datetime('now', '-7 days')
    `)
    return stmt.run()
  }

  /**
   * 关闭数据库连接
   */
  close() {
    if (this.db) {
      this.db.close()
    }
  }
}

// 创建单例
let dbInstance = null

export function getDatabase() {
  if (!dbInstance) {
    dbInstance = new DatabaseService()
  }
  return dbInstance
}
