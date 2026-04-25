<script setup lang="ts">
import { ref } from 'vue'
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

// Token kept in memory only so a shared device won't leak it — re-enter on reload.
const token = ref('')
const authed = ref(false)
const loading = ref(false)
const error = ref<string | null>(null)
const submissions = ref<Submission[]>([])
const deleteAllModal = ref(false)
const deleteAllBusy = ref(false)

async function load() {
  loading.value = true
  error.value = null
  try {
    const res = await apiFetch('/api/matchmaking/all', {
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

async function deleteAll() {
  deleteAllBusy.value = true
  error.value = null
  try {
    const res = await apiFetch('/api/matchmaking', {
      method: 'DELETE',
      headers: { 'x-mod-token': token.value },
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok || !data?.success) throw new Error(data?.message || 'Failed to delete')
    submissions.value = []
    deleteAllModal.value = false
  } catch (err: unknown) {
    error.value = err instanceof Error ? err.message : 'Failed to delete'
  } finally {
    deleteAllBusy.value = false
  }
}

async function setApproved(id: number, approved: boolean) {
  try {
    const res = await apiFetch(`/api/matchmaking/${id}`, {
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

    <!-- Delete All Confirmation Modal -->
    <Teleport to="body">
      <div
        v-if="deleteAllModal"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
        @click.self="deleteAllModal = false"
      >
        <div class="mx-4 w-full max-w-md rounded-2xl bg-white p-7 shadow-xl">
          <h2 class="text-xl font-bold text-gray-900">Delete all submissions?</h2>
          <p class="mt-3 text-gray-600 text-sm leading-relaxed">
            This will permanently delete <strong>all matchmaking submissions</strong>.
            Use this only for demo purposes. This cannot be undone.
          </p>
          <div class="mt-6 flex justify-end gap-3">
            <button
              class="rounded-full border border-gray-300 px-5 py-2 text-sm text-gray-700 hover:bg-gray-50"
              :disabled="deleteAllBusy"
              @click="deleteAllModal = false"
            >Cancel</button>
            <button
              class="rounded-full bg-red-600 px-5 py-2 text-sm text-white hover:bg-red-700 disabled:opacity-50"
              :disabled="deleteAllBusy"
              @click="deleteAll"
            >{{ deleteAllBusy ? 'Deleting…' : 'Yes, delete everything' }}</button>
          </div>
        </div>
      </div>
    </Teleport>

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
          <div class="flex gap-3 items-center">
            <button class="text-sm text-rose-700 hover:underline" @click="load">Refresh</button>
            <button
              class="rounded-full border border-red-300 px-4 py-1 text-sm text-red-600 hover:bg-red-50"
              @click="deleteAllModal = true"
            >Delete all (demo)</button>
          </div>
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
