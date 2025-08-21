import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { getCurrentUser, signOut as amplifySignOut } from 'aws-amplify/auth'
import { useNavigate, useLocation } from 'react-router-dom'

// Function to check and process pending friend requests
const checkAndProcessPendingFriendRequests = async (userEmail: string): Promise<void> => {
  try {
    const storageKey = `pending_friend_request_${userEmail}`;
    const stored = localStorage.getItem(storageKey);
    
    if (stored) {
      const pendingRequest = JSON.parse(stored);
      
      if (!pendingRequest.processed) {
        console.log('Found pending friend request for:', userEmail, pendingRequest);
        
        // Get current user to create notification
        const currentUser = await getCurrentUser();
        
        // Import NotificationService and create the notification
        const { NotificationService } = await import('@/services/NotificationService');
        const result = await NotificationService.createFriendRequestNotification(
          currentUser.userId,
          pendingRequest.inviterName,
          pendingRequest.inviterAvatar,
          pendingRequest.inviterId
        );
        
        console.log('Created friend request notification:', result);
        
        // Mark as processed
        pendingRequest.processed = true;
        localStorage.setItem(storageKey, JSON.stringify(pendingRequest));
        
        // Friend request notification created (user can check notifications dropdown later)
        console.log('Friend request notification created for user:', userEmail);
      }
    }
  } catch (error) {
    console.warn('Error processing pending friend requests:', error);
  }
}

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
    const handleAuthFlow = async () => {
      if (loading) return

      const isAuthPage = location.pathname.startsWith('/modern-auth/')
      const isInvitationPage = location.pathname.startsWith('/invitation/')
      const isAuthenticated = !!user
      
      if (!isAuthenticated && !isAuthPage && !isInvitationPage) {
        // User is not authenticated and not on auth page, redirect to login
        navigate('/modern-auth/sign-in', { replace: true })
      } else if (isAuthenticated && isAuthPage) {
        // User is authenticated but on auth page
        // Check if they need to be redirected to an invitation
        const redirectToInvitation = localStorage.getItem('redirectToInvitation')
        if (redirectToInvitation) {
          localStorage.removeItem('redirectToInvitation')
          navigate(`/invitation/accept?id=${redirectToInvitation}`, { replace: true })
          return
        }
        
        // Check for pending friend requests based on user's email
        if (user?.signInDetails?.loginId) {
          await checkAndProcessPendingFriendRequests(user.signInDetails.loginId)
        }
        
        // Clean up any invitation-related flags
        localStorage.removeItem('justRegisteredFromInvitation')
        localStorage.removeItem('justSignedInFromInvitation')
        localStorage.removeItem('hasNewFriendRequests')
        
        // Always redirect to home/feed page after login
        console.log('🔄 AuthProvider: Redirecting authenticated user from auth page to /feed/home')
        navigate('/feed/home', { replace: true })
      }
    }

    handleAuthFlow()
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
