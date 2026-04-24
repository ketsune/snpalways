<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { apiFetch } from '@/lib/api'

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
</script>

<template>
  <main class="min-h-screen bg-gradient-to-br from-rose-50 via-white to-rose-100 px-6 py-8">
    <header class="mb-8 text-center">
      <p class="text-sm uppercase tracking-[0.3em] text-rose-600">Kaywalee &amp; Supanat · Wedding Activity</p>
      <h1 class="font-cookie mt-2 text-6xl sm:text-7xl text-rose-600">Matchmaking Corner</h1>
      <p class="mt-2 text-gray-600">Meet our lovely single friends — say hi tonight!</p>
    </header>

    <p v-if="error" class="mb-4 text-center text-rose-700">{{ error }}</p>

    <div
      v-if="submissions.length === 0 && !error"
      class="flex min-h-[50vh] flex-col items-center justify-center text-center"
    >
      <p class="font-cookie text-4xl text-rose-500">Submissions will appear here</p>
      <p class="mt-2 text-gray-500">Scan the QR code to be the first to share a friend.</p>
    </div>

    <section
      class="grid gap-6"
      style="grid-template-columns: repeat(auto-fill, minmax(260px, 1fr))"
    >
      <article
        v-for="entry in submissions"
        :key="entry.id"
        class="flex flex-col overflow-hidden rounded-3xl border border-rose-100 bg-white shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl"
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
          <p v-if="entry.bio" class="text-sm text-gray-700">{{ entry.bio }}</p>
          <p class="mt-auto text-sm font-semibold text-rose-700 break-words">{{ entry.contact }}</p>
          <p class="text-xs text-gray-500">Submitted by {{ entry.submitter_name }}</p>
        </div>
      </article>
    </section>
  </main>
</template>
