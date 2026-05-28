import React, { useState, useEffect } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';
import {
  ClerkProvider,
  SignedIn,
  SignedOut,
  UserButton,
  useUser,
  SignIn,
  SignUp
} from '@clerk/clerk-react';
import { Toaster } from 'sonner';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import ClassDetail from './pages/ClassDetail';
import AttendanceScan from './pages/AttendanceScan';
import Onboarding from './components/Onboarding';
import SignInCallback from './pages/SignInCallback';
import { supabase } from './lib/supabase';
import { Profile, UserRole } from './types';
import { Loader2, AlertTriangle } from 'lucide-react';

// Access Clerk publishable key
const CLERK_PUBLISHABLE_KEY =
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY ||
  import.meta.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

function MissingClerkKey() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-4 text-center">
      <div className="mb-6 rounded-full bg-amber-100 p-4">
        <AlertTriangle className="h-12 w-12 text-amber-600" />
      </div>
      <h1 className="mb-2 text-2xl font-bold text-slate-900">Clerk Publishable Key Missing</h1>
      <p className="mb-8 max-w-md text-slate-600">
        To use authentication, you must provide a valid Clerk publishable key.
        Please add <strong>VITE_CLERK_PUBLISHABLE_KEY</strong> to your environment variables.
      </p>
    </div>
  );
}

function ProtectedRoute({ children, role }: { children: React.ReactNode, role?: UserRole }) {
  const { isLoaded, isSignedIn, user } = useUser();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProfile() {
      if (isLoaded && isSignedIn && user) {
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('clerk_id', user.id)
            .single();
          if (error || !data) {
            setLoading(false);
            return;
          }
          setProfile(data);
        } catch (err) {
          console.error('Error fetching profile:', err);
        } finally {
          setLoading(false);
        }
      } else if (isLoaded && !isSignedIn) {
        setLoading(false);
      }
    }
    fetchProfile();
  }, [isLoaded, isSignedIn, user]);

  if (!isLoaded || loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isSignedIn) {
    return <Navigate to="/sign-in" replace />;
  }

  if (role && profile && profile.role !== role) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

function App() {
  if (!CLERK_PUBLISHABLE_KEY || CLERK_PUBLISHABLE_KEY === 'pk_test_placeholder') {
    return <MissingClerkKey />;
  }

  return (
    <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY}>
      <Router>
        <div className="min-h-screen bg-background text-foreground">
          <Routes>
            <Route path="/" element={<Landing />} />

            {/* Clerk Authentication Routes */}
            <Route path="/sign-in/*" element={
              <div className="flex min-h-screen items-center justify-center p-4">
                <SignIn routing="path" path="/sign-in" />
              </div>
            } />

            <Route path="/sign-up/*" element={
              <div className="flex min-h-screen items-center justify-center p-4">
                <SignUp routing="path" path="/sign-up" />
              </div>
            } />

            {/* IMPORTANT: Clerk SSO Callback */}
            <Route path="/sign-in/sso-callback" element={<SignInCallback />} />

            {/* Onboarding */}
            <Route path="/onboarding" element={
              <ProtectedRoute>
                <Onboarding onComplete={() => window.location.href = '/dashboard'} />
              </ProtectedRoute>
            } />

            {/* Protected Routes */}
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />

            <Route path="/class/:classId" element={
              <ProtectedRoute>
                <ClassDetail />
              </ProtectedRoute>
            } />

            <Route path="/scan/:sessionId" element={
              <ProtectedRoute role="student">
                <AttendanceScan />
              </ProtectedRoute>
            } />

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>

          <Toaster position="top-center" richColors />
        </div>
      </Router>
    </ClerkProvider>
  );
}

export default App;
