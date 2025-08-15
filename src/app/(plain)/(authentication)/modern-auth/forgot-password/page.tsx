import PageMetaData from '@/components/PageMetaData'
import ModernAuthLayout from '../components/ModernAuthLayout'
import ModernForgotPasswordForm from './components/ModernForgotPasswordForm'

const ModernForgotPassword = () => {
  return (
    <>
      <PageMetaData title="Reset Password - Connect Plus" />
      <ModernAuthLayout>
        <ModernForgotPasswordForm />
      </ModernAuthLayout>
    </>
  )
}

export default ModernForgotPassword
