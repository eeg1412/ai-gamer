# AI Gamer - 智能 AI 游戏解说直播系统

AI Gamer 是一款专为直播主设计的智能 AI 游戏解说系统。它利用 Google Gemini 的视觉分析能力，实时对游戏画面进行深度解析，并结合 Azure 高拟人 TTS 生成幽默、专业且极具沉浸感的解说语音，为直播增添独特魅力。

## ✨ 核心特性

- 🎮 **视觉感应解说**: 采用 Google Gemini 1.5/2.0 Flash 视觉模型，精准识别游戏画面中的精彩瞬间、关键战局及细微操作。
- 🎤 **高保真语音合成**: 集成 Azure Cognitive Services Speech，提供晓晓、云希等多种自然流畅、情感丰富的中文配音。
- 📺 **OBS 深度集成**: 通过 OBS WebSocket 实时获取直播流画面，支持作为浏览器源（Browser Source）无缝嵌入直播间。
- 💬 **互动性解说**: 支持 Twitch 聊天室集成，AI 解说员可实时阅读弹幕并与观众互动。
- 🤖 **个性化人设**: 自由配置系统提示词（System Prompt），随心打造“狂热粉”、“毒舌君”或“专业分析师”等解说风格。
- 🧠 **长期记忆与统计**: 基于 SQLite 的 memory 系统与 Token 使用统计，让 AI 能够回顾过往精彩环节，并方便开发者掌控成本。
- 🎨 **现代控制面板**: 响应式管理界面（Vue 3 + Tailwind CSS），支持自动/手动解说控制。

## 🏗️ 技术架构

### 后端 (Node.js)

- **Express & Socket.IO**: 构建高效的 Web 服务与实时双向通信。
- **Google Generative AI**: 核心视觉分析大脑（Gemini 1.5/2.0 Flash）。
- **Azure Speech SDK**: 专业级的语音合成。
- **better-sqlite3**: 轻量高性能的本地数据存储，用于 Token 统计与记忆。
- **tmi.js**: Twitch 聊天集成支持。

### 前端 (Vue 3)

- **Vite**: 极速的开发与构建工具。
- **Tailwind CSS**: 精美的游戏风格 UI 设计。
- **Socket.IO Client**: 实时同步服务端解说状态。
- **IndexedDB**: 浏览器端配置持久化。

## 📁 项目结构

```
ai-gamer/
├── server/             # 后端核心代码
│   ├── config/        # 全局配置管理
│   ├── routes/        # API 接口路由
│   ├── services/      # 核心服务 (AI, TTS, OBS, Twitch, Database 等)
│   ├── socket/        # Socket.IO 实时通信处理
│   └── index.js       # 服务端入口
├── client/             # 前端 Vue 3 应用
│   ├── src/
│   │   ├── views/     # 页面 (Home, Admin, Control, Display)
│   │   ├── composables/ # 组合式逻辑
│   │   └── main.js    # 前端入口
├── data/               # SQLite 数据库存储
├── audio/              # 临时存放生成的 TTS 音频
└── package.json        # 项目依赖与脚本
```

## 🚀 快速开始

### 1. 环境准备

确保你已安装：

- **Node.js**: v18.0.0 或更高版本
- **OBS Studio**: 开启 WebSocket 服务器（设置 > 高级 > OBS WebSocket 服务器设置）

### 2. 获取 API 密钥

- **Google Gemini**: 在 [Google AI Studio](https://aistudio.google.com/apikey) 申请。
- **Azure Speech**: 在 [Azure Portal](https://portal.azure.com/) 创建语音服务资源以获取密钥和区域（Region）。

### 3. 安装依赖

```bash
# 克隆仓库
git clone https://github.com/your-repo/ai-gamer.git
cd ai-gamer

# 安装项目根目录依赖 (包含后端)
npm install

# 安装前端依赖
cd client
npm install
cd ..
```

### 4. 配置环境变量

复制 `.env.example` 为 `.env` 并填入配置：

```bash
cp .env.example .env
```

编辑 `.env` 文件：

- `GEMINI_API_KEY`: 你的 Google AI 密钥。
- `AZURE_SPEECH_KEY`: 你的 Azure 语音密钥。
- `AZURE_SPEECH_REGION`: 你的 Azure 资源区域（如 `eastasia`）。
- `OBS_WS_PASSWORD`: OBS WebSocket 的连接密码。

### 5. 启动项目

在项目根目录下运行：

```bash
npm run dev
```

此命令将同时启动后端服务器（默认端口 3000）和前端开发服务器（默认端口 5173）。

## 📖 使用指南

### 第一步：OBS 基础配置

1. 确保 OBS 正在运行，且 WebSocket 端口与密码与 `.env` 中一致。
2. 建议将游戏捕获或窗口捕获作为主要画面。

### 第二步：解说员设置 (Admin)

1. 访问 `http://localhost:5173/admin`。
2. **连接检查**: 确认 OBS、AI 和 TTS 状态显示为“已连接”。
3. **人设配置**: 在配置方案中设置系统提示词。
   - _示例_: "你是一个激进的 MOBA 解说，喜欢吐槽选手的失误，并对精妙操作赞不绝口。"
4. **语音设置**: 选择你喜欢的 TTS 语音（如 `zh-CN-YunxiNeural`）和语速。

### 第三步：控制解说流程 (Control)

1. 访问 `http://localhost:5173/control`。
2. **选择模式**:
   - **自动模式**: 开启后，系统将按设定间隔（如每 15 秒）自动抓图解说。
   - **手动触发**: 点击“立即解说画面”单次截取当前画面。
3. **Twitch 互动**: 如果配置了 Twitch 账号，解说员将结合直播间弹幕进行解说。

### 第四步：在 OBS 中展示 (Display)

1. 在 OBS 中添加一个 **浏览器源**。
2. URL 填写: `http://localhost:5173/display`。
3. 宽度/高度设置（如 1920x200，建议放在画面底部）。
4. 在 Display 页面按 `S` 键或点击右上角设置按钮，可自定义字幕字体颜色、大小和描边。

## ⚙️ 高级配置 (API & WebSocket)

服务端通过 Socket.IO 提供实时状态同步，主要的事件包括：

- `state:sync`: 同步全局状态（OBS状态、运行模式等）。
- `commentary:text`: 推送最新的解说文本。
- `commentary:audio`: 推送合成后的音频路径（Display 端负责播放）。

## 📝 许可证

本项目采用 [MIT License](LICENSE) 许可。

## 🙏 致谢

- [Google Gemini](https://ai.google.dev/) - 视觉分析引擎
- [Azure Cognitive Services](https://azure.microsoft.com/en-us/services/cognitive-services/speech-services/) - 高质量 TTS
- [OBS Studio](https://obsproject.com/) - 画面捕获与推流支持
