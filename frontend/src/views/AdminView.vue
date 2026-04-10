<script setup>
import { onMounted, ref } from 'vue'
import { api } from '@/lib/api'

const stats = ref(null)
const loading = ref(true)
const errorMessage = ref('')

async function loadStats() {
  loading.value = true
  errorMessage.value = ''

  try {
    const { data } = await api.get('/admin/stats')
    stats.value = data
  } catch (error) {
    errorMessage.value = error.response?.data?.message || 'Unable to load admin statistics.'
  } finally {
    loading.value = false
  }
}

onMounted(loadStats)
</script>

<template>
  <section class="page-section">
    <div class="section-heading">
      <div>
        <p class="eyebrow">Admin</p>
        <h1>Collection health at a glance</h1>
      </div>
    </div>

    <div v-if="loading" class="card muted">Loading stats...</div>
    <div v-else-if="errorMessage" class="card error">{{ errorMessage }}</div>

    <div v-else-if="stats" class="admin-layout">
      <div class="stats-grid">
        <article class="stat-card">
          <span>Total books</span>
          <strong>{{ stats.overview.total_books }}</strong>
        </article>
        <article class="stat-card">
          <span>Total categories</span>
          <strong>{{ stats.overview.total_categories }}</strong>
        </article>
        <article class="stat-card">
          <span>Damaged copies</span>
          <strong>{{ stats.overview.total_damaged_copies }}</strong>
        </article>
      </div>

      <div class="dashboard-grid">
        <article class="card">
          <h2>Most borrowed</h2>
          <ul class="rank-list">
            <li v-for="book in stats.most_borrowed_books" :key="book.id">
              <span>{{ book.title }}</span>
              <strong>{{ book.borrow_count }}</strong>
            </li>
          </ul>
        </article>

        <article class="card">
          <h2>Most consulted</h2>
          <ul class="rank-list">
            <li v-for="book in stats.most_consulted_books" :key="book.id">
              <span>{{ book.title }}</span>
              <strong>{{ book.consultation_count }}</strong>
            </li>
          </ul>
        </article>

        <article class="card">
          <h2>Category volume</h2>
          <ul class="rank-list">
            <li v-for="category in stats.categories_by_book_count" :key="category.id">
              <span>{{ category.name }}</span>
              <strong>{{ category.books_count }}</strong>
            </li>
          </ul>
        </article>

        <article class="card">
          <h2>Damaged books</h2>
          <ul class="rank-list">
            <li v-for="book in stats.damaged_books" :key="book.id">
              <span>{{ book.title }}</span>
              <strong>{{ book.damaged_quantity }}</strong>
            </li>
          </ul>
        </article>
      </div>
    </div>
  </section>
</template>
