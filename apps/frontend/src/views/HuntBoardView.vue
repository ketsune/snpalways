<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { apiFetch } from '@/lib/api'

type FeedPhoto = {
  id: number
  missionId: number
  hunterName: string
  hunterTable: string | null
  thumbBase64: string
  createdAt: string
}

type Hunter = {
  rank: number
  hunterName: string
  hunterTable: string | null
  missionsCompleted: number
  totalPoints: number
}

type Mission = { id: number; title: string }

const photos = ref<FeedPhoto[]>([])
const leaders = ref<Hunter[]>([])
const missionMap = ref<Map<number, string>>(new Map())
const error = ref<string | null>(null)
const lastSeen = ref<string | null>(null)
const shuffleSeed = ref(0)

const POLL_FEED_MS = 8_000
const POLL_LEADERBOARD_MS = 12_000
const SHUFFLE_MS = 30_000
const MAX_TILES = 80

let feedTimer: ReturnType<typeof setInterval> | null = null
let leaderTimer: ReturnType<typeof setInterval> | null = null
let shuffleTimer: ReturnType<typeof setInterval> | null = null

async function loadMissions() {
  try {
    const res = await apiFetch('/api/hunt/missions')
    const data = await res.json().catch(() => ({}))
    if (!res.ok || !data?.success) return
    const list = (data.missions ?? []) as Mission[]
    missionMap.value = new Map(list.map((m) => [m.id, m.title]))
  } catch { /* silent — projector should never crash */ }
}

async function pollFeed() {
  try {
    const url = lastSeen.value
      ? `/api/hunt/feed?since=${encodeURIComponent(lastSeen.value)}&limit=60`
      : '/api/hunt/feed?limit=60'
    const res = await apiFetch(url)
    const data = await res.json().catch(() => ({}))
    if (!res.ok || !data?.success) return
    const incoming = (data.photos ?? []) as FeedPhoto[]
    if (incoming.length > 0) {
      // Newest first; merge while keeping uniqueness by id.
      const merged = [...incoming, ...photos.value].slice(0, MAX_TILES)
      const seen = new Set<number>()
      photos.value = merged.filter((p) => (seen.has(p.id) ? false : (seen.add(p.id), true)))
      // Track newest createdAt for delta polls.
      const newest = incoming.reduce((acc, p) => (p.createdAt > acc ? p.createdAt : acc), lastSeen.value ?? '')
      lastSeen.value = newest || lastSeen.value
    }
    error.value = null
  } catch (err: unknown) {
    error.value = err instanceof Error ? err.message : 'Lost connection'
  }
}

async function pollLeaderboard() {
  try {
    const res = await apiFetch('/api/hunt/leaderboard?limit=5')
    const data = await res.json().catch(() => ({}))
    if (!res.ok || !data?.success) return
    leaders.value = (data.hunters ?? []) as Hunter[]
  } catch { /* silent */ }
}

const arrangedPhotos = computed(() => {
  // Tie shuffle to shuffleSeed so the layout re-orders every SHUFFLE_MS.
  const seed = shuffleSeed.value
  const arr = [...photos.value]
  // Fisher-Yates with seeded RNG (mulberry32).
  let s = seed >>> 0
  function rand() { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296 }
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j]!, arr[i]!]
  }
  return arr
})

onMounted(async () => {
  await loadMissions()
  await pollFeed()
  await pollLeaderboard()
  feedTimer = setInterval(pollFeed, POLL_FEED_MS)
  leaderTimer = setInterval(pollLeaderboard, POLL_LEADERBOARD_MS)
  shuffleTimer = setInterval(() => {
    shuffleSeed.value = (shuffleSeed.value + 1) % 100000
  }, SHUFFLE_MS)
})

onUnmounted(() => {
  if (feedTimer) clearInterval(feedTimer)
  if (leaderTimer) clearInterval(leaderTimer)
  if (shuffleTimer) clearInterval(shuffleTimer)
})
</script>

<template>
  <main class="min-h-screen bg-[#0b0c1a] text-white px-6 py-6 flex flex-col">
    <header class="mb-5 flex items-baseline justify-between gap-4">
      <div>
        <p class="text-xs uppercase tracking-[0.3em] text-rose-400">Som &amp; Pann · Mission Hunt</p>
        <h1 class="font-cookie mt-1 text-5xl text-rose-300">The Wall</h1>
      </div>
      <p class="text-sm text-gray-500">Scan to play · {{ photos.length }} memories</p>
    </header>

    <p v-if="error" class="mb-3 text-center text-rose-400 text-xs">{{ error }}</p>

    <!-- Mosaic -->
    <section
      v-if="arrangedPhotos.length > 0"
      class="flex-1 grid gap-2 sm:gap-3"
      style="grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); grid-auto-rows: 140px"
    >
      <article
        v-for="photo in arrangedPhotos"
        :key="photo.id"
        class="group relative overflow-hidden rounded-xl border border-white/5 bg-white/5 shadow-lg transition-opacity duration-700"
      >
        <img
          :src="photo.thumbBase64"
          :alt="photo.hunterName"
          class="h-full w-full object-cover"
          loading="lazy"
        />
        <div class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-2">
          <p class="text-[11px] font-medium text-white/90 truncate">{{ photo.hunterName }}</p>
          <p class="text-[10px] uppercase tracking-wide text-rose-300/80 truncate">{{ missionMap.get(photo.missionId) ?? 'Mission' }}</p>
        </div>
      </article>
    </section>

    <section
      v-else
      class="flex flex-1 items-center justify-center text-center"
    >
      <div>
        <p class="font-cookie text-5xl text-rose-300">Waiting for the first shot…</p>
        <p class="mt-3 text-gray-500">Photos appear here ~30 seconds after submission.</p>
      </div>
    </section>

    <!-- Leaderboard strip -->
    <footer
      v-if="leaders.length > 0"
      class="mt-4 rounded-2xl border border-white/10 bg-white/5 px-5 py-3 backdrop-blur"
    >
      <div class="flex items-center justify-between gap-4 text-sm">
        <p class="text-xs uppercase tracking-[0.25em] text-rose-300/80">Top Hunters</p>
        <ol class="flex flex-wrap items-center gap-x-4 gap-y-1">
          <li
            v-for="h in leaders"
            :key="h.rank"
            class="flex items-baseline gap-2"
          >
            <span class="font-mono text-xs text-rose-300/60">#{{ h.rank }}</span>
            <span class="font-semibold text-white">{{ h.hunterName }}</span>
            <span v-if="h.hunterTable" class="text-xs text-gray-500">T{{ h.hunterTable }}</span>
            <span class="font-mono text-xs text-amber-300">{{ h.totalPoints }}</span>
          </li>
        </ol>
      </div>
    </footer>
  </main>
</template>
