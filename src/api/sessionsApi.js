import axiosClient from './axiosClient'

/**
 * Sessions API Service
 * Handles session endpoints:
 * - GET /api/teacher/sessions
 * - GET /api/teacher/sessions/upcoming
 * - GET /api/teacher/sessions/past
 * - GET /api/teacher/sessions/:sessionId/students
 * - GET /api/teacher/sessions/:sessionId/ratings
 * - GET /api/teacher/sessions/:id
 */
export const sessionsApi = {
  /**
   * Fetch all teacher sessions
   * Endpoint: GET /api/teacher/sessions
   * @param {Object} [params] - Optional query parameters
   * @returns {Promise<{ success: boolean, data: { message: string, count: number, sessions: Array } }>}
   */
  async getSessions(params = {}) {
    return await axiosClient.get('/api/teacher/sessions', { params })
  },

  /**
   * Fetch upcoming teacher sessions
   * Endpoint: GET /api/teacher/sessions/upcoming
   * @param {Object} [params] - Optional query parameters
   * @returns {Promise<{ success: boolean, data: { message: string, count: number, sessions: Array } }>}
   */
  async getUpcomingSessions(params = {}) {
    return await axiosClient.get('/api/teacher/sessions/upcoming', { params })
  },

  /**
   * Fetch past teacher sessions
   * Endpoint: GET /api/teacher/sessions/past
   * @param {Object} [params] - Optional query parameters
   * @returns {Promise<{ success: boolean, data: { message: string, count: number, sessions: Array } }>}
   */
  async getPastSessions(params = {}) {
    return await axiosClient.get('/api/teacher/sessions/past', { params })
  },

  /**
   * Fetch enrolled students for a specific session
   * Endpoint: GET /api/teacher/sessions/:sessionId/students
   * @param {string|number} sessionId - Session ID
   * @param {Object} [params] - Optional query parameters
   * @returns {Promise<{ success: boolean, data: { message: string, count: number, students: Array } }>}
   */
  async getSessionStudents(sessionId, params = {}) {
    return await axiosClient.get(`/api/teacher/sessions/${sessionId}/students`, { params })
  },

  /**
   * Fetch student ratings for a specific session
   * Endpoint: GET /api/teacher/sessions/:sessionId/ratings
   * @param {string|number} sessionId - Session ID
   * @param {Object} [params] - Optional query parameters
   * @returns {Promise<{ success: boolean, data: { message: string, data: { session: Object, averageOverallRating: number, totalRatedStudents: number, students: Array } } }>}
   */
  async getSessionRatings(sessionId, params = {}) {
    return await axiosClient.get(`/api/teacher/sessions/${sessionId}/ratings`, { params })
  },

  /**
   * Fetch single session details by ID
   * Endpoint: GET /api/teacher/sessions/:id
   * @param {string|number} id - Session ID
   */
  async getSessionById(id) {
    return await axiosClient.get(`/api/teacher/sessions/${id}`)
  },

  /**
   * Save the teacher's explanation PDF as a Base64 data URL
   * Endpoint: POST /api/teacher/sessions/:id/explanation-pdf
   * @param {string|number} id - Session ID
   * @param {File} file - Teacher explanation PDF
   */
  async uploadExplanationPdf(id, file) {
    const pdfDataUrl = await new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        if (typeof reader.result !== 'string') {
          reject(new Error('Could not read the selected PDF.'))
          return
        }
        resolve(reader.result)
      }
      reader.onerror = () => reject(reader.error || new Error('Could not read the selected PDF.'))
      reader.readAsDataURL(file)
    })

    return await axiosClient.post(`/api/teacher/sessions/${id}/explanation-pdf`, {
      teacher_explanation_pdf: pdfDataUrl,
    })
  },
}

export default sessionsApi