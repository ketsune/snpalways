<script setup lang="ts">
// Wedding landing page – no complex logic required
import CountdownTimer from '../components/CountdownTimer.vue'
import VenueCarousel from '../components/VenueCarousel.vue'

// Wedding date: Saturday, May 30, 2026 · 3:00 PM (local time)
const weddingDate = new Date('2026-05-30T15:00:00')

// Garden venue images
const venueImages = [
  {
    src: 'https://image.makewebeasy.net/makeweb/m_720x480/NGsiJIMJB/DefaultData/RAY_VENUE_LOGO-12-g.jpg?v=202405291424',
    alt: 'Venue logo'
  },
  {
    src: 'https://image.makewebeasy.net/makeweb/m_1920x0/NGsiJIMJB/DefaultData/Factsheet-07.jpg?v=202405291424',
    alt: 'Venue maps'
  }
]
</script>

<template>
  <main class="min-h-screen bg-white text-gray-800 bg-gradient-to-b from-rose-100 from-10% via-rose-50 via-60% to-white">
    <!-- Hero -->
    <section class="flex justify-center relative isolate overflow-hidden">
      <div class="mx-auto max-w-5xl px-4 py-16 sm:py-24 text-center">
        <p class="text-sm uppercase tracking-[0.3em] text-rose-500">You're invited to the wedding of</p>
        <h1 class="mt-4 text-4xl font-serif sm:text-6xl text-gray-900 py-4">Kaywalee & Supanat</h1>
        <p class="mt-4 text-base sm:text-lg text-gray-600">Saturday, May 30, 2026 · 3:00 PM</p>
        <p class="text-base sm:text-lg text-gray-600">Ray Venue, Nonthaburi</p>
        <div class="mt-8 flex items-center justify-center gap-3">
          <RouterLink
            to="/rsvp"
            class="inline-flex items-center rounded-full bg-rose-600 px-6 py-3 text-white shadow hover:bg-rose-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
          >
            RSVP
          </RouterLink>
          <a
            href="#details"
            class="inline-flex items-center rounded-full border border-rose-200 px-6 py-3 text-rose-700 hover:bg-rose-50"
          >
            View details
          </a>
        </div>
      </div>
    </section>

    <!-- Countdown -->
    <section class="flex justify-center -mt-6 sm:-mt-8">
      <div class="mx-auto w-full px-4">
        <CountdownTimer :target="weddingDate" title="Countdown" />
      </div>
    </section>

    <!-- Quick Details -->
    <section id="details" class="flex justify-center mx-auto px-4 py-12 sm:py-16">
      <div class="max-w-5xl grid gap-6 sm:grid-cols-3">
        <div class="rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h3 class="font-medium text-gray-900">Ceremony</h3>
          <p class="mt-2 text-gray-600">3:00 PM · The Conservatory Lawn</p>
        </div>
        <div class="rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h3 class="font-medium text-gray-900">Reception</h3>
          <p class="mt-2 text-gray-600">5:30 PM · The Garden Terrace</p>
        </div>
        <div class="rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h3 class="font-medium text-gray-900">Dress Code</h3>
          <p class="mt-2 text-gray-600">Garden Formal</p>
        </div>
      </div>
    </section>

    <!-- Schedule -->
    <section class="flex justify-center bg-rose-50/50">
      <div class="mx-auto max-w-5xl px-4 py-12 sm:py-16">
        <h2 class="text-2xl font-semibold text-gray-900">Schedule</h2>
        <div class="mt-6 grid gap-4 sm:grid-cols-2">
          <div class="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
            <p class="text-sm text-gray-500">2:15 PM</p>
            <p class="mt-1 font-medium text-gray-900">Guest Arrival</p>
            <p class="text-gray-600">Doors open, find your seat and enjoy welcome refreshments.</p>
          </div>
          <div class="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
            <p class="text-sm text-gray-500">3:00 PM</p>
            <p class="mt-1 font-medium text-gray-900">Ceremony</p>
            <p class="text-gray-600">Join us as we say “I do”.</p>
          </div>
          <div class="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
            <p class="text-sm text-gray-500">5:30 PM</p>
            <p class="mt-1 font-medium text-gray-900">Reception</p>
            <p class="text-gray-600">Dinner, toasts and dancing under the stars.</p>
          </div>
          <div class="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
            <p class="text-sm text-gray-500">10:00 PM</p>
            <p class="mt-1 font-medium text-gray-900">Send-off</p>
            <p class="text-gray-600">Sparklers and farewells.</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Venue -->
    <section class="flex justify-center mx-auto px-4 py-12 sm:py-16 min-h-[600px]">
      <div class="w-full max-w-5xl grid items-stretch gap-8 sm:grid-cols-2">
        <div class="flex flex-col sm:h-full">
          <h2 class="text-2xl font-semibold text-gray-900">Venue</h2>
          <p class="text-gray-600">Ray Venue, Nonthaburi</p>
          <iframe class="w-full flex-1" src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3874.136927101776!2d100.48806587536286!3d13.83081529545871!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x30e29b002f6cd8cd%3A0x81ba3ec3330f974f!2sRAY%20VENUE!5e0!3m2!1sth!2sth!4v1759586278603!5m2!1sth!2sth" style="border:0;" loading="lazy" referrerpolicy="no-referrer-when-downgrade"/>
          <div class="mt-2 flex gap-3">
            <a
              class="inline-flex items-center rounded-full bg-gray-900 px-5 py-2.5 text-white hover:bg-gray-700"
              href="https://maps.app.goo.gl/363HBGRuAadXQ3yz8" target="_blank" rel="noreferrer"
            >Open in Maps</a>
            <a
              class="inline-flex items-center rounded-full border border-gray-300 px-5 py-2.5 text-gray-700 hover:bg-gray-50"
              href="https://www.facebook.com/rayvenue" target="_blank" rel="noreferrer"
            >Facebook</a>
            <a
              class="inline-flex items-center rounded-full border border-gray-300 px-5 py-2.5 text-gray-700 hover:bg-gray-50"
              href="https://www.instagram.com/rayvenue" target="_blank" rel="noreferrer"
            >IG</a>
          </div>
        </div>
        <VenueCarousel :images="venueImages" />
      </div>
    </section>

    <!-- Footer -->
    <footer class="border-t border-gray-100 py-10 text-center text-sm text-gray-500">
      With love, Kaywalee & Supanat · 2026
    </footer>
  </main>
</template>
