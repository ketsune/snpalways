<script setup lang="ts">
import EnvelopeAnimation from '@/components/EnvelopeAnimation.vue'
</script>

<template>
  <main class="min-h-screen bg-white text-gray-800 bg-gradient-to-b from-rose-100 from-10% via-rose-50 via-60% to-white">
    <!-- Hero Section -->
    <section class="min-h-screen flex flex-col items-center justify-center text-center px-4">
      <h1 class="text-4xl md:text-6xl font-serif mb-6">Our Wedding</h1>
      <p class="text-xl md:text-2xl text-gray-600 mb-8 font-light">Join us in celebrating our special day</p>
      <div class="animate-bounce mt-12">
        <svg class="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"></path>
        </svg>
      </div>
    </section>

    <!-- Animation Section -->
    <section class="pb-24 relative isolate overflow-hidden">
      <EnvelopeAnimation />
    </section>
  </main>
</template>
