<template>
  <section class="error-page">
    <div class="error-card">
      <p class="eyebrow">403</p>
      <h1>Access denied</h1>
      <p class="lead">You do not have permission to open this page.</p>
      <RouterLink class="primary-button" to="/">Back home</RouterLink>
    </div>
  </section>
</template>

<script setup>
import { RouterLink } from 'vue-router'
</script>
