<script setup lang="ts">
import { ref, computed } from 'vue'
import { apiFetch } from '@/lib/api'

const name = ref('')
const number = ref('')
const loading = ref(false)
const success = ref<string | null>(null)
const error = ref<string | null>(null)

const addDigit = (digit: number) => {
  if (number.value.length < 6 && !number.value.includes(digit.toString())) {
    number.value += digit.toString()
  }
}

const removeLastDigit = () => {
  number.value = number.value.slice(0, -1)
}

const isDigitUsed = (digit: number) => {
  return number.value.includes(digit.toString())
}

const hasDuplicateDigits = computed(() => {
  const digits = number.value.split('')
  return new Set(digits).size !== digits.length
})

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
      <div class="mt-1 space-y-1">
        <p class="text-sm text-rose-500 font-medium">Note: Numbers must not duplicate. Please check the used numbers below.</p>
        <p class="text-sm text-rose-500 font-medium">Note: Each digit in your 6-digit number must be unique (no repeated digits).</p>
      </div>

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
          <label class="block text-sm font-medium text-gray-700">Your lucky 6-digit number</label>

          <div class="mt-2 flex justify-between space-x-2 rounded-lg border border-gray-300 bg-gray-50 px-4 py-3 font-mono text-3xl tracking-[0.5em] shadow-inner">
            <span v-for="i in 6" :key="i" :class="number[i-1] ? 'text-gray-800' : 'text-gray-300'">
              {{ number[i-1] || '•' }}
            </span>
          </div>

          <div class="mt-4 grid grid-cols-5 gap-2">
            <button
              v-for="digit in [1, 2, 3, 4, 5, 6, 7, 8, 9, 0]"
              :key="digit"
              type="button"
              @click="addDigit(digit)"
              :disabled="isDigitUsed(digit) || number.length >= 6"
              class="flex h-12 items-center justify-center rounded-lg border bg-white text-xl font-semibold shadow-sm transition-all hover:bg-gray-50 active:bg-gray-100 disabled:opacity-30 disabled:grayscale"
              :class="isDigitUsed(digit) ? 'border-gray-200 text-gray-300' : 'border-gray-300 text-gray-700'"
            >
              {{ digit }}
            </button>
            <button
              type="button"
              @click="removeLastDigit"
              :disabled="number.length === 0"
              class="col-span-2 flex h-12 items-center justify-center rounded-lg border border-rose-200 bg-rose-50 text-sm font-medium text-rose-600 shadow-sm transition-all hover:bg-rose-100 active:bg-rose-200 disabled:opacity-50"
            >
              Delete
            </button>
            <button
              type="button"
              @click="number = ''"
              :disabled="number.length === 0"
              class="col-span-3 flex h-12 items-center justify-center rounded-lg border border-gray-300 bg-gray-100 text-sm font-medium text-gray-600 shadow-sm transition-all hover:bg-gray-200 active:bg-gray-300 disabled:opacity-50"
            >
              Clear All
            </button>
          </div>

          <p v-if="hasDuplicateDigits && number.length > 0" class="mt-2 text-xs text-rose-600">
            Digits must not be repeated.
          </p>
        </div>

        <button
          type="submit"
          :disabled="loading || number.length !== 6 || hasDuplicateDigits"
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
