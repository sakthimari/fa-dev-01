import React, { useEffect, useState } from 'react';
import { EmailInvitationService } from '../services/EmailInvitationService';

interface EmailInvitationsProps {
  userId: string;
}

const EmailInvitations: React.FC<EmailInvitationsProps> = ({ userId }) => {
  const [invitations, setInvitations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchInvitations = async () => {
    setLoading(true);
    const result = await EmailInvitationService.listInvitedFriends(userId);
    setInvitations(result);
    setLoading(false);
  };

  useEffect(() => {
    fetchInvitations();
  }, [userId]);

  return (
    <div className="card mb-4">
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-center mb-2">
          <h5 className="card-title mb-0">Email Invitations</h5>
          <button className="btn btn-outline-primary btn-sm" onClick={fetchInvitations}>Refresh</button>
        </div>
        {loading ? (
          <div>Loading...</div>
        ) : invitations.length === 0 ? (
          <div className="text-muted text-center py-4">
            No pending email invitations<br />
            <span style={{ fontSize: '0.95em' }}>
              Email invitations you've sent will appear here until recipients register
            </span>
          </div>
        ) : (
          <ul className="list-group list-group-flush">
            {invitations.map(invite => (
              <li key={invite.id} className="list-group-item d-flex justify-content-between align-items-center">
                <div>
                  <div>{invite.recipientEmail}</div>
                  <small className="text-muted">Sent: {new Date(invite.sentAt).toLocaleString()}</small>
                  {invite.inviteMessage && (
                    <div className="text-muted mt-1" style={{ fontSize: '0.85em' }}>
                      Message: "{invite.inviteMessage.substring(0, 50)}..."
                    </div>
                  )}
                </div>
                <div className="text-end">
                  <span className={`badge ${
                    invite.status === 'accepted' ? 'bg-success' :
                    invite.status === 'declined' ? 'bg-danger' :
                    invite.status === 'expired' ? 'bg-secondary' :
                    'bg-warning'
                  }`}>
                    {invite.status}
                  </span>
                  {invite.messageId && (
                    <div className="text-muted mt-1" style={{ fontSize: '0.75em' }}>
                      Email delivered
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default EmailInvitations;
