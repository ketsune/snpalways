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
    // hunt routes temporarily disabled
    // { path: '/hunt', name: 'hunt', component: () => import('../views/HuntView.vue') },
    // { path: '/hunt/board', name: 'hunt-board', component: () => import('../views/HuntBoardView.vue') },
    // { path: '/hunt/moderate', name: 'hunt-moderate', component: () => import('../views/HuntModerateView.vue') },
    {
      path: '/table',
      name: 'table',
      component: () => import('../views/TableView.vue'),
    },
    {
      path: '/table/moderate',
      name: 'table-moderate',
      component: () => import('../views/TableModerateView.vue'),
    },
    // todo add video presentation
    // todo pre wedding photo
  ],
})

export default router
