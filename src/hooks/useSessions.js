import { useState, useEffect, useCallback } from 'react'
import sessionsApi from '../api/sessionsApi'

/**
 * Hook to fetch upcoming teacher sessions
 * Endpoint: GET /api/teacher/sessions/upcoming
 *
 * @param {Object} [options]
 * @param {boolean} [options.autoFetch=true] - Fetch on mount
 * @param {Object} [options.params={}] - Optional query params
 */
export function useUpcomingSessions(options = {}) {
  const { autoFetch = true, params = {} } = options

  const [sessions, setSessions] = useState([])
  const [count, setCount] = useState(0)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [raw, setRaw] = useState(null)

  const fetchUpcoming = useCallback(async (customParams = params) => {
    setLoading(true)
    setError(null)
    try {
      const response = await sessionsApi.getUpcomingSessions(customParams)
      const dataPayload = response?.data || response
      const list = dataPayload?.sessions || []
      const totalCount = dataPayload?.count ?? list.length
      const msg = dataPayload?.message || ''

      setSessions(list)
      setCount(totalCount)
      setMessage(msg)
      setRaw(response)
      return response
    } catch (err) {
      setError(err?.message || 'Failed to load upcoming sessions')
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (autoFetch) {
      fetchUpcoming().catch(() => {})
    }
  }, [autoFetch, fetchUpcoming])

  return {
    sessions,
    count,
    message,
    loading,
    error,
    refetch: fetchUpcoming,
    raw,
  }
}

/**
 * Hook to fetch past teacher sessions
 * Endpoint: GET /api/teacher/sessions/past
 *
 * @param {Object} [options]
 * @param {boolean} [options.autoFetch=true] - Fetch on mount
 * @param {Object} [options.params={}] - Optional query params
 */
export function usePastSessions(options = {}) {
  const { autoFetch = true, params = {} } = options

  const [sessions, setSessions] = useState([])
  const [count, setCount] = useState(0)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [raw, setRaw] = useState(null)

  const fetchPastSessions = useCallback(async (customParams = params) => {
    setLoading(true)
    setError(null)
    try {
      const response = await sessionsApi.getPastSessions(customParams)
      const dataPayload = response?.data || response
      const list = dataPayload?.sessions || []
      const totalCount = dataPayload?.count ?? list.length
      const msg = dataPayload?.message || ''

      setSessions(list)
      setCount(totalCount)
      setMessage(msg)
      setRaw(response)
      return response
    } catch (err) {
      setError(err?.message || 'Failed to load past sessions')
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (autoFetch) {
      fetchPastSessions().catch(() => {})
    }
  }, [autoFetch, fetchPastSessions])

  return {
    sessions,
    count,
    message,
    loading,
    error,
    refetch: fetchPastSessions,
    raw,
  }
}

/**
 * Hook to fetch all teacher sessions
 * Endpoint: GET /api/teacher/sessions
 *
 * @param {Object} [options]
 * @param {boolean} [options.autoFetch=true] - Fetch on mount
 * @param {Object} [options.params={}] - Optional query params
 */
export function useSessions(options = {}) {
  const { autoFetch = true, params = {} } = options

  const [sessions, setSessions] = useState([])
  const [count, setCount] = useState(0)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [raw, setRaw] = useState(null)

  const fetchSessions = useCallback(async (customParams = params) => {
    setLoading(true)
    setError(null)
    try {
      const response = await sessionsApi.getSessions(customParams)
      const dataPayload = response?.data || response
      const list = dataPayload?.sessions || []
      const totalCount = dataPayload?.count ?? list.length
      const msg = dataPayload?.message || ''

      setSessions(list)
      setCount(totalCount)
      setMessage(msg)
      setRaw(response)
      return response
    } catch (err) {
      setError(err?.message || 'Failed to load sessions')
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (autoFetch) {
      fetchSessions().catch(() => {})
    }
  }, [autoFetch, fetchSessions])

  return {
    sessions,
    count,
    message,
    loading,
    error,
    refetch: fetchSessions,
    raw,
  }
}

/**
 * Hook to fetch students for a specific session
 * Endpoint: GET /api/teacher/sessions/:sessionId/students
 *
 * @param {string|number} sessionId - ID of the session
 * @param {Object} [options]
 * @param {boolean} [options.autoFetch=true] - Fetch on mount or when sessionId changes
 * @param {Object} [options.params={}] - Optional query params
 */
export function useSessionStudents(sessionId, options = {}) {
  const { autoFetch = true, params = {} } = options

  const [students, setStudents] = useState([])
  const [count, setCount] = useState(0)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [raw, setRaw] = useState(null)

  const fetchSessionStudents = useCallback(
    async (customParams = params) => {
      if (!sessionId) {
        setStudents([])
        setCount(0)
        return null
      }
      setLoading(true)
      setError(null)
      try {
        const response = await sessionsApi.getSessionStudents(sessionId, customParams)
        const dataPayload = response?.data || response
        const list = dataPayload?.students || []
        const totalCount = dataPayload?.count ?? list.length
        const msg = dataPayload?.message || ''

        setStudents(list)
        setCount(totalCount)
        setMessage(msg)
        setRaw(response)
        return response
      } catch (err) {
        setError(err?.message || 'Failed to load session students')
        throw err
      } finally {
        setLoading(false)
      }
    },
    [sessionId]
  )

  useEffect(() => {
    if (autoFetch && sessionId) {
      fetchSessionStudents().catch(() => {})
    }
  }, [autoFetch, sessionId, fetchSessionStudents])

  return {
    students,
    count,
    message,
    loading,
    error,
    refetch: fetchSessionStudents,
    raw,
  }
}

export default useSessions
