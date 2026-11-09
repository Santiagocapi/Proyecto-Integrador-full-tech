<script setup>
import { useToast } from '@/composables/useToast'

const { toasts, removeToast } = useToast()
</script>

<template>
  <div class="fixed bottom-5 right-5 z-50 flex flex-col space-y-2 max-w-sm w-full pointer-events-none">
    <transition-group name="toast" tag="div" class="flex flex-col space-y-2">
      <div 
        v-for="toast in toasts" 
        :key="toast.id"
        class="pointer-events-auto flex items-center justify-between p-4 rounded-lg shadow-lg text-white text-sm font-medium transition-all duration-300"
        :class="{
          'bg-emerald-600': toast.type === 'success',
          'bg-rose-600': toast.type === 'error',
          'bg-sky-600': toast.type === 'info'
        }"
      >
        <span>{{ toast.message }}</span>
        <button 
          @click="removeToast(toast.id)"
          class="ml-4 text-white hover:text-gray-200 font-bold text-lg focus:outline-none"
        >
          &times;
        </button>
      </div>
    </transition-group>
  </div>
</template>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}
.toast-enter-from {
  opacity: 0;
  transform: translateY(30px);
}
.toast-leave-to {
  opacity: 0;
  transform: translateX(30px);
}
</style>