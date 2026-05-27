<template>
  <router-view />
</template>

<script setup>
import { onMounted } from 'vue'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()

onMounted(() => {
  userStore.initFromStorage()
})
</script>

<style>
#app {
  min-height: 100vh;
}
</style>
