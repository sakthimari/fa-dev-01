import { generateClient } from "aws-amplify/data";
import type { Schema } from "../../amplify/data/resource";
import { getImageUrl } from "@/utils/imageUtils";
import { getCurrentUser } from 'aws-amplify/auth';

const client = generateClient<Schema>();

export interface UserProfileData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  birthday: string;
  gender: string;
  bio: string;
  location: string;
  website: string;
  profession: string;
  company: string;
  joinDate?: string; // Date when user joined the platform
  coverPhotoUrl?: string;
  profilePhotoUrl?: string;
  coverPhotoKey?: string;
  profilePhotoKey?: string;
}

export class ProfileService {
  // Create or update user profile
  static async saveProfile(profileData: UserProfileData) {
    try {
      console.log('Saving profile data:', profileData);
      
      // First, try to get existing profile
      const existingProfile = await this.getProfile();
      
      if (existingProfile) {
        console.log('Updating existing profile:', existingProfile.id);
        // Update existing profile
        const updatedProfile = await client.models.UserProfile.update({
          id: existingProfile.id,
          ...profileData,
        });
        console.log('Profile updated successfully:', updatedProfile);
        return updatedProfile;
      } else {
        console.log('Creating new profile');
        // Create new profile with join date
        const profileWithJoinDate = {
          ...profileData,
          joinDate: profileData.joinDate || new Date().toISOString()
        };
        const newProfile = await client.models.UserProfile.create(profileWithJoinDate);
        console.log('Profile created successfully:', newProfile);
        return newProfile;
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      throw error;
    }
  }

  // Get user profile (returns the first profile for the authenticated user)
  static async getProfile() {
    try {
      // Check for valid authentication token
      let currentUser;
      try {
        currentUser = await getCurrentUser();
        console.log('Current authenticated user:', currentUser);
      } catch (authError) {
        console.error('User not authenticated:', authError);
        return null; // Return null instead of throwing error
      }
      
      console.log('Fetching user profile for user:', currentUser.username);
      
      const { data: profiles } = await client.models.UserProfile.list({
        authMode: 'userPool', // Ensure it uses user authentication
        limit: 10, // Increase limit to see all profiles for debugging
      });
      
      console.log('All profiles found:', profiles);
      console.log('Number of profiles found:', profiles.length);
      
      if (profiles.length === 0) {
        console.log('No profile found for current user');
        return null;
      }
      
      // Find profile that belongs to current user
      const userProfile = profiles.find(profile => {
        console.log('Checking profile owner:', profile.owner, 'vs current user:', currentUser.username);
        return profile.owner === currentUser.username;
      });
      
      if (!userProfile) {
        console.log('No profile found matching current user');
        return null;
      }
      
      console.log('Found matching profile:', userProfile);
      
      // Generate fresh URLs for images if keys exist
      let profilePhotoUrl = userProfile.profilePhotoUrl || '';
      let coverPhotoUrl = userProfile.coverPhotoUrl || '';
      
      if (userProfile.profilePhotoKey) {
        try {
          const freshProfileUrl = await getImageUrl(userProfile.profilePhotoKey);
          if (freshProfileUrl) {
            profilePhotoUrl = freshProfileUrl;
            console.log('Generated fresh profile photo URL:', profilePhotoUrl);
          }
        } catch (error) {
          console.error('Error generating profile photo URL:', error);
        }
      }
      
      if (userProfile.coverPhotoKey) {
        try {
          const freshCoverUrl = await getImageUrl(userProfile.coverPhotoKey);
          if (freshCoverUrl) {
            coverPhotoUrl = freshCoverUrl;
            console.log('Generated fresh cover photo URL:', coverPhotoUrl);
          }
        } catch (error) {
          console.error('Error generating cover photo URL:', error);
        }
      }
      
      const enrichedProfile = {
        ...userProfile,
        profilePhotoUrl,
        coverPhotoUrl
      };
      
      console.log('Profile with fresh URLs:', enrichedProfile);
      return enrichedProfile;
    } catch (error) {
      console.error('Error fetching profile:', error);
      throw error;
    }
  }

  // Delete user profile
  static async deleteProfile() {
    try {
      const existingProfile = await this.getProfile();
      if (existingProfile) {
        await client.models.UserProfile.delete({ id: existingProfile.id });
      }
    } catch (error) {
      console.error('Error deleting profile:', error);
      throw error;
    }
  }

  // Get profile by user ID (for other users)
  static async getProfileByUserId(userId: string) {
    try {
      console.log('Getting profile for user ID:', userId);
      
      const response = await client.models.UserProfile.list({
        filter: {
          owner: {
            eq: userId
          }
        }
      });

      if (response.data && response.data.length > 0) {
        const profile = response.data[0];
        
        // Generate fresh URLs for profile and cover photos
        let profilePhotoUrl = profile.profilePhotoUrl;
        let coverPhotoUrl = profile.coverPhotoUrl;

        if (profile.profilePhotoKey) {
          try {
            profilePhotoUrl = await getImageUrl(profile.profilePhotoKey);
          } catch (error) {
            console.warn('Could not generate fresh profile photo URL:', error);
          }
        }

        if (profile.coverPhotoKey) {
          try {
            coverPhotoUrl = await getImageUrl(profile.coverPhotoKey);
          } catch (error) {
            console.warn('Could not generate fresh cover photo URL:', error);
          }
        }

        return {
          ...profile,
          profilePhotoUrl,
          coverPhotoUrl,
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error getting profile by user ID:', error);
      return null;
    }
  }
}

export default ProfileService;
