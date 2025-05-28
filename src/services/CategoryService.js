class CategoryService {
  constructor() {
    const { ApperClient } = window.ApperSDK
    this.apperClient = new ApperClient({
      apperProjectId: import.meta.env.VITE_APPER_PROJECT_ID,
      apperPublicKey: import.meta.env.VITE_APPER_PUBLIC_KEY
    })
    this.tableName = 'category2'
  }

  // Fetch all categories with optional filtering and pagination
  async fetchCategories(params = {}) {
    try {
      // All fields from category2 table for complete data display
      const allFields = [
        'Name', 'Tags', 'Owner', 'CreatedOn', 'CreatedBy', 
        'ModifiedOn', 'ModifiedBy', 'color'
      ]

      const queryParams = {
        fields: allFields,
        orderBy: [
          {
            fieldName: 'Name',
            SortType: 'ASC'
          }
        ],
        pagingInfo: {
          limit: params.limit || 20,
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
      console.error('Error fetching categories:', error)
      throw new Error('Failed to fetch categories. Please try again.')
    }
  }

  // Get a single category by ID
  async getCategoryById(categoryId) {
    try {
      const allFields = [
        'Name', 'Tags', 'Owner', 'CreatedOn', 'CreatedBy', 
        'ModifiedOn', 'ModifiedBy', 'color'
      ]

      const params = {
        fields: allFields
      }

      const response = await this.apperClient.getRecordById(this.tableName, categoryId, params)
      
      if (!response || !response.data) {
        return null
      }

      return response.data
    } catch (error) {
      console.error(`Error fetching category with ID ${categoryId}:`, error)
      throw new Error('Failed to fetch category details. Please try again.')
    }
  }

  // Create new categories (supports bulk creation)
  async createCategories(categoriesData) {
    try {
      // Only include Updateable fields for creation
      const updateableFields = ['Name', 'Tags', 'Owner', 'color']

      // Ensure categoriesData is an array
      const categories = Array.isArray(categoriesData) ? categoriesData : [categoriesData]
      
      // Filter and format each category to only include updateable fields
      const filteredCategories = categories.map(category => {
        const filteredCategory = {}
        updateableFields.forEach(field => {
          if (category[field] !== undefined && category[field] !== null && category[field] !== '') {
            filteredCategory[field] = category[field]
          }
        })
        return filteredCategory
      })

      const params = {
        records: filteredCategories
      }

      const response = await this.apperClient.createRecord(this.tableName, params)

      if (response && response.success && response.results) {
        const successfulRecords = response.results.filter(result => result.success)
        const failedRecords = response.results.filter(result => !result.success)

        if (failedRecords.length > 0) {
          console.warn(`Failed to create ${failedRecords.length} categories`)
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
        throw new Error('Failed to create categories')
      }
    } catch (error) {
      console.error('Error creating categories:', error)
      throw new Error('Failed to create categories. Please check your data and try again.')
    }
  }

  // Update existing categories (supports bulk updates)
  async updateCategories(categoriesData) {
    try {
      // Only include Updateable fields for updates (plus Id)
      const updateableFields = ['Name', 'Tags', 'Owner', 'color']

      // Ensure categoriesData is an array
      const categories = Array.isArray(categoriesData) ? categoriesData : [categoriesData]
      
      // Filter and format each category to only include updateable fields + Id
      const filteredCategories = categories.map(category => {
        const filteredCategory = { Id: category.Id || category.id }
        updateableFields.forEach(field => {
          if (category[field] !== undefined) {
            filteredCategory[field] = category[field]
          }
        })
        return filteredCategory
      })

      const params = {
        records: filteredCategories
      }

      const response = await this.apperClient.updateRecord(this.tableName, params)

      if (response && response.success && response.results) {
        const successfulUpdates = response.results.filter(result => result.success)
        const failedUpdates = response.results.filter(result => !result.success)

        if (failedUpdates.length > 0) {
          console.warn(`Failed to update ${failedUpdates.length} categories`)
          failedUpdates.forEach(record => {
            console.error(`Error: ${record.message || "Record does not exist"}`)
          })
        }

        return successfulUpdates.map(result => result.data)
      } else {
        throw new Error('Failed to update categories')
      }
    } catch (error) {
      console.error('Error updating categories:', error)
      throw new Error('Failed to update categories. Please check your data and try again.')
    }
  }

  // Delete categories by IDs
  async deleteCategories(categoryIds) {
    try {
      // Ensure categoryIds is an array
      const ids = Array.isArray(categoryIds) ? categoryIds : [categoryIds]
      
      const params = {
        RecordIds: ids
      }

      const response = await this.apperClient.deleteRecord(this.tableName, params)

      if (response && response.success && response.results) {
        const successfulDeletions = response.results.filter(result => result.success)
        const failedDeletions = response.results.filter(result => !result.success)

        if (failedDeletions.length > 0) {
          console.warn(`Failed to delete ${failedDeletions.length} categories`)
          failedDeletions.forEach(record => {
            console.error(`Error: ${record.message || "Record does not exist"}`)
          })
        }

        return true
      } else {
        throw new Error('Failed to delete categories')
      }
    } catch (error) {
      console.error('Error deleting categories:', error)
      throw new Error('Failed to delete categories. Please try again.')
    }
  }

  // Search categories by name
  async searchCategories(searchTerm, additionalFilters = {}) {
    try {
      const params = {
        where: [
          {
            fieldName: 'Name',
            operator: 'Contains',
            values: [searchTerm]
          }
        ],
        ...additionalFilters
      }

      return await this.fetchCategories(params)
    } catch (error) {
      console.error('Error searching categories:', error)
      throw new Error('Failed to search categories. Please try again.')
    }
  }
}

export default new CategoryService()