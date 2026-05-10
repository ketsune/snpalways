<script setup lang="ts">
import { ref } from 'vue'
import { apiFetch } from '@/lib/api'

type Seat = { id: number; name: string; table_name: string }

const token = ref('')
const authed = ref(false)
const loading = ref(false)
const error = ref<string | null>(null)
const seats = ref<Seat[]>([])

// Add form
const addName = ref('')
const addTable = ref('')
const addBusy = ref(false)

// Edit state: id → draft values
const editId = ref<number | null>(null)
const editName = ref('')
const editTable = ref('')
const editBusy = ref(false)

// Delete all modal
const deleteAllModal = ref(false)
const deleteAllBusy = ref(false)

// Filter
const filterQ = ref('')

// CSV import
const csvPreview = ref<{ name: string; table_name: string }[]>([])
const csvError = ref<string | null>(null)
const importBusy = ref(false)
const importSuccess = ref<string | null>(null)

function parseCSV(text: string): { name: string; table_name: string }[] {
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean)
  const rows: { name: string; table_name: string }[] = []
  for (const line of lines) {
    // skip header row if it looks like "name,table" literally
    if (/^name[,;]/i.test(line)) continue
    const sep = line.includes(';') ? ';' : ','
    const parts = line.split(sep).map(p => p.trim().replace(/^"|"$/g, ''))
    if (parts.length < 2 || !parts[0] || !parts[1]) continue
    rows.push({ name: parts[0], table_name: parts[1] })
  }
  return rows
}

function onFileChange(e: Event) {
  csvError.value = null
  csvPreview.value = []
  importSuccess.value = null
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = (ev) => {
    const text = ev.target?.result as string
    const rows = parseCSV(text)
    if (!rows.length) { csvError.value = 'ไม่พบข้อมูลในไฟล์ — ตรวจสอบรูปแบบ name,table_name'; return }
    csvPreview.value = rows
  }
  reader.readAsText(file, 'UTF-8')
}

async function importCSV() {
  if (!csvPreview.value.length) return
  importBusy.value = true
  csvError.value = null
  importSuccess.value = null
  try {
    const res = await apiFetch('/api/seats/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-mod-token': token.value },
      body: JSON.stringify({ rows: csvPreview.value }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok || !data.success) throw new Error(data.message || 'นำเข้าไม่สำเร็จ')
    seats.value = data.seats
    csvPreview.value = []
    importSuccess.value = `นำเข้าสำเร็จ ${data.count} รายการ`
  } catch (err: unknown) {
    csvError.value = err instanceof Error ? err.message : 'นำเข้าไม่สำเร็จ'
  } finally {
    importBusy.value = false
  }
}

async function load() {
  loading.value = true
  error.value = null
  try {
    const res = await apiFetch('/api/seats/all', { headers: { 'x-mod-token': token.value } })
    const data = await res.json().catch(() => ({}))
    if (res.status === 401) { error.value = 'รหัสผู้ดูแลไม่ถูกต้อง'; return }
    if (!data.success) throw new Error(data.message || 'โหลดข้อมูลไม่สำเร็จ')
    seats.value = data.seats as Seat[]
    authed.value = true
  } catch (err: unknown) {
    error.value = err instanceof Error ? err.message : 'โหลดข้อมูลไม่สำเร็จ'
  } finally {
    loading.value = false
  }
}

async function addSeat() {
  if (!addName.value.trim() || !addTable.value.trim()) return
  addBusy.value = true
  error.value = null
  try {
    const res = await apiFetch('/api/seats', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-mod-token': token.value },
      body: JSON.stringify({ name: addName.value.trim(), table_name: addTable.value.trim() }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok || !data.success) throw new Error(data.message || 'บันทึกไม่สำเร็จ')
    seats.value.push(data.seat as Seat)
    addName.value = ''
    addTable.value = ''
  } catch (err: unknown) {
    error.value = err instanceof Error ? err.message : 'บันทึกไม่สำเร็จ'
  } finally {
    addBusy.value = false
  }
}

function startEdit(seat: Seat) {
  editId.value = seat.id
  editName.value = seat.name
  editTable.value = seat.table_name
}

function cancelEdit() {
  editId.value = null
}

async function saveEdit(seat: Seat) {
  if (!editName.value.trim() || !editTable.value.trim()) return
  editBusy.value = true
  error.value = null
  try {
    const res = await apiFetch(`/api/seats/${seat.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'x-mod-token': token.value },
      body: JSON.stringify({ name: editName.value.trim(), table_name: editTable.value.trim() }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok || !data.success) throw new Error(data.message || 'อัปเดตไม่สำเร็จ')
    const idx = seats.value.findIndex(s => s.id === seat.id)
    if (idx !== -1) seats.value[idx] = data.seat as Seat
    editId.value = null
  } catch (err: unknown) {
    error.value = err instanceof Error ? err.message : 'อัปเดตไม่สำเร็จ'
  } finally {
    editBusy.value = false
  }
}

async function deleteSeat(id: number) {
  try {
    const res = await apiFetch(`/api/seats/${id}`, {
      method: 'DELETE',
      headers: { 'x-mod-token': token.value },
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok || !data.success) throw new Error(data.message || 'ลบไม่สำเร็จ')
    seats.value = seats.value.filter(s => s.id !== id)
  } catch (err: unknown) {
    error.value = err instanceof Error ? err.message : 'ลบไม่สำเร็จ'
  }
}

async function deleteAll() {
  deleteAllBusy.value = true
  error.value = null
  try {
    const res = await apiFetch('/api/seats', {
      method: 'DELETE',
      headers: { 'x-mod-token': token.value },
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok || !data.success) throw new Error(data.message || 'ลบไม่สำเร็จ')
    seats.value = []
    deleteAllModal.value = false
  } catch (err: unknown) {
    error.value = err instanceof Error ? err.message : 'ลบไม่สำเร็จ'
  } finally {
    deleteAllBusy.value = false
  }
}

const filtered = () =>
  filterQ.value.trim()
    ? seats.value.filter(s =>
        s.name.toLowerCase().includes(filterQ.value.toLowerCase()) ||
        s.table_name.toLowerCase().includes(filterQ.value.toLowerCase())
      )
    : seats.value
</script>

<template>
  <main class="min-h-screen bg-off-white px-4 py-10 text-gray-800">

    <!-- Delete All Modal -->
    <Teleport to="body">
      <div
        v-if="deleteAllModal"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
        @click.self="deleteAllModal = false"
      >
        <div class="mx-4 w-full max-w-md rounded-2xl bg-white p-7 shadow-xl">
          <h2 class="text-xl font-bold text-gray-900">ลบข้อมูลทั้งหมด?</h2>
          <p class="mt-3 text-sm text-gray-600 leading-relaxed">
            จะลบ <strong>ที่นั่งแขกทั้งหมด</strong> อย่างถาวร ไม่สามารถยกเลิกได้
          </p>
          <div class="mt-6 flex justify-end gap-3">
            <button
              class="rounded-full border border-gray-300 px-5 py-2 text-sm text-gray-700 hover:bg-gray-50"
              :disabled="deleteAllBusy"
              @click="deleteAllModal = false"
            >ยกเลิก</button>
            <button
              class="rounded-full bg-red-600 px-5 py-2 text-sm text-white hover:bg-red-700 disabled:opacity-50"
              :disabled="deleteAllBusy"
              @click="deleteAll"
            >{{ deleteAllBusy ? 'กำลังลบ…' : 'ใช่ ลบทั้งหมด' }}</button>
          </div>
        </div>
      </div>
    </Teleport>

    <section class="mx-auto max-w-3xl">
      <h1 class="font-cookie text-5xl text-rose-600">จัดการที่นั่ง</h1>
      <p class="mt-2 text-gray-500 text-sm">เพิ่ม แก้ไข หรือลบรายชื่อแขกและโต๊ะ</p>

      <!-- Auth form -->
      <form v-if="!authed" class="mt-6 flex gap-3" @submit.prevent="load">
        <input
          v-model="token"
          type="password"
          required
          placeholder="รหัสผู้ดูแล"
          class="w-full rounded-lg border border-gray-300 px-4 py-2.5 shadow-sm focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-200"
        />
        <button
          type="submit"
          :disabled="loading"
          class="rounded-full bg-rose-600 px-6 py-2.5 text-white hover:bg-rose-700 disabled:opacity-50"
        >{{ loading ? 'กำลังโหลด…' : 'เข้าสู่ระบบ' }}</button>
      </form>

      <p v-if="error" class="mt-4 text-rose-700 text-sm">{{ error }}</p>

      <div v-if="authed" class="mt-8 space-y-6">

        <!-- Add row form -->
        <div class="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 class="text-sm font-semibold text-gray-700 mb-3">เพิ่มแขก</h2>
          <form class="flex gap-2 flex-wrap" @submit.prevent="addSeat">
            <input
              v-model="addName"
              type="text"
              required
              placeholder="ชื่อแขก"
              class="flex-1 min-w-0 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-200"
            />
            <input
              v-model="addTable"
              type="text"
              required
              placeholder="โต๊ะ (เช่น 5, A, VIP)"
              class="w-36 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-200"
            />
            <button
              type="submit"
              :disabled="addBusy"
              class="rounded-full bg-rose-600 px-5 py-2 text-sm text-white hover:bg-rose-700 disabled:opacity-50"
            >{{ addBusy ? 'กำลังบันทึก…' : 'เพิ่ม' }}</button>
          </form>
        </div>

        <!-- CSV Import -->
        <div class="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 class="text-sm font-semibold text-gray-700 mb-1">นำเข้า CSV (เขียนทับทั้งหมด)</h2>
          <p class="text-xs text-gray-400 mb-3">รูปแบบ: <code class="bg-gray-100 px-1 rounded">name,table_name</code> — หนึ่งแถวต่อหนึ่งแขก</p>
          <input
            type="file"
            accept=".csv,text/csv"
            class="text-sm text-gray-600 file:mr-3 file:rounded-full file:border-0 file:bg-rose-50 file:px-4 file:py-1.5 file:text-sm file:text-rose-700 hover:file:bg-rose-100"
            @change="onFileChange"
          />
          <p v-if="csvError" class="mt-2 text-xs text-rose-600">{{ csvError }}</p>
          <p v-if="importSuccess" class="mt-2 text-xs text-green-600">{{ importSuccess }}</p>

          <!-- Preview -->
          <div v-if="csvPreview.length" class="mt-4">
            <p class="text-xs text-gray-500 mb-2">พรีวิว {{ csvPreview.length }} รายการ (จะลบข้อมูลเดิมทั้งหมด)</p>
            <div class="max-h-48 overflow-y-auto rounded-lg border border-gray-100 text-xs">
              <table class="w-full">
                <thead class="bg-gray-50 sticky top-0">
                  <tr>
                    <th class="px-3 py-2 text-left text-gray-500 font-medium">ชื่อ</th>
                    <th class="px-3 py-2 text-left text-gray-500 font-medium">โต๊ะ</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(row, i) in csvPreview" :key="i" class="border-t border-gray-100">
                    <td class="px-3 py-1.5 text-gray-700">{{ row.name }}</td>
                    <td class="px-3 py-1.5 text-gray-700">{{ row.table_name }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <button
              class="mt-3 rounded-full bg-rose-600 px-5 py-2 text-sm text-white hover:bg-rose-700 disabled:opacity-50"
              :disabled="importBusy"
              @click="importCSV"
            >{{ importBusy ? 'กำลังนำเข้า…' : `นำเข้า ${csvPreview.length} รายการ` }}</button>
          </div>
        </div>

        <!-- Header row -->
        <div class="flex items-center justify-between gap-3 flex-wrap">
          <div class="flex items-center gap-3">
            <p class="text-sm text-gray-500">{{ seats.length }} รายการ</p>
            <input
              v-model="filterQ"
              type="text"
              placeholder="กรองรายชื่อ…"
              class="rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:border-rose-400 focus:outline-none"
            />
          </div>
          <div class="flex gap-3">
            <button class="text-sm text-gray-500 hover:underline" @click="load">รีเฟรช</button>
            <button
              class="rounded-full border border-red-300 px-4 py-1 text-sm text-red-600 hover:bg-red-50"
              @click="deleteAllModal = true"
            >ลบทั้งหมด (เดโม)</button>
          </div>
        </div>

        <!-- Seat list -->
        <div class="space-y-2">
          <div
            v-for="seat in filtered()"
            :key="seat.id"
            class="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm"
          >
            <template v-if="editId === seat.id">
              <input
                v-model="editName"
                class="flex-1 min-w-0 rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-200"
                @keydown.enter.prevent="saveEdit(seat)"
                @keydown.escape="cancelEdit"
              />
              <input
                v-model="editTable"
                class="w-28 rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-200"
                @keydown.enter.prevent="saveEdit(seat)"
                @keydown.escape="cancelEdit"
              />
              <button
                class="text-sm text-green-700 hover:underline"
                :disabled="editBusy"
                @click="saveEdit(seat)"
              >บันทึก</button>
              <button class="text-sm text-gray-400 hover:underline" @click="cancelEdit">ยกเลิก</button>
            </template>
            <template v-else>
              <p class="flex-1 text-sm text-gray-800">{{ seat.name }}</p>
              <p class="text-xl font-bold text-rose-600 w-16 text-right" style="font-family: 'Sarabun', sans-serif">{{ seat.table_name }}</p>
              <button class="text-xs text-gray-400 hover:text-gray-700" @click="startEdit(seat)">แก้ไข</button>
              <button class="text-xs text-red-400 hover:text-red-600" @click="deleteSeat(seat.id)">ลบ</button>
            </template>
          </div>
          <p v-if="filtered().length === 0" class="text-center text-sm text-gray-400 py-6">ไม่มีรายการ</p>
        </div>

      </div>
    </section>
  </main>
</template>
