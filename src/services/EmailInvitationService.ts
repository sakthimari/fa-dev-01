import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';

const client = generateClient<Schema>();

export interface SendInvitationRequest {
  recipientEmail: string;
  inviteMessage?: string;
}

export interface SendInvitationResponse {
  success: boolean;
  message: string;
  messageId?: string;
  error?: string;
}

export interface PendingInvitation {
  id: string;
  recipientEmail: string;
  recipientName?: string;
  inviteMessage?: string;
  sentAt: string;
  status: 'pending' | 'registered' | 'declined';
  messageId?: string;
}

// Local storage key for pending invitations
const PENDING_INVITATIONS_KEY = 'pendingEmailInvitations';

export class EmailInvitationService {
  /**
   * Get pending email invitations from localStorage
   */
  static getPendingInvitations(): PendingInvitation[] {
    try {
      const stored = localStorage.getItem(PENDING_INVITATIONS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error reading pending invitations:', error);
      return [];
    }
  }

  /**
   * Save pending invitations to localStorage
   */
  static savePendingInvitations(invitations: PendingInvitation[]): void {
    try {
      localStorage.setItem(PENDING_INVITATIONS_KEY, JSON.stringify(invitations));
    } catch (error) {
      console.error('Error saving pending invitations:', error);
    }
  }

  /**
   * Add a new pending invitation
   */
  static addPendingInvitation(invitation: Omit<PendingInvitation, 'id' | 'sentAt' | 'status'>): void {
    const invitations = this.getPendingInvitations();
    const newInvitation: PendingInvitation = {
      ...invitation,
      id: Date.now().toString(),
      sentAt: new Date().toISOString(),
      status: 'pending'
    };
    invitations.push(newInvitation);
    this.savePendingInvitations(invitations);
  }

  /**
   * Remove a pending invitation
   */
  static removePendingInvitation(invitationId: string): void {
    const invitations = this.getPendingInvitations();
    const filtered = invitations.filter(inv => inv.id !== invitationId);
    this.savePendingInvitations(filtered);
  }

  /**
   * Send an email invitation using AWS SES via Lambda function
   */
  static async sendInvitation(
    request: SendInvitationRequest
  ): Promise<SendInvitationResponse> {
    try {
      const { recipientEmail, inviteMessage } = request;
      
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(recipientEmail)) {
        throw new Error('Invalid email format');
      }

      console.log('📧 Sending email invitation via Lambda function...');
      console.log('To:', recipientEmail);
      console.log('Message:', inviteMessage || 'Default invitation message');

      // Call the Lambda function through GraphQL
      const result = await client.queries.sendInvitation({
        recipientEmail,
        inviteMessage: inviteMessage || undefined,
      });

      console.log('GraphQL result:', result);

      if (result.errors && result.errors.length > 0) {
        console.error('GraphQL errors:', result.errors);
        throw new Error(result.errors[0].message);
      }

      if (!result.data) {
        throw new Error('No data returned from sendInvitation');
      }

      // Parse the JSON response from Lambda
      const response = JSON.parse(result.data);
      console.log('Lambda response:', response);
      
      if (response.success) {
        // Extract a better display name from email
        const emailPrefix = recipientEmail.split('@')[0]
        const displayName = emailPrefix
          .replace(/[._-]/g, ' ')
          .replace(/\b\w/g, l => l.toUpperCase())

        // Add to pending invitations list
        this.addPendingInvitation({
          recipientEmail,
          recipientName: displayName,
          inviteMessage,
          messageId: response.messageId
        });

        return {
          success: true,
          message: response.message || 'Invitation sent successfully',
          messageId: response.messageId,
        };
      } else {
        return {
          success: false,
          message: response.error || 'Failed to send invitation',
          error: response.details,
        };
      }
    } catch (error: any) {
      console.error('Error sending invitation:', error);
      return {
        success: false,
        message: 'Failed to send invitation',
        error: error.message || 'Unknown error occurred',
      };
    }
  }

  /**
   * Validate email format
   */
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Get delivery status (mock implementation)
   */
  static async getDeliveryStatus(_messageId: string): Promise<{
    status: 'pending' | 'delivered' | 'failed';
    timestamp: Date;
  }> {
    // This would integrate with AWS SES to get actual delivery status
    return {
      status: 'delivered',
      timestamp: new Date()
    };
  }
}
