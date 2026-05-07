<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { apiFetch } from '@/lib/api'

type Mission = {
  id: number
  position: number
  title: string
  description: string | null
  example_thumb_base64: string | null
  points: number
  active: boolean
}

const route = useRoute()
const router = useRouter()

// ─── Identity (localStorage UUID + URL ?t= mirror, see spec for rationale) ───
const HUNT_TOKEN_KEY = 'hunt_token_v1'
const HUNT_NAME_KEY = 'hunt_name_v1'
const HUNT_TABLE_KEY = 'hunt_table_v1'

function safeGet(key: string): string | null {
  try { return localStorage.getItem(key) } catch { return null }
}
function safeSet(key: string, value: string) {
  try { localStorage.setItem(key, value) } catch { /* private mode */ }
}

function newToken(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

const hunterToken = ref('')
const hunterName = ref('')
const hunterTable = ref('')
const onboarded = ref(false)

const missions = ref<Mission[]>([])
const completedMissionIds = ref<Set<number>>(new Set())
const totalPoints = ref(0)

const loading = ref(true)
const error = ref<string | null>(null)

const submittingMissionId = ref<number | null>(null)
const successPing = ref<{ missionId: number; points: number } | null>(null)

async function ensureDurableStorage() {
  try {
    if (navigator.storage?.persist) {
      await navigator.storage.persist()
    }
  } catch { /* no-op */ }
}

function bootstrapIdentity() {
  // 1. Token preference order: URL ?t= → localStorage → fresh.
  const urlToken = typeof route.query.t === 'string' ? route.query.t : ''
  const stored = safeGet(HUNT_TOKEN_KEY)
  let token = urlToken || stored || newToken()
  hunterToken.value = token
  safeSet(HUNT_TOKEN_KEY, token)

  // Mirror the token into the URL so clearing localStorage doesn't lose identity.
  if (route.query.t !== token) {
    router.replace({ query: { ...route.query, t: token } })
  }

  hunterName.value = safeGet(HUNT_NAME_KEY) ?? ''
  hunterTable.value = safeGet(HUNT_TABLE_KEY) ?? ''
  onboarded.value = hunterName.value.trim().length > 0
}

async function loadMissions() {
  try {
    const res = await apiFetch('/api/hunt/missions')
    const data = await res.json().catch(() => ({}))
    if (!res.ok || !data?.success) throw new Error(data?.message || 'Failed to load missions')
    missions.value = data.missions as Mission[]
  } catch (err: unknown) {
    error.value = err instanceof Error ? err.message : 'Failed to load missions'
  }
}

async function loadProgress() {
  if (!hunterToken.value) return
  try {
    const res = await apiFetch(`/api/hunt/me?token=${encodeURIComponent(hunterToken.value)}`)
    const data = await res.json().catch(() => ({}))
    if (!res.ok || !data?.success) return
    completedMissionIds.value = new Set<number>(data.completedMissionIds ?? [])
    totalPoints.value = Number(data.totalPoints ?? 0)
  } catch { /* silent */ }
}

function saveOnboarding() {
  const name = hunterName.value.trim()
  if (!name) return
  safeSet(HUNT_NAME_KEY, name)
  safeSet(HUNT_TABLE_KEY, hunterTable.value.trim())
  onboarded.value = true
}

function changeIdentity() {
  onboarded.value = false
}

// ─── Image compression (separate full + thumb passes) ───
async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(r.result as string)
    r.onerror = () => reject(new Error('Could not read file'))
    r.readAsDataURL(file)
  })
}

async function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Could not decode image'))
    img.src = src
  })
}

function downscale(img: HTMLImageElement, maxSize: number, quality: number): string {
  const ratio = Math.min(1, maxSize / Math.max(img.width, img.height))
  const w = Math.round(img.width * ratio)
  const h = Math.round(img.height * ratio)
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  const ctx = c.getContext('2d')
  if (!ctx) throw new Error('Canvas unavailable')
  ctx.drawImage(img, 0, 0, w, h)
  return c.toDataURL('image/jpeg', quality)
}

async function compressFile(file: File): Promise<{ full: string; thumb: string }> {
  const url = await fileToDataUrl(file)
  const img = await loadImage(url)
  const full = downscale(img, 900, 0.82)
  const thumb = downscale(img, 200, 0.78)
  return { full, thumb }
}

async function onMissionFile(mission: Mission, event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return
  if (!file.type.startsWith('image/')) {
    error.value = 'Please pick an image.'
    return
  }
  if (!hunterName.value.trim()) {
    error.value = 'Add your name first.'
    return
  }

  submittingMissionId.value = mission.id
  error.value = null
  successPing.value = null
  try {
    const { full, thumb } = await compressFile(file)
    const res = await apiFetch('/api/hunt/photo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        missionId: mission.id,
        hunterToken: hunterToken.value,
        hunterName: hunterName.value.trim(),
        hunterTable: hunterTable.value.trim() || undefined,
        thumbBase64: thumb,
        fullBase64: full,
      }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok || !data?.success) {
      throw new Error(data?.message || 'Upload failed')
    }
    if (!completedMissionIds.value.has(mission.id)) {
      completedMissionIds.value = new Set([...completedMissionIds.value, mission.id])
      totalPoints.value += Number(data.pointsAwarded ?? 0)
    }
    successPing.value = { missionId: mission.id, points: Number(data.pointsAwarded ?? 0) }
    setTimeout(() => {
      if (successPing.value?.missionId === mission.id) successPing.value = null
    }, 4000)
  } catch (err: unknown) {
    error.value = err instanceof Error ? err.message : 'Upload failed'
  } finally {
    submittingMissionId.value = null
  }
}

const completedCount = computed(() => completedMissionIds.value.size)
const totalCount = computed(() => missions.value.length)

onMounted(async () => {
  bootstrapIdentity()
  await ensureDurableStorage()
  await loadMissions()
  await loadProgress()
  loading.value = false
})
</script>

<template>
  <main class="min-h-screen bg-off-white text-gray-800">
    <section class="mx-auto max-w-2xl px-4 py-10 sm:py-14">
      <header class="text-center">
        <p class="text-xs uppercase tracking-[0.3em] text-rose-600">Som &amp; Pann · Wedding Activity</p>
        <h1 class="font-cookie mt-2 text-5xl sm:text-6xl text-rose-600">Mission Hunt</h1>
        <p class="mt-3 text-gray-600">
          Snap photos that match each mission. The best shots show up on the big screen
          throughout the night, and everyone's photos go into the wedding gallery.
        </p>
      </header>

      <!-- Onboarding ───────────────────────────────────────────────── -->
      <form
        v-if="!onboarded"
        class="mt-8 space-y-4 rounded-2xl border border-rose-100 bg-white p-6 shadow-sm"
        @submit.prevent="saveOnboarding"
      >
        <div>
          <label class="block text-sm font-medium text-gray-700" for="hunterName">Your name</label>
          <input
            id="hunterName"
            v-model="hunterName"
            type="text"
            required
            maxlength="80"
            placeholder="What should we call you on the leaderboard?"
            class="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2.5 shadow-sm placeholder:text-gray-400 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-200"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700" for="hunterTable">Table number <span class="text-gray-400">(optional)</span></label>
          <input
            id="hunterTable"
            v-model="hunterTable"
            type="text"
            maxlength="20"
            placeholder="e.g. 6"
            class="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2.5 shadow-sm placeholder:text-gray-400 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-200"
          />
          <p class="mt-1 text-xs text-gray-500">Helps tell two "Pim"s apart.</p>
        </div>
        <button
          type="submit"
          class="inline-flex items-center rounded-full bg-rose-600 px-6 py-2.5 text-white shadow hover:bg-rose-700"
        >Start hunting</button>
      </form>

      <!-- Header strip when onboarded ─────────────────────────────── -->
      <div v-else class="mt-8 rounded-2xl border border-rose-100 bg-white p-5 shadow-sm">
        <div class="flex items-center justify-between gap-3">
          <div>
            <p class="text-sm text-gray-500">Hunting as</p>
            <p class="font-cookie text-2xl text-rose-600">
              {{ hunterName }}<span v-if="hunterTable" class="text-base text-gray-500"> · table {{ hunterTable }}</span>
            </p>
          </div>
          <div class="text-right">
            <p class="text-sm text-gray-500">Score</p>
            <p class="text-2xl font-semibold text-rose-600">{{ totalPoints }} pts</p>
            <p class="text-xs text-gray-500">{{ completedCount }} / {{ totalCount }} missions</p>
          </div>
        </div>
        <button class="mt-3 text-xs text-gray-500 hover:underline" @click="changeIdentity">Change name / table</button>
      </div>

      <p v-if="error" class="mt-4 text-rose-700 text-sm">{{ error }}</p>

      <!-- Missions list ───────────────────────────────────────────── -->
      <div v-if="loading" class="mt-8 text-center text-gray-500">Loading missions…</div>

      <ol v-else-if="onboarded" class="mt-6 space-y-3">
        <li
          v-for="mission in missions"
          :key="mission.id"
          class="overflow-hidden rounded-2xl border bg-white shadow-sm"
          :class="completedMissionIds.has(mission.id) ? 'border-green-300' : 'border-gray-200'"
        >
          <div class="flex items-stretch gap-4 p-4">
            <div class="flex-shrink-0">
              <div
                v-if="mission.example_thumb_base64"
                class="h-16 w-16 overflow-hidden rounded-lg bg-rose-50"
              >
                <img :src="mission.example_thumb_base64" class="h-full w-full object-cover" alt="example" />
              </div>
              <div
                v-else
                class="flex h-16 w-16 items-center justify-center rounded-lg bg-rose-50 font-cookie text-3xl text-rose-400"
              >{{ mission.position }}</div>
            </div>

            <div class="flex-1">
              <div class="flex items-start justify-between gap-2">
                <h3 class="font-semibold text-gray-900">{{ mission.title }}</h3>
                <span class="flex-shrink-0 rounded-full bg-rose-50 px-2 py-0.5 text-xs font-medium text-rose-700">{{ mission.points }} pts</span>
              </div>
              <p v-if="mission.description" class="mt-1 text-sm text-gray-600">{{ mission.description }}</p>

              <div class="mt-3 flex items-center gap-3">
                <label
                  class="inline-flex cursor-pointer items-center rounded-full px-4 py-1.5 text-sm shadow-sm"
                  :class="completedMissionIds.has(mission.id)
                    ? 'bg-green-50 text-green-700 hover:bg-green-100'
                    : 'bg-rose-600 text-white hover:bg-rose-700'"
                >
                  <span v-if="submittingMissionId === mission.id">Uploading…</span>
                  <span v-else-if="completedMissionIds.has(mission.id)">✓ Done · take another</span>
                  <span v-else>Take photo</span>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    class="hidden"
                    :disabled="submittingMissionId !== null"
                    @change="(e) => onMissionFile(mission, e)"
                  />
                </label>
                <span
                  v-if="successPing?.missionId === mission.id"
                  class="text-xs text-green-700"
                >+{{ successPing.points }} pts!</span>
              </div>
            </div>
          </div>
        </li>
      </ol>

      <p v-if="onboarded && !loading && missions.length === 0" class="mt-8 text-center text-gray-500">
        No missions are active right now. Check back later.
      </p>

      <p class="mt-10 text-xs text-gray-500">
        Photos are shared with the couple and may appear on the projector. Be kind, be tasteful.
      </p>
    </section>
  </main>
</template>
