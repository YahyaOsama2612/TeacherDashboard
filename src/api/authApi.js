import axiosClient, { TOKEN_STORAGE_KEY, USER_STORAGE_KEY } from './axiosClient'

export const authApi = {
  /**
   * Teacher Login
   * Endpoint: /api/teacher/auth/login
   * @param {Object} credentials
   * @param {string} credentials.email - Teacher email
   * @param {string} credentials.password - Teacher password
   */
  async login({ email, password }) {
    const response = await axiosClient.post('/api/teacher/auth/login', {
      email,
      password,
    })

    const payload = response?.data !== undefined ? response.data : response
    const token =
      payload?.token ||
      payload?.access_token ||
      payload?.accessToken ||
      payload?.data?.token ||
      payload?.data?.access_token ||
      payload?.data?.accessToken ||
      response?.token ||
      response?.access_token

    const user =
      payload?.user ||
      payload?.teacher ||
      payload?.data?.user ||
      payload?.data?.teacher ||
      response?.user ||
      response?.teacher ||
      { email }

    if (token) {
      localStorage.setItem(TOKEN_STORAGE_KEY, token)
    }
    if (user) {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user))
    }

    return { token, user, raw: response }
  },

  /**
   * Teacher Logout
   * Clears storage and optionally triggers logout endpoint
   */
  async logout() {
    try {
      // Optional call if backend provides logout endpoint
      await axiosClient.post('/api/teacher/auth/logout')
    } catch {
      // Ignore errors on logout endpoint
    } finally {
      localStorage.removeItem(TOKEN_STORAGE_KEY)
      localStorage.removeItem(USER_STORAGE_KEY)
    }
  },

  /**
   * Get Current Stored Token
   */
  getToken() {
    return localStorage.getItem(TOKEN_STORAGE_KEY)
  },

  /**
   * Get Current Stored User
   */
  getStoredUser() {
    try {
      const stored = localStorage.getItem(USER_STORAGE_KEY)
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  },

  /**
   * Fetch current authenticated teacher profile
   */
  async getProfile() {
    return await axiosClient.get('/api/teacher/auth/me')
  },
}

export default authApi
