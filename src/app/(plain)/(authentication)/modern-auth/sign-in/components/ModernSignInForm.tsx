import { useState, useEffect } from 'react'
import { Button, Form, Alert } from 'react-bootstrap'
import { Link, useSearchParams } from 'react-router-dom'
import { FaEye, FaEyeSlash, FaGoogle, FaFacebookF, FaApple } from 'react-icons/fa'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { signIn, getCurrentUser } from 'aws-amplify/auth'
import { Auth } from 'aws-amplify';
import { useAuth } from '@/context/AuthProvider'
import { ConnectionService } from '@/services/ConnectionService'
import { EmailInvitationService } from '@/services/EmailInvitationService'

interface SignInFormData {
  email: string
  password: string
  rememberMe?: boolean
}

const ModernSignInForm = () => {
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { refreshAuth } = useAuth()
  const [searchParams] = useSearchParams()

  // Extract invitation token from URL parameters
  const invitationToken = searchParams.get('token')
  const [invitationData, setInvitationData] = useState<{inviterName: string; recipientName: string; recipientEmail: string; inviterAvatar?: string} | null>(null)

  useEffect(() => {
    // If user came from an invitation email, get invitation data from token
    if (invitationToken) {
      console.log('User signing in with invitation token:', invitationToken)
      const data = EmailInvitationService.getInvitationFromToken(invitationToken)
      
      if (data) {
        setInvitationData(data)
        console.log('Retrieved invitation data for sign-in:', data)
        localStorage.setItem('pendingInvitationContext', JSON.stringify({
          inviterName: data.inviterName,
          recipientName: data.recipientName,
          inviterAvatar: data.inviterAvatar,
          timestamp: Date.now()
        }))
      } else {
        console.warn('Invalid or expired invitation token:', invitationToken)
      }
    }
  }, [invitationToken])

  const schema = yup.object({
    email: yup.string().email('Please enter a valid email').required('Email is required'),
    password: yup.string().required('Password is required'),
    rememberMe: yup.boolean().optional()
  })

  const { register, handleSubmit, formState: { errors } } = useForm<SignInFormData>({
    resolver: yupResolver(schema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false
    }
  })

  const onSubmit = async (data: SignInFormData) => {
    setLoading(true)
    setError('')
    try {
      const { isSignedIn } = await signIn({
        username: data.email,
        password: data.password,
      })
      if (isSignedIn) {
        // Check if user came from an invitation link
        const pendingInvitationContext = localStorage.getItem('pendingInvitationContext')
        if (pendingInvitationContext) {
          try {
            const context = JSON.parse(pendingInvitationContext)
            console.log('Processing invitation context for existing user:', context)
            
            // Get current user to process invitation
            const currentUser = await getCurrentUser()
            await ConnectionService.handleRegistration(data.email, currentUser.userId)
            
            // IMPORTANT: Also create the notification directly for existing users
            // This ensures they see the friend request immediately after login
            if (context.inviterName) {
              console.log('Creating friend request notification for existing user...')
              const { NotificationService } = await import('@/services/NotificationService')
              const notificationResult = await NotificationService.createFriendRequestNotification(
                currentUser.userId,
                context.inviterName,
                context.inviterAvatar // Include avatar in notification
              )
              console.log('Friend request notification created for existing user:', notificationResult)
            }
            
            // Clear the pending invitation context
            localStorage.removeItem('pendingInvitationContext')
            localStorage.setItem('justSignedInFromInvitation', 'true')
            console.log('Processed invitation for existing user')
          } catch (error) {
            console.warn('Could not process invitation context:', error)
          }
        }
        
        await refreshAuth()
      } else {
        setError('Additional verification required. Please check your email or phone.')
      }
    } catch (err: any) {
      console.error('Sign in error:', err)
      if (err.name === 'NotAuthorizedException') {
        setError('Incorrect email or password. Please try again.')
      } else if (err.name === 'UserNotConfirmedException') {
        setError('Please confirm your email address before signing in.')
      } else if (err.name === 'UserNotFoundException') {
        setError('No account found with this email address.')
      } else if (err.name === 'InvalidParameterException') {
        setError('Please enter a valid email and password.')
      } else if (err.name === 'TooManyRequestsException') {
        setError('Too many failed attempts. Please try again later.')
      } else {
        setError(err.message || 'An error occurred during sign in. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSocialLogin = (provider: string) => {
    console.log(`Login with ${provider}`)
    // Implement social login logic here
  }

  return (
    <div className="w-100">
      {/* Logo */}
      <div className="text-center mb-3">
        <div className="d-inline-flex align-items-center justify-content-center bg-primary rounded-circle p-2 mb-2"
             style={{ width: '60px', height: '60px' }}>
          <i className="fas fa-users text-white fs-4"></i>
        </div>
        <h1 className="h4 fw-bold text-dark mb-1">Welcome Back!</h1>
        <p className="text-muted small mb-0">Please sign in to your account</p>
      </div>

      {/* Invitation Banner */}
      {invitationData?.inviterName && (
        <Alert variant="info" className="border-0 shadow-sm mb-3">
          <div className="d-flex align-items-center">
            <i className="fas fa-envelope-open text-info me-3 fs-5"></i>
            <div>
              <strong>🎉 You're invited by {invitationData.inviterName}!</strong>
              <div className="small text-muted mt-1">
                Sign in to accept {invitationData.inviterName}'s friend request.
              </div>
            </div>
          </div>
        </Alert>
      )}

      {/* Error Alert */}
      {error && (
        <Alert variant="danger" className="border-0 shadow-sm mb-3">
          <i className="fas fa-exclamation-triangle me-2"></i>
          {error}
        </Alert>
      )}

      {/* Sign In Form */}
      <Form onSubmit={handleSubmit(onSubmit)}>
        {/* Email Field */}
        <div className="mb-3">
          <Form.Label className="fw-semibold text-dark small">Email Address</Form.Label>
          <div className="position-relative">
            <Form.Control
              type="email"
              placeholder="Enter your email"
              className={`modern-auth-input ${errors.email ? 'border-danger' : ''}`}
              style={{ fontSize: '16px', padding: '0.75rem 1rem 0.75rem 3rem' }}
              {...register('email')}
            />
            <div className="position-absolute top-50 end-0 translate-middle-y pe-3">
              <i className="fas fa-envelope text-muted"></i>
            </div>
          </div>
          {errors.email && (
            <div className="text-danger small mt-1">
              <i className="fas fa-exclamation-circle me-1"></i>
              {errors.email.message}
            </div>
          )}
        </div>

        {/* Password Field */}
        <div className="mb-3">
          <Form.Label className="fw-semibold text-dark small">Password</Form.Label>
          <div className="position-relative">
            <Form.Control
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter your password"
              className={`modern-auth-input ${errors.password ? 'border-danger' : ''}`}
              style={{ fontSize: '16px', padding: '0.75rem 1rem 0.75rem 3rem' }}
              {...register('password')}
            />
            <Button
              variant="link"
              className="position-absolute top-50 end-0 translate-middle-y border-0 text-muted p-0 pe-3"
              onClick={() => setShowPassword(!showPassword)}
              type="button"
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </Button>
          </div>
          {errors.password && (
            <div className="text-danger small mt-1">
              <i className="fas fa-exclamation-circle me-1"></i>
              {errors.password.message}
            </div>
          )}
        </div>

        {/* Remember Me & Forgot Password */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <Form.Check
            type="checkbox"
            id="rememberMe"
            label="Remember me"
            className="text-muted modern-checkbox"
            {...register('rememberMe')}
          />
          <Link 
            to="/modern-auth/forgot-password" 
            className="text-primary text-decoration-none fw-semibold small"
          >
            Forgot Password?
          </Link>
        </div>

        {/* Sign In Button */}
        <Button
          type="submit"
          className="w-100 modern-auth-button text-white fw-semibold"
          style={{ padding: '0.75rem', fontSize: '16px' }}
          disabled={loading}
        >
          {loading ? (
            <div className="d-flex align-items-center justify-content-center">
              <div className="modern-spinner me-2" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              Signing in...
            </div>
          ) : (
            'Sign In'
          )}
        </Button>
      </Form>

      {/* Social Login Buttons */}
      <div className="mb-3">
        <div className="modern-divider my-3">
          <span>or continue with</span>
        </div>
        
        <div className="row g-2">
          <div className="col-4">
            <Button 
              variant="outline-dark" 
              className="w-100 social-auth-button py-2"
              onClick={() => handleSocialLogin('google')}
            >
              <FaGoogle className="text-danger" />
            </Button>
          </div>
          <div className="col-4">
            <Button 
              variant="outline-dark" 
              className="w-100 social-auth-button py-2"
              onClick={() => handleSocialLogin('facebook')}
            >
              <FaFacebookF className="text-primary" />
            </Button>
          </div>
          <div className="col-4">
            <Button 
              variant="outline-dark" 
              className="w-100 social-auth-button py-2"
              onClick={() => handleSocialLogin('apple')}
            >
              <FaApple />
            </Button>
          </div>
        </div>
      </div>

      {/* Sign Up Link */}
      <div className="text-center mt-3">
        <p className="text-muted mb-0">
          Don't have an account?{' '}
          <Link 
            to="/modern-auth/sign-up" 
            className="text-primary fw-semibold text-decoration-none"
          >
            Create Account
          </Link>
        </p>
      </div>

      {/* Footer */}
      <div className="text-center mt-5 pt-4 border-top">
        <p className="text-muted small mb-0">
          By continuing, you agree to our{' '}
          <Link to="/terms" className="text-decoration-none">Terms of Service</Link>
          {' '}and{' '}
          <Link to="/privacy" className="text-decoration-none">Privacy Policy</Link>
        </p>
      </div>
    </div>
  )
}

export default ModernSignInForm
