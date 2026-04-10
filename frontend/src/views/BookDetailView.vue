<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { api } from '@/lib/api'
import { isAuthenticated } from '@/stores/session'

const route = useRoute()
const book = ref(null)
const loading = ref(true)
const errorMessage = ref('')
const borrowMessage = ref('')
const borrowBusy = ref(false)

const formattedDate = computed(() => {
  if (!book.value?.publication_date) {
    return 'Unknown publication date'
  }

  return new Date(book.value.publication_date).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
})

async function loadBook() {
  loading.value = true
  errorMessage.value = ''
  borrowMessage.value = ''

  try {
    const { data } = await api.get(`/books/${route.params.id}`)
    book.value = data
  } catch (error) {
    errorMessage.value = error.response?.data?.message || 'Unable to load this book right now.'
  } finally {
    loading.value = false
  }
}

async function borrowBook() {
  borrowBusy.value = true
  borrowMessage.value = ''

  try {
    const { data } = await api.post(`/books/${route.params.id}/borrow`)
    borrowMessage.value = data.message
    if (book.value) {
      book.value.borrow_count = (book.value.borrow_count || 0) + 1
    }
  } catch (error) {
    borrowMessage.value = error.response?.data?.message || 'Borrowing failed.'
  } finally {
    borrowBusy.value = false
  }
}

watch(() => route.params.id, loadBook)
onMounted(loadBook)
</script>

<template>
  <section class="detail-page">
    <div v-if="loading" class="card muted">Loading book details...</div>
    <div v-else-if="errorMessage" class="card error">{{ errorMessage }}</div>

    <article v-else-if="book" class="detail-layout">
      <div class="hero-card">
        <p class="eyebrow">Book spotlight</p>
        <h1>{{ book.title }}</h1>
        <p class="lead">{{ book.description || 'No description was added for this title yet.' }}</p>

        <div class="meta-grid">
          <div class="meta-item">
            <span>Author</span>
            <strong>{{ book.author || 'Unknown author' }}</strong>
          </div>
          <div class="meta-item">
            <span>Category</span>
            <strong>{{ book.category?.name || 'Uncategorized' }}</strong>
          </div>
          <div class="meta-item">
            <span>Published</span>
            <strong>{{ formattedDate }}</strong>
          </div>
          <div class="meta-item">
            <span>Borrowed</span>
            <strong>{{ book.borrow_count || 0 }} times</strong>
          </div>
        </div>
      </div>

      <aside class="action-card">
        <p class="eyebrow">Reader actions</p>
        <h2>Take this book home</h2>
        <p>
          Sign in to borrow this title and keep track of its return status from your personal dashboard.
        </p>
        <button :disabled="!isAuthenticated || borrowBusy" class="primary-button" @click="borrowBook">
          {{ borrowBusy ? 'Borrowing...' : 'Borrow This Book' }}
        </button>
        <p v-if="!isAuthenticated" class="hint">You need an account before you can borrow books.</p>
        <p v-if="borrowMessage" class="status-line">{{ borrowMessage }}</p>
      </aside>
    </article>
  </section>
</template>
