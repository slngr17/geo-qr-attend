import { AuthenticateWithRedirectCallback } from '@clerk/clerk-react';

const SignInCallback = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="text-center">
        <p className="text-xl">Completing your sign in...</p>
        <AuthenticateWithRedirectCallback
          signInFallbackRedirectUrl="/dashboard"
          signUpFallbackRedirectUrl="/dashboard"
          signInUrl="/sign-in"
          signUpUrl="/sign-up"
        />
      </div>
    </div>
  );
};

export default SignInCallback;
