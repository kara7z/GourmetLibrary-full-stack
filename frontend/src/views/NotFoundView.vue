<template>
  <section class="error-page">
    <div class="error-card">
      <p class="eyebrow">404</p>
      <h1>Page not found</h1>
      <p class="lead">The page you requested does not exist or may have been moved.</p>
      <RouterLink class="primary-button" to="/">Back home</RouterLink>
    </div>
  </section>
</template>

<script setup>
import { RouterLink } from 'vue-router'
</script>
