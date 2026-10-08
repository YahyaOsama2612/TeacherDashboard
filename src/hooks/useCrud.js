import { useState, useEffect, useCallback } from 'react'
import crudApi from '../api/crudApi'

/**
 * Custom hook for standard CRUD operations on an endpoint
 *
 * @param {string} endpoint - API path, e.g., '/api/teacher/students'
 * @param {Object} [options]
 * @param {boolean} [options.autoFetch=true] - Fetch data immediately on mount
 * @param {Object} [options.initialParams={}] - Initial query params
 * @param {string} [options.idField='id'] - Name of primary key field
 *
 * @returns {{
 *   items: Array,
 *   data: any,
 *   item: any,
 *   loading: boolean,
 *   actionLoading: boolean,
 *   error: string|null,
 *   fetchAll: (params?: Object) => Promise<any>,
 *   fetchById: (id: string|number) => Promise<any>,
 *   createItem: (payload: Object) => Promise<any>,
 *   updateItem: (id: string|number, payload: Object, isPatch?: boolean) => Promise<any>,
 *   deleteItem: (id: string|number) => Promise<any>,
 *   setItems: Function,
 *   setData: Function,
 *   clearError: () => void
 * }}
 */
export function useCrud(endpoint, options = {}) {
  const {
    autoFetch = true,
    initialParams = {},
    idField = 'id',
  } = options

  const [data, setData] = useState(null)
  const [items, setItems] = useState([])
  const [item, setItem] = useState(null)
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState(null)

  const clearError = useCallback(() => setError(null), [])

  // Parse items out of data if data is wrapped in { data: [...] }, { data: { sessions: [...] } } or is an array
  const extractItems = (res) => {
    if (Array.isArray(res)) return res
    if (Array.isArray(res?.data)) return res.data
    if (Array.isArray(res?.data?.sessions)) return res.data.sessions
    if (Array.isArray(res?.sessions)) return res.sessions
    if (Array.isArray(res?.data?.items)) return res.data.items
    if (Array.isArray(res?.items)) return res.items
    if (Array.isArray(res?.results)) return res.results
    if (Array.isArray(res?.data?.results)) return res.data.results

    // Fallback: look for any array value inside res.data or res
    if (res?.data && typeof res.data === 'object') {
      for (const key of Object.keys(res.data)) {
        if (Array.isArray(res.data[key])) {
          return res.data[key]
        }
      }
    }
    return []
  }

  // Fetch all records
  const fetchAll = useCallback(
    async (params = initialParams) => {
      if (!endpoint) return null
      setLoading(true)
      setError(null)
      try {
        const response = await crudApi.getAll(endpoint, params)
        setData(response)
        setItems(extractItems(response))
        return response
      } catch (err) {
        setError(err.message || 'Failed to fetch data')
        throw err
      } finally {
        setLoading(false)
      }
    },
    [endpoint]
  )

  // Fetch single record
  const fetchById = useCallback(
    async (id, params = {}) => {
      if (!endpoint || id === undefined || id === null) return null
      setLoading(true)
      setError(null)
      try {
        const response = await crudApi.getById(endpoint, id, params)
        const singleItem = response?.data || response
        setItem(singleItem)
        return singleItem
      } catch (err) {
        setError(err.message || `Failed to fetch record #${id}`)
        throw err
      } finally {
        setLoading(false)
      }
    },
    [endpoint]
  )

  // Create record
  const createItem = useCallback(
    async (payload) => {
      if (!endpoint) return null
      setActionLoading(true)
      setError(null)
      try {
        const created = await crudApi.create(endpoint, payload)
        const newItem = created?.data || created

        // Optimistically add to items list
        setItems((prev) => [newItem, ...prev])
        return newItem
      } catch (err) {
        setError(err.message || 'Failed to create record')
        throw err
      } finally {
        setActionLoading(false)
      }
    },
    [endpoint]
  )

  // Update record (supports full PUT or partial PATCH)
  const updateItem = useCallback(
    async (id, payload, isPatch = false) => {
      if (!endpoint) return null
      setActionLoading(true)
      setError(null)
      try {
        const updated = isPatch
          ? await crudApi.patch(endpoint, id, payload)
          : await crudApi.update(endpoint, id, payload)

        const updatedItem = updated?.data || updated

        // Update list state
        setItems((prev) =>
          prev.map((it) => (it[idField] === id ? { ...it, ...updatedItem } : it))
        )
        if (item && item[idField] === id) {
          setItem((prev) => ({ ...prev, ...updatedItem }))
        }

        return updatedItem
      } catch (err) {
        setError(err.message || `Failed to update record #${id}`)
        throw err
      } finally {
        setActionLoading(false)
      }
    },
    [endpoint, idField, item]
  )

  // Delete record
  const deleteItem = useCallback(
    async (id) => {
      if (!endpoint) return null
      setActionLoading(true)
      setError(null)
      try {
        await crudApi.remove(endpoint, id)
        // Remove from list
        setItems((prev) => prev.filter((it) => it[idField] !== id))
        if (item && item[idField] === id) {
          setItem(null)
        }
        return true
      } catch (err) {
        setError(err.message || `Failed to delete record #${id}`)
        throw err
      } finally {
        setActionLoading(false)
      }
    },
    [endpoint, idField, item]
  )

  // Auto fetch on mount or endpoint change if enabled
  useEffect(() => {
    if (autoFetch && endpoint) {
      fetchAll(initialParams).catch(() => {
        // Handled in state
      })
    }
  }, [autoFetch, endpoint, fetchAll])

  return {
    items,
    data,
    item,
    loading,
    actionLoading,
    error,
    fetchAll,
    fetchById,
    createItem,
    updateItem,
    deleteItem,
    setItems,
    setData,
    setItem,
    clearError,
  }
}

export default useCrud
