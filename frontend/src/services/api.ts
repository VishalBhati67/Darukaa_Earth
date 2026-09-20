import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

const isAuthAttempt = (url?: string) => {
  if (!url) return false
  return url.includes('/auth/login') || url.includes('/auth/register')
}

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('darukaa_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status
    const requestUrl = String(error.config?.url ?? '')

    // Failed login/register must stay on the form so the error message can show.
    if (status === 401 && !isAuthAttempt(requestUrl)) {
      localStorage.removeItem('darukaa_token')
      localStorage.removeItem('darukaa_user')
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  },
)

export default api
