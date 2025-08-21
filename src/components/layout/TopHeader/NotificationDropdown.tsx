import { useState, useEffect } from 'react'
import { timeSince } from '@/utils/date'
import clsx from 'clsx'
import { Link } from 'react-router-dom'
import { Button, Card, CardBody, CardFooter, CardHeader, Dropdown, DropdownMenu, DropdownToggle } from 'react-bootstrap'
import { BsBellFill } from 'react-icons/bs'
import { generateClient } from 'aws-amplify/api'
import { getUrl } from 'aws-amplify/storage'
import { useAuth } from '@/context/AuthProvider'
import type { NotificationType } from '@/types/data'
import type { Schema } from '@/../amplify/data/resource'
// removed unused import

const client = generateClient<Schema>()

const NotificationDropdown = () => {
  const { user } = useAuth()
  const [allNotifications, setAllNotifications] = useState<NotificationType[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)

  // Helper function to get proper avatar URL from S3 key
  const getAvatarUrl = async (avatarKey: string): Promise<string | undefined> => {
    try {
      if (!avatarKey) return undefined
      
      // Normalize: if presigned URL, extract key after /public/
      if (avatarKey.includes('amazonaws.com')) {
        const url = new URL(avatarKey)
        const path = url.pathname.startsWith('/') ? url.pathname.slice(1) : url.pathname
        avatarKey = path.startsWith('public/') ? path.slice('public/'.length) : path
      }

      // If key already includes folder, use as-is; otherwise, assume it's missing folder
      const normalizedKey = avatarKey.startsWith('profile-photos/') ? avatarKey : `profile-photos/${avatarKey}`
      
      // Generate fresh URL using Amplify Storage
      const result = await getUrl({
        key: normalizedKey,
        options: {
          accessLevel: 'guest'
        }
      })
      
      return result.url.toString()
    } catch (error) {
      console.error('Error getting avatar URL:', error)
      return undefined
    }
  }

  // Function to fetch notifications from database
  const getNotificationsFromDatabase = async (): Promise<NotificationType[]> => {
    try {
      console.log('Loading notifications from database for user:', user?.userId)
      
      // Get current user's email directly from user object
      if (!user?.email) {
        console.log('No user email found')
        return []
      }

      console.log('User email:', user.email)

      // Check if client and models are available
      if (!client?.models?.Invitation) {
        console.error('Invitation model not available in client')
        return []
      }

      // Get all pending invitations sent to this user's email
      const invitations = await client.models.Invitation.list({
        filter: {
          recipientEmail: { eq: user.email },
          status: { eq: 'pending' }
        }
      })

      console.log('Found invitations:', invitations.data?.length || 0)

      // Convert invitations to notifications
      const notifications: NotificationType[] = []

      if (invitations.data) {
        for (const invitation of invitations.data) {
          try {
            // Use real inviterName and get proper avatar URL
            const inviterName = invitation.inviterName || 'Unknown User'
            const avatarUrl = invitation.inviterAvatar ? await getAvatarUrl(invitation.inviterAvatar) : undefined

            console.log('Processing invitation from:', inviterName, 'Avatar:', avatarUrl);

            // Create notification object
            const notification: NotificationType = {
              id: `invitation-${invitation.id}`,
              title: `${inviterName} sent you a friend request`,
              description: 'Wants to connect with you',
              time: new Date(invitation.sentAt || Date.now()),
              isFriendRequest: true,
              isRead: false,
              inviterId: invitation.inviterId,
              inviterName: inviterName,
              avatar: avatarUrl
            }

            notifications.push(notification)
            console.log('Created notification for:', inviterName, 'with avatar:', avatarUrl)
          } catch (error) {
            console.error('Error processing invitation:', invitation.id, error)
          }
        }
      }

      return notifications
    } catch (error) {
      console.error('Error loading notifications from database:', error)
      return []
    }
  }

  // Load notifications on component mount
  useEffect(() => {
    const loadNotifications = async () => {
      setLoading(true)
      const dbNotifications = await getNotificationsFromDatabase()
      setAllNotifications(dbNotifications)
      setUnreadCount(dbNotifications.filter(n => !n.isRead).length)
      setLoading(false)
    }

    if (user?.userId) {
      loadNotifications()
    }
  }, [user?.userId])

  // Refresh notifications manually
  const refreshNotifications = async () => {
    setLoading(true)
    const dbNotifications = await getNotificationsFromDatabase()
    setAllNotifications(dbNotifications)
    setUnreadCount(dbNotifications.filter(n => !n.isRead).length)
    setLoading(false)
  }

  const handleAcceptFriendRequest = async (notificationId: string) => {
    if (!user?.userId) return
    
    try {
      console.log('Accepting friend request:', notificationId)
      
      // Find the notification to get invitation details
      const notification = allNotifications.find(n => n.id === notificationId)
      if (!notification || !notification.inviterId) {
        console.error('Notification or inviter ID not found')
        return
      }

      // Extract invitation ID from notification ID
      const invitationId = notificationId.replace('invitation-', '')

      // Update invitation status to 'accepted' in database
      if (client.models.Invitation) {
        await client.models.Invitation.update({
          id: invitationId,
          status: 'accepted'
        })
      }

      // Create connection between users if Connections model is available
      if (client.models.Connections) {
        await client.models.Connections.create({
          inviterId: notification.inviterId,
          friendId: user.userId
        })
      }

      console.log('Friend request accepted and connection created')
      
      // Refresh notifications to remove the accepted request
      await refreshNotifications()
      
    } catch (error) {
      console.error('Error accepting friend request:', error)
    }
  }

  const handleDeleteFriendRequest = async (notificationId: string) => {
    try {
      console.log('Deleting friend request:', notificationId)
      
      // Extract invitation ID from notification ID
      const invitationId = notificationId.replace('invitation-', '')

      // Update invitation status to 'declined' in database
      if (client.models.Invitation) {
        await client.models.Invitation.update({
          id: invitationId,
          status: 'declined'
        })
      }

      console.log('Friend request declined')
      
      // Refresh notifications to remove the declined request
      await refreshNotifications()
      
    } catch (error) {
      console.error('Error deleting friend request:', error)
    }
  }

  return (
    <Dropdown as="li" autoClose="outside" className="nav-item ms-2" drop="down" align="end">
      <DropdownToggle className="content-none nav-link bg-light icon-md btn btn-light p-0">
        {unreadCount > 0 && <span className="badge-notif animation-blink" />}
        <BsBellFill size={15} />
        {unreadCount > 0 && <span className="badge bg-danger rounded-pill ms-1">{unreadCount}</span>}
      </DropdownToggle>
      <DropdownMenu className="dropdown-animation dropdown-menu-end dropdown-menu-size-md p-0 shadow-lg border-0">
        <Card>
          <CardHeader className="d-flex justify-content-between align-items-center">
            <h6 className="m-0">
              Notifications {unreadCount > 0 && <span className="badge bg-danger bg-opacity-10 text-danger ms-2">{unreadCount} new</span>}
            </h6>
            <div className="d-flex gap-2">
              <button 
                className="btn btn-sm btn-outline-primary" 
                onClick={refreshNotifications}
                disabled={loading}
                title="Refresh notifications"
              >
                {loading ? '⏳' : '🔄'}
              </button>
              <Link className="small" to="">
                Clear all
              </Link>
            </div>
          </CardHeader>
          <CardBody className="p-0">
            {loading ? (
              <div className="p-3 text-center">
                <p className="text-muted">Loading notifications...</p>
              </div>
            ) : allNotifications.length === 0 ? (
              <div className="p-3 text-center">
                <p className="text-muted">No notifications</p>
              </div>
            ) : (
              <div className="list-group list-group-flush">
                {allNotifications.slice(0, 4).map((notification) => (
                  <div
                    key={notification.id}
                    className={clsx(
                      'list-group-item list-group-item-action d-flex justify-content-between align-items-start',
                      !notification.isRead && 'list-group-item-primary'
                    )}
                  >
                    <div className="d-flex">
                      <div className="me-3 avatar">
                        {notification.avatar ? (
                          <img
                            className="avatar-img rounded-circle"
                            src={notification.avatar}
                            alt={notification.inviterName || 'User'}
                            style={{ width: '40px', height: '40px', objectFit: 'cover' }}
                            onError={(e) => {
                              console.warn('Failed to load notification avatar:', notification.avatar);
                              // Replace with initials fallback
                              const target = e.target as HTMLImageElement;
                              const parent = target.parentElement;
                              if (parent) {
                                parent.innerHTML = `
                                  <div class="avatar-img rounded-circle bg-primary text-white d-flex align-items-center justify-content-center" style="width: 40px; height: 40px; fontSize: 14px; font-weight: bold;">
                                    ${notification.inviterName ? notification.inviterName.charAt(0).toUpperCase() : 'U'}
                                  </div>
                                `;
                              }
                            }}
                            onLoad={() => {
                              console.log('Successfully loaded notification avatar for:', notification.inviterName);
                            }}
                          />
                        ) : (
                          <div 
                            className="avatar-img rounded-circle bg-primary text-white d-flex align-items-center justify-content-center"
                            style={{ width: '40px', height: '40px', fontSize: '14px', fontWeight: 'bold' }}
                          >
                            {notification.inviterName ? notification.inviterName.charAt(0).toUpperCase() : 'U'}
                          </div>
                        )}
                      </div>
                      <div className="flex-grow-1">
                        <h6 className="list-group-item-heading mb-1 fs-6">
                          {notification.title}
                        </h6>
                        <p className="list-group-item-text mb-1 small text-muted">
                          {notification.description}
                        </p>
                        <small className="text-muted">{timeSince(notification.time)}</small>
                      </div>
                    </div>
                    {notification.isFriendRequest && (
                      <div className="ms-2 d-flex flex-column gap-1">
                        <Button
                          variant="success"
                          size="sm"
                          onClick={() => handleAcceptFriendRequest(notification.id)}
                          className="btn-sm px-2 py-1"
                          style={{ fontSize: '12px' }}
                        >
                          Accept
                        </Button>
                        <Button
                          variant="outline-secondary"
                          size="sm"
                          onClick={() => handleDeleteFriendRequest(notification.id)}
                          className="btn-sm px-2 py-1"
                          style={{ fontSize: '12px' }}
                        >
                          Decline
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardBody>
          {allNotifications.length > 4 && (
            <CardFooter className="text-center">
              <Link className="btn btn-sm btn-primary-soft" to="">
                View all notifications
              </Link>
            </CardFooter>
          )}
        </Card>
      </DropdownMenu>
    </Dropdown>
  )
}

export default NotificationDropdown
