<script setup lang="ts">
import { ref } from 'vue'
import { apiFetch } from '@/lib/api'

const submitterName = ref('')
const friendName = ref('')
const contact = ref('')
const bio = ref('')
const photoBase64 = ref<string | null>(null)
const photoPreview = ref<string | null>(null)
const loading = ref(false)
const successMessage = ref<string | null>(null)
const errorMessage = ref<string | null>(null)

// Downscale an image file to a JPEG data URL so payloads stay small enough to store as base64 in Postgres.
async function fileToDownscaledBase64(file: File, maxSize = 900, quality = 0.82): Promise<string> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error('ไม่สามารถอ่านไฟล์ได้'))
    reader.readAsDataURL(file)
  })

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('ไม่สามารถโหลดรูปภาพได้'))
    image.src = dataUrl
  })

  const ratio = Math.min(1, maxSize / Math.max(img.width, img.height))
  const width = Math.round(img.width * ratio)
  const height = Math.round(img.height * ratio)

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas unavailable')
  ctx.drawImage(img, 0, 0, width, height)
  return canvas.toDataURL('image/jpeg', quality)
}

async function onFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  if (!file.type.startsWith('image/')) {
    errorMessage.value = 'กรุณาเลือกไฟล์รูปภาพ'
    return
  }
  try {
    const compressed = await fileToDownscaledBase64(file)
    photoBase64.value = compressed
    photoPreview.value = compressed
    errorMessage.value = null
  } catch (err) {
    console.error(err)
    errorMessage.value = 'ไม่สามารถอ่านรูปภาพได้ กรุณาลองรูปอื่น'
  }
}

function clearPhoto() {
  photoBase64.value = null
  photoPreview.value = null
}

function resetForm() {
  submitterName.value = ''
  friendName.value = ''
  contact.value = ''
  bio.value = ''
  clearPhoto()
}

async function submit() {
  successMessage.value = null
  errorMessage.value = null
  loading.value = true
  try {
    const res = await apiFetch('/api/matchmaking', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        submitterName: submitterName.value.trim(),
        friendName: friendName.value.trim(),
        contact: contact.value.trim(),
        bio: bio.value.trim() || undefined,
        photoBase64: photoBase64.value ?? undefined,
      }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok || !data?.success) {
      throw new Error(data?.message || 'ส่งข้อมูลไม่สำเร็จ กรุณาลองใหม่อีกครั้ง')
    }
    successMessage.value = `ขอบคุณ! ข้อมูลของ ${friendName.value.trim()} กำลังขึ้นจอใหญ่แล้ว 🎉`
    resetForm()
  } catch (err: unknown) {
    if (err && typeof err === 'object' && 'message' in err && typeof (err as { message: unknown }).message === 'string') {
      errorMessage.value = (err as { message: string }).message
    } else {
      errorMessage.value = 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง'
    }
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <main class="min-h-screen bg-off-white text-gray-800">
    <section class="mx-auto max-w-2xl px-4 py-12 sm:py-16">
      <h1 class="font-cookie text-3xl sm:text-6xl text-rose-600">มุมคนโสดโดยความสามารถ</h1>
      <p class="mt-3 text-gray-600">
        รู้จักเพื่อนโสดดี ๆ ไหม? บอกเราเรื่องราวของพวกเขา!
        เราจะแสดงรายชื่อบนจอใหญ่ที่งานแต่งงาน เผื่อใครสนใจทักทาย
      </p>

      <form class="mt-8 space-y-6" @submit.prevent="submit">
        <div>
          <label for="submitterName" class="block text-sm font-medium text-gray-700">ชื่อของคุณ</label>
          <input
            id="submitterName"
            v-model="submitterName"
            required
            type="text"
            placeholder="เพื่อนจะได้รู้ว่าใครส่งมา"
            class="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2.5 shadow-sm placeholder:text-gray-400 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-200"
          />
        </div>

        <div>
          <label for="friendName" class="block text-sm font-medium text-gray-700">ชื่อเพื่อนโสดของคุณ</label>
          <input
            id="friendName"
            v-model="friendName"
            required
            type="text"
            placeholder="ชื่อเล่นก็ได้"
            class="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2.5 shadow-sm placeholder:text-gray-400 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-200"
          />
        </div>

        <div>
          <label for="contact" class="block text-sm font-medium text-gray-700">ช่องทางติดต่อ</label>
          <input
            id="contact"
            v-model="contact"
            required
            type="text"
            placeholder="IG, LINE ID หรือเบอร์โทร"
            class="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2.5 shadow-sm placeholder:text-gray-400 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-200"
          />
        </div>

        <div>
          <label for="bio" class="block text-sm font-medium text-gray-700">แนะนำตัวสั้น ๆ <span class="text-gray-400">(ไม่บังคับ)</span></label>
          <textarea
            id="bio"
            v-model="bio"
            rows="3"
            maxlength="500"
            placeholder="สิ่งที่น่าสนใจ งานอดิเรก หรือทำไมถึงน่าจีบ..."
            class="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2.5 shadow-sm placeholder:text-gray-400 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-200"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700">รูปภาพ <span class="text-gray-400">(ไม่บังคับ)</span></label>
          <div class="mt-2 flex items-center gap-4">
            <label class="inline-flex cursor-pointer items-center rounded-full bg-rose-50 px-4 py-2 text-sm text-rose-700 hover:bg-rose-100">
              <span v-if="!photoPreview">เลือกรูป</span>
              <span v-else>เปลี่ยนรูป</span>
              <input type="file" accept="image/*" class="hidden" @change="onFileChange" />
            </label>
            <button
              v-if="photoPreview"
              type="button"
              class="text-sm text-gray-500 hover:text-gray-700"
              @click="clearPhoto"
            >
              ลบรูป
            </button>
          </div>
          <div v-if="photoPreview" class="mt-4">
            <img :src="photoPreview" alt="ตัวอย่างรูป" class="max-h-64 rounded-lg object-cover shadow" />
          </div>
        </div>

        <button
          type="submit"
          :disabled="loading"
          class="inline-flex items-center rounded-full bg-rose-600 px-6 py-3 text-white shadow hover:bg-rose-700 disabled:opacity-50"
        >
          <span v-if="!loading">ส่งขึ้นจอใหญ่</span>
          <span v-else>กำลังส่ง…</span>
        </button>

        <p v-if="successMessage" class="text-green-700">{{ successMessage }}</p>
        <p v-if="errorMessage" class="text-rose-700">{{ errorMessage }}</p>
      </form>

      <p class="mt-10 text-sm text-gray-500">
        การส่งข้อมูล แสดงว่าคุณยืนยันว่าเพื่อนของคุณยินยอมให้แนะนำตัวในงานแต่งงาน
        สามารถลบข้อมูลได้ตลอดเวลาโดยผู้ดูแล
      </p>
    </section>
  </main>
</template>
