import { useEffect } from 'react';
import { useClerk } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';

const SignInCallback = () => {
  const { handleRedirectCallback } = useClerk();
  const navigate = useNavigate();

  useEffect(() => {
    handleRedirectCallback()
      .then(() => {
        navigate('/onboarding', { replace: true });
      })
      .catch((error) => {
        console.error('Callback error:', error);
        navigate('/sign-in', { replace: true });
      });
  }, [handleRedirectCallback, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="text-center">
        <p className="text-xl">Completing your sign in...</p>
      </div>
    </div>
  );
};

export default SignInCallback;
