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
  useSession,
  SignIn,
  SignUp
} from '@clerk/clerk-react';
import { ThemeProvider } from 'next-themes';
import { Toaster } from 'sonner';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import ClassDetail from './pages/ClassDetail';
import AttendanceScan from './pages/AttendanceScan';
import Onboarding from './components/Onboarding';
import SignInCallback from './pages/SignInCallback';
import AdminGate from './pages/AdminGate';
const AdminDashboard = React.lazy(() => import('./pages/AdminDashboard'));
import { createAuthenticatedSupabaseClient } from './lib/supabaseClient';
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

// requiresNoProfile: if true, redirect to /dashboard when profile already exists (used for /onboarding)
function ProtectedRoute({ children, role, requiresNoProfile }: { children: React.ReactNode, role?: UserRole, requiresNoProfile?: boolean }) {
  const { isLoaded, isSignedIn, user } = useUser();
  const { session, isLoaded: sessionLoaded } = useSession();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileChecked, setProfileChecked] = useState(false);

  useEffect(() => {
    // Wait until BOTH user and session are fully loaded before doing anything
    if (!isLoaded || !sessionLoaded) return;

    async function fetchProfile() {
      if (isSignedIn && user && session) {
        try {
          const supabase = createAuthenticatedSupabaseClient(
            async () => (await session.getToken()) ?? null
          );
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('clerk_id', user.id)
            .maybeSingle();
          if (error) {
            console.error('Error fetching profile:', error);
          }
          setProfile(data ?? null);
        } catch (err) {
          console.error('Error fetching profile:', err);
          setProfile(null);
        } finally {
          setProfileChecked(true);
        }
      } else if (!isSignedIn) {
        setProfileChecked(true);
      }
      // if isSignedIn but session is null, do nothing — wait for next effect run
    }

    fetchProfile();
  }, [isLoaded, sessionLoaded, isSignedIn, user, session]);

  if (!isLoaded || !profileChecked) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isSignedIn) {
    return <Navigate to="/sign-in" replace />;
  }

  // On /onboarding: if profile already exists, skip to dashboard
  if (requiresNoProfile && profile?.role) {
    return <Navigate to="/dashboard" replace />;
  }

  // On protected pages: if no profile yet, send to onboarding
  if (!requiresNoProfile && !profile?.role) {
    return <Navigate to="/onboarding" replace />;
  }

  // Role-based access control
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
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
    <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY}>
      <Router>
        <div className="min-h-screen bg-background text-foreground">
          <Routes>
            <Route path="/" element={<Landing />} />

            {/* Clerk Authentication Routes */}
            <Route path="/sign-in/*" element={
              <div className="flex min-h-screen items-center justify-center p-4">
                <SignIn
                  routing="path"
                  path="/sign-in"
                  afterSignInUrl="/dashboard"
                  afterSignUpUrl="/dashboard"
                />
              </div>
            } />

            <Route path="/sign-up/*" element={
              <div className="flex min-h-screen items-center justify-center p-4">
                <SignUp
                  routing="path"
                  path="/sign-up"
                  afterSignInUrl="/dashboard"
                  afterSignUpUrl="/dashboard"
                />
              </div>
            } />

            {/* Clerk SSO Callback - needed for BOTH sign-in and sign-up routing="path" flows */}
            <Route path="/sign-in/sso-callback" element={<SignInCallback />} />
            <Route path="/sign-up/sso-callback" element={<SignInCallback />} />

            {/* Onboarding — only for users who haven't picked a role yet */}
            <Route path="/onboarding" element={
              <ProtectedRoute requiresNoProfile>
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

            {/* Admin — hidden routes, no links anywhere */}
            <Route path="/admin" element={<AdminGate />} />
            <Route path="/admin/dashboard" element={
              <React.Suspense fallback={<div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
                <AdminDashboard />
              </React.Suspense>
            } />

            {/* Hidden Admin Routes — no links anywhere, access by URL only */}
            <Route path="/admin" element={<AdminGate />} />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
          </Routes>

          <Toaster position="top-center" richColors />
        </div>
      </Router>
    </ClerkProvider>
    </ThemeProvider>
  );
}

export default App;
