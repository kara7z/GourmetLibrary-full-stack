<template>
  <section class="error-page">
    <div class="error-card">
      <p class="eyebrow">500</p>
      <h1>Something went wrong</h1>
      <p class="lead">The app hit an unexpected problem. Please try again in a moment.</p>
      <RouterLink class="primary-button" to="/">Back home</RouterLink>
    </div>
  </section>
</template>

<script setup>
import { RouterLink } from 'vue-router'
</script>
