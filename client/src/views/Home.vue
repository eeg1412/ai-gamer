<template>
  <div class="min-h-screen flex flex-col items-center justify-center p-8">
    <!-- Logo和标题 -->
    <div class="text-center mb-12">
      <div
        class="w-24 h-24 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-gaming-purple to-gaming-pink flex items-center justify-center shadow-lg glow-box"
      >
        <span class="text-4xl font-bold text-white">AI</span>
      </div>
      <h1 class="text-4xl font-bold text-white mb-2">AI Gamer</h1>
      <p class="text-gray-400 text-lg">AI游戏解说直播系统</p>
    </div>

    <!-- 导航卡片 -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl w-full">
      <!-- 管理端 -->
      <router-link to="/admin" class="group">
        <div
          class="gradient-border p-6 rounded-xl hover:glow-box transition-all duration-300 cursor-pointer"
        >
          <div class="flex items-center mb-4">
            <span class="material-icons text-3xl text-gaming-purple mr-3"
              >settings</span
            >
            <h2 class="text-xl font-semibold text-white">管理端</h2>
          </div>
          <p class="text-gray-400 text-sm">
            设置直播提示词、解说模式、TTS语音等配置，管理多个直播配置方案。
          </p>
          <div
            class="mt-4 flex items-center text-gaming-purple text-sm group-hover:translate-x-2 transition-transform"
          >
            <span>进入管理</span>
            <span class="material-icons ml-1">arrow_forward</span>
          </div>
        </div>
      </router-link>

      <!-- 控制端 -->
      <router-link to="/control" class="group">
        <div
          class="gradient-border p-6 rounded-xl hover:glow-box transition-all duration-300 cursor-pointer"
        >
          <div class="flex items-center mb-4">
            <span class="material-icons text-3xl text-gaming-cyan mr-3"
              >sports_esports</span
            >
            <h2 class="text-xl font-semibold text-white">控制端</h2>
          </div>
          <p class="text-gray-400 text-sm">
            实时控制解说，支持手动触发画面解说或输入文字让AI解说，适配OBS操作。
          </p>
          <div
            class="mt-4 flex items-center text-gaming-cyan text-sm group-hover:translate-x-2 transition-transform"
          >
            <span>进入控制</span>
            <span class="material-icons ml-1">arrow_forward</span>
          </div>
        </div>
      </router-link>

      <!-- 展示端 -->
      <router-link to="/display" class="group">
        <div
          class="gradient-border p-6 rounded-xl hover:glow-box transition-all duration-300 cursor-pointer"
        >
          <div class="flex items-center mb-4">
            <span class="material-icons text-3xl text-gaming-green mr-3"
              >subtitles</span
            >
            <h2 class="text-xl font-semibold text-white">展示端</h2>
          </div>
          <p class="text-gray-400 text-sm">
            用于OBS浏览器源，实时显示AI解说文字，支持自定义样式和动画效果。
          </p>
          <div
            class="mt-4 flex items-center text-gaming-green text-sm group-hover:translate-x-2 transition-transform"
          >
            <span>进入展示</span>
            <span class="material-icons ml-1">arrow_forward</span>
          </div>
        </div>
      </router-link>
    </div>

    <!-- 状态栏 -->
    <div class="mt-12 flex items-center space-x-6 text-sm text-gray-500">
      <div class="flex items-center">
        <span
          class="w-2 h-2 rounded-full mr-2"
          :class="connected ? 'bg-gaming-green pulse-dot' : 'bg-red-500'"
        ></span>
        <span>{{ connected ? '服务已连接' : '服务未连接' }}</span>
      </div>
      <div class="flex items-center">
        <span
          class="w-2 h-2 rounded-full mr-2"
          :class="
            state.obsConnected ? 'bg-gaming-green pulse-dot' : 'bg-gray-500'
          "
        ></span>
        <span>{{ state.obsConnected ? 'OBS已连接' : 'OBS未连接' }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useSocket } from '../composables/useSocket'

const { connected, state } = useSocket()
</script>
