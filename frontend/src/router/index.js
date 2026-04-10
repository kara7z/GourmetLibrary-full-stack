import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import BooksView from '../views/BooksView.vue'
import CategoriesView from '../views/CategoriesView.vue'
import CategoryDetailView from '../views/CategoryDetailView.vue'
import BookDetailView from '../views/BookDetailView.vue'
import BorrowsView from '../views/BorrowsView.vue'
import AdminView from '../views/AdminView.vue'
import AuthView from '../views/AuthView.vue'
import SearchView from '../views/SearchView.vue'
import ForbiddenView from '../views/ForbiddenView.vue'
import NotFoundView from '../views/NotFoundView.vue'
import ServerErrorView from '../views/ServerErrorView.vue'
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
      path: '/books',
      name: 'books',
      component: BooksView,
    },
    {
      path: '/categories',
      name: 'categories',
      component: CategoriesView,
    },
    {
      path: '/categories/:id',
      name: 'category-detail',
      component: CategoryDetailView,
    },
    {
      path: '/books/:id',
      name: 'book-detail',
      component: BookDetailView,
    },
    {
      path: '/search',
      name: 'search',
      component: SearchView,
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
    {
      path: '/403',
      name: 'forbidden',
      component: ForbiddenView,
    },
    {
      path: '/500',
      name: 'server-error',
      component: ServerErrorView,
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: NotFoundView,
    },
  ],
})

router.beforeEach((to) => {
  if (to.meta.requiresAuth && !isAuthenticated.value) {
    return { name: 'auth' }
  }

  if (to.meta.requiresAdmin && !isAdmin.value) {
    return { name: 'forbidden' }
  }

  return true
})

export default router
