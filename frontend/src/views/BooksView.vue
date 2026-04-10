<script setup>
import { onMounted, reactive, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { api } from '@/lib/api'

const books = ref([])
const categories = ref([])
const loading = ref(true)
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

async function loadCategories() {
  const { data } = await api.get('/categories', {
    params: {
      sort: 'name',
    },
  })

  categories.value = data.data
}

async function loadBooks(page = 1) {
  loading.value = true
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
    errorMessage.value = error.response?.data?.message || 'Unable to load the books page.'
  } finally {
    loading.value = false
  }
}

function resetFilters() {
  filters.q = ''
  filters.category_id = ''
  filters.sort = ''
}

watch(() => [filters.q, filters.category_id, filters.sort], () => loadBooks(1))

onMounted(async () => {
  await loadCategories()
  await loadBooks()
})
</script>

<template>
  <section class="page-section">
    <div class="section-heading">
      <div>
        <p class="eyebrow">Books</p>
        <h1>Browse the full collection</h1>
      </div>
      <button class="ghost-button" @click="resetFilters">Reset filters</button>
    </div>

    <div class="filters-card">
      <label class="field">
        <span>Search</span>
        <input v-model="filters.q" type="text" placeholder="Search by title, author, or category" />
      </label>

      <label class="field">
        <span>Category</span>
        <select v-model="filters.category_id">
          <option value="">All categories</option>
          <option v-for="category in categories" :key="category.id" :value="category.id">{{ category.name }}</option>
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

    <div v-if="loading" class="card muted">Loading books...</div>
    <div v-else-if="errorMessage" class="card error">{{ errorMessage }}</div>
    <div v-else-if="!books.length" class="card muted">No books match your current filters.</div>
    <div v-else class="book-grid">
      <article v-for="book in books" :key="book.id" class="book-card">
        <div class="book-cover" aria-hidden="true">
          <span>{{ book.title?.slice(0, 1) || 'B' }}</span>
        </div>
        <div class="book-topline">
          <span class="pill pill-neutral">{{ book.category?.name || 'Uncategorized' }}</span>
          <span :class="['pill', book.collection_status === 'available' ? 'pill-success' : 'pill-warn']">
            {{ book.collection_status }}
          </span>
        </div>
        <h3>{{ book.title }}</h3>
        <p class="book-author">{{ book.author || 'Unknown author' }}</p>
        <p class="book-description">{{ book.description || 'No description available for this book yet.' }}</p>
        <div class="book-meta">
          <span>{{ book.total_copies || 0 }} copies</span>
          <span>{{ book.consultation_count || 0 }} views</span>
        </div>
        <RouterLink class="secondary-button compact" :to="`/books/${book.id}`">View details</RouterLink>
      </article>
    </div>

    <div class="pagination-bar">
      <button class="ghost-button" :disabled="pagination.current_page <= 1 || loading" @click="loadBooks(pagination.current_page - 1)">
        Previous
      </button>
      <span>Page {{ pagination.current_page }} of {{ pagination.last_page }}</span>
      <button class="ghost-button" :disabled="pagination.current_page >= pagination.last_page || loading" @click="loadBooks(pagination.current_page + 1)">
        Next
      </button>
    </div>
  </section>
</template>
