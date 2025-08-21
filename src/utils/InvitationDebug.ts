/**
 * Debug utility for invitation system
 */

export class InvitationDebug {
  static logAllInvitations() {
    console.log('=== INVITATION DEBUG ===');
    
    // Check localStorage
    const localInvitations = localStorage.getItem('pending_invitations');
    console.log('LocalStorage invitations:', localInvitations);
    
    if (localInvitations) {
      try {
        const parsed = JSON.parse(localInvitations);
        console.log('Parsed invitations:', parsed);
        console.log('Number of invitations:', parsed.length);
        parsed.forEach((inv: any, index: number) => {
          console.log(`Invitation ${index}:`, {
            id: inv.id,
            recipientEmail: inv.recipientEmail,
            status: inv.status,
            sentAt: inv.sentAt
          });
        });
      } catch (error) {
        console.error('Error parsing invitations:', error);
      }
    } else {
      console.log('No invitations found in localStorage');
    }
    
    console.log('========================');
  }
  
  static createTestInvitation(recipientEmail: string) {
    const testInvitation = {
      id: '175544947b407', // Use the ID from the URL
      recipientEmail,
      recipientName: recipientEmail.split('@')[0],
      inviteMessage: 'Test invitation for debugging',
      sentAt: new Date().toISOString(),
      status: 'pending',
      inviterId: 'test-user',
      inviterName: 'Test User',
      messageId: 'test-message-id'
    };
    
    const existingInvitations = JSON.parse(localStorage.getItem('pending_invitations') || '[]');
    const updatedInvitations = [...existingInvitations, testInvitation];
    localStorage.setItem('pending_invitations', JSON.stringify(updatedInvitations));
    
    console.log('Created test invitation:', testInvitation);
    return testInvitation;
  }
  
  static clearAllInvitations() {
    localStorage.removeItem('pending_invitations');
    console.log('Cleared all invitations from localStorage');
  }
}

// Make it available globally for debugging
(window as any).InvitationDebug = InvitationDebug;
