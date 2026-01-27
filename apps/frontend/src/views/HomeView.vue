<script setup lang="ts">
// Wedding landing page – no complex logic required
import CountdownTimer from '../components/CountdownTimer.vue'
import VenueCarousel from '../components/VenueCarousel.vue'
import SectionDivider from '../components/SectionDivider.vue'
import LineQr from '@/assets/line-qr.png'
import DressCodeMale from '@/assets/dress-code-male.jpeg'
import DressCodeFemale from '@/assets/dress-code-female.jpeg'
import { ref, onMounted, onUnmounted } from 'vue'
import InvitationCard from '@/components/InvitationCard.vue'

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

const isModalOpen = ref(false)

const closeModal = () => {
  isModalOpen.value = false
}

const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Escape' && isModalOpen.value) {
    closeModal()
  }
}

onMounted(() => {
  // Open modal only if we came from SplashView (indicated by history state)
  if (window.history.state?.fromSplash) {
    isModalOpen.value = true
  }

  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <main class="min-h-screen bg-off-white text-gray-800">
    <section
      class="flex justify-center items-center relative isolate overflow-hidden invited-section-background min-h-screen md:min-h-[48.5rem]"
    >
      <div
        class="mx-4 md:mx-auto max-w-md md:max-w-5xl p-4 text-center z-1 text-shadow-custom custom-glass-morphism max-h-fit"
      >
        <p
          class="text-sm uppercase tracking-[0.3em] text-rose-600 text-shadow-white-custom !font-bold"
        >
          You're invited to the wedding of
        </p>
        <h1 class="font-cookie mt-2 md:mt-4 text-6xl md:text-8xl text-white py-4">
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
          <button
            @click="isModalOpen = true"
            class="inline-flex items-center rounded-full border border-rose-200 px-4 py-1 md:px-6 md:py-3 text-rose-700 bg-rose-50 hover:bg-rose-200 cursor-pointer"
          >
            Invitation Card
          </button>
        </div>
      </div>
    </section>

    <section id="details" class="mt-6 md:mt-10">
      <SectionDivider />
    </section>

    <!-- Countdown -->
    <section
      class="flex justify-center mt-8 md:mt-12 items-center min-h-screen md:min-h-[calc(100vh*(3/4))] countdown-background-container"
    >
      <div class="w-full px-4">
        <CountdownTimer :target="weddingDate" title="Countdown" />
      </div>
    </section>

    <section class="mt-8 md:mt-12">
      <SectionDivider />
    </section>

    <!-- Schedule -->
    <section
      class="flex justify-center items-center mt-8 md:mt-12 min-h-screen md:min-h-[calc(100vh*(3/4))] schedule-background-container"
    >
      <div class="grid gap-4 mx-auto max-w-5xl p-4">
        <button class="w-fit text-2xl font-semibold p-2 rounded-2xl schedule-button opacity-80">
          Schedule
        </button>
        <div class="custom-glass-morphism">
          <div class="grid gap-4 md:grid-cols-2">
            <div class="text-left rounded-xl p-4 custom-glass-morphism-level-two">
              <p class="text-sm text-gray-500">13.00</p>
              <p class="mt-1 font-medium text-gray-900">งานพิธีการ</p>
              <p class="text-gray-600">เริ่มตั้งขบวนแห่ขันหมาก ขอเรียนเชิญแขกผู้มีเกียรติทุกท่าน</p>
            </div>
            <div class="text-left rounded-xl p-4 custom-glass-morphism-level-two">
              <p class="text-sm text-gray-500">15.30</p>
              <p class="mt-1 font-medium text-gray-900">จบงานพิธีการ</p>
              <p class="text-gray-600">สามารถพักผ่อนภายในสถานที่จัดงาน หรือคาเฟ่ใกล้เคียงได้</p>
            </div>
            <div class="text-left rounded-xl p-4 custom-glass-morphism-level-two">
              <p class="text-sm text-gray-500">17.30</p>
              <p class="mt-1 font-medium text-gray-900">พิธีฉลองมงคลสมรส</p>
              <p class="text-gray-600">
                แขกผู้มีเกียรติลงทะเบียน รับของชำร่วย
                และสามารถร่วมกิจกรรมภายในงานที่พวกเราเตรียมไว้ให้
              </p>
            </div>
            <div class="text-left rounded-xl p-4 custom-glass-morphism-level-two">
              <p class="text-sm text-gray-500">18.00</p>
              <p class="mt-1 font-medium text-gray-900">รับประทานอาหารร่วมกัน</p>
              <p class="text-gray-600">เริ่มเสิร์ฟอาหาร</p>
            </div>
            <div class="text-left rounded-xl p-4 custom-glass-morphism-level-two">
              <p class="text-sm text-gray-500">22.00</p>
              <p class="mt-1 font-medium text-gray-900">งานจบ</p>
              <p class="text-gray-600">
                พวกเราขออนุญาตไปพักผ่อน
                <br />
                เอ๊ะ ! แต่จะมีต่อไหมนะ ?
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="mt-8 md:mt-12">
      <SectionDivider />
    </section>

    <section id="dress-code flex justify-center bg-gray-50/50 mt-8 md:mt-12">
      <div class="dress-code-container">
        <div class="grid md:grid-cols-2 mx-auto my-4 gap-4 p-4">
          <div class="p-4 md:my-8 custom-glass-morphism">
            <img class="rounded-2xl" :src="DressCodeFemale" alt="female dress code" />
          </div>
          <div class="p-4 md:my-8 custom-glass-morphism">
            <img class="rounded-2xl" :src="DressCodeMale" alt="male dress code" />
          </div>
        </div>
      </div>
    </section>

    <section class="mt-8 md:mt-12">
      <SectionDivider />
    </section>

    <!-- Venue -->
    <section
      id="venue"
      class="flex justify-center items-center mx-auto p-4 min-h-[600px] mt-8 md:mt-12 venue-background-container"
    >
      <div class="w-full max-w-5xl grid items-stretch gap-4 md:grid-cols-2">
        <div class="flex flex-col p-4 h-auto my-auto custom-glass-morphism text-left">
          <h2 class="text-2xl font-semibold text-gray-900">Venue</h2>
          <p class="text-gray-600">Ray Venue, Nonthaburi</p>
          <iframe
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
        <div class="h-full p-4 custom-glass-morphism">
          <VenueCarousel :images="venueImages" />
        </div>
      </div>
    </section>

    <section class="mt-8 md:mt-12">
      <SectionDivider />
    </section>

    <!-- Pre-wedding Photo Section -->
    <section
      class="flex justify-center items-center text-center min-h-screen home-gallery-container mt-6 md:mt-10"
    >
      <div class="custom-glass-morphism p-4">
        <h2 class="font-cookie text-5xl md:text-6xl text-rose-600 text-shadow-white-custom mb-8">
          Our Memories
        </h2>
        <div class="mt-10">
          <router-link
            to="/gallery"
            class="inline-flex items-center rounded-full bg-rose-600 px-8 py-3 text-white shadow hover:bg-rose-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 transition-colors"
          >
            View Full Gallery
          </router-link>
        </div>
      </div>
    </section>

    <section class="mt-8 md:mt-12">
      <SectionDivider />
    </section>

    <section
      id="contact"
      class="flex justify-center bg-gray-50/50 mt-8 md:mt-12 contact-background-container"
    >
      <div
        class="contact-container md:flex mx-auto max-w-5xl px-4 py-12 md:py-16 text-center justify-between"
      >
        <div class="flex flex-col justify-center items-start custom-glass-morphism p-4">
          <h2 class="text-2xl text-left font-semibold text-white">Contact Us</h2>
          <p class="text-off-white text-left md:text-nowrap">
            If you have any questions, feel free to reach out to us via Line.
          </p>
          <div class="flex justify-center w-full md:justify-start">
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
        <div
          class="flex flex-col items-center justify-center mt-6 md:mt-0 custom-glass-morphism p-4"
        >
          <div class="bg-white p-4 rounded-2xl shadow-sm ring-1 ring-gray-100">
            <!-- QR Code Placeholder - In a real app, replace with an actual QR code image -->
            <div class="w-48 h-48 flex items-center justify-center rounded-lg">
              <img :src="LineQr" alt="Line QR code" />
            </div>
          </div>
        </div>
      </div>
    </section>

    <Teleport to="body">
      <Transition
        enter-active-class="transition duration-300 ease-out"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition duration-200 ease-in"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div
          v-if="isModalOpen"
          class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          @click="closeModal"
        >
          <div
            class="relative max-w-lg w-full h-full custom-glass-morphism"
            @click.stop
          >
            <button
              @click="closeModal"
              class="absolute top-4 right-4 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-black/20 text-white hover:bg-black/40 transition-colors cursor-pointer"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
            <InvitationCard />
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Footer -->
    <footer class="border-t border-gray-100 py-10 text-center text-sm text-gray-500">
      With love, Kaywalee & Supanat · 2026
    </footer>
  </main>
</template>

<style scoped>
@reference "tailwindcss";

.font-cookie {
  font-family: 'Cookie', cursive;
}

.invited-section-background {
  background-image: url('@/assets/home-photo-1.JPG');
  background-size: cover;
  background-repeat: no-repeat;
  background-position: center;
  filter: grayscale(30%);
}

.countdown-background-container {
  background-image: url('@/assets/home-photo-2.JPG');
  background-repeat: no-repeat;
  background-size: cover;
  background-position: center;
  width: 100vw;
}

.schedule-background-container {
  background-image: url('@/assets/home-photo-3.JPG');
  background-repeat: no-repeat;
  background-size: cover;
  background-position: center;
  width: 100vw;
}

.contact-background-container {
  background-image: url('@/assets/home-photo-4.JPG');
  background-repeat: no-repeat;
  background-size: cover;
  background-position: center;
  width: 100vw;
}

.venue-background-container {
  background-image: url('@/assets/ray-venue-front-virtual.jpg');
  background-repeat: no-repeat;
  background-size: cover;
  background-position: center;
  width: 100vw;
}

.schedule-button {
  position: relative;
  color: black;
  mix-blend-mode: screen;
  outline: none;
  background: none;
  border: none;
}

.schedule-button::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  height: 3rem;
  width: 7rem;
  border-radius: 1rem;
  background-color: white;
  mix-blend-mode: color-burn;
}

.dress-code-container {
  width: 100vw;
  background-image: url('@/assets/ray-venue-front.jpg');
  background-repeat: no-repeat;
  background-size: cover;
  background-position: center;
}

.custom-glass-morphism > img {
  box-shadow: 0 0 8px 4px white;
}

.contact-container {
  width: 100vw;
}

.text-shadow-custom {
  text-shadow: 0 2px 4px rgba(255, 255, 255, 0.1);
}

.text-shadow-white-custom {
  text-shadow: 0 1px 4px white;
}

@media (orientation: landscape) {
  .home-gallery-container {
    background-image: url('@/assets/home-gallery-landscape.jpeg');
    background-repeat: no-repeat;
    background-size: cover;
    background-position: center;
  }
}

@media (orientation: portrait) {
  .home-gallery-container {
    background-image: url('@/assets/home-gallery-portrait.jpeg');
    background-repeat: no-repeat;
    background-size: cover;
    background-position: center;
  }
}
</style>
