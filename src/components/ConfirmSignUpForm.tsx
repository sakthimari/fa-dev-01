import React, { useState } from 'react';
import { Auth } from 'aws-amplify';

interface ConfirmSignUpFormProps {
  email: string;
  onSuccess: () => void;
}

const ConfirmSignUpForm: React.FC<ConfirmSignUpFormProps> = ({ email, onSuccess }) => {
  const [confirmationCode, setConfirmationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleConfirmSignUp = async () => {
    setLoading(true);
    setError('');
    try {
      await Auth.confirmSignUp(email, confirmationCode);
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to confirm sign-up. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="confirm-signup-form">
      <h3>Confirm Your Email</h3>
      <p>Enter the confirmation code sent to your email: {email}</p>
      {error && <div className="error-message">{error}</div>}
      <input
        type="text"
        placeholder="Confirmation Code"
        value={confirmationCode}
        onChange={(e) => setConfirmationCode(e.target.value)}
      />
      <button onClick={handleConfirmSignUp} disabled={loading}>
        {loading ? 'Confirming...' : 'Confirm'}
      </button>
    </div>
  );
};

export default ConfirmSignUpForm;
