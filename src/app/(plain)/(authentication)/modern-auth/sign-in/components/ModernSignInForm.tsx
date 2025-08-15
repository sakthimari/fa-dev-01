import { useState } from 'react'
import { Button, Form, Alert } from 'react-bootstrap'
import { Link, useNavigate } from 'react-router-dom'
import { FaEye, FaEyeSlash, FaGoogle, FaFacebookF, FaApple } from 'react-icons/fa'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { signIn } from 'aws-amplify/auth'
import { useAuth } from '@/context/AuthProvider'

interface SignInFormData {
  email: string
  password: string
  rememberMe?: boolean
}

const ModernSignInForm = () => {
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const { refreshAuth } = useAuth()

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
      const { isSignedIn, nextStep } = await signIn({
        username: data.email,
        password: data.password,
      })

      if (isSignedIn) {
        // Refresh the auth context to update the user state
        await refreshAuth()
        // Navigation will be handled by the AuthProvider
      } else {
        // Handle multi-step sign-in (e.g., MFA, password reset)
        if (nextStep.signInStep === 'CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED') {
          setError('Please reset your password to continue.')
        } else if (nextStep.signInStep === 'CONFIRM_SIGN_IN_WITH_SMS_MFA_CODE') {
          setError('MFA verification required. Please check your phone.')
        } else if (nextStep.signInStep === 'CONFIRM_SIGN_IN_WITH_TOTP_CODE') {
          setError('Please enter your authenticator code.')
        } else {
          setError('Additional verification required. Please check your email or phone.')
        }
      }
    } catch (err: any) {
      console.error('Sign in error:', err)
      
      // Handle specific error types
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
