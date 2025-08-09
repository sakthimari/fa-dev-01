import type { UserProfileData } from '@/services/ProfileService'

// Mock ProfileService for local testing without AWS deployment
export class MockProfileService {
  private static readonly STORAGE_KEY = 'mock_user_profile'

  // Save profile to localStorage for testing
  static async saveProfile(profileData: UserProfileData) {
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(profileData))
      console.log('Mock: Profile saved to localStorage:', profileData)
      
      return { 
        data: { 
          ...profileData, 
          id: 'mock-id-' + Date.now() 
        } 
      }
    } catch (error) {
      console.error('Mock: Error saving profile:', error)
      throw error
    }
  }

  // Get profile from localStorage
  static async getProfile(): Promise<UserProfileData | null> {
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500))
      
      const data = localStorage.getItem(this.STORAGE_KEY)
      if (data) {
        const profile = JSON.parse(data)
        console.log('Mock: Profile loaded from localStorage:', profile)
        return profile
      }
      return null
    } catch (error) {
      console.error('Mock: Error fetching profile:', error)
      throw error
    }
  }

  // Delete profile from localStorage
  static async deleteProfile() {
    try {
      localStorage.removeItem(this.STORAGE_KEY)
      console.log('Mock: Profile deleted from localStorage')
    } catch (error) {
      console.error('Mock: Error deleting profile:', error)
      throw error
    }
  }
}

// Mock ImageUpload Service for local testing
export class MockImageUploadService {
  static async uploadProfilePhoto(file: File) {
    // Simulate upload delay
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // Create a local URL for preview
    const url = URL.createObjectURL(file)
    const key = `mock-profile-${Date.now()}-${file.name}`
    
    console.log('Mock: Profile photo uploaded:', { url, key })
    return { url, key }
  }

  static async uploadCoverPhoto(file: File) {
    // Simulate upload delay
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // Create a local URL for preview
    const url = URL.createObjectURL(file)
    const key = `mock-cover-${Date.now()}-${file.name}`
    
    console.log('Mock: Cover photo uploaded:', { url, key })
    return { url, key }
  }

  static async deleteImage(key: string) {
    console.log('Mock: Image deleted:', key)
  }

  static validateImageFile(file: File) {
    const maxSize = 5 * 1024 * 1024 // 5MB
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']

    if (!allowedTypes.includes(file.type)) {
      return {
        isValid: false,
        error: 'Please upload a valid image file (JPEG, PNG, or WebP)',
      }
    }

    if (file.size > maxSize) {
      return {
        isValid: false,
        error: 'Image size must be less than 5MB',
      }
    }

    return { isValid: true }
  }
}

export default MockProfileService
