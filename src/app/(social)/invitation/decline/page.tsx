import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, Alert, Button, Spinner } from 'react-bootstrap';
import { EmailInvitationService } from '../../../../services/EmailInvitationService';
import { BsCheckCircle, BsXCircle } from 'react-icons/bs';

const DeclineInvitationPage = () => {
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

  const handleDecline = async () => {
    if (!invitationId) return;
    
    setProcessing(true);
    try {
      const response = await EmailInvitationService.handleInvitationApproval({
        invitationId,
        action: 'decline'
      });
      
      setResult(response);
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
                <BsCheckCircle className="text-warning" size={48} />
                <h4 className="mt-3 text-warning">Invitation Declined</h4>
                <p>{result.message}</p>
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

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-6">
          <Card>
            <Card.Header>
              <h4 className="mb-0">Decline Invitation</h4>
            </Card.Header>
            <Card.Body>
              <div className="text-center mb-4">
                <h5>Are you sure you want to decline?</h5>
                <p className="text-muted">
                  You can always connect with this person later if you change your mind.
                </p>
              </div>

              {invitation.inviteMessage && (
                <Alert variant="light" className="bg-light">
                  <h6>Their Message:</h6>
                  <p className="mb-0">"{invitation.inviteMessage}"</p>
                </Alert>
              )}

              <div className="text-center">
                <div className="d-flex gap-3 justify-content-center">
                  <Button
                    variant="outline-primary"
                    onClick={() => navigate('/invitation/accept?id=' + invitationId)}
                    disabled={processing}
                    className="px-4"
                  >
                    <BsCheckCircle className="me-2" />
                    Actually, Accept
                  </Button>
                  
                  <Button
                    variant="danger"
                    onClick={handleDecline}
                    disabled={processing}
                    className="px-4"
                  >
                    {processing ? (
                      <>
                        <Spinner animation="border" size="sm" className="me-2" />
                        Declining...
                      </>
                    ) : (
                      <>
                        <BsXCircle className="me-2" />
                        Yes, Decline
                      </>
                    )}
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

export default DeclineInvitationPage;
