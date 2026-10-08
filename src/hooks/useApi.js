import { useState, useCallback } from 'react'

/**
 * Custom hook to execute arbitrary API requests with loading and error state
 *
 * @param {Function} apiFunc - Async function to call
 * @returns {{
 *   execute: (...args: any[]) => Promise<any>,
 *   data: any,
 *   loading: boolean,
 *   error: string|null,
 *   reset: () => void
 * }}
 */
export function useApi(apiFunc) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const execute = useCallback(
    async (...args) => {
      setLoading(true)
      setError(null)
      try {
        const result = await apiFunc(...args)
        setData(result)
        return result
      } catch (err) {
        const message = err?.message || 'Something went wrong'
        setError(message)
        throw err
      } finally {
        setLoading(false)
      }
    },
    [apiFunc]
  )

  const reset = useCallback(() => {
    setData(null)
    setLoading(false)
    setError(null)
  }, [])

  return { execute, data, loading, error, reset }
}

export default useApi
