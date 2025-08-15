import { Route, Routes, type RouteProps } from 'react-router-dom'

import OtherLayout from '@/layouts/OtherLayout'
import { appRoutes, authRoutes, feedRoutes, profilePagesRoutes, settingPagesRoutes, socialWithTopbarRoutes, } from '@/routes/index'
import FeedLayout from '@/layouts/FeedLayout'
import SocialLayout from '@/layouts/SocialLayout'
import ProfileLayout from '@/layouts/ProfileLayout'
import SettingLayout from '@/layouts/SettingLayout'

const AppRouter = (props: RouteProps) => {
  return (
    <Routes>
      {(authRoutes || []).map((route, idx) => (
        <Route key={idx + route.name} path={route.path} element={<OtherLayout {...props}>{route.element}</OtherLayout>} />
      ))}

      {(feedRoutes || []).map((route, idx) => (
        <Route 
        key={idx + route.name} 
        path={route.path} 
        element={<FeedLayout {...props}>{route.element}</FeedLayout>}
        />
      ))}

      {(socialWithTopbarRoutes || []).map((route, idx) => (
        <Route
          key={idx + route.name}
          path={route.path}
          element={<SocialLayout {...props}>{route.element}</SocialLayout>}
        />
      ))}

      {(profilePagesRoutes || []).map((route, idx) => (
        <Route 
        key={idx + route.name} 
        path={route.path} 
        element={<ProfileLayout {...props}>{route.element}</ProfileLayout>}
        />
      ))}

      {(settingPagesRoutes || []).map((route, idx) => (
        <Route 
        key={idx + route.name} 
        path={route.path} 
        element={<SettingLayout {...props}>{route.element}</SettingLayout>}
        />
      ))}

      {(appRoutes || []).map((route, idx) => (
        <Route
          key={idx + route.name}
          path={route.path}
          element={<OtherLayout {...props}>{route.element}</OtherLayout>}
        />
      ))}
    </Routes>
  )
}

export default AppRouter
