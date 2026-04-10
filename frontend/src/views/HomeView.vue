<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { api } from '@/lib/api'
import { isAuthenticated, session } from '@/stores/session'

const apiMessage = ref('Preparing the reading room...')
const books = ref([])
const newArrivals = ref([])
const categories = ref([])
const loadingBooks = ref(true)
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

const heroStats = computed(() => [
  {
    label: 'Signed in as',
    value: session.user?.role || 'guest',
  },
  {
    label: 'Visible books',
    value: books.value.length,
  },
  {
    label: 'Available categories',
    value: categories.value.length,
  },
])

const featuredShelf = computed(() =>
  [...books.value]
    .sort((left, right) => (right.borrow_count || 0) - (left.borrow_count || 0))
    .slice(0, 3),
)

const tasteNotes = [
  'Quiet discovery',
  'Curated shelves',
  'Member borrowing',
]

const libraryQuotes = [
  'Good library design should feel quiet, tactile, and easy to trust.',
  'A thoughtful shelf invites curiosity before it asks for attention.',
  'The best reading spaces make discovery feel natural.',
  'A calm interface gives every book room to breathe.',
  'Readers return to places that feel clear, warm, and welcoming.',
  'A library should feel organized without ever feeling cold.',
  'Design is at its best when it helps readers linger a little longer.',
  'A gentle rhythm can make a large collection feel personal.',
  'Every good catalog balances order with the joy of surprise.',
  'A polished reading room should guide, not interrupt.',
  'Quiet details build the strongest sense of trust.',
  'A library experience works best when browsing feels effortless.',
  'Soft structure can make exploration feel more human.',
  'Good design lets the collection speak for itself.',
  'The most memorable reading spaces are calm, clear, and inviting.',
  'A well-shaped shelf turns searching into discovering.',
  'Great library design makes knowledge feel close at hand.',
  'Comfort and clarity are part of the reading experience.',
  'When the interface is calm, curiosity can do the work.',
  'A welcoming catalog should feel both curated and open.',
]

const featuredQuote = ref(libraryQuotes[Math.floor(Math.random() * libraryQuotes.length)])

async function loadMessage() {
  try {
    const { data } = await api.get('/message')
    apiMessage.value = data.message
  } catch (error) {
    apiMessage.value = 'The library is waking up. Please try again in a moment.'
  }
}

async function loadCategories() {
  try {
    const { data } = await api.get('/categories', {
      params: {
        sort: 'name',
      },
    })
    categories.value = data.data
  } catch (error) {
    console.warn('Unable to preload categories.', error)
  }
}

async function loadBooks(page = 1) {
  loadingBooks.value = true
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
    errorMessage.value = error.response?.data?.message || 'Unable to load books.'
  } finally {
    loadingBooks.value = false
  }
}

async function loadNewArrivals() {
  try {
    const { data } = await api.get('/books', {
      params: {
        sort: 'new',
      },
    })

    newArrivals.value = data.data.filter((book) => book.is_new_arrival).slice(0, 4)
  } catch (error) {
    console.warn('Unable to load new arrivals.', error)
  }
}

onMounted(async () => {
  await Promise.all([loadMessage(), loadCategories(), loadNewArrivals()])
  filters.sort = 'popular'
  await loadBooks(1)
})
</script>

<template>
  <section class="home-page">
    <div class="hero-panel">
      <div class="hero-copy">
        <p class="eyebrow">Reading Room</p>
        <h1>A calmer way to browse, borrow, and return the collection.</h1>
        <p class="lead">
          Explore the catalog, move through categories, and keep your personal shelf organized with a warm, focused library experience.
        </p>

        <div class="taste-notes" aria-label="Library highlights">
          <span v-for="note in tasteNotes" :key="note" class="taste-chip">{{ note }}</span>
        </div>

        <div class="hero-actions">
          <RouterLink class="primary-button" to="/books">Browse Books</RouterLink>
          <RouterLink class="primary-button" to="/categories">Explore Categories</RouterLink>
          <RouterLink v-if="!isAuthenticated" class="secondary-button" to="/auth">Create Reader Account</RouterLink>
          <RouterLink v-else class="secondary-button" to="/borrows">Open My Borrows</RouterLink>
        </div>
      </div>

      <aside class="hero-aside">
        <p class="status-banner">{{ apiMessage }}</p>
        <div class="stats-grid compact-grid">
          <article v-for="item in heroStats" :key="item.label" class="stat-card">
            <span>{{ item.label }}</span>
            <strong>{{ item.value }}</strong>
          </article>
        </div>
        <div class="quote-card">
          <p class="quote-mark">“</p>
          <p>{{ featuredQuote }}</p>
        </div>
      </aside>
    </div>

    <section class="catalog-section">
      <div class="section-heading">
        <div>
          <p class="eyebrow">Featured Books</p>
          <h2>A first look at the collection</h2>
        </div>
        <RouterLink class="ghost-button" to="/search">Open search</RouterLink>
      </div>

      <div v-if="loadingBooks" class="card muted">Loading books...</div>
      <div v-else-if="errorMessage" class="card error">{{ errorMessage }}</div>
      <div v-else class="book-grid">
        <article v-for="book in books" :key="book.id" class="book-card">
          <div class="book-cover" aria-hidden="true">
            <span>{{ book.title?.slice(0, 1) || 'B' }}</span>
          </div>
          <div class="book-topline">
            <span class="pill pill-neutral">{{ book.category?.name || 'Uncategorized' }}</span>
            <span v-if="book.is_new_arrival" class="pill pill-accent">New arrival</span>
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

    <section v-if="featuredShelf.length" class="shelf-section">
      <div class="section-heading">
        <div>
          <p class="eyebrow">Featured Shelf</p>
          <h2>Currently pulling the most reader attention</h2>
        </div>
      </div>

      <div class="shelf-grid">
        <article v-for="book in featuredShelf" :key="book.id" class="shelf-card">
          <div class="shelf-spine"></div>
          <p class="eyebrow">{{ book.category?.name || 'Library item' }}</p>
          <h3>{{ book.title }}</h3>
          <p>{{ book.author || 'Unknown author' }}</p>
          <div class="shelf-footer">
            <span>{{ book.borrow_count || 0 }} borrows</span>
            <RouterLink :to="`/books/${book.id}`">Open</RouterLink>
          </div>
        </article>
      </div>
    </section>

    <section v-if="newArrivals.length" class="catalog-section">
      <div class="section-heading">
        <div>
          <p class="eyebrow">New Arrivals</p>
          <h2>Recently added to the collection</h2>
        </div>
        <RouterLink class="ghost-button" to="/books">See all books</RouterLink>
      </div>

      <div class="book-grid">
        <article v-for="book in newArrivals" :key="book.id" class="book-card new-arrival-card">
          <div class="book-cover" aria-hidden="true">
            <span>{{ book.title?.slice(0, 1) || 'B' }}</span>
          </div>
          <div class="book-topline">
            <span class="pill pill-neutral">{{ book.category?.name || 'Uncategorized' }}</span>
            <span class="pill pill-accent">New arrival</span>
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
  </section>
</template>
