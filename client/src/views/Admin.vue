<template>
  <div class="min-h-screen bg-gaming-dark">
    <!-- 顶部导航 -->
    <nav class="glass border-b border-gaming-purple/20 px-6 py-4">
      <div class="max-w-7xl mx-auto flex items-center justify-between">
        <div class="flex items-center space-x-4">
          <router-link
            to="/"
            class="flex items-center text-white hover:text-gaming-purple transition-colors"
          >
            <span class="material-icons mr-2">arrow_back</span>
            <span>返回</span>
          </router-link>
          <div class="h-6 w-px bg-gray-700"></div>
          <h1 class="text-xl font-semibold text-white flex items-center">
            <span class="material-icons mr-2 text-gaming-purple">settings</span>
            管理端
          </h1>
        </div>

        <div class="flex items-center space-x-4">
          <!-- Tab切换 -->
          <div class="flex items-center bg-gray-800 rounded-lg p-1">
            <button
              @click="currentTab = 'config'"
              class="px-4 py-2 rounded-lg text-sm transition-colors"
              :class="
                currentTab === 'config'
                  ? 'bg-gaming-purple text-white'
                  : 'text-gray-400 hover:text-white'
              "
            >
              配置方案
            </button>
            <button
              @click="currentTab = 'memory'"
              class="px-4 py-2 rounded-lg text-sm transition-colors"
              :class="
                currentTab === 'memory'
                  ? 'bg-gaming-purple text-white'
                  : 'text-gray-400 hover:text-white'
              "
            >
              AI记忆
            </button>
            <button
              @click="currentTab = 'stats'"
              class="px-4 py-2 rounded-lg text-sm transition-colors"
              :class="
                currentTab === 'stats'
                  ? 'bg-gaming-purple text-white'
                  : 'text-gray-400 hover:text-white'
              "
            >
              Token统计
            </button>
            <button
              @click="currentTab = 'monitor'"
              class="px-4 py-2 rounded-lg text-sm transition-colors"
              :class="
                currentTab === 'monitor'
                  ? 'bg-gaming-purple text-white'
                  : 'text-gray-400 hover:text-white'
              "
            >
              实时监控
            </button>
          </div>

          <!-- 连接状态 -->
          <div class="flex items-center space-x-2 text-sm">
            <span
              class="w-2 h-2 rounded-full"
              :class="
                state.obsConnected ? 'bg-gaming-green pulse-dot' : 'bg-red-500'
              "
            ></span>
            <span class="text-gray-400"
              >OBS {{ state.obsConnected ? '已连接' : '未连接' }}</span
            >
          </div>
        </div>
      </div>
    </nav>

    <div class="max-w-7xl mx-auto p-6">
      <!-- Token统计 Tab -->
      <div v-if="currentTab === 'stats'" class="space-y-6">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <!-- 今日统计 -->
          <div class="gradient-border rounded-xl p-6">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-lg font-semibold text-white flex items-center">
                <span class="material-icons mr-2 text-gaming-cyan">today</span>
                今日
              </h3>
              <span class="text-3xl font-bold text-gaming-cyan">{{
                formatNumber(tokenStats.today.total)
              }}</span>
            </div>
            <div class="space-y-2 text-sm">
              <div class="flex justify-between text-gray-400">
                <span>输入Token</span>
                <span class="text-white">{{
                  formatNumber(tokenStats.today.input)
                }}</span>
              </div>
              <div class="flex justify-between text-gray-400">
                <span>输出Token</span>
                <span class="text-white">{{
                  formatNumber(tokenStats.today.output)
                }}</span>
              </div>
              <div class="flex justify-between text-gray-400">
                <span>请求次数</span>
                <span class="text-white">{{ tokenStats.today.count }}</span>
              </div>
            </div>
          </div>

          <!-- 本周统计 -->
          <div class="gradient-border rounded-xl p-6">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-lg font-semibold text-white flex items-center">
                <span class="material-icons mr-2 text-gaming-purple"
                  >date_range</span
                >
                本周
              </h3>
              <span class="text-3xl font-bold text-gaming-purple">{{
                formatNumber(tokenStats.week.total)
              }}</span>
            </div>
            <div class="space-y-2 text-sm">
              <div class="flex justify-between text-gray-400">
                <span>输入Token</span>
                <span class="text-white">{{
                  formatNumber(tokenStats.week.input)
                }}</span>
              </div>
              <div class="flex justify-between text-gray-400">
                <span>输出Token</span>
                <span class="text-white">{{
                  formatNumber(tokenStats.week.output)
                }}</span>
              </div>
              <div class="flex justify-between text-gray-400">
                <span>请求次数</span>
                <span class="text-white">{{ tokenStats.week.count }}</span>
              </div>
            </div>
          </div>

          <!-- 本月统计 -->
          <div class="gradient-border rounded-xl p-6">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-lg font-semibold text-white flex items-center">
                <span class="material-icons mr-2 text-gaming-green"
                  >calendar_month</span
                >
                本月
              </h3>
              <span class="text-3xl font-bold text-gaming-green">{{
                formatNumber(tokenStats.month.total)
              }}</span>
            </div>
            <div class="space-y-2 text-sm">
              <div class="flex justify-between text-gray-400">
                <span>输入Token</span>
                <span class="text-white">{{
                  formatNumber(tokenStats.month.input)
                }}</span>
              </div>
              <div class="flex justify-between text-gray-400">
                <span>输出Token</span>
                <span class="text-white">{{
                  formatNumber(tokenStats.month.output)
                }}</span>
              </div>
              <div class="flex justify-between text-gray-400">
                <span>请求次数</span>
                <span class="text-white">{{ tokenStats.month.count }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 刷新按钮 -->
        <div class="flex justify-center">
          <button
            @click="loadTokenStats"
            class="flex items-center px-4 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
          >
            <span class="material-icons mr-2">refresh</span>
            刷新统计
          </button>
        </div>
      </div>

      <!-- 实时监控 Tab -->
      <div v-if="currentTab === 'monitor'" class="space-y-6">
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- 画面预览 -->
          <div class="gradient-border rounded-xl p-6">
            <h2 class="text-xl font-semibold text-white mb-4 flex items-center">
              <span class="material-icons mr-2 text-gaming-cyan"
                >photo_camera</span
              >
              解说瞬时截图 (480p)
            </h2>
            <div
              class="bg-gray-900 rounded-lg overflow-hidden aspect-video flex items-center justify-center border border-gray-700/50 shadow-inner"
            >
              <img
                v-if="lastScreenshot"
                :src="lastScreenshot"
                class="w-full h-full object-contain"
                alt="Latest Capture"
              />
              <div v-else class="text-gray-500 flex flex-col items-center">
                <span class="material-icons text-6xl mb-4"
                  >image_not_supported</span
                >
                <p>等待解说触发截图...</p>
              </div>
            </div>
            <div
              v-if="state.lastCommentaryTime"
              class="mt-4 text-sm text-gray-400 flex justify-between"
            >
              <span>截图时间: {{ formatTime(state.lastCommentaryTime) }}</span>
              <span>分辨率: 854x480 (480p)</span>
            </div>
          </div>

          <!-- 状态概览 -->
          <div class="gradient-border rounded-xl p-6">
            <h2 class="text-xl font-semibold text-white mb-4 flex items-center">
              <span class="material-icons mr-2 text-gaming-purple">info</span>
              当前解说状态
            </h2>
            <div class="space-y-4">
              <div
                class="flex justify-between items-center p-3 bg-gray-800/50 rounded-lg"
              >
                <span class="text-gray-400">运行状态</span>
                <span
                  :class="
                    state.isRunning ? 'text-gaming-green' : 'text-red-400'
                  "
                >
                  {{ state.isRunning ? '正在运行' : '已停止' }}
                </span>
              </div>
              <div
                class="flex justify-between items-center p-3 bg-gray-800/50 rounded-lg"
              >
                <span class="text-gray-400">解说模式</span>
                <span class="text-white">{{
                  state.mode === 'auto' ? '自动' : '手动'
                }}</span>
              </div>
              <div
                v-if="state.mode === 'auto'"
                class="flex justify-between items-center p-3 bg-gray-800/50 rounded-lg"
              >
                <span class="text-gray-400">自动间隔</span>
                <span class="text-white">{{ state.autoIntervalSeconds }}s</span>
              </div>
              <div
                class="flex justify-between items-center p-3 bg-gray-800/50 rounded-lg"
              >
                <span class="text-gray-400">最新解说内容</span>
                <span class="text-white text-right max-w-xs truncate">{{
                  state.currentCommentary || '无'
                }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- AI记忆 Tab -->
      <div
        v-if="currentTab === 'memory'"
        class="grid grid-cols-1 lg:grid-cols-3 gap-6"
      >
        <!-- 左侧：激活的记忆 -->
        <div class="lg:col-span-1">
          <div class="gradient-border rounded-xl p-4">
            <h2 class="text-lg font-semibold text-white mb-4 flex items-center">
              <span class="material-icons mr-2 text-gaming-green"
                >psychology</span
              >
              当前激活记忆
            </h2>

            <div class="space-y-2 max-h-80 overflow-y-auto">
              <div
                v-for="memory in activeMemories"
                :key="memory.id"
                class="p-3 bg-gaming-green/20 border border-gaming-green/50 rounded-lg"
              >
                <div class="flex items-center justify-between mb-1">
                  <span class="text-gaming-green font-medium text-sm">{{
                    memory.title
                  }}</span>
                  <button
                    @click="removeActiveMemory(memory.id)"
                    class="text-gray-400 hover:text-red-400"
                  >
                    <span class="material-icons text-sm">close</span>
                  </button>
                </div>
                <p class="text-gray-400 text-xs line-clamp-2">
                  {{ memory.content }}
                </p>
              </div>

              <div
                v-if="activeMemories.length === 0"
                class="text-center py-6 text-gray-500"
              >
                <span class="material-icons text-3xl mb-2">memory</span>
                <p class="text-sm">未激活任何记忆</p>
                <p class="text-xs">从右侧选择记忆激活</p>
              </div>
            </div>

            <button
              v-if="activeMemories.length > 0"
              @click="clearAllActiveMemories"
              class="w-full mt-4 py-2 text-red-400 hover:bg-red-400/10 rounded-lg text-sm transition-colors"
            >
              清除所有激活记忆
            </button>
          </div>

          <!-- 创建新记忆 -->
          <div class="gradient-border rounded-xl p-4 mt-4">
            <h2 class="text-lg font-semibold text-white mb-4 flex items-center">
              <span class="material-icons mr-2 text-gaming-cyan"
                >add_circle</span
              >
              创建记忆
            </h2>

            <div class="space-y-3">
              <div>
                <label class="block text-sm text-gray-400 mb-1">标题</label>
                <input
                  v-model="newMemory.title"
                  type="text"
                  class="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:border-gaming-purple focus:outline-none"
                  placeholder="记忆标题"
                />
              </div>
              <div>
                <label class="block text-sm text-gray-400 mb-1">内容</label>
                <textarea
                  v-model="newMemory.content"
                  rows="3"
                  class="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:border-gaming-purple focus:outline-none resize-none"
                  placeholder="记忆内容..."
                ></textarea>
              </div>
              <div>
                <label class="block text-sm text-gray-400 mb-1">类型</label>
                <select
                  v-model="newMemory.memoryType"
                  class="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:border-gaming-purple focus:outline-none"
                >
                  <option value="manual">手动创建</option>
                  <option value="game_context">游戏背景</option>
                  <option value="style">解说风格</option>
                  <option value="character">角色设定</option>
                </select>
              </div>
              <button
                @click="handleCreateMemory"
                :disabled="!newMemory.title || !newMemory.content"
                class="w-full py-2 bg-gaming-cyan text-white rounded-lg hover:bg-gaming-cyan/80 transition-colors disabled:opacity-50"
              >
                创建记忆
              </button>
            </div>
          </div>
        </div>

        <!-- 右侧：记忆列表 -->
        <div class="lg:col-span-2">
          <div class="gradient-border rounded-xl p-4">
            <div class="flex items-center justify-between mb-4">
              <h2 class="text-lg font-semibold text-white flex items-center">
                <span class="material-icons mr-2 text-gaming-purple"
                  >folder_special</span
                >
                所有记忆
              </h2>
              <button
                @click="loadAllMemories"
                class="p-2 text-gray-400 hover:text-white"
              >
                <span class="material-icons">refresh</span>
              </button>
            </div>

            <div class="space-y-3 max-h-[600px] overflow-y-auto">
              <div
                v-for="memory in memories"
                :key="memory.id"
                class="p-4 bg-gray-800/50 hover:bg-gray-800 rounded-lg border border-gray-700 transition-colors"
              >
                <div class="flex items-start justify-between mb-2">
                  <div>
                    <h3 class="text-white font-medium">{{ memory.title }}</h3>
                    <span
                      v-if="memory.memory_type"
                      class="text-xs px-2 py-0.5 rounded bg-gray-700 text-gray-400"
                      >{{ memory.memory_type }}</span
                    >
                  </div>
                  <div class="flex items-center space-x-2">
                    <button
                      @click="toggleMemoryActive(memory)"
                      class="px-3 py-1 rounded text-sm transition-colors"
                      :class="
                        isMemoryActive(memory.id)
                          ? 'bg-gaming-green/20 text-gaming-green'
                          : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                      "
                    >
                      {{ isMemoryActive(memory.id) ? '已激活' : '激活' }}
                    </button>
                    <button
                      @click="confirmDeleteMemory(memory)"
                      class="p-1 text-gray-400 hover:text-red-400"
                    >
                      <span class="material-icons text-sm">delete</span>
                    </button>
                  </div>
                </div>
                <p class="text-gray-400 text-sm">{{ memory.content }}</p>
                <div class="mt-2 text-xs text-gray-500">
                  创建于: {{ formatDate(memory.created_at) }}
                </div>
              </div>

              <div
                v-if="memories.length === 0"
                class="text-center py-12 text-gray-500"
              >
                <span class="material-icons text-5xl mb-3">memory</span>
                <p>暂无记忆</p>
                <p class="text-sm">在左侧创建新记忆或通过解说自动生成</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 配置方案 Tab -->
      <div
        v-if="currentTab === 'config'"
        class="grid grid-cols-1 lg:grid-cols-3 gap-6"
      >
        <!-- 左侧：配置方案列表 -->
        <div class="lg:col-span-1">
          <div class="gradient-border rounded-xl p-4">
            <div class="flex items-center justify-between mb-4">
              <h2 class="text-lg font-semibold text-white flex items-center">
                <span class="material-icons mr-2 text-gaming-cyan">folder</span>
                配置方案
              </h2>
              <button
                @click="createNewProfile"
                class="p-2 rounded-lg bg-gaming-purple/20 hover:bg-gaming-purple/40 text-gaming-purple transition-colors"
              >
                <span class="material-icons">add</span>
              </button>
            </div>

            <!-- 配置列表 -->
            <div class="space-y-2 max-h-96 overflow-y-auto">
              <div
                v-for="profile in profiles"
                :key="profile.id"
                @click="selectProfile(profile)"
                class="p-3 rounded-lg cursor-pointer transition-all"
                :class="
                  currentProfile?.id === profile.id
                    ? 'bg-gaming-purple/30 border border-gaming-purple'
                    : 'bg-gray-800/50 hover:bg-gray-800 border border-transparent'
                "
              >
                <div class="flex items-center justify-between">
                  <span class="text-white font-medium">{{ profile.name }}</span>
                  <div class="flex items-center space-x-1">
                    <button
                      @click.stop="exportCurrentProfile(profile)"
                      class="p-1 text-gray-400 hover:text-gaming-cyan"
                    >
                      <span class="material-icons text-sm">download</span>
                    </button>
                    <button
                      @click.stop="confirmDelete(profile)"
                      class="p-1 text-gray-400 hover:text-red-500"
                    >
                      <span class="material-icons text-sm">delete</span>
                    </button>
                  </div>
                </div>
                <p class="text-gray-500 text-xs mt-1 truncate">
                  {{ profile.description || '无描述' }}
                </p>
              </div>

              <div
                v-if="profiles.length === 0"
                class="text-center py-8 text-gray-500"
              >
                <span class="material-icons text-4xl mb-2">inbox</span>
                <p>暂无配置方案</p>
                <p class="text-sm">点击上方 + 创建新配置</p>
              </div>
            </div>

            <!-- 导入按钮 -->
            <div class="mt-4 pt-4 border-t border-gray-700">
              <label
                class="flex items-center justify-center p-2 rounded-lg border-2 border-dashed border-gray-600 hover:border-gaming-purple cursor-pointer transition-colors"
              >
                <span class="material-icons mr-2 text-gray-400"
                  >upload_file</span
                >
                <span class="text-gray-400 text-sm">导入配置文件</span>
                <input
                  type="file"
                  accept=".json"
                  @change="handleImport"
                  class="hidden"
                />
              </label>
            </div>
          </div>
        </div>

        <!-- 右侧：配置编辑 -->
        <div class="lg:col-span-2">
          <div v-if="editingProfile" class="space-y-6">
            <!-- 基本信息 -->
            <div class="gradient-border rounded-xl p-6">
              <h3
                class="text-lg font-semibold text-white mb-4 flex items-center"
              >
                <span class="material-icons mr-2 text-gaming-purple">info</span>
                基本信息
              </h3>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm text-gray-400 mb-2"
                    >配置名称</label
                  >
                  <input
                    v-model="editingProfile.name"
                    type="text"
                    class="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-gaming-purple focus:outline-none"
                    placeholder="例如：英雄联盟解说"
                  />
                </div>
                <div>
                  <label class="block text-sm text-gray-400 mb-2">描述</label>
                  <input
                    v-model="editingProfile.description"
                    type="text"
                    class="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-gaming-purple focus:outline-none"
                    placeholder="配置描述..."
                  />
                </div>
              </div>
            </div>

            <!-- 解说提示词 -->
            <div class="gradient-border rounded-xl p-6">
              <h3
                class="text-lg font-semibold text-white mb-4 flex items-center"
              >
                <span class="material-icons mr-2 text-gaming-cyan"
                  >psychology</span
                >
                AI解说设置
              </h3>

              <div class="space-y-4">
                <div>
                  <label class="block text-sm text-gray-400 mb-2"
                    >系统提示词（角色设定）</label
                  >
                  <textarea
                    v-model="editingProfile.settings.systemPrompt"
                    rows="4"
                    class="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-gaming-purple focus:outline-none resize-none"
                    placeholder="定义AI解说员的角色和风格..."
                  ></textarea>
                </div>

                <div>
                  <label class="block text-sm text-gray-400 mb-2"
                    >用户提示词（解说指令）</label
                  >
                  <textarea
                    v-model="editingProfile.settings.userPrompt"
                    rows="3"
                    class="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-gaming-purple focus:outline-none resize-none"
                    placeholder="告诉AI如何解说游戏画面..."
                  ></textarea>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label class="block text-sm text-gray-400 mb-2"
                      >最大Token数</label
                    >
                    <input
                      v-model.number="editingProfile.settings.maxTokens"
                      type="number"
                      min="50"
                      max="500"
                      class="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-gaming-purple focus:outline-none"
                    />
                  </div>
                  <div>
                    <label class="block text-sm text-gray-400 mb-2"
                      >自动解说间隔（秒）</label
                    >
                    <input
                      v-model.number="
                        editingProfile.settings.autoIntervalSeconds
                      "
                      type="number"
                      min="5"
                      max="60"
                      class="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-gaming-purple focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            <!-- TTS设置 -->
            <div class="gradient-border rounded-xl p-6">
              <h3
                class="text-lg font-semibold text-white mb-4 flex items-center"
              >
                <span class="material-icons mr-2 text-gaming-green"
                  >record_voice_over</span
                >
                语音合成设置
              </h3>

              <div class="space-y-4">
                <div class="flex items-center justify-between">
                  <span class="text-gray-300">启用语音合成</span>
                  <label
                    class="relative inline-flex items-center cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      v-model="editingProfile.settings.ttsEnabled"
                      class="sr-only peer"
                    />
                    <div
                      class="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gaming-green"
                    ></div>
                  </label>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label class="block text-sm text-gray-400 mb-2">语音</label>
                    <select
                      v-model="editingProfile.settings.ttsVoice"
                      class="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-gaming-purple focus:outline-none"
                    >
                      <option
                        v-for="voice in voices"
                        :key="voice.ShortName"
                        :value="voice.ShortName"
                      >
                        {{ voice.FriendlyName || voice.ShortName }}
                      </option>
                    </select>
                  </div>
                  <div>
                    <label class="block text-sm text-gray-400 mb-2">语速</label>
                    <select
                      v-model="editingProfile.settings.ttsRate"
                      class="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-gaming-purple focus:outline-none"
                    >
                      <option value="-50%">慢速 (0.5x)</option>
                      <option value="-25%">较慢 (0.75x)</option>
                      <option value="+0%">正常 (1x)</option>
                      <option value="+25%">较快 (1.25x)</option>
                      <option value="+50%">快速 (1.5x)</option>
                    </select>
                  </div>
                </div>

                <!-- 试听按钮 -->
                <button
                  @click="previewTTS"
                  :disabled="previewLoading"
                  class="flex items-center px-4 py-2 bg-gaming-green/20 text-gaming-green rounded-lg hover:bg-gaming-green/30 transition-colors disabled:opacity-50"
                >
                  <span class="material-icons mr-2">{{
                    previewLoading ? 'hourglass_empty' : 'play_arrow'
                  }}</span>
                  {{ previewLoading ? '生成中...' : '试听语音' }}
                </button>
              </div>
            </div>

            <!-- OBS设置 -->
            <div class="gradient-border rounded-xl p-6">
              <h3
                class="text-lg font-semibold text-white mb-4 flex items-center"
              >
                <span class="material-icons mr-2 text-gaming-pink"
                  >videocam</span
                >
                OBS连接设置
              </h3>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm text-gray-400 mb-2"
                    >WebSocket地址</label
                  >
                  <input
                    v-model="editingProfile.obsSettings.url"
                    type="text"
                    class="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-gaming-purple focus:outline-none"
                    placeholder="ws://127.0.0.1:4455"
                  />
                </div>
                <div>
                  <label class="block text-sm text-gray-400 mb-2">密码</label>
                  <input
                    v-model="editingProfile.obsSettings.password"
                    type="password"
                    class="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-gaming-purple focus:outline-none"
                    placeholder="OBS WebSocket密码"
                  />
                </div>
              </div>
            </div>

            <!-- 保存和应用按钮 -->
            <div class="flex items-center justify-end space-x-4">
              <button
                @click="applySettings"
                class="flex items-center px-6 py-2 bg-gaming-cyan/20 text-gaming-cyan rounded-lg hover:bg-gaming-cyan/30 transition-colors"
              >
                <span class="material-icons mr-2">flash_on</span>
                保存并应用到当前会话
              </button>
              <button
                @click="saveCurrentProfile"
                class="flex items-center px-6 py-2 bg-gaming-purple text-white rounded-lg hover:bg-gaming-purple/80 transition-colors btn-glow"
              >
                <span class="material-icons mr-2">save</span>
                保存配置
              </button>
            </div>
          </div>

          <!-- 未选择配置时的提示 -->
          <div v-else class="gradient-border rounded-xl p-12 text-center">
            <span class="material-icons text-6xl text-gray-600 mb-4"
              >folder_open</span
            >
            <h3 class="text-xl text-gray-400 mb-2">选择或创建配置方案</h3>
            <p class="text-gray-500">
              从左侧选择一个配置方案进行编辑，或点击 + 创建新配置
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- 删除确认对话框 -->
    <div
      v-if="deleteConfirmProfile"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
    >
      <div class="glass rounded-xl p-6 max-w-md w-full mx-4">
        <h3 class="text-lg font-semibold text-white mb-4">确认删除</h3>
        <p class="text-gray-400 mb-6">
          确定要删除配置方案 "{{ deleteConfirmProfile.name }}"
          吗？此操作无法撤销。
        </p>
        <div class="flex justify-end space-x-4">
          <button
            @click="deleteConfirmProfile = null"
            class="px-4 py-2 text-gray-400 hover:text-white transition-colors"
          >
            取消
          </button>
          <button
            @click="confirmDeleteProfile"
            class="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            删除
          </button>
        </div>
      </div>
    </div>

    <!-- 音频播放器（隐藏） -->
    <!-- 确认删除对话框（代码已略...） -->

    <!-- Toast 提示 -->
    <div
      v-if="toast.show"
      class="fixed bottom-8 right-8 z-[100] animate-fade-in-up"
    >
      <div
        class="px-6 py-3 rounded-lg shadow-2xl flex items-center space-x-3"
        :class="{
          'bg-gaming-green text-white': toast.type === 'success',
          'bg-red-500 text-white': toast.type === 'error',
          'bg-gaming-cyan text-white': toast.type === 'info'
        }"
      >
        <span class="material-icons">{{
          toast.type === 'success'
            ? 'check_circle'
            : toast.type === 'error'
              ? 'error'
              : 'info'
        }}</span>
        <span class="font-medium">{{ toast.message }}</span>
      </div>
    </div>

    <audio ref="audioPlayer" @ended="previewLoading = false"></audio>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import { useSocket, useCommentary, useMemory } from '../composables/useSocket'
import { useStorage } from '../composables/useStorage'

const { state, lastScreenshot } = useSocket()
const { updateSettings } = useCommentary()
const {
  memories,
  activeMemories,
  getAllMemories,
  setActiveMemories,
  clearActiveMemories: clearAllActive,
  createMemory,
  deleteMemory: deleteMemoryById
} = useMemory()
const {
  profiles,
  currentProfile,
  loadProfiles,
  saveProfile,
  deleteProfile,
  exportProfile,
  importProfile,
  createDefaultProfile
} = useStorage()

const currentTab = ref('config')
const editingProfile = ref(null)
const deleteConfirmProfile = ref(null)
const voices = ref([])
const previewLoading = ref(false)
const audioPlayer = ref(null)

// 提示信息
const toast = ref({
  show: false,
  message: '',
  type: 'success' // 'success' | 'error' | 'info'
})

const showToast = (message, type = 'success') => {
  toast.value.message = message
  toast.value.type = type
  toast.value.show = true
  setTimeout(() => {
    toast.value.show = false
  }, 3000)
}

// Token统计
const tokenStats = ref({
  today: { input: 0, output: 0, total: 0, count: 0 },
  week: { input: 0, output: 0, total: 0, count: 0 },
  month: { input: 0, output: 0, total: 0, count: 0 }
})

// 新记忆表单
const newMemory = ref({
  title: '',
  content: '',
  memoryType: 'manual'
})

// 要删除的记忆
const memoryToDelete = ref(null)

// 格式化时间
const formatTime = timestamp => {
  if (!timestamp) return ''
  return new Date(timestamp).toLocaleTimeString('zh-CN')
}

// 加载Token统计
const loadTokenStats = async () => {
  try {
    const res = await fetch('/api/stats/tokens')
    const data = await res.json()
    if (data.success) {
      tokenStats.value = data.data
    }
  } catch (e) {
    console.error('加载Token统计失败:', e)
  }
}

// 加载所有记忆
const loadAllMemories = () => {
  getAllMemories()
}

// 检查记忆是否激活
const isMemoryActive = id => {
  return activeMemories.value.some(m => m.id === id)
}

// 切换记忆激活状态
const toggleMemoryActive = memory => {
  const currentIds = activeMemories.value.map(m => m.id)
  if (isMemoryActive(memory.id)) {
    setActiveMemories(currentIds.filter(id => id !== memory.id))
  } else {
    setActiveMemories([...currentIds, memory.id])
  }
}

// 移除激活的记忆
const removeActiveMemory = id => {
  const currentIds = activeMemories.value.map(m => m.id)
  setActiveMemories(currentIds.filter(memId => memId !== id))
}

// 清除所有激活记忆
const clearAllActiveMemories = () => {
  clearAllActive()
}

// 创建新记忆
const handleCreateMemory = () => {
  if (newMemory.value.title && newMemory.value.content) {
    createMemory({
      title: newMemory.value.title,
      content: newMemory.value.content,
      memoryType: newMemory.value.memoryType
    })
    newMemory.value = { title: '', content: '', memoryType: 'manual' }
  }
}

// 确认删除记忆
const confirmDeleteMemory = memory => {
  memoryToDelete.value = memory
}

// 执行删除记忆
const confirmDeleteMemoryAction = () => {
  if (memoryToDelete.value) {
    deleteMemoryById(memoryToDelete.value.id)
    memoryToDelete.value = null
  }
}

// 格式化数字
const formatNumber = num => {
  return num?.toLocaleString() || '0'
}

// 格式化日期
const formatDate = dateStr => {
  return new Date(dateStr).toLocaleString('zh-CN')
}

// 加载语音列表
const loadVoices = async () => {
  try {
    const res = await fetch('/api/tts/voices')
    const data = await res.json()
    if (data.success) {
      voices.value = data.data
    }
  } catch (e) {
    console.error('加载语音列表失败:', e)
    // 使用默认列表
    voices.value = [
      { ShortName: 'zh-CN-XiaoxiaoNeural', FriendlyName: '晓晓 (女声)' },
      { ShortName: 'zh-CN-YunxiNeural', FriendlyName: '云希 (男声)' },
      { ShortName: 'zh-CN-YunjianNeural', FriendlyName: '云健 (男声)' },
      { ShortName: 'zh-CN-XiaoyiNeural', FriendlyName: '晓伊 (女声)' }
    ]
  }
}

// 选择配置
const selectProfile = profile => {
  currentProfile.value = profile
  editingProfile.value = JSON.parse(JSON.stringify(profile))
}

// 创建新配置
const createNewProfile = async () => {
  const newProfile = createDefaultProfile()
  const saved = await saveProfile(newProfile)
  selectProfile(saved)
}

// 保存当前配置
const saveCurrentProfile = async () => {
  if (!editingProfile.value) return
  const saved = await saveProfile(editingProfile.value)
  currentProfile.value = saved
  editingProfile.value = JSON.parse(JSON.stringify(saved))
  showToast('配置方案已成功保存到本地缓存')
}

// 应用设置到当前会话
const applySettings = async () => {
  if (!editingProfile.value) return
  await saveCurrentProfile()
  updateSettings({
    ...editingProfile.value.settings,
    obsSettings: editingProfile.value.obsSettings
  })
  showToast('配置已应用到当前服务器会话', 'info')
}

// 确认删除
const confirmDelete = profile => {
  deleteConfirmProfile.value = profile
}

// 执行删除
const confirmDeleteProfile = async () => {
  if (!deleteConfirmProfile.value) return
  await deleteProfile(deleteConfirmProfile.value.id)
  if (editingProfile.value?.id === deleteConfirmProfile.value.id) {
    editingProfile.value = null
  }
  deleteConfirmProfile.value = null
}

// 导出配置
const exportCurrentProfile = profile => {
  exportProfile(profile)
}

// 导入配置
const handleImport = async event => {
  const file = event.target.files[0]
  if (file) {
    const imported = await importProfile(file)
    selectProfile(imported)
  }
  event.target.value = ''
}

// 试听TTS
const previewTTS = async () => {
  previewLoading.value = true
  try {
    const res = await fetch('/api/tts/preview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: '大家好，我是AI游戏解说员，让我们一起享受精彩的游戏时刻！',
        voice: editingProfile.value.settings.ttsVoice,
        rate: editingProfile.value.settings.ttsRate
      })
    })
    const data = await res.json()
    if (data.success && audioPlayer.value) {
      audioPlayer.value.src = data.audioUrl
      audioPlayer.value.play()
    }
  } catch (e) {
    console.error('试听失败:', e)
    previewLoading.value = false
  }
}

onMounted(async () => {
  await loadProfiles()
  await loadVoices()
  await loadTokenStats()
  loadAllMemories()

  // 自动选择第一个配置
  if (profiles.value.length > 0) {
    selectProfile(profiles.value[0])
  }
})
</script>
