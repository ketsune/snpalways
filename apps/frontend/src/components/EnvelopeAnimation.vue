<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { RouterLink } from 'vue-router'

const isAnimated = ref(false)
const isPhotoAnimated = ref(false)
const sectionRef = ref<HTMLElement | null>(null)
const photoSectionRef = ref<HTMLElement | null>(null)

const blocks = [
  { id: 1, side: 'left', text: 'Photo 1' },
  { id: 2, side: 'right', text: 'Photo 2' },
  { id: 3, side: 'left', text: 'Photo 3' },
  { id: 4, side: 'right', text: 'Photo 4' },
]

let observer: IntersectionObserver | null = null
let photoObserver: IntersectionObserver | null = null

onMounted(() => {
  observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        isAnimated.value = entry.isIntersecting
      })
    },
    {
      threshold: 0.2,
    },
  )

  photoObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        isPhotoAnimated.value = entry.isIntersecting
      })
    },
    {
      threshold: 0.25,
    },
  )

  if (sectionRef.value) {
    observer.observe(sectionRef.value)
  }
  if (photoSectionRef.value) {
    photoObserver.observe(photoSectionRef.value)
  }
})

onUnmounted(() => {
  if (observer) {
    observer.disconnect()
  }
  if (photoObserver) {
    photoObserver.disconnect()
  }
})
</script>

<template>
  <section ref="sectionRef" class="flex flex-col items-center justify-center relative">
    <div class="envelope-container" :class="{ 'is-animated': isAnimated }">
      <div class="lid one"></div>
      <div class="lid two"></div>
      <div class="envelope"></div>
      <div class="letter">
        <p>Hello</p>
      </div>
    </div>

    <div ref="photoSectionRef" class="flex flex-col items-center justify-center relative w-full">
      <div class="blocks-container w-full max-w-2xl px-4 mt-12 flex flex-col gap-8">
        <div
          v-for="block in blocks"
          :key="block.id"
          class="photo-block w-64 h-40 bg-gray-200 rounded-lg shadow-md flex items-center justify-center"
          :class="[
            block.side === 'left' ? 'slide-left self-start' : 'slide-right self-end',
            { 'is-visible': isPhotoAnimated },
          ]"
        >
          <span class="text-gray-500">{{ block.text }}</span>
        </div>
      </div>

      <div class="mt-12">
        <RouterLink class="text-gray-600 hover:text-gray-900" to="/home">
          <button
            class="cursor-pointer px-6 py-2 bg-rose-500 text-white rounded-full hover:bg-rose-600 transition-colors"
          >
            Visit Site
          </button>
        </RouterLink>
      </div>
    </div>
  </section>
</template>

<style scoped>
.envelope-container {
  margin-top: 7rem;
  height: 200px;
  width: 300px;
  background-color: #3760c9;
  position: relative;
  display: flex;
  justify-content: center;
  z-index: 0;
}

.lid {
  position: absolute;
  height: 100%;
  width: 100%;
  top: 0;
  left: 0;
  border-right: 150px solid transparent;
  border-bottom: 100px solid transparent;
  border-left: 150px solid transparent;
  transform-origin: top;
  transition: transform 0.25s linear;
}

/* Lid when closed */
.lid.one {
  border-top: 100px solid #658ced;
  transform: rotateX(0deg);
  z-index: 3;
  transition-delay: 0.1s;
}

/* Lid when opened */
.lid.two {
  border-top: 100px solid #3760c9;
  transform: rotateX(90deg);
  z-index: 1;
  transition-delay: 0.05s;
}

.envelope {
  position: absolute;
  height: 100%;
  width: 100%;
  top: 0;
  left: 0;
  border-top: 100px solid transparent;
  border-right: 150px solid #c4dff0;
  border-bottom: 100px solid #c4dff0;
  border-left: 150px solid #a4d4f2;
  z-index: 3;
}

.letter {
  position: absolute;
  top: 0;
  width: 80%;
  height: 80%;
  background-color: white;
  border-radius: 15px;
  z-index: 2;
  transition: 0.2s;
}

.letter p {
  text-align: center;
  font-size: 30px;
  margin-top: 30px;
  color: #3b4049;
}

.envelope-container.is-animated .lid.one {
  transform: rotateX(90deg);
  transition-delay: 0s;
}

.envelope-container.is-animated .lid.two {
  transform: rotateX(180deg);
  transition-delay: 0.1s;
}

.envelope-container.is-animated .letter {
  transform: translateY(-50px);
  transition-delay: 0.2s;
}

/* Photo Blocks Animation */
.photo-block {
  transition:
    transform 0.4s ease-out,
    opacity 0.4s ease-out;
  opacity: 0;
}

.slide-left {
  transform: translateX(-100px);
}

.slide-right {
  transform: translateX(100px);
}

.photo-block.is-visible {
  transform: translateX(0);
  opacity: 1;
}

/* Staggered animation delay when opening */
.is-animated + div .photo-block:nth-child(1) {
  transition-delay: 0.3s;
}
.is-animated + div .photo-block:nth-child(2) {
  transition-delay: 0.4s;
}
.is-animated + div .photo-block:nth-child(3) {
  transition-delay: 0.5s;
}
.is-animated + div .photo-block:nth-child(4) {
  transition-delay: 0.6s;
}

/* Staggered animation delay */
.photo-block:nth-child(1) {
  transition-delay: 0.7s;
}
.photo-block:nth-child(2) {
  transition-delay: 0.9s;
}
.photo-block:nth-child(3) {
  transition-delay: 1.1s;
}
.photo-block:nth-child(4) {
  transition-delay: 1.3s;
}
</style>
