import { computed, reactive } from 'vue'

const STORAGE_KEY = 'gourmet-library-session'

function readStoredSession() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null')

    if (parsed?.token && parsed?.user) {
      return parsed
    }
  } catch (error) {
    console.warn('Unable to restore session from storage.', error)
  }

  return {
    token: '',
    user: null,
  }
}

const restored = readStoredSession()

export const session = reactive({
  token: restored.token,
  user: restored.user,
})

export const isAuthenticated = computed(() => Boolean(session.token && session.user))
export const isAdmin = computed(() => session.user?.role === 'admin')

export function setSession(payload) {
  session.token = payload.token
  session.user = payload.user

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      token: payload.token,
      user: payload.user,
    }),
  )
}

export function clearSession() {
  session.token = ''
  session.user = null
  localStorage.removeItem(STORAGE_KEY)
}
