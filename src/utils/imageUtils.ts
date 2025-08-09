import { getUrl } from 'aws-amplify/storage';

export const getImageUrl = async (key: string | undefined): Promise<string | null> => {
  if (!key) return null;
  
  try {
    // Get URL for images stored in public folder
    const result = await getUrl({ 
      key: key
    });
    let url = result.url.toString();
    
    // Fix HTML entity encoding issues (convert &amp; to &)
    if (url.includes('&amp;')) {
      url = url.replace(/&amp;/g, '&');
      console.log('Fixed URL with HTML entities:', url);
    }
    
    return url;
  } catch (error) {
    console.error('Error getting image URL:', error);
    return null;
  }
};

export const getProfileImageUrl = async (profilePhotoKey: string | undefined): Promise<string | null> => {
  return getImageUrl(profilePhotoKey);
};

export const getCoverImageUrl = async (coverPhotoKey: string | undefined): Promise<string | null> => {
  return getImageUrl(coverPhotoKey);
};
