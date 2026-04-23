<script setup lang="ts">
import { ref } from 'vue'
import { apiUrl } from '@/lib/api'

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

// Token kept in memory only so a shared device won't leak it — re-enter on reload.
const token = ref('')
const authed = ref(false)
const loading = ref(false)
const error = ref<string | null>(null)
const submissions = ref<Submission[]>([])

async function load() {
  loading.value = true
  error.value = null
  try {
    const res = await fetch(apiUrl('/api/matchmaking/all'), {
      headers: { 'x-mod-token': token.value },
    })
    const data = await res.json().catch(() => ({}))
    if (res.status === 401) {
      error.value = 'Invalid moderator token.'
      authed.value = false
      return
    }
    if (!res.ok || !data?.success) throw new Error(data?.message || 'Failed to load')
    submissions.value = data.submissions as Submission[]
    authed.value = true
  } catch (err: unknown) {
    error.value = err instanceof Error ? err.message : 'Failed to load'
  } finally {
    loading.value = false
  }
}

async function setApproved(id: number, approved: boolean) {
  try {
    const res = await fetch(apiUrl(`/api/matchmaking/${id}`), {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'x-mod-token': token.value },
      body: JSON.stringify({ approved }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok || !data?.success) throw new Error(data?.message || 'Failed to update')
    const entry = submissions.value.find((s) => s.id === id)
    if (entry) entry.approved = approved
  } catch (err: unknown) {
    error.value = err instanceof Error ? err.message : 'Failed to update'
  }
}
</script>

<template>
  <main class="min-h-screen bg-off-white px-4 py-10">
    <section class="mx-auto max-w-4xl">
      <h1 class="font-cookie text-5xl text-rose-600">Matchmaking Moderation</h1>
      <p class="mt-2 text-gray-600">Take down submissions before they show on the big screen.</p>

      <form v-if="!authed" class="mt-6 flex gap-3" @submit.prevent="load">
        <input
          v-model="token"
          type="password"
          required
          placeholder="Moderator token"
          class="w-full rounded-lg border border-gray-300 px-4 py-2.5 shadow-sm focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-200"
        />
        <button
          type="submit"
          :disabled="loading"
          class="rounded-full bg-rose-600 px-6 py-2.5 text-white hover:bg-rose-700 disabled:opacity-50"
        >
          {{ loading ? 'Loading…' : 'Enter' }}
        </button>
      </form>

      <p v-if="error" class="mt-4 text-rose-700">{{ error }}</p>

      <div v-if="authed" class="mt-8 space-y-4">
        <div class="flex items-center justify-between">
          <p class="text-sm text-gray-500">{{ submissions.length }} total · {{ submissions.filter((s) => s.approved).length }} showing on screen</p>
          <button
            class="text-sm text-rose-700 hover:underline"
            @click="load"
          >
            Refresh
          </button>
        </div>

        <article
          v-for="entry in submissions"
          :key="entry.id"
          class="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:flex-row"
          :class="!entry.approved ? 'opacity-60' : ''"
        >
          <div class="w-full flex-shrink-0 sm:w-32">
            <img
              v-if="entry.photo_base64"
              :src="entry.photo_base64"
              :alt="entry.friend_name"
              class="h-32 w-full rounded-lg object-cover sm:w-32"
            />
            <div
              v-else
              class="flex h-32 w-full items-center justify-center rounded-lg bg-rose-50 font-cookie text-4xl text-rose-400 sm:w-32"
            >
              {{ entry.friend_name.charAt(0).toUpperCase() }}
            </div>
          </div>

          <div class="flex-1">
            <h2 class="font-cookie text-3xl text-rose-600">{{ entry.friend_name }}</h2>
            <p v-if="entry.bio" class="mt-1 text-sm text-gray-700">{{ entry.bio }}</p>
            <p class="mt-2 text-sm text-gray-700"><strong>Contact:</strong> {{ entry.contact }}</p>
            <p class="text-xs text-gray-500">Submitted by {{ entry.submitter_name }} · {{ new Date(entry.created_at).toLocaleString() }}</p>
          </div>

          <div class="flex items-start">
            <button
              v-if="entry.approved"
              class="rounded-full bg-rose-50 px-4 py-2 text-sm text-rose-700 hover:bg-rose-100"
              @click="setApproved(entry.id, false)"
            >
              Take down
            </button>
            <button
              v-else
              class="rounded-full bg-green-50 px-4 py-2 text-sm text-green-700 hover:bg-green-100"
              @click="setApproved(entry.id, true)"
            >
              Restore
            </button>
          </div>
        </article>

        <p v-if="submissions.length === 0" class="text-center text-gray-500">No submissions yet.</p>
      </div>
    </section>
  </main>
</template>
