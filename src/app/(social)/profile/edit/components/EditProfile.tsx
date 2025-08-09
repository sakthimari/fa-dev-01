import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  Col,
  Form,
  FormControl,
  FormGroup,
  FormLabel,
  Row,
  Alert,
  Spinner,
} from 'react-bootstrap'
import { BsPencilFill } from 'react-icons/bs'

import avatar7 from '@/assets/images/avatar/07.jpg'
import background5 from '@/assets/images/bg/05.jpg'
import { useProfile } from '@/hooks/useProfile'
import { getImageUrl } from '@/utils/imageUtils'
import type { UserProfileData } from '@/services/ProfileService'
import ImageUpload from '@/components/ImageUpload'

const EditProfile = () => {
  const navigate = useNavigate()
  const { profile, loading, saveProfile, refreshProfile } = useProfile()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null)
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null)
  const [formData, setFormData] = useState<UserProfileData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    birthday: '',
    gender: 'Male',
    bio: '',
    location: '',
    website: '',
    profession: '',
    company: '',
    joinDate: '',
    coverPhotoUrl: '',
    profilePhotoUrl: '',
    coverPhotoKey: '',
    profilePhotoKey: '',
  })

  // Load profile data when it becomes available
  useEffect(() => {
    if (profile) {
      setFormData(profile)
    }
  }, [profile])

  // Load image URLs when form data changes
  useEffect(() => {
    const loadImageUrls = async () => {
      console.log('Loading edit profile image URLs...', { 
        profilePhotoKey: formData.profilePhotoKey, 
        coverPhotoKey: formData.coverPhotoKey 
      })
      
      if (formData.profilePhotoKey) {
        const profileUrl = await getImageUrl(formData.profilePhotoKey)
        console.log('Edit Profile image URL:', profileUrl)
        setProfileImageUrl(profileUrl)
      }
      if (formData.coverPhotoKey) {
        const coverUrl = await getImageUrl(formData.coverPhotoKey)
        console.log('Edit Cover image URL:', coverUrl)
        setCoverImageUrl(coverUrl)
      }
    }
    
    if (formData.profilePhotoKey || formData.coverPhotoKey) {
      loadImageUrls()
    }
  }, [formData.profilePhotoKey, formData.coverPhotoKey])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSuccess(false)

    try {
      await saveProfile(formData)
      await refreshProfile() // Refresh profile data to update all components
      setSuccess(true)
      
      // Show success message briefly then navigate
      setTimeout(() => {
        navigate('/profile/feed')
      }, 1500)
    } catch (err) {
      setError('Failed to save profile. Please try again.')
      console.error('Error saving profile:', err)
    } finally {
      setSaving(false)
    }
  }

  const handleCoverPhotoUpload = (url: string, key?: string) => {
    setFormData(prev => ({
      ...prev,
      coverPhotoUrl: url,
      coverPhotoKey: key || ''
    }))
    // Update display URL immediately
    setCoverImageUrl(url)
  }

  const handleProfilePhotoUpload = (url: string, key?: string) => {
    setFormData(prev => ({
      ...prev,
      profilePhotoUrl: url,
      profilePhotoKey: key || ''
    }))
    // Update display URL immediately
    setProfileImageUrl(url)
  }

  const handleCoverPhotoRemove = () => {
    setFormData(prev => ({
      ...prev,
      coverPhotoUrl: '',
      coverPhotoKey: ''
    }))
    setCoverImageUrl(null)
  }

  const handleProfilePhotoRemove = () => {
    setFormData(prev => ({
      ...prev,
      profilePhotoUrl: '',
      profilePhotoKey: ''
    }))
    setProfileImageUrl(null)
  }

  const handleCancel = () => {
    navigate('/profile/feed')
  }

  return (
    <Row className="g-4">
      <Col lg={12}>
        <Card>
          <CardHeader>
            <CardTitle className="h4">Edit Profile</CardTitle>
          </CardHeader>
          <CardBody>
            {/* Loading State */}
            {loading && (
              <div className="text-center py-5">
                <Spinner animation="border" variant="primary" />
                <p className="mt-2">Loading profile data...</p>
              </div>
            )}

            {/* Error Alert */}
            {error && (
              <Alert variant="danger" dismissible onClose={() => setError(null)}>
                {error}
              </Alert>
            )}

            {/* Success Alert */}
            {success && (
              <Alert variant="success">
                Profile saved successfully! Redirecting...
              </Alert>
            )}

            {/* Form Content */}
            {!loading && (
              <>
                {/* Cover Photo Section */}
                <div className="mb-4">
                  <h6>Cover Photo</h6>
                  <div className="position-relative">
                    <div
                      className="h-200px rounded"
                      style={{
                        backgroundImage: `url(${coverImageUrl || background5})`,
                        backgroundPosition: 'center',
                        backgroundSize: 'cover',
                        backgroundRepeat: 'no-repeat',
                      }}
                    />
                    <div className="position-absolute top-50 start-50 translate-middle">
                      <ImageUpload
                        currentImageUrl={coverImageUrl || undefined}
                        onImageUpload={handleCoverPhotoUpload}
                        onImageRemove={handleCoverPhotoRemove}
                        uploadType="cover"
                        className="text-center"
                      />
                    </div>
                  </div>
                </div>

                {/* Profile Picture Section */}
                <div className="mb-4">
                  <h6>Profile Picture</h6>
                  <div className="d-flex align-items-center">
                    <div className="position-relative me-3">
                      <img 
                        className="avatar avatar-xl rounded-circle border border-white border-3" 
                        src={profileImageUrl || avatar7} 
                        alt="avatar" 
                      />
                      <Button 
                        variant="light" 
                        size="sm" 
                        className="position-absolute bottom-0 end-0 rounded-circle"
                        onClick={() => {}}
                      >
                        <BsPencilFill size={12} />
                      </Button>
                    </div>
                    <div>
                      <ImageUpload
                        currentImageUrl={profileImageUrl || undefined}
                        onImageUpload={handleProfilePhotoUpload}
                        onImageRemove={handleProfilePhotoRemove}
                        uploadType="profile"
                      />
                    </div>
                  </div>
                </div>

            {/* Profile Form */}
            <Form onSubmit={handleSubmit}>
              <Row className="g-3">
                <Col md={6}>
                  <FormGroup>
                    <FormLabel>First Name</FormLabel>
                    <FormControl
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      placeholder="Enter first name"
                    />
                  </FormGroup>
                </Col>
                <Col md={6}>
                  <FormGroup>
                    <FormLabel>Last Name</FormLabel>
                    <FormControl
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      placeholder="Enter last name"
                    />
                  </FormGroup>
                </Col>
                <Col md={6}>
                  <FormGroup>
                    <FormLabel>Email</FormLabel>
                    <FormControl
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="Enter email"
                    />
                  </FormGroup>
                </Col>
                <Col md={6}>
                  <FormGroup>
                    <FormLabel>Phone</FormLabel>
                    <FormControl
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="Enter phone number"
                    />
                  </FormGroup>
                </Col>
                <Col md={6}>
                  <FormGroup>
                    <FormLabel>Birthday</FormLabel>
                    <FormControl
                      type="date"
                      name="birthday"
                      value={formData.birthday}
                      onChange={handleInputChange}
                    />
                  </FormGroup>
                </Col>
                <Col md={6}>
                  <FormGroup>
                    <FormLabel>Gender</FormLabel>
                    <Form.Select
                      name="gender"
                      value={formData.gender}
                      onChange={handleInputChange}
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                      <option value="Prefer not to say">Prefer not to say</option>
                    </Form.Select>
                  </FormGroup>
                </Col>
                <Col md={6}>
                  <FormGroup>
                    <FormLabel>Profession</FormLabel>
                    <FormControl
                      type="text"
                      name="profession"
                      value={formData.profession}
                      onChange={handleInputChange}
                      placeholder="Enter your profession"
                    />
                  </FormGroup>
                </Col>
                <Col md={6}>
                  <FormGroup>
                    <FormLabel>Company</FormLabel>
                    <FormControl
                      type="text"
                      name="company"
                      value={formData.company}
                      onChange={handleInputChange}
                      placeholder="Enter your company"
                    />
                  </FormGroup>
                </Col>
                <Col md={6}>
                  <FormGroup>
                    <FormLabel>Location</FormLabel>
                    <FormControl
                      type="text"
                      name="location"
                      value={formData.location}
                      onChange={handleInputChange}
                      placeholder="Enter your location"
                    />
                  </FormGroup>
                </Col>
                <Col md={6}>
                  <FormGroup>
                    <FormLabel>Website</FormLabel>
                    <FormControl
                      type="url"
                      name="website"
                      value={formData.website}
                      onChange={handleInputChange}
                      placeholder="Enter your website"
                    />
                  </FormGroup>
                </Col>
                <Col md={12}>
                  <FormGroup>
                    <FormLabel>Bio</FormLabel>
                    <Form.Control
                      as="textarea"
                      rows={4}
                      name="bio"
                      value={formData.bio}
                      onChange={handleInputChange}
                      placeholder="Write something about yourself..."
                    />
                  </FormGroup>
                </Col>
              </Row>
              
              <div className="d-flex justify-content-end mt-4">
                <Button 
                  variant="outline-secondary" 
                  className="me-2" 
                  onClick={handleCancel}
                  disabled={saving}
                >
                  Cancel
                </Button>
                <Button 
                  variant="primary" 
                  type="submit"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <Spinner animation="border" size="sm" className="me-2" />
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </Button>
              </div>
            </Form>
            </>
            )}
          </CardBody>
        </Card>
      </Col>
    </Row>
  )
}

export default EditProfile
