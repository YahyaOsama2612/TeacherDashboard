import axios from 'axios'

const BASE_URL = 'https://bcknd.mathshouse.net'
export const TOKEN_STORAGE_KEY = 'teacher_token'
export const USER_STORAGE_KEY = 'teacher_profile'

// Create Axios client instance
const axiosClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  timeout: 30000,
})

// Request Interceptor: Attach Auth Token
axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(TOKEN_STORAGE_KEY)
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response Interceptor: Extract data & format errors
axiosClient.interceptors.response.use(
  (response) => {
    return response.data
  },
  (error) => {
    const status = error.response?.status
    const data = error.response?.data

    // If unauthorized, clean up token and notify listener
    if (status === 401) {
      localStorage.removeItem(TOKEN_STORAGE_KEY)
      localStorage.removeItem(USER_STORAGE_KEY)
      window.dispatchEvent(new CustomEvent('auth:unauthorized'))
    }

    const normalizedError = {
      status,
      message:
        data?.error?.message ||
        data?.message ||
        (typeof data?.error === 'string' ? data.error : null) ||
        error.message ||
        'An unexpected network error occurred.',
      errors: data?.errors || null,
      raw: error,
    }

    return Promise.reject(normalizedError)
  }
)

export default axiosClient
