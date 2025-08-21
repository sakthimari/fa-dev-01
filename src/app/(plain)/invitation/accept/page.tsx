import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, Alert, Button, Spinner } from 'react-bootstrap';
import { EmailInvitationService } from '@/services/EmailInvitationService';
import { useAuth } from '@/context/AuthProvider';
import { BsCheckCircle, BsXCircle, BsPersonPlus, BsBoxArrowInRight, BsInfoCircle } from 'react-icons/bs';
import { InvitationDebug } from '@/utils/InvitationDebug';

const PublicInvitationAcceptPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [invitation, setInvitation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<{ success?: boolean; message?: string }>({});
  const [debugInfo, setDebugInfo] = useState<string>('');

  const invitationId = searchParams.get('id');

  useEffect(() => {
    // Add debug logging
    InvitationDebug.logAllInvitations();
    
    if (invitationId) {
      loadInvitation();
    } else {
      setLoading(false);
      setDebugInfo('No invitation ID provided in URL');
    }
  }, [invitationId]);

  // If user is authenticated, redirect to the social invitation page
  useEffect(() => {
    if (isAuthenticated && invitation) {
      navigate(`/invitation/accept?id=${invitationId}`);
    }
  }, [isAuthenticated, invitation, invitationId, navigate]);

  const loadInvitation = async () => {
    try {
      setDebugInfo(`Searching for invitation ID: ${invitationId}`);
      const inv = await EmailInvitationService.getInvitationById(invitationId!);
      
      if (inv) {
        setInvitation(inv);
        setDebugInfo(`Invitation found: ${inv.recipientEmail} from ${inv.inviterName}`);
      } else {
        setDebugInfo(`Invitation not found. Checked localStorage and database.`);
        console.log('Invitation lookup failed for ID:', invitationId);
        // Don't set invitation to null immediately - we'll handle this in the UI
      }
    } catch (error) {
      console.error('Error loading invitation:', error);
      setDebugInfo(`Error loading invitation: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = () => {
    // Store invitation ID in localStorage so we can process it after registration
    localStorage.setItem('pendingInvitationId', invitationId!);
    navigate('/modern-auth/sign-up');
  };

  const handleSignIn = () => {
    // Store invitation ID in localStorage so we can process it after sign-in
    localStorage.setItem('pendingInvitationId', invitationId!);
    navigate('/modern-auth/sign-in');
  };

  if (loading) {
    return (
      <div className="container mt-5">
        <div className="row justify-content-center">
          <div className="col-md-8 col-lg-6">
            <Card className="shadow">
              <Card.Body className="text-center py-5">
                <Spinner animation="border" />
                <p className="mt-3">Loading invitation...</p>
              </Card.Body>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (!invitationId) {
    return (
      <div className="container mt-5">
        <div className="row justify-content-center">
          <div className="col-md-8 col-lg-6">
            <Card className="shadow">
              <Card.Body className="text-center py-5">
                <BsXCircle className="text-danger" size={64} />
                <h3 className="mt-3">Missing Invitation ID</h3>
                <p className="text-muted mb-4">This invitation link is missing required information.</p>
                <Button variant="primary" onClick={() => navigate('/')}>
                  Go to Home
                </Button>
              </Card.Body>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Show invitation not found but allow user to continue
  if (!loading && !invitation) {
    return (
      <div className="container mt-5">
        <div className="row justify-content-center">
          <div className="col-md-8 col-lg-6">
            <Card className="shadow">
              <Card.Header className="bg-warning text-dark text-center">
                <h2 className="mb-0">Invitation Link Issue</h2>
              </Card.Header>
              <Card.Body className="p-4">
                <div className="text-center mb-4">
                  <div className="bg-light rounded-circle d-inline-flex align-items-center justify-content-center" 
                       style={{ width: '80px', height: '80px' }}>
                    <BsInfoCircle size={36} className="text-warning" />
                  </div>
                </div>

                <Alert variant="warning" className="mb-4">
                  <h6 className="fw-bold mb-2">Invitation Not Found</h6>
                  <p className="mb-0">
                    We couldn't find the specific invitation details, but you can still join our platform!
                  </p>
                </Alert>

                <div className="bg-info bg-opacity-10 p-3 rounded mb-4">
                  <h6 className="text-info mb-2">
                    <BsCheckCircle className="me-2" />
                    No Problem!
                  </h6>
                  <p className="mb-0 small">
                    Someone wanted to invite you to join our social network. Create your account below and start connecting with friends!
                  </p>
                </div>

                <div className="text-center">
                  <h6 className="mb-3">Choose an option to continue:</h6>
                  
                  <div className="d-grid gap-3">
                    <Button
                      variant="success"
                      size="lg"
                      onClick={handleSignUp}
                      className="d-flex align-items-center justify-content-center"
                    >
                      <BsPersonPlus className="me-2" />
                      Create New Account
                    </Button>
                    
                    <Button
                      variant="outline-primary"
                      size="lg"
                      onClick={handleSignIn}
                      className="d-flex align-items-center justify-content-center"
                    >
                      <BsBoxArrowInRight className="me-2" />
                      Sign In to Existing Account
                    </Button>
                  </div>

                  <div className="mt-4 pt-3 border-top">
                    <small className="text-muted">
                      Join our community and start connecting with friends!
                    </small>
                  </div>

                  {process.env.NODE_ENV === 'development' && (
                    <Alert variant="light" className="mt-3 text-start">
                      <h6>Debug Info:</h6>
                      <small className="text-muted">
                        Invitation ID: {invitationId}<br/>
                        Status: {debugInfo}
                      </small>
                    </Alert>
                  )}
                </div>
              </Card.Body>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (result.success) {
    return (
      <div className="container mt-5">
        <div className="row justify-content-center">
          <div className="col-md-8 col-lg-6">
            <Card className="shadow">
              <Card.Body className="text-center py-5">
                <BsCheckCircle className="text-success" size={64} />
                <h3 className="mt-3 text-success">Invitation Accepted!</h3>
                <p className="text-muted mb-4">{result.message}</p>
                <Button variant="success" onClick={() => navigate('/profile/connections')}>
                  View Connections
                </Button>
              </Card.Body>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-8 col-lg-6">
          <Card className="shadow">
            <Card.Header className="bg-primary text-white text-center">
              <h2 className="mb-0">You've Been Invited!</h2>
            </Card.Header>
            <Card.Body className="p-4">
              <div className="text-center mb-4">
                <div className="bg-light rounded-circle d-inline-flex align-items-center justify-content-center" 
                     style={{ width: '80px', height: '80px' }}>
                  <BsPersonPlus size={36} className="text-primary" />
                </div>
              </div>

              <h4 className="text-center mb-3">
                <strong>{invitation.inviterName || 'Someone'}</strong> invited you to connect
              </h4>
              
              <p className="text-center text-muted mb-4">
                Join our social network to connect with {invitation.inviterName || 'your friend'} and discover new content!
              </p>

              {invitation.inviteMessage && (
                <Alert variant="light" className="bg-light border-start border-primary border-4">
                  <h6 className="fw-bold mb-2">Personal Message:</h6>
                  <p className="mb-0 fst-italic">"{invitation.inviteMessage}"</p>
                </Alert>
              )}

              <div className="bg-info bg-opacity-10 p-3 rounded mb-4">
                <h6 className="text-info mb-2">
                  <BsCheckCircle className="me-2" />
                  New to our platform?
                </h6>
                <p className="mb-0 small">
                  No problem! Create your account first, and you'll automatically be connected with {invitation.inviterName || 'your friend'} after registration.
                </p>
              </div>

              <div className="text-center">
                <h6 className="mb-3">Choose an option to continue:</h6>
                
                <div className="d-grid gap-3">
                  <Button
                    variant="success"
                    size="lg"
                    onClick={handleSignUp}
                    className="d-flex align-items-center justify-content-center"
                  >
                    <BsPersonPlus className="me-2" />
                    Create New Account & Accept Invitation
                  </Button>
                  
                  <Button
                    variant="outline-primary"
                    size="lg"
                    onClick={handleSignIn}
                    className="d-flex align-items-center justify-content-center"
                  >
                    <BsBoxArrowInRight className="me-2" />
                    Sign In & Accept Invitation
                  </Button>
                </div>

                <div className="mt-4 pt-3 border-top">
                  <small className="text-muted">
                    Don't want to join? You can safely ignore this invitation.
                  </small>
                </div>
              </div>
            </Card.Body>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PublicInvitationAcceptPage;
