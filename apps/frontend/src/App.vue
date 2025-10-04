<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
</script>

<template>
  <div class="min-h-screen bg-white text-gray-800">
    <!-- Site Header -->
    <header class="flex justify-center border-b border-gray-100">
      <div class="flex w-full max-w-5xl items-center justify-between px-4 py-4">
        <RouterLink to="/" class="font-serif text-xl text-gray-900">Som & Pann</RouterLink>
        <nav class="flex gap-4 text-sm">
          <RouterLink class="text-gray-600 hover:text-gray-900" to="/">Home</RouterLink>
          <RouterLink class="text-gray-600 hover:text-gray-900" to="/rsvp">RSVP</RouterLink>
        </nav>
      </div>
    </header>

    <!-- Route content -->
    <RouterView />
  </div>
</template>

<style scoped>
/* No component-scoped CSS needed; using Tailwind utility classes */
</style>
