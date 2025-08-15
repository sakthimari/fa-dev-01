import AppProvidersWrapper from "./components/wrappers/AppProvidersWrapper"
import configureFakeBackend from "./helpers/fake-backend"
import AppRouter from "./routes/router"
import { Amplify } from 'aws-amplify';
import outputs from '../amplify_outputs.json';
import { AuthProvider } from './context/AuthProvider'

Amplify.configure(outputs);

import '@/assets/scss/style.scss'

configureFakeBackend()

function App() {
  return (
    <AppProvidersWrapper>
      <AuthProvider>
        <AppRouter />
      </AuthProvider>
    </AppProvidersWrapper>
  )
}

export default App
