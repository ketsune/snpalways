import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import SplashView from '@/views/SplashView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  scrollBehavior(to, from, savedPosition) {
    // if (savedPosition) {
    //   return savedPosition
    // } else {
    //   return { top: 0 }
    // }
    return {top: 0}
  },
  routes: [
    {
      path: '/',
      name: 'landing',
      component: SplashView,
    },
    {
      path: '/home',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/rsvp',
      name: 'rsvp',
      component: () => import('../views/RsvpView.vue'),
    },
    {
      path: '/about',
      name: 'about',
      component: () => import('../views/AboutView.vue'),
    },
    // todo add video presentation
    // todo pre wedding photo
    // todo seat plan
    // todo link for RSVP
  ],
})

export default router
