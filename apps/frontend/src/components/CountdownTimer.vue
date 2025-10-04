<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watchEffect } from 'vue'

const props = defineProps<{
  // Target date-time ISO string or Date
  target: string | Date
  // Optional title
  title?: string
}>()

const now = ref<Date>(new Date())
let timer: number | undefined

onMounted(() => {
  timer = window.setInterval(() => {
    now.value = new Date()
  }, 1000)
})

onUnmounted(() => {
  if (timer) window.clearInterval(timer)
})

const targetDate = computed(() => (props.target instanceof Date ? props.target : new Date(props.target)))

const diffMs = computed(() => Math.max(0, targetDate.value.getTime() - now.value.getTime()))

const finished = computed(() => diffMs.value <= 0)

const days = computed(() => Math.floor(diffMs.value / (1000 * 60 * 60 * 24)))
const hours = computed(() => Math.floor((diffMs.value % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)))
const minutes = computed(() => Math.floor((diffMs.value % (1000 * 60 * 60)) / (1000 * 60)))
const seconds = computed(() => Math.floor((diffMs.value % (1000 * 60)) / 1000))

// Accessibility: live region text
const liveText = ref('')
watchEffect(() => {
  if (finished.value) {
    liveText.value = 'Countdown finished'
  } else {
    liveText.value = `${days.value} days ${hours.value} hours ${minutes.value} minutes ${seconds.value} seconds remaining`
  }
})
</script>

<template>
  <section
    class="relative mx-auto w-full max-w-3xl"
    aria-live="polite"
    :aria-label="title ?? 'Countdown timer'"
  >
    <!-- Glass card container -->
    <div
      class="rounded-3xl border border-white/30 bg-white/10 p-6 sm:p-8 shadow-xl ring-1 ring-black/5 backdrop-blur-xl
             dark:border-white/20 dark:bg-white/5 dark:ring-white/10"
      style="background-image: radial-gradient(1200px 200px at 0% 0%, rgba(255,255,255,0.35), rgba(255,255,255,0)),
                             radial-gradient(1200px 200px at 100% 100%, rgba(255,255,255,0.2), rgba(255,255,255,0));"
    >
      <div class="pointer-events-none absolute inset-0 rounded-3xl" aria-hidden="true"></div>

      <div class="text-center">
        <p v-if="title" class="text-sm uppercase tracking-[0.25em] text-rose-600">{{ title }}</p>
        <h2 class="mt-1 text-2xl font-semibold text-gray-900 sm:text-3xl">Time until the big day</h2>
        <p class="sr-only">{{ liveText }}</p>
      </div>

      <div class="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div class="glass-seg">
          <div class="time">{{ days }}</div>
          <div class="label">Days</div>
        </div>
        <div class="glass-seg">
          <div class="time">{{ hours.toString().padStart(2, '0') }}</div>
          <div class="label">Hours</div>
        </div>
        <div class="glass-seg">
          <div class="time">{{ minutes.toString().padStart(2, '0') }}</div>
          <div class="label">Minutes</div>
        </div>
        <div class="glass-seg">
          <div class="time">{{ seconds.toString().padStart(2, '0') }}</div>
          <div class="label">Seconds</div>
        </div>
      </div>

      <div v-if="finished" class="mt-6 rounded-xl bg-emerald-50/80 p-3 text-center text-emerald-800 ring-1 ring-emerald-200">
        It's time! 🎉
      </div>
    </div>
  </section>
</template>

<style scoped>
@reference "tailwindcss";
.glass-seg {
  @apply rounded-2xl border border-white/30 bg-white/20 p-4 text-center shadow-sm ring-1 ring-black/5 backdrop-blur-xl
    dark:border-white/10 dark:bg-white/10 dark:ring-white/10;
}
.time {
  @apply text-3xl font-semibold text-gray-900 sm:text-4xl;
  font-variant-numeric: tabular-nums;
}
.label {
  @apply mt-1 text-xs uppercase tracking-wide text-gray-600;
}
</style>
