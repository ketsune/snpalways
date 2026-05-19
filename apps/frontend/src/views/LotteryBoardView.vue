<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { apiFetch } from '@/lib/api'
import drawSoundUrl from '@/assets/sound-effect/lottery-drawing-effect.mp3'

type DrawResult = {
  id: number
  prize_rank: number
  winning_number: string
  revealed_digits: number
  drawn_at: string
  winners: { name: string; number: string; table_no: string | null }[]
}

type Bubble = {
  id: number
  name: string
  number: string
  table_no: string | null
  x: number  // vw %
  y: number  // vh %
  visible: boolean
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

// Bubble system
const bubbles = ref<Bubble[]>([])
const seenNumbers = ref(new Set<string>())
const initialLoad = ref(true)
let bubbleIdSeq = 0

function spawnBubble(name: string, number: string, table_no: string | null) {
  const id = ++bubbleIdSeq
  // Keep away from center column (prize cards): left 5–30% or right 65–90%
  const side = Math.random() < 0.5
  const x = side ? 5 + Math.random() * 25 : 65 + Math.random() * 25
  const y = 10 + Math.random() * 75

  bubbles.value.push({ id, name, number, table_no, x, y, visible: false })

  // Tick to let Vue render the element, then fade in
  nextTick(() => {
    const b = bubbles.value.find(b => b.id === id)
    if (b) b.visible = true
  })

  // Fade out after 3.5s, remove after transition (0.6s)
  setTimeout(() => {
    const b = bubbles.value.find(b => b.id === id)
    if (b) b.visible = false
  }, 3500)

  setTimeout(() => {
    bubbles.value = bubbles.value.filter(b => b.id !== id)
  }, 4200)
}

// Digit reveal state
const displayNumbers = ref<Record<number, string>>({})
const revealedCount = ref<Record<number, number>>({ 1: 0, 2: 0, 3: 0 })
const states = ref<Record<number, 'pending' | 'spinning' | 'revealed'>>({
  1: 'pending', 2: 'pending', 3: 'pending',
})
const apiRevealedDigits = ref<Record<number, number>>({ 1: 0, 2: 0, 3: 0 })
const seenRanks = ref(new Set<number>())
const animQueue = ref<Record<number, number[]>>({ 1: [], 2: [], 3: [] })
const animating = ref<Record<number, boolean>>({ 1: false, 2: false, 3: false })

function playDrawSound() {
  try {
    const audio = new Audio(drawSoundUrl)
    audio.play().catch(() => {})
  } catch { /* silent */ }
}

function spinSingleDigit(rank: number, pos: number, finalChar: string, onDone: () => void) {
  const digitCount = cfg(rank).digits
  const currentChars = (displayNumbers.value[rank] ?? '?'.repeat(digitCount)).split('')
  playDrawSound()
  // 30 ticks: delay ramps 20ms → 320ms = ~5s total, ease-out feel
  const TOTAL_TICKS = 30
  let ticks = 0
  const tick = () => {
    currentChars[pos] = String(Math.floor(Math.random() * 10))
    displayNumbers.value[rank] = currentChars.join('')
    ticks++
    if (ticks < TOTAL_TICKS) {
      const delay = 20 + Math.floor((ticks / TOTAL_TICKS) * 300)
      setTimeout(tick, delay)
    } else {
      currentChars[pos] = finalChar
      displayNumbers.value[rank] = currentChars.join('')
      revealedCount.value[rank] = pos + 1
      setTimeout(onDone, 400)
    }
  }
  tick()
}

function drainQueue(rank: number, winningNumber: string) {
  if (animating.value[rank]) return
  const queue = animQueue.value[rank] ?? []
  if (queue.length === 0) {
    animating.value[rank] = false
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

    // Bubble: detect new entries (skip on very first load to avoid flood)
    const recentEntries = (data.recent_entries ?? []) as { name: string; number: string; table_no: string | null }[]
    if (!initialLoad.value) {
      for (const e of recentEntries) {
        if (!seenNumbers.value.has(e.number)) {
          seenNumbers.value.add(e.number)
          spawnBubble(e.name, e.number, e.table_no ?? null)
        }
      }
    } else {
      // On first load just seed seenNumbers — no bubbles
      for (const e of recentEntries) seenNumbers.value.add(e.number)
    }

    // Prize reveal logic
    for (const r of incoming) {
      const rank = r.prize_rank
      const digitCount = cfg(rank).digits

      if (!seenRanks.value.has(rank)) {
        seenRanks.value.add(rank)
        displayNumbers.value[rank] = '?'.repeat(digitCount)
        revealedCount.value[rank] = 0
        apiRevealedDigits.value[rank] = 0
        animQueue.value[rank] = []
        animating.value[rank] = false

        if (initialLoad.value) {
          const alreadyRevealed = r.revealed_digits
          if (alreadyRevealed > 0) {
            const chars = '?'.repeat(digitCount).split('')
            for (let i = 0; i < alreadyRevealed; i++) chars[i] = r.winning_number.charAt(i)
            displayNumbers.value[rank] = chars.join('')
            revealedCount.value[rank] = alreadyRevealed
            apiRevealedDigits.value[rank] = alreadyRevealed
          }
          states.value[rank] = alreadyRevealed >= digitCount ? 'revealed' : 'spinning'
        } else {
          states.value[rank] = 'spinning'
        }
      }

      const prevRevealed = apiRevealedDigits.value[rank] ?? 0
      const nowRevealed = r.revealed_digits
      if (nowRevealed > prevRevealed) {
        apiRevealedDigits.value[rank] = nowRevealed
        for (let pos = prevRevealed; pos < nowRevealed && pos < digitCount; pos++) {
          ;(animQueue.value[rank] ??= []).push(pos)
        }
        drainQueue(rank, r.winning_number)
      }
    }

    results.value = incoming
    initialLoad.value = false
  } catch { /* silent — projector must not crash */ }
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
  <main class="relative min-h-screen bg-[#0b0c1a] text-white flex flex-col items-center justify-center px-4 py-12 overflow-hidden">

    <!-- Floating entry bubbles -->
    <Teleport to="body">
      <div
        v-for="bubble in bubbles"
        :key="bubble.id"
        class="bubble-pill"
        :style="{
          left: `${bubble.x}vw`,
          top: `${bubble.y}vh`,
          opacity: bubble.visible ? 1 : 0,
          transform: bubble.visible ? 'translateY(0) scale(1)' : 'translateY(12px) scale(0.92)',
        }"
      >
        <span class="bubble-name">{{ bubble.name }}</span>
        <span v-if="bubble.table_no" class="bubble-table">โต๊ะ {{ bubble.table_no }}</span>
        <span class="bubble-number">{{ bubble.number }}</span>
      </div>
    </Teleport>

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
        <p class="text-xs font-bold uppercase tracking-[0.25em] mb-1" :style="{ color: cfg(rank).accent }">
          {{ cfg(rank).label }}
        </p>
        <p class="text-[10px] text-white/30 mb-4 tracking-widest uppercase">{{ cfg(rank).sublabel }}</p>

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

        <template v-if="states[rank] === 'revealed'">
          <div v-if="getResult(rank)?.winners.length" class="space-y-1">
            <p
              v-for="w in getResult(rank)!.winners"
              :key="w.number"
              class="text-lg sm:text-2xl font-semibold text-white"
            >
              🎉 {{ w.name }}
              <span v-if="w.table_no" class="ml-1 text-base font-normal text-rose-300">โต๊ะ {{ w.table_no }}</span>
              <span class="font-mono text-sm font-normal opacity-40 ml-1">{{ w.number }}</span>
            </p>
          </div>
          <p v-else class="text-gray-600 text-sm">ไม่มีผู้ถูกรางวัล</p>
        </template>

        <div v-else class="text-gray-600 text-sm">รอการเปิดเผยหมายเลข…</div>
      </div>
    </div>
  </main>
</template>

<style scoped>
.bubble-pill {
  position: fixed;
  z-index: 9999;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.4rem 0.9rem;
  border-radius: 9999px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(8px);
  pointer-events: none;
  transition: opacity 0.5s ease, transform 0.5s ease;
  white-space: nowrap;
}

.bubble-name {
  font-size: 0.95rem;
  font-weight: 600;
  color: #fff;
}

.bubble-table {
  font-size: 0.8rem;
  color: #fda4af;
  opacity: 0.9;
}

.bubble-number {
  font-family: ui-monospace, monospace;
  font-size: 0.8rem;
  color: #fb7185;
  opacity: 0.7;
}
</style>
