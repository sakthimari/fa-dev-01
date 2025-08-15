import PageMetaData from '@/components/PageMetaData'
import ModernAuthLayout from '../components/ModernAuthLayout'
import ModernSignInForm from './components/ModernSignInForm'

const ModernSignIn = () => {
  return (
    <>
      <PageMetaData title="Sign In - Connect Plus" />
      <ModernAuthLayout>
        <ModernSignInForm />
      </ModernAuthLayout>
    </>
  )
}

export default ModernSignIn
