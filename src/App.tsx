import AppProvidersWrapper from "./components/wrappers/AppProvidersWrapper"
import configureFakeBackend from "./helpers/fake-backend"
import AppRouter from "./routes/router"
import { Amplify } from 'aws-amplify';

import { Authenticator } from '@aws-amplify/ui-react'
import outputs from '../amplify_outputs.json';
import '@aws-amplify/ui-react/styles.css'

Amplify.configure(outputs);

import '@/assets/scss/style.scss'


configureFakeBackend()

function App() {

  


  return (
              <Authenticator signUpAttributes={[ 
                  'email',            // Default attribute
                  'name',     // Default attribute,                  
                  'birthdate'         // Default attribute
              ]} 
              >
                  <main>
                    <AppProvidersWrapper>
                      <AppRouter />
                    </AppProvidersWrapper>
                  </main>
            </Authenticator>
        
         )
}

export default App
