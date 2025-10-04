<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue'

type ImageItem = { src: string; alt?: string }

const props = defineProps<{
  images: ImageItem[]
  autoPlayMs?: number // set to enable autoplay, e.g., 5000
}>()

const current = ref(0)
const isHovering = ref(false)
let timer: number | undefined

const count = () => props.images?.length ?? 0

function goTo(index: number) {
  if (!count()) return
  current.value = (index + count()) % count()
}
function next() {
  goTo(current.value + 1)
}
function prev() {
  goTo(current.value - 1)
}

function startAuto() {
  stopAuto()
  const interval = props.autoPlayMs && props.autoPlayMs >= 2000 ? props.autoPlayMs : undefined
  if (!interval) return
  timer = window.setInterval(() => {
    if (!isHovering.value) next()
  }, interval)
}
function stopAuto() {
  if (timer) {
    window.clearInterval(timer)
    timer = undefined
  }
}

watch(
  () => props.autoPlayMs,
  () => startAuto(),
  { immediate: true }
)

onMounted(() => {
  startAuto()
})

onUnmounted(() => {
  stopAuto()
})

// touch/swipe support
let startX = 0
let startY = 0
function onTouchStart(e: TouchEvent) {
  const t = e.touches?.[0]
  if (!t) return
  startX = t.clientX
  startY = t.clientY
}
function onTouchEnd(e: TouchEvent) {
  const t = e.changedTouches?.[0]
  if (!t) return
  const dx = t.clientX - startX
  const dy = t.clientY - startY
  if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 40) {
    if (dx < 0) next()
    else prev()
  }
}
</script>

<template>
  <div
    class="group relative overflow-hidden rounded-2xl ring-1 ring-gray-200 bg-white/50"
    role="region"
    aria-roledescription="carousel"
    aria-label="Garden venue photos"
    @mouseenter="isHovering = true"
    @mouseleave="isHovering = false"
    tabindex="0"
    @keydown.left.prevent="prev()"
    @keydown.right.prevent="next()"
    @touchstart.passive="onTouchStart"
    @touchend.passive="onTouchEnd"
  >
    <!-- Slides -->
    <div class="relative h-64 sm:h-full w-full">
      <template v-for="(img, i) in images" :key="img.src + i">
        <img
          v-show="i === current"
          class="absolute inset-0 h-full w-full object-cover transition-opacity duration-500"
          :class="i === current ? 'opacity-100' : 'opacity-0'"
          :src="img.src"
          :alt="img.alt ?? `Garden venue photo ${i + 1}`"
          referrerpolicy="no-referrer"
        />
      </template>
    </div>

    <!-- Controls -->
    <button
      type="button"
      class="absolute left-2 top-1/2 -translate-y-1/2 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/80 text-gray-800 shadow ring-1 ring-black/10 hover:bg-white"
      @click="prev"
      aria-label="Previous slide"
    >
      <span aria-hidden="true">‹</span>
    </button>
    <button
      type="button"
      class="absolute right-2 top-1/2 -translate-y-1/2 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/80 text-gray-800 shadow ring-1 ring-black/10 hover:bg-white"
      @click="next"
      aria-label="Next slide"
    >
      <span aria-hidden="true">›</span>
    </button>

    <!-- Indicators -->
    <div class="pointer-events-none absolute inset-x-0 bottom-3 flex justify-center gap-2">
      <button
        v-for="(_, i) in images"
        :key="i"
        class="pointer-events-auto h-2.5 w-2.5 rounded-full ring-1 ring-black/10 transition-all"
        :class="i === current ? 'bg-white/90' : 'bg-white/50 hover:bg-white/70'"
        :aria-label="`Go to slide ${i + 1}`"
        @click="goTo(i)"
      />
    </div>
  </div>
</template>
