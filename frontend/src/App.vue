<script setup>
import { computed } from 'vue'
import { RouterLink, RouterView, useRouter } from 'vue-router'
import { api } from '@/lib/api'
import { clearSession, isAdmin, isAuthenticated, session } from '@/stores/session'

const router = useRouter()

const userLabel = computed(() => session.user?.name || 'Guest reader')

async function logout() {
  try {
    await api.post('/logout', { token: session.token })
  } catch (error) {
    console.warn('Logout request failed.', error)
  } finally {
    clearSession()
    router.push('/')
  }
}
</script>

<template>
  <div class="app-shell">
    <div class="ambient-orb ambient-orb-left"></div>
    <div class="ambient-orb ambient-orb-right"></div>

    <header class="topbar">
      <RouterLink class="brand" to="/">
        <span class="brand-badge">GL</span>
        <span>
          <strong>GourmetLibrary</strong>
          <small>Curated reading room</small>
        </span>
      </RouterLink>

      <nav class="topnav">
        <RouterLink to="/">Home</RouterLink>
        <RouterLink to="/books">Books</RouterLink>
        <RouterLink to="/categories">Categories</RouterLink>
        <RouterLink to="/search">Search</RouterLink>
        <RouterLink v-if="isAuthenticated" to="/borrows">My Borrows</RouterLink>
        <RouterLink v-if="isAdmin" to="/admin">Admin</RouterLink>
      </nav>

      <div class="session-panel">
        <div class="session-copy">
          <span class="session-kicker">Current session</span>
          <span class="session-name">{{ userLabel }}</span>
          <small>{{ session.user?.role || 'browse mode' }}</small>
        </div>
        <RouterLink v-if="!isAuthenticated" class="primary-button compact" to="/auth">Login</RouterLink>
        <button v-else class="secondary-button compact" @click="logout">Logout</button>
      </div>
    </header>

    <main class="main-content">
      <RouterView />
    </main>
  </div>
</template>
