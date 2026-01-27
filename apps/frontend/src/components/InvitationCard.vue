<script setup lang="ts">
import { ref } from 'vue'
import frontCard from '@/assets/card/front.png'
import backCard from '@/assets/card/back.png'

const isFlipped = ref(false)
</script>

<template>
  <div
    class="flip-card h-full w-full flex justify-center items-center"
    @click="isFlipped = !isFlipped"
  >
    <div class="flip-card-inner" :class="{ flipped: isFlipped }">
      <div class="flip-card-front">
        <img
          :src="frontCard"
          alt="Wedding Invitation Front"
          style="width: 100%; height: 100%; object-fit: contain"
        />
      </div>
      <div class="flip-card-back">
        <img
          :src="backCard"
          alt="Wedding Invitation Back"
          style="width: 100%; height: 100%; object-fit: contain"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
@reference "tailwindcss";
.flip-card {
  perspective: 1000px; /* Gives 3D depth */
  margin: 0 auto; /* Center it */
  cursor: pointer;
}

.flip-card-inner {
  position: relative;
  width: 100%;
  height: 100%;
  text-align: center;
  transition: transform 0.8s;
  transform-style: preserve-3d;
}

.flip-card-inner > img {
  @apply w-full h-auto block;
}

.flip-card-inner.flipped {
  transform: rotateY(180deg);
}

.flip-card-front,
.flip-card-back {
  position: absolute;
  width: 100%;
  height: 100%;
  backface-visibility: hidden; /* Hides back side when flipped */
}

.flip-card-back {
  transform: rotateY(180deg); /* Starts flipped */
}
</style>
