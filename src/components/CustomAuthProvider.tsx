import { useEffect, useState } from 'react'
import { getCurrentUser } from 'aws-amplify/auth'
import { useNavigate, useLocation } from 'react-router-dom'

interface CustomAuthProviderProps {
  children: React.ReactNode
}

export const CustomAuthProvider = ({ children }: CustomAuthProviderProps) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    checkAuthStatus()
  }, [])

  const checkAuthStatus = async () => {
    try {
      await getCurrentUser()
      setIsAuthenticated(true)
    } catch (error) {
      setIsAuthenticated(false)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (loading) return

    const isAuthPage = location.pathname.startsWith('/modern-auth/')
    
    if (!isAuthenticated && !isAuthPage) {
      // User is not authenticated and not on auth page, redirect to login
      navigate('/modern-auth/sign-in')
    } else if (isAuthenticated && isAuthPage) {
      // User is authenticated but on auth page, redirect to home
      navigate('/feed/home')
    }
  }, [isAuthenticated, location.pathname, loading, navigate])

  if (loading) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center">
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="text-muted">Loading...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

export default CustomAuthProvider
