<script setup lang="ts">
import { ref, computed } from 'vue'
import { apiFetch } from '@/lib/api'

type Entry = { id: number; name: string; number: string; created_at: string }
type ClosestEntry = { name: string; number: string; string_distance: number; number_difference: number }
type DrawResult = {
  prize_rank: number
  winning_number: string
  winner_name: string | null
  drawn_at: string
  closest_by_string?: ClosestEntry | null
  closest_by_number?: ClosestEntry | null
}

const PRIZE_CONFIG: Record<number, { label: string; digits: number }> = {
  1: { label: '1st Prize', digits: 6 },
  2: { label: '2nd Prize', digits: 3 },
  3: { label: '3rd Prize', digits: 2 },
}

const token = ref('')
const authed = ref(false)
const loading = ref(false)
const error = ref<string | null>(null)
const entries = ref<Entry[]>([])
const results = ref<DrawResult[]>([])
const drawing = ref<number | null>(null)
const drawError = ref<string | null>(null)

// Modals
const resetDrawsConfirm = ref(false)
const fullResetModal = ref(false)
const fullResetBusy = ref(false)

async function load() {
  loading.value = true
  error.value = null
  try {
    const [entryRes, resultRes] = await Promise.all([
      apiFetch('/api/lottery/entries', { headers: { 'x-mod-token': token.value } }),
      apiFetch('/api/lottery/results'),
    ])
    if (entryRes.status === 401) { error.value = 'Invalid moderator token.'; return }
    const entryData = await entryRes.json().catch(() => ({}))
    const resultData = await resultRes.json().catch(() => ({}))
    if (!entryData.success) throw new Error(entryData.message || 'Failed to load entries')
    entries.value = entryData.entries
    results.value = resultData.results ?? []
    authed.value = true
  } catch (err: unknown) {
    error.value = err instanceof Error ? err.message : 'Failed to load'
  } finally {
    loading.value = false
  }
}

async function draw(prizeRank: number) {
  drawError.value = null
  drawing.value = prizeRank
  try {
    const res = await apiFetch('/api/lottery/draw', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-mod-token': token.value },
      body: JSON.stringify({ prizeRank }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok || !data?.success) throw new Error(data?.message || 'Draw failed')
    // Refresh to get closest winner data
    await load()
  } catch (err: unknown) {
    drawError.value = err instanceof Error ? err.message : 'Draw failed'
  } finally {
    drawing.value = null
  }
}

async function resetDraws() {
  try {
    const res = await apiFetch('/api/lottery/draws', {
      method: 'DELETE',
      headers: { 'x-mod-token': token.value },
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok || !data?.success) throw new Error(data?.message || 'Reset failed')
    results.value = []
    resetDrawsConfirm.value = false
  } catch (err: unknown) {
    drawError.value = err instanceof Error ? err.message : 'Reset failed'
  }
}

async function fullReset() {
  fullResetBusy.value = true
  drawError.value = null
  try {
    const res = await apiFetch('/api/lottery', {
      method: 'DELETE',
      headers: { 'x-mod-token': token.value },
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok || !data?.success) throw new Error(data?.message || 'Reset failed')
    entries.value = []
    results.value = []
    fullResetModal.value = false
  } catch (err: unknown) {
    drawError.value = err instanceof Error ? err.message : 'Reset failed'
    fullResetModal.value = false
  } finally {
    fullResetBusy.value = false
  }
}

const drawnRanks = computed(() => new Set(results.value.map((r) => r.prize_rank)))

function getResult(rank: number) {
  return results.value.find((r) => r.prize_rank === rank)
}

function entriesForRank(rank: number) {
  return entries.value.filter((e) => e.number.length === PRIZE_CONFIG[rank].digits)
}
</script>

<template>
  <main class="min-h-screen bg-off-white px-4 py-10 text-gray-800">

    <!-- Full Reset Warning Modal -->
    <Teleport to="body">
      <div
        v-if="fullResetModal"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
        @click.self="fullResetModal = false"
      >
        <div class="mx-4 w-full max-w-md rounded-2xl bg-white p-7 shadow-xl">
          <h2 class="text-xl font-bold text-gray-900">Reset everything?</h2>
          <p class="mt-3 text-gray-600 text-sm leading-relaxed">
            This will permanently delete <strong>all registered numbers</strong> and <strong>all drawn prizes</strong>.
            Use this only for demo purposes. This cannot be undone.
          </p>
          <div class="mt-6 flex justify-end gap-3">
            <button
              class="rounded-full border border-gray-300 px-5 py-2 text-sm text-gray-700 hover:bg-gray-50"
              :disabled="fullResetBusy"
              @click="fullResetModal = false"
            >
              Cancel
            </button>
            <button
              class="rounded-full bg-red-600 px-5 py-2 text-sm text-white hover:bg-red-700 disabled:opacity-50"
              :disabled="fullResetBusy"
              @click="fullReset"
            >
              {{ fullResetBusy ? 'Resetting…' : 'Yes, delete everything' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <section class="mx-auto max-w-4xl">
      <h1 class="font-cookie text-5xl text-rose-600">Lottery Control Panel</h1>
      <p class="mt-2 text-gray-500 text-sm">Draw prizes and see results. Use <code>/lottery/board</code> on the projector.</p>

      <!-- Auth form -->
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

      <!-- Panel -->
      <div v-if="authed" class="mt-8 space-y-10">

        <!-- Draw controls -->
        <div>
          <div class="flex flex-wrap items-center justify-between gap-2 mb-4">
            <h2 class="text-lg font-semibold text-gray-800">Prize Draw</h2>
            <div class="flex flex-wrap gap-2 items-center">
              <button class="text-sm text-gray-500 hover:text-gray-700 hover:underline" @click="load">Refresh</button>

              <!-- Reset draws only -->
              <template v-if="!resetDrawsConfirm">
                <button class="text-sm text-rose-500 hover:text-rose-700 hover:underline" @click="resetDrawsConfirm = true">
                  Reset draws
                </button>
              </template>
              <template v-else>
                <button class="text-sm text-rose-700 font-semibold hover:underline" @click="resetDraws">Confirm</button>
                <button class="text-sm text-gray-500 hover:underline" @click="resetDrawsConfirm = false">Cancel</button>
              </template>

              <!-- Full reset (demo) -->
              <button
                class="rounded-full border border-red-300 px-4 py-1 text-sm text-red-600 hover:bg-red-50"
                @click="fullResetModal = true"
              >
                Reset all (demo)
              </button>
            </div>
          </div>

          <p v-if="drawError" class="mb-3 rounded-lg bg-rose-50 px-4 py-2 text-rose-700 text-sm">{{ drawError }}</p>

          <div class="grid gap-4 sm:grid-cols-3">
            <div
              v-for="rank in [3, 2, 1]"
              :key="rank"
              class="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm text-center"
            >
              <p class="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">{{ PRIZE_CONFIG[rank].label }}</p>

              <template v-if="getResult(rank)">
                <p class="font-mono text-3xl font-bold tracking-widest text-gray-900">
                  {{ getResult(rank)!.winning_number }}
                </p>
                <p v-if="getResult(rank)!.winner_name" class="mt-2 text-green-700 font-semibold text-sm">
                  🎉 {{ getResult(rank)!.winner_name }}
                </p>
                <template v-else>
                  <p class="mt-2 text-gray-400 text-xs mb-1">No exact winner</p>
                  <div v-if="getResult(rank)!.closest_by_string" class="text-left text-xs mt-2 rounded-lg bg-amber-50 px-3 py-2">
                    <p class="font-semibold text-gray-700">{{ getResult(rank)!.closest_by_string!.name }}
                      <span class="font-mono font-normal text-gray-400 ml-1">{{ getResult(rank)!.closest_by_string!.number }}</span>
                    </p>
                    <p class="text-gray-500 mt-0.5">
                      Str: {{ getResult(rank)!.closest_by_string!.string_distance }} ·
                      Diff: {{ getResult(rank)!.closest_by_string!.number_difference }}
                    </p>
                  </div>
                  <div v-if="getResult(rank)!.closest_by_number" class="text-left text-xs mt-1 rounded-lg bg-sky-50 px-3 py-2">
                    <p class="text-gray-500 mb-0.5">Closest by number</p>
                    <p class="font-semibold text-gray-700">{{ getResult(rank)!.closest_by_number!.name }}
                      <span class="font-mono font-normal text-gray-400 ml-1">{{ getResult(rank)!.closest_by_number!.number }}</span>
                    </p>
                    <p class="text-gray-500 mt-0.5">
                      Str: {{ getResult(rank)!.closest_by_number!.string_distance }} ·
                      Diff: {{ getResult(rank)!.closest_by_number!.number_difference }}
                    </p>
                  </div>
                </template>
              </template>
              <template v-else>
                <p class="font-mono text-3xl font-bold tracking-widest text-gray-200 mb-3">
                  {{ '?'.repeat(PRIZE_CONFIG[rank].digits) }}
                </p>
                <button
                  :disabled="drawing !== null || drawnRanks.has(rank)"
                  class="rounded-full bg-rose-600 px-4 py-2 text-sm text-white hover:bg-rose-700 disabled:opacity-50"
                  @click="draw(rank)"
                >
                  {{ drawing === rank ? 'Drawing…' : `Draw ${PRIZE_CONFIG[rank].label}` }}
                </button>
              </template>
            </div>
          </div>
        </div>

        <!-- Entries by tier -->
        <div v-for="rank in [1, 2, 3]" :key="`entries-${rank}`">
          <h2 class="text-base font-semibold text-gray-700 mb-3">
            {{ PRIZE_CONFIG[rank].label }} entries
            <span class="ml-2 text-xs font-normal text-gray-400">
              ({{ PRIZE_CONFIG[rank].digits }} digits · {{ entriesForRank(rank).length }} registered)
            </span>
          </h2>
          <div class="flex flex-wrap gap-2">
            <div
              v-for="entry in entriesForRank(rank)"
              :key="entry.id"
              class="rounded-xl border px-3 py-2 text-sm"
              :class="getResult(rank)?.winning_number === entry.number
                ? 'border-green-400 bg-green-50 text-green-800 font-semibold'
                : 'border-gray-200 bg-white text-gray-700'"
            >
              <span class="font-mono font-bold">{{ entry.number }}</span>
              <span class="ml-2 text-gray-500">{{ entry.name }}</span>
            </div>
            <p v-if="entriesForRank(rank).length === 0" class="text-gray-400 text-sm">No entries yet.</p>
          </div>
        </div>

      </div>
    </section>
  </main>
</template>
