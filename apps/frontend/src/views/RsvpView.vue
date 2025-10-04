<script setup lang="ts">
import { ref } from 'vue'

const name = ref('')
const attending = ref(true)
const guests = ref(1)
const loading = ref(false)
const message = ref<string | null>(null)
const error = ref<string | null>(null)

async function submit() {
  message.value = null
  error.value = null
  loading.value = true
  try {
    const res = await fetch('/api/rsvp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.value, attending: attending.value, guests: Number(guests.value) || 0 })
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data?.message || 'Failed to submit RSVP')
    message.value = data?.message || 'RSVP received! Thank you.'
    name.value = ''
    attending.value = true
    guests.value = 1
  } catch (e: unknown) {
    if (e && typeof e === 'object' && 'message' in e && typeof (e as any).message === 'string') {
      error.value = (e as { message: string }).message
    } else {
      error.value = 'Something went wrong. Please try again.'
    }
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <main class="min-h-screen bg-white">
    <section class="mx-auto max-w-xl px-4 py-12 sm:py-16">
      <h1 class="text-3xl font-semibold text-gray-900">RSVP</h1>
      <p class="mt-2 text-gray-600">We are excited to celebrate with you. Please let us know your plans.</p>

      <form class="mt-8 space-y-6" @submit.prevent="submit">
        <div>
          <label for="name" class="block text-sm font-medium text-gray-700">Full name</label>
          <input
            id="name"
            v-model="name"
            required
            type="text"
            placeholder="Your name"
            class="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2.5 shadow-sm placeholder:text-gray-400 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-200"
          />
        </div>

        <div class="grid gap-4 sm:grid-cols-2">
          <div>
            <label class="block text-sm font-medium text-gray-700">Will you attend?</label>
            <select
              v-model="attending"
              class="mt-2 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 shadow-sm focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-200"
            >
              <option :value="true">Happily attending</option>
              <option :value="false">Sadly can’t make it</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">Number of guests</label>
            <input
              v-model="guests"
              min="0"
              type="number"
              class="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2.5 shadow-sm focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-200"
            />
          </div>
        </div>

        <button
          type="submit"
          :disabled="loading"
          class="inline-flex items-center rounded-full bg-rose-600 px-6 py-3 text-white shadow hover:bg-rose-700 disabled:opacity-50"
        >
          <span v-if="!loading">Send RSVP</span>
          <span v-else>Sending…</span>
        </button>

        <p v-if="message" class="text-green-700">{{ message }}</p>
        <p v-if="error" class="text-rose-700">{{ error }}</p>
      </form>

      <p class="mt-10 text-sm text-gray-500">If you have dietary restrictions or song requests, feel free to include them when you reply to your invitation email.</p>
    </section>
  </main>
</template>
