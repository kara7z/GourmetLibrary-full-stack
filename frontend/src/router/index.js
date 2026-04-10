import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import CategoriesView from '../views/CategoriesView.vue'
import BookDetailView from '../views/BookDetailView.vue'
import BorrowsView from '../views/BorrowsView.vue'
import AdminView from '../views/AdminView.vue'
import AuthView from '../views/AuthView.vue'
import { isAdmin, isAuthenticated } from '../stores/session'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/categories',
      name: 'categories',
      component: CategoriesView,
    },
    {
      path: '/books/:id',
      name: 'book-detail',
      component: BookDetailView,
    },
    {
      path: '/auth',
      name: 'auth',
      component: AuthView,
    },
    {
      path: '/borrows',
      name: 'borrows',
      component: BorrowsView,
      meta: { requiresAuth: true },
    },
    {
      path: '/admin',
      name: 'admin',
      component: AdminView,
      meta: { requiresAuth: true, requiresAdmin: true },
    },
  ],
})

router.beforeEach((to) => {
  if (to.meta.requiresAuth && !isAuthenticated.value) {
    return { name: 'auth' }
  }

  if (to.meta.requiresAdmin && !isAdmin.value) {
    return { name: 'home' }
  }

  return true
})

export default router
