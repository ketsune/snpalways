<script setup lang="ts">
import EnvelopeAnimation from '@/components/EnvelopeAnimation.vue'
</script>

<template>
  <main class="min-h-screen text-gray-800 bg-transparent">
    <!-- Hero Section -->
    <section
      class="min-h-screen flex flex-col items-center justify-center text-center px-4 relative overflow-hidden bg-white z-1"
    >
      <div class="relative z-10">
        <!-- Chinese Brush Stroke Background -->
        <div
          class="absolute inset-0 z-0 opacity-30 pointer-events-none flex items-center justify-center"
        >
          <svg width="0" height="0">
            <filter id="brush-filter">
              <feTurbulence
                type="fractalNoise"
                baseFrequency="0.08"
                numOctaves="4"
                result="noise"
              />
              <feDisplacementMap in="SourceGraphic" in2="noise" scale="30" />
              <feGaussianBlur stdDeviation="1.5" />
            </filter>
          </svg>

          <div class="relative w-full h-full flex items-center justify-center">
            <div
              class="chinese-brush mt-[-2rem] absolute w-[140%] h-[120%] bg-main-pink animate-float"
              style="
                filter: url(#brush-filter) blur(4px);
                mask-image: linear-gradient(
                  to right,
                  transparent,
                  black 15%,
                  black 85%,
                  transparent
                );
                -webkit-mask-image: linear-gradient(
                  to right,
                  transparent,
                  black 15%,
                  black 85%,
                  transparent
                );
              "
            ></div>
            <div
              class="chinese-brush mt-[-2rem] absolute w-[120%] h-[100%] bg-main-orange-red animate-float-delayed opacity-60"
              style="
                filter: url(#brush-filter) blur(3px);
                mask-image: linear-gradient(
                  to right,
                  transparent,
                  black 10%,
                  black 90%,
                  transparent
                );
                -webkit-mask-image: linear-gradient(
                  to right,
                  transparent,
                  black 10%,
                  black 90%,
                  transparent
                );
              "
            ></div>
          </div>
        </div>

        <div class="relative z-10">
          <h1 class="text-4xl md:text-6xl font-serif mb-6">Our Wedding</h1>
          <p class="text-xl md:text-2xl text-gray-600 mb-8 font-light">
            Join us in celebrating our special day
          </p>
        </div>
      </div>

      <div class="animate-bounce mt-16 relative z-10">
        <svg
          class="w-6 h-6 text-gray-400 mx-auto"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
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
.chinese-brush {
  border-radius: 40% 60% 40% 60% / 60% 40% 60% 40%;
  clip-path: polygon(
    2% 35%,
    10% 25%,
    20% 30%,
    30% 15%,
    40% 25%,
    50% 10%,
    60% 20%,
    70% 15%,
    80% 25%,
    90% 10%,
    98% 30%,
    95% 70%,
    85% 60%,
    75% 80%,
    65% 65%,
    55% 85%,
    45% 70%,
    35% 90%,
    25% 75%,
    15% 85%,
    5% 70%
  );
}

.animate-float {
  animation: float 10s ease-in-out infinite;
}

.animate-float-delayed {
  animation: float-delayed 12s ease-in-out infinite;
  animation-delay: -5s;
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

@keyframes float-delayed {
  0%,
  100% {
    transform: translateY(0) rotate(3deg);
  }
  50% {
    transform: translateY(15px) rotate(4deg);
  }
}
</style>
