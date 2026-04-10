<script setup>
import { computed, onMounted, ref } from 'vue'
import { api } from '@/lib/api'

const categories = ref([])
const loading = ref(true)
const errorMessage = ref('')

const featuredCategories = computed(() => categories.value.slice(0, 6))

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
      </article>
    </div>
  </section>
</template>
