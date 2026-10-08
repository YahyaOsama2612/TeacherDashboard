import { useCallback, useEffect, useState } from 'react'
import sessionsApi from '../api/sessionsApi'

/**
 * Hook to fetch ratings for a specific session
 * Endpoint: GET /api/teacher/sessions/:sessionId/ratings
 *
 * @param {string|number} sessionId - ID of the session
 * @param {Object} [options]
 * @param {boolean} [options.enabled=true] - Fetch on mount or when sessionId changes
 */

// axiosClient بيرجع الـ body مباشرة: { success, data: { message, data: {...} } }
// فبننزل جوه طبقات data لحد ما نلاقي الـ object اللي فيه الـ ratings
const unwrap = (res) => {
    let node = res
    for (let i = 0; i < 4 && node; i++) {
        if ('averageOverallRating' in node || Array.isArray(node.students)) return node
        node = node.data
    }
    return null
}

export function useSessionRatings(sessionId, { enabled = true } = {}) {
    const [ratings, setRatings] = useState(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)

    const fetchRatings = useCallback(async () => {
        if (!sessionId) {
            setRatings(null)
            return null
        }
        setLoading(true)
        setError(null)
        try {
            const response = await sessionsApi.getSessionRatings(sessionId)
            const payload = unwrap(response)
            setRatings({
                session: payload?.session ?? null,
                average: Number(payload?.averageOverallRating) || 0,
                totalRated: Number(payload?.totalRatedStudents) || 0,
                students: Array.isArray(payload?.students) ? payload.students : [],
            })
            return response
        } catch (err) {
            setError(err?.message || 'Failed to load session ratings')
            return null
        } finally {
            setLoading(false)
        }
    }, [sessionId])

    useEffect(() => {
        if (enabled && sessionId) fetchRatings()
    }, [enabled, sessionId, fetchRatings])

    return { ratings, loading, error, refetch: fetchRatings }
}

// التقييم في الـ backend من 10
export const RATING_MAX = 10

// نسبة الرضا من المتوسط على مقياس 10 (8 من 10 = 80%)
export const toSatisfaction = (avg) =>
    Math.round((Math.min(Math.max(Number(avg) || 0, 0), RATING_MAX) / RATING_MAX) * 100)

export default useSessionRatings