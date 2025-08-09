import { useState } from 'react'
import {
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Dropdown,
  DropdownDivider,
  DropdownItem,
  DropdownMenu,
  DropdownToggle,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
} from 'react-bootstrap'
import {
  BsBookmark,
  BsBookmarkCheck,
  BsChatFill,
  BsEnvelope,
  BsFlag,
  BsHeart,
  BsHeartFill,
  BsLink,
  BsPencilSquare,
  BsPersonX,
  BsReplyFill,
  BsSendFill,
  BsShare,
  BsSlashCircle,
  BsThreeDots,
  BsTrash,
  BsXCircle,
} from 'react-icons/bs'
import { PostData } from '@/services/PostService'
import { getCurrentUser } from 'aws-amplify/auth'
import { useEffect } from 'react'

import avatar7 from '@/assets/images/avatar/07.jpg'

interface RealPostCardProps {
  post: PostData
  onDelete: (postId: string) => void
  onLike: (postId: string) => void
}

const RealPostCard = ({ post, onDelete, onLike }: RealPostCardProps) => {
  const [liked, setLiked] = useState(false)
  const [saved, setSaved] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [isOwnPost, setIsOwnPost] = useState(false)

  // Debug: Log post data
  useEffect(() => {
    console.log('RealPostCard received post:', {
      id: post.id,
      content: post.content,
      imageKeys: post.imageKeys,
      imageUrls: post.imageUrls,
      authorName: post.authorName
    })
  }, [post])

  useEffect(() => {
    const checkOwnership = async () => {
      try {
        const user = await getCurrentUser()
        setIsOwnPost(user.userId === post.authorId)
      } catch (error) {
        console.error('Error checking post ownership:', error)
      }
    }
    checkOwnership()
  }, [post.authorId])

  const handleLike = () => {
    setLiked(!liked)
    onLike(post.id)
  }

  const handleSave = () => {
    setSaved(!saved)
  }

  const handleDelete = () => {
    onDelete(post.id)
    setShowDeleteModal(false)
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes}m`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`
    if (diffInMinutes < 10080) return `${Math.floor(diffInMinutes / 1440)}d`
    return date.toLocaleDateString()
  }

  return (
    <>
      <Card>
        <CardHeader className="border-0 pb-0">
          <div className="d-flex align-items-center justify-content-between">
            <div className="d-flex align-items-center">
              <div className="avatar avatar-story me-2">
                <img 
                  className="avatar-img rounded-circle" 
                  src={post.authorProfilePhoto || avatar7} 
                  alt={post.authorName} 
                  onError={(e) => {
                    // Fallback to default avatar if image fails to load
                    const target = e.target as HTMLImageElement
                    if (target.src !== avatar7) {
                      target.src = avatar7
                    }
                  }}
                  onLoad={() => {
                    console.log('Profile photo loaded:', post.authorProfilePhoto)
                  }}
                />
              </div>
              <div>
                <div className="nav nav-divider">
                  <h6 className="nav-item card-title mb-0">
                    {post.authorName}
                  </h6>
                  <span className="nav-item small">{formatTimeAgo(post.createdAt)}</span>
                </div>
              </div>
            </div>
            <Dropdown className="ms-auto">
              <DropdownToggle
                as="a"
                className="text-secondary btn btn-secondary-soft-hover py-1 px-2 cursor-pointer"
                id="cardFeedAction"
                data-bs-toggle="dropdown"
                aria-expanded="false">
                <BsThreeDots />
              </DropdownToggle>
              <DropdownMenu className="dropdown-menu-end" aria-labelledby="cardFeedAction">
                {isOwnPost && (
                  <>
                    <DropdownItem>
                      <BsPencilSquare size={16} className="fa-fw pe-2" />
                      Edit post
                    </DropdownItem>
                    <DropdownItem onClick={() => setShowDeleteModal(true)}>
                      <BsTrash size={16} className="fa-fw pe-2" />
                      Delete post
                    </DropdownItem>
                    <DropdownDivider />
                  </>
                )}
                <DropdownItem>
                  <BsBookmark size={16} className="fa-fw pe-2" />
                  Save post
                </DropdownItem>
                <DropdownItem>
                  <BsPersonX size={16} className="fa-fw pe-2" />
                  Unfollow {post.authorName.split(' ')[0]}
                </DropdownItem>
                <DropdownItem>
                  <BsXCircle size={16} className="fa-fw pe-2" />
                  Hide post
                </DropdownItem>
                <DropdownItem>
                  <BsSlashCircle size={16} className="fa-fw pe-2" />
                  Block
                </DropdownItem>
                <DropdownDivider />
                <DropdownItem>
                  <BsFlag size={16} className="fa-fw pe-2" />
                  Report post
                </DropdownItem>
              </DropdownMenu>
            </Dropdown>
          </div>
        </CardHeader>

        <CardBody>
          {post.content && (
            <p className="mb-3">{post.content}</p>
          )}
          
          {post.imageUrls && post.imageUrls.length > 0 && (
            <div className="mb-3">
              {console.log('Rendering images for post:', post.id, 'URLs:', post.imageUrls)}
              {post.imageUrls.length === 1 ? (
                <img 
                  src={post.imageUrls[0]} 
                  className="card-img rounded" 
                  alt="Post image" 
                  onLoad={() => console.log('Image loaded successfully:', post.imageUrls[0])}
                  onError={(e) => {
                    console.error('Image failed to load:', post.imageUrls[0])
                    const target = e.target as HTMLImageElement
                    target.style.display = 'none'
                  }}
                />
              ) : (
                <div className="row g-2">
                  {post.imageUrls.map((imageUrl, index) => (
                    <div key={index} className={`col-${post.imageUrls.length > 2 ? '6' : '12'}`}>
                      <img 
                        src={imageUrl} 
                        className="img-fluid rounded" 
                        alt={`Post image ${index + 1}`}
                        style={{ aspectRatio: '1', objectFit: 'cover', width: '100%' }}
                        onLoad={() => console.log('Multi-image loaded successfully:', imageUrl)}
                        onError={(e) => {
                          console.error('Multi-image failed to load:', imageUrl)
                          const target = e.target as HTMLImageElement
                          target.style.display = 'none'
                        }}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardBody>

        <CardFooter className="py-3">
          <ul className="nav nav-fill nav-stack small">
            <li className="nav-item">
              <a className="nav-link mb-0 active cursor-pointer" onClick={handleLike}>
                {liked ? <BsHeartFill className="text-danger pe-1" /> : <BsHeart className="pe-1" />}
                Liked ({post.likes})
              </a>
            </li>
            <li className="nav-item">
              <a className="nav-link mb-0 cursor-pointer">
                <BsChatFill className="pe-1" />
                Comments ({post.comments})
              </a>
            </li>
            <li className="nav-item dropdown ms-sm-auto">
              <a className="nav-link mb-0 cursor-pointer" onClick={handleSave}>
                {saved ? <BsBookmarkCheck className="text-primary pe-1" /> : <BsBookmark className="pe-1" />}
                {saved ? 'Saved' : 'Save'}
              </a>
            </li>
            <li className="nav-item">
              <a className="nav-link mb-0 cursor-pointer">
                <BsShare className="pe-1" />
                Share
              </a>
            </li>
          </ul>
        </CardFooter>
      </Card>

      {/* Delete confirmation modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
        <ModalHeader closeButton>
          <h5 className="modal-title">Delete Post</h5>
        </ModalHeader>
        <ModalBody>
          <p>Are you sure you want to delete this post? This action cannot be undone.</p>
        </ModalBody>
        <ModalFooter>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDelete}>
            Delete Post
          </Button>
        </ModalFooter>
      </Modal>
    </>
  )
}

export default RealPostCard
