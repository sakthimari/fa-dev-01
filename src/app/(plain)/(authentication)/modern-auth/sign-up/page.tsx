import PageMetaData from '@/components/PageMetaData'
import ModernAuthLayout from '../components/ModernAuthLayout'
import ModernSignUpForm from './components/ModernSignUpForm'

const ModernSignUp = () => {
  return (
    <>
      <PageMetaData title="Create Account - Connect Plus" />
      <ModernAuthLayout>
        <ModernSignUpForm />
      </ModernAuthLayout>
    </>
  )
}

export default ModernSignUp
