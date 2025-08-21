import React, { useState, useRef } from 'react';
import { Button, Card, CardBody, CardHeader, Alert } from 'react-bootstrap';
import { ProfilePhotoService } from '@/services/ProfilePhotoService';
import { useAuth } from '@/context/AuthProvider';

interface ProfilePhotoUploaderProps {
  currentPhotoUrl?: string | null;
  onPhotoUploaded?: (newUrl: string) => void;
}

export const ProfilePhotoUploader: React.FC<ProfilePhotoUploaderProps> = ({ 
  currentPhotoUrl, 
  onPhotoUploaded 
}) => {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user?.userId) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      return;
    }

    setUploading(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await ProfilePhotoService.uploadProfilePhoto(user.userId, file);
      
      if (result.success && result.url) {
        setSuccess('Profile photo uploaded successfully!');
        onPhotoUploaded?.(result.url);
      } else {
        setError(result.error || 'Failed to upload photo');
      }
    } catch (error) {
      setError('An error occurred while uploading');
      console.error('Upload error:', error);
    } finally {
      setUploading(false);
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  return (
    <Card>
      <CardHeader>
        <h6 className="mb-0">Profile Photo</h6>
      </CardHeader>
      <CardBody className="text-center">
        <div className="mb-3">
          <img
            src={ProfilePhotoService.getProfilePhotoWithFallback(
              user?.userId || 'unknown',
              user?.username || 'User',
              currentPhotoUrl
            )}
            alt="Profile"
            className="avatar-img rounded-circle"
            style={{ width: '100px', height: '100px', objectFit: 'cover' }}
          />
        </div>

        {error && (
          <Alert variant="danger" className="text-start">
            {error}
          </Alert>
        )}

        {success && (
          <Alert variant="success" className="text-start">
            {success}
          </Alert>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />

        <Button
          variant="primary"
          onClick={triggerFileSelect}
          disabled={uploading}
        >
          {uploading ? 'Uploading...' : 'Change Photo'}
        </Button>

        <div className="mt-2">
          <small className="text-muted">
            Supports JPG, PNG, GIF. Max size: 5MB
          </small>
        </div>
      </CardBody>
    </Card>
  );
};
