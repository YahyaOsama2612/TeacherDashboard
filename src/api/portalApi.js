import axiosClient from './axiosClient'

/**
 * Teacher portal endpoints (see Math_house-main/src/routes/teacher/portal.ts and sessions.ts).
 * axiosClient already unwraps the HTTP body, so every call resolves to { success, data }.
 */
export const portalApi = {
  // ── Sessions ──────────────────────────────────────────────
  /** PATCH /api/teacher/sessions/:id/meeting-link — '' clears the link */
  setMeetingLink(sessionId, sessionLink) {
    return axiosClient.patch(`/api/teacher/sessions/${sessionId}/meeting-link`, { session_link: sessionLink })
  },

  /** PUT /api/teacher/sessions/:id/attendance — [{ studentId, status: 'present' | 'absent' }] */
  saveAttendance(sessionId, attendance) {
    return axiosClient.put(`/api/teacher/sessions/${sessionId}/attendance`, { attendance })
  },

  // ── Requests ──────────────────────────────────────────────
  getRequests() {
    return axiosClient.get('/api/teacher/requests')
  },
  /** { requestDate: 'YYYY-MM-DD', timeFrom: 'HH:MM', timeTo: 'HH:MM', reason } */
  requestCover(body) {
    return axiosClient.post('/api/teacher/requests', { type: 'cover', ...body })
  },
  requestCancellation(sessionId, reason) {
    return axiosClient.post('/api/teacher/requests', { type: 'cancellation', sessionId, reason })
  },
  withdrawRequest(id) {
    return axiosClient.delete(`/api/teacher/requests/${id}`)
  },

  // ── Availability ──────────────────────────────────────────
  getAvailability() {
    return axiosClient.get('/api/teacher/availability')
  },
  /** slots: [{ dayOfWeek: 0-6 (Sun-Sat), timeFrom: 'HH:MM', timeTo: 'HH:MM' }] */
  saveAvailability(slots) {
    return axiosClient.put('/api/teacher/availability', { slots })
  },

  // ── Notifications ─────────────────────────────────────────
  getNotifications() {
    return axiosClient.get('/api/teacher/notifications')
  },
  /** ids omitted → mark all as read */
  markNotificationsRead(ids) {
    return axiosClient.patch('/api/teacher/notifications/read', ids ? { ids } : {})
  },

  // ── Profile ───────────────────────────────────────────────
  getProfile() {
    return axiosClient.get('/api/teacher/profile')
  },
}

export default portalApi
