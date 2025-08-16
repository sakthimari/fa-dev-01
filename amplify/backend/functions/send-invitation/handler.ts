import { SES, SendEmailCommand } from '@aws-sdk/client-ses';

const sesClient = new SES({ region: process.env.AWS_REGION || 'us-east-1' });

interface InvitationArgs {
  recipientEmail: string;
  inviteMessage?: string;
}

interface AppSyncIdentity {
  claims?: any;
  username?: string;
}

interface AppSyncEvent {
  arguments: InvitationArgs;
  identity?: AppSyncIdentity;
}

export const handler = async (event: AppSyncEvent): Promise<string> => {
  try {
    const { recipientEmail, inviteMessage } = event.arguments;
    
    // Get sender information from the context
    let senderEmail = 'noreply@example.com';
    let senderName = 'Your friend';
    
    // Handle different identity types
    if (event.identity) {
      if ('claims' in event.identity) {
        const claims = event.identity.claims as any;
        senderEmail = claims?.email || 'noreply@example.com';
        senderName = claims?.name || 
                    claims?.['cognito:username'] || 
                    claims?.email || 
                    'Your friend';
      } else if ('username' in event.identity) {
        senderName = (event.identity as any).username || 'Your friend';
      }
    }

    if (!recipientEmail) {
      throw new Error('recipientEmail is required');
    }

    // Email configuration
    const params = {
      Source: process.env.SES_FROM_EMAIL || 'sakthimari@gmail.com',
      Destination: {
        ToAddresses: [recipientEmail],
      },
      Message: {
        Subject: {
          Data: `${senderName} invited you to join our social platform`,
          Charset: 'UTF-8',
        },
        Body: {
          Html: {
            Data: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background-color: #f8f9fa; padding: 30px; border-radius: 10px; text-align: center;">
                  <h1 style="color: #333; margin-bottom: 20px;">You're Invited!</h1>
                  <p style="font-size: 18px; color: #666; margin-bottom: 30px;">
                    <strong>${senderName}</strong> has invited you to join our social platform
                  </p>
                  ${inviteMessage ? `
                    <div style="background-color: #fff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #007bff;">
                      <p style="margin: 0; font-style: italic; color: #333;">
                        "${inviteMessage}"
                      </p>
                    </div>
                  ` : ''}
                  <div style="margin: 30px 0;">
                    <a href="${process.env.APP_URL || 'http://localhost:5173'}" 
                       style="background-color: #007bff; color: white; padding: 15px 30px; 
                              text-decoration: none; border-radius: 5px; font-weight: bold; 
                              display: inline-block;">
                      Join Now
                    </a>
                  </div>
                  <p style="font-size: 14px; color: #888; margin-top: 30px;">
                    Connect with friends, share moments, and discover new content!
                  </p>
                </div>
              </div>
            `,
            Charset: 'UTF-8',
          },
          Text: {
            Data: `
${senderName} has invited you to join our social platform!

${inviteMessage ? `Personal message: "${inviteMessage}"` : ''}

Join now at: ${process.env.APP_URL || 'http://localhost:5173'}

Connect with friends, share moments, and discover new content!
            `,
            Charset: 'UTF-8',
          },
        },
      },
    };

    console.log('Attempting to send email...');
    console.log('From:', process.env.SES_FROM_EMAIL || 'sakthimari@gmail.com');
    console.log('To:', recipientEmail);
    console.log('Region:', process.env.AWS_REGION || 'us-east-1');

    const command = new SendEmailCommand(params);
    const result = await sesClient.send(command);

    console.log('Email sent successfully!');
    console.log('MessageId:', result.MessageId);
    console.log('SES Response:', result);

    return JSON.stringify({ 
      success: true, 
      message: 'Invitation sent successfully',
      messageId: result.MessageId 
    });

  } catch (error: any) {
    console.error('Detailed error information:');
    console.error('Error name:', error?.name);
    console.error('Error message:', error?.message);
    console.error('Error code:', error?.code);
    console.error('Full error:', JSON.stringify(error, null, 2));
    
    // Check if it's an SES permission error
    if (error?.code === 'AccessDenied' || error?.code === 'UnauthorizedOperation') {
      console.error('SES Permission Error: Lambda function may not have SES permissions');
    }
    
    return JSON.stringify({ 
      success: false,
      error: 'Failed to send invitation',
      details: error instanceof Error ? error.message : 'Unknown error',
      errorCode: error?.code || 'UNKNOWN'
    });
  }
}
