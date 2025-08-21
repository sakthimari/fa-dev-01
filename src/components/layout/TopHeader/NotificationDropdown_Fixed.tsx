import { useState, useEffect } from 'react'
import { timeSince } from '@/utils/date'
import clsx from 'clsx'

import { Link } from 'react-router-dom'
import { Button, Card, CardBody, CardFooter, CardHeader, Dropdown, DropdownMenu, DropdownToggle } from 'react-bootstrap'
import { BsBellFill } from 'react-icons/bs'
import { useAuth } from '@/context/AuthProvider'
import { NotificationService } from '@/services/NotificationService'
import { ProfilePhotoService } from '@/services/ProfilePhotoService'
import type { NotificationType } from '@/types/data'

const NotificationDropdown = () => {
  const { user } = useAuth()
  const [userNotifications, setUserNotifications] = useState<NotificationType[]>([])
  const [allNotifications, setAllNotifications] = useState<NotificationType[]>([])
  const [unreadCount, setUnreadCount] = useState(0)

  // Function to refresh notifications
  const refreshNotifications = () => {
    if (user?.userId) {
      const notifications = NotificationService.getUserNotifications(user.userId)
      setUserNotifications(notifications)
      const count = NotificationService.getUnreadCount(user.userId)
      setUnreadCount(count)
    }
  }

  // Load user-specific notifications
  useEffect(() => {
    refreshNotifications()
  }, [user?.userId])

  // Refresh notifications when dropdown is opened
  const handleDropdownToggle = (isOpen: boolean) => {
    if (isOpen) {
      refreshNotifications()
    }
  }

  // Use only user notifications
  useEffect(() => {
    const combined = [...userNotifications]
    // Sort by time, newest first
    combined.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
    setAllNotifications(combined)
  }, [userNotifications])

  const handleAcceptFriendRequest = async (notificationId: string) => {
    if (!user?.userId) return
    
    try {
      // Get the notification to extract connection data
      const notification = allNotifications.find(n => n.id === notificationId)
      if (!notification) return
      
      // Create connection between users if inviter ID is available
      if (notification.inviterId) {
        const { ConnectionService } = await import('@/services/ConnectionService')
        const connectionResult = await ConnectionService.createConnection(user.userId, notification.inviterId, notification.inviterName || 'Unknown User')
        
        if (connectionResult.success) {
          console.log('Connection created successfully between users')
        } else {
          console.error('Failed to create connection:', connectionResult.error)
        }
      } else {
        console.warn('No inviter ID found in notification, cannot create connection')
      }
      
      // Delete the notification
      await NotificationService.deleteNotification(user.userId, notificationId)
      
      // Refresh notifications
      refreshNotifications()
      
      console.log('Friend request accepted')
    } catch (error) {
      console.error('Error accepting friend request:', error)
    }
  }

  const handleDeleteFriendRequest = async (notificationId: string) => {
    if (!user?.userId) return
    
    try {
      await NotificationService.deleteNotification(user.userId, notificationId)
      
      // Refresh notifications
      refreshNotifications()
      
      console.log('Friend request deleted')
    } catch (error) {
      console.error('Error deleting friend request:', error)
    }
  }

  return (
    <Dropdown as="li" autoClose="outside" className="nav-item ms-2" drop="down" align="end" onToggle={handleDropdownToggle}>
      <DropdownToggle className="content-none nav-link bg-light icon-md btn btn-light p-0">
        <span className="badge-notif animation-blink" />
        <BsBellFill size={15} />
      </DropdownToggle>
      <DropdownMenu className="dropdown-animation dropdown-menu-end dropdown-menu-size-md p-0 shadow-lg border-0">
        <Card>
          <CardHeader className="d-flex justify-content-between align-items-center">
            <h6 className="m-0">
              Notifications {unreadCount > 0 && <span className="badge bg-danger bg-opacity-10 text-danger ms-2">{unreadCount} new</span>}
            </h6>
            <Link className="small" to="">
              Clear all
            </Link>
          </CardHeader>
          <CardBody className="p-0">
            <ul className="list-group list-group-flush list-unstyled p-2">
              {allNotifications?.slice(0, 4).map((notification, idx) => (
                <li key={notification.id || idx}>
                  <div className={clsx('rounded d-sm-flex border-0 mb-1 p-3 position-relative', { 'badge-unread': !notification.isRead })}>
                    <div className="avatar text-center">
                      <img 
                        className="avatar-img rounded-circle" 
                        src={ProfilePhotoService.getProfilePhotoWithFallback(
                          notification.inviterId || 'unknown',
                          notification.inviterName || 'User',
                          notification.avatar
                        )}
                        alt={notification.inviterName || 'User'}
                        onError={(e) => {
                          // If the image fails to load, use the generated fallback
                          const fallbackUrl = ProfilePhotoService.getProfilePhotoWithFallback(
                            notification.inviterId || 'unknown',
                            notification.inviterName || 'User',
                            null // Force fallback
                          );
                          e.currentTarget.src = fallbackUrl;
                        }}
                      />
                    </div>
                    <div className="mx-sm-3 my-2 my-sm-0">
                      <p className={clsx('small', notification.description ? 'mb-0' : 'mb-2')}>{notification.title}</p>
                      {notification.description && notification.description}
                      {notification.isFriendRequest && (
                        <div className="d-flex">
                          <Button 
                            variant="primary" 
                            size="sm" 
                            className="py-1 me-2"
                            onClick={() => handleAcceptFriendRequest(notification.id)}
                          >
                            Accept
                          </Button>
                          <Button 
                            variant="danger-soft" 
                            size="sm" 
                            className="py-1"
                            onClick={() => handleDeleteFriendRequest(notification.id)}
                          >
                            Delete
                          </Button>
                        </div>
                      )}
                    </div>
                    <p className="small text-nowrap">{timeSince(notification.time).slice(0, 5)}</p>
                  </div>
                </li>
              ))}
            </ul>
          </CardBody>
          <CardFooter className="text-center">
            <Button variant="primary-soft" size="sm">
              See all incoming activity
            </Button>
          </CardFooter>
        </Card>
      </DropdownMenu>
    </Dropdown>
  )
}

export default NotificationDropdown
