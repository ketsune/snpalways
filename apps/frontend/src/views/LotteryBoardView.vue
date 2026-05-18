<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { apiFetch } from '@/lib/api'
import drawSoundUrl from '@/assets/sound-effect/lottery-drawing-effect.mp3'

type DrawResult = {
  id: number
  prize_rank: number
  winning_number: string
  revealed_digits: number
  drawn_at: string
  winners: { name: string; number: string }[]
}

type Rank = 1 | 2 | 3
const PRIZE_CONFIG: Record<Rank, { label: string; sublabel: string; digits: number; accent: string }> = {
  1: { label: 'รางวัลที่ 1', sublabel: '6 หลัก', digits: 6, accent: '#f59e0b' },
  2: { label: 'รางวัลที่ 2', sublabel: '3 หลักแรก', digits: 3, accent: '#e2e8f0' },
  3: { label: 'รางวัลที่ 3', sublabel: '3 หลักท้าย', digits: 3, accent: '#b45309' },
}
const cfg = (rank: number) => PRIZE_CONFIG[rank as Rank]

const results = ref<DrawResult[]>([])
const totalEntries = ref<number | null>(null)
// Characters currently shown per rank (string of digits/?)
const displayNumbers = ref<Record<number, string>>({})
// How many digits are fully revealed (locked in) per rank
const revealedCount = ref<Record<number, number>>({ 1: 0, 2: 0, 3: 0 })
// Board state per rank
const states = ref<Record<number, 'pending' | 'spinning' | 'revealed'>>({
  1: 'pending', 2: 'pending', 3: 'pending',
})
// Last known revealed_digits from API per rank (to detect increases)
const apiRevealedDigits = ref<Record<number, number>>({ 1: 0, 2: 0, 3: 0 })
// Ranks we've seen at all from the API
const seenRanks = ref(new Set<number>())
// Queue of digit positions waiting to animate (per rank)
const animQueue = ref<Record<number, number[]>>({ 1: [], 2: [], 3: [] })
const animating = ref<Record<number, boolean>>({ 1: false, 2: false, 3: false })
const initialLoad = ref(true)

function playDrawSound() {
  try {
    const audio = new Audio(drawSoundUrl)
    audio.play().catch(() => {})
  } catch {
    // silent
  }
}

// Spin a single digit slot at `pos` then lock in `finalChar`
function spinSingleDigit(rank: number, pos: number, finalChar: string, onDone: () => void) {
  const digitCount = cfg(rank).digits
  const currentChars = (displayNumbers.value[rank] ?? '?'.repeat(digitCount)).split('')

  playDrawSound()

  // Fast ticks slowing to a stop — 20 ticks total
  const TOTAL_TICKS = 20
  let ticks = 0
  const tick = () => {
    currentChars[pos] = String(Math.floor(Math.random() * 10))
    displayNumbers.value[rank] = currentChars.join('')
    ticks++
    if (ticks < TOTAL_TICKS) {
      // Delay grows from 40ms → 180ms (ease-out feel)
      const delay = 40 + Math.floor((ticks / TOTAL_TICKS) * 140)
      setTimeout(tick, delay)
    } else {
      // Lock in final digit
      currentChars[pos] = finalChar
      displayNumbers.value[rank] = currentChars.join('')
      revealedCount.value[rank] = pos + 1
      setTimeout(onDone, 300)
    }
  }
  tick()
}

// Drain the queue for a rank, one digit at a time
function drainQueue(rank: number, winningNumber: string) {
  if (animating.value[rank]) return
  const queue = animQueue.value[rank] ?? []
  if (queue.length === 0) {
    animating.value[rank] = false
    // Check if fully revealed
    if ((revealedCount.value[rank] ?? 0) >= cfg(rank).digits) {
      states.value[rank] = 'revealed'
    }
    return
  }
  animating.value[rank] = true
  const pos = queue.shift()!
  spinSingleDigit(rank, pos, winningNumber.charAt(pos), () => {
    animating.value[rank] = false
    drainQueue(rank, winningNumber)
  })
}

async function pollResults() {
  try {
    const res = await apiFetch('/api/lottery/results')
    const data = await res.json().catch(() => ({}))
    if (!data.success) return

    const incoming = data.results as DrawResult[]
    if (typeof data.total_entries === 'number') totalEntries.value = data.total_entries

    for (const r of incoming) {
      const rank = r.prize_rank
      const digitCount = cfg(rank).digits

      if (!seenRanks.value.has(rank)) {
        // New rank appeared: initialize display
        seenRanks.value.add(rank)
        const initStr = '?'.repeat(digitCount)
        displayNumbers.value[rank] = initStr
        revealedCount.value[rank] = 0
        apiRevealedDigits.value[rank] = 0
        animQueue.value[rank] = []
        animating.value[rank] = false

        if (initialLoad.value) {
          // On first load, show immediately up to already-revealed digits
          const alreadyRevealed = r.revealed_digits
          if (alreadyRevealed > 0) {
            const chars = '?'.repeat(digitCount).split('')
            for (let i = 0; i < alreadyRevealed; i++) {
              chars[i] = r.winning_number.charAt(i)
            }
            displayNumbers.value[rank] = chars.join('')
            revealedCount.value[rank] = alreadyRevealed
            apiRevealedDigits.value[rank] = alreadyRevealed
          }
          if (alreadyRevealed >= digitCount) {
            states.value[rank] = 'revealed'
          } else {
            states.value[rank] = 'spinning'
          }
        } else {
          states.value[rank] = 'spinning'
        }
      }

      // Detect new digits revealed since last poll
      const prevRevealed = apiRevealedDigits.value[rank] ?? 0
      const nowRevealed = r.revealed_digits
      if (nowRevealed > prevRevealed) {
        apiRevealedDigits.value[rank] = nowRevealed
        // Queue positions prevRevealed..nowRevealed-1
        for (let pos = prevRevealed; pos < nowRevealed && pos < digitCount; pos++) {
          ;(animQueue.value[rank] ??= []).push(pos)
        }
        drainQueue(rank, r.winning_number)
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
    <h1 class="font-cookie text-5xl sm:text-7xl text-rose-400 mb-2 tracking-wide">สลากกินไม่แบ่ง กินอยู่คนเดียว</h1>
    <p class="text-gray-500 text-xs tracking-widest uppercase">งานแต่งงานส้ม &amp; ปัณณ์</p>

    <!-- Participant count -->
    <div class="mt-4 mb-8 flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-2">
      <span class="text-gray-400 text-sm tracking-wide">ผู้เข้าร่วม</span>
      <span class="font-mono text-2xl font-bold text-rose-400">
        {{ totalEntries !== null ? totalEntries : '—' }}
      </span>
      <span class="text-gray-500 text-sm">คน</span>
    </div>

    <div class="w-full max-w-2xl space-y-6">
      <div
        v-for="rank in ([1, 2, 3] as Rank[])"
        :key="rank"
        class="rounded-3xl border border-white/10 bg-white/5 backdrop-blur px-8 py-7 text-center"
        :class="states[rank] === 'revealed' ? 'ring-1 ring-white/20' : ''"
      >
        <!-- Prize label -->
        <p class="text-xs font-bold uppercase tracking-[0.25em] mb-1" :style="{ color: cfg(rank).accent }">
          {{ cfg(rank).label }}
        </p>
        <p class="text-[10px] text-white/30 mb-4 tracking-widest uppercase">{{ cfg(rank).sublabel }}</p>

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
              class="flex h-14 w-10 sm:h-20 sm:w-16 items-center justify-center rounded-xl font-mono text-2xl sm:text-4xl font-bold transition-all duration-200"
              :class="i < (revealedCount[rank] ?? 0)
                ? 'text-white'
                : i === (revealedCount[rank] ?? 0)
                  ? 'bg-white/20 text-white/80'
                  : 'bg-white/10 text-white/30'"
              :style="i < (revealedCount[rank] ?? 0)
                ? { background: `${cfg(rank).accent}22`, color: cfg(rank).accent, boxShadow: `0 0 20px ${cfg(rank).accent}44` }
                : {}"
            >{{ digit }}</div>
          </template>
        </div>

        <!-- Winners -->
        <template v-if="states[rank] === 'revealed'">
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
          <p v-else class="text-gray-600 text-sm">ไม่มีผู้ถูกรางวัล</p>
        </template>

        <div v-else class="text-gray-600 text-sm">รอการเปิดเผยหมายเลข…</div>
      </div>
    </div>
  </main>
</template>
