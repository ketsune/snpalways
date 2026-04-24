<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { apiFetch } from '@/lib/api'

type ClosestEntry = { name: string; number: string; string_distance: number; number_difference: number }
type DrawResult = {
  prize_rank: number
  winning_number: string
  drawn_at: string
  winners: { name: string; number: string }[]
  closest_by_string: ClosestEntry | null
  closest_by_number: ClosestEntry | null
}

type Rank = 1 | 2 | 3
const PRIZE_CONFIG: Record<Rank, { label: string; digits: number; accent: string }> = {
  1: { label: '1st Prize', digits: 6, accent: '#f59e0b' },
  2: { label: '2nd Prize', digits: 3, accent: '#e2e8f0' },
  3: { label: '3rd Prize', digits: 2, accent: '#b45309' },
}
const cfg = (rank: number) => PRIZE_CONFIG[rank as Rank]

const results = ref<DrawResult[]>([])
const displayNumbers = ref<Record<number, string>>({})
const states = ref<Record<number, 'pending' | 'spinning' | 'revealed'>>({
  1: 'pending', 2: 'pending', 3: 'pending',
})
const seenRanks = ref(new Set<number>())
const initialLoad = ref(true)

function spinDigits(rank: number, digitCount: number, finalNumber: string) {
  states.value[rank] = 'spinning'
  let elapsed = 0
  const step = () => {
    displayNumbers.value[rank] = Array.from({ length: digitCount }, () =>
      Math.floor(Math.random() * 10),
    ).join('')
    elapsed += 80
    if (elapsed < 2400) setTimeout(step, 80)
    else {
      displayNumbers.value[rank] = finalNumber
      states.value[rank] = 'revealed'
    }
  }
  step()
}

async function pollResults() {
  try {
    const res = await apiFetch('/api/lottery/results')
    const data = await res.json().catch(() => ({}))
    if (!data.success) return

    const incoming = data.results as DrawResult[]
    for (const r of incoming) {
      if (!seenRanks.value.has(r.prize_rank)) {
        seenRanks.value.add(r.prize_rank)
        if (initialLoad.value) {
          displayNumbers.value[r.prize_rank] = r.winning_number
          states.value[r.prize_rank] = 'revealed'
        } else {
          spinDigits(r.prize_rank, cfg(r.prize_rank).digits, r.winning_number)
        }
      }
    }
    results.value = incoming
    initialLoad.value = false
  } catch {
    // silent — projector must not crash
  }
}

let interval: ReturnType<typeof setInterval>

onMounted(() => {
  pollResults()
  interval = setInterval(pollResults, 3000)
})

onUnmounted(() => clearInterval(interval))

function getResult(rank: number): DrawResult | undefined {
  return results.value.find((r) => r.prize_rank === rank)
}
</script>

<template>
  <main class="min-h-screen bg-[#0b0c1a] text-white flex flex-col items-center justify-center px-4 py-12">
    <h1 class="font-cookie text-5xl sm:text-7xl text-rose-400 mb-2 tracking-wide">Lucky Draw</h1>
    <p class="text-gray-500 text-xs mb-10 tracking-widest uppercase">Som &amp; Pann Wedding</p>

    <div class="w-full max-w-2xl space-y-6">
      <div
        v-for="rank in ([1, 2, 3] as Rank[])"
        :key="rank"
        class="rounded-3xl border border-white/10 bg-white/5 backdrop-blur px-8 py-7 text-center"
        :class="states[rank] === 'revealed' ? 'ring-1 ring-white/20' : ''"
      >
        <!-- Prize label -->
        <p class="text-xs font-bold uppercase tracking-[0.25em] mb-4" :style="{ color: cfg(rank).accent }">
          {{ cfg(rank).label }}
        </p>

        <!-- Digit display -->
        <div class="flex items-center justify-center gap-2 sm:gap-3 mb-5">
          <template v-if="states[rank] === 'pending'">
            <div
              v-for="i in cfg(rank).digits"
              :key="i"
              class="flex h-14 w-10 sm:h-20 sm:w-16 items-center justify-center rounded-xl bg-white/10 font-mono text-2xl sm:text-4xl font-bold text-white/20"
            >?</div>
          </template>
          <template v-else>
            <div
              v-for="(digit, i) in (displayNumbers[rank] ?? '').split('')"
              :key="i"
              class="flex h-14 w-10 sm:h-20 sm:w-16 items-center justify-center rounded-xl font-mono text-2xl sm:text-4xl font-bold transition-all duration-100"
              :class="states[rank] === 'spinning' ? 'bg-white/20 text-white/80' : 'text-white'"
              :style="states[rank] === 'revealed'
                ? { background: `${cfg(rank).accent}22`, color: cfg(rank).accent, boxShadow: `0 0 20px ${cfg(rank).accent}44` }
                : {}"
            >{{ digit }}</div>
          </template>
        </div>

        <!-- Winners / closest -->
        <template v-if="states[rank] === 'revealed'">
          <!-- Winners (multiple possible for 2nd/3rd) -->
          <div v-if="getResult(rank)?.winners.length" class="space-y-1">
            <p
              v-for="w in getResult(rank)!.winners"
              :key="w.number"
              class="text-lg sm:text-2xl font-semibold text-white"
            >
              🎉 {{ w.name }}
              <span class="font-mono text-sm font-normal opacity-50">{{ w.number }}</span>
            </p>
          </div>

          <!-- No winner — closest match -->
          <template v-else-if="getResult(rank)?.closest_by_string || getResult(rank)?.closest_by_number">
            <p class="text-gray-500 text-xs uppercase tracking-widest mb-3">No winner — closest match</p>

            <div
              v-if="getResult(rank)?.closest_by_string"
              class="rounded-xl border border-white/10 bg-white/5 px-5 py-3 mb-2 text-left"
            >
              <div class="flex items-baseline justify-between gap-4">
                <span class="font-semibold text-white">{{ getResult(rank)!.closest_by_string!.name }}</span>
                <span class="font-mono text-gray-400 text-sm">{{ getResult(rank)!.closest_by_string!.number }}</span>
              </div>
              <div class="mt-1 flex gap-4 text-xs text-gray-500">
                <span>String dist: <span class="text-amber-400 font-semibold">{{ getResult(rank)!.closest_by_string!.string_distance }}</span></span>
                <span>Number diff: <span class="text-amber-400 font-semibold">{{ getResult(rank)!.closest_by_string!.number_difference }}</span></span>
              </div>
            </div>

            <div
              v-if="getResult(rank)?.closest_by_number"
              class="rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-left"
            >
              <p class="text-xs text-gray-600 mb-1 uppercase tracking-wider">Closest by number</p>
              <div class="flex items-baseline justify-between gap-4">
                <span class="font-semibold text-white">{{ getResult(rank)!.closest_by_number!.name }}</span>
                <span class="font-mono text-gray-400 text-sm">{{ getResult(rank)!.closest_by_number!.number }}</span>
              </div>
              <div class="mt-1 flex gap-4 text-xs text-gray-500">
                <span>String dist: <span class="text-sky-400 font-semibold">{{ getResult(rank)!.closest_by_number!.string_distance }}</span></span>
                <span>Number diff: <span class="text-sky-400 font-semibold">{{ getResult(rank)!.closest_by_number!.number_difference }}</span></span>
              </div>
            </div>
          </template>

          <p v-else class="text-gray-600 text-sm">No winner</p>
        </template>

        <div v-else class="text-gray-600 text-sm">Awaiting draw…</div>
      </div>
    </div>
  </main>
</template>
