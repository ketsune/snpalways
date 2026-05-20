<script setup lang="ts">
import { RouterLink, RouterView, useRoute } from 'vue-router'
import { computed, ref, watch } from 'vue'

const route = useRoute()
const showHeader = computed(() => route.name !== 'landing')
const menuOpen = ref(false)

// Close menu on route change
watch(
  () => route.path,
  () => {
    menuOpen.value = false
  },
)
</script>

<template>
  <div class="min-h-screen bg-white text-gray-800">
    <!-- Site Header -->
    <header v-if="showHeader" class="flex justify-center border-b border-gray-100 relative">
      <div class="flex w-full max-w-5xl items-center justify-between px-4 py-4">
        <RouterLink to="/" class="font-serif text-md md:text-xl text-gray-900"
          >Som & Pann</RouterLink
        >

        <!-- Desktop nav -->
        <nav class="hidden md:flex gap-4 text-sm items-center">
          <RouterLink
            class="flex flex-col items-center gap-0.5 text-gray-600 hover:text-rose-600 transition-colors"
            to="/home"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="2"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
              />
            </svg>
            <span>หน้าแรก</span>
          </RouterLink>
          <RouterLink
            class="flex flex-col items-center gap-0.5 text-gray-600 hover:text-rose-600 transition-colors"
            to="/home#venue"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="2"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            <span>สถานที่</span>
          </RouterLink>
          <RouterLink
            class="flex flex-col items-center gap-0.5 text-gray-600 hover:text-rose-600 transition-colors"
            to="/matchmaking"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="2"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
            <span>ขายคนโสด</span>
          </RouterLink>
          <RouterLink
            class="flex flex-col items-center gap-0.5 text-gray-600 hover:text-rose-600 transition-colors"
            to="/gallery"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="2"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <span>อัลบั๊ม</span>
          </RouterLink>
          <RouterLink
            class="flex flex-col items-center gap-0.5 text-gray-600 hover:text-rose-600 transition-colors"
            to="/table"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="2"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M21 21l-4.35-4.35M17 11A6 6 0 105 11a6 6 0 0012 0z"
              />
            </svg>
            <span>หาโต๊ะ</span>
          </RouterLink>
          <RouterLink
            class="flex flex-col items-center gap-0.5 text-gray-600 hover:text-rose-600 transition-colors"
            to="/lottery"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="2"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7"
              />
            </svg>
            <span>Lucky Draw</span>
          </RouterLink>
        </nav>

        <!-- Mobile hamburger button -->
        <button
          class="md:hidden flex flex-col gap-1.5 p-2 rounded-lg hover:bg-gray-100 transition-colors"
          @click="menuOpen = !menuOpen"
          aria-label="Toggle menu"
        >
          <span
            class="block h-0.5 w-6 bg-gray-700 transition-all duration-300"
            :class="menuOpen ? 'rotate-45 translate-y-2' : ''"
          />
          <span
            class="block h-0.5 w-6 bg-gray-700 transition-all duration-300"
            :class="menuOpen ? 'opacity-0' : ''"
          />
          <span
            class="block h-0.5 w-6 bg-gray-700 transition-all duration-300"
            :class="menuOpen ? '-rotate-45 -translate-y-2' : ''"
          />
        </button>
      </div>

      <!-- Mobile dropdown menu -->
      <Transition
        enter-active-class="transition duration-200 ease-out"
        enter-from-class="opacity-0 -translate-y-2"
        enter-to-class="opacity-100 translate-y-0"
        leave-active-class="transition duration-150 ease-in"
        leave-from-class="opacity-100 translate-y-0"
        leave-to-class="opacity-0 -translate-y-2"
      >
        <div
          v-if="menuOpen"
          class="md:hidden absolute top-full left-0 right-0 z-40 bg-white border-b border-gray-100 shadow-lg"
        >
          <nav class="flex flex-col py-2">
            <RouterLink
              v-for="item in [
                { to: '/home', label: 'หน้าแรก', icon: 'home' },
                { to: '/home#venue', label: 'สถานที่', icon: 'location' },
                { to: '/matchmaking', label: 'ขายคนโสด', icon: 'heart' },
                { to: '/gallery', label: 'อัลบั๊ม', icon: 'photo' },
                { to: '/table', label: 'หาโต๊ะ', icon: 'table' },
                { to: '/lottery', label: 'Lucky Draw', icon: 'gift' },
              ]"
              :key="item.to"
              :to="item.to"
              class="flex items-center gap-3 px-6 py-3 text-gray-700 hover:bg-rose-50 hover:text-rose-600 transition-colors"
            >
              <!-- Home -->
              <svg
                v-if="item.icon === 'home'"
                xmlns="http://www.w3.org/2000/svg"
                class="h-5 w-5 shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                stroke-width="2"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                />
              </svg>
              <!-- Location -->
              <svg
                v-if="item.icon === 'location'"
                xmlns="http://www.w3.org/2000/svg"
                class="h-5 w-5 shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                stroke-width="2"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              <!-- Heart -->
              <svg
                v-if="item.icon === 'heart'"
                xmlns="http://www.w3.org/2000/svg"
                class="h-5 w-5 shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                stroke-width="2"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </svg>
              <!-- Photo -->
              <svg
                v-if="item.icon === 'photo'"
                xmlns="http://www.w3.org/2000/svg"
                class="h-5 w-5 shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                stroke-width="2"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <!-- Table (search) -->
              <svg
                v-if="item.icon === 'table'"
                xmlns="http://www.w3.org/2000/svg"
                class="h-5 w-5 shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                stroke-width="2"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M21 21l-4.35-4.35M17 11A6 6 0 105 11a6 6 0 0012 0z"
                />
              </svg>
              <!-- Gift -->
              <svg
                v-if="item.icon === 'gift'"
                xmlns="http://www.w3.org/2000/svg"
                class="h-5 w-5 shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                stroke-width="2"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7"
                />
              </svg>
              <span class="text-sm font-medium">{{ item.label }}</span>
            </RouterLink>

          </nav>
        </div>
      </Transition>
    </header>

    <!-- Route content -->
    <RouterView />
  </div>
</template>

<style scoped>
/* No component-scoped CSS needed; using Tailwind utility classes */
</style>
