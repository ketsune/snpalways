<script setup lang="ts">
import { onMounted, onUnmounted, ref, computed } from 'vue'
import { apiFetch } from '@/lib/api'
import qrMatchmakingUrl from '@/assets/qr-matchmaking'

type Submission = {
  id: number
  submitter_name: string
  friend_name: string
  contact: string
  bio: string | null
  photo_base64: string | null
  approved: boolean
  created_at: string
}

const submissions = ref<Submission[]>([])
const error = ref<string | null>(null)
let pollTimer: ReturnType<typeof setInterval> | null = null

async function load() {
  try {
    const res = await apiFetch('/api/matchmaking')
    const data = await res.json()
    if (!res.ok || !data?.success) throw new Error(data?.message || 'Failed to load')
    submissions.value = data.submissions as Submission[]
    error.value = null
  } catch (err: unknown) {
    error.value = err instanceof Error ? err.message : 'Failed to load'
  }
}

onMounted(() => {
  load()
  pollTimer = setInterval(load, 5000)
})

onUnmounted(() => {
  if (pollTimer) clearInterval(pollTimer)
})

// Duration scales with number of cards — each card gets ~2.5s of screen time (faster)
const marqueeDuration = computed(() => {
  const seconds = Math.max(12, submissions.value.length * 2.5)
  return `${seconds}s`
})
</script>

<template>
  <main class="min-h-screen bg-gradient-to-br from-rose-50 via-white to-rose-100 overflow-hidden px-0 py-8">
    <header class="mb-8 text-center px-6">
      <p class="text-sm uppercase tracking-[0.3em] text-rose-600">Kaywalee &amp; Supanat · Wedding Activity</p>
      <h1 class="font-cookie mt-6 text-5xl text-rose-600">มุมคนโสดโดยความสามารถ</h1>
      <p class="mt-2 text-gray-600">มาทำความรู้จักเพื่อนโสดสุดน่ารักของเรากันเถอะ!</p>
    </header>

    <p v-if="error" class="mb-4 text-center text-rose-700 px-6">{{ error }}</p>

    <div
      v-if="submissions.length === 0 && !error"
      class="flex min-h-[50vh] flex-col items-center justify-center text-center px-6"
    >
      <p class="font-cookie text-4xl text-rose-500">ข้อมูลจะปรากฏที่นี่</p>
      <p class="mt-2 text-gray-500">สแกน QR Code เพื่อเป็นคนแรกที่แนะนำเพื่อน</p>
    </div>

    <!-- Conveyor belt — duplicated for seamless loop -->
    <div
      v-if="submissions.length > 0"
      class="relative w-full overflow-hidden"
    >
      <!-- Fade edges -->
      <div class="pointer-events-none absolute inset-y-0 left-0 w-16 z-10 bg-gradient-to-r from-rose-50 to-transparent"></div>
      <div class="pointer-events-none absolute inset-y-0 right-0 w-16 z-10 bg-gradient-to-l from-rose-100 to-transparent"></div>

      <div class="flex gap-5 animate-marquee w-max hover:pause" :style="{ animationDuration: marqueeDuration }">
        <!-- QR card (original) -->
        <article class="flex-none w-64 flex flex-col items-center justify-center overflow-hidden rounded-3xl border-2 border-rose-300 bg-rose-50 shadow-lg px-4 py-6 gap-3">
          <p class="font-cookie text-2xl text-rose-600 text-center leading-tight">แนะนำเพื่อนโสด<br>ของคุณ!</p>
          <img :src="qrMatchmakingUrl" alt="QR แนะนำเพื่อน" class="w-36 h-36 rounded-xl" />
          <p class="text-xs text-gray-500 text-center">สแกนเพื่อส่งรูปและข้อมูลเพื่อน</p>
        </article>

        <!-- Original set -->
        <article
          v-for="entry in submissions"
          :key="`a-${entry.id}`"
          class="flex-none w-64 flex flex-col overflow-hidden rounded-3xl border border-rose-100 bg-white shadow-lg"
        >
          <div class="aspect-[4/5] w-full bg-rose-50">
            <img
              v-if="entry.photo_base64"
              :src="entry.photo_base64"
              :alt="entry.friend_name"
              class="h-full w-full object-cover"
            />
            <div
              v-else
              class="flex h-full w-full items-center justify-center font-cookie text-6xl text-rose-400"
            >
              {{ entry.friend_name.charAt(0).toUpperCase() }}
            </div>
          </div>
          <div class="flex flex-1 flex-col gap-2 p-4">
            <h2 class="font-cookie text-3xl leading-tight text-rose-600">{{ entry.friend_name }}</h2>
            <p v-if="entry.bio" class="text-sm text-gray-700 line-clamp-3">{{ entry.bio }}</p>
            <p class="mt-auto text-sm font-semibold text-rose-700 break-words">{{ entry.contact }}</p>
          </div>
        </article>

        <!-- QR card (duplicate) -->
        <article class="flex-none w-64 flex flex-col items-center justify-center overflow-hidden rounded-3xl border-2 border-rose-300 bg-rose-50 shadow-lg px-4 py-6 gap-3">
          <p class="font-cookie text-2xl text-rose-600 text-center leading-tight">แนะนำเพื่อนโสด<br>ของคุณ!</p>
          <img :src="qrMatchmakingUrl" alt="QR แนะนำเพื่อน" class="w-36 h-36 rounded-xl" />
          <p class="text-xs text-gray-500 text-center">สแกนเพื่อส่งรูปและข้อมูลเพื่อน</p>
        </article>

        <!-- Duplicate set for seamless loop -->
        <article
          v-for="entry in submissions"
          :key="`b-${entry.id}`"
          class="flex-none w-64 flex flex-col overflow-hidden rounded-3xl border border-rose-100 bg-white shadow-lg"
        >
          <div class="aspect-[4/5] w-full bg-rose-50">
            <img
              v-if="entry.photo_base64"
              :src="entry.photo_base64"
              :alt="entry.friend_name"
              class="h-full w-full object-cover"
            />
            <div
              v-else
              class="flex h-full w-full items-center justify-center font-cookie text-6xl text-rose-400"
            >
              {{ entry.friend_name.charAt(0).toUpperCase() }}
            </div>
          </div>
          <div class="flex flex-1 flex-col gap-2 p-4">
            <h2 class="font-cookie text-3xl leading-tight text-rose-600">{{ entry.friend_name }}</h2>
            <p v-if="entry.bio" class="text-sm text-gray-700 line-clamp-3">{{ entry.bio }}</p>
            <p class="mt-auto text-sm font-semibold text-rose-700 break-words">{{ entry.contact }}</p>
          </div>
        </article>
      </div>
    </div>
  </main>
</template>

<style scoped>
@keyframes marquee {
  0%   { transform: translateX(0); }
  100% { transform: translateX(-50%); }
}

.animate-marquee {
  animation: marquee 40s linear infinite;
}

.animate-marquee:hover,
.hover\:pause:hover {
  animation-play-state: paused;
}
</style>
