<script setup lang="ts">
import { ref } from 'vue'
import { apiFetch } from '@/lib/api'
import tableMapUrl from '@/assets/table/table_map.png'

type Seat = { id: number; name: string; table_name: string }

const query = ref('')
const seats = ref<Seat[]>([])
const loading = ref(false)
const searched = ref(false)
const mapOpen = ref(false)

const SUGGEST_GROUPS = [
  'ญาติพ่ออู๊ด', 'ญาติแม่ปอง', 'MU RX13', 'TU824', 'Organon',
  'เพื่อนพ่ออู๊ด', 'SET', 'SG Band', 'SG', 'CSCU', 'สายรหัส',
  'ญาติแม่ลัก', 'เพื่อนพ่อเกรียง', 'ญาติพ่อเกรียง', 'korkor',
  'DM / เพื่อนเจ้าสาว', 'DM', 'SCI OFFICE', 'SCI FACTORY', 'MS CU',
  'Prof. CU / Tostem', 'KK57', 'Tostem', 'PMTT',
]

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

function selectGroup(group: string) {
  query.value = group
  search()
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
    <section class="mx-auto max-w-2xl px-4 py-12 sm:py-16">
      <h1 class="font-cookie text-3xl sm:text-6xl text-rose-600">ค้นหาโต๊ะของคุณ</h1>
      <p class="mt-3 text-gray-600">พิมพ์ชื่อหรือเลือกกลุ่มเพื่อดูหมายเลขโต๊ะ</p>

      <!-- Search input -->
      <div class="mt-8">
        <input
          v-model="query"
          @input="onInput"
          @keydown.enter.prevent="search"
          type="text"
          placeholder="กรุณากรอกชื่อเล่นหรือชื่อที่พวกเราเรียกค่ะ/ครับ"
          class="w-full rounded-lg border border-gray-300 px-4 py-3 text-lg shadow-sm placeholder:text-gray-400 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-200"
        />
      </div>

      <!-- Suggest group tags -->
      <div class="mt-4 flex flex-wrap gap-2">
        <button
          v-for="group in SUGGEST_GROUPS"
          :key="group"
          type="button"
          class="rounded-full border px-3 py-1 text-sm transition-colors"
          :class="query === group
            ? 'border-rose-400 bg-rose-100 text-rose-700 font-semibold'
            : 'border-gray-200 bg-white text-gray-600 hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600'"
          @click="selectGroup(group)"
        >
          {{ group }}
        </button>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="mt-8 text-center text-gray-500">กำลังค้นหา…</div>

      <!-- Results -->
      <div v-else-if="seats.length" class="mt-6 space-y-3">
        <div
          v-for="seat in seats"
          :key="seat.id"
          class="flex cursor-pointer items-center justify-between rounded-2xl border border-rose-100 bg-white px-5 py-4 shadow-sm transition hover:border-rose-300 hover:shadow-md active:scale-[0.98]"
          @click="mapOpen = true"
        >
          <p class="text-gray-800 font-medium" style="font-family: 'Sarabun', sans-serif">{{ seat.name }}</p>
          <div class="text-right">
            <p class="text-2xl font-bold text-rose-600 leading-none" style="font-family: 'Sarabun', sans-serif">{{ seat.table_name }}</p>
          </div>
        </div>
        <p class="text-center text-xs text-gray-400 mt-2">แตะที่ชื่อเพื่อดูแผนผังที่นั่ง</p>
      </div>

      <!-- No result -->
      <div v-else-if="searched && !loading" class="mt-8 text-center text-gray-500">
        <p class="text-lg">ไม่พบชื่อ "{{ query }}"</p>
        <p class="mt-2 text-sm">ลองค้นหาด้วยชื่ออื่น หรือเลือกกลุ่มด้านบน</p>
      </div>
    </section>

    <!-- Table map modal -->
    <Teleport to="body">
      <div
        v-if="mapOpen"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
        @click.self="mapOpen = false"
      >
        <div class="relative max-h-[90vh] max-w-[95vw] overflow-auto rounded-2xl bg-white shadow-2xl">
          <button
            class="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white hover:bg-black/60"
            @click="mapOpen = false"
          >✕</button>
          <img
            :src="tableMapUrl"
            alt="แผนผังที่นั่ง"
            class="block w-full rounded-2xl"
          />
        </div>
      </div>
    </Teleport>
  </main>
</template>
