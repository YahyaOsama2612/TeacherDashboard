import axiosClient from './axiosClient'

/**
 * Standard CRUD API Service generator and utilities
 */
export const crudApi = {
  /**
   * Fetch all items with optional query parameters
   * @param {string} endpoint - e.g. '/api/teacher/students'
   * @param {Object} [params] - Query parameters
   */
  async getAll(endpoint, params = {}) {
    return await axiosClient.get(endpoint, { params })
  },

  /**
   * Fetch single item by ID
   * @param {string} endpoint - e.g. '/api/teacher/students'
   * @param {string|number} id
   * @param {Object} [params]
   */
  async getById(endpoint, id, params = {}) {
    return await axiosClient.get(`${endpoint}/${id}`, { params })
  },

  /**
   * Create a new item
   * @param {string} endpoint
   * @param {Object} data
   */
  async create(endpoint, data) {
    return await axiosClient.post(endpoint, data)
  },

  /**
   * Update an existing item (PUT)
   * @param {string} endpoint
   * @param {string|number} id
   * @param {Object} data
   */
  async update(endpoint, id, data) {
    return await axiosClient.put(`${endpoint}/${id}`, data)
  },

  /**
   * Partially update an item (PATCH)
   * @param {string} endpoint
   * @param {string|number} id
   * @param {Object} data
   */
  async patch(endpoint, id, data) {
    return await axiosClient.patch(`${endpoint}/${id}`, data)
  },

  /**
   * Delete an item
   * @param {string} endpoint
   * @param {string|number} id
   */
  async remove(endpoint, id) {
    return await axiosClient.delete(`${endpoint}/${id}`)
  },

  /**
   * Helper factory to create a dedicated resource client
   * Example: const studentsClient = crudApi.createResource('/api/teacher/students')
   */
  createResource(endpoint) {
    return {
      getAll: (params) => crudApi.getAll(endpoint, params),
      getById: (id, params) => crudApi.getById(endpoint, id, params),
      create: (data) => crudApi.create(endpoint, data),
      update: (id, data) => crudApi.update(endpoint, id, data),
      patch: (id, data) => crudApi.patch(endpoint, id, data),
      remove: (id) => crudApi.remove(endpoint, id),
    }
  },
}

export default crudApi
