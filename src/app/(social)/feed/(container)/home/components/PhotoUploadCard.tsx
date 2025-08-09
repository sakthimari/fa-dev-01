import { useState, useRef, useEffect } from 'react'
import { Card, CardBody, CardHeader, CardTitle, Button, Row, Col, Alert } from 'react-bootstrap'
import { BsCamera, BsX, BsImage, BsArrowClockwise } from 'react-icons/bs'
import { ImageUploadService } from '@/services/ImageUploadService'
import { getCurrentUser } from 'aws-amplify/auth'
import { getImageUrl } from '@/utils/imageUtils'

interface UploadedPhoto {
  id: string
  url: string
  filename: string
  uploadedAt: Date
}

const PhotoUploadCard = () => {
  const [uploadedPhotos, setUploadedPhotos] = useState<UploadedPhoto[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Load existing photos on component mount
  useEffect(() => {
    loadExistingPhotos()
  }, [])

  const loadExistingPhotos = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setIsRefreshing(true)
      } else {
        setIsLoading(true)
      }
      console.log('Loading existing photos...')
      const existingPhotos = await ImageUploadService.listFeedPhotos()
      console.log('Loaded photos from S3:', existingPhotos)
      
      const formattedPhotos: UploadedPhoto[] = existingPhotos.map((photo) => ({
        id: photo.key,
        url: photo.url,
        filename: photo.key.split('/').pop() || 'photo',
        uploadedAt: photo.lastModified || new Date()
      }))
      
      console.log('Formatted photos:', formattedPhotos)
      
      // Remove duplicates based on id (key) and sort by upload date
      const uniquePhotos = formattedPhotos.filter((photo, index, self) => 
        index === self.findIndex(p => p.id === photo.id)
      ).sort((a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime())
      
      setUploadedPhotos(uniquePhotos)
    } catch (error) {
      console.error('Error loading existing photos:', error)
      setUploadError('Failed to load existing photos.')
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    setIsUploading(true)
    setUploadError(null)

    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        // Generate unique filename
        const timestamp = Date.now()
        const extension = file.name.split('.').pop()
        const filename = `feed-photo-${timestamp}-${Math.random().toString(36).substr(2, 9)}.${extension}`
        
        // Upload to S3 public folder (works with current permissions)
        const uploadResult = await ImageUploadService.uploadFeedPhotoPublic(file, filename)
        
        // Get the URL for display
        const imageUrl = await getImageUrl(uploadResult.key)
        
        return {
          id: uploadResult.key,
          url: imageUrl || '', // Ensure url is never null
          filename: file.name,
          uploadedAt: new Date()
        }
      })

      const newPhotos = await Promise.all(uploadPromises)
      
      // Add new photos to the beginning of the list immediately
      setUploadedPhotos(prev => [...newPhotos, ...prev])
      
      // Clear the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      
      // Optionally refresh after a longer delay to ensure S3 consistency
      // But don't rely on it for immediate UI updates
      setTimeout(() => {
        loadExistingPhotos(true) // Pass true for refresh mode
      }, 3000)
    } catch (error) {
      console.error('Error uploading photos:', error)
      setUploadError('Failed to upload photos. Please try again.')
    } finally {
      setIsUploading(false)
    }
  }

  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  const removePhoto = async (photoId: string) => {
    try {
      // Remove from local state immediately for better UX
      setUploadedPhotos(prev => prev.filter(photo => photo.id !== photoId))
      
      // Delete from S3
      await ImageUploadService.deleteImage(photoId)
    } catch (error) {
      console.error('Error deleting photo:', error)
      setUploadError('Failed to delete photo. Please try again.')
      
      // Reload photos to restore the correct state
      loadExistingPhotos()
    }
  }

  const formatTimeAgo = (date: Date) => {
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`
    return `${Math.floor(diffInMinutes / 1440)}d ago`
  }

  return (
    <>
      <style>
        {`
          .spin {
            animation: spin 1s linear infinite;
          }
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}
      </style>
      <Card>
      <CardHeader className="pb-0 border-0 d-flex justify-content-between align-items-center">
        <CardTitle className="mb-0">My Photos</CardTitle>
        <div className="d-flex gap-2">
          <Button 
            variant="outline-secondary" 
            size="sm" 
            onClick={() => loadExistingPhotos(true)}
            disabled={isRefreshing || isLoading}
          >
            <BsArrowClockwise className={`me-1 ${isRefreshing ? 'spin' : ''}`} />
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
          <Button 
            variant="primary-soft" 
            size="sm" 
            onClick={handleUploadClick}
            disabled={isUploading}
          >
            <BsCamera className="me-1" />
            {isUploading ? 'Uploading...' : 'Upload'}
          </Button>
        </div>
      </CardHeader>
      
      <CardBody>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />

        {uploadError && (
          <Alert variant="danger" dismissible onClose={() => setUploadError(null)}>
            {uploadError}
          </Alert>
        )}

        {isLoading ? (
          <div className="text-center py-4">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="text-muted mt-2">Loading photos...</p>
          </div>
        ) : uploadedPhotos.length === 0 ? (
          <div className="text-center py-4">
            <BsImage size={48} className="text-muted mb-3" />
            <p className="text-muted mb-0">No photos uploaded yet</p>
            <small className="text-muted">Click Upload to add your first photo</small>
          </div>
        ) : (
          <Row className="g-2">
            {uploadedPhotos.map((photo) => (
              <Col xs={6} key={photo.id}>
                <div className="position-relative">
                  <img 
                    src={photo.url} 
                    alt={photo.filename}
                    className="img-fluid rounded"
                    style={{ aspectRatio: '1', objectFit: 'cover', width: '100%' }}
                  />
                  <Button
                    variant="danger"
                    size="sm"
                    className="position-absolute top-0 end-0 m-1 p-1 rounded-circle"
                    style={{ width: '24px', height: '24px' }}
                    onClick={() => removePhoto(photo.id)}
                  >
                    <BsX size={14} />
                  </Button>
                  <div className="position-absolute bottom-0 start-0 end-0 bg-dark bg-opacity-50 text-white p-1 rounded-bottom">
                    <small>{formatTimeAgo(photo.uploadedAt)}</small>
                  </div>
                </div>
              </Col>
            ))}
          </Row>
        )}
      </CardBody>
    </Card>
    </>
  )
}

export default PhotoUploadCard
