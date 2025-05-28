import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import MainFeature from '../components/MainFeature'
import ApperIcon from '../components/ApperIcon'

const Home = () => {
  const [darkMode, setDarkMode] = useState(false)

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [darkMode])

  return (
    <div className="min-h-screen">
      {/* Header */}
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-50 bg-white/80 dark:bg-surface-900/80 backdrop-blur-xl border-b border-surface-200 dark:border-surface-700"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-primary to-primary-light rounded-xl flex items-center justify-center">
                <ApperIcon name="CheckSquare" className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-gradient">TaskFlow</h1>
            </div>
            
            <div className="flex items-center space-x-3 sm:space-x-4">
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="neu-button p-2 sm:p-3 rounded-xl transition-all duration-300"
              >
                <ApperIcon 
                  name={darkMode ? "Sun" : "Moon"} 
                  className="w-4 h-4 sm:w-5 sm:h-5 text-surface-600 dark:text-surface-400" 
                />
              </button>
              
              <div className="hidden sm:flex items-center space-x-2 text-sm text-surface-600 dark:text-surface-400">
                <ApperIcon name="Zap" className="w-4 h-4" />
                <span>Productivity Boost</span>
              </div>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
        <MainFeature />
      </main>

      {/* Footer */}
      <motion.footer 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-16 sm:mt-20 lg:mt-24 border-t border-surface-200 dark:border-surface-700 bg-white/50 dark:bg-surface-900/50 backdrop-blur-sm"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <ApperIcon name="Heart" className="w-4 h-4 sm:w-5 sm:h-5 text-red-500" />
              <span className="text-sm sm:text-base text-surface-600 dark:text-surface-400">
                Made with passion for productivity
              </span>
            </div>
            <p className="text-xs sm:text-sm text-surface-500 dark:text-surface-500">
              TaskFlow - Streamline your workflow, achieve your goals
            </p>
          </div>
        </div>
      </motion.footer>
    </div>
  )
}

export default Home