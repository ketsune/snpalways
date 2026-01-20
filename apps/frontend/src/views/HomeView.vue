<script setup lang="ts">
// Wedding landing page – no complex logic required
import CountdownTimer from '../components/CountdownTimer.vue'
import VenueCarousel from '../components/VenueCarousel.vue'
import SectionDivider from '../components/SectionDivider.vue'
import HomePhoto2 from '@/assets/home-photo-2.JPG'
import LineQr from '@/assets/line-qr.png'

// Wedding date: Saturday, May 30, 2026 · 3:00 PM (local time)
const weddingDate = new Date('2026-05-30T15:00:00')

// Garden venue images
const venueImages = [
  {
    src: 'https://image.makewebeasy.net/makeweb/m_720x480/NGsiJIMJB/DefaultData/RAY_VENUE_LOGO-12-g.jpg?v=202405291424',
    alt: 'Venue logo',
  },
  {
    src: 'https://image.makewebeasy.net/makeweb/m_1920x0/NGsiJIMJB/DefaultData/Factsheet-07.jpg?v=202405291424',
    alt: 'Venue maps',
  },
]
</script>

<template>
  <main class="min-h-screen bg-off-white text-gray-800">
    <section
      class="flex justify-center relative isolate overflow-hidden invited-section-background"
    >
      <div class="mx-auto max-w-5xl px-4 py-16 sm:py-24 text-center z-1 text-shadow-custom">
        <p class="text-sm uppercase tracking-[0.3em] text-rose-600 !font-bold">
          You're invited to the wedding of
        </p>
        <h1 class="font-corinthia mt-2 md:mt-4 text-6xl md:text-8xl text-white py-4">
          Kaywalee & Supanat
        </h1>
        <p class="mt-4 text-base sm:text-lg">Saturday, May 30, 2026 · 13:00</p>
        <p class="text-base sm:text-lg">Ray Venue, Nonthaburi</p>
        <div class="mt-8 flex items-center justify-center gap-3">
          <a
            href="https://forms.gle/e1WGCZBAHVRLV5cA7"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex items-center rounded-full bg-rose-600 px-4 py-1 md:px-6 md:py-3 text-white shadow hover:bg-rose-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
          >
            RSVP
          </a>
          <a
            href="#details"
            class="inline-flex items-center rounded-full border border-rose-200 px-4 py-1 md:px-6 md:py-3 text-rose-700 bg-rose-50 hover:bg-rose-200"
          >
            View details
          </a>
        </div>
      </div>
    </section>

    <section class="mt-6 md:mt-10">
      <SectionDivider />
    </section>

    <!-- Countdown -->
    <section class="flex justify-center mt-8 md:mt-12 items-center">
      <div class="h-64 countdown-background-container">
        <img class="countdown-background" :src="HomePhoto2" alt="our-bg" />
      </div>
      <div class="mx-auto w-full px-4">
        <CountdownTimer :target="weddingDate" title="Countdown" />
      </div>
    </section>

    <section class="mt-8 md:mt-12">
      <SectionDivider />
    </section>

    <!-- Quick Details -->
    <!--    <section id="details" class="flex justify-center mx-auto px-4 py-12 sm:py-16">-->
    <!--      <div class="max-w-5xl grid gap-6 sm:grid-cols-3">-->
    <!--        <div class="rounded-2xl border border-gray-100 p-6 shadow-sm">-->
    <!--          <h3 class="font-medium text-gray-900">Ceremony</h3>-->
    <!--          <p class="mt-2 text-gray-600">3:00 PM · The Conservatory Lawn</p>-->
    <!--        </div>-->
    <!--        <div class="rounded-2xl border border-gray-100 p-6 shadow-sm">-->
    <!--          <h3 class="font-medium text-gray-900">Reception</h3>-->
    <!--          <p class="mt-2 text-gray-600">5:30 PM · The Garden Terrace</p>-->
    <!--        </div>-->
    <!--        <div class="rounded-2xl border border-gray-100 p-6 shadow-sm">-->
    <!--          <h3 class="font-medium text-gray-900">Dress Code</h3>-->
    <!--          <p class="mt-2 text-gray-600">Garden Formal</p>-->
    <!--        </div>-->
    <!--      </div>-->
    <!--    </section>-->

    <!-- Schedule -->
    <section class="flex justify-center bg-rose-50/50 mt-8 md:mt-12">
      <div class="mx-auto max-w-5xl px-4">
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

    <section class="mt-8 md:mt-12">
      <SectionDivider />
    </section>

    <!-- Venue -->
    <section id="venue" class="flex justify-center mx-auto px-4 min-h-[600px] mt-8 md:mt-12">
      <div class="w-full max-w-5xl grid items-stretch gap-8 md:grid-cols-2">
        <div class="flex flex-col md:h-full">
          <h2 class="text-2xl font-semibold text-gray-900">Venue</h2>
          <p class="text-gray-600">Ray Venue, Nonthaburi</p>
          <iframe
            class="w-full flex-1"
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3874.136927101776!2d100.48806587536286!3d13.83081529545871!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x30e29b002f6cd8cd%3A0x81ba3ec3330f974f!2sRAY%20VENUE!5e0!3m2!1sth!2sth!4v1759586278603!5m2!1sth!2sth"
            style="border: 0"
            loading="lazy"
            referrerpolicy="no-referrer-when-downgrade"
          />
          <div class="mt-2 flex gap-3">
            <a
              class="inline-flex items-center rounded-full bg-gray-900 px-5 py-2.5 text-white hover:bg-gray-700"
              href="https://maps.app.goo.gl/363HBGRuAadXQ3yz8"
              target="_blank"
              rel="noreferrer"
              >Open in Maps</a
            >
            <a
              class="inline-flex items-center rounded-full border border-gray-300 px-5 py-2.5 text-gray-700 hover:bg-gray-50"
              href="https://www.facebook.com/rayvenue"
              target="_blank"
              rel="noreferrer"
              >Facebook</a
            >
            <a
              class="inline-flex items-center rounded-full border border-gray-300 px-5 py-2.5 text-gray-700 hover:bg-gray-50"
              href="https://www.instagram.com/rayvenue"
              target="_blank"
              rel="noreferrer"
              >IG</a
            >
          </div>
        </div>
        <VenueCarousel :images="venueImages" />
      </div>
    </section>

    <section class="mt-8 md:mt-12">
      <SectionDivider />
    </section>

    <section id="contact" class="flex justify-center bg-gray-50/50">
      <div
        class="contact-container md:flex mx-auto max-w-5xl px-4 py-12 md:py-16 text-center justify-between"
      >
        <div class="flex flex-col justify-center items-start">
          <h2 class="text-2xl text-left font-semibold text-gray-900">Contact Us</h2>
          <p class="text-gray-600 text-left md:text-nowrap">
            If you have any questions, feel free to reach out to us via Line.
          </p>
          <div class="flex justify-center w-100 md:justify-start">
            <a
              href="https://lin.ee/NDMyjnw"
              target="_blank"
              rel="noopener noreferrer"
              class="w-fit inline-flex items-center rounded-full bg-[#06C755] mt-4 px-4 py-3 text-white shadow hover:bg-[#05b34c] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#06C755]"
            >
              Click to Add us on Line
            </a>
          </div>
        </div>
        <div class="flex flex-col items-center justify-center mt-6 md:mt-0">
          <div class="bg-white p-4 rounded-2xl shadow-sm ring-1 ring-gray-100">
            <!-- QR Code Placeholder - In a real app, replace with an actual QR code image -->
            <div class="w-48 h-48 flex items-center justify-center rounded-lg">
              <img :src="LineQr" alt="Line QR code" />
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Footer -->
    <footer class="border-t border-gray-100 py-10 text-center text-sm text-gray-500">
      With love, Kaywalee & Supanat · 2026
    </footer>
  </main>
</template>

<style scoped>
@reference "tailwindcss";

.invited-section-background {
  background-image: url('@/assets/home-photo-1.JPG');
  background-size: cover;
  background-repeat: no-repeat;
  background-position: center;
  filter: grayscale(30%);
}

.countdown-background-container {
  position: absolute;
  width: 100vw;
}

.countdown-background {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.contact-container {
  width: 100vw;
}
.text-shadow-custom {
  text-shadow: 0 2px 4px rgba(255, 255, 255, 0.1);
}

.invited-section-background:before {
  @apply rounded-2xl bg-white/20 p-4 text-center shadow-sm ring-1 ring-black/5 backdrop-blur-md dark:bg-white/10 dark:ring-white/10;
  content: '';
  width: 100vw;
  height: 100%;
  position: absolute;
  z-index: 0;
  padding: 0;
}
</style>
