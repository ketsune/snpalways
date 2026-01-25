<script setup lang="ts">
import { RouterLink, RouterView, useRoute } from 'vue-router'
import { computed } from 'vue'

const route = useRoute()
const showHeader = computed(() => route.name !== 'landing')
</script>

<template>
  <div class="min-h-screen bg-white text-gray-800">
    <!-- Site Header -->
    <header v-if="showHeader" class="flex justify-center border-b border-gray-100">
      <div class="flex w-full max-w-5xl items-center justify-between px-4 py-4">
        <RouterLink to="/" class="font-serif text-md md:text-xl text-gray-900">Som & Pann</RouterLink>
        <nav class="flex gap-2 md:gap-4 text-sm">
          <RouterLink class="text-gray-600 hover:text-gray-900" to="/home">
            Home
          </RouterLink>
          <RouterLink class="text-gray-600 hover:text-gray-900" to="/home#venue">
            Location
          </RouterLink>
          <RouterLink class="text-gray-600 hover:text-gray-900" to="/home#contact">
            Contact
          </RouterLink>
          <RouterLink class="text-gray-600 hover:text-gray-900" to="/gallery">
            Gallery
          </RouterLink>
          <a
            class="text-gray-600 hover:text-gray-900"
            href="https://forms.gle/e1WGCZBAHVRLV5cA7"
            target="_blank"
            rel="noopener noreferrer"
            >RSVP</a
          >
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
