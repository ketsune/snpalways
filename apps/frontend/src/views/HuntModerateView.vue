<script setup lang="ts">
import { computed, ref } from 'vue'
import { apiFetch } from '@/lib/api'

type ModPhoto = {
  id: number
  missionId: number
  hunterToken: string
  hunterName: string
  hunterTable: string | null
  thumbBase64: string
  approved: boolean
  createdAt: string
}

type Mission = {
  id: number
  position: number
  title: string
  description: string | null
  example_thumb_base64: string | null
  points: number
  active: boolean
  created_at: string
}

// Token kept in memory only — re-enter on refresh.
const token = ref('')
const authed = ref(false)
const loading = ref(false)
const error = ref<string | null>(null)

const photos = ref<ModPhoto[]>([])
const missions = ref<Mission[]>([])

// Confirm modals
const resetPhotosModal = ref(false)
const resetAllModal = ref(false)
const deletePhotoTarget = ref<ModPhoto | null>(null)
const deleteMissionTarget = ref<Mission | null>(null)
const busy = ref(false)

// New / edit mission form state
const editingMissionId = ref<number | null>(null)
const formTitle = ref('')
const formDescription = ref('')
const formPoints = ref(10)
const formActive = ref(true)

const missionTitleById = computed(() => {
  const m = new Map<number, string>()
  for (const x of missions.value) m.set(x.id, x.title)
  return m
})

function modHeaders(): HeadersInit {
  return { 'Content-Type': 'application/json', 'x-mod-token': token.value }
}

async function loadAll() {
  loading.value = true
  error.value = null
  try {
    const [photosRes, missionsRes] = await Promise.all([
      apiFetch('/api/hunt/photos/all', { headers: { 'x-mod-token': token.value } }),
      apiFetch('/api/hunt/missions/all', { headers: { 'x-mod-token': token.value } }),
    ])
    if (photosRes.status === 401 || missionsRes.status === 401) {
      error.value = 'Invalid moderator token.'
      authed.value = false
      return
    }
    const photosData = await photosRes.json().catch(() => ({}))
    const missionsData = await missionsRes.json().catch(() => ({}))
    if (!photosData?.success) throw new Error(photosData?.message || 'Failed to load photos')
    if (!missionsData?.success) throw new Error(missionsData?.message || 'Failed to load missions')
    photos.value = photosData.photos as ModPhoto[]
    missions.value = missionsData.missions as Mission[]
    authed.value = true
  } catch (err: unknown) {
    error.value = err instanceof Error ? err.message : 'Failed to load'
  } finally {
    loading.value = false
  }
}

async function setApproved(photo: ModPhoto, approved: boolean) {
  try {
    const res = await apiFetch(`/api/hunt/photo/${photo.id}`, {
      method: 'PATCH',
      headers: modHeaders(),
      body: JSON.stringify({ approved }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok || !data?.success) throw new Error(data?.message || 'Failed to update')
    photo.approved = approved
  } catch (err: unknown) {
    error.value = err instanceof Error ? err.message : 'Failed to update'
  }
}

async function deletePhoto(photo: ModPhoto) {
  busy.value = true
  try {
    const res = await apiFetch(`/api/hunt/photo/${photo.id}`, {
      method: 'DELETE',
      headers: { 'x-mod-token': token.value },
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok || !data?.success) throw new Error(data?.message || 'Failed to delete')
    photos.value = photos.value.filter((p) => p.id !== photo.id)
    deletePhotoTarget.value = null
  } catch (err: unknown) {
    error.value = err instanceof Error ? err.message : 'Failed to delete'
  } finally {
    busy.value = false
  }
}

async function resetPhotos() {
  busy.value = true
  try {
    const res = await apiFetch('/api/hunt/photos', {
      method: 'DELETE',
      headers: { 'x-mod-token': token.value },
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok || !data?.success) throw new Error(data?.message || 'Failed to reset')
    photos.value = []
    resetPhotosModal.value = false
  } catch (err: unknown) {
    error.value = err instanceof Error ? err.message : 'Failed to reset'
  } finally {
    busy.value = false
  }
}

async function resetAll() {
  busy.value = true
  try {
    const res = await apiFetch('/api/hunt/all', {
      method: 'DELETE',
      headers: { 'x-mod-token': token.value },
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok || !data?.success) throw new Error(data?.message || 'Failed to reset')
    photos.value = []
    missions.value = []
    resetAllModal.value = false
  } catch (err: unknown) {
    error.value = err instanceof Error ? err.message : 'Failed to reset'
  } finally {
    busy.value = false
  }
}

// ─── Mission CRUD ───
function startCreate() {
  editingMissionId.value = null
  formTitle.value = ''
  formDescription.value = ''
  formPoints.value = 10
  formActive.value = true
}
function startEdit(m: Mission) {
  editingMissionId.value = m.id
  formTitle.value = m.title
  formDescription.value = m.description ?? ''
  formPoints.value = m.points
  formActive.value = m.active
}
function cancelEdit() {
  editingMissionId.value = null
}

async function saveMission() {
  const title = formTitle.value.trim()
  if (!title) return
  busy.value = true
  try {
    const payload = {
      title,
      description: formDescription.value.trim() || undefined,
      points: formPoints.value,
      active: formActive.value,
    }
    const url = editingMissionId.value !== null
      ? `/api/hunt/missions/${editingMissionId.value}`
      : '/api/hunt/missions'
    const method = editingMissionId.value !== null ? 'PATCH' : 'POST'
    const res = await apiFetch(url, {
      method,
      headers: modHeaders(),
      body: JSON.stringify(payload),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok || !data?.success) throw new Error(data?.message || 'Failed to save')
    const saved = data.mission as Mission
    if (editingMissionId.value !== null) {
      const idx = missions.value.findIndex((m) => m.id === saved.id)
      if (idx >= 0) missions.value[idx] = saved
    } else {
      missions.value = [...missions.value, saved].sort((a, b) => a.position - b.position || a.id - b.id)
    }
    startCreate()
  } catch (err: unknown) {
    error.value = err instanceof Error ? err.message : 'Failed to save'
  } finally {
    busy.value = false
  }
}

async function toggleActive(m: Mission) {
  try {
    const res = await apiFetch(`/api/hunt/missions/${m.id}`, {
      method: 'PATCH',
      headers: modHeaders(),
      body: JSON.stringify({ active: !m.active }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok || !data?.success) throw new Error(data?.message || 'Failed to toggle')
    m.active = !m.active
  } catch (err: unknown) {
    error.value = err instanceof Error ? err.message : 'Failed to toggle'
  }
}

async function move(m: Mission, dir: -1 | 1) {
  const sorted = [...missions.value].sort((a, b) => a.position - b.position || a.id - b.id)
  const idx = sorted.findIndex((x) => x.id === m.id)
  const swap = idx + dir
  if (swap < 0 || swap >= sorted.length) return
  ;[sorted[idx], sorted[swap]] = [sorted[swap]!, sorted[idx]!]
  const orderedIds = sorted.map((x) => x.id)
  try {
    const res = await apiFetch('/api/hunt/missions/reorder', {
      method: 'POST',
      headers: modHeaders(),
      body: JSON.stringify({ orderedIds }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok || !data?.success) throw new Error(data?.message || 'Failed to reorder')
    // Refresh from server to get updated positions.
    await loadAll()
  } catch (err: unknown) {
    error.value = err instanceof Error ? err.message : 'Failed to reorder'
  }
}

async function deleteMission(m: Mission) {
  busy.value = true
  try {
    const res = await apiFetch(`/api/hunt/missions/${m.id}`, {
      method: 'DELETE',
      headers: { 'x-mod-token': token.value },
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok || !data?.success) throw new Error(data?.message || 'Failed to delete')
    missions.value = missions.value.filter((x) => x.id !== m.id)
    photos.value = photos.value.filter((p) => p.missionId !== m.id)
    deleteMissionTarget.value = null
  } catch (err: unknown) {
    error.value = err instanceof Error ? err.message : 'Failed to delete'
  } finally {
    busy.value = false
  }
}

const photoApprovedCount = computed(() => photos.value.filter((p) => p.approved).length)
const sortedMissions = computed(() => [...missions.value].sort((a, b) => a.position - b.position || a.id - b.id))
</script>

<template>
  <main class="min-h-screen bg-off-white px-4 py-10">
    <!-- ─── Confirm modals ─── -->
    <Teleport to="body">
      <div
        v-if="resetPhotosModal"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
        @click.self="resetPhotosModal = false"
      >
        <div class="mx-4 w-full max-w-md rounded-2xl bg-white p-7 shadow-xl">
          <h2 class="text-xl font-bold text-gray-900">Wipe all hunt photos?</h2>
          <p class="mt-3 text-sm leading-relaxed text-gray-600">
            Deletes every photo submitted to the hunt. <strong>Missions are kept.</strong>
            Use this to clear test photos before the real event. Cannot be undone.
          </p>
          <div class="mt-6 flex justify-end gap-3">
            <button class="rounded-full border border-gray-300 px-5 py-2 text-sm text-gray-700 hover:bg-gray-50" :disabled="busy" @click="resetPhotosModal = false">Cancel</button>
            <button class="rounded-full bg-red-600 px-5 py-2 text-sm text-white hover:bg-red-700 disabled:opacity-50" :disabled="busy" @click="resetPhotos">{{ busy ? 'Wiping…' : 'Yes, wipe photos' }}</button>
          </div>
        </div>
      </div>
    </Teleport>

    <Teleport to="body">
      <div
        v-if="resetAllModal"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
        @click.self="resetAllModal = false"
      >
        <div class="mx-4 w-full max-w-md rounded-2xl bg-white p-7 shadow-xl">
          <h2 class="text-xl font-bold text-gray-900">Reset all hunt data?</h2>
          <p class="mt-3 text-sm leading-relaxed text-gray-600">
            Deletes <strong>every photo AND every mission</strong>. To restore the default
            mission list, run <code class="rounded bg-gray-100 px-1 py-0.5 text-xs">bun run db:seed:hunt</code>
            on the backend.
          </p>
          <div class="mt-6 flex justify-end gap-3">
            <button class="rounded-full border border-gray-300 px-5 py-2 text-sm text-gray-700 hover:bg-gray-50" :disabled="busy" @click="resetAllModal = false">Cancel</button>
            <button class="rounded-full bg-red-600 px-5 py-2 text-sm text-white hover:bg-red-700 disabled:opacity-50" :disabled="busy" @click="resetAll">{{ busy ? 'Resetting…' : 'Yes, reset everything' }}</button>
          </div>
        </div>
      </div>
    </Teleport>

    <Teleport to="body">
      <div
        v-if="deletePhotoTarget"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
        @click.self="deletePhotoTarget = null"
      >
        <div class="mx-4 w-full max-w-md rounded-2xl bg-white p-7 shadow-xl">
          <h2 class="text-xl font-bold text-gray-900">Delete this photo?</h2>
          <p class="mt-3 text-sm text-gray-600">By <strong>{{ deletePhotoTarget?.hunterName }}</strong>. Cannot be undone.</p>
          <div class="mt-6 flex justify-end gap-3">
            <button class="rounded-full border border-gray-300 px-5 py-2 text-sm text-gray-700 hover:bg-gray-50" :disabled="busy" @click="deletePhotoTarget = null">Cancel</button>
            <button class="rounded-full bg-red-600 px-5 py-2 text-sm text-white hover:bg-red-700 disabled:opacity-50" :disabled="busy" @click="deletePhoto(deletePhotoTarget!)">{{ busy ? 'Deleting…' : 'Delete' }}</button>
          </div>
        </div>
      </div>
    </Teleport>

    <Teleport to="body">
      <div
        v-if="deleteMissionTarget"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
        @click.self="deleteMissionTarget = null"
      >
        <div class="mx-4 w-full max-w-md rounded-2xl bg-white p-7 shadow-xl">
          <h2 class="text-xl font-bold text-gray-900">Delete this mission?</h2>
          <p class="mt-3 text-sm text-gray-600">
            "{{ deleteMissionTarget?.title }}" — <strong>all photos for this mission will also be deleted</strong>.
            Cannot be undone.
          </p>
          <div class="mt-6 flex justify-end gap-3">
            <button class="rounded-full border border-gray-300 px-5 py-2 text-sm text-gray-700 hover:bg-gray-50" :disabled="busy" @click="deleteMissionTarget = null">Cancel</button>
            <button class="rounded-full bg-red-600 px-5 py-2 text-sm text-white hover:bg-red-700 disabled:opacity-50" :disabled="busy" @click="deleteMission(deleteMissionTarget!)">{{ busy ? 'Deleting…' : 'Yes, delete' }}</button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- ─── Page ─── -->
    <section class="mx-auto max-w-4xl">
      <h1 class="font-cookie text-5xl text-rose-600">Mission Hunt Moderation</h1>
      <p class="mt-2 text-gray-600">Photos, missions, and demo reset.</p>

      <form v-if="!authed" class="mt-6 flex gap-3" @submit.prevent="loadAll">
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
        >{{ loading ? 'Loading…' : 'Enter' }}</button>
      </form>

      <p v-if="error" class="mt-4 text-rose-700">{{ error }}</p>

      <template v-if="authed">
        <!-- ─── Section 1: Photos ─── -->
        <section class="mt-10">
          <div class="flex items-center justify-between">
            <h2 class="text-2xl font-semibold text-gray-900">Photos</h2>
            <div class="flex gap-3">
              <button class="text-sm text-rose-700 hover:underline" @click="loadAll">Refresh</button>
              <button
                class="rounded-full border border-red-300 px-4 py-1 text-sm text-red-600 hover:bg-red-50"
                @click="resetPhotosModal = true"
              >Reset photos</button>
            </div>
          </div>
          <p class="mt-1 text-sm text-gray-500">
            {{ photos.length }} total · {{ photoApprovedCount }} showing on the wall
          </p>

          <div v-if="photos.length === 0" class="mt-6 text-center text-gray-500">No photos yet.</div>

          <div v-else class="mt-6 grid gap-3" style="grid-template-columns: repeat(auto-fill, minmax(180px, 1fr))">
            <article
              v-for="photo in photos"
              :key="photo.id"
              class="overflow-hidden rounded-2xl border bg-white shadow-sm"
              :class="photo.approved ? 'border-gray-200' : 'border-red-200 opacity-60'"
            >
              <div class="aspect-square w-full bg-gray-100">
                <img :src="photo.thumbBase64" :alt="photo.hunterName" class="h-full w-full object-cover" />
              </div>
              <div class="p-3">
                <p class="truncate text-sm font-medium text-gray-900">{{ photo.hunterName }}</p>
                <p class="truncate text-xs text-rose-600">{{ missionTitleById.get(photo.missionId) ?? `Mission #${photo.missionId}` }}</p>
                <p class="text-xs text-gray-500">{{ new Date(photo.createdAt).toLocaleString() }}</p>
                <div class="mt-2 flex justify-between gap-2">
                  <button
                    v-if="photo.approved"
                    class="rounded-full bg-rose-50 px-3 py-1 text-xs text-rose-700 hover:bg-rose-100"
                    @click="setApproved(photo, false)"
                  >Hide</button>
                  <button
                    v-else
                    class="rounded-full bg-green-50 px-3 py-1 text-xs text-green-700 hover:bg-green-100"
                    @click="setApproved(photo, true)"
                  >Restore</button>
                  <button
                    class="rounded-full border border-red-200 px-3 py-1 text-xs text-red-600 hover:bg-red-50"
                    @click="deletePhotoTarget = photo"
                  >Delete</button>
                </div>
              </div>
            </article>
          </div>
        </section>

        <!-- ─── Section 2: Missions ─── -->
        <section class="mt-12">
          <h2 class="text-2xl font-semibold text-gray-900">Missions</h2>
          <p class="mt-1 text-sm text-gray-500">Create, edit, reorder, hide, or delete.</p>

          <!-- Create / edit form -->
          <form
            class="mt-5 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm space-y-4"
            @submit.prevent="saveMission"
          >
            <p class="text-sm font-semibold text-gray-700">
              {{ editingMissionId !== null ? `Editing mission #${editingMissionId}` : 'Add a new mission' }}
            </p>
            <div class="grid gap-4 sm:grid-cols-2">
              <div>
                <label class="block text-xs text-gray-600">Title</label>
                <input
                  v-model="formTitle"
                  type="text"
                  required
                  maxlength="120"
                  class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-200"
                />
              </div>
              <div>
                <label class="block text-xs text-gray-600">Points</label>
                <input
                  v-model.number="formPoints"
                  type="number"
                  min="1"
                  max="999"
                  required
                  class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-200"
                />
              </div>
            </div>
            <div>
              <label class="block text-xs text-gray-600">Description (optional)</label>
              <textarea
                v-model="formDescription"
                rows="2"
                maxlength="300"
                class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-200"
              />
            </div>
            <label class="flex items-center gap-2 text-sm text-gray-700">
              <input v-model="formActive" type="checkbox" />
              Active (shown to guests)
            </label>
            <div class="flex justify-end gap-3">
              <button
                v-if="editingMissionId !== null"
                type="button"
                class="rounded-full border border-gray-300 px-4 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
                @click="cancelEdit"
              >Cancel</button>
              <button
                type="submit"
                :disabled="busy"
                class="rounded-full bg-rose-600 px-5 py-1.5 text-sm text-white hover:bg-rose-700 disabled:opacity-50"
              >{{ busy ? 'Saving…' : (editingMissionId !== null ? 'Save changes' : 'Add mission') }}</button>
            </div>
          </form>

          <!-- Mission list -->
          <div class="mt-5 space-y-2">
            <article
              v-for="(m, i) in sortedMissions"
              :key="m.id"
              class="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-3 shadow-sm"
              :class="!m.active ? 'opacity-60' : ''"
            >
              <div class="flex flex-col gap-0.5">
                <button
                  class="text-xs text-gray-400 hover:text-gray-700 disabled:opacity-30"
                  :disabled="i === 0"
                  @click="move(m, -1)"
                  aria-label="Move up"
                >▲</button>
                <button
                  class="text-xs text-gray-400 hover:text-gray-700 disabled:opacity-30"
                  :disabled="i === sortedMissions.length - 1"
                  @click="move(m, 1)"
                  aria-label="Move down"
                >▼</button>
              </div>
              <div class="flex-1 min-w-0">
                <p class="truncate font-medium text-gray-900">{{ m.title }}</p>
                <p v-if="m.description" class="truncate text-xs text-gray-500">{{ m.description }}</p>
                <p class="text-xs text-gray-400">#{{ m.position }} · {{ m.points }} pts · {{ m.active ? 'active' : 'hidden' }}</p>
              </div>
              <div class="flex flex-shrink-0 gap-2">
                <button class="rounded-full px-3 py-1 text-xs text-gray-600 hover:bg-gray-50" @click="toggleActive(m)">
                  {{ m.active ? 'Hide' : 'Show' }}
                </button>
                <button class="rounded-full bg-rose-50 px-3 py-1 text-xs text-rose-700 hover:bg-rose-100" @click="startEdit(m)">Edit</button>
                <button class="rounded-full border border-red-200 px-3 py-1 text-xs text-red-600 hover:bg-red-50" @click="deleteMissionTarget = m">Delete</button>
              </div>
            </article>
            <p v-if="sortedMissions.length === 0" class="text-center text-gray-500">No missions yet — add one above.</p>
          </div>
        </section>

        <!-- ─── Section 3: Demo reset ─── -->
        <section class="mt-12 rounded-2xl border border-red-200 bg-red-50/50 p-5">
          <h2 class="text-xl font-semibold text-red-900">Danger zone</h2>
          <p class="mt-1 text-sm text-red-800">Use during rehearsals; double-check before pressing during the event.</p>
          <div class="mt-4 flex flex-wrap gap-3">
            <button
              class="rounded-full bg-red-600 px-5 py-2 text-sm text-white hover:bg-red-700"
              @click="resetPhotosModal = true"
            >Reset photos only</button>
            <button
              class="rounded-full border border-red-600 px-5 py-2 text-sm text-red-700 hover:bg-red-100"
              @click="resetAllModal = true"
            >Reset everything (photos + missions)</button>
          </div>
        </section>
      </template>
    </section>
  </main>
</template>
