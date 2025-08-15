import { useState } from 'react';
import { Button, Form, Modal, Alert } from 'react-bootstrap';
import { BsPersonPlus, BsEnvelope } from 'react-icons/bs';
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

  const handleSendInvitation = async () => {
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
    
    try {
      // Create personalized invitation message
      const personalMessage = message || `Hi${name ? ` ${name}` : ''}! I'd like to invite you to join our social network. Connect with me and discover new content!`;
      
      const result = await EmailInvitationService.sendInvitation({
        recipientEmail: email,
        inviteMessage: personalMessage
      });

      if (result.success) {
        setAlertMessage(`Invitation sent successfully to ${email}!`);
        setAlertType('success');
        setShowAlert(true);
        
        // Reset form and close modal after short delay
        setTimeout(() => {
          setEmail('');
          setName('');
          setMessage('');
          setShowInviteModal(false);
          setShowAlert(false);
        }, 2000);
      } else {
        setAlertMessage(result.error || 'Failed to send invitation. Please try again.');
        setAlertType('error');
        setShowAlert(true);
      }
      
    } catch (error) {
      console.error('Failed to send invitation:', error);
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
                This message will be included in the invitation email.
              </Form.Text>
            </Form.Group>
            <div className="bg-light p-3 rounded">
              <h6 className="mb-2">Preview:</h6>
              <p className="mb-0 small text-muted">
                {message || `Hi${name ? ` ${name}` : ''}! I'd like to invite you to join our social network. Connect with me and discover new content!`}
              </p>
            </div>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowInviteModal(false)}>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={handleSendInvitation}
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
                <BsEnvelope className="me-2" />
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
