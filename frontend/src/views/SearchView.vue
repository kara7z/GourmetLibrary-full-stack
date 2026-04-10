<script setup>
import { computed, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { api } from '@/lib/api'

const query = ref('')
const loading = ref(false)
const suggestionLoading = ref(false)
const errorMessage = ref('')
const hasSearched = ref(false)
const books = ref([])
const suggestions = ref([])

let suggestionTimer = null

const showSuggestions = computed(() => query.value.trim().length > 0 && suggestions.value.length > 0)

async function searchBooks() {
  loading.value = true
  errorMessage.value = ''
  hasSearched.value = true

  try {
    const { data } = await api.get('/books', {
      params: {
        q: query.value || undefined,
      },
    })

    books.value = data.data
  } catch (error) {
    errorMessage.value = error.response?.data?.message || 'Search failed.'
  } finally {
    loading.value = false
  }
}

async function loadSuggestions() {
  const trimmedQuery = query.value.trim()

  if (!trimmedQuery) {
    suggestions.value = []
    return
  }

  suggestionLoading.value = true

  try {
    const { data } = await api.get('/books', {
      params: {
        q: trimmedQuery,
      },
    })

    suggestions.value = data.data.slice(0, 5)
  } catch (error) {
    suggestions.value = []
  } finally {
    suggestionLoading.value = false
  }
}

function applySuggestion(title) {
  query.value = title
  suggestions.value = []
  searchBooks()
}

watch(query, () => {
  if (suggestionTimer) {
    clearTimeout(suggestionTimer)
  }

  if (!query.value.trim()) {
    suggestions.value = []
    return
  }

  suggestionTimer = setTimeout(() => {
    loadSuggestions()
  }, 250)
})
</script>

<template>
  <section class="page-section">
    <div class="hero-card">
      <p class="eyebrow">Search</p>
      <h1>Find your next cookbook</h1>
      <p class="lead">Search by title, author, or category name.</p>

      <form class="search-bar" @submit.prevent="searchBooks">
        <input v-model="query" type="text" placeholder="Try: pâtisserie, dupont, méditerranéenne..." />
        <button class="primary-button">Search</button>
      </form>

      <div v-if="suggestionLoading" class="search-suggestions muted">Looking for matches...</div>
      <div v-else-if="showSuggestions" class="search-suggestions">
        <button
          v-for="book in suggestions"
          :key="book.id"
          class="search-suggestion-item"
          type="button"
          @click="applySuggestion(book.title)"
        >
          <strong>{{ book.title }}</strong>
          <span>{{ book.author || 'Unknown author' }}</span>
        </button>
      </div>
    </div>

    <div v-if="loading" class="card muted">Searching the collection...</div>
    <div v-else-if="errorMessage" class="card error">{{ errorMessage }}</div>
    <div v-else-if="hasSearched && !books.length" class="card muted">No books matched your search.</div>

    <div v-else-if="books.length" class="book-grid">
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
  </section>
</template>
