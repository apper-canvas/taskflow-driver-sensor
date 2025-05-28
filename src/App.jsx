import { createContext, useEffect, useState } from 'react'
import { Routes, Route, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { setUser, clearUser } from './store/userSlice'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Callback from './pages/Callback'
import ErrorPage from './pages/ErrorPage'
import Home from './pages/Home'
import NotFound from './pages/NotFound'

// Create auth context
export const AuthContext = createContext(null)

function App() {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const [isInitialized, setIsInitialized] = useState(false)
  
  // Get authentication status with proper error handling
  const userState = useSelector((state) => state.user)
  const isAuthenticated = userState?.isAuthenticated || false

  // Initialize ApperUI once when the app loads
  // Initialize ApperUI once when the app loads
  useEffect(() => {
    let timeoutId;
    
    const initializeAuth = () => {
      // Check if ApperSDK is available
      if (typeof window.ApperSDK === 'undefined') {
        console.error('ApperSDK not loaded. Please ensure the script tag is present in index.html');
        // Force initialization after a delay to prevent infinite loading
        timeoutId = setTimeout(() => {
          console.warn('Forcing initialization due to missing SDK');
          setIsInitialized(true);
        }, 10000);
        return;
      }

      try {
        const { ApperClient, ApperUI } = window.ApperSDK;
        
        if (!ApperClient || !ApperUI) {
          console.error('ApperSDK components not available');
          setIsInitialized(true);
          return;
        }
        
        const client = new ApperClient({
          apperProjectId: import.meta.env.VITE_APPER_PROJECT_ID,
          apperPublicKey: import.meta.env.VITE_APPER_PUBLIC_KEY
        });

        // Initialize but don't show login yet
        ApperUI.setup(client, {
          target: '#authentication',
          clientId: import.meta.env.VITE_APPER_PROJECT_ID,
          view: 'both',
          onSuccess: function (user) {
            if (timeoutId) clearTimeout(timeoutId);
            setIsInitialized(true);
            // CRITICAL: This exact currentPath logic must be preserved in all implementations
            // DO NOT simplify or modify this pattern as it ensures proper redirection flow
            let currentPath = window.location.pathname + window.location.search;
            let redirectPath = new URLSearchParams(window.location.search).get('redirect');
            const isAuthPage = currentPath.includes('/login') || currentPath.includes('/signup') || currentPath.includes(
              '/callback') || currentPath.includes('/error');
            if (user) {
              // User is authenticated
              if (redirectPath) {
                navigate(redirectPath);
              } else if (!isAuthPage) {
                if (!currentPath.includes('/login') && !currentPath.includes('/signup')) {
                  navigate(currentPath);
                } else {
                  navigate('/');
                }
              } else {
                navigate('/');
              }
              // Store user information in Redux
              dispatch(setUser(JSON.parse(JSON.stringify(user))));
            } else {
              // User is not authenticated
              if (!isAuthPage) {
                navigate(
                  currentPath.includes('/signup')
                    ? `/signup?redirect=${currentPath}`
                    : currentPath.includes('/login')
                      ? `/login?redirect=${currentPath}`
                      : '/login');
              } else if (redirectPath) {
                if (
                  ![
                    'error',
                    'signup',
                    'login',
                    'callback'
                  ].some((path) => currentPath.includes(path)))
                  navigate(`/login?redirect=${redirectPath}`);
                else {
                  navigate(currentPath);
                }
              } else if (isAuthPage) {
                navigate(currentPath);
              } else {
                navigate('/login');
              }
              dispatch(clearUser());
            }
          },
          onError: function(error) {
            console.error("Authentication failed:", error);
            if (timeoutId) clearTimeout(timeoutId);
            setIsInitialized(true);
          }
        });
      } catch (error) {
        console.error('Error initializing ApperSDK:', error);
        if (timeoutId) clearTimeout(timeoutId);
        setIsInitialized(true);
      }
    };

    // Initialize immediately if SDK is already loaded, otherwise wait a bit
    if (typeof window.ApperSDK !== 'undefined') {
      initializeAuth();
    } else {
      // Wait a moment for script to load
      const checkSDK = setInterval(() => {
        if (typeof window.ApperSDK !== 'undefined') {
          clearInterval(checkSDK);
          initializeAuth();
        }
      }, 100);
      
      // Clear interval after 5 seconds to prevent infinite checking
      setTimeout(() => {
        clearInterval(checkSDK);
        if (!isInitialized) {
          console.warn('ApperSDK failed to load within 5 seconds');
          initializeAuth();
        }
      }, 5000);
    }
    
    // Cleanup timeout on unmount
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [navigate, dispatch, isInitialized]);

  // Authentication methods to share via context
  const authMethods = {
    isInitialized,
    logout: async () => {
      try {
        const { ApperUI } = window.ApperSDK
        await ApperUI.logout()
        dispatch(clearUser())
        navigate('/login')
      } catch (error) {
        console.error("Logout failed:", error)
      }
    }
  }

  // Don't render routes until initialization is complete
  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-50 dark:bg-surface-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-surface-600 dark:text-surface-400">Initializing application...</p>
        </div>
      </div>
    )
  }

  return (
    <AuthContext.Provider value={authMethods}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/callback" element={<Callback />} />
        <Route path="/error" element={<ErrorPage />} />
        <Route path="/" element={<Home />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AuthContext.Provider>
  )
}

export default App