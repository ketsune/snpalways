<script setup lang="ts">
import { ref } from 'vue'
import SectionDivider from '../components/SectionDivider.vue'

// Using existing assets for the gallery
import photo1 from '@/assets/landing-photo-1.JPG'
import photo2 from '@/assets/landing-photo-2.JPG'
import photo3 from '@/assets/landing-photo-3.JPG'
import photo4 from '@/assets/landing-photo-4.JPG'
import photo5 from '@/assets/home-photo-1.JPG'
import photo6 from '@/assets/home-photo-2.JPG'
import photo7 from '@/assets/home-photo-3.JPG'

// New gallery photos
import g1 from '@/assets/gallery/IMG_7740.jpeg'
import g2 from '@/assets/gallery/IMG_9256.jpeg'
import g3 from '@/assets/gallery/IMG_9257.jpeg'
import g4 from '@/assets/gallery/IMG_9312.jpeg'
import g5 from '@/assets/gallery/IMG_9313.jpeg'
import g6 from '@/assets/gallery/IMG_9322.jpeg'
import g7 from '@/assets/gallery/20260127_105547739_iOS.jpg'
import g8 from '@/assets/gallery/20260127_110342554_iOS.jpg'
import g9 from '@/assets/gallery/20260127_110619956_iOS.jpg'
import g10 from '@/assets/gallery/20260127_111846993_iOS.jpg'
import g11 from '@/assets/gallery/20260127_124405451_iOS.jpg'

const galleryImages = [
  { src: photo1, alt: 'Pre-wedding Photo 1' },
  { src: photo2, alt: 'Pre-wedding Photo 2' },
  { src: photo3, alt: 'Pre-wedding Photo 3' },
  { src: photo4, alt: 'Pre-wedding Photo 4' },
  { src: photo5, alt: 'Home Photo 1' },
  { src: photo6, alt: 'Home Photo 2' },
  { src: photo7, alt: 'Home Photo 3' },
  { src: g1, alt: 'Gallery Photo 1' },
  { src: g2, alt: 'Gallery Photo 2' },
  { src: g3, alt: 'Gallery Photo 3' },
  { src: g4, alt: 'Gallery Photo 4' },
  { src: g5, alt: 'Gallery Photo 5' },
  { src: g6, alt: 'Gallery Photo 6' },
  { src: g7, alt: 'Gallery Photo 7' },
  { src: g8, alt: 'Gallery Photo 8' },
  { src: g9, alt: 'Gallery Photo 9' },
  { src: g10, alt: 'Gallery Photo 10' },
  { src: g11, alt: 'Gallery Photo 11' }
].sort(() => Math.random() - 0.5)

const selectedImage = ref<{ src: string; alt: string } | null>(null)
const isModalOpen = ref(false)

const openModal = (image: { src: string; alt: string }) => {
  selectedImage.value = image
  isModalOpen.value = true
}

const closeModal = () => {
  isModalOpen.value = false
  selectedImage.value = null
}

import { onMounted, onUnmounted } from 'vue'

const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Escape' && isModalOpen.value) {
    closeModal()
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <main class="min-h-screen bg-off-white text-gray-800">
    <!-- Header -->
    <header class="py-12 text-center bg-white shadow-sm">
      <h1 class="font-cookie text-6xl md:text-7xl text-rose-600">Our Gallery</h1>
      <p class="mt-4 text-gray-600 uppercase tracking-widest text-sm">Kaywalee & Supanat</p>
    </header>

    <!-- Gallery Grid -->
    <section class="max-w-7xl mx-auto px-4 py-12">
      <div class="columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4">
        <div
          v-for="(image, index) in galleryImages"
          :key="index"
          class="break-inside-avoid rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer group"
          @click="openModal(image)"
        >
          <img
            :src="image.src"
            :alt="image.alt"
            loading="lazy"
            class="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-500"
          />
        </div>
      </div>
    </section>

    <!-- Modal -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition duration-300 ease-out"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition duration-200 ease-in"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div
          v-if="isModalOpen"
          class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          @click="closeModal"
        >
          <div
            class="relative max-w-5xl w-full custom-glass-morphism p-1 md:p-2 overflow-hidden"
            @click.stop
          >
            <button
              @click="closeModal"
              class="absolute top-4 right-4 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-black/20 text-white hover:bg-black/40 transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
            <img
              v-if="selectedImage"
              :src="selectedImage.src"
              :alt="selectedImage.alt"
              class="w-full h-auto max-h-[85vh] object-contain rounded-xl"
            />
          </div>
        </div>
      </Transition>
    </Teleport>

    <section class="mb-12">
      <SectionDivider />
    </section>

    <!-- Back to Home -->
    <div class="flex justify-center pb-16">
      <router-link
        to="/home"
        class="inline-flex items-center rounded-full bg-rose-600 px-8 py-3 text-white shadow hover:bg-rose-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 transition-colors"
      >
        Back to Home
      </router-link>
    </div>

    <!-- Footer -->
    <footer class="border-t border-gray-100 py-10 text-center text-sm text-gray-500">
      With love, Kaywalee & Supanat · 2026
    </footer>
  </main>
</template>
