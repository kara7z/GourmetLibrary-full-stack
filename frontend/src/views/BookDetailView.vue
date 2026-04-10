<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { api } from '@/lib/api'
import { isAdmin, isAuthenticated } from '@/stores/session'

const VIEWED_BOOKS_KEY = 'gourmet-library-viewed-books'

const route = useRoute()
const router = useRouter()
const book = ref(null)
const loading = ref(true)
const errorMessage = ref('')
const borrowMessage = ref('')
const borrowBusy = ref(false)
const adminMessage = ref('')
const adminBusy = ref(false)
const deleteBusy = ref(false)
const categories = ref([])

const adminForm = reactive({
  title: '',
  author: '',
  description: '',
  publication_date: '',
  category_id: '',
  total_copies: 1,
  damaged_quantity: 0,
  is_new_arrival: false,
})

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

const canBorrow = computed(() => (book.value?.available_copies || 0) > 0)
const collectionTone = computed(() => {
  if (!book.value) {
    return ''
  }

  return book.value.collection_status === 'available' ? 'pill-success' : 'pill-warn'
})

function syncAdminForm() {
  if (!book.value) {
    return
  }

  adminForm.title = book.value.title || ''
  adminForm.author = book.value.author || ''
  adminForm.description = book.value.description || ''
  adminForm.publication_date = book.value.publication_date || ''
  adminForm.category_id = book.value.category_id || ''
  adminForm.total_copies = book.value.total_copies || 1
  adminForm.damaged_quantity = book.value.damaged_quantity || 0
  adminForm.is_new_arrival = Boolean(book.value.is_new_arrival)
}

async function loadCategories() {
  if (!isAdmin.value) {
    return
  }

  try {
    const { data } = await api.get('/categories', {
      params: {
        sort: 'name',
      },
    })
    categories.value = data.data
  } catch (error) {
    console.warn('Unable to load categories for admin editing.', error)
  }
}

async function loadBook() {
  loading.value = true
  errorMessage.value = ''
  borrowMessage.value = ''
  adminMessage.value = ''

  try {
    const viewedBooks = JSON.parse(localStorage.getItem(VIEWED_BOOKS_KEY) || '[]')
    const alreadyViewed = viewedBooks.includes(String(route.params.id))

    const { data } = await api.get(`/books/${route.params.id}`, {
      params: {
        track_view: alreadyViewed ? 0 : 1,
      },
    })
    book.value = data

    if (!alreadyViewed) {
      localStorage.setItem(
        VIEWED_BOOKS_KEY,
        JSON.stringify([...new Set([...viewedBooks, String(route.params.id)])]),
      )
    }

    syncAdminForm()
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
      book.value.active_borrows_count = (book.value.active_borrows_count || 0) + 1
      book.value.available_copies = Math.max((book.value.available_copies || 0) - 1, 0)
      book.value.collection_status = book.value.available_copies > 0 ? 'available' : 'unavailable'
    }
  } catch (error) {
    borrowMessage.value = error.response?.data?.message || 'Borrowing failed.'
  } finally {
    borrowBusy.value = false
  }
}

async function updateBook() {
  adminBusy.value = true
  adminMessage.value = ''

  try {
    const { data } = await api.put(`/books/${route.params.id}`, {
      title: adminForm.title,
      author: adminForm.author || null,
      description: adminForm.description || null,
      publication_date: adminForm.publication_date || null,
      category_id: Number(adminForm.category_id),
      total_copies: Number(adminForm.total_copies) || 1,
      damaged_quantity: Number(adminForm.damaged_quantity) || 0,
      is_new_arrival: adminForm.is_new_arrival,
    })

    adminMessage.value = data.message
    book.value = {
      ...book.value,
      ...data.book,
      category: categories.value.find((item) => item.id === Number(adminForm.category_id)) || book.value.category,
      collection_status:
        (book.value?.available_copies || 0) > 0 ? 'available' : 'unavailable',
    }
    syncAdminForm()
    await loadBook()
  } catch (error) {
    const response = error.response?.data
    adminMessage.value = response?.errors
      ? Object.values(response.errors).flat().join(' ')
      : response?.message || 'Unable to update this book.'
  } finally {
    adminBusy.value = false
  }
}

async function deleteBook() {
  deleteBusy.value = true
  adminMessage.value = ''

  try {
    await api.delete(`/books/${route.params.id}`)
    router.push('/books')
  } catch (error) {
    const response = error.response?.data
    adminMessage.value = response?.message || 'Unable to delete this book.'
  } finally {
    deleteBusy.value = false
  }
}

watch(() => route.params.id, loadBook)
onMounted(async () => {
  await Promise.all([loadBook(), loadCategories()])
})
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
          <div class="meta-item">
            <span>Total copies</span>
            <strong>{{ book.total_copies || 0 }}</strong>
          </div>
          <div class="meta-item">
            <span>Collection state</span>
            <strong>{{ book.damaged_quantity || 0 }} damaged</strong>
          </div>
        </div>
      </div>

      <aside class="action-card">
        <p class="eyebrow">Reader actions</p>
        <h2>Take this book home</h2>
        <p>
          Sign in to borrow this title and keep track of its return status from your personal dashboard.
        </p>
        <p :class="['pill', collectionTone]">{{ book.collection_status }}</p>
        <button :disabled="!isAuthenticated || borrowBusy || !canBorrow" class="primary-button" @click="borrowBook">
          {{ borrowBusy ? 'Borrowing...' : 'Borrow This Book' }}
        </button>
        <p v-if="!isAuthenticated" class="hint">You need an account before you can borrow books.</p>
        <p v-else-if="!canBorrow" class="hint">All available copies are currently borrowed or unavailable.</p>
        <p v-if="borrowMessage" class="status-line">{{ borrowMessage }}</p>
      </aside>
    </article>

    <article v-if="book && isAdmin" class="card admin-detail-card">
      <div class="section-heading">
        <div>
          <p class="eyebrow">Admin Controls</p>
          <h2>Edit or delete this book</h2>
        </div>
      </div>

      <form class="admin-form-grid" @submit.prevent="updateBook">
        <label class="field">
          <span>Title</span>
          <input v-model="adminForm.title" type="text" required />
        </label>

        <label class="field">
          <span>Author</span>
          <input v-model="adminForm.author" type="text" />
        </label>

        <label class="field field-wide">
          <span>Description</span>
          <textarea v-model="adminForm.description" rows="4"></textarea>
        </label>

        <label class="field">
          <span>Publication date</span>
          <input v-model="adminForm.publication_date" type="date" />
        </label>

        <label class="field">
          <span>Category</span>
          <select v-model="adminForm.category_id" required>
            <option disabled value="">Select a category</option>
            <option v-for="category in categories" :key="category.id" :value="category.id">
              {{ category.name }}
            </option>
          </select>
        </label>

        <label class="field">
          <span>Total copies</span>
          <input v-model="adminForm.total_copies" type="number" min="1" required />
        </label>

        <label class="field">
          <span>Damaged quantity</span>
          <input v-model="adminForm.damaged_quantity" type="number" min="0" />
        </label>

        <label class="checkbox-field field-wide">
          <input v-model="adminForm.is_new_arrival" type="checkbox" />
          <span>Mark as new arrival</span>
        </label>

        <div class="admin-detail-actions field-wide">
          <button class="primary-button" :disabled="adminBusy">
            {{ adminBusy ? 'Saving...' : 'Update Book' }}
          </button>
          <button type="button" class="ghost-button" :disabled="deleteBusy" @click="deleteBook">
            {{ deleteBusy ? 'Deleting...' : 'Delete Book' }}
          </button>
        </div>

        <p v-if="adminMessage" :class="['status-line', adminMessage.includes('Unable') ? 'error' : '']">
          {{ adminMessage }}
        </p>
      </form>
    </article>
  </section>
</template>
