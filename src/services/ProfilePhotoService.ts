import { Storage } from 'aws-amplify/storage';
import { generateClient } from 'aws-amplify/api';
import type { Schema } from '@/amplify/data/resource';

const client = generateClient<Schema>();

export class ProfilePhotoService {
  /**
   * Upload a profile photo for a user
   */
  static async uploadProfilePhoto(userId: string, file: File): Promise<{ success: boolean; url?: string; error?: string }> {
    try {
      const fileExtension = file.name.split('.').pop() || 'jpg';
      const fileName = `profile-${Date.now()}.${fileExtension}`;
      const key = `profile-photos/${userId}/${fileName}`;

      // Upload to S3 with public read access
      const result = await Storage.uploadData({
        key,
        data: file,
        options: {
          accessLevel: 'guest', // Public access
          contentType: file.type,
        },
      });

      // Get the public URL
      const url = await Storage.getUrl({
        key,
        options: {
          accessLevel: 'guest',
        },
      });

      // Update user profile with new photo URL
      await client.models.UserProfile.update({
        userId,
        profilePhotoUrl: url.url.toString(),
      });

      return {
        success: true,
        url: url.url.toString(),
      };
    } catch (error) {
      console.error('Error uploading profile photo:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get a user's profile photo URL with fallback
   */
  static async getProfilePhotoUrl(userId: string): Promise<string | null> {
    try {
      // First, try to get from UserProfile
      const userProfile = await client.models.UserProfile.get({ userId });
      
      if (userProfile?.data?.profilePhotoUrl) {
        return userProfile.data.profilePhotoUrl;
      }

      // If no URL in profile, try to find the latest uploaded photo
      const photos = await Storage.list({
        prefix: `profile-photos/${userId}/`,
        options: {
          accessLevel: 'guest',
        },
      });

      if (photos.items && photos.items.length > 0) {
        // Get the most recent photo
        const latestPhoto = photos.items.sort((a, b) => 
          new Date(b.lastModified || 0).getTime() - new Date(a.lastModified || 0).getTime()
        )[0];

        const url = await Storage.getUrl({
          key: latestPhoto.key!,
          options: {
            accessLevel: 'guest',
          },
        });

        return url.url.toString();
      }

      return null;
    } catch (error) {
      console.error('Error getting profile photo:', error);
      return null;
    }
  }

  /**
   * Get profile photo URL with generated fallback
   */
  static getProfilePhotoWithFallback(userId: string, userName: string, profilePhotoUrl?: string | null): string {
    if (profilePhotoUrl) {
      return profilePhotoUrl;
    }

    // Generate a nice avatar using UI Avatars service
    const initials = userName
      .split(' ')
      .map(name => name.charAt(0).toUpperCase())
      .join('')
      .slice(0, 2);

    // Use a consistent color based on userId
    const colors = [
      '6366f1', '8b5cf6', 'ec4899', 'ef4444', 'f97316',
      '06b6d4', '10b981', '84cc16', 'eab308', 'f59e0b'
    ];
    const colorIndex = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
    const backgroundColor = colors[colorIndex];

    return `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=${backgroundColor}&color=fff&size=100&rounded=true&bold=true`;
  }
}
