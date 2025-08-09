import { uploadData, getUrl, remove, list } from 'aws-amplify/storage';
import { getCurrentUser } from 'aws-amplify/auth';

export interface ImageUploadResult {
  url: string;
  key: string;
}

export class ImageUploadService {
  // Upload profile photo
  static async uploadProfilePhoto(file: File): Promise<ImageUploadResult> {
    try {
      const currentUser = await getCurrentUser();
      const fileExtension = file.name.split('.').pop();
      const fileName = `profile-${Date.now()}.${fileExtension}`;
      const key = `profile-photos/${currentUser.userId}/${fileName}`;

      const uploadResult = await uploadData({
        key,
        data: file,
        options: {
          contentType: file.type,
        }
      }).result;

      const url = await getUrl({ 
        key
      }).then(result => result.url.toString());

      return {
        url,
        key: uploadResult.key,
      };
    } catch (error) {
      console.error('Error uploading profile photo:', error);
      throw error;
    }
  }

  // Upload cover photo
  static async uploadCoverPhoto(file: File): Promise<ImageUploadResult> {
    try {
      const currentUser = await getCurrentUser();
      const fileExtension = file.name.split('.').pop();
      const fileName = `cover-${Date.now()}.${fileExtension}`;
      const key = `cover-photos/${currentUser.userId}/${fileName}`;

      const uploadResult = await uploadData({
        key,
        data: file,
        options: {
          contentType: file.type,
        }
      }).result;

      const url = await getUrl({ 
        key
      }).then(result => result.url.toString());

      return {
        url,
        key: uploadResult.key,
      };
    } catch (error) {
      console.error('Error uploading cover photo:', error);
      throw error;
    }
  }

  // Upload feed photo to public folder (works with current permissions)
  static async uploadFeedPhotoPublic(file: File, filename?: string): Promise<ImageUploadResult> {
    try {
      const currentUser = await getCurrentUser();
      const fileExtension = file.name.split('.').pop();
      const finalFileName = filename || `feed-${Date.now()}.${fileExtension}`;
      const key = `public/feed-photos/${currentUser.userId}/${finalFileName}`;

      const uploadResult = await uploadData({
        key,
        data: file,
        options: {
          contentType: file.type,
        }
      }).result;

      const url = await getUrl({ 
        key
      }).then(result => result.url.toString());

      return {
        url,
        key: uploadResult.key,
      };
    } catch (error) {
      console.error('Error uploading feed photo to public folder:', error);
      throw error;
    }
  }

  // Upload feed photo (for when permissions are fixed)
  static async uploadFeedPhoto(file: File, filename?: string): Promise<ImageUploadResult> {
    try {
      const currentUser = await getCurrentUser();
      const fileExtension = file.name.split('.').pop();
      const finalFileName = filename || `feed-${Date.now()}.${fileExtension}`;
      const key = `feed-photos/${currentUser.userId}/${finalFileName}`;

      const uploadResult = await uploadData({
        key,
        data: file,
        options: {
          contentType: file.type,
        }
      }).result;

      const url = await getUrl({ 
        key
      }).then(result => result.url.toString());

      return {
        url,
        key: uploadResult.key,
      };
    } catch (error) {
      console.error('Error uploading feed photo:', error);
      throw error;
    }
  }

  // List existing feed photos for current user
  static async listFeedPhotos(): Promise<Array<{ key: string; url: string; lastModified?: Date }>> {
    try {
      const currentUser = await getCurrentUser();
      
      // The photos are stored in public/feed-photos/{userId}/ path
      const publicFeedPath = `public/feed-photos/${currentUser.userId}/`;
      
      try {
        console.log('Listing photos from path:', publicFeedPath);
        const result = await list({
          prefix: publicFeedPath,
        });

        console.log('Found items:', result.items);

        const photos = await Promise.all(
          result.items
            .filter(item => item.key !== publicFeedPath) // Filter out the folder itself
            .map(async (item) => {
              try {
                const url = await getUrl({ key: item.key }).then(result => result.url.toString());
                return {
                  key: item.key,
                  url,
                  lastModified: item.lastModified
                };
              } catch (urlError) {
                console.warn('Failed to get URL for item:', item.key, urlError);
                return null;
              }
            })
        );

        // Filter out null results and sort by last modified date
        const validPhotos = photos.filter((photo): photo is NonNullable<typeof photo> => photo !== null);
        
        validPhotos.sort((a, b) => {
          if (!a.lastModified || !b.lastModified) return 0;
          return b.lastModified.getTime() - a.lastModified.getTime();
        });

        console.log('Processed photos:', validPhotos);
        return validPhotos;
      } catch (listError) {
        console.error('Failed to list from public/feed-photos path:', listError);
        
        // Try alternative paths as fallback
        try {
          console.log('Trying fallback path: feed-photos/${currentUser.userId}/');
          const feedResult = await list({
            prefix: `feed-photos/${currentUser.userId}/`,
          });

          const photos = await Promise.all(
            feedResult.items.map(async (item) => {
              const url = await getUrl({ key: item.key }).then(result => result.url.toString());
              return {
                key: item.key,
                url,
                lastModified: item.lastModified
              };
            })
          );

          return photos.sort((a, b) => {
            if (!a.lastModified || !b.lastModified) return 0;
            return b.lastModified.getTime() - a.lastModified.getTime();
          });
        } catch (fallbackError) {
          console.error('Fallback path also failed:', fallbackError);
          return [];
        }
      }
    } catch (error) {
      console.error('Error listing feed photos:', error);
      return [];
    }
  }

  // Delete image
  static async deleteImage(key: string): Promise<void> {
    try {
      await remove({ key });
    } catch (error) {
      console.error('Error deleting image:', error);
      throw error;
    }
  }

  // Validate image file
  static validateImageFile(file: File): { isValid: boolean; error?: string } {
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

    if (!allowedTypes.includes(file.type)) {
      return {
        isValid: false,
        error: 'Please upload a valid image file (JPEG, PNG, or WebP)',
      };
    }

    if (file.size > maxSize) {
      return {
        isValid: false,
        error: 'Image size must be less than 5MB',
      };
    }

    return { isValid: true };
  }
}

export default ImageUploadService;
