import { useState } from 'react'
import { Button, Card, Alert } from 'react-bootstrap'
import { getCurrentUser } from 'aws-amplify/auth'
import { NotificationService } from '@/services/NotificationService'
import { ConnectionService } from '@/services/ConnectionService'

const DebugInvitations = () => {
  const [output, setOutput] = useState<string[]>([])
  const [currentUser, setCurrentUser] = useState<any>(null)

  const log = (message: string) => {
    console.log(message)
    setOutput(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`])
  }

  const testCurrentUser = async () => {
    try {
      const user = await getCurrentUser()
      setCurrentUser(user)
      log(`Current user: ${user.userId} (${user.username})`)
    } catch (error) {
      log(`No current user: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const testCreateNotification = async () => {
    if (!currentUser) {
      log('Need to get current user first')
      return
    }

    try {
      const result = await NotificationService.createFriendRequestNotification(
        currentUser.userId,
        'Arya (Test)',
        undefined
      )
      log(`Notification created: ${JSON.stringify(result)}`)
      
      const notifications = NotificationService.getUserNotifications(currentUser.userId)
      log(`Total notifications for user: ${notifications.length}`)
      notifications.forEach((notif, index) => {
        log(`  ${index + 1}. ${notif.title} (${notif.isFriendRequest ? 'Friend Request' : 'Regular'})`)
      })
    } catch (error) {
      log(`Error creating notification: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const testConnectionService = async () => {
    if (!currentUser) {
      log('Need to get current user first')
      return
    }

    try {
      await ConnectionService.handleRegistration(currentUser.username, currentUser.userId)
      log('ConnectionService.handleRegistration completed')
    } catch (error) {
      log(`Error in ConnectionService: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const simulateInvitationFlow = async () => {
    if (!currentUser) {
      log('Need to get current user first')
      return
    }

    try {
      // Simulate invitation context
      const invitationContext = {
        inviterName: 'Arya',
        recipientName: 'Current User',
        timestamp: Date.now()
      }
      
      localStorage.setItem('pendingInvitationContext', JSON.stringify(invitationContext))
      log('Stored invitation context in localStorage')
      
      // Test the full flow
      await ConnectionService.handleRegistration(currentUser.username, currentUser.userId)
      
      // Force create notification
      const result = await NotificationService.createFriendRequestNotification(
        currentUser.userId,
        'Arya'
      )
      log(`Force-created notification: ${JSON.stringify(result)}`)
      
      // Check results
      const notifications = NotificationService.getUserNotifications(currentUser.userId)
      log(`User now has ${notifications.length} notifications`)
      
    } catch (error) {
      log(`Error in simulation: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const clearLocalStorage = () => {
    localStorage.removeItem('pendingInvitationContext')
    if (currentUser) {
      localStorage.removeItem(`notifications_${currentUser.userId}`)
    }
    log('Cleared localStorage')
  }

  return (
    <div className="container mt-4">
      <Card>
        <Card.Header>
          <h4>🔍 Debug Invitation System</h4>
        </Card.Header>
        <Card.Body>
          <div className="d-flex gap-2 mb-3 flex-wrap">
            <Button variant="primary" onClick={testCurrentUser}>
              Get Current User
            </Button>
            <Button variant="success" onClick={testCreateNotification} disabled={!currentUser}>
              Test Create Notification
            </Button>
            <Button variant="warning" onClick={testConnectionService} disabled={!currentUser}>
              Test Connection Service
            </Button>
            <Button variant="info" onClick={simulateInvitationFlow} disabled={!currentUser}>
              Simulate Full Flow
            </Button>
            <Button variant="danger" onClick={clearLocalStorage}>
              Clear LocalStorage
            </Button>
          </div>

          {currentUser && (
            <Alert variant="info">
              <strong>Current User:</strong> {currentUser.userId} ({currentUser.username})
            </Alert>
          )}

          <Card className="bg-dark text-light">
            <Card.Header>Console Output</Card.Header>
            <Card.Body style={{ maxHeight: '400px', overflowY: 'auto' }}>
              <pre style={{ fontSize: '12px', margin: 0 }}>
                {output.length === 0 ? 'Click buttons above to start debugging...' : output.join('\n')}
              </pre>
            </Card.Body>
          </Card>
        </Card.Body>
      </Card>
    </div>
  )
}

export default DebugInvitations
