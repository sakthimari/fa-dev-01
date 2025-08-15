import { useState } from 'react'
import { Button, Form, Alert, ProgressBar } from 'react-bootstrap'
import { Link, useNavigate } from 'react-router-dom'
import { FaEye, FaEyeSlash, FaGoogle, FaFacebookF, FaApple, FaCheck } from 'react-icons/fa'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { signUp } from 'aws-amplify/auth'

interface SignUpFormData {
  firstName: string
  lastName: string
  email: string
  password: string
  confirmPassword: string
  agreeTerms?: boolean
}

const ModernSignUpForm = () => {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const navigate = useNavigate()

  const schema = yup.object({
    firstName: yup.string().required('First name is required').min(2, 'First name must be at least 2 characters'),
    lastName: yup.string().required('Last name is required').min(2, 'Last name must be at least 2 characters'),
    email: yup.string().email('Please enter a valid email').required('Email is required'),
    password: yup.string()
      .required('Password is required')
      .min(8, 'Password must be at least 8 characters')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain uppercase, lowercase and number'),
    confirmPassword: yup.string()
      .required('Please confirm your password')
      .oneOf([yup.ref('password')], 'Passwords must match'),
    agreeTerms: yup.boolean().oneOf([true], 'You must agree to the terms and conditions')
  })

  const { register, handleSubmit, watch, formState: { errors }, getValues } = useForm<SignUpFormData>({
    resolver: yupResolver(schema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
      agreeTerms: false
    }
  })

  const password = watch('password')

  const getPasswordStrength = (password: string) => {
    let strength = 0
    if (password.length >= 8) strength += 25
    if (/[a-z]/.test(password)) strength += 25
    if (/[A-Z]/.test(password)) strength += 25
    if (/\d/.test(password)) strength += 25
    return strength
  }

  const getPasswordStrengthLabel = (strength: number) => {
    if (strength < 25) return { label: 'Weak', variant: 'danger' }
    if (strength < 50) return { label: 'Fair', variant: 'warning' }
    if (strength < 75) return { label: 'Good', variant: 'info' }
    return { label: 'Strong', variant: 'success' }
  }

  const passwordStrength = getPasswordStrength(password || '')
  const strengthInfo = getPasswordStrengthLabel(passwordStrength)

  const onSubmit = async (data: SignUpFormData) => {
    setLoading(true)
    setError('')
    
    try {
      const { isSignUpComplete, userId, nextStep } = await signUp({
        username: data.email,
        password: data.password,
        options: {
          userAttributes: {
            email: data.email,
            name: `${data.firstName} ${data.lastName}`,
            given_name: data.firstName,
            family_name: data.lastName,
          },
        },
      })

      console.log('Sign up result:', { isSignUpComplete, userId, nextStep })

      if (nextStep.signUpStep === 'CONFIRM_SIGN_UP') {
        setSuccess(true)
        // You might want to navigate to a confirmation page
        // navigate('/modern-auth/confirm-signup', { state: { email: data.email } })
      } else if (isSignUpComplete) {
        // Auto sign in or navigate to sign in
        navigate('/modern-auth/sign-in')
      }
    } catch (err: any) {
      console.error('Sign up error:', err)
      
      // Handle specific error types
      if (err.name === 'UsernameExistsException') {
        setError('An account with this email address already exists.')
      } else if (err.name === 'InvalidPasswordException') {
        setError('Password does not meet requirements.')
      } else {
        setError(err.message || 'An error occurred during sign up. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSocialSignUp = (provider: string) => {
    console.log(`Sign up with ${provider}`)
    // Implement social sign up logic here
  }

  // Show success message if account needs confirmation
  if (success) {
    return (
      <div className="w-100 text-center">
        <div className="d-inline-flex align-items-center justify-content-center bg-success rounded-circle p-3 mb-4"
             style={{ width: '80px', height: '80px' }}>
          <FaCheck className="text-white fs-2" />
        </div>
        
        <h1 className="h3 fw-bold text-dark mb-3">Check Your Email</h1>
        <p className="text-muted mb-4">
          We've sent a confirmation link to <strong>{getValues('email')}</strong>
        </p>
        <p className="text-muted small mb-4">
          Please click the link in your email to confirm your account.
        </p>

        <div className="mt-4">
          <Link 
            to="/modern-auth/sign-in"
            className="text-primary fw-semibold text-decoration-none"
          >
            Back to Sign In
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="w-100">
      {/* Logo */}
      <div className="text-center mb-4">
        <div className="d-inline-flex align-items-center justify-content-center bg-primary rounded-circle p-3 mb-3"
             style={{ width: '80px', height: '80px' }}>
          <i className="fas fa-user-plus text-white fs-2"></i>
        </div>
        <h1 className="h3 fw-bold text-dark mb-1">Create Account</h1>
        <p className="text-muted">Join our community today</p>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="danger" className="border-0 shadow-sm">
          <i className="fas fa-exclamation-triangle me-2"></i>
          {error}
        </Alert>
      )}

      {/* Social Sign Up Buttons */}
      <div className="mb-4">
        <div className="row g-2">
          <div className="col-4">
            <Button 
              variant="outline-dark" 
              className="w-100 border-2 py-2"
              onClick={() => handleSocialSignUp('google')}
            >
              <FaGoogle className="text-danger" />
            </Button>
          </div>
          <div className="col-4">
            <Button 
              variant="outline-dark" 
              className="w-100 border-2 py-2"
              onClick={() => handleSocialSignUp('facebook')}
            >
              <FaFacebookF className="text-primary" />
            </Button>
          </div>
          <div className="col-4">
            <Button 
              variant="outline-dark" 
              className="w-100 border-2 py-2"
              onClick={() => handleSocialSignUp('apple')}
            >
              <FaApple />
            </Button>
          </div>
        </div>
        
        <div className="position-relative my-4">
          <hr className="my-0" />
          <span className="position-absolute top-50 start-50 translate-middle bg-white px-3 text-muted small">
            or continue with email
          </span>
        </div>
      </div>

      {/* Sign Up Form */}
      <Form onSubmit={handleSubmit(onSubmit)}>
        {/* Name Fields */}
        <div className="row g-3 mb-3">
          <div className="col-6">
            <Form.Label className="fw-semibold text-dark small">First Name</Form.Label>
            <Form.Control
              type="text"
              placeholder="First name"
              className={`border-2 py-3 ps-4 ${errors.firstName ? 'border-danger' : 'border-light'}`}
              style={{ fontSize: '16px' }}
              {...register('firstName')}
            />
            {errors.firstName && (
              <div className="text-danger small mt-1">
                <i className="fas fa-exclamation-circle me-1"></i>
                {errors.firstName.message}
              </div>
            )}
          </div>
          <div className="col-6">
            <Form.Label className="fw-semibold text-dark small">Last Name</Form.Label>
            <Form.Control
              type="text"
              placeholder="Last name"
              className={`border-2 py-3 ps-4 ${errors.lastName ? 'border-danger' : 'border-light'}`}
              style={{ fontSize: '16px' }}
              {...register('lastName')}
            />
            {errors.lastName && (
              <div className="text-danger small mt-1">
                <i className="fas fa-exclamation-circle me-1"></i>
                {errors.lastName.message}
              </div>
            )}
          </div>
        </div>

        {/* Email Field */}
        <div className="mb-3">
          <Form.Label className="fw-semibold text-dark small">Email Address</Form.Label>
          <div className="position-relative">
            <Form.Control
              type="email"
              placeholder="Enter your email"
              className={`border-2 py-3 ps-4 pe-5 ${errors.email ? 'border-danger' : 'border-light'}`}
              style={{ fontSize: '16px' }}
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
              placeholder="Create a password"
              className={`border-2 py-3 ps-4 pe-5 ${errors.password ? 'border-danger' : 'border-light'}`}
              style={{ fontSize: '16px' }}
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
          {password && (
            <div className="mt-2">
              <div className="d-flex justify-content-between align-items-center mb-1">
                <small className="text-muted">Password strength</small>
                <small className={`text-${strengthInfo.variant} fw-semibold`}>
                  {strengthInfo.label}
                </small>
              </div>
              <ProgressBar 
                now={passwordStrength} 
                variant={strengthInfo.variant}
                style={{ height: '4px' }}
              />
            </div>
          )}
          {errors.password && (
            <div className="text-danger small mt-1">
              <i className="fas fa-exclamation-circle me-1"></i>
              {errors.password.message}
            </div>
          )}
        </div>

        {/* Confirm Password Field */}
        <div className="mb-3">
          <Form.Label className="fw-semibold text-dark small">Confirm Password</Form.Label>
          <div className="position-relative">
            <Form.Control
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="Confirm your password"
              className={`border-2 py-3 ps-4 pe-5 ${errors.confirmPassword ? 'border-danger' : 'border-light'}`}
              style={{ fontSize: '16px' }}
              {...register('confirmPassword')}
            />
            <Button
              variant="link"
              className="position-absolute top-50 end-0 translate-middle-y border-0 text-muted p-0 pe-3"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              type="button"
            >
              {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
            </Button>
          </div>
          {errors.confirmPassword && (
            <div className="text-danger small mt-1">
              <i className="fas fa-exclamation-circle me-1"></i>
              {errors.confirmPassword.message}
            </div>
          )}
        </div>

        {/* Terms Agreement */}
        <div className="mb-4">
          <Form.Check
            type="checkbox"
            id="agreeTerms"
            className={`${errors.agreeTerms ? 'text-danger' : 'text-muted'}`}
            label={
              <span>
                I agree to the{' '}
                <Link to="/terms" className="text-primary text-decoration-none fw-semibold">
                  Terms of Service
                </Link>
                {' '}and{' '}
                <Link to="/privacy" className="text-primary text-decoration-none fw-semibold">
                  Privacy Policy
                </Link>
              </span>
            }
            {...register('agreeTerms')}
          />
          {errors.agreeTerms && (
            <div className="text-danger small mt-1">
              <i className="fas fa-exclamation-circle me-1"></i>
              {errors.agreeTerms.message}
            </div>
          )}
        </div>

        {/* Sign Up Button */}
        <Button
          type="submit"
          className="w-100 py-3 fw-semibold border-0 shadow-sm"
          style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            fontSize: '16px'
          }}
          disabled={loading}
        >
          {loading ? (
            <div className="d-flex align-items-center justify-content-center">
              <div className="spinner-border spinner-border-sm me-2" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              Creating Account...
            </div>
          ) : (
            <div className="d-flex align-items-center justify-content-center">
              <FaCheck className="me-2" />
              Create Account
            </div>
          )}
        </Button>
      </Form>

      {/* Sign In Link */}
      <div className="text-center mt-4">
        <p className="text-muted mb-0">
          Already have an account?{' '}
          <Link 
            to="/modern-auth/sign-in" 
            className="text-primary fw-semibold text-decoration-none"
          >
            Sign In
          </Link>
        </p>
      </div>
    </div>
  )
}

export default ModernSignUpForm
