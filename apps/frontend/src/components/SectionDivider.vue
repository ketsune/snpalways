<script setup lang="ts">
// Reusable divider component for section separation
import DividerPhoto from '@/assets/divider.png'
</script>

<template>
  <div class="section-divider">
    <img class="w-auto h-8 md:h-16" :src="DividerPhoto" alt="Divider"/>
  </div>
</template>

<style scoped>
.section-divider {
  width: 100vw;
  display: flex;
  justify-content: center;
}
</style>
