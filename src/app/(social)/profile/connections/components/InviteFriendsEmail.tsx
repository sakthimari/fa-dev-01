import { useState } from 'react';
import { Button, Form, Modal, Alert } from 'react-bootstrap';
import { BsPersonPlus } from 'react-icons/bs';
import { EmailInvitationService } from '../../../../../services/EmailInvitationService';

const InviteFriendsEmail = () => {
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [isInviting, setIsInviting] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState<'success' | 'error'>('success');
  const [showAlert, setShowAlert] = useState(false);
  const [showEmailClientOption, setShowEmailClientOption] = useState(false);

  const handleSendInvitation = async (useEmailClient: boolean = false) => {
    if (!email.trim()) {
      return;
    }

    // Validate email format
    if (!EmailInvitationService.isValidEmail(email)) {
      setAlertMessage('Please enter a valid email address');
      setAlertType('error');
      setShowAlert(true);
      return;
    }

    setIsInviting(true);
    setShowAlert(false);
    setShowEmailClientOption(false);
    
    try {
      // Create personalized invitation message
      const personalMessage = message || `Hi${name ? ` ${name}` : ''}! I'd like to invite you to join our social network. Connect with me and discover new content!`;
      
      const result = useEmailClient 
        ? await EmailInvitationService.sendInvitationWithEmailClient({
            recipientEmail: email,
            recipientName: name || undefined,
            inviteMessage: personalMessage
          })
        : await EmailInvitationService.sendInvitation({
            recipientEmail: email,
            recipientName: name || undefined,
            inviteMessage: personalMessage
          });
      
      if (result.success) {
        setAlertMessage(result.message);
        setAlertType('success');
        setShowAlert(true);
        setTimeout(() => {
          setEmail('');
          setName('');
          setMessage('');
          setShowInviteModal(false);
          setShowAlert(false);
          setShowEmailClientOption(false);
        }, 4000);
      } else {
        // Check if it's a permission error that can be resolved with email client
        if (result.error?.includes('Permission Error') || result.error?.includes('not authorized')) {
          setAlertMessage(result.error);
          setAlertType('error');
          setShowAlert(true);
          setShowEmailClientOption(true);
        } else {
          setAlertMessage(result.error || 'Failed to send invitation. Please try again.');
          setAlertType('error');
          setShowAlert(true);
        }
      }
    } catch (error) {
      setAlertMessage('An unexpected error occurred. Please try again.');
      setAlertType('error');
      setShowAlert(true);
    } finally {
      setIsInviting(false);
    }
  };

  return (
    <>
      {/* Invite Button */}
      <Button 
        variant="primary" 
        size="sm"
        onClick={() => setShowInviteModal(true)}
        className="d-flex align-items-center"
      >
        <BsPersonPlus className="me-2" />
        Invite Friends
      </Button>

      {/* Invite Modal */}
      <Modal show={showInviteModal} onHide={() => setShowInviteModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>
            <BsPersonPlus className="me-2" />
            Invite Friend
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {showAlert && (
            <Alert variant={alertType === 'success' ? 'success' : 'danger'} className="mb-3">
              {alertMessage}
            </Alert>
          )}
          
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Friend's Name (Optional)</Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter friend's name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Email Address *</Form.Label>
              <Form.Control
                type="email"
                placeholder="Enter friend's email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Personal Message (Optional)</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                placeholder="Add a personal message to your invitation..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
              <Form.Text className="text-muted">
                This message will be included in the email invitation sent to your friend.
              </Form.Text>
            </Form.Group>
            
            <div className="bg-info bg-opacity-10 p-3 rounded mb-3">
              <small className="text-info">
                <strong>How it works:</strong> An email invitation will be sent to your friend with options to accept or decline your connection request. If they accept, you'll be connected!
              </small>
            </div>
            
            <div className="bg-light p-3 rounded">
              <h6 className="mb-2">Email Preview:</h6>
              <p className="mb-1 small"><strong>Subject:</strong> You've been invited to connect</p>
              <p className="mb-0 small text-muted">
                <strong>Message:</strong> {message || `Hi${name ? ` ${name}` : ''}! I'd like to invite you to join our social network. Connect with me and discover new content!`}
              </p>
            </div>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowInviteModal(false)}>
            Cancel
          </Button>
          
          {showEmailClientOption && (
            <Button 
              variant="outline-primary" 
              onClick={() => handleSendInvitation(true)}
              disabled={isInviting || !email.trim()}
              className="me-2"
            >
              <i className="fas fa-envelope me-2"></i>
              Use Email Client
            </Button>
          )}
          
          <Button 
            variant="primary" 
            onClick={() => handleSendInvitation(false)}
            disabled={isInviting || !email.trim()}
          >
            {isInviting ? (
              <>
                <div className="spinner-border spinner-border-sm me-2" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                Sending...
              </>
            ) : (
              <>
                <BsPersonPlus className="me-2" />
                Send Invitation
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default InviteFriendsEmail;
