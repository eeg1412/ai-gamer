import { ref, watch } from 'vue'

const DB_NAME = 'ai-gamer-db'
const DB_VERSION = 1
const STORE_NAME = 'profiles'

let db = null

/**
 * IndexedDB存储管理
 * 用于保存不同直播的配置方案
 */
export function useStorage() {
  const profiles = ref([])
  const currentProfile = ref(null)
  const loading = ref(false)
  const error = ref(null)

  /**
   * 初始化数据库
   */
  const initDB = () => {
    return new Promise((resolve, reject) => {
      if (db) {
        resolve(db)
        return
      }

      const request = indexedDB.open(DB_NAME, DB_VERSION)

      request.onerror = () => {
        error.value = '无法打开数据库'
        reject(request.error)
      }

      request.onsuccess = () => {
        db = request.result
        resolve(db)
      }

      request.onupgradeneeded = event => {
        const database = event.target.result

        // 创建配置存储
        if (!database.objectStoreNames.contains(STORE_NAME)) {
          const store = database.createObjectStore(STORE_NAME, {
            keyPath: 'id',
            autoIncrement: true
          })
          store.createIndex('name', 'name', { unique: false })
          store.createIndex('createdAt', 'createdAt', { unique: false })
        }
      }
    })
  }

  /**
   * 获取所有配置方案
   */
  const loadProfiles = async () => {
    loading.value = true
    try {
      await initDB()

      return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readonly')
        const store = transaction.objectStore(STORE_NAME)
        const request = store.getAll()

        request.onsuccess = () => {
          profiles.value = request.result.sort(
            (a, b) =>
              new Date(b.updatedAt || b.createdAt) -
              new Date(a.updatedAt || a.createdAt)
          )
          resolve(profiles.value)
        }

        request.onerror = () => {
          error.value = '加载配置失败'
          reject(request.error)
        }
      })
    } finally {
      loading.value = false
    }
  }

  /**
   * 保存配置方案
   */
  const saveProfile = async profile => {
    await initDB()

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite')
      const store = transaction.objectStore(STORE_NAME)

      const now = new Date().toISOString()
      const data = {
        ...profile,
        updatedAt: now,
        createdAt: profile.createdAt || now
      }

      const request = profile.id ? store.put(data) : store.add(data)

      request.onsuccess = () => {
        loadProfiles()
        resolve({ ...data, id: request.result || profile.id })
      }

      request.onerror = () => {
        error.value = '保存配置失败'
        reject(request.error)
      }
    })
  }

  /**
   * 获取单个配置
   */
  const getProfile = async id => {
    await initDB()

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.get(id)

      request.onsuccess = () => {
        currentProfile.value = request.result
        resolve(request.result)
      }

      request.onerror = () => {
        error.value = '获取配置失败'
        reject(request.error)
      }
    })
  }

  /**
   * 删除配置方案
   */
  const deleteProfile = async id => {
    await initDB()

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.delete(id)

      request.onsuccess = () => {
        loadProfiles()
        if (currentProfile.value?.id === id) {
          currentProfile.value = null
        }
        resolve()
      }

      request.onerror = () => {
        error.value = '删除配置失败'
        reject(request.error)
      }
    })
  }

  /**
   * 导出配置
   */
  const exportProfile = profile => {
    const data = JSON.stringify(profile, null, 2)
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)

    const a = document.createElement('a')
    a.href = url
    a.download = `${profile.name || 'profile'}-${Date.now()}.json`
    a.click()

    URL.revokeObjectURL(url)
  }

  /**
   * 导入配置
   */
  const importProfile = async file => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()

      reader.onload = async e => {
        try {
          const data = JSON.parse(e.target.result)
          delete data.id // 移除ID，创建新记录
          const saved = await saveProfile(data)
          resolve(saved)
        } catch (err) {
          error.value = '导入配置失败：文件格式错误'
          reject(err)
        }
      }

      reader.onerror = () => {
        error.value = '读取文件失败'
        reject(reader.error)
      }

      reader.readAsText(file)
    })
  }

  /**
   * 创建默认配置
   */
  const createDefaultProfile = () => ({
    name: '新建配置',
    description: '',
    settings: {
      systemPrompt:
        '你是一位专业的游戏解说员，风格幽默风趣，善于分析游戏局势。解说要简洁有力，每次解说控制在50字以内。',
      userPrompt:
        '请根据当前游戏画面进行精彩解说，注意分析玩家的操作和当前局势。',
      ttsEnabled: true,
      ttsVoice: 'zh-CN-XiaoxiaoNeural',
      ttsRate: '+0%',
      maxTokens: 150,
      autoIntervalSeconds: 10
    },
    obsSettings: {
      url: 'ws://127.0.0.1:4455',
      password: ''
    }
  })

  return {
    profiles,
    currentProfile,
    loading,
    error,

    initDB,
    loadProfiles,
    saveProfile,
    getProfile,
    deleteProfile,
    exportProfile,
    importProfile,
    createDefaultProfile
  }
}
