import { useState, useEffect } from 'react'
import ProfileService, { type UserProfileData } from '@/services/ProfileService'
import { MockProfileService } from '@/services/MockProfileService'
import DEV_CONFIG from '@/config/dev'

export interface UseProfileResult {
  profile: UserProfileData | null
  loading: boolean
  error: string | null
  saveProfile: (data: UserProfileData) => Promise<void>
  refreshProfile: () => Promise<void>
}

export const useProfile = (): UseProfileResult => {
  const [profile, setProfile] = useState<UserProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Choose service based on configuration
  const service = DEV_CONFIG.USE_MOCK_SERVICES ? MockProfileService : ProfileService

  const loadProfile = async () => {
    setLoading(true)
    setError(null)
    try {
      const profileData = await service.getProfile()
      if (profileData) {
        setProfile({
          firstName: profileData.firstName || '',
          lastName: profileData.lastName || '',
          email: profileData.email || '',
          phone: profileData.phone || '',
          birthday: profileData.birthday || '',
          gender: profileData.gender || 'Male',
          bio: profileData.bio || '',
          location: profileData.location || '',
          website: profileData.website || '',
          profession: profileData.profession || '',
          company: profileData.company || '',
          coverPhotoUrl: profileData.coverPhotoUrl || '',
          profilePhotoUrl: profileData.profilePhotoUrl || '',
          coverPhotoKey: profileData.coverPhotoKey || '',
          profilePhotoKey: profileData.profilePhotoKey || '',
        })
      }
    } catch (err) {
      setError('Failed to load profile')
      console.error('Error loading profile:', err)
    } finally {
      setLoading(false)
    }
  }

  const saveProfile = async (data: UserProfileData) => {
    setError(null)
    try {
      await service.saveProfile(data)
      setProfile(data)
    } catch (err) {
      setError('Failed to save profile')
      throw err
    }
  }

  const refreshProfile = async () => {
    await loadProfile()
  }

  useEffect(() => {
    loadProfile()
  }, [])

  return {
    profile,
    loading,
    error,
    saveProfile,
    refreshProfile,
  }
}

export default useProfile
