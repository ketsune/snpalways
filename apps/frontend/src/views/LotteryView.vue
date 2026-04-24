<script setup lang="ts">
import { ref } from 'vue'
import { apiFetch } from '@/lib/api'

const name = ref('')
const number = ref('')
const loading = ref(false)
const success = ref<string | null>(null)
const error = ref<string | null>(null)

async function submit() {
  success.value = null
  error.value = null
  loading.value = true
  try {
    const res = await apiFetch('/api/lottery', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.value.trim(), number: number.value.trim() }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok || !data?.success) throw new Error(data?.message || 'Failed to submit.')
    success.value = `You're in the draw, ${name.value.trim()}! Good luck! 🍀`
    name.value = ''
    number.value = ''
  } catch (err: unknown) {
    error.value = err instanceof Error ? err.message : 'Something went wrong.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <main class="min-h-screen bg-off-white text-gray-800">
    <section class="mx-auto max-w-md px-4 py-12 sm:py-16">
      <h1 class="font-cookie text-5xl sm:text-6xl text-rose-600">Lucky Draw</h1>
      <p class="mt-3 text-gray-600">Pick your lucky 6-digit number and join the draw at the reception!</p>

      <div class="mt-6 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm text-sm text-gray-600 space-y-1">
        <p><span class="font-semibold text-yellow-600">1st Prize</span> — exact 6-digit match</p>
        <p><span class="font-semibold text-gray-500">2nd Prize</span> — last 3 digits match</p>
        <p><span class="font-semibold text-amber-700">3rd Prize</span> — last 2 digits match</p>
        <p class="pt-1 text-xs text-gray-400">Each number is unique — first come, first served.</p>
      </div>

      <form class="mt-8 space-y-5" @submit.prevent="submit">
        <div>
          <label for="name" class="block text-sm font-medium text-gray-700">Your name</label>
          <input
            id="name"
            v-model="name"
            required
            type="text"
            placeholder="As it should appear on screen"
            class="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2.5 shadow-sm placeholder:text-gray-400 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-200"
          />
        </div>

        <div>
          <label for="number" class="block text-sm font-medium text-gray-700">Your lucky 6-digit number</label>
          <input
            id="number"
            v-model="number"
            required
            type="text"
            inputmode="numeric"
            pattern="\d{6}"
            maxlength="6"
            placeholder="e.g. 391047"
            class="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2.5 font-mono text-2xl tracking-widest shadow-sm placeholder:text-base placeholder:tracking-normal placeholder:text-gray-400 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-200"
          />
        </div>

        <button
          type="submit"
          :disabled="loading || number.length !== 6"
          class="inline-flex items-center rounded-full bg-rose-600 px-6 py-3 text-white shadow hover:bg-rose-700 disabled:opacity-50"
        >
          {{ loading ? 'Submitting…' : 'Join the draw' }}
        </button>
      </form>

      <p v-if="success" class="mt-6 rounded-xl bg-green-50 px-4 py-3 text-green-800">{{ success }}</p>
      <p v-if="error" class="mt-6 rounded-xl bg-rose-50 px-4 py-3 text-rose-800">{{ error }}</p>
    </section>
  </main>
</template>
