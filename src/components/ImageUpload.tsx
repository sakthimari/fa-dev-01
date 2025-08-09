import { useState, useRef } from 'react';
import { Button, Alert, Spinner } from 'react-bootstrap';
import { BsCamera, BsTrash } from 'react-icons/bs';
import ImageUploadService from '@/services/ImageUploadService';
import { MockImageUploadService } from '@/services/MockProfileService';
import DEV_CONFIG from '@/config/dev';

interface ImageUploadProps {
  currentImageUrl?: string;
  onImageUpload: (url: string, key?: string) => void;
  onImageRemove?: () => void;
  uploadType: 'profile' | 'cover';
  className?: string;
  children?: React.ReactNode;
}

const ImageUpload = ({ 
  currentImageUrl, 
  onImageUpload, 
  onImageRemove, 
  uploadType,
  className,
  children 
}: ImageUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Choose service based on configuration
  const uploadService = DEV_CONFIG.USE_MOCK_SERVICES ? MockImageUploadService : ImageUploadService;

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);
    
    // Validate file
    const validation = uploadService.validateImageFile(file);
    if (!validation.isValid) {
      setError(validation.error || 'Invalid file');
      return;
    }

    setUploading(true);
    
    try {
      let result;
      if (uploadType === 'profile') {
        result = await uploadService.uploadProfilePhoto(file);
      } else {
        result = await uploadService.uploadCoverPhoto(file);
      }
      
      onImageUpload(result.url, result.key);
    } catch (err) {
      setError('Failed to upload image. Please try again.');
      console.error('Upload error:', err);
    } finally {
      setUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveClick = () => {
    if (onImageRemove) {
      onImageRemove();
    }
  };

  return (
    <div className={className}>
      {error && (
        <Alert variant="danger" dismissible onClose={() => setError(null)} className="mb-3">
          {error}
        </Alert>
      )}
      
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />
      
      <div className="d-flex gap-2 align-items-center">
        <Button 
          variant="primary" 
          size="sm" 
          onClick={handleUploadClick}
          disabled={uploading}
        >
          {uploading ? (
            <>
              <Spinner animation="border" size="sm" className="me-1" />
              Uploading...
            </>
          ) : (
            <>
              <BsCamera className="me-1" />
              {currentImageUrl ? 'Change' : 'Upload'} {uploadType === 'profile' ? 'Photo' : 'Cover'}
            </>
          )}
        </Button>
        
        {currentImageUrl && onImageRemove && (
          <Button 
            variant="outline-danger" 
            size="sm" 
            onClick={handleRemoveClick}
            disabled={uploading}
          >
            <BsTrash className="me-1" />
            Remove
          </Button>
        )}
      </div>
      
      {children}
    </div>
  );
};

export default ImageUpload;
