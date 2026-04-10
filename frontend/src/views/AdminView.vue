<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { api } from '@/lib/api'

const stats = ref(null)
const loading = ref(true)
const errorMessage = ref('')
const adminMessage = ref('')
const books = ref([])
const categories = ref([])
const booksPagination = reactive({
  current_page: 1,
  last_page: 1,
})
const categoriesPagination = reactive({
  current_page: 1,
  last_page: 1,
})
const bookFormBusy = ref(false)
const categoryFormBusy = ref(false)
const deleteBusy = ref('')
const editingBookId = ref(null)
const editingCategoryId = ref(null)

const bookForm = reactive({
  title: '',
  author: '',
  description: '',
  publication_date: '',
  category_id: '',
  is_new_arrival: false,
  damaged_quantity: 0,
  total_copies: 1,
})

const categoryForm = reactive({
  name: '',
  description: '',
})

const maxBorrowCount = computed(() =>
  Math.max(...(stats.value?.most_borrowed_books || []).map((book) => book.borrow_count || 0), 1),
)
const maxConsultCount = computed(() =>
  Math.max(...(stats.value?.most_consulted_books || []).map((book) => book.consultation_count || 0), 1),
)
const maxCategoryCount = computed(() =>
  Math.max(...(stats.value?.categories_by_book_count || []).map((category) => category.books_count || 0), 1),
)
const maxDamageCount = computed(() =>
  Math.max(...(stats.value?.damaged_books || []).map((book) => book.damaged_quantity || 0), 1),
)

function meterWidth(value, max) {
  return `${Math.max(16, Math.round(((value || 0) / max) * 100))}%`
}

function resetBookForm() {
  editingBookId.value = null
  bookForm.title = ''
  bookForm.author = ''
  bookForm.description = ''
  bookForm.publication_date = ''
  bookForm.category_id = ''
  bookForm.is_new_arrival = false
  bookForm.damaged_quantity = 0
  bookForm.total_copies = 1
}

function resetCategoryForm() {
  editingCategoryId.value = null
  categoryForm.name = ''
  categoryForm.description = ''
}

function applyBookToForm(book) {
  editingBookId.value = book.id
  bookForm.title = book.title || ''
  bookForm.author = book.author || ''
  bookForm.description = book.description || ''
  bookForm.publication_date = book.publication_date || ''
  bookForm.category_id = book.category_id || ''
  bookForm.is_new_arrival = Boolean(book.is_new_arrival)
  bookForm.damaged_quantity = book.damaged_quantity || 0
  bookForm.total_copies = book.total_copies || 1
  adminMessage.value = `Editing "${book.title}".`
}

function applyCategoryToForm(category) {
  editingCategoryId.value = category.id
  categoryForm.name = category.name || ''
  categoryForm.description = category.description || ''
  adminMessage.value = `Editing category "${category.name}".`
}

function normalizeError(error, fallback) {
  const response = error.response?.data
  if (response?.errors) {
    return Object.values(response.errors).flat().join(' ')
  }

  return response?.message || fallback
}

async function loadStats() {
  try {
    const { data } = await api.get('/admin/stats')
    stats.value = data
  } catch (error) {
    throw new Error(normalizeError(error, 'Unable to load admin statistics.'))
  }
}

async function loadBooks(page = booksPagination.current_page) {
  try {
    const { data } = await api.get('/books', {
      params: {
        page,
      },
    })
    books.value = data.data
    booksPagination.current_page = data.current_page
    booksPagination.last_page = data.last_page
  } catch (error) {
    throw new Error(normalizeError(error, 'Unable to load books for admin controls.'))
  }
}

async function loadCategories(page = categoriesPagination.current_page) {
  try {
    const { data } = await api.get('/categories', {
      params: {
        page,
        with_books_count: true,
        sort: 'name',
      },
    })
    categories.value = data.data
    categoriesPagination.current_page = data.current_page
    categoriesPagination.last_page = data.last_page
  } catch (error) {
    throw new Error(normalizeError(error, 'Unable to load categories for admin controls.'))
  }
}

async function refreshAdminData() {
  loading.value = true
  errorMessage.value = ''

  try {
    await Promise.all([loadStats(), loadBooks(booksPagination.current_page), loadCategories(categoriesPagination.current_page)])
  } catch (error) {
    errorMessage.value = error.message
  } finally {
    loading.value = false
  }
}

async function submitBook() {
  bookFormBusy.value = true
  adminMessage.value = ''

  const payload = {
    title: bookForm.title,
    author: bookForm.author || null,
    description: bookForm.description || null,
    publication_date: bookForm.publication_date || null,
    category_id: Number(bookForm.category_id),
    is_new_arrival: bookForm.is_new_arrival,
    damaged_quantity: Number(bookForm.damaged_quantity) || 0,
    total_copies: Number(bookForm.total_copies) || 1,
  }

  try {
    if (editingBookId.value) {
      await api.put(`/books/${editingBookId.value}`, payload)
      adminMessage.value = 'Book updated successfully.'
    } else {
      await api.post('/books', payload)
      adminMessage.value = 'Book added successfully.'
    }

    resetBookForm()
    await refreshAdminData()
  } catch (error) {
    adminMessage.value = normalizeError(error, 'Unable to save this book.')
  } finally {
    bookFormBusy.value = false
  }
}

async function submitCategory() {
  categoryFormBusy.value = true
  adminMessage.value = ''

  try {
    if (editingCategoryId.value) {
      await api.put(`/categories/${editingCategoryId.value}`, {
        name: categoryForm.name,
        description: categoryForm.description || null,
      })
      adminMessage.value = 'Category updated successfully.'
    } else {
      await api.post('/categories', {
        name: categoryForm.name,
        description: categoryForm.description || null,
      })
      adminMessage.value = 'Category added successfully.'
    }

    resetCategoryForm()
    await refreshAdminData()
  } catch (error) {
    adminMessage.value = normalizeError(error, 'Unable to save this category.')
  } finally {
    categoryFormBusy.value = false
  }
}

async function deleteBook(book) {
  deleteBusy.value = `book-${book.id}`
  adminMessage.value = ''

  try {
    await api.delete(`/books/${book.id}`)
    adminMessage.value = `"${book.title}" was deleted.`
    if (books.value.length === 1 && booksPagination.current_page > 1) {
      booksPagination.current_page -= 1
    }
    await refreshAdminData()
  } catch (error) {
    adminMessage.value = normalizeError(error, 'Unable to delete this book.')
  } finally {
    deleteBusy.value = ''
  }
}

async function deleteCategory(category) {
  deleteBusy.value = `category-${category.id}`
  adminMessage.value = ''

  try {
    await api.delete(`/categories/${category.id}`)
    adminMessage.value = `"${category.name}" was deleted.`
    if (categories.value.length === 1 && categoriesPagination.current_page > 1) {
      categoriesPagination.current_page -= 1
    }
    await refreshAdminData()
  } catch (error) {
    adminMessage.value = normalizeError(error, 'Unable to delete this category.')
  } finally {
    deleteBusy.value = ''
  }
}

onMounted(refreshAdminData)
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
      <p v-if="adminMessage" :class="['status-line', adminMessage.includes('Unable') ? 'error' : '']">{{ adminMessage }}</p>

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
              <div class="rank-copy">
                <span>{{ book.title }}</span>
                <div class="mini-meter">
                  <span class="mini-meter-fill" :style="{ width: meterWidth(book.borrow_count, maxBorrowCount) }"></span>
                </div>
              </div>
              <strong>{{ book.borrow_count }}</strong>
            </li>
          </ul>
        </article>

        <article class="card">
          <h2>Most consulted</h2>
          <ul class="rank-list">
            <li v-for="book in stats.most_consulted_books" :key="book.id">
              <div class="rank-copy">
                <span>{{ book.title }}</span>
                <div class="mini-meter">
                  <span class="mini-meter-fill" :style="{ width: meterWidth(book.consultation_count, maxConsultCount) }"></span>
                </div>
              </div>
              <strong>{{ book.consultation_count }}</strong>
            </li>
          </ul>
        </article>

        <article class="card">
          <h2>Category volume</h2>
          <ul class="rank-list">
            <li v-for="category in stats.categories_by_book_count" :key="category.id">
              <div class="rank-copy">
                <span>{{ category.name }}</span>
                <div class="mini-meter">
                  <span class="mini-meter-fill" :style="{ width: meterWidth(category.books_count, maxCategoryCount) }"></span>
                </div>
              </div>
              <strong>{{ category.books_count }}</strong>
            </li>
          </ul>
        </article>

        <article class="card">
          <h2>Damaged books</h2>
          <ul class="rank-list">
            <li v-for="book in stats.damaged_books" :key="book.id">
              <div class="rank-copy">
                <span>{{ book.title }}</span>
                <div class="mini-meter">
                  <span class="mini-meter-fill" :style="{ width: meterWidth(book.damaged_quantity, maxDamageCount) }"></span>
                </div>
              </div>
              <strong>{{ book.damaged_quantity }}</strong>
            </li>
          </ul>
        </article>
      </div>

      <div class="admin-workspace">
        <article class="card admin-form-card">
          <div class="section-heading">
            <div>
              <p class="eyebrow">Books</p>
              <h2>{{ editingBookId ? 'Update book' : 'Add a new book' }}</h2>
            </div>
            <button v-if="editingBookId" class="ghost-button" @click="resetBookForm">Cancel edit</button>
          </div>

          <form class="admin-form-grid" @submit.prevent="submitBook">
            <label class="field">
              <span>Title</span>
              <input v-model="bookForm.title" type="text" required />
            </label>

            <label class="field">
              <span>Author</span>
              <input v-model="bookForm.author" type="text" />
            </label>

            <label class="field field-wide">
              <span>Description</span>
              <textarea v-model="bookForm.description" rows="4"></textarea>
            </label>

            <label class="field">
              <span>Publication date</span>
              <input v-model="bookForm.publication_date" type="date" />
            </label>

            <label class="field">
              <span>Category</span>
              <select v-model="bookForm.category_id" required>
                <option disabled value="">Select a category</option>
                <option v-for="category in categories" :key="category.id" :value="category.id">
                  {{ category.name }}
                </option>
              </select>
            </label>

            <label class="field">
              <span>Damaged quantity</span>
              <input v-model="bookForm.damaged_quantity" type="number" min="0" />
            </label>

            <label class="field">
              <span>Total copies</span>
              <input v-model="bookForm.total_copies" type="number" min="1" required />
            </label>

            <label class="checkbox-field field-wide">
              <input v-model="bookForm.is_new_arrival" type="checkbox" />
              <span>Mark as new arrival</span>
            </label>

            <button class="primary-button field-wide" :disabled="bookFormBusy">
              {{ bookFormBusy ? 'Saving...' : editingBookId ? 'Update Book' : 'Add Book' }}
            </button>
          </form>
        </article>

        <article class="card admin-form-card">
          <div class="section-heading">
            <div>
              <p class="eyebrow">Categories</p>
              <h2>{{ editingCategoryId ? 'Update category' : 'Add a new category' }}</h2>
            </div>
            <button v-if="editingCategoryId" class="ghost-button" @click="resetCategoryForm">Cancel edit</button>
          </div>

          <form class="admin-form-grid" @submit.prevent="submitCategory">
            <label class="field">
              <span>Name</span>
              <input v-model="categoryForm.name" type="text" required />
            </label>

            <label class="field field-wide">
              <span>Description</span>
              <textarea v-model="categoryForm.description" rows="4"></textarea>
            </label>

            <button class="primary-button field-wide" :disabled="categoryFormBusy">
              {{ categoryFormBusy ? 'Saving...' : editingCategoryId ? 'Update Category' : 'Add Category' }}
            </button>
          </form>
        </article>
      </div>

      <div class="admin-records">
        <article class="card">
          <div class="section-heading">
            <div>
              <p class="eyebrow">Manage books</p>
              <h2>Edit or delete current books</h2>
            </div>
          </div>

          <div class="admin-record-list">
            <article v-for="book in books" :key="book.id" class="admin-record">
              <div class="admin-record-copy">
                <strong>{{ book.title }}</strong>
                <p>{{ book.author || 'Unknown author' }} • {{ book.category?.name || 'Uncategorized' }}</p>
                <p>{{ book.total_copies || 0 }} copies • {{ book.damaged_quantity || 0 }} damaged</p>
              </div>
              <div class="admin-record-actions">
                <button class="secondary-button compact" @click="applyBookToForm(book)">Edit</button>
                <button
                  class="ghost-button compact"
                  :disabled="deleteBusy === `book-${book.id}`"
                  @click="deleteBook(book)"
                >
                  {{ deleteBusy === `book-${book.id}` ? 'Deleting...' : 'Delete' }}
                </button>
              </div>
            </article>
          </div>

          <div class="pagination-bar">
            <button
              class="ghost-button"
              :disabled="booksPagination.current_page <= 1"
              @click="loadBooks(booksPagination.current_page - 1)"
            >
              Previous
            </button>
            <span>Page {{ booksPagination.current_page }} of {{ booksPagination.last_page }}</span>
            <button
              class="ghost-button"
              :disabled="booksPagination.current_page >= booksPagination.last_page"
              @click="loadBooks(booksPagination.current_page + 1)"
            >
              Next
            </button>
          </div>
        </article>

        <article class="card">
          <div class="section-heading">
            <div>
              <p class="eyebrow">Manage categories</p>
              <h2>Edit or delete category shelves</h2>
            </div>
          </div>

          <div class="admin-record-list">
            <article v-for="category in categories" :key="category.id" class="admin-record">
              <div class="admin-record-copy">
                <strong>{{ category.name }}</strong>
                <p>{{ category.description || 'No description yet.' }}</p>
              </div>
              <div class="admin-record-actions">
                <button class="secondary-button compact" @click="applyCategoryToForm(category)">Edit</button>
                <button
                  class="ghost-button compact"
                  :disabled="deleteBusy === `category-${category.id}`"
                  @click="deleteCategory(category)"
                >
                  {{ deleteBusy === `category-${category.id}` ? 'Deleting...' : 'Delete' }}
                </button>
              </div>
            </article>
          </div>

          <div class="pagination-bar">
            <button
              class="ghost-button"
              :disabled="categoriesPagination.current_page <= 1"
              @click="loadCategories(categoriesPagination.current_page - 1)"
            >
              Previous
            </button>
            <span>Page {{ categoriesPagination.current_page }} of {{ categoriesPagination.last_page }}</span>
            <button
              class="ghost-button"
              :disabled="categoriesPagination.current_page >= categoriesPagination.last_page"
              @click="loadCategories(categoriesPagination.current_page + 1)"
            >
              Next
            </button>
          </div>
        </article>
      </div>
    </div>
  </section>
</template>
