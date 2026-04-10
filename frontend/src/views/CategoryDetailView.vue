<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { api } from '@/lib/api'

const route = useRoute()
const category = ref(null)
const loading = ref(true)
const errorMessage = ref('')

const books = computed(() => category.value?.books || [])

async function loadCategory() {
  loading.value = true
  errorMessage.value = ''

  try {
    const { data } = await api.get(`/categories/${route.params.id}`, {
      params: {
        with_books: true,
      },
    })
    category.value = data
  } catch (error) {
    errorMessage.value = error.response?.data?.message || 'Unable to load this category.'
  } finally {
    loading.value = false
  }
}

watch(() => route.params.id, loadCategory)
onMounted(loadCategory)
</script>

<template>
  <section class="page-section">
    <div v-if="loading" class="card muted">Loading category details...</div>
    <div v-else-if="errorMessage" class="card error">{{ errorMessage }}</div>

    <template v-else-if="category">
      <div class="hero-card">
        <p class="eyebrow">Category Shelf</p>
        <h1>{{ category.name }}</h1>
        <p class="lead">
          {{ category.description || 'This category is ready to guide readers toward their next discovery.' }}
        </p>
      </div>

      <section class="catalog-section">
        <div class="section-heading">
          <div>
            <p class="eyebrow">Included Books</p>
            <h2>{{ books.length }} title{{ books.length === 1 ? '' : 's' }} in this category</h2>
          </div>
        </div>

        <div v-if="!books.length" class="card muted">No books are listed in this category yet.</div>

        <div v-else class="book-grid">
          <article v-for="book in books" :key="book.id" class="book-card">
            <div class="book-cover" aria-hidden="true">
              <span>{{ book.title?.slice(0, 1) || 'B' }}</span>
            </div>
            <div class="book-topline">
              <span class="pill pill-neutral">{{ category.name }}</span>
              <span v-if="book.is_new_arrival" class="pill pill-accent">New arrival</span>
            </div>
            <h3>{{ book.title }}</h3>
            <p class="book-author">{{ book.author || 'Unknown author' }}</p>
            <p class="book-description">{{ book.description || 'No description available for this book yet.' }}</p>
            <div class="book-meta">
              <span>{{ book.total_copies || 0 }} copies</span>
              <span>{{ book.damaged_quantity || 0 }} damaged</span>
            </div>
            <RouterLink class="secondary-button compact" :to="`/books/${book.id}`">View details</RouterLink>
          </article>
        </div>
      </section>
    </template>
  </section>
</template>
