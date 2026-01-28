<script setup lang="ts">
import { ref, computed } from 'vue'
import SectionDivider from '../components/SectionDivider.vue'

// Using existing assets for the gallery
import photo1 from '@/assets/landing-photo-1.JPG'
import photo2 from '@/assets/landing-photo-2.JPG'
import photo3 from '@/assets/landing-photo-3.JPG'
import photo4 from '@/assets/landing-photo-4.JPG'
import photo5 from '@/assets/home-photo-1.JPG'
import photo6 from '@/assets/home-photo-2.JPG'
import photo7 from '@/assets/home-photo-3.JPG'

// Gallery photos with groupId pattern: gallery-{groupId}-{id}.jpg
// Group 1
import g1_1 from '@/assets/gallery/gallery-1-1.jpg'
import g1_2 from '@/assets/gallery/gallery-1-2.jpg'
import g1_3 from '@/assets/gallery/gallery-1-3.jpg'
import g1_4 from '@/assets/gallery/gallery-1-4.jpg'
import g1_5 from '@/assets/gallery/gallery-1-5.jpg'
import g1_6 from '@/assets/gallery/gallery-1-6.jpg'
import g1_7 from '@/assets/gallery/gallery-1-7.jpg'
import g1_8 from '@/assets/gallery/gallery-1-8.jpg'
import g1_9 from '@/assets/gallery/gallery-1-9.jpg'
import g1_10 from '@/assets/gallery/gallery-1-10.jpg'
import g1_12 from '@/assets/gallery/gallery-1-12.jpg'
import g1_13 from '@/assets/gallery/gallery-1-13.jpg'
import g1_14 from '@/assets/gallery/gallery-1-14.jpg'
// Group 2
import g2_1 from '@/assets/gallery/gallery-2-1.jpg'
// Group 3
import g3_1 from '@/assets/gallery/gallery-3-1.jpg'
import g3_2 from '@/assets/gallery/gallery-3-2.jpg'
// Group 4
import g4_1 from '@/assets/gallery/gallery-4-1.jpg'
import g4_2 from '@/assets/gallery/gallery-4-2.jpg'
import g4_3 from '@/assets/gallery/gallery-4-3.jpg'
import g4_4 from '@/assets/gallery/gallery-4-4.jpg'
import g4_5 from '@/assets/gallery/gallery-4-5.jpg'
import g4_6 from '@/assets/gallery/gallery-4-6.jpg'
// Group 5
import g5_1 from '@/assets/gallery/gallery-5-1.jpg'
import g5_2 from '@/assets/gallery/gallery-5-2.jpg'
import g5_3 from '@/assets/gallery/gallery-5-3.jpg'
import g5_4 from '@/assets/gallery/gallery-5-4.jpg'
import g5_5 from '@/assets/gallery/gallery-5-5.jpg'
import g5_6 from '@/assets/gallery/gallery-5-6.jpg'
// Group 6
import g6_1 from '@/assets/gallery/gallery-6-1.jpg'
import g6_2 from '@/assets/gallery/gallery-6-2.jpg'
import g6_3 from '@/assets/gallery/gallery-6-3.jpg'
import g6_4 from '@/assets/gallery/gallery-6-4.jpg'
import g6_5 from '@/assets/gallery/gallery-6-5.jpg'
import g6_6 from '@/assets/gallery/gallery-6-6.jpg'
import g6_7 from '@/assets/gallery/gallery-6-7.jpg'
import g6_8 from '@/assets/gallery/gallery-6-8.jpg'
import g6_9 from '@/assets/gallery/gallery-6-9.jpg'
import g6_10 from '@/assets/gallery/gallery-6-10.jpg'
import g6_11 from '@/assets/gallery/gallery-6-11.jpg'
import g6_12 from '@/assets/gallery/gallery-6-12.jpg'
import g6_13 from '@/assets/gallery/gallery-6-13.jpg'
import g6_14 from '@/assets/gallery/gallery-6-14.jpg'

// Define images with groupId for grouping and sorting
const rawGalleryImages = [
  // Pre-wedding and home photos (group 0)
  { src: photo1, alt: 'Pre-wedding Photo 1', groupId: 0 },
  { src: photo2, alt: 'Pre-wedding Photo 2', groupId: 0 },
  { src: photo3, alt: 'Pre-wedding Photo 3', groupId: 0 },
  { src: photo4, alt: 'Pre-wedding Photo 4', groupId: 0 },
  { src: photo5, alt: 'Home Photo 1', groupId: 0 },
  { src: photo6, alt: 'Home Photo 2', groupId: 0 },
  { src: photo7, alt: 'Home Photo 3', groupId: 0 },
  // Group 1
  { src: g1_1, alt: 'Gallery Photo 1-1', groupId: 1 },
  { src: g1_2, alt: 'Gallery Photo 1-2', groupId: 1 },
  { src: g1_3, alt: 'Gallery Photo 1-3', groupId: 1 },
  { src: g1_4, alt: 'Gallery Photo 1-4', groupId: 1 },
  { src: g1_5, alt: 'Gallery Photo 1-5', groupId: 1 },
  { src: g1_6, alt: 'Gallery Photo 1-6', groupId: 1 },
  { src: g1_7, alt: 'Gallery Photo 1-7', groupId: 1 },
  { src: g1_8, alt: 'Gallery Photo 1-8', groupId: 1 },
  { src: g1_9, alt: 'Gallery Photo 1-9', groupId: 1 },
  { src: g1_10, alt: 'Gallery Photo 1-10', groupId: 1 },
  { src: g1_12, alt: 'Gallery Photo 1-12', groupId: 1 },
  { src: g1_13, alt: 'Gallery Photo 1-13', groupId: 1 },
  { src: g1_14, alt: 'Gallery Photo 1-14', groupId: 1 },
  // Group 2
  { src: g2_1, alt: 'Gallery Photo 2-1', groupId: 2 },
  // Group 3
  { src: g3_1, alt: 'Gallery Photo 3-1', groupId: 3 },
  { src: g3_2, alt: 'Gallery Photo 3-2', groupId: 3 },
  // Group 4
  { src: g4_1, alt: 'Gallery Photo 4-1', groupId: 4 },
  { src: g4_2, alt: 'Gallery Photo 4-2', groupId: 4 },
  { src: g4_3, alt: 'Gallery Photo 4-3', groupId: 4 },
  { src: g4_4, alt: 'Gallery Photo 4-4', groupId: 4 },
  { src: g4_5, alt: 'Gallery Photo 4-5', groupId: 4 },
  { src: g4_6, alt: 'Gallery Photo 4-6', groupId: 4 },
  // Group 5
  { src: g5_1, alt: 'Gallery Photo 5-1', groupId: 5 },
  { src: g5_2, alt: 'Gallery Photo 5-2', groupId: 5 },
  { src: g5_3, alt: 'Gallery Photo 5-3', groupId: 5 },
  { src: g5_4, alt: 'Gallery Photo 5-4', groupId: 5 },
  { src: g5_5, alt: 'Gallery Photo 5-5', groupId: 5 },
  { src: g5_6, alt: 'Gallery Photo 5-6', groupId: 5 },
  // Group 6
  { src: g6_1, alt: 'Gallery Photo 6-1', groupId: 6 },
  { src: g6_2, alt: 'Gallery Photo 6-2', groupId: 6 },
  { src: g6_3, alt: 'Gallery Photo 6-3', groupId: 6 },
  { src: g6_4, alt: 'Gallery Photo 6-4', groupId: 6 },
  { src: g6_5, alt: 'Gallery Photo 6-5', groupId: 6 },
  { src: g6_6, alt: 'Gallery Photo 6-6', groupId: 6 },
  { src: g6_7, alt: 'Gallery Photo 6-7', groupId: 6 },
  { src: g6_8, alt: 'Gallery Photo 6-8', groupId: 6 },
  { src: g6_9, alt: 'Gallery Photo 6-9', groupId: 6 },
  { src: g6_10, alt: 'Gallery Photo 6-10', groupId: 6 },
  { src: g6_11, alt: 'Gallery Photo 6-11', groupId: 6 },
  { src: g6_12, alt: 'Gallery Photo 6-12', groupId: 6 },
  { src: g6_13, alt: 'Gallery Photo 6-13', groupId: 6 },
  { src: g6_14, alt: 'Gallery Photo 6-14', groupId: 6 },
]

// Fisher-Yates shuffle algorithm
const shuffleArray = <T>(array: T[]): T[] => {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j]!, shuffled[i]!]
  }
  return shuffled
}

// Group photos by groupId, sort groups by groupId, and randomize within each group
const groupedGalleryImages = computed(() => {
  // Group images by groupId
  const groups = new Map<number, typeof rawGalleryImages>()
  for (const image of rawGalleryImages) {
    if (!groups.has(image.groupId)) {
      groups.set(image.groupId, [])
    }
    groups.get(image.groupId)!.push(image)
  }

  // Sort group keys in ascending order and return array of groups with shuffled images
  const sortedGroupIds = Array.from(groups.keys()).sort((a, b) => a - b)
  const result: Array<typeof rawGalleryImages> = []

  for (const groupId of sortedGroupIds) {
    const groupImages = groups.get(groupId)!
    const shuffledGroup = shuffleArray(groupImages)
    result.push(shuffledGroup)
  }

  return result
})

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
      <div
        v-for="(group, groupIndex) in groupedGalleryImages"
        :key="groupIndex"
        class="my-4 columns-1 sm:columns-2 lg:columns-3 gap-4"
      >
        <div
          v-for="(image, index) in group"
          :key="`${groupIndex}-${index}`"
          class="mb-4 break-inside-avoid rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer group"
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
