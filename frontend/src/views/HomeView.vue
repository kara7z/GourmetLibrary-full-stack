<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { api } from '@/lib/api'
import { isAuthenticated, session } from '@/stores/session'

const apiMessage = ref('Connecting to the library...')
const books = ref([])
const categories = ref([])
const loadingBooks = ref(true)
const errorMessage = ref('')
const pagination = reactive({
  current_page: 1,
  last_page: 1,
})

const filters = reactive({
  q: '',
  category_id: '',
  sort: '',
})

const heroStats = computed(() => [
  {
    label: 'Signed in as',
    value: session.user?.role || 'guest',
  },
  {
    label: 'Visible books',
    value: books.value.length,
  },
  {
    label: 'Available categories',
    value: categories.value.length,
  },
])

async function loadMessage() {
  try {
    const { data } = await api.get('/message')
    apiMessage.value = data.message
  } catch (error) {
    apiMessage.value = 'Backend connection not available yet.'
  }
}

async function loadCategories() {
  try {
    const { data } = await api.get('/categories', {
      params: {
        sort: 'name',
      },
    })
    categories.value = data.data
  } catch (error) {
    console.warn('Unable to preload categories.', error)
  }
}

async function loadBooks(page = 1) {
  loadingBooks.value = true
  errorMessage.value = ''

  try {
    const { data } = await api.get('/books', {
      params: {
        page,
        q: filters.q || undefined,
        category_id: filters.category_id || undefined,
        sort: filters.sort || undefined,
      },
    })

    books.value = data.data
    pagination.current_page = data.current_page
    pagination.last_page = data.last_page
  } catch (error) {
    errorMessage.value = error.response?.data?.message || 'Unable to load books.'
  } finally {
    loadingBooks.value = false
  }
}

function resetFilters() {
  filters.q = ''
  filters.category_id = ''
  filters.sort = ''
}

watch(() => [filters.q, filters.category_id, filters.sort], () => loadBooks(1))
onMounted(async () => {
  await Promise.all([loadMessage(), loadCategories()])
  await loadBooks()
})
</script>

<template>
  <section class="home-page">
    <div class="hero-panel">
      <div class="hero-copy">
        <p class="eyebrow">Digital Reading Room</p>
        <h1>Bring your Laravel library to life with a polished Vue frontend.</h1>
        <p class="lead">
          Search books, filter by category, borrow titles with your account, and monitor library activity from one place.
        </p>

        <div class="hero-actions">
          <RouterLink class="primary-button" to="/categories">Explore Categories</RouterLink>
          <RouterLink v-if="!isAuthenticated" class="secondary-button" to="/auth">Create Reader Account</RouterLink>
          <RouterLink v-else class="secondary-button" to="/borrows">Open My Borrows</RouterLink>
        </div>
      </div>

      <aside class="hero-aside">
        <p class="status-banner">{{ apiMessage }}</p>
        <div class="stats-grid compact-grid">
          <article v-for="item in heroStats" :key="item.label" class="stat-card">
            <span>{{ item.label }}</span>
            <strong>{{ item.value }}</strong>
          </article>
        </div>
      </aside>
    </div>

    <section class="catalog-section">
      <div class="section-heading">
        <div>
          <p class="eyebrow">Catalog</p>
          <h2>Search the current collection</h2>
        </div>
        <button class="ghost-button" @click="resetFilters">Reset filters</button>
      </div>

      <div class="filters-card">
        <label class="field">
          <span>Search</span>
          <input v-model="filters.q" type="text" placeholder="Title, author, or category" />
        </label>

        <label class="field">
          <span>Category</span>
          <select v-model="filters.category_id">
            <option value="">All categories</option>
            <option v-for="category in categories" :key="category.id" :value="category.id">
              {{ category.name }}
            </option>
          </select>
        </label>

        <label class="field">
          <span>Sort</span>
          <select v-model="filters.sort">
            <option value="">Recommended</option>
            <option value="popular">Most borrowed</option>
            <option value="new">Newest</option>
          </select>
        </label>
      </div>

      <div v-if="loadingBooks" class="card muted">Loading books...</div>
      <div v-else-if="errorMessage" class="card error">{{ errorMessage }}</div>
      <div v-else class="book-grid">
        <article v-for="book in books" :key="book.id" class="book-card">
          <div class="book-topline">
            <span class="pill pill-neutral">{{ book.category?.name || 'Uncategorized' }}</span>
            <span v-if="book.is_new_arrival" class="pill pill-accent">New arrival</span>
          </div>
          <h3>{{ book.title }}</h3>
          <p class="book-author">{{ book.author || 'Unknown author' }}</p>
          <p class="book-description">{{ book.description || 'No description available for this book yet.' }}</p>
          <div class="book-meta">
            <span>{{ book.borrow_count || 0 }} borrows</span>
            <span>{{ book.consultation_count || 0 }} views</span>
          </div>
          <RouterLink class="secondary-button compact" :to="`/books/${book.id}`">View details</RouterLink>
        </article>
      </div>

      <div class="pagination-bar">
        <button
          class="ghost-button"
          :disabled="pagination.current_page <= 1 || loadingBooks"
          @click="loadBooks(pagination.current_page - 1)"
        >
          Previous
        </button>
        <span>Page {{ pagination.current_page }} of {{ pagination.last_page }}</span>
        <button
          class="ghost-button"
          :disabled="pagination.current_page >= pagination.last_page || loadingBooks"
          @click="loadBooks(pagination.current_page + 1)"
        >
          Next
        </button>
      </div>
    </section>
  </section>
</template>
