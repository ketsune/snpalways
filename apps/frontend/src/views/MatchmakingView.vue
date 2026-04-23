<script setup lang="ts">
import { ref } from 'vue'
import { apiUrl } from '@/lib/api'

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
    reader.onerror = () => reject(new Error('Could not read file'))
    reader.readAsDataURL(file)
  })

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('Could not decode image'))
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
    errorMessage.value = 'Please select an image file.'
    return
  }
  try {
    const compressed = await fileToDownscaledBase64(file)
    photoBase64.value = compressed
    photoPreview.value = compressed
    errorMessage.value = null
  } catch (err) {
    console.error(err)
    errorMessage.value = 'Could not read that image. Try another one.'
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
    const res = await fetch(apiUrl('/api/matchmaking'), {
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
      throw new Error(data?.message || 'Failed to submit. Please try again.')
    }
    successMessage.value = 'Thank you! Your pick is on its way to the big screen.'
    resetForm()
  } catch (err: unknown) {
    if (err && typeof err === 'object' && 'message' in err && typeof (err as { message: unknown }).message === 'string') {
      errorMessage.value = (err as { message: string }).message
    } else {
      errorMessage.value = 'Something went wrong. Please try again.'
    }
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <main class="min-h-screen bg-off-white text-gray-800">
    <section class="mx-auto max-w-xl px-4 py-12 sm:py-16">
      <h1 class="font-cookie text-5xl sm:text-6xl text-rose-600">Matchmaking Corner</h1>
      <p class="mt-3 text-gray-600">
        Know a wonderful single friend? Tell us about them! We'll share the submissions on the big
        screen at the reception so guests can meet.
      </p>

      <form class="mt-8 space-y-6" @submit.prevent="submit">
        <div>
          <label for="submitterName" class="block text-sm font-medium text-gray-700">Your name</label>
          <input
            id="submitterName"
            v-model="submitterName"
            required
            type="text"
            placeholder="So your friend knows who sent them"
            class="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2.5 shadow-sm placeholder:text-gray-400 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-200"
          />
        </div>

        <div>
          <label for="friendName" class="block text-sm font-medium text-gray-700">Your single friend's name</label>
          <input
            id="friendName"
            v-model="friendName"
            required
            type="text"
            placeholder="First name is fine"
            class="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2.5 shadow-sm placeholder:text-gray-400 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-200"
          />
        </div>

        <div>
          <label for="contact" class="block text-sm font-medium text-gray-700">Contact</label>
          <input
            id="contact"
            v-model="contact"
            required
            type="text"
            placeholder="IG handle, LINE ID, or phone"
            class="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2.5 shadow-sm placeholder:text-gray-400 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-200"
          />
        </div>

        <div>
          <label for="bio" class="block text-sm font-medium text-gray-700">A short intro <span class="text-gray-400">(optional)</span></label>
          <textarea
            id="bio"
            v-model="bio"
            rows="3"
            maxlength="500"
            placeholder="Fun fact, what they're into, why they're a catch…"
            class="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2.5 shadow-sm placeholder:text-gray-400 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-200"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700">Photo <span class="text-gray-400">(optional)</span></label>
          <div class="mt-2 flex items-center gap-4">
            <label class="inline-flex cursor-pointer items-center rounded-full bg-rose-50 px-4 py-2 text-sm text-rose-700 hover:bg-rose-100">
              <span v-if="!photoPreview">Choose image</span>
              <span v-else>Replace image</span>
              <input type="file" accept="image/*" class="hidden" @change="onFileChange" />
            </label>
            <button
              v-if="photoPreview"
              type="button"
              class="text-sm text-gray-500 hover:text-gray-700"
              @click="clearPhoto"
            >
              Remove
            </button>
          </div>
          <div v-if="photoPreview" class="mt-4">
            <img :src="photoPreview" alt="Preview" class="max-h-64 rounded-lg object-cover shadow" />
          </div>
        </div>

        <button
          type="submit"
          :disabled="loading"
          class="inline-flex items-center rounded-full bg-rose-600 px-6 py-3 text-white shadow hover:bg-rose-700 disabled:opacity-50"
        >
          <span v-if="!loading">Send to the big screen</span>
          <span v-else>Sending…</span>
        </button>

        <p v-if="successMessage" class="text-green-700">{{ successMessage }}</p>
        <p v-if="errorMessage" class="text-rose-700">{{ errorMessage }}</p>
      </form>

      <p class="mt-10 text-sm text-gray-500">
        By submitting, you confirm your friend is okay with being introduced at the wedding. Entries can
        be taken down at any time by the moderators.
      </p>
    </section>
  </main>
</template>
