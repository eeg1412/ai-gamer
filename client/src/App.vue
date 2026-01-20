<template>
  <div class="min-h-screen bg-gaming-dark">
    <router-view v-slot="{ Component }">
      <transition name="fade" mode="out-in">
        <component :is="Component" />
      </transition>
    </router-view>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted } from 'vue'
import { useSocket } from './composables/useSocket'

const { connect, disconnect } = useSocket()

onMounted(() => {
  connect()
})

onUnmounted(() => {
  disconnect()
})
</script>
