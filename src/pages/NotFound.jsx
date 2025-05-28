import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import ApperIcon from '../components/ApperIcon'

const NotFound = () => {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="space-y-6 sm:space-y-8"
        >
          <div className="w-24 h-24 sm:w-32 sm:h-32 mx-auto bg-gradient-to-br from-primary to-primary-light rounded-full flex items-center justify-center">
            <ApperIcon name="AlertTriangle" className="w-12 h-12 sm:w-16 sm:h-16 text-white" />
          </div>
          
          <div className="space-y-2 sm:space-y-4">
            <h1 className="text-6xl sm:text-8xl font-bold text-gradient">404</h1>
            <h2 className="text-xl sm:text-2xl font-semibold text-surface-800 dark:text-surface-200">
              Page Not Found
            </h2>
            <p className="text-sm sm:text-base text-surface-600 dark:text-surface-400 max-w-sm mx-auto">
              The page you're looking for seems to have wandered off. Let's get you back on track!
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
            <Link to="/" className="btn-primary">
              <ApperIcon name="Home" className="w-4 h-4 mr-2" />
              Back to Home
            </Link>
            
            <button 
              onClick={() => window.history.back()} 
              className="btn-secondary"
            >
              <ApperIcon name="ArrowLeft" className="w-4 h-4 mr-2" />
              Go Back
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default NotFound