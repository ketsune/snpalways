<script setup lang="ts">
import EnvelopeAnimation from '@/components/EnvelopeAnimation.vue'
</script>

<template>
  <main class="min-h-screen text-gray-800 bg-transparent">
    <!-- Hero Section -->
    <section
      class="min-h-screen flex flex-col items-center justify-center text-center px-4 relative overflow-hidden bg-white z-1"
    >
      <div class="relative z-10 min-w-[50rem] brush-container">
        <div class="relative z-10 font-fluer-de-leah wedding-container">
          <h1 class="text-4xl md:text-8xl mb-6">Our Wedding</h1>
          <p class="text-2xl md:text-6xl text-gray-600 mb-8 font-light">
            Join us in celebrating our special day
          </p>
        </div>
      </div>

      <div class="animate-bounce mt-16 relative z-10">
        <svg
          class="w-6 h-6 text-gray-600 mx-auto"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="4"
            d="M19 14l-7 7m0 0l-7-7m7 7V3"
          ></path>
        </svg>
      </div>
    </section>

    <!-- Animation Section -->
    <section class="relative overflow-hidden bg-transparent">
      <EnvelopeAnimation />
    </section>
  </main>
</template>

<style scoped>
@reference "tailwindcss";

.wedding-container {
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.brush-container:before {
  @apply translate-x-[50%] md:translate-0;

  content: '';
  display: inline-block;
  background-image: linear-gradient(
    to right,
    var(--color-main-orange-red),
    var(--color-main-orange)
  );
  -webkit-mask-image: url('@/assets/brush-bg.png');
  mask-image: url('@/assets/brush-bg.png');
  //-webkit-mask-size: contain;
  mask-size: 100%, contain;
  -webkit-mask-repeat: no-repeat;
  mask-repeat: no-repeat;
  opacity: 0.45;
  width: 100vw;
  max-width: 50rem;
  height: 20rem;
  z-index: 0;
  left: 0;
  position: absolute;
  animation: float 30s ease-in-out infinite;
}

@keyframes float {
  0%,
  100% {
    transform: translateY(0) rotate(-2deg);
  }
  50% {
    transform: translateY(-20px) rotate(0deg);
  }
}
</style>
