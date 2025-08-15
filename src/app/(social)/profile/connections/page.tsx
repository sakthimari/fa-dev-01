import { getAllUserConnections } from '@/helpers/data'
import clsx from 'clsx'
import { useState, useEffect } from 'react'

import { Button, Card, CardBody, CardHeader, CardTitle } from 'react-bootstrap'
import LoadMoreButton from './components/LoadMoreButton'
import { Link } from 'react-router-dom'
import PageMetaData from '@/components/PageMetaData'
import { useFetchData } from '@/hooks/useFetchData'
import InviteFriendsEmail from './components/InviteFriendsEmail'
import { EmailInvitationService, type PendingInvitation } from '@/services/EmailInvitationService'

const Connections =  () => {
  const allConnections = useFetchData(getAllUserConnections)
  const [sentRequests, setSentRequests] = useState<PendingInvitation[]>([])

  // Load pending invitations on component mount and set up refresh interval
  useEffect(() => {
    const loadPendingInvitations = () => {
      const pendingInvitations = EmailInvitationService.getPendingInvitations()
      setSentRequests(pendingInvitations)
    }

    // Load initially
    loadPendingInvitations()

    // Set up interval to check for new invitations every 2 seconds
    const interval = setInterval(loadPendingInvitations, 2000)

    // Cleanup interval on unmount
    return () => clearInterval(interval)
  }, [])

  const handleCancelRequest = (requestId: string, userName: string) => {
    // Remove from localStorage
    EmailInvitationService.removePendingInvitation(requestId)
    // Update local state immediately
    setSentRequests(prevRequests => 
      prevRequests.filter(request => request.id !== requestId)
    )
    console.log(`Cancelled invitation to ${userName}`)
  }

  const handleSendMessage = (userName: string) => {
    // Here you would typically open a message modal or navigate to chat
    console.log(`Send message to ${userName}`)
  }

  const formatTimeAgo = (dateString: string) => {
    const now = new Date()
    const sent = new Date(dateString)
    const diffInMinutes = Math.floor((now.getTime() - sent.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes} minutes ago`
    } else if (diffInMinutes < 1440) {
      const hours = Math.floor(diffInMinutes / 60)
      return `${hours} hour${hours > 1 ? 's' : ''} ago`
    } else {
      const days = Math.floor(diffInMinutes / 1440)
      return `${days} day${days > 1 ? 's' : ''} ago`
    }
  }

  // Manual refresh function
  const refreshInvitations = () => {
    const pendingInvitations = EmailInvitationService.getPendingInvitations()
    setSentRequests(pendingInvitations)
  }
  const getLetterAvatar = (name: string, email: string) => {
    const displayName = name || email.split('@')[0]
    const initials = displayName
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)
    
    // Generate a consistent color based on the email
    const colors = [
      '#007bff', '#6610f2', '#6f42c1', '#e83e8c', '#dc3545',
      '#fd7e14', '#ffc107', '#28a745', '#20c997', '#17a2b8'
    ]
    const colorIndex = email.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length
    
    return {
      initials,
      backgroundColor: colors[colorIndex]
    }
  }
  return (
    <>
    <PageMetaData title='Connections'/>
    
    {/* Sent Friend Requests Section */}
    <Card>
      <CardHeader className="border-0 pb-0">
        <div className="d-flex justify-content-between align-items-center">
          <CardTitle className="mb-0">
            Email Invitations 
            {sentRequests.length > 0 && (
              <span className="badge bg-primary ms-2">{sentRequests.length}</span>
            )}
          </CardTitle>
          <Button 
            variant="outline-primary" 
            size="sm" 
            onClick={refreshInvitations}
            className="d-flex align-items-center"
          >
            <i className="fas fa-sync-alt me-1"></i>
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardBody>
        {sentRequests.length > 0 ? (
          sentRequests.map((request) => {
            const letterAvatar = getLetterAvatar(request.recipientName || '', request.recipientEmail)
            return (
              <div className="d-md-flex align-items-center mb-4" key={request.id}>
                <div className="avatar me-3 mb-3 mb-md-0">
                  <span role="button">
                    <div 
                      className="avatar-img rounded-circle d-flex align-items-center justify-content-center text-white fw-bold"
                      style={{
                        backgroundColor: letterAvatar.backgroundColor,
                        width: '40px',
                        height: '40px',
                        fontSize: '16px'
                      }}
                    >
                      {letterAvatar.initials}
                    </div>
                  </span>
                </div>
                <div className="w-100">
                  <div className="d-sm-flex align-items-start">
                    <h6 className="mb-0">
                      <Link to="">{request.recipientName || request.recipientEmail}</Link>
                    </h6>
                    <p className="small ms-sm-2 mb-0">Email Invitation</p>
                  </div>
                  <div className="d-flex align-items-center mt-1">
                    <span className="badge bg-warning text-dark me-2">
                      <i className="fas fa-clock me-1"></i>
                      Pending Registration
                    </span>
                    <small className="text-muted">Sent {formatTimeAgo(request.sentAt)}</small>
                  </div>
                  {request.inviteMessage && (
                    <small className="text-muted d-block mt-1">
                      Message: "{request.inviteMessage}"
                    </small>
                  )}
                </div>
                <div className="ms-md-auto d-flex">
                  <Button 
                    variant="danger-soft" 
                    size="sm" 
                    className="mb-0 me-2"
                    onClick={() => handleCancelRequest(request.id, request.recipientName || request.recipientEmail)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    variant="primary-soft" 
                    size="sm" 
                    className="mb-0"
                    onClick={() => handleSendMessage(request.recipientName || request.recipientEmail)}
                  >
                    Resend
                  </Button>
                </div>
              </div>
            )
          })
        ) : (
          <div className="text-center py-4">
            <div className="mb-3">
              <i className="fas fa-envelope fa-3x text-muted"></i>
            </div>
            <p className="text-muted mb-1">No pending email invitations</p>
            <small className="text-muted">Email invitations you've sent will appear here until recipients register</small>
          </div>
        )}
      </CardBody>
    </Card>

    {/* Connections Section */}
    <Card className="mt-4">
      <CardHeader className="border-0 pb-0">
        <div className="d-flex justify-content-between align-items-center">
          <CardTitle className="mb-0">Connections</CardTitle>
          <InviteFriendsEmail />
        </div>
      </CardHeader>
      <CardBody>
        {allConnections?.map((connection, idx) => (
          <div className="d-md-flex align-items-center mb-4" key={idx}>
            <div className="avatar me-3 mb-3 mb-md-0">
              {connection.user?.avatar && (
                <span role="button">
                  
                  <img className="avatar-img rounded-circle" src={connection.user.avatar} alt="" />
                </span>
              )}
            </div>
            <div className="w-100">
              <div className="d-sm-flex align-items-start">
                <h6 className="mb-0">
                  <Link to="">{connection.user?.name}</Link>
                </h6>
                <p className="small ms-sm-2 mb-0">{connection.role}</p>
              </div>
              <ul className="avatar-group mt-1 list-unstyled align-items-sm-center">
                {connection?.sharedConnectionAvatars && (
                  <>
                    {connection.sharedConnectionAvatars.map((avatar, idx) => (
                      <li className="avatar avatar-xxs" key={idx}>
                        <img className="avatar-img rounded-circle" src={avatar} alt="avatar" />
                      </li>
                    ))}
                    <li className="avatar avatar-xxs">
                      <div className="avatar-img rounded-circle bg-primary">
                        <span className="smaller text-white position-absolute top-50 start-50 translate-middle">
                          +{Math.floor(Math.random() * 10)}
                        </span>
                      </div>
                    </li>
                  </>
                )}
                <li className={clsx('small', { 'ms-3': connection.sharedConnectionAvatars })}>{connection.description}</li>
              </ul>
            </div>
            <div className="ms-md-auto d-flex">
              <Button variant="danger-soft" size="sm" className="mb-0 me-2">
                
                Remove
              </Button>
              <Button variant="primary-soft" size="sm" className="mb-0">
                
                Message
              </Button>
            </div>
          </div>
        ))}
        <div className="d-grid">
          <LoadMoreButton />
        </div>
      </CardBody>
    </Card>
    </>
  )
}
export default Connections
