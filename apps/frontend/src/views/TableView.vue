<script setup lang="ts">
import { ref } from 'vue'
import { apiFetch } from '@/lib/api'

type Seat = { id: number; name: string; table_name: string }

const query = ref('')
const seats = ref<Seat[]>([])
const loading = ref(false)
const searched = ref(false)

let debounceTimer: ReturnType<typeof setTimeout> | null = null

function onInput() {
  if (debounceTimer) clearTimeout(debounceTimer)
  if (!query.value.trim()) {
    seats.value = []
    searched.value = false
    return
  }
  debounceTimer = setTimeout(search, 350)
}

async function search() {
  if (!query.value.trim()) return
  loading.value = true
  searched.value = true
  try {
    const res = await apiFetch(`/api/seats?q=${encodeURIComponent(query.value.trim())}`)
    const data = await res.json().catch(() => ({}))
    seats.value = data.seats ?? []
  } catch {
    seats.value = []
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <main class="min-h-screen bg-off-white text-gray-800">
    <section class="mx-auto max-w-md px-4 py-12 sm:py-16">
      <h1 class="font-cookie text-5xl sm:text-6xl text-rose-600">ค้นหาโต๊ะของคุณ</h1>
      <p class="mt-3 text-gray-600">พิมพ์ชื่อเพื่อดูหมายเลขโต๊ะของคุณ</p>

      <div class="mt-8">
        <input
          v-model="query"
          @input="onInput"
          @keydown.enter.prevent="search"
          type="text"
          placeholder="ชื่อ-นามสกุล"
          class="w-full rounded-lg border border-gray-300 px-4 py-3 text-lg shadow-sm placeholder:text-gray-400 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-200"
        />
      </div>

      <!-- Loading -->
      <div v-if="loading" class="mt-8 text-center text-gray-500">กำลังค้นหา…</div>

      <!-- Results -->
      <div v-else-if="seats.length" class="mt-6 space-y-3">
        <div
          v-for="seat in seats"
          :key="seat.id"
          class="flex items-center justify-between rounded-2xl border border-rose-100 bg-white px-5 py-4 shadow-sm"
        >
          <p class="text-gray-800 font-medium">{{ seat.name }}</p>
          <div class="text-right">
            <p class="text-xs text-gray-400 uppercase tracking-widest">โต๊ะ</p>
            <p class="font-cookie text-3xl text-rose-600 leading-none">{{ seat.table_name }}</p>
          </div>
        </div>
      </div>

      <!-- No result -->
      <div v-else-if="searched && !loading" class="mt-8 text-center text-gray-500">
        <p class="text-lg">ไม่พบชื่อ "{{ query }}"</p>
        <p class="mt-2 text-sm">ลองค้นหาด้วยชื่อภาษาอื่น หรือติดต่อเจ้าหน้าที่</p>
      </div>
    </section>
  </main>
</template>
