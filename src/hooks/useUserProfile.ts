import { useState, useEffect } from 'react';
import { generateClient } from 'aws-amplify/api';
import type { Schema } from '../../amplify/data/resource';

const client = generateClient<Schema>();

interface UserProfile {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  profilePhotoUrl?: string;
  profilePhotoKey?: string;
}

/**
 * Hook to fetch user profile by user ID
 */
export const useUserProfile = (userId?: string) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setProfile(null);
      setLoading(false);
      setError(null);
      return;
    }

    const fetchProfile = async () => {
      setLoading(true);
      setError(null);
      
      try {
        console.log('Fetching profile for user ID:', userId);
        const response = await client.models.UserProfile.get({ id: userId });
        
        if (response.data) {
          console.log('Profile fetched successfully:', response.data);
          setProfile(response.data as UserProfile);
        } else {
          console.warn('No profile found for user ID:', userId);
          setProfile(null);
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch profile';
        console.error('Error fetching user profile:', err);
        setError(errorMessage);
        setProfile(null);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [userId]);

  return { profile, loading, error };
};

/**
 * Hook to get profile photo URL with fallback options
 */
export const useProfilePhoto = (userId?: string) => {
  const { profile, loading, error } = useUserProfile(userId);
  
  const getPhotoUrl = () => {
    if (!profile) return null;
    
    // Try direct URL first
    if (profile.profilePhotoUrl) {
      return profile.profilePhotoUrl;
    }
    
    // TODO: If we have profilePhotoKey, we could generate fresh URL
    // This would require implementing getImageUrl from S3
    
    return null;
  };

  const getDisplayName = () => {
    if (!profile) return 'Unknown User';
    
    if (profile.firstName && profile.lastName) {
      return `${profile.firstName} ${profile.lastName}`;
    }
    
    if (profile.firstName) {
      return profile.firstName;
    }
    
    if (profile.email) {
      return profile.email.split('@')[0];
    }
    
    return 'Unknown User';
  };

  const getInitials = () => {
    if (!profile) return '?';
    
    if (profile.firstName && profile.lastName) {
      return `${profile.firstName.charAt(0)}${profile.lastName.charAt(0)}`.toUpperCase();
    }
    
    if (profile.firstName) {
      return profile.firstName.charAt(0).toUpperCase();
    }
    
    if (profile.email) {
      return profile.email.charAt(0).toUpperCase();
    }
    
    return '?';
  };

  return {
    profile,
    photoUrl: getPhotoUrl(),
    displayName: getDisplayName(),
    initials: getInitials(),
    loading,
    error
  };
};
