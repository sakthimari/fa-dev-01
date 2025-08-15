import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { getCurrentUser, signOut as amplifySignOut } from 'aws-amplify/auth'
import { useNavigate, useLocation } from 'react-router-dom'

interface User {
  userId: string
  username: string
  email?: string
  signInDetails?: any
}

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  loading: boolean
  signOut: () => Promise<void>
  refreshAuth: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const location = useLocation()

  const checkAuthStatus = async () => {
    try {
      setLoading(true)
      const currentUser = await getCurrentUser()
      
      setUser({
        userId: currentUser.userId,
        username: currentUser.username,
        email: currentUser.signInDetails?.loginId,
        signInDetails: currentUser.signInDetails
      })
    } catch (error) {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    try {
      setLoading(true)
      await amplifySignOut({ global: true })
      setUser(null)
      navigate('/modern-auth/sign-in')
    } catch (error) {
      console.error('Error signing out:', error)
    } finally {
      setLoading(false)
    }
  }

  const refreshAuth = async () => {
    await checkAuthStatus()
  }

  useEffect(() => {
    checkAuthStatus()
  }, [])

  useEffect(() => {
    if (loading) return

    const isAuthPage = location.pathname.startsWith('/modern-auth/')
    const isAuthenticated = !!user
    
    if (!isAuthenticated && !isAuthPage) {
      // User is not authenticated and not on auth page, redirect to login
      navigate('/modern-auth/sign-in', { replace: true })
    } else if (isAuthenticated && isAuthPage) {
      // User is authenticated but on auth page, redirect to home
      navigate('/feed/home', { replace: true })
    }
  }, [user, location.pathname, loading, navigate])

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    loading,
    signOut,
    refreshAuth
  }

  if (loading) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" style={{ width: '3rem', height: '3rem' }} role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <h5 className="text-muted">Loading...</h5>
          <p className="text-muted small">Please wait while we authenticate you</p>
        </div>
      </div>
    )
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export default AuthProvider
