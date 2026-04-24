import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import SplashView from '@/views/SplashView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    }
    if (to.hash) {
      return {
        el: to.hash,
        behavior: 'smooth',
      }
    }
    return { top: 0 }
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
      path: '/about',
      name: 'about',
      component: () => import('../views/AboutView.vue'),
    },
    {
      path: '/gallery',
      name: 'gallery',
      component: () => import('../views/GalleryView.vue'),
    },
    {
      path: '/matchmaking',
      name: 'matchmaking',
      component: () => import('../views/MatchmakingView.vue'),
    },
    {
      path: '/matchmaking/board',
      name: 'matchmaking-board',
      component: () => import('../views/MatchmakingBoardView.vue'),
    },
    {
      path: '/matchmaking/moderate',
      name: 'matchmaking-moderate',
      component: () => import('../views/MatchmakingModerateView.vue'),
    },
    {
      path: '/lottery',
      name: 'lottery',
      component: () => import('../views/LotteryView.vue'),
    },
    {
      path: '/lottery/board',
      name: 'lottery-board',
      component: () => import('../views/LotteryBoardView.vue'),
    },
    {
      path: '/lottery/moderate',
      name: 'lottery-moderate',
      component: () => import('../views/LotteryModerateView.vue'),
    },
    // todo add video presentation
    // todo pre wedding photo
    // todo seat plan
  ],
})

export default router
