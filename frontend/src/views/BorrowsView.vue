<script setup>
import { onMounted, ref } from 'vue'
import { api } from '@/lib/api'

const borrows = ref([])
const loading = ref(true)
const errorMessage = ref('')
const actionMessage = ref('')
const busyBorrowId = ref(null)

function formatDate(value) {
  if (!value) {
    return 'Not returned yet'
  }

  return new Date(value).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

async function loadBorrows() {
  loading.value = true
  errorMessage.value = ''

  try {
    const { data } = await api.get('/borrows')
    borrows.value = data.data
  } catch (error) {
    errorMessage.value = error.response?.data?.message || 'Unable to load your borrowing history.'
  } finally {
    loading.value = false
  }
}

async function returnBook(borrowId) {
  busyBorrowId.value = borrowId
  actionMessage.value = ''

  try {
    const { data } = await api.patch(`/borrows/${borrowId}/return`)
    actionMessage.value = data.message

    const target = borrows.value.find((item) => item.id === borrowId)
    if (target) {
      target.status = data.borrow.status
      target.returned_at = data.borrow.returned_at
    }
  } catch (error) {
    actionMessage.value = error.response?.data?.message || 'Unable to return this book.'
  } finally {
    busyBorrowId.value = null
  }
}

onMounted(loadBorrows)
</script>

<template>
  <section class="page-section">
    <div class="section-heading">
      <div>
        <p class="eyebrow">Your Borrows</p>
        <h1>Reader activity and returns</h1>
      </div>
    </div>

    <p v-if="actionMessage" class="status-banner">{{ actionMessage }}</p>
    <div v-if="loading" class="card muted">Loading your borrows...</div>
    <div v-else-if="errorMessage" class="card error">{{ errorMessage }}</div>

    <div v-else class="borrow-list">
      <article v-for="borrow in borrows" :key="borrow.id" class="borrow-card">
        <div>
          <p class="eyebrow">{{ borrow.book?.category?.name || 'Library item' }}</p>
          <h2>{{ borrow.book?.title }}</h2>
          <p>{{ borrow.book?.author || 'Unknown author' }}</p>
          <p class="borrow-dates">
            Borrowed {{ formatDate(borrow.borrowed_at || borrow.created_at) }} • Returned {{ formatDate(borrow.returned_at) }}
          </p>
        </div>

        <div class="borrow-actions">
          <span :class="['pill', borrow.status === 'returned' ? 'pill-neutral' : 'pill-accent']">
            {{ borrow.status }}
          </span>
          <button
            v-if="borrow.status !== 'returned'"
            :disabled="busyBorrowId === borrow.id"
            class="secondary-button"
            @click="returnBook(borrow.id)"
          >
            {{ busyBorrowId === borrow.id ? 'Returning...' : 'Return Book' }}
          </button>
        </div>
      </article>
    </div>
  </section>
</template>
