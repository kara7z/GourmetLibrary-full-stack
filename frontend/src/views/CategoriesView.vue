<script setup>
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { api } from '@/lib/api'

const categories = ref([])
const loading = ref(true)
const errorMessage = ref('')

const featuredCategories = computed(() => categories.value)
const maxBooksCount = computed(() => Math.max(...categories.value.map((item) => item.books_count || 0), 1))

function widthFor(count) {
  return `${Math.max(18, Math.round(((count || 0) / maxBooksCount.value) * 100))}%`
}

async function loadCategories() {
  loading.value = true
  errorMessage.value = ''

  try {
    const { data } = await api.get('/categories', {
      params: {
        with_books_count: true,
        sort: 'name',
      },
    })
    categories.value = data.data
  } catch (error) {
    errorMessage.value = error.response?.data?.message || 'Unable to load categories.'
  } finally {
    loading.value = false
  }
}

onMounted(loadCategories)
</script>

<template>
  <section class="page-section">
    <div class="section-heading">
      <div>
        <p class="eyebrow">Categories</p>
        <h1>Browse the collection by theme</h1>
      </div>
    </div>

    <div v-if="loading" class="card muted">Loading categories...</div>
    <div v-else-if="errorMessage" class="card error">{{ errorMessage }}</div>

    <div v-else class="category-grid">
      <article v-for="category in featuredCategories" :key="category.id" class="category-card">
        <p class="category-count">{{ category.books_count || 0 }} books</p>
        <h2>{{ category.name }}</h2>
        <p>{{ category.description || 'This category is ready for new titles and recommendations.' }}</p>
        <div class="category-meter">
          <span class="category-meter-fill" :style="{ width: widthFor(category.books_count) }"></span>
        </div>
        <RouterLink class="secondary-button compact" :to="`/categories/${category.id}`">Open category</RouterLink>
      </article>
    </div>
  </section>
</template>
