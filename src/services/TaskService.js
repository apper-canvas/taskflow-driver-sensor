class TaskService {
  constructor() {
    const { ApperClient } = window.ApperSDK
    this.apperClient = new ApperClient({
      apperProjectId: import.meta.env.VITE_APPER_PROJECT_ID,
      apperPublicKey: import.meta.env.VITE_APPER_PUBLIC_KEY
    })
    this.tableName = 'task30'
  }

  // Fetch all tasks with optional filtering and pagination
  async fetchTasks(params = {}) {
    try {
      // All fields from task30 table for complete data display
      const allFields = [
        'Name', 'Tags', 'Owner', 'CreatedOn', 'CreatedBy', 'ModifiedOn', 'ModifiedBy',
        'title', 'description', 'due_date', 'priority', 'is_completed', 
        'created_at', 'updated_at', 'category'
      ]

      const queryParams = {
        fields: allFields,
        orderBy: [
          {
            fieldName: 'created_at',
            SortType: 'DESC'
          }
        ],
        pagingInfo: {
          limit: params.limit || 50,
          offset: params.offset || 0
        },
        ...params
      }

      const response = await this.apperClient.fetchRecords(this.tableName, queryParams)
      
      if (!response || !response.data) {
        return { data: [], total: 0 }
      }

      return {
        data: response.data,
        total: response.totalCount || response.data.length
      }
    } catch (error) {
      console.error('Error fetching tasks:', error)
      throw new Error('Failed to fetch tasks. Please try again.')
    }
  }

  // Get a single task by ID
  async getTaskById(taskId) {
    try {
      const allFields = [
        'Name', 'Tags', 'Owner', 'CreatedOn', 'CreatedBy', 'ModifiedOn', 'ModifiedBy',
        'title', 'description', 'due_date', 'priority', 'is_completed', 
        'created_at', 'updated_at', 'category'
      ]

      const params = {
        fields: allFields
      }

      const response = await this.apperClient.getRecordById(this.tableName, taskId, params)
      
      if (!response || !response.data) {
        return null
      }

      return response.data
    } catch (error) {
      console.error(`Error fetching task with ID ${taskId}:`, error)
      throw new Error('Failed to fetch task details. Please try again.')
    }
  }

  // Create new tasks (supports bulk creation)
  async createTasks(tasksData) {
    try {
      // Only include Updateable fields for creation
      const updateableFields = [
        'Name', 'Tags', 'Owner', 'title', 'description', 'due_date', 
        'priority', 'is_completed', 'created_at', 'updated_at', 'category'
      ]

      // Ensure tasksData is an array
      const tasks = Array.isArray(tasksData) ? tasksData : [tasksData]
      
      // Filter and format each task to only include updateable fields
      const filteredTasks = tasks.map(task => {
        const filteredTask = {}
        updateableFields.forEach(field => {
          if (task[field] !== undefined && task[field] !== null && task[field] !== '') {
            // Format data according to field types
            if (field === 'due_date') {
              // Date field - ensure ISO format
              filteredTask[field] = task[field]
            } else if (field === 'created_at' || field === 'updated_at') {
              // DateTime field - ensure ISO format
              filteredTask[field] = task[field] || new Date().toISOString()
            } else if (field === 'priority') {
              // Picklist field - ensure valid value
              const validPriorities = ['low', 'medium', 'high']
              filteredTask[field] = validPriorities.includes(task[field]) ? task[field] : 'medium'
            } else if (field === 'is_completed') {
              // Checkbox field - comma-separated string or empty
              filteredTask[field] = task[field] ? 'completed' : ''
            } else {
              filteredTask[field] = task[field]
            }
          }
        })
        return filteredTask
      })

      const params = {
        records: filteredTasks
      }

      const response = await this.apperClient.createRecord(this.tableName, params)

      if (response && response.success && response.results) {
        const successfulRecords = response.results.filter(result => result.success)
        const failedRecords = response.results.filter(result => !result.success)

        if (failedRecords.length > 0) {
          console.warn(`Failed to create ${failedRecords.length} tasks`)
          failedRecords.forEach(record => {
            if (record.errors) {
              record.errors.forEach(error => {
                console.error(`Field: ${error.fieldLabel}, Error: ${error.message}`)
              })
            } else if (record.message) {
              console.error(`Error: ${record.message}`)
            }
          })
        }

        return successfulRecords.map(result => result.data)
      } else {
        throw new Error('Failed to create tasks')
      }
    } catch (error) {
      console.error('Error creating tasks:', error)
      throw new Error('Failed to create tasks. Please check your data and try again.')
    }
  }

  // Update existing tasks (supports bulk updates)
  async updateTasks(tasksData) {
    try {
      // Only include Updateable fields for updates (plus Id)
      const updateableFields = [
        'Name', 'Tags', 'Owner', 'title', 'description', 'due_date', 
        'priority', 'is_completed', 'created_at', 'updated_at', 'category'
      ]

      // Ensure tasksData is an array
      const tasks = Array.isArray(tasksData) ? tasksData : [tasksData]
      
      // Filter and format each task to only include updateable fields + Id
      const filteredTasks = tasks.map(task => {
        const filteredTask = { Id: task.Id || task.id }
        updateableFields.forEach(field => {
          if (task[field] !== undefined) {
            // Format data according to field types
            if (field === 'due_date') {
              // Date field - ensure ISO format
              filteredTask[field] = task[field]
            } else if (field === 'created_at' || field === 'updated_at') {
              // DateTime field - ensure ISO format
              filteredTask[field] = task[field] || new Date().toISOString()
            } else if (field === 'priority') {
              // Picklist field - ensure valid value
              const validPriorities = ['low', 'medium', 'high']
              filteredTask[field] = validPriorities.includes(task[field]) ? task[field] : 'medium'
            } else if (field === 'is_completed') {
              // Checkbox field - comma-separated string or empty
              filteredTask[field] = task[field] ? 'completed' : ''
            } else {
              filteredTask[field] = task[field]
            }
          }
        })
        return filteredTask
      })

      const params = {
        records: filteredTasks
      }

      const response = await this.apperClient.updateRecord(this.tableName, params)

      if (response && response.success && response.results) {
        const successfulUpdates = response.results.filter(result => result.success)
        const failedUpdates = response.results.filter(result => !result.success)

        if (failedUpdates.length > 0) {
          console.warn(`Failed to update ${failedUpdates.length} tasks`)
          failedUpdates.forEach(record => {
            console.error(`Error: ${record.message || "Record does not exist"}`)
          })
        }

        return successfulUpdates.map(result => result.data)
      } else {
        throw new Error('Failed to update tasks')
      }
    } catch (error) {
      console.error('Error updating tasks:', error)
      throw new Error('Failed to update tasks. Please check your data and try again.')
    }
  }

  // Delete tasks by IDs
  async deleteTasks(taskIds) {
    try {
      // Ensure taskIds is an array
      const ids = Array.isArray(taskIds) ? taskIds : [taskIds]
      
      const params = {
        RecordIds: ids
      }

      const response = await this.apperClient.deleteRecord(this.tableName, params)

      if (response && response.success && response.results) {
        const successfulDeletions = response.results.filter(result => result.success)
        const failedDeletions = response.results.filter(result => !result.success)

        if (failedDeletions.length > 0) {
          console.warn(`Failed to delete ${failedDeletions.length} tasks`)
          failedDeletions.forEach(record => {
            console.error(`Error: ${record.message || "Record does not exist"}`)
          })
        }

        return true
      } else {
        throw new Error('Failed to delete tasks')
      }
    } catch (error) {
      console.error('Error deleting tasks:', error)
      throw new Error('Failed to delete tasks. Please try again.')
    }
  }

  // Search tasks by title or description
  async searchTasks(searchTerm, additionalFilters = {}) {
    try {
      const params = {
        where: [
          {
            fieldName: 'title',
            operator: 'Contains',
            values: [searchTerm]
          }
        ],
        whereGroups: [
          {
            operator: 'OR',
            subGroups: [
              {
                conditions: [
                  {
                    fieldName: 'title',
                    operator: 'Contains',
                    values: [searchTerm]
                  }
                ],
                operator: ''
              },
              {
                conditions: [
                  {
                    fieldName: 'description',
                    operator: 'Contains',
                    values: [searchTerm]
                  }
                ],
                operator: ''
              }
            ]
          }
        ],
        ...additionalFilters
      }

      return await this.fetchTasks(params)
    } catch (error) {
      console.error('Error searching tasks:', error)
      throw new Error('Failed to search tasks. Please try again.')
    }
  }
}

export default new TaskService()