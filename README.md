# AI Gamer - AI游戏解说直播系统

一个基于 Google Gemini AI 的游戏直播解说系统，通过 OBS WebSocket 获取直播画面，使用 AI 进行智能解说，并通过 Edge TTS 转换为语音。

## ✨ 功能特性

- 🎮 **智能解说**: 使用 Google Gemini 2.5 Flash 模型分析游戏画面并生成解说
- 🎤 **语音合成**: 集成 Edge TTS，支持多种中文语音
- 📺 **OBS 集成**: 通过 OBS WebSocket 获取直播画面截图
- 🎯 **多种模式**: 支持自动定时解说和手动触发解说
- 💾 **配置管理**: 使用 IndexedDB 存储多个直播配置方案
- 🎨 **现代 UI**: 基于 Vue 3 + Tailwind CSS 的游戏风格界面

## 🏗️ 技术架构

### 后端

- **Node.js + Express**: RESTful API 服务器
- **Socket.IO**: 实时通信
- **@google/genai**: Google Gemini AI SDK
- **edge-tts**: 微软 Edge TTS 语音合成
- **obs-websocket-js**: OBS Studio WebSocket 客户端

### 前端

- **Vue 3**: 前端框架（Composition API）
- **Vue Router**: 路由管理
- **Tailwind CSS 3.x**: 样式框架
- **Socket.IO Client**: 实时通信
- **IndexedDB**: 本地数据存储

## 📁 项目结构

```
ai-gamer/
├── server/                 # 后端服务
│   ├── config/            # 配置管理
│   ├── services/          # 核心服务模块
│   │   ├── obs.js         # OBS WebSocket 服务
│   │   ├── ai.js          # Gemini AI 服务
│   │   ├── tts.js         # TTS 语音服务
│   │   └── commentary.js  # 解说业务服务
│   ├── routes/            # API 路由
│   ├── socket/            # Socket.IO 处理
│   └── index.js           # 入口文件
├── client/                 # 前端应用
│   ├── src/
│   │   ├── views/         # 页面组件
│   │   │   ├── Home.vue   # 首页
│   │   │   ├── Admin.vue  # 管理端
│   │   │   ├── Control.vue # 控制端
│   │   │   └── Display.vue # 解说展示
│   │   ├── composables/   # 组合式函数
│   │   │   ├── useSocket.js  # Socket 状态管理
│   │   │   └── useStorage.js # IndexedDB 存储
│   │   ├── App.vue
│   │   ├── main.js
│   │   └── style.css
│   └── ...
├── audio/                  # 生成的音频文件
├── .env.example           # 环境变量示例
└── package.json
```

## 🚀 快速开始

### 1. 安装依赖

```bash
# 安装根目录依赖
npm install

# 安装前端依赖
cd client && npm install
```

### 2. 配置环境变量

复制 `.env.example` 为 `.env` 并填写配置：

```bash
cp .env.example .env
```

编辑 `.env` 文件：

```env
# Google Gemini API Key（从 https://aistudio.google.com/apikey 获取）
GEMINI_API_KEY=your_api_key_here

# 服务器配置
PORT=3000
HOST=localhost

# OBS WebSocket 配置
OBS_WS_URL=ws://127.0.0.1:4455
OBS_WS_PASSWORD=your_obs_password

# TTS 配置
TTS_VOICE=zh-CN-XiaoxiaoNeural
TTS_RATE=+0%
TTS_VOLUME=+0%
TTS_PITCH=+0Hz
```

### 3. 配置 OBS Studio

1. 打开 OBS Studio
2. 菜单 → 工具 → WebSocket 服务器设置
3. 启用 WebSocket 服务器
4. 设置端口（默认 4455）和密码
5. 将密码填入 `.env` 文件

### 4. 启动项目

```bash
# 开发模式（同时启动前后端）
npm run dev

# 或分别启动
npm run dev:server  # 启动后端
npm run dev:client  # 启动前端
```

### 5. 访问应用

- 首页: http://localhost:5173
- 管理端: http://localhost:5173/admin
- 控制端: http://localhost:5173/control
- 展示端: http://localhost:5173/display

## 📺 OBS 浏览器源设置

### 添加解说展示

1. 在 OBS 中添加 "浏览器" 源
2. URL: `http://localhost:5173/display`
3. 宽度/高度: 根据需求设置（如 1920x200）
4. 勾选 "关闭源时关闭"

### 添加控制面板（可选）

可以在 OBS 中添加自定义停靠面板：

1. 视图 → 停靠面板 → 自定义浏览器停靠面板
2. URL: `http://localhost:5173/control`

## 📖 使用说明

### 管理端

1. 创建/编辑配置方案
2. 设置系统提示词（AI 角色设定）
3. 设置用户提示词（解说指令）
4. 配置 TTS 语音和语速
5. 保存配置并应用到当前会话

### 控制端

1. 连接 OBS WebSocket
2. 选择解说模式（自动/手动）
3. 开始解说
4. 手动模式下可：
   - 点击"立即解说画面"截取当前画面解说
   - 输入文字让 AI 解说
   - 使用快捷短语直接朗读

### 展示端

- 用于 OBS 浏览器源显示解说文字
- 支持自定义字体、颜色、描边、阴影
- 透明背景适配直播画面

## 🎤 可用语音

系统支持多种中文语音，常用选项：

| 语音名称             | 描述               |
| -------------------- | ------------------ |
| zh-CN-XiaoxiaoNeural | 晓晓（女声，活泼） |
| zh-CN-YunxiNeural    | 云希（男声，年轻） |
| zh-CN-YunjianNeural  | 云健（男声，沉稳） |
| zh-CN-XiaoyiNeural   | 晓伊（女声，温柔） |

## ⚙️ API 接口

### 状态

- `GET /api/status` - 获取系统状态

### OBS

- `POST /api/obs/connect` - 连接 OBS
- `POST /api/obs/disconnect` - 断开 OBS
- `GET /api/obs/scenes` - 获取场景列表

### 解说

- `POST /api/commentary/start` - 开始解说
- `POST /api/commentary/stop` - 停止解说
- `POST /api/commentary/trigger` - 触发一次解说
- `POST /api/commentary/text` - 文字解说
- `POST /api/commentary/speak` - 直接朗读

### 设置

- `GET /api/settings` - 获取设置
- `PUT /api/settings` - 更新设置
- `GET /api/tts/voices` - 获取可用语音

## 🔧 Socket.IO 事件

### 客户端发送

- `obs:connect` - 连接 OBS
- `mode:set` - 设置解说模式
- `commentary:start` - 开始解说
- `commentary:trigger` - 触发解说
- `settings:update` - 更新设置

### 服务端推送

- `state:sync` - 状态同步
- `commentary:text` - 解说文字
- `commentary:audio` - 解说音频
- `commentary:processing` - 处理状态

## 🛠️ 开发

### 构建生产版本

```bash
# 构建前端
npm run build:client

# 启动生产服务器
npm start
```

### 技术栈版本

- Node.js 20+
- @google/genai 1.37.0
- obs-websocket-js 5.0.7
- edge-tts 1.0.1
- Vue 3.5.13
- Tailwind CSS 3.4.17
- Socket.IO 4.8.1

## 📄 许可证

MIT License

## 🙏 致谢

- [Google Gemini](https://ai.google.dev/) - AI 模型
- [Edge TTS](https://github.com/rany2/edge-tts) - 语音合成
- [OBS WebSocket](https://github.com/obsproject/obs-websocket) - OBS 集成
