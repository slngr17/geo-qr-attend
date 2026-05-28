import { useEffect } from 'react';
import { useClerk, useUser } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';

const SignInCallback = () => {
  const { handleRedirectCallback } = useClerk();
  const navigate = useNavigate();

  useEffect(() => {
    const completeSignIn = async () => {
      try {
        await handleRedirectCallback();
        // After successful callback, go to onboarding
        navigate('/onboarding', { replace: true });
      } catch (error) {
        console.error('Callback error:', error);
        navigate('/sign-in', { replace: true });
      }
    };

    completeSignIn();
  }, [handleRedirectCallback, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="text-center">
        <p className="text-lg">Completing sign in...</p>
        <p className="text-sm text-gray-500 mt-2">Please wait a moment</p>
      </div>
    </div>
  );
};

export default SignInCallback;
