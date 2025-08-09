import { Route, Routes, type RouteProps } from 'react-router-dom'
import { useAuthenticator } from '@aws-amplify/ui-react'

import OtherLayout from '@/layouts/OtherLayout'
import { appRoutes, authRoutes, feedRoutes, profilePagesRoutes, settingPagesRoutes, socialWithTopbarRoutes, } from '@/routes/index'
import FeedLayout from '@/layouts/FeedLayout'
import SocialLayout from '@/layouts/SocialLayout'
import ProfileLayout from '@/layouts/ProfileLayout'
import SettingLayout from '@/layouts/SettingLayout'

const AppRouter = (props: RouteProps) => {
  const { authStatus } = useAuthenticator(context => [context.authStatus])
  const isAuthenticated = authStatus === 'authenticated'

  return (
    <Routes>
      {(authRoutes || []).map((route, idx) => (
        <Route key={idx + route.name} path={route.path} element={<OtherLayout {...props}>{route.element}</OtherLayout>} />
      ))}

      {(feedRoutes || []).map((route, idx) => (
        <Route 
        key={idx + route.name} 
        path={route.path} 
        element={isAuthenticated ? (
          <FeedLayout {...props}>{route.element}</FeedLayout>
        ) : (
          // Don't redirect to custom auth page when using Amplify
          // Amplify Authenticator will handle showing login screen
          <div>Loading...</div>
        )
        } />
      ))}

      {(socialWithTopbarRoutes || []).map((route, idx) => (
        <Route
          key={idx + route.name}
          path={route.path}
          element={isAuthenticated ? (
            <SocialLayout {...props}>{route.element}</SocialLayout>
          ) : (
            <div>Loading...</div>
          )
          } />
      ))}

      {(profilePagesRoutes || []).map((route, idx) => (
        <Route 
        key={idx + route.name} 
        path={route.path} 
        element={isAuthenticated ? (
          <ProfileLayout {...props}>{route.element}</ProfileLayout>
        ) : (
          <div>Loading...</div>
        )
        } />
      ))}

      {(settingPagesRoutes || []).map((route, idx) => (
        <Route 
        key={idx + route.name} 
        path={route.path} 
        element={isAuthenticated ? (
          <SettingLayout {...props}>{route.element}</SettingLayout>
        ) : (
          <div>Loading...</div>
        )
        } />
      ))}

      {(appRoutes || []).map((route, idx) => (
        <Route
          key={idx + route.name}
          path={route.path}
          element={isAuthenticated ? (
            <OtherLayout {...props}>{route.element}</OtherLayout>
          ) : (
            <div>Loading...</div>
          )
          }
        />
      ))}
    </Routes>
  )
}

export default AppRouter
