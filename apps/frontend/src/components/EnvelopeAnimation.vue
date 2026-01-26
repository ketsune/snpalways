<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { RouterLink } from 'vue-router'
import orangeGardenVideo from '@/assets/orange_garden.mov'
import landingPhoto1 from '@/assets/landing-photo-1.JPG'
import landingPhoto2 from '@/assets/landing-photo-2.JPG'
import landingPhoto3 from '@/assets/landing-photo-3.JPG'
import landingPhoto4 from '@/assets/landing-photo-4.JPG'

const isAnimated = ref(false)
const isPhotoAnimated = ref(false)
const sectionRef = ref<HTMLElement | null>(null)
const photoSectionRef = ref<HTMLElement | null>(null)

const blocks = [
  { id: 1, side: 'left', text: 'Photo 1', src: landingPhoto1 },
  { id: 2, side: 'right', text: 'Photo 2', src: landingPhoto2 },
  { id: 3, side: 'left', text: 'Photo 3', src: landingPhoto3 },
  { id: 4, side: 'right', text: 'Photo 4', src: landingPhoto4 },
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
      threshold: 0.2,
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
  <section
    ref="sectionRef"
    class="flex flex-col items-center justify-center relative min-h-screen bg-transparent"
  >
    <video autoplay loop muted playsinline class="section-video">
      <source :src="orangeGardenVideo" type="video/quicktime" />
      <source :src="orangeGardenVideo" type="video/mp4" />
      Your browser does not support the video tag.
    </video>
    <div class="glass-overlay"></div>
    <div class="envelope-container" :class="{ 'is-animated': isAnimated }">
      <div class="lid one"></div>
      <div class="lid two"></div>
      <div class="envelope"></div>
      <div class="p-4 letter font-cookie font-bold text-xl md:text-3xl">
        <h2 class="text-3xl md:text-4xl">“You’re Invited!”</h2>
        <h1 class="text-5xl md:text-7xl">Kaywalee & Supanat</h1>
        <h2>We are getting married!</h2>
        <p>30 May 2026 @ Ray Venue,</p>
        <p>We can’t wait to share this special day with you.</p>
      </div>
      <div class="envelope-background custom-glass-morphism"></div>
    </div>

    <div
      ref="photoSectionRef"
      class="flex flex-col items-center justify-center relative w-full z-10 mt-8"
    >
      <div class="blocks-container w-full max-w-2xl px-4 flex flex-col gap-8">
        <div
          v-for="block in blocks"
          :key="block.id"
          class="photo-block w-96 h-[-66rem] flex items-center justify-center custom-glass-morphism"
          :class="[
            block.side === 'left' ? 'slide-left self-start' : 'slide-right self-end',
            { 'is-visible': isPhotoAnimated },
          ]"
        >
          <img class="rounded-lg" :src="block.src" alt="Som & Pann" />
        </div>
      </div>

      <div class="mt-8 mb-8">
        <RouterLink class="text-gray-600 hover:text-gray-900" to="/home">
          <button
            class="cursor-pointer px-6 py-2 bg-rose-500 text-white rounded-full hover:bg-rose-600 transition-colors"
          >
            Join the Journey
          </button>
        </RouterLink>
      </div>
    </div>
  </section>
</template>

<style scoped>
@reference "tailwindcss";

.envelope-container {
  margin-top: 16rem;
  height: 20rem;
  width: 36rem;
  max-width: 85vw;
  background-color: #ffc1cc;
  position: relative;
  display: flex;
  justify-content: center;
  z-index: 10;
}

.section-video {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  z-index: 0;
  pointer-events: none;
}

.glass-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  z-index: 1;
  pointer-events: none;
}

.lid {
  @apply border-transparent border-x-[11rem] border-b-[8rem];

  position: absolute;
  height: 100%;
  width: 100%;
  top: 0;
  left: 0;
  transform-origin: top;
  transition: transform 0.25s linear;
}

/* Lid when closed */
.lid.one {
  border-top: 10rem solid #ffb2c7;
  transform: rotateX(0deg);
  z-index: 3;
  transition-delay: 0.2s;
}

/* Lid when opened */
.lid.two {
  border-top: 10rem solid #ffc1cc;
  transform: rotateX(90deg);
  z-index: 1;
  transition-delay: 0.1s;
}
.envelope {
  @apply border-solid border-t-transparent border-r-[#ffe1d8] border-b-[#ffe1d8] border-l-[#FFF2DE] border-x-[11rem] border-y-[10rem];

  position: absolute;
  height: 100%;
  width: 100%;
  top: 0;
  left: 0;
  z-index: 3;
}

@media (width >= 48rem) {
  .envelope {
    @apply border-solid border-t-transparent border-r-[#ffe1d8] border-b-[#ffe1d8] border-l-[#FFF2DE] border-x-[18rem] border-y-[10rem];
  }

  .lid {
    @apply border-transparent border-x-[18rem] border-b-[10rem];
  }

  .envelope-background {
    width: 38rem !important;
  }
}

.letter {
  position: absolute;
  top: 0;
  background-color: white;
  border-radius: 15px;
  z-index: 2;
  transition: 0.5s;
}

.letter > * {
  text-align: center;
  color: #3b4049;
}

.envelope-background {
  position: absolute;
  top: -1rem;
  height: 22rem;
  width: 24rem;
  z-index: 0;
}

.envelope-container.is-animated .lid.one {
  transform: rotateX(90deg);
  transition-delay: 0.1s;
}

.envelope-container.is-animated .lid.two {
  transform: rotateX(180deg);
  transition-delay: 0.45s;
}

.envelope-container.is-animated .letter {
  transform: translateY(-12rem);
  transition-delay: 0.8s;
}

.envelope-container.is-animated .envelope-background {
  transform: translateY(-12rem);
  height: 34rem;
  transition:
    height 0.4s linear,
    transform 0.6s ease-in-out;
}

/* Photo Blocks Animation */
.photo-block {
  transition:
    transform 0.4s ease-out,
    opacity 0.4s ease-out;
  opacity: 0;
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
