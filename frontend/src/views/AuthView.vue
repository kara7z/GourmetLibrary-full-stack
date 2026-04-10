<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '@/lib/api'
import { setSession } from '@/stores/session'

const router = useRouter()
const mode = ref('login')
const busy = ref(false)
const feedback = ref('')

const form = reactive({
  name: '',
  email: '',
  password: '',
  password_confirmation: '',
})

async function submit() {
  busy.value = true
  feedback.value = ''

  try {
    const endpoint = mode.value === 'login' ? '/login' : '/register'
    const payload =
      mode.value === 'login'
        ? { email: form.email, password: form.password }
        : {
            name: form.name,
            email: form.email,
            password: form.password,
            password_confirmation: form.password_confirmation,
          }

    const { data } = await api.post(endpoint, payload)
    setSession({ token: data.token, user: data.user })
    feedback.value = data.message
    router.push('/')
  } catch (error) {
    const response = error.response?.data
    if (response?.errors) {
      feedback.value = Object.values(response.errors).flat().join(' ')
    } else {
      feedback.value = response?.message || 'Authentication failed.'
    }
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <section class="auth-page">
    <div class="auth-hero">
      <p class="eyebrow">Reader Access</p>
      <h1>Join the GourmetLibrary community</h1>
      <p>
        Create an account to borrow books, follow your reading activity, and unlock the admin dashboard when your role allows it.
      </p>
    </div>

    <form class="auth-card" @submit.prevent="submit">
      <div class="auth-toggle">
        <button
          type="button"
          :class="['toggle-button', mode === 'login' ? 'toggle-button-active' : '']"
          @click="mode = 'login'"
        >
          Login
        </button>
        <button
          type="button"
          :class="['toggle-button', mode === 'register' ? 'toggle-button-active' : '']"
          @click="mode = 'register'"
        >
          Register
        </button>
      </div>

      <label v-if="mode === 'register'" class="field">
        <span>Name</span>
        <input v-model="form.name" type="text" placeholder="Amina Reader" required />
      </label>

      <label class="field">
        <span>Email</span>
        <input v-model="form.email" type="email" placeholder="reader@example.com" required />
      </label>

      <label class="field">
        <span>Password</span>
        <input v-model="form.password" type="password" placeholder="••••••••" required />
      </label>

      <label v-if="mode === 'register'" class="field">
        <span>Confirm password</span>
        <input v-model="form.password_confirmation" type="password" placeholder="Repeat password" required />
      </label>

      <button class="primary-button auth-submit" :disabled="busy">
        {{ busy ? 'Working...' : mode === 'login' ? 'Login to Library' : 'Create Account' }}
      </button>

      <p v-if="feedback" class="status-line">{{ feedback }}</p>
    </form>
  </section>
</template>
