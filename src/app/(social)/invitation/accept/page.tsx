import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, Alert, Button, Spinner } from 'react-bootstrap';
import { EmailInvitationService } from '../../../../services/EmailInvitationService';
import { BsCheckCircle, BsXCircle } from 'react-icons/bs';

const AcceptInvitationPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [invitation, setInvitation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<{ success?: boolean; message?: string }>({});

  const invitationId = searchParams.get('id');

  useEffect(() => {
    if (invitationId) {
      loadInvitation();
    } else {
      setLoading(false);
    }
  }, [invitationId]);

  const loadInvitation = async () => {
    try {
      const inv = await EmailInvitationService.getInvitationById(invitationId!);
      setInvitation(inv);
    } catch (error) {
      console.error('Error loading invitation:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    if (!invitationId) return;
    
    setProcessing(true);
    try {
      const response = await EmailInvitationService.handleInvitationApproval({
        invitationId,
        action: 'accept'
      });
      
      setResult(response);
      
      if (response.success) {
        // Redirect to connections page after 3 seconds
        setTimeout(() => {
          navigate('/profile/connections');
        }, 3000);
      }
    } catch (error) {
      setResult({
        success: false,
        message: 'An error occurred while processing your request.'
      });
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="container mt-5">
        <div className="row justify-content-center">
          <div className="col-md-6">
            <Card>
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

  if (!invitationId || !invitation) {
    return (
      <div className="container mt-5">
        <div className="row justify-content-center">
          <div className="col-md-6">
            <Card>
              <Card.Body className="text-center">
                <BsXCircle className="text-danger" size={48} />
                <h4 className="mt-3">Invalid Invitation</h4>
                <p>This invitation link is invalid or has expired.</p>
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

  if (result.success !== undefined) {
    return (
      <div className="container mt-5">
        <div className="row justify-content-center">
          <div className="col-md-6">
            <Card>
              <Card.Body className="text-center">
                {result.success ? (
                  <>
                    <BsCheckCircle className="text-success" size={48} />
                    <h4 className="mt-3 text-success">Invitation Accepted!</h4>
                    <p>{result.message}</p>
                    <p className="text-muted">Redirecting to your connections...</p>
                  </>
                ) : (
                  <>
                    <BsXCircle className="text-danger" size={48} />
                    <h4 className="mt-3 text-danger">Error</h4>
                    <p>{result.message}</p>
                    <Button variant="primary" onClick={() => navigate('/')}>
                      Go to Home
                    </Button>
                  </>
                )}
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
        <div className="col-md-6">
          <Card>
            <Card.Header>
              <h4 className="mb-0">Connection Invitation</h4>
            </Card.Header>
            <Card.Body>
              <div className="text-center mb-4">
                <h5>You've been invited to connect!</h5>
                <p className="text-muted">
                  Someone wants to connect with you on our social network.
                </p>
              </div>

              {invitation.inviteMessage && (
                <Alert variant="light" className="bg-light">
                  <h6>Personal Message:</h6>
                  <p className="mb-0">"{invitation.inviteMessage}"</p>
                </Alert>
              )}

              <div className="text-center">
                <p className="mb-4">
                  Would you like to accept this connection request?
                </p>
                
                <div className="d-flex gap-3 justify-content-center">
                  <Button
                    variant="success"
                    onClick={handleAccept}
                    disabled={processing}
                    className="px-4"
                  >
                    {processing ? (
                      <>
                        <Spinner animation="border" size="sm" className="me-2" />
                        Accepting...
                      </>
                    ) : (
                      <>
                        <BsCheckCircle className="me-2" />
                        Accept Invitation
                      </>
                    )}
                  </Button>
                  
                  <Button
                    variant="outline-secondary"
                    onClick={() => navigate('/invitation/decline?id=' + invitationId)}
                    disabled={processing}
                    className="px-4"
                  >
                    <BsXCircle className="me-2" />
                    Decline
                  </Button>
                </div>
              </div>
            </Card.Body>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AcceptInvitationPage;
