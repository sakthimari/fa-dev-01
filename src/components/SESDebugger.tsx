import React, { useState } from 'react';
import { EmailInvitationService } from '../services/EmailInvitationService';

const SESDebugger: React.FC = () => {
  const [debugInfo, setDebugInfo] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const runDebug = async () => {
    setIsLoading(true);
    console.clear();
    console.log('🔍 Running SES Debug...');
    
    // Debug configuration
    EmailInvitationService.debugSESConfig();
    
    // Debug AWS user
    await EmailInvitationService.debugAWSUser();
    
    // Try to send a test email to see the exact error
    try {
      console.log('🧪 Attempting to send test email...');
      const result = await EmailInvitationService.sendEmailNotification(
        'sakthimari@gmail.com', // Send to same email as sender for testing
        'Test User',
        'Debug Test',
        'This is a debug test to check SES configuration',
        'debug-123'
      );
      console.log('Test email result:', result);
      
      if (result.success) {
        setDebugInfo(`✅ SUCCESS! Email sent successfully from sakthimari@gmail.com\nMessage ID: ${result.messageId}\n\nCheck console for full details.`);
      } else {
        setDebugInfo(`❌ FAILED: ${result.error}\n\nThis means sakthimari@gmail.com is not verified in AWS SES.\nPlease verify it in AWS SES Console.\n\nFull result: ${JSON.stringify(result, null, 2)}`);
      }
    } catch (error) {
      console.error('Test email error:', error);
      setDebugInfo(`❌ ERROR: ${error}\n\nCheck console for full details.`);
    }
    
    setIsLoading(false);
  };

  const openSESConsole = () => {
    window.open('https://console.aws.amazon.com/ses/home?region=us-east-1#/verified-identities', '_blank');
  };

  return (
    <div style={{ padding: '20px', border: '2px solid #007bff', margin: '20px', borderRadius: '8px', backgroundColor: '#f8f9fa' }}>
      <h3 style={{ color: '#007bff', marginTop: 0 }}>🔧 SES Debug Tool</h3>
      
      <div style={{ marginBottom: '15px', padding: '10px', backgroundColor: '#fff3cd', border: '1px solid #ffeaa7', borderRadius: '4px' }}>
        <strong>Issue:</strong> User not authorized to send emails from sakthimari@gmail.com<br/>
        <strong>Solution:</strong> Verify sakthimari@gmail.com in AWS SES Console
      </div>
      
      <div style={{ marginBottom: '15px' }}>
        <button 
          onClick={runDebug} 
          disabled={isLoading}
          style={{ 
            padding: '10px 20px', 
            marginRight: '10px', 
            backgroundColor: '#007bff', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px',
            cursor: isLoading ? 'not-allowed' : 'pointer'
          }}
        >
          {isLoading ? '🔄 Testing...' : '🧪 Run Debug Test'}
        </button>
        
        <button 
          onClick={openSESConsole}
          style={{ 
            padding: '10px 20px', 
            backgroundColor: '#28a745', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          🔗 Open AWS SES Console
        </button>
      </div>
      
      {debugInfo && (
        <div style={{ 
          marginTop: '15px', 
          whiteSpace: 'pre-wrap', 
          backgroundColor: '#f8f9fa', 
          padding: '15px', 
          border: '1px solid #dee2e6',
          borderRadius: '4px',
          fontFamily: 'monospace',
          fontSize: '12px'
        }}>
          {debugInfo}
        </div>
      )}
      
      <div style={{ marginTop: '15px', fontSize: '12px', color: '#666' }}>
        📝 Check browser console (F12 → Console) for detailed logs<br/>
        📧 Sender email is hardcoded to: <strong>sakthimari@gmail.com</strong>
      </div>
    </div>
  );
};

export default SESDebugger;
