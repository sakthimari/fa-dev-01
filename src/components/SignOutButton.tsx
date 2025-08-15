import React from 'react'
import { Button } from 'react-bootstrap'
import { BsPower } from 'react-icons/bs'
import { useAuth } from '@/context/AuthProvider'

interface SignOutButtonProps {
  variant?: string
  size?: 'sm' | 'lg'
  className?: string
  showIcon?: boolean
  children?: React.ReactNode
}

const SignOutButton: React.FC<SignOutButtonProps> = ({
  variant = 'outline-danger',
  size,
  className = '',
  showIcon = true,
  children
}) => {
  const { signOut, loading } = useAuth()

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={handleSignOut}
      disabled={loading}
    >
      {showIcon && <BsPower className="me-2" />}
      {loading ? 'Signing Out...' : (children || 'Sign Out')}
    </Button>
  )
}

export default SignOutButton
