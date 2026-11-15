import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import sessionsApi from '../api/sessionsApi'
import portalApi from '../api/portalApi'
import { mapSession, byKey } from '../lib/sessions'

const TeacherDataContext = createContext(null)

/**
 * Loads everything the teacher portal shows and keeps it in one place:
 * sessions, requests, notifications and the teacher profile.
 * Also owns the toast and which modal is open, so any screen can open
 * "attendance", "meeting link", "feedback", "cancel" or "materials" for a session.
 */
export function TeacherDataProvider({ children }) {
  const [rawSessions, setRawSessions] = useState([])
  const [requests, setRequests] = useState([])
  const [notifications, setNotifications] = useState([])
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [clock, setClock] = useState(() => Date.now())

  const [toast, setToast] = useState(null)
  const toastTimer = useRef(null)
  const [modal, setModal] = useState(null) // { kind, sessionId }

  const showToast = useCallback((message, icon = 'fa-circle-check') => {
    setToast({ message, icon })
    clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), 3000)
  }, [])

  const loadSessions = useCallback(async () => {
    const res = await sessionsApi.getSessions()
    setRawSessions(res?.data?.sessions || [])
  }, [])
  const loadRequests = useCallback(async () => {
    const res = await portalApi.getRequests()
    setRequests(res?.data?.requests || [])
  }, [])
  const loadNotifications = useCallback(async () => {
    const res = await portalApi.getNotifications()
    setNotifications(res?.data?.notifications || [])
  }, [])
  const loadProfile = useCallback(async () => {
    const res = await portalApi.getProfile()
    setProfile(res?.data?.teacher || null)
  }, [])

  const refreshAll = useCallback(async () => {
    setError(null)
    try {
      await Promise.all([loadSessions(), loadRequests(), loadNotifications(), loadProfile()])
    } catch (err) {
      setError(err?.message || 'Could not load your dashboard.')
    } finally {
      setLoading(false)
    }
  }, [loadSessions, loadRequests, loadNotifications, loadProfile])

  useEffect(() => {
    refreshAll()
  }, [refreshAll])

  // Re-evaluate upcoming/completed every minute and poll notifications every 2 minutes.
  useEffect(() => {
    const tick = setInterval(() => setClock(Date.now()), 60 * 1000)
    const poll = setInterval(() => loadNotifications().catch(() => {}), 2 * 60 * 1000)
    return () => { clearInterval(tick); clearInterval(poll) }
  }, [loadNotifications])

  const sessions = useMemo(
    () => rawSessions.map((s) => mapSession(s, new Date(clock))).sort(byKey),
    [rawSessions, clock],
  )
  const byId = useCallback((id) => sessions.find((s) => s.id === id), [sessions])

  /** Latest cancellation request per session id. */
  const cancelRequests = useMemo(() => {
    const map = new Map()
    requests.filter((r) => r.type === 'cancellation' && r.sessionId).forEach((r) => {
      if (!map.has(r.sessionId)) map.set(r.sessionId, r)
    })
    return map
  }, [requests])

  const nextSession = useMemo(() => sessions.find((s) => s.status === 'upcoming') || null, [sessions])
  const pendingRequests = requests.filter((r) => r.status === 'pending').length
  const unreadNotifications = notifications.filter((n) => !n.isRead).length

  // ── actions ─────────────────────────────────────────────
  const setMeetingLink = useCallback(async (sessionId, link) => {
    await portalApi.setMeetingLink(sessionId, link)
    setRawSessions((list) => list.map((s) => (s.id === sessionId ? { ...s, sessionLink: link || null } : s)))
  }, [])

  const saveAttendance = useCallback(async (sessionId, record) => {
    const attendance = Object.entries(record).map(([studentId, status]) => ({ studentId, status }))
    await portalApi.saveAttendance(sessionId, attendance)
    setRawSessions((list) => list.map((s) => (s.id !== sessionId ? s : {
      ...s,
      students: (s.students || []).map((st) => (record[st.id] ? { ...st, attendance: record[st.id] } : st)),
    })))
  }, [])

  const requestCancellation = useCallback(async (sessionId, reason) => {
    await portalApi.requestCancellation(sessionId, reason)
    await loadRequests()
  }, [loadRequests])

  const requestCover = useCallback(async (body) => {
    await portalApi.requestCover(body)
    await loadRequests()
  }, [loadRequests])

  const withdrawRequest = useCallback(async (id) => {
    await portalApi.withdrawRequest(id)
    await loadRequests()
  }, [loadRequests])

  const markNotificationsRead = useCallback(async (ids) => {
    setNotifications((list) => list.map((n) => (!ids || ids.includes(n.id) ? { ...n, isRead: true } : n)))
    try { await portalApi.markNotificationsRead(ids) } catch { /* keep optimistic state */ }
  }, [])

  const updateExplanationPdf = useCallback((sessionId, url) => {
    setRawSessions((list) => list.map((s) => (s.id === sessionId ? { ...s, teacher_explanation_pdf: url } : s)))
  }, [])

  const value = {
    loading, error, refreshAll, reloadSessions: loadSessions,
    sessions, byId, nextSession, requests, cancelRequests, pendingRequests,
    notifications, unreadNotifications, profile,
    setMeetingLink, saveAttendance, requestCancellation, requestCover, withdrawRequest,
    markNotificationsRead, updateExplanationPdf,
    toast, showToast,
    modal, openModal: (kind, sessionId) => setModal({ kind, sessionId }), closeModal: () => setModal(null),
  }

  return <TeacherDataContext.Provider value={value}>{children}</TeacherDataContext.Provider>
}

export function useTeacherData() {
  const ctx = useContext(TeacherDataContext)
  if (!ctx) throw new Error('useTeacherData must be used inside TeacherDataProvider')
  return ctx
}
