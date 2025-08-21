import { useState } from 'react'
import { timeSince } from '@/utils/date'
import clsx from 'clsx'

import { Link } from 'react-router-dom'
import { Button, Card, CardBody, CardFooter, CardHeader, Dropdown, DropdownMenu, DropdownToggle } from 'react-bootstrap'
import { BsBellFill } from 'react-icons/bs'

const NotificationDropdown = () => {
  // Get notification directly from localStorage, regardless of user authentication
  const getNotificationFromStorage = () => {
    try {
      const tulasiNotification = localStorage.getItem('notifications_tulasi')
      if (tulasiNotification) {
        return JSON.parse(tulasiNotification)
      }
      return []
    } catch (error) {
      console.error('Error reading notification from storage:', error)
      return []
    }
  }

  const [allNotifications] = useState(getNotificationFromStorage())
  const [unreadCount] = useState(getNotificationFromStorage().length)

  const handleAcceptFriendRequest = async (notificationId: string) => {
    console.log('Friend request accepted:', notificationId)
    // Remove notification from localStorage
    const updatedNotifications = allNotifications.filter(n => n.id !== notificationId)
    localStorage.setItem('notifications_tulasi', JSON.stringify(updatedNotifications))
    // Refresh page to update the UI
    window.location.reload()
  }

  const handleDeleteFriendRequest = async (notificationId: string) => {
    console.log('Friend request deleted:', notificationId)
    // Remove notification from localStorage
    const updatedNotifications = allNotifications.filter(n => n.id !== notificationId)
    localStorage.setItem('notifications_tulasi', JSON.stringify(updatedNotifications))
    // Refresh page to update the UI
    window.location.reload()
  }

  return (
    <Dropdown as="li" autoClose="outside" className="nav-item ms-2" drop="down" align="end">
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
            {allNotifications.length === 0 ? (
              <div className="p-3 text-center">
                <p className="text-muted">No notifications</p>
              </div>
            ) : (
              <ul className="list-group list-group-flush list-unstyled p-2">
                {allNotifications.slice(0, 4).map((notification, idx) => (
                  <li key={notification.id || idx}>
                    <div className={clsx('rounded d-sm-flex border-0 mb-1 p-3 position-relative', { 'badge-unread': !notification.isRead })}>
                      <div className="avatar text-center">
                        {notification.avatar ? (
                          <img 
                            className="avatar-img rounded-circle" 
                            src={notification.avatar} 
                            alt={notification.inviterName || 'User'} 
                          />
                        ) : (
                          <div className="avatar-img rounded-circle bg-primary d-flex align-items-center justify-content-center">
                            <span className="text-white fw-bold">
                              {notification.inviterName?.charAt(0).toUpperCase() || '?'}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="mx-sm-3 my-2 my-sm-0">
                        <p className={clsx('small', notification.description ? 'mb-0' : 'mb-2')}>{notification.title}</p>
                        {notification.description && <p className="small text-muted">{notification.description}</p>}
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
            )}
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
