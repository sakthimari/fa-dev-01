
import { useEffect, useState } from 'react'
import { Dropdown, DropdownDivider, DropdownItem, DropdownMenu, DropdownToggle, OverlayTrigger, Tooltip } from 'react-bootstrap'

import type { IconType } from 'react-icons'
import { BsCardText, BsCircleHalf, BsGear, BsLifePreserver, BsMoonStars, BsPower, BsSun } from 'react-icons/bs'

import type { ThemeType } from '@/types/context'

import avatar7 from '@/assets/images/avatar/07.jpg'
import { developedByLink } from '@/context/constants'
import { useLayoutContext } from '@/context/useLayoutContext'
import { useProfile } from '@/hooks/useProfile'
import { getImageUrl } from '@/utils/imageUtils'
import { toSentenceCase } from '@/utils/change-casing'
import clsx from 'clsx'
import { Link } from 'react-router-dom'

import { useAuth } from '@/context/AuthProvider';

type ThemeModeType = {
  theme: ThemeType
  icon: IconType
}

const ProfileDropdown = () => {
  const { profile, refreshProfile } = useProfile()
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null)
  const { signOut, loading } = useAuth()

  // Refresh profile data when component mounts
  useEffect(() => {
    refreshProfile()
  }, [refreshProfile])

  // Load profile image URL when profile data changes
  useEffect(() => {
    const loadProfileImage = async () => {
      if (profile?.profilePhotoKey) {
        const profileUrl = await getImageUrl(profile.profilePhotoKey)
        setProfileImageUrl(profileUrl)
      }
    }
    
    loadProfileImage()
  }, [profile?.profilePhotoKey])

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }
  const themeModes: ThemeModeType[] = [
    {
      icon: BsSun,
      theme: 'light',
    },
    {
      icon: BsMoonStars,
      theme: 'dark',
    },
    {
      icon: BsCircleHalf,
      theme: 'auto',
    },
  ]

  const { theme: themeMode, updateTheme } = useLayoutContext()
  // Note: We don't need removeSession since we're using Amplify signOut

  return (
    <Dropdown as="li" className="nav-item ms-2" drop="down" align="end">
      <DropdownToggle
        className="nav-link btn icon-md p-0 content-none"
        role="button"
        data-bs-auto-close="outside"
        data-bs-display="static"
        data-bs-toggle="dropdown"
        aria-expanded="false">
        <img className="avatar-img rounded-2" src={profileImageUrl || avatar7} alt="avatar" />
      </DropdownToggle>
      <DropdownMenu className="dropdown-animation dropdown-menu-end pt-3 small me-md-n3" aria-labelledby="profileDropdown">
        <li className="px-3">
          <div className="d-flex align-items-center position-relative">
            <div className="avatar me-3">
              <img className="avatar-img rounded-circle" src={profileImageUrl || avatar7} alt="avatar" />
            </div>
            <div>
              <Link className="h6 stretched-link" to="">
                {profile?.firstName && profile?.lastName 
                  ? `${profile.firstName} ${profile.lastName}` 
                  : profile?.firstName || 'Lori Ferguson'
                }
              </Link>
              <p className="small m-0">
                {profile?.profession || 'Web Developer'}
              </p>
            </div>
          </div>
          <DropdownItem as={Link} className="btn btn-primary-soft btn-sm my-2 text-center" to="/profile/feed">
            View profile
          </DropdownItem>
        </li>

        <li>
          <DropdownItem as={Link} to="/settings/account">
            <BsGear className="fa-fw me-2" />
            Settings &amp; Privacy
          </DropdownItem>
        </li>
        <li>
          <DropdownItem href={developedByLink} rel="noreferrer" target="_blank">
            <BsLifePreserver className="fa-fw me-2" />
            Support
          </DropdownItem>
        </li>
        <li>
          <DropdownItem href="" target="_blank" rel="noreferrer">
            <BsCardText className="fa-fw me-2" />
            Documentation
          </DropdownItem>
        </li>
        <DropdownDivider />
        <li>
          <DropdownItem className="bg-danger-soft-hover" onClick={handleSignOut} disabled={loading}>
            <BsPower className="fa-fw me-2" />
            {loading ? 'Signing Out...' : 'Sign Out'}
          </DropdownItem>
        </li>
        <li>
          
          <DropdownDivider />
        </li>

        <li>
          <div className="modeswitch-item theme-icon-active d-flex justify-content-center gap-3 align-items-center p-2 pb-0">
            <span>Mode:</span>

            {themeModes.map(({ icon: Icon, theme }, idx) => (
              <OverlayTrigger key={theme + idx} overlay={<Tooltip>{toSentenceCase(theme)}</Tooltip>}>
                <button
                  type="button"
                  className={clsx('btn btn-modeswitch nav-link text-primary-hover mb-0', { active: theme === themeMode })}
                  onClick={() => updateTheme(theme)}>
                  <Icon />
                </button>
              </OverlayTrigger>
            ))}
          </div>
        </li>
      </DropdownMenu>
    </Dropdown>
  )
}

export default ProfileDropdown
