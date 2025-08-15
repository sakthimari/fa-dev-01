import { useState } from 'react'
import { Button, Form, Alert } from 'react-bootstrap'
import { Link } from 'react-router-dom'
import { FaArrowLeft, FaEnvelope } from 'react-icons/fa'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'

interface ForgotPasswordFormData {
  email: string
}

const ModernForgotPasswordForm = () => {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const schema = yup.object({
    email: yup.string().email('Please enter a valid email').required('Email is required')
  })

  const { register, handleSubmit, formState: { errors }, getValues } = useForm<ForgotPasswordFormData>({
    resolver: yupResolver(schema),
    defaultValues: {
      email: ''
    }
  })

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setLoading(true)
    setError('')
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500))
      console.log('Forgot password data:', data)
      setSuccess(true)
    } catch (err) {
      setError('Failed to send reset email. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    const email = getValues('email')
    if (email) {
      await onSubmit({ email })
    }
  }

  if (success) {
    return (
      <div className="w-100 text-center">
        {/* Success Icon */}
        <div className="d-inline-flex align-items-center justify-content-center bg-success rounded-circle p-3 mb-4"
             style={{ width: '80px', height: '80px' }}>
          <FaEnvelope className="text-white fs-2" />
        </div>
        
        <h1 className="h3 fw-bold text-dark mb-3">Check Your Email</h1>
        <p className="text-muted mb-4">
          We've sent a password reset link to <strong>{getValues('email')}</strong>
        </p>
        
        <div className="mb-4">
          <p className="text-muted small">
            Didn't receive the email? Check your spam folder or
          </p>
          <Button 
            variant="outline-primary" 
            onClick={handleResend}
            disabled={loading}
            className="px-4"
          >
            {loading ? 'Sending...' : 'Resend Email'}
          </Button>
        </div>

        <div className="mt-5">
          <Link 
            to="/modern-auth/sign-in"
            className="d-inline-flex align-items-center text-primary fw-semibold text-decoration-none"
          >
            <FaArrowLeft className="me-2" />
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
        <div className="d-inline-flex align-items-center justify-content-center bg-warning rounded-circle p-3 mb-3"
             style={{ width: '80px', height: '80px' }}>
          <i className="fas fa-lock text-white fs-2"></i>
        </div>
        <h1 className="h3 fw-bold text-dark mb-1">Forgot Password?</h1>
        <p className="text-muted">No worries, we'll send you reset instructions</p>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="danger" className="border-0 shadow-sm">
          <i className="fas fa-exclamation-triangle me-2"></i>
          {error}
        </Alert>
      )}

      {/* Forgot Password Form */}
      <Form onSubmit={handleSubmit(onSubmit)}>
        {/* Email Field */}
        <div className="mb-4">
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

        {/* Reset Password Button */}
        <Button
          type="submit"
          className="w-100 py-3 fw-semibold border-0 shadow-sm mb-4"
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
              Sending...
            </div>
          ) : (
            'Reset Password'
          )}
        </Button>
      </Form>

      {/* Back to Sign In */}
      <div className="text-center">
        <Link 
          to="/modern-auth/sign-in"
          className="d-inline-flex align-items-center text-primary fw-semibold text-decoration-none"
        >
          <FaArrowLeft className="me-2" />
          Back to Sign In
        </Link>
      </div>

      {/* Additional Help */}
      <div className="text-center mt-5 pt-4 border-top">
        <p className="text-muted small mb-0">
          Still having trouble?{' '}
          <Link to="/contact" className="text-decoration-none">Contact Support</Link>
        </p>
      </div>
    </div>
  )
}

export default ModernForgotPasswordForm
