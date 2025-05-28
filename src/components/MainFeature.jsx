import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'react-toastify'
import { format, isToday, isPast, parseISO } from 'date-fns'
import { useSelector } from 'react-redux'
import ApperIcon from './ApperIcon'
import TaskService from '../services/TaskService'
import CategoryService from '../services/CategoryService'

const MainFeature = () => {
  // Authentication state
  const { user, isAuthenticated } = useSelector((state) => state.user)
  
  // Loading states
  const [isTasksLoading, setIsTasksLoading] = useState(false)
  const [isCategoriesLoading, setIsCategoriesLoading] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  
  // Data states
  const [tasks, setTasks] = useState([])
  const [categories, setCategories] = useState([])
  const [showAddTask, setShowAddTask] = useState(false)
  const [filter, setFilter] = useState('all')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [editingTask, setEditingTask] = useState(null)

  
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    dueDate: '',
    priority: 'medium',
    categoryId: ''
  })

  // Load tasks and categories from database on component mount
  useEffect(() => {
    if (isAuthenticated) {
      loadTasks()
      loadCategories()
    }
  }, [isAuthenticated])

  // Load tasks from database
  const loadTasks = async () => {
    try {
      setIsTasksLoading(true)
      const response = await TaskService.fetchTasks()
      
      // Transform database data to UI format
      const transformedTasks = response.data.map(task => ({
        id: task.Id?.toString() || task.id?.toString(),
        title: task.title || task.Name || '',
        description: task.description || '',
        dueDate: task.due_date || '',
        priority: task.priority || 'medium',
        categoryId: task.category || '',
        isCompleted: task.is_completed ? task.is_completed.includes('completed') : false,
        createdAt: task.created_at || task.CreatedOn || new Date().toISOString(),
        updatedAt: task.updated_at || task.ModifiedOn || new Date().toISOString(),
        tags: task.Tags || '',
        owner: task.Owner || ''
      }))
      
      setTasks(transformedTasks)
    } catch (error) {
      console.error('Failed to load tasks:', error)
      toast.error('Failed to load tasks. Please try again.')
      setTasks([])
    } finally {
      setIsTasksLoading(false)
    }
  }

  // Load categories from database
  const loadCategories = async () => {
    try {
      setIsCategoriesLoading(true)
      const response = await CategoryService.fetchCategories()
      
      // Transform database data to UI format
      const transformedCategories = response.data.map(category => ({
        id: category.Id?.toString() || category.id?.toString(),
        name: category.Name || '',
        color: category.color || '#6366f1',
        taskCount: 0 // Will be calculated below
      }))
      
      setCategories(transformedCategories)
    } catch (error) {
      console.error('Failed to load categories:', error)
      toast.error('Failed to load categories. Using default categories.')
      // Set default categories if database load fails
      setCategories([
        { id: 'default-1', name: 'Personal', color: '#3b82f6', taskCount: 0 },
        { id: 'default-2', name: 'Work', color: '#8b5cf6', taskCount: 0 },
        { id: 'default-3', name: 'Shopping', color: '#10b981', taskCount: 0 },
        { id: 'default-4', name: 'Health', color: '#f59e0b', taskCount: 0 }
      ])
    } finally {
      setIsCategoriesLoading(false)
    }
  }

  // Update category task counts whenever tasks change
  useEffect(() => {
    updateCategoryTaskCounts()
  }, [tasks, categories])

  const updateCategoryTaskCounts = () => {
    const updatedCategories = categories.map(category => ({
      ...category,
      taskCount: tasks.filter(task => task.categoryId === category.id && !task.isCompleted).length
    }))
    if (JSON.stringify(updatedCategories) !== JSON.stringify(categories)) {
      setCategories(updatedCategories)
    }
  }


  const handleAddTask = async (e) => {
    e.preventDefault()
    if (!taskForm.title.trim()) {
      toast.error('Please enter a task title')
      return
    }

    try {
      setIsCreating(true)
      
      // Transform UI data to database format
      const taskData = {
        Name: taskForm.title,
        title: taskForm.title,
        description: taskForm.description,
        due_date: taskForm.dueDate,
        priority: taskForm.priority,
        category: taskForm.categoryId,
        is_completed: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        Tags: '',
        Owner: user?.emailAddress || ''
      }

      const createdTasks = await TaskService.createTasks(taskData)
      
      if (createdTasks && createdTasks.length > 0) {
        // Transform created task back to UI format
        const newTask = {
          id: createdTasks[0].Id?.toString(),
          title: createdTasks[0].title || createdTasks[0].Name,
          description: createdTasks[0].description || '',
          dueDate: createdTasks[0].due_date || '',
          priority: createdTasks[0].priority || 'medium',
          categoryId: createdTasks[0].category || '',
          isCompleted: false,
          createdAt: createdTasks[0].created_at || createdTasks[0].CreatedOn,
          updatedAt: createdTasks[0].updated_at || createdTasks[0].ModifiedOn,
          tags: createdTasks[0].Tags || '',
          owner: createdTasks[0].Owner || ''
        }

        setTasks([newTask, ...tasks])
        setTaskForm({ title: '', description: '', dueDate: '', priority: 'medium', categoryId: '' })
        setShowAddTask(false)
        toast.success('Task created successfully!')
      }
    } catch (error) {
      console.error('Failed to create task:', error)
      toast.error('Failed to create task. Please try again.')
    } finally {
      setIsCreating(false)
    }
  }


  const handleEditTask = async (e) => {
    e.preventDefault()
    if (!taskForm.title.trim()) {
      toast.error('Please enter a task title')
      return
    }

    try {
      setIsUpdating(true)
      
      // Transform UI data to database format
      const taskData = {
        Id: editingTask.id,
        Name: taskForm.title,
        title: taskForm.title,
        description: taskForm.description,
        due_date: taskForm.dueDate,
        priority: taskForm.priority,
        category: taskForm.categoryId,
        updated_at: new Date().toISOString()
      }

      const updatedTasks = await TaskService.updateTasks(taskData)
      
      if (updatedTasks && updatedTasks.length > 0) {
        // Update local state with the updated task
        const updatedTasksState = tasks.map(task =>
          task.id === editingTask.id
            ? {
                ...task,
                title: updatedTasks[0].title || updatedTasks[0].Name,
                description: updatedTasks[0].description || '',
                dueDate: updatedTasks[0].due_date || '',
                priority: updatedTasks[0].priority || 'medium',
                categoryId: updatedTasks[0].category || '',
                updatedAt: updatedTasks[0].updated_at || updatedTasks[0].ModifiedOn
              }
            : task
        )

        setTasks(updatedTasksState)
        setEditingTask(null)
        setTaskForm({ title: '', description: '', dueDate: '', priority: 'medium', categoryId: '' })
        setShowAddTask(false)
        toast.success('Task updated successfully!')
      }
    } catch (error) {
      console.error('Failed to update task:', error)
      toast.error('Failed to update task. Please try again.')
    } finally {
      setIsUpdating(false)
    }
  }


  const toggleTaskCompletion = async (taskId) => {
    try {
      const task = tasks.find(t => t.id === taskId)
      if (!task) return

      const updatedCompletionStatus = !task.isCompleted
      
      // Transform UI data to database format
      const taskData = {
        Id: taskId,
        is_completed: updatedCompletionStatus ? 'completed' : '',
        updated_at: new Date().toISOString()
      }

      await TaskService.updateTasks(taskData)
      
      // Update local state immediately for better UX
      const updatedTasks = tasks.map(t =>
        t.id === taskId
          ? { ...t, isCompleted: updatedCompletionStatus, updatedAt: new Date().toISOString() }
          : t
      )
      setTasks(updatedTasks)
      
      if (updatedCompletionStatus) {
        toast.success('Task completed! 🎉')
      } else {
        toast.success('Task marked as pending')
      }
    } catch (error) {
      console.error('Failed to toggle task completion:', error)
      toast.error('Failed to update task status. Please try again.')
    }
  }


  const deleteTask = async (taskId) => {
    try {
      setIsDeleting(true)
      
      await TaskService.deleteTasks(taskId)
      
      // Remove from local state
      setTasks(tasks.filter(task => task.id !== taskId))
      toast.success('Task deleted successfully')
    } catch (error) {
      console.error('Failed to delete task:', error)
      toast.error('Failed to delete task. Please try again.')
    } finally {
      setIsDeleting(false)
    }
  }


  const startEditTask = (task) => {
    setEditingTask(task)
    setTaskForm({
      title: task.title,
      description: task.description,
      dueDate: task.dueDate,
      priority: task.priority,
      categoryId: task.categoryId
    })
    setShowAddTask(true)
  }

  const cancelEdit = () => {
    setEditingTask(null)
    setTaskForm({ title: '', description: '', dueDate: '', priority: 'medium', categoryId: '' })
    setShowAddTask(false)
  }

  const getFilteredTasks = () => {
    let filtered = tasks

    if (selectedCategory) {
      filtered = filtered.filter(task => task.categoryId === selectedCategory)
    }

    switch (filter) {
      case 'completed':
        return filtered.filter(task => task.isCompleted)
      case 'pending':
        return filtered.filter(task => !task.isCompleted)
      case 'today':
        return filtered.filter(task => task.dueDate && isToday(parseISO(task.dueDate)))
      case 'overdue':
        return filtered.filter(task => task.dueDate && isPast(parseISO(task.dueDate)) && !task.isCompleted)
      default:
        return filtered
    }
  }

  const getCategoryById = (categoryId) => {
    return categories.find(cat => cat.id === categoryId)
  }

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'high': return 'AlertCircle'
      case 'medium': return 'Clock'
      case 'low': return 'Minus'
      default: return 'Clock'
    }
  }

  const filteredTasks = getFilteredTasks()
  const completedTasksCount = tasks.filter(task => task.isCompleted).length
  const pendingTasksCount = tasks.filter(task => !task.isCompleted).length

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Stats Dashboard */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6"
      >
        <div className="task-card text-center">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl mx-auto mb-3 flex items-center justify-center">
            <ApperIcon name="List" className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-surface-800 dark:text-surface-200">{tasks.length}</p>
          <p className="text-xs sm:text-sm text-surface-600 dark:text-surface-400">Total Tasks</p>
        </div>

        <div className="task-card text-center">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl mx-auto mb-3 flex items-center justify-center">
            <ApperIcon name="CheckCircle" className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-surface-800 dark:text-surface-200">{completedTasksCount}</p>
          <p className="text-xs sm:text-sm text-surface-600 dark:text-surface-400">Completed</p>
        </div>

        <div className="task-card text-center">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl mx-auto mb-3 flex items-center justify-center">
            <ApperIcon name="Clock" className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-surface-800 dark:text-surface-200">{pendingTasksCount}</p>
          <p className="text-xs sm:text-sm text-surface-600 dark:text-surface-400">Pending</p>
        </div>

        <div className="task-card text-center">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl mx-auto mb-3 flex items-center justify-center">
            <ApperIcon name="Target" className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-surface-800 dark:text-surface-200">
            {tasks.length > 0 ? Math.round((completedTasksCount / tasks.length) * 100) : 0}%
          </p>
          <p className="text-xs sm:text-sm text-surface-600 dark:text-surface-400">Progress</p>
        </div>
      </motion.div>

      {/* Controls */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-col lg:flex-row gap-4 lg:gap-6 lg:items-center lg:justify-between"
      >
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <button
            onClick={() => setShowAddTask(!showAddTask)}
            className="btn-primary flex items-center justify-center"
          >
            <ApperIcon name="Plus" className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
            Add Task
          </button>

          <div className="flex gap-2 sm:gap-3">
            {['all', 'pending', 'completed', 'today', 'overdue'].map((filterType) => (
              <button
                key={filterType}
                onClick={() => setFilter(filterType)}
                className={`px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-300 capitalize ${
                  filter === filterType
                    ? 'bg-primary text-white shadow-lg'
                    : 'btn-secondary'
                }`}
              >
                {filterType}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 lg:items-center">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="input-field text-sm py-2"
          >
            <option value="">All Categories</option>
            {categories.map(category => (
              <option key={category.id} value={category.id}>
                {category.name} ({category.taskCount})
              </option>
            ))}
          </select>
        </div>
      </motion.div>

      {/* Categories */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4"
      >
        {categories.map((category) => (
          <motion.button
            key={category.id}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setSelectedCategory(selectedCategory === category.id ? '' : category.id)}
            className={`task-card p-3 sm:p-4 text-left transition-all duration-300 ${
              selectedCategory === category.id 
                ? 'ring-2 ring-primary transform scale-105' 
                : ''
            }`}
          >
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div 
                className="w-3 h-3 sm:w-4 sm:h-4 rounded-full"
                style={{ backgroundColor: category.color }}
              />
              <div>
                <p className="font-medium text-sm sm:text-base text-surface-800 dark:text-surface-200">
                  {category.name}
                </p>
                <p className="text-xs sm:text-sm text-surface-600 dark:text-surface-400">
                  {category.taskCount} tasks
                </p>
              </div>
            </div>
          </motion.button>
        ))}
      </motion.div>

      {/* Add/Edit Task Form */}
      <AnimatePresence>
        {showAddTask && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="task-card"
          >
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h3 className="text-lg sm:text-xl font-semibold text-surface-800 dark:text-surface-200">
                {editingTask ? 'Edit Task' : 'Add New Task'}
              </h3>
              <button
                onClick={cancelEdit}
                className="p-2 hover:bg-surface-100 dark:hover:bg-surface-700 rounded-lg transition-colors"
              >
                <ApperIcon name="X" className="w-5 h-5 text-surface-600 dark:text-surface-400" />
              </button>
            </div>

            <form onSubmit={editingTask ? handleEditTask : handleAddTask} className="space-y-4 sm:space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                    Task Title *
                  </label>
                  <input
                    type="text"
                    value={taskForm.title}
                    onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                    className="input-field"
                    placeholder="Enter task title..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                    Category
                  </label>
                  <select
                    value={taskForm.categoryId}
                    onChange={(e) => setTaskForm({ ...taskForm, categoryId: e.target.value })}
                    className="input-field"
                  >
                    <option value="">Select category...</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                  Description
                </label>
                <textarea
                  value={taskForm.description}
                  onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                  className="input-field resize-none h-20 sm:h-24"
                  placeholder="Add task description..."
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={taskForm.dueDate}
                    onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })}
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                    Priority
                  </label>
                  <select
                    value={taskForm.priority}
                    onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}
                    className="input-field"
                  >
                    <option value="low">Low Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="high">High Priority</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <button 
                  type="submit" 
                  className="btn-primary flex items-center justify-center"
                  disabled={isCreating || isUpdating}
                >
                  {isCreating || isUpdating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      {editingTask ? 'Updating...' : 'Creating...'}
                    </>
                  ) : (
                    <>
                      <ApperIcon name={editingTask ? "Save" : "Plus"} className="w-4 h-4 mr-2" />
                      {editingTask ? 'Update Task' : 'Create Task'}
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={cancelEdit}
                  className="btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tasks List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="space-y-3 sm:space-y-4"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-lg sm:text-xl font-semibold text-surface-800 dark:text-surface-200">
            Tasks ({filteredTasks.length})
          </h3>
        </div>

        <AnimatePresence>
          {filteredTasks.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="task-card text-center py-8 sm:py-12"
            >
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-surface-100 dark:bg-surface-700 rounded-full mx-auto mb-4 flex items-center justify-center">
                <ApperIcon name="Calendar" className="w-8 h-8 sm:w-10 sm:h-10 text-surface-500" />
              </div>
              <p className="text-surface-600 dark:text-surface-400 text-sm sm:text-base">
                No tasks found. Create your first task to get started!
              </p>
            </motion.div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {filteredTasks.map((task) => {
                const category = getCategoryById(task.categoryId)
                const isOverdue = task.dueDate && isPast(parseISO(task.dueDate)) && !task.isCompleted
                
                return (
                  <motion.div
                    key={task.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    layout
                    className={`task-card ${task.isCompleted ? 'opacity-75' : ''} ${
                      isOverdue ? 'border-l-4 border-red-500' : ''
                    }`}
                  >
                    <div className="flex items-start space-x-3 sm:space-x-4">
                      <button
                        onClick={() => toggleTaskCompletion(task.id)}
                        className={`mt-1 w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
                          task.isCompleted
                            ? 'bg-green-500 border-green-500'
                            : 'border-surface-300 dark:border-surface-600 hover:border-green-500'
                        }`}
                      >
                        {task.isCompleted && (
                          <ApperIcon name="Check" className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                        )}
                      </button>

                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-4">
                          <div className="flex-1 min-w-0">
                            <h4 className={`font-medium text-sm sm:text-base ${
                              task.isCompleted 
                                ? 'line-through text-surface-500 dark:text-surface-500' 
                                : 'text-surface-800 dark:text-surface-200'
                            }`}>
                              {task.title}
                            </h4>
                            
                            {task.description && (
                              <p className={`text-xs sm:text-sm mt-1 ${
                                task.isCompleted 
                                  ? 'line-through text-surface-400 dark:text-surface-600' 
                                  : 'text-surface-600 dark:text-surface-400'
                              }`}>
                                {task.description}
                              </p>
                            )}

                            <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-2 sm:mt-3">
                              {category && (
                                <span className="category-badge" style={{ 
                                  backgroundColor: `${category.color}15`, 
                                  color: category.color 
                                }}>
                                  {category.name}
                                </span>
                              )}

                              <span className={`category-badge priority-${task.priority}`}>
                                <ApperIcon name={getPriorityIcon(task.priority)} className="w-3 h-3 mr-1" />
                                {task.priority}
                              </span>

                              {task.dueDate && (
                                <span className={`text-xs flex items-center ${
                                  isOverdue 
                                    ? 'text-red-600 dark:text-red-400' 
                                    : 'text-surface-500 dark:text-surface-500'
                                }`}>
                                  <ApperIcon name="Calendar" className="w-3 h-3 mr-1" />
                                  {format(parseISO(task.dueDate), 'MMM dd, yyyy')}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => startEditTask(task)}
                              className="p-1.5 sm:p-2 hover:bg-surface-100 dark:hover:bg-surface-700 rounded-lg transition-colors"
                            >
                              <ApperIcon name="Edit2" className="w-4 h-4 text-surface-600 dark:text-surface-400" />
                            </button>
                            
                            <button
                              onClick={() => deleteTask(task.id)}
                              className="p-1.5 sm:p-2 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                            >
                              <ApperIcon name="Trash2" className="w-4 h-4 text-red-500" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}

export default MainFeature