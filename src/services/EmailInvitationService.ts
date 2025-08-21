import { generateClient } from 'aws-amplify/data';
import { SESClient, SendEmailCommand, SendRawEmailCommand } from '@aws-sdk/client-ses';
import { fetchAuthSession } from 'aws-amplify/auth';
import type { Schema } from '../../amplify/data/resource';

const client = generateClient<Schema>();

export interface SendInvitationRequest {
  recipientEmail: string;
  recipientName?: string;
  inviteMessage?: string;
}

export interface SendInvitationResponse {
  success: boolean;
  message: string;
  messageId?: string;
  error?: string;
}

export interface InvitationApprovalRequest {
  invitationId: string;
  action: 'accept' | 'decline';
}

export interface PendingInvitation {
  id: string;
  recipientEmail: string;
  recipientName?: string;
  sentAt: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired' | 'cancelled';
  messageId?: string;
  inviterName?: string;
  inviterId: string;
}

// Local storage key for pending invitations
const PENDING_INVITATIONS_KEY = 'pendingEmailInvitations';

// SES Configuration - Force sakthimari@gmail.com as the only sender
const SES_REGION = import.meta.env.VITE_AWS_SES_REGION || 'us-east-1';
const FROM_EMAIL = 'sakthimari@gmail.com'; // Fixed sender address

export class EmailInvitationService {
  /**
   * Generate a secure invitation token
   */
  private static generateInvitationToken(): string {
    const timestamp = Date.now().toString();
    const randomBytes = Math.random().toString(36).substring(2, 15);
    const token = `inv_${timestamp}_${randomBytes}`;
    return token;
  }

  /**
   * Store invitation details securely with token
   */
  private static storeInvitationToken(token: string, inviterName: string, recipientName: string, recipientEmail: string, inviterAvatar?: string): void {
    const invitationData = {
      inviterName,
      recipientName,
      recipientEmail,
      inviterAvatar: inviterAvatar || undefined,
      timestamp: Date.now(),
      expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000) // 7 days
    };
    
    localStorage.setItem(`invitation_token_${token}`, JSON.stringify(invitationData));
    console.log('Stored invitation token:', token, 'with avatar:', inviterAvatar);
  }

  /**
   * Retrieve invitation details from token
   */
  static getInvitationFromToken(token: string): { inviterName: string; recipientName: string; recipientEmail: string; inviterAvatar?: string } | null {
    try {
      const stored = localStorage.getItem(`invitation_token_${token}`);
      if (!stored) {
        console.log('No invitation found for token:', token);
        return null;
      }
      
      const data = JSON.parse(stored);
      
      // Check if token has expired
      if (data.expiresAt && Date.now() > data.expiresAt) {
        console.log('Invitation token expired:', token);
        localStorage.removeItem(`invitation_token_${token}`);
        return null;
      }
      
      return {
        inviterName: data.inviterName,
        recipientName: data.recipientName,
        recipientEmail: data.recipientEmail,
        inviterAvatar: data.inviterAvatar
      };
    } catch (error) {
      console.error('Error retrieving invitation token:', error);
      return null;
    }
  }

  /**
   * Debug: Create a test invitation record for testing
   */
  static async createTestInvitation(inviterUserId: string, recipientEmail: string, inviterName: string): Promise<void> {
    try {
      console.log('Creating test invitation:', { inviterUserId, recipientEmail, inviterName });
      
      const result = await this.createInvitation(inviterUserId, recipientEmail, inviterName, undefined);
      console.log('Test invitation created:', result);
      
      // Also send email if possible
      try {
        await this.sendEmailNotification(
          recipientEmail,
          recipientEmail.split('@')[0], // Use email prefix as name
          inviterName,
          `Test invitation from ${inviterName}`,
          result.data?.id || 'test-id'
        );
        console.log('Test invitation email sent');
      } catch (emailError) {
        console.warn('Could not send test email:', emailError);
      }
    } catch (error) {
      console.error('Error creating test invitation:', error);
    }
  }

  /**
   * Debug SES configuration
   */
  static debugSESConfig(): void {
    console.log('=== SES Configuration Debug ===');
    console.log('SES_REGION:', SES_REGION);
    console.log('FROM_EMAIL:', FROM_EMAIL);
    console.log('Environment variables:');
    console.log('  VITE_AWS_SES_REGION:', import.meta.env.VITE_AWS_SES_REGION);
    console.log('  VITE_SES_FROM_EMAIL:', import.meta.env.VITE_SES_FROM_EMAIL);
    console.log('=== End Debug ===');
  }

  /**
   * Debug current AWS user and credentials
   */
  static async debugAWSUser(): Promise<void> {
    try {
      console.log('=== AWS User Debug ===');
      const session = await fetchAuthSession();
      console.log('Session:', session);
      console.log('User identity ID:', session.identityId);
      console.log('Credentials available:', !!session.credentials);
      if (session.credentials) {
        console.log('Access Key ID:', session.credentials.accessKeyId);
        console.log('Session token available:', !!session.credentials.sessionToken);
      }
      console.log('=== End AWS User Debug ===');
    } catch (error) {
      console.error('Failed to get AWS user info:', error);
    }
  }

  /**
   * Initialize SES client with current AWS credentials
   */
  private static async getSESClient(): Promise<SESClient> {
    try {
      console.log('Initializing SES client with region:', SES_REGION);
      const session = await fetchAuthSession();
      const credentials = session.credentials;
      
      if (!credentials) {
        throw new Error('No AWS credentials available');
      }

      console.log('AWS credentials available, creating SES client');
      const sesClient = new SESClient({
        region: SES_REGION,
        credentials: {
          accessKeyId: credentials.accessKeyId,
          secretAccessKey: credentials.secretAccessKey,
          sessionToken: credentials.sessionToken,
        },
        // Explicitly ensure no default configuration is inherited
        maxAttempts: 3,
      });
      
      console.log('SES client created successfully without configuration set');
      return sesClient;
    } catch (error) {
      console.error('Failed to initialize SES client:', error);
      throw error;
    }
  }

  /**
   * Create friend request notification for existing user immediately when invitation is sent
   */
  private static async createFriendRequestForExistingUser(
    recipientEmail: string, 
    inviterName: string, 
    inviterAvatar?: string,
    inviterId?: string
  ): Promise<void> {
    try {
      console.log(`Creating immediate friend request for existing user: ${recipientEmail} from ${inviterName}`);
      
      // Store the pending friend request using email as key
      const pendingRequest = {
        recipientEmail,
        inviterName,
        inviterAvatar,
        inviterId, // Store the inviter's user ID
        timestamp: Date.now(),
        processed: false
      };
      
      // Store in localStorage for now (in production, this would be in database)
      const storageKey = `pending_friend_request_${recipientEmail}`;
      localStorage.setItem(storageKey, JSON.stringify(pendingRequest));
      
      console.log('Stored pending friend request for existing user:', pendingRequest);
      
    } catch (error) {
      console.warn('Could not create immediate friend request for existing user:', error);
      // Don't fail the email sending if this fails
    }
  }

  /**
   * Generate invitation email content
   */
  private static generateInvitationEmailWithAvatar(
    inviterName: string,
    recipientName: string,
    inviteMessage: string,
    recipientEmail: string,
    inviterAvatar?: string
  ): { subject: string; htmlBody: string; textBody: string } {
    const appUrl = window.location.origin;

    // Generate secure token for this invitation
    const invitationToken = this.generateInvitationToken();
    
    // Store invitation details securely with the token, including avatar
    this.storeInvitationToken(invitationToken, inviterName, recipientName, recipientEmail, inviterAvatar);

    const subject = `${inviterName} invited you to connect`;
    
    const htmlBody = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          .container { max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; }
          .header { background: #007bff; color: white; padding: 20px; text-align: center; }
          .content { padding: 30px; background: #f8f9fa; }
          .message { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .user-option { background: white; padding: 25px; border-radius: 8px; margin: 20px 0; border: 2px solid #e0e0e0; text-align: center; }
          .new-user { border-color: #28a745; }
          .existing-user { border-color: #007bff; }
          .btn { display: inline-block; padding: 15px 30px; margin: 15px 0; text-decoration: none; border-radius: 25px; font-weight: bold; color: white; }
          .btn-register { background: linear-gradient(135deg, #28a745 0%, #20c997 100%); }
          .btn-login { background: linear-gradient(135deg, #007bff 0%, #0056b3 100%); }
          .divider { text-align: center; margin: 30px 0; color: #999; font-size: 18px; }
          .footer { text-align: center; color: #6c757d; font-size: 14px; padding: 20px; }
          .highlight { background: #fff3cd; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #ffc107; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 You're Invited to Connect!</h1>
            <p><strong>${inviterName}</strong> wants to connect with you</p>
          </div>
          <div class="content">
            <p>Hi ${recipientName},</p>
            <p><strong>${inviterName}</strong> has invited you to connect on our social network.</p>
            
            ${inviteMessage ? `
            <div class="message">
              <h4>Personal Message:</h4>
              <p>"${inviteMessage}"</p>
            </div>
            ` : ''}
            
            <div class="highlight">
              <strong>📧 Important:</strong> Choose the option that applies to you below
            </div>
            
            <div class="user-option new-user">
              <h3>🆕 New User?</h3>
              <p>If you don't have an account yet, register first and we'll automatically connect you with <strong>${inviterName}</strong>.</p>
              <a href="${appUrl}/modern-auth/sign-up?token=${invitationToken}" class="btn btn-register">
                Register & Accept Invitation
              </a>
              <p><small>✨ After registration, you'll see a friend request from ${inviterName}</small></p>
            </div>
            
            <div class="divider">
              ── OR ──
            </div>
            
            <div class="user-option existing-user">
              <h3>👤 Already Have an Account?</h3>
              <p>If you already have an account, login and accept <strong>${inviterName}</strong> as a friend.</p>
              <a href="${appUrl}/modern-auth/sign-in?token=${invitationToken}" class="btn btn-login">
                Login & Accept Invitation
              </a>
              <p><small>🤝 You'll be automatically connected after login</small></p>
            </div>
          </div>
          <div class="footer">
            <p>This invitation was sent by ${inviterName}</p>
            <p>If you don't want to receive invitations, please contact us.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const textBody = `
Hi ${recipientName},

${inviterName} has invited you to connect on our social network.

${inviteMessage ? `Personal Message: "${inviteMessage}"` : ''}

📧 IMPORTANT: Choose the option that applies to you:

🆕 NEW USER?
If you don't have an account yet, register first and we'll automatically connect you with ${inviterName}.
Register here: ${appUrl}/modern-auth/sign-up?token=${invitationToken}
✨ After registration, you'll see a friend request from ${inviterName}

👤 ALREADY HAVE AN ACCOUNT?
If you already have an account, login and accept ${inviterName} as a friend.
Login here: ${appUrl}/modern-auth/sign-in?token=${invitationToken}
🤝 You'll be automatically connected after login

This invitation was sent by ${inviterName}.
If you don't want to receive invitations, please contact us.
    `;

    return { subject, htmlBody, textBody };
  }
  /**
   * Create an invitation record in the backend
   */
  static async createInvitation(inviterId: string, recipientEmail: string, inviterName?: string, inviterAvatar?: string) {
    try {
      // Check if client and model are available
      if (!client || !client.models) {
        console.warn('Amplify client not available, using local-only mode');
        return { data: { id: Date.now().toString() } };
      }

      if (!client.models.Invitation) {
        console.warn('Invitation model not available in client, using local-only mode');
        return { data: { id: Date.now().toString() } };
      }
      
      // Validate required parameters
      if (!inviterId || !recipientEmail) {
        throw new Error('inviterId and recipientEmail are required');
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(recipientEmail)) {
        throw new Error('Invalid email format');
      }

      // Create invitation data with all required fields
      // inviterName is required according to schema, so provide default if not given
      const createData = {
        inviterId: inviterId.trim(),
        recipientEmail: recipientEmail.trim().toLowerCase(),
        inviterName: (inviterName && inviterName.trim()) || 'A friend', // Required field with fallback
        status: 'pending' as const,
        sentAt: new Date().toISOString(),
        // inviterAvatar is optional
        ...(inviterAvatar && inviterAvatar.trim() && { inviterAvatar: inviterAvatar.trim() })
      };

      console.log('Creating invitation with data:', createData);

      alert(JSON.stringify(createData));

      const result = await client.models.Invitation.create(createData);
      
      console.log('Invitation created successfully:', result);
      return result;

    } catch (error: any) {
      console.error('Error in createInvitation:', error);
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
      
      // If schema creation fails, try a fallback approach
      if (error.message && (error.message.includes('inviterAvatar') || error.message.includes('schema'))) {
        console.warn('Schema issue detected, trying without optional fields');
        try {
          const fallbackData = {
            inviterId: inviterId.trim(),
            recipientEmail: recipientEmail.trim().toLowerCase(),
            inviterName: (inviterName && inviterName.trim()) || 'A friend',
            status: 'pending' as const,
            sentAt: new Date().toISOString()
          };
          
          console.log('Retrying with fallback data:', fallbackData);
          const fallbackResult = await client.models.Invitation.create(fallbackData);
          console.log('Fallback invitation created successfully');
          return fallbackResult;
        } catch (fallbackError) {
          console.error('Fallback creation also failed:', fallbackError);
        }
      }
      
      // Return mock data to allow the process to continue
      const mockId = `mock_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      console.warn(`Returning mock invitation ID: ${mockId}`);
      
      return { 
        data: { 
          id: mockId,
          inviterId,
          recipientEmail,
          inviterName: (inviterName && inviterName.trim()) || 'A friend',
          status: 'pending',
          sentAt: new Date().toISOString(),
          // Include avatar in mock if provided
          ...(inviterAvatar && { inviterAvatar })
        } 
      };
    }
  }

  /**
   * Send actual email invitation using AWS SES
   */
  static async sendEmailNotification(
    recipientEmail: string,
    recipientName: string,
    inviterName: string,
    inviteMessage: string,
    _invitationId: string, // Parameter kept for compatibility but not used
    inviterAvatar?: string, // Add avatar parameter
    inviterId?: string // Add inviter ID parameter
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      console.log('=== Email Sending Debug ===');
      console.log('Recipient:', recipientEmail);
      console.log('From email:', FROM_EMAIL);
      console.log('Invitation ID:', _invitationId);
      console.log('Inviter Avatar:', inviterAvatar);
      
      // IMPORTANT: Create friend request notification immediately if recipient is an existing user
      await this.createFriendRequestForExistingUser(recipientEmail, inviterName, inviterAvatar, inviterId);
      
      // Debug SES configuration
      this.debugSESConfig();
      
      // Debug AWS user information
      await this.debugAWSUser();
      
      const sesClient = await this.getSESClient();
      const { subject, htmlBody, textBody } = this.generateInvitationEmailWithAvatar(
        inviterName,
        recipientName,
        inviteMessage,
        recipientEmail,
        inviterAvatar
      );

      console.log('Email subject:', subject);
      console.log('Email body length:', htmlBody.length);

      // Create SendEmail command without any configuration set
      const commandParams = {
        Source: FROM_EMAIL,
        Destination: {
          ToAddresses: [recipientEmail],
        },
        Message: {
          Subject: {
            Data: subject,
            Charset: 'UTF-8',
          },
          Body: {
            Html: {
              Data: htmlBody,
              Charset: 'UTF-8',
            },
            Text: {
              Data: textBody,
              Charset: 'UTF-8',
            },
          },
        },
        // Explicitly DO NOT use any configuration set
        // Note: Omitting ConfigurationSetName entirely to avoid AWS applying defaults
      };

      console.log('SendEmail command parameters:', JSON.stringify(commandParams, null, 2));
      
      const command = new SendEmailCommand(commandParams);

      console.log('Sending email command...');
      const result = await sesClient.send(command);
      console.log('Email sent successfully:', result.MessageId);
      
      return {
        success: true,
        messageId: result.MessageId,
      };
    } catch (error: any) {
      console.error('Failed to send email - Full error:', error);
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error code:', error.code);
      console.error('Error stack:', error.stack);
      
      // Parse specific AWS SES errors for user-friendly messages
      if (error.message && error.message.includes('not authorized to perform') && error.message.includes('ses:SendEmail')) {
        const identityMatch = error.message.match(/identity\/([^']+)/);
        const emailAddress = identityMatch ? identityMatch[1] : 'unknown email';
        
        if (emailAddress === FROM_EMAIL) {
          // Sender email not verified
          return {
            success: false,
            error: `Sender email '${FROM_EMAIL}' is not verified in AWS SES. Please verify this email in the AWS SES Console.`
          };
        } else {
          // Recipient email not verified (SES Sandbox mode)
          return {
            success: false,
            error: `🚫 AWS SES Sandbox Mode: Cannot send to '${emailAddress}' because it's not verified.\n\n💡 Solutions:\n• Verify recipient email in AWS SES Console\n• Request production access to send to any email\n• Use "Email Client" button below to send manually`
          };
        }
      } else if (error.message && error.message.includes('configuration-set')) {
        // Configuration set permission error
        const configSetMatch = error.message.match(/arn:aws:ses:[^:]+:[^:]+:configuration-set\/([^']+)/);
        const configSetName = configSetMatch ? configSetMatch[1] : 'unknown';
        
        return {
          success: false,
          error: `🚫 AWS SES Configuration Set Error: Cannot use configuration set '${configSetName}'.\n\n💡 Solutions:\n• Remove or fix SES configuration set permissions\n• Contact your AWS administrator\n• Use "Email Client" button below to send manually`
        };
      } else {
        return {
          success: false,
          error: `Email sending failed: ${error.message || 'Unknown AWS SES error'}. Try the "Email Client" option below.`
        };
      }
    }
  }

  /**
   * Alternative method using SendRawEmail to bypass configuration set issues
   */
  private static async sendRawEmailNotification(
    recipientEmail: string,
    recipientName: string,
    inviterName: string,
    inviteMessage: string,
    _invitationId: string, // Parameter kept for compatibility but not used
    inviterAvatar?: string // Add avatar parameter
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      console.log('=== Raw Email Sending (Bypass Config Sets) ===');
      console.log('Recipient:', recipientEmail);
      console.log('From email:', FROM_EMAIL);
      
      const sesClient = await this.getSESClient();
      const { subject, htmlBody, textBody } = this.generateInvitationEmailWithAvatar(
        inviterName,
        recipientName,
        inviteMessage,
        recipientEmail,
        inviterAvatar
      );

      // Create raw email message (RFC 2822 format)
      const rawMessage = [
        `From: ${FROM_EMAIL}`,
        `To: ${recipientEmail}`,
        `Subject: ${subject}`,
        `MIME-Version: 1.0`,
        `Content-Type: multipart/alternative; boundary="boundary123"`,
        ``,
        `--boundary123`,
        `Content-Type: text/plain; charset=UTF-8`,
        ``,
        textBody,
        ``,
        `--boundary123`,
        `Content-Type: text/html; charset=UTF-8`,
        ``,
        htmlBody,
        ``,
        `--boundary123--`
      ].join('\r\n');

      // Send raw email (should bypass configuration set issues)
      const command = new SendRawEmailCommand({
        Source: FROM_EMAIL,
        Destinations: [recipientEmail],
        RawMessage: {
          Data: new TextEncoder().encode(rawMessage),
        },
        // Note: SendRawEmail typically doesn't apply configuration sets automatically
      });

      console.log('Sending raw email command...');
      const result = await sesClient.send(command);
      console.log('Raw email sent successfully:', result.MessageId);
      
      return {
        success: true,
        messageId: result.MessageId,
      };
    } catch (error: any) {
      console.error('Failed to send raw email:', error);
      return {
        success: false,
        error: `Raw email failed: ${error.message || 'Unknown error'}`
      };
    }
  }

  /**
   * Alternative email sending using mailto (fallback method)
   */
  static async sendEmailViaMailto(
    recipientEmail: string,
    recipientName: string,
    inviterName: string,
    inviteMessage: string,
    invitationId: string
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const appUrl = window.location.origin;
      const acceptUrl = `${appUrl}/invitation/accept?id=${invitationId}`;
      
      const subject = `${inviterName} invited you to connect`;
      const body = `Hi ${recipientName},

${inviterName} has invited you to connect on our social network.

${inviteMessage ? `Personal Message: "${inviteMessage}"` : ''}

To accept this invitation, click here: ${acceptUrl}

If you don't have an account yet, you'll be able to create one when you accept the invitation.

This invitation will expire in 7 days.
If you didn't expect this invitation, you can safely ignore this email.`;

      // Create mailto URL
      const mailtoUrl = `mailto:${recipientEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      
      // Open mailto link
      window.open(mailtoUrl, '_blank');
      
      console.log('Opened mailto client for:', recipientEmail);
      
      return {
        success: true,
        messageId: `mailto-${Date.now()}`,
      };
    } catch (error: any) {
      console.error('Failed to open mailto:', error);
      return {
        success: false,
        error: error.message || 'Failed to open email client',
      };
    }
  }

  /**
   * Send email with fallback options
   */
  static async sendEmailWithFallback(
    recipientEmail: string,
    recipientName: string,
    inviterName: string,
    inviteMessage: string,
    invitationId: string,
    allowMailtoFallback: boolean = false,
    inviterAvatar?: string,
    inviterId?: string
  ): Promise<{ success: boolean; messageId?: string; error?: string; method?: string }> {
    // First try SES
    try {
      console.log('Attempting SES email delivery...');
      const sesResult = await this.sendEmailNotification(
        recipientEmail,
        recipientName,
        inviterName,
        inviteMessage,
        invitationId,
        inviterAvatar,
        inviterId
      );
      
      if (sesResult.success) {
        console.log('SES email sent successfully');
        return { ...sesResult, method: 'SES' };
      } else {
        console.warn('SES failed:', sesResult.error);
        
        // Check if it's a configuration set error - try raw email fallback
        if (sesResult.error?.includes('configuration-set')) {
          console.log('Configuration set error detected, trying raw email method...');
          const rawResult = await this.sendRawEmailNotification(
            recipientEmail,
            recipientName,
            inviterName,
            inviteMessage,
            invitationId,
            inviterAvatar
          );
          
          if (rawResult.success) {
            console.log('Raw email sent successfully');
            return { ...rawResult, method: 'SES-Raw' };
          } else {
            console.warn('Raw email also failed:', rawResult.error);
          }
        }
        
        // Check if it's a permission error
        if (sesResult.error?.includes('AccessDenied') || sesResult.error?.includes('not authorized')) {
          return {
            success: false,
            error: `AWS SES Permission Error: Your account doesn't have permission to send emails. Please contact your administrator to grant 'ses:SendEmail' permission or set up SES properly.`,
            method: 'SES'
          };
        }
        
        // Check if it's an unverified email error
        if (sesResult.error?.includes('Email address not verified')) {
          return {
            success: false,
            error: `Email address '${FROM_EMAIL}' is not verified in AWS SES. Please verify this email address in the AWS SES Console before sending invitations.`,
            method: 'SES'
          };
        }
        
        // For other SES errors, try mailto fallback if allowed
        if (allowMailtoFallback) {
          console.log('Trying mailto fallback...');
        } else {
          return {
            success: false,
            error: sesResult.error,
            method: 'SES'
          };
        }
      }
    } catch (error: any) {
      console.warn('SES failed with exception:', error);
      
      // Parse specific AWS errors
      if (error.name === 'AccessDenied' || error.message?.includes('AccessDenied')) {
        return {
          success: false,
          error: `AWS SES Permission Error: Your account doesn't have permission to send emails. Please contact your administrator to grant 'ses:SendEmail' permission.`,
          method: 'SES'
        };
      }
      
      if (!allowMailtoFallback) {
        return {
          success: false,
          error: error.message || 'Email sending failed',
          method: 'SES'
        };
      }
    }

    // Fallback to mailto only if explicitly allowed
    if (allowMailtoFallback) {
      console.log('Using mailto fallback...');
      const mailtoResult = await this.sendEmailViaMailto(
        recipientEmail,
        recipientName,
        inviterName,
        inviteMessage,
        invitationId
      );
      
      return { ...mailtoResult, method: 'mailto' };
    }

    return {
      success: false,
      error: 'Email sending failed and no fallback method available',
      method: 'none'
    };
  }
  static async listInvitedFriends(inviterId: string) {
    const result = await client.models.Invitation.list({
      filter: { inviterId: { eq: inviterId } }
    });
    return result.data || [];
  }
  /**
   * Send an email invitation with actual email delivery
   * Creates invitation record and sends email notification
   * If email sending fails, invitation is NOT created
   */
  static async sendInvitation(
    request: SendInvitationRequest
  ): Promise<SendInvitationResponse> {
    try {
      const { recipientEmail, recipientName, inviteMessage } = request;
      
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(recipientEmail)) {
        throw new Error('Invalid email format');
      }

      console.log('Creating invitation for:', recipientEmail);

      // Check if invitation already exists locally
      const existingInvitations = this.getPendingInvitations();
      const existingInvitation = existingInvitations.find(inv => inv.recipientEmail === recipientEmail);
      
      if (existingInvitation) {
        return {
          success: false,
          message: `Invitation already exists for ${recipientEmail}`,
          error: 'Duplicate invitation'
        };
      }

      // Get current user for inviter ID and name
      let currentUser, inviterId, inviterName, inviterAvatar;
      try {
        const { getCurrentUser } = await import('aws-amplify/auth');
        currentUser = await getCurrentUser();
        inviterId = currentUser.userId;
        inviterName = 'A friend'; // Default fallback
        
        // Try to get inviter's profile for name and avatar
        try {
          const inviterProfile = await client.models.UserProfile.get({ id: inviterId });
          console.log('DEBUG: Fetched inviter profile:', inviterProfile);
          if (inviterProfile?.data) {
            // Use first and last name from profile
            const firstName = inviterProfile.data.firstName || '';
            const lastName = inviterProfile.data.lastName || '';
            inviterName = `${firstName} ${lastName}`.trim() || currentUser.signInDetails?.loginId || 'A friend';

            // Prefer storing S3 key for avatar, not a presigned URL
            const extractKeyFromUrl = (urlStr: string): string | undefined => {
              try {
                const u = new URL(urlStr);
                // e.g. /public/profile-photos/{userId}/file.jpg
                const path = u.pathname.startsWith('/') ? u.pathname.slice(1) : u.pathname;
                return path.startsWith('public/') ? path.slice('public/'.length) : path;
              } catch {
                return undefined;
              }
            };

            const profile = inviterProfile.data as any;
            inviterAvatar = (profile.profilePhotoKey?.trim())
              || (profile.profilePhotoUrl ? extractKeyFromUrl(profile.profilePhotoUrl) : undefined)
              || undefined;

            console.log('DEBUG: Extracted inviter data:', { inviterName, inviterAvatar });
          } else {
            console.log('DEBUG: No inviter profile data found');
          }
        } catch (profileError) {
          console.warn('Could not fetch inviter profile:', profileError);
          // Fallback to loginId if profile fetch fails
          inviterName = currentUser.signInDetails?.loginId || 'A friend';
          inviterAvatar = undefined;
          console.log('DEBUG: Using fallback inviter data:', { inviterName, inviterAvatar });
        }
      } catch (authError) {
        console.error('Auth error:', authError);
        return {
          success: false,
          message: 'You must be logged in to send invitations',
          error: 'Authentication required'
        };
      }

      // First, try to send email BEFORE creating invitation
      const tempInvitationId = Date.now().toString();
      const emailResult = await this.sendEmailWithFallback(
        recipientEmail,
        recipientName || recipientEmail.split('@')[0],
        inviterName,
        inviteMessage || `Hi! I'd like to connect with you on our social network.`,
        tempInvitationId,
        false, // Don't use mailto fallback by default
        inviterAvatar || undefined,
        inviterId
      );

      alert(emailResult.success ? 'Invitation email sent successfully!' : `Failed to send invitation email: ${emailResult.error}`);

      // If email sending failed completely, don't create invitation
      if (!emailResult.success) {
        console.error('Email sending failed completely:', emailResult.error);
        return {
          success: false,
          message: `Failed to send invitation: ${emailResult.error}`,
          error: emailResult.error
        };
      }

      // Only create invitation if email was sent successfully (or mailto was opened)
      let invitationRecord;
      try {
        invitationRecord = await this.createInvitation(inviterId, recipientEmail, inviterName, inviterAvatar);
      } catch (dbError) {
        console.warn('Database invitation creation failed, using local-only mode:', dbError);
        invitationRecord = { data: { id: tempInvitationId } };
      }
      
      const invitationId = invitationRecord.data?.id || tempInvitationId;

      let successMessage = '';
      if (emailResult.method === 'SES') {
        successMessage = `Email invitation sent to ${recipientEmail}! They will receive an email with options to accept or decline your connection request.`;
      } else if (emailResult.method === 'mailto') {
        successMessage = `Email client opened for ${recipientEmail}. Please send the email from your email client. They will receive options to accept or decline your connection request.`;
      }
      
  // Create local pending invitation record
      const pendingInvitation: PendingInvitation = {
        id: invitationId,
        recipientEmail,
        recipientName: recipientName || recipientEmail.split('@')[0],
        sentAt: new Date().toISOString(),
        status: 'pending',
        inviterId,
        inviterName,
        messageId: emailResult.messageId,
      };

      // Add to localStorage for immediate UI update
      const currentInvitations = this.getPendingInvitations();
      const updatedInvitations = [...currentInvitations, pendingInvitation];
      this.savePendingInvitations(updatedInvitations);

      console.log('Invitation created successfully:', pendingInvitation);

      return {
        success: true,
        message: successMessage,
        messageId: invitationId,
      };

    } catch (error: any) {
      console.error('Error creating invitation:', error);
      return {
        success: false,
        message: 'Failed to create invitation',
        error: error.message || 'Unknown error occurred',
      };
    }
  }
  /**
   * Send invitation with mailto fallback (for when SES fails)
   */
  static async sendInvitationWithEmailClient(
    request: SendInvitationRequest
  ): Promise<SendInvitationResponse> {
    try {
      const { recipientEmail, recipientName, inviteMessage } = request;
      
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(recipientEmail)) {
        throw new Error('Invalid email format');
      }

      // Check if invitation already exists locally
      const existingInvitations = this.getPendingInvitations();
      const existingInvitation = existingInvitations.find(inv => inv.recipientEmail === recipientEmail);
      
      if (existingInvitation) {
        return {
          success: false,
          message: `Invitation already exists for ${recipientEmail}`,
          error: 'Duplicate invitation'
        };
      }

      // Get current user for inviter ID and name
      let currentUser, inviterId, inviterName, inviterAvatar;
      try {
        const { getCurrentUser } = await import('aws-amplify/auth');
        currentUser = await getCurrentUser();
        inviterId = currentUser.userId;
        inviterName = 'A friend'; // Default fallback
        
        // Try to get inviter's profile for name and avatar
        try {
          const inviterProfile = await client.models.UserProfile.get({ id: inviterId });
          if (inviterProfile?.data) {
            // Use first and last name from profile
            const firstName = inviterProfile.data.firstName || '';
            const lastName = inviterProfile.data.lastName || '';
            inviterName = `${firstName} ${lastName}`.trim() || currentUser.signInDetails?.loginId || 'A friend';

            // Prefer S3 key over presigned URL
            const extractKeyFromUrl = (urlStr: string): string | undefined => {
              try {
                const u = new URL(urlStr);
                const path = u.pathname.startsWith('/') ? u.pathname.slice(1) : u.pathname;
                return path.startsWith('public/') ? path.slice('public/'.length) : path;
              } catch {
                return undefined;
              }
            };
            const profile = inviterProfile.data as any;
            inviterAvatar = (profile.profilePhotoKey?.trim())
              || (profile.profilePhotoUrl ? extractKeyFromUrl(profile.profilePhotoUrl) : undefined)
              || undefined;
          }
        } catch (profileError) {
          console.warn('Could not fetch inviter profile:', profileError);
          // Fallback to loginId if profile fetch fails
          inviterName = currentUser.signInDetails?.loginId || 'A friend';
          inviterAvatar = undefined;
        }
      } catch (authError) {
        console.error('Auth error:', authError);
        return {
          success: false,
          message: 'You must be logged in to send invitations',
          error: 'Authentication required'
        };
      }

      // Try email sending with mailto fallback enabled
      const tempInvitationId = Date.now().toString();
      const emailResult = await this.sendEmailWithFallback(
        recipientEmail,
        recipientName || recipientEmail.split('@')[0],
        inviterName,
        inviteMessage || `Hi! I'd like to connect with you on our social network.`,
        tempInvitationId,
        true, // Enable mailto fallback
        inviterAvatar || undefined,
        inviterId
      );

      if (!emailResult.success) {
        return {
          success: false,
          message: `Failed to send invitation: ${emailResult.error}`,
          error: emailResult.error
        };
      }

      // Create invitation record
      let invitationRecord;
      try {
        invitationRecord = await this.createInvitation(inviterId, recipientEmail, inviterName, inviterAvatar);
      } catch (dbError) {
        console.warn('Database invitation creation failed, using local-only mode:', dbError);
        invitationRecord = { data: { id: tempInvitationId } };
      }
      
      const invitationId = invitationRecord.data?.id || tempInvitationId;

      // Create local pending invitation record
  const pendingInvitation: PendingInvitation = {
        id: invitationId,
        recipientEmail,
        recipientName: recipientName || recipientEmail.split('@')[0],
        sentAt: new Date().toISOString(),
        status: 'pending',
        inviterId,
        inviterName,
        messageId: emailResult.messageId,
      };

      // Add to localStorage
      const currentInvitations = this.getPendingInvitations();
      const updatedInvitations = [...currentInvitations, pendingInvitation];
      this.savePendingInvitations(updatedInvitations);

      let successMessage = '';
      if (emailResult.method === 'SES') {
        successMessage = `Email invitation sent to ${recipientEmail}!`;
      } else if (emailResult.method === 'mailto') {
        successMessage = `Email client opened for ${recipientEmail}. Please send the email to complete the invitation.`;
      }

      return {
        success: true,
        message: successMessage,
        messageId: invitationId,
      };

    } catch (error: any) {
      console.error('Error creating invitation:', error);
      return {
        success: false,
        message: 'Failed to create invitation',
        error: error.message || 'Unknown error occurred',
      };
    }
  }

  /**
   * Handle invitation approval (accept or decline)
   */
  static async handleInvitationApproval(
    request: InvitationApprovalRequest
  ): Promise<{ success: boolean; message: string; error?: string }> {
    try {
      const { invitationId, action } = request;

      // Update invitation status in database
      if (client.models?.Invitation) {
        try {
          await client.models.Invitation.update({
            id: invitationId,
            status: action === 'accept' ? 'accepted' : 'declined'
          });
        } catch (dbError) {
          console.warn('Failed to update invitation in database:', dbError);
        }
      }

      // Update local storage
      const invitations = this.getPendingInvitations();
      const updatedInvitations = invitations.map(inv => 
        inv.id === invitationId 
          ? { ...inv, status: action === 'accept' ? 'accepted' : 'declined' as any }
          : inv
      );
      this.savePendingInvitations(updatedInvitations);

      if (action === 'accept') {
        // Create connection between users
        const invitation = invitations.find(inv => inv.id === invitationId);
        if (invitation) {
          await this.createConnection(invitation.inviterId, invitation.recipientEmail);
        }
        
        return {
          success: true,
          message: 'Invitation accepted! You are now connected.'
        };
      } else {
        return {
          success: true,
          message: 'Invitation declined.'
        };
      }
    } catch (error: any) {
      console.error('Error handling invitation approval:', error);
      return {
        success: false,
        message: 'Failed to process invitation response',
        error: error.message
      };
    }
  }

  /**
   * Create connection between users
   */
  static async createConnection(inviterId: string, _recipientEmail: string): Promise<void> {
    try {
      // Get current user (recipient)
      const { getCurrentUser } = await import('aws-amplify/auth');
      const currentUser = await getCurrentUser();
      const recipientId = currentUser.userId;

      if (client.models?.Connections) {
        // Create bidirectional connections
        await Promise.all([
          client.models.Connections.create({
            inviterId: inviterId,
            friendId: recipientId,
          }),
          client.models.Connections.create({
            inviterId: recipientId,
            friendId: inviterId,
          })
        ]);
        console.log('Connection created between users');
      }
    } catch (error) {
      console.error('Failed to create connection:', error);
      throw error;
    }
  }

  /**
   * Get invitation by ID
   */
  static async getInvitationById(invitationId: string): Promise<PendingInvitation | null> {
    // First check localStorage
    const localInvitations = this.getPendingInvitations();
    const localInvitation = localInvitations.find(inv => inv.id === invitationId);
    
    if (localInvitation) {
      return localInvitation;
    }

    // Then check database
    try {
      if (client.models?.Invitation) {
        const result = await client.models.Invitation.get({ id: invitationId });
        if (result.data) {
          return {
            id: result.data.id,
            recipientEmail: result.data.recipientEmail,
            sentAt: result.data.sentAt || new Date().toISOString(),
            status: result.data.status as any || 'pending',
            inviterId: result.data.inviterId,
          };
        }
      }
    } catch (error) {
      console.error('Error fetching invitation from database:', error);
    }

    return null;
  }

  /**
   * Cancel a pending invitation
   */
  static async cancelInvitation(invitationId: string): Promise<{ success: boolean; message: string; error?: string }> {
    try {
      // Update invitation status in database
      if (client.models?.Invitation) {
        try {
          await client.models.Invitation.update({
            id: invitationId,
            status: 'cancelled'
          });
        } catch (dbError) {
          console.warn('Failed to update invitation status in database:', dbError);
        }
      }

      // Remove from localStorage
      this.removePendingInvitation(invitationId);

      return {
        success: true,
        message: 'Invitation cancelled successfully'
      };
    } catch (error: any) {
      console.error('Error cancelling invitation:', error);
      return {
        success: false,
        message: 'Failed to cancel invitation',
        error: error.message
      };
    }
  }

  /**
   * Resend an existing invitation
   */
  static async resendInvitation(invitationId: string): Promise<{ success: boolean; message: string; error?: string }> {
    try {
      // Get the original invitation
      const invitations = this.getPendingInvitations();
      const originalInvitation = invitations.find(inv => inv.id === invitationId);

      if (!originalInvitation) {
        return {
          success: false,
          message: 'Original invitation not found',
          error: 'Invitation not found'
        };
      }

      // Get current user info
      let currentUser, inviterName, inviterId, inviterAvatar;
      try {
        const { getCurrentUser } = await import('aws-amplify/auth');
        currentUser = await getCurrentUser();
        inviterName = 'A friend'; // Default fallback
        inviterId = currentUser.userId;
        
        // Try to get inviter's profile for name and avatar
        try {
          const inviterProfile = await client.models.UserProfile.get({ id: inviterId });
          if (inviterProfile?.data) {
            // Use first and last name from profile
            const firstName = inviterProfile.data.firstName || '';
            const lastName = inviterProfile.data.lastName || '';
            inviterName = `${firstName} ${lastName}`.trim() || currentUser.signInDetails?.loginId || 'A friend';
            const extractKeyFromUrl = (urlStr: string): string | undefined => {
              try {
                const u = new URL(urlStr);
                const path = u.pathname.startsWith('/') ? u.pathname.slice(1) : u.pathname;
                return path.startsWith('public/') ? path.slice('public/'.length) : path;
              } catch {
                return undefined;
              }
            };
            const profile = inviterProfile.data as any;
            inviterAvatar = (profile.profilePhotoKey?.trim())
              || (profile.profilePhotoUrl ? extractKeyFromUrl(profile.profilePhotoUrl) : undefined)
              || undefined;
          }
        } catch (profileError) {
          console.warn('Could not fetch inviter profile:', profileError);
          // Fallback to loginId if profile fetch fails
          inviterName = currentUser.signInDetails?.loginId || 'A friend';
          inviterAvatar = undefined;
        }
      } catch (authError) {
        console.error('Auth error:', authError);
        return {
          success: false,
          message: 'You must be logged in to resend invitations',
          error: 'Authentication required'
        };
      }

      // Send email notification again with fallback
      const emailResult = await this.sendEmailWithFallback(
        originalInvitation.recipientEmail,
        originalInvitation.recipientName || originalInvitation.recipientEmail.split('@')[0],
        inviterName,
        `Hi! I'd like to connect with you on our social network.`,
        invitationId,
        false, // Don't use mailto fallback by default
        inviterAvatar || undefined,
        inviterId
      );

      let successMessage = '';
      if (emailResult.success) {
        if (emailResult.method === 'SES') {
          successMessage = `Invitation resent to ${originalInvitation.recipientEmail} via email.`;
        } else if (emailResult.method === 'mailto') {
          successMessage = `Email client opened for ${originalInvitation.recipientEmail}. Please send the email from your email client.`;
        }
      } else {
        return {
          success: false,
          message: `Failed to resend email invitation: ${emailResult.error}`,
          error: emailResult.error
        };
      }

      // Update the sent timestamp in localStorage
      const updatedInvitations = invitations.map(inv => 
        inv.id === invitationId 
          ? { ...inv, sentAt: new Date().toISOString(), messageId: emailResult.messageId }
          : inv
      );
      this.savePendingInvitations(updatedInvitations);

      // Update database if possible
      if (client.models?.Invitation) {
        try {
          await client.models.Invitation.update({
            id: invitationId,
            sentAt: new Date().toISOString()
          });
        } catch (dbError) {
          console.warn('Failed to update invitation timestamp in database:', dbError);
        }
      }

      return {
        success: true,
        message: successMessage
      };

    } catch (error: any) {
      console.error('Error resending invitation:', error);
      return {
        success: false,
        message: 'Failed to resend invitation',
        error: error.message
      };
    }
  }

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
   * Debug method to check client status
   */
  static debugClientStatus(): void {
    console.log('=== EmailInvitationService Debug ===');
    console.log('Client object:', client);
    console.log('Client.models:', client.models);
    console.log('Client.models.Invitation:', client.models?.Invitation);
    console.log('Available models:', Object.keys(client.models || {}));
    console.log('=== End Debug ===');
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
   * Check if invitation exists for email
   */
  static getInvitationByEmail(email: string): PendingInvitation | null {
    const invitations = this.getPendingInvitations();
    return invitations.find(inv => inv.recipientEmail === email) || null;
  }

  /**
   * Update invitation status locally
   */
  static updateInvitationStatus(invitationId: string, status: PendingInvitation['status']): void {
    const invitations = this.getPendingInvitations();
    const updatedInvitations = invitations.map(inv => 
      inv.id === invitationId 
        ? { ...inv, status }
        : inv
    );
    this.savePendingInvitations(updatedInvitations);
  }

  // ...existing code...

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
